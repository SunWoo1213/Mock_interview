/**
 * 면접 답변 제출 API
 * POST /api/interview/answer
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { generateInterviewQuestion, textToSpeech, speechToText, generateFinalInterviewFeedback } from '@/lib/openai';
import { uploadToS3 } from '@/lib/s3';
import { withAuth, withErrorHandler, AuthenticatedRequest, parseFormData } from '@/lib/middleware';
import fs from 'fs';

// Next.js body parser 비활성화
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user!.userId;

  // 멀티파트 폼 데이터 파싱
  const { fields, files } = await parseFormData(req);

  const sessionId = parseInt(Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId);
  const turnNumber = parseInt(Array.isArray(fields.turnNumber) ? fields.turnNumber[0] : fields.turnNumber);
  const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

  if (!sessionId || !turnNumber || !audioFile) {
    return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
  }

  // 세션 검증
  const sessionResult = await query(
    'SELECT id, cover_letter_id, job_posting_id, status FROM interview_sessions WHERE id = $1 AND user_id = $2',
    [sessionId, userId]
  );

  if (sessionResult.rows.length === 0) {
    return res.status(404).json({ error: '면접 세션을 찾을 수 없습니다.' });
  }

  const session = sessionResult.rows[0];

  if (session.status !== 'in_progress') {
    return res.status(400).json({ error: '진행 중인 면접이 아닙니다.' });
  }

  // 오디오 파일 읽기
  const audioBuffer = fs.readFileSync(audioFile.filepath);

  // S3에 사용자 답변 오디오 업로드
  const answerAudioUrl = await uploadToS3({
    folder: 'user-answers',
    fileName: `session_${sessionId}_turn_${turnNumber}.webm`,
    contentType: audioFile.mimetype || 'audio/webm',
    buffer: audioBuffer,
  });

  // STT로 답변 텍스트 변환
  const answerText = await speechToText(audioBuffer, `answer_${sessionId}_${turnNumber}.webm`);

  // 현재 턴 업데이트
  await query(
    `UPDATE interview_turns 
     SET user_answer_text = $1, user_answer_audio_s3_url = $2 
     WHERE session_id = $3 AND turn_number = $4`,
    [answerText, answerAudioUrl, sessionId, turnNumber]
  );

  // 마지막 질문인지 확인
  const totalQuestions = 5;
  const isLastQuestion = turnNumber >= totalQuestions;

  console.log(`📊 현재 턴: ${turnNumber} / ${totalQuestions}`);
  console.log(`📊 마지막 질문 여부: ${isLastQuestion}`);

  if (isLastQuestion) {
    console.log(`🏁 [면접 완료] 5번째 질문 답변 완료, 피드백 생성 시작...`);
    
    // 최종 피드백 생성
    // 모든 턴 조회
    const turnsResult = await query(
      `SELECT turn_number, question_text, user_answer_text 
       FROM interview_turns 
       WHERE session_id = $1 
       ORDER BY turn_number`,
      [sessionId]
    );

    console.log(`📊 총 턴 수: ${turnsResult.rows.length}`);

    // 관련 정보 조회 (전체 컨텍스트)
    const coverLetterResult = await query(
      `SELECT cl.content_text, jp.title, jp.company_name, jp.extracted_text, jp.analysis_json
       FROM cover_letters cl
       LEFT JOIN job_postings jp ON cl.job_posting_id = jp.id
       WHERE cl.id = $1`,
      [session.cover_letter_id]
    );

    const profileResult = await query(
      `SELECT age, gender, current_job, career_summary, certifications,
              career_json, education_json, certificates_json, skills_json
       FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    const coverLetter = coverLetterResult.rows[0];
    const userProfile = profileResult.rows[0] || {};

    const context = {
      userProfile,
      jobPosting: {
        title: coverLetter.title,
        company_name: coverLetter.company_name,
        extracted_text: coverLetter.extracted_text,
        analysis_json: coverLetter.analysis_json,
      },
      coverLetter: coverLetter.content_text,
      conversationHistory: turnsResult.rows.map((t: any) => ({
        question: t.question_text,
        answer: t.user_answer_text,
      })),
    };

    console.log(`🤖 AI 피드백 생성 시작 (정상 완료 모드)...`);
    const finalFeedback = await generateFinalInterviewFeedback(context, turnsResult.rows, false);
    console.log(`✅ AI 피드백 생성 완료`);

    // 세션 완료 처리
    console.log(`💾 세션 상태를 'completed'로 업데이트 중...`);
    const updateResult = await query(
      `UPDATE interview_sessions 
       SET status = 'completed', final_feedback_json = $1, completed_at = NOW() 
       WHERE id = $2
       RETURNING id, status`,
      [JSON.stringify(finalFeedback), sessionId]
    );

    console.log(`✅ 세션 업데이트 완료:`, updateResult.rows[0]);

    // 각 턴별 피드백을 InterviewTurn 레코드에 업데이트
    console.log('📝 턴별 피드백 업데이트 시작...');
    for (const turnFeedback of finalFeedback.per_turn_feedback) {
      const feedbackData = {
        user_answer_summary: turnFeedback.user_answer_summary,
        strengths: turnFeedback.strengths,
        improvements: turnFeedback.improvements,
        better_answer_example: turnFeedback.better_answer_example,
      };

      await query(
        `UPDATE interview_turns 
         SET feedback_text = $1 
         WHERE session_id = $2 AND turn_number = $3`,
        [JSON.stringify(feedbackData), sessionId, turnFeedback.turn_number]
      );
      
      console.log(`  ✅ Turn ${turnFeedback.turn_number} 피드백 저장됨`);
    }

    console.log('✅ 모든 턴별 피드백 업데이트 완료');
    console.log(`🎉 면접 완료 처리 성공! Session ${sessionId}`);

    res.status(200).json({
      message: '면접이 완료되었습니다.',
      isCompleted: true,
      sessionId,
    });
    return;
  }

  // 다음 질문 생성
  const turnsResult = await query(
    `SELECT question_text, user_answer_text 
     FROM interview_turns 
     WHERE session_id = $1 
     ORDER BY turn_number`,
    [sessionId]
  );

  const conversationHistory = turnsResult.rows.map((t: any) => ({
    question: t.question_text,
    answer: t.user_answer_text,
  }));

  const coverLetterResult = await query(
    `SELECT cl.content_text, jp.title, jp.company_name, jp.extracted_text, jp.analysis_json
     FROM cover_letters cl
     LEFT JOIN job_postings jp ON cl.job_posting_id = jp.id
     WHERE cl.id = $1`,
    [session.cover_letter_id]
  );

  const profileResult = await query(
    `SELECT age, gender, current_job, career_summary, certifications,
            career_json, education_json, certificates_json, skills_json
     FROM user_profiles WHERE user_id = $1`,
    [userId]
  );

  const coverLetter = coverLetterResult.rows[0];
  const userProfile = profileResult.rows[0] || {};

  const context = {
    userProfile,
    jobPosting: {
      title: coverLetter.title,
      company_name: coverLetter.company_name,
      extracted_text: coverLetter.extracted_text,
      analysis_json: coverLetter.analysis_json,
    },
    coverLetter: coverLetter.content_text,
    conversationHistory,
  };

  const nextTurnNumber = turnNumber + 1;
  const nextQuestionText = await generateInterviewQuestion(context, nextTurnNumber, totalQuestions);

  // TTS로 음성 생성
  const audioBuffer2 = await textToSpeech(nextQuestionText);

  // S3에 음성 업로드
  const nextQuestionAudioUrl = await uploadToS3({
    folder: 'interview-questions',
    fileName: `session_${sessionId}_q${nextTurnNumber}.mp3`,
    contentType: 'audio/mpeg',
    buffer: audioBuffer2,
  });

  // 다음 턴 저장
  await query(
    `INSERT INTO interview_turns 
     (session_id, turn_number, question_text, question_audio_s3_url) 
     VALUES ($1, $2, $3, $4)`,
    [sessionId, nextTurnNumber, nextQuestionText, nextQuestionAudioUrl]
  );

  return res.status(200).json({
    message: '답변이 제출되었습니다.',
    isCompleted: false,
    sessionId,
    turnNumber: nextTurnNumber,
    questionText: nextQuestionText,
    questionAudioUrl: nextQuestionAudioUrl,
  });
}

const submitAnswerHandler = withErrorHandler(withAuth(handler));

export default submitAnswerHandler;

