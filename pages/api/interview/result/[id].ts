/**
 * 면접 결과 조회 API
 * GET /api/interview/result/[id]
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';
import { refreshPresignedUrl } from '@/lib/s3';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userId = req.user!.userId;
  const id = req.query?.id as string;

  console.log(`📊 [면접 결과 조회] User: ${userId}, Session: ${id}`);

  // 세션 조회
  const sessionResult = await query(
    `SELECT id, status, final_feedback_json, started_at, completed_at, total_questions
     FROM interview_sessions 
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (sessionResult.rows.length === 0) {
    console.error(`❌ 면접 세션을 찾을 수 없음: Session ${id}`);
    res.status(404).json({ error: '면접 세션을 찾을 수 없습니다.' });
    return;
  }

  const session = sessionResult.rows[0];

  console.log(`📊 세션 상태: ${session.status}`);
  console.log(`📊 완료 시각: ${session.completed_at}`);
  console.log(`📊 피드백 존재: ${session.final_feedback_json ? '있음' : '없음'}`);

  // 모든 턴 조회 (답변 및 피드백 포함)
  const turnsResult = await query(
    `SELECT 
      turn_number, question_text, question_audio_s3_url,
      user_answer_text, user_answer_audio_s3_url,
      feedback_text
     FROM interview_turns 
     WHERE session_id = $1 
     ORDER BY turn_number`,
    [id]
  );

  const answeredTurns = turnsResult.rows.filter((t: any) => t.user_answer_text);
  console.log(`📊 답변된 질문 수: ${answeredTurns.length} / ${turnsResult.rows.length}`);

  // 상태 검증: completed가 아닌 경우 상세 로깅
  if (session.status !== 'completed') {
    console.error(`❌ 면접이 완료되지 않음`);
    console.error(`   상태: ${session.status}`);
    console.error(`   총 질문: ${turnsResult.rows.length}`);
    console.error(`   답변 완료: ${answeredTurns.length}`);
    
    res.status(400).json({ 
      error: '아직 완료되지 않은 면접입니다.',
      debug: {
        status: session.status,
        totalQuestions: turnsResult.rows.length,
        answeredQuestions: answeredTurns.length,
        message: '면접이 "completed" 상태가 아닙니다. 면접을 완료하거나 "면접 종료 및 결과 보기" 버튼을 눌러주세요.'
      }
    });
    return;
  }

  // 피드백이 없는 경우 경고 (하지만 정상 응답)
  if (!session.final_feedback_json) {
    console.warn(`⚠️ 면접이 완료되었지만 피드백이 없음: Session ${id}`);
  }

  console.log(`✅ 면접 결과 조회 성공`);

  // 저장된 Presigned URL은 24시간 뒤 만료되므로 조회 시점에 다시 서명한다.
  const turns = await Promise.all(
    turnsResult.rows.map(async (t: any) => ({
      ...t,
      question_audio_s3_url: await refreshPresignedUrl(t.question_audio_s3_url),
      user_answer_audio_s3_url: await refreshPresignedUrl(t.user_answer_audio_s3_url),
    }))
  );

  res.status(200).json({
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      finalFeedback: session.final_feedback_json,
    },
    turns,
  });
}

const getInterviewResultHandler = withErrorHandler(withAuth(handler));

export default getInterviewResultHandler;

