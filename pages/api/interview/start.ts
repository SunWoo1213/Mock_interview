/**
 * 면접 시작 API
 * POST /api/interview/start
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { generateInterviewQuestion, textToSpeech } from '@/lib/openai';
import { uploadToS3 } from '@/lib/s3';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

// OpenAI TTS 목소리 목록
const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

/**
 * 배열에서 랜덤 요소 선택
 */
function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user!.userId;
  const { coverLetterId } = req.body;

  if (!coverLetterId) {
    return res.status(400).json({ error: 'coverLetterId가 필요합니다.' });
  }

  // 자소서 및 관련 정보 조회 (채용공고 원문 포함)
  const coverLetterResult = await query(
    `SELECT 
      cl.id, cl.content_text, cl.job_posting_id,
      jp.title, jp.company_name, jp.extracted_text, jp.analysis_json
     FROM cover_letters cl
     LEFT JOIN job_postings jp ON cl.job_posting_id = jp.id
     WHERE cl.id = $1 AND cl.user_id = $2`,
    [coverLetterId, userId]
  );

  if (coverLetterResult.rows.length === 0) {
    return res.status(404).json({ error: '자기소개서를 찾을 수 없습니다.' });
  }

  const coverLetter = coverLetterResult.rows[0];

  // 사용자 프로필 조회 (모든 필드 포함)
  const profileResult = await query(
    `SELECT age, gender, current_job, career_summary, certifications,
            career_json, education_json, certificates_json, skills_json
     FROM user_profiles WHERE user_id = $1`,
    [userId]
  );

  const userProfile = profileResult.rows[0] || {};

  // 랜덤으로 면접관 목소리 선택
  const selectedVoice = randomChoice(TTS_VOICES);
  console.log(`🎤 [Interview Start] 랜덤 선택된 면접관 목소리: ${selectedVoice}`);

  // 면접 세션 생성 (voice 포함)
  const sessionResult = await query(
    `INSERT INTO interview_sessions 
     (user_id, cover_letter_id, job_posting_id, voice, status, started_at) 
     VALUES ($1, $2, $3, $4, 'in_progress', NOW()) 
     RETURNING id`,
    [userId, coverLetterId, coverLetter.job_posting_id, selectedVoice]
  );

  const sessionId = sessionResult.rows[0].id;

  // 첫 번째 질문 생성 (전체 컨텍스트 전달)
  const context = {
    userProfile,
    jobPosting: {
      title: coverLetter.title,
      company_name: coverLetter.company_name,
      extracted_text: coverLetter.extracted_text,
      analysis_json: coverLetter.analysis_json,
    },
    coverLetter: coverLetter.content_text,
    conversationHistory: [],
  };

  const questionText = await generateInterviewQuestion(context, 1, 5);

  // TTS로 음성 생성 (선택된 voice 사용)
  const audioBuffer = await textToSpeech(questionText, selectedVoice);

  // S3에 음성 업로드
  const questionAudioUrl = await uploadToS3({
    folder: 'interview-questions',
    fileName: `session_${sessionId}_q1.mp3`,
    contentType: 'audio/mpeg',
    buffer: audioBuffer,
  });

  // 첫 번째 턴 저장
  await query(
    `INSERT INTO interview_turns 
     (session_id, turn_number, question_text, question_audio_s3_url) 
     VALUES ($1, 1, $2, $3)`,
    [sessionId, questionText, questionAudioUrl]
  );

  return res.status(201).json({
    message: '면접이 시작되었습니다.',
    sessionId,
    turnNumber: 1,
    questionText,
    questionAudioUrl,
  });
}

const startInterviewHandler = withErrorHandler(withAuth(handler));

export default startInterviewHandler;

