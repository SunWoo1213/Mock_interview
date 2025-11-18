/**
 * 면접 조기 종료 API
 * POST /api/interview/[id]/finish
 * 
 * 5번째 질문 전이라도 사용자가 면접을 종료하고 피드백을 받을 수 있도록 합니다.
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { generateFinalInterviewFeedback } from '@/lib/openai';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userId = req.user!.userId;
  const sessionId = req.query?.id as string;

  console.log(`🔚 [면접 조기 종료 요청] User: ${userId}, Session: ${sessionId}`);

  // 세션 검증
  const sessionResult = await query(
    `SELECT id, cover_letter_id, job_posting_id, status 
     FROM interview_sessions 
     WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  if (sessionResult.rows.length === 0) {
    res.status(404).json({ error: '면접 세션을 찾을 수 없습니다.' });
    return;
  }

  const session = sessionResult.rows[0];

  // 이미 완료된 면접인지 확인
  if (session.status === 'completed') {
    res.status(400).json({ error: '이미 완료된 면접입니다.' });
    return;
  }

  // 진행 중인 면접이 아니면 에러
  if (session.status !== 'in_progress') {
    res.status(400).json({ error: '진행 중인 면접이 아닙니다.' });
    return;
  }

  // 모든 턴 조회 (답변이 있는 것만)
  const turnsResult = await query(
    `SELECT turn_number, question_text, user_answer_text 
     FROM interview_turns 
     WHERE session_id = $1 AND user_answer_text IS NOT NULL
     ORDER BY turn_number`,
    [sessionId]
  );

  const turns = turnsResult.rows;

  // 답변이 하나도 없으면 면접을 종료할 수 없음
  if (turns.length === 0) {
    res.status(400).json({ 
      error: '답변이 하나도 없어 면접을 종료할 수 없습니다. 최소 1개 이상의 질문에 답변해주세요.' 
    });
    return;
  }

  console.log(`📊 답변된 질문 수: ${turns.length}`);

  // 관련 정보 조회 (컨텍스트 생성)
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
    conversationHistory: turns.map((t: any) => ({
      question: t.question_text,
      answer: t.user_answer_text,
    })),
  };

  console.log('🤖 AI 피드백 생성 시작 (조기 종료 모드)...');

  // 최종 피드백 생성 (isEarlyFinish = true)
  const finalFeedback = await generateFinalInterviewFeedback(context, turns, true);

  console.log('✅ AI 피드백 생성 완료');
  console.log(`📝 총 ${finalFeedback.total_questions_answered}개 질문에 대한 피드백 생성됨`);

  // 세션 완료 처리
  await query(
    `UPDATE interview_sessions 
     SET status = 'completed', final_feedback_json = $1, completed_at = NOW() 
     WHERE id = $2`,
    [JSON.stringify(finalFeedback), sessionId]
  );

  console.log('✅ 면접 세션 완료 처리됨');

  res.status(200).json({
    message: '면접이 조기 종료되었습니다. 피드백이 생성되었습니다.',
    isCompleted: true,
    isEarlyFinish: true,
    sessionId: parseInt(sessionId),
    totalQuestionsAnswered: turns.length,
  });
}

export default withErrorHandler(withAuth(handler));

