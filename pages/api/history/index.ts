/**
 * 통합 히스토리 API
 * GET /api/history
 * 
 * 사용자의 모의 면접 세션과 자기소개서 히스토리를 한 번에 반환합니다.
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userId = req.user!.userId;

  try {
    // 1. 면접 세션 조회 (최신순)
    const interviewsResult = await query(
      `SELECT 
        iss.id,
        iss.status,
        iss.total_questions,
        iss.started_at,
        iss.completed_at,
        iss.created_at,
        jp.id as job_posting_id,
        jp.title as job_title,
        jp.company_name,
        cl.id as cover_letter_id,
        (SELECT COUNT(*) FROM interview_turns it WHERE it.session_id = iss.id AND it.user_answer_text IS NOT NULL) as answered_questions
      FROM interview_sessions iss
      LEFT JOIN job_postings jp ON iss.job_posting_id = jp.id
      LEFT JOIN cover_letters cl ON iss.cover_letter_id = cl.id
      WHERE iss.user_id = $1
      ORDER BY iss.created_at DESC`,
      [userId]
    );

    // 2. 자기소개서 조회 (최신순)
    const coverLettersResult = await query(
      `SELECT 
        cl.id,
        cl.content_text,
        cl.created_at,
        cl.updated_at,
        jp.id as job_posting_id,
        jp.title as job_title,
        jp.company_name,
        (SELECT COUNT(*) FROM cover_letter_feedbacks clf WHERE clf.cover_letter_id = cl.id) as feedback_count,
        (SELECT created_at FROM cover_letter_feedbacks clf WHERE clf.cover_letter_id = cl.id ORDER BY created_at DESC LIMIT 1) as last_feedback_date
      FROM cover_letters cl
      LEFT JOIN job_postings jp ON cl.job_posting_id = jp.id
      WHERE cl.user_id = $1
      ORDER BY cl.created_at DESC`,
      [userId]
    );

    // 3. 데이터 포맷팅
    const interviews = interviewsResult.rows.map((row) => ({
      id: row.id,
      status: row.status,
      totalQuestions: row.total_questions,
      answeredQuestions: parseInt(row.answered_questions) || 0,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      jobPosting: row.job_posting_id ? {
        id: row.job_posting_id,
        title: row.job_title,
        companyName: row.company_name,
      } : null,
      coverLetterId: row.cover_letter_id,
      statusLabel: getStatusLabel(row.status, row.completed_at),
    }));

    const coverLetters = coverLettersResult.rows.map((row) => ({
      id: row.id,
      contentPreview: row.content_text.substring(0, 150) + (row.content_text.length > 150 ? '...' : ''),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      jobPosting: row.job_posting_id ? {
        id: row.job_posting_id,
        title: row.job_title,
        companyName: row.company_name,
      } : null,
      feedbackCount: parseInt(row.feedback_count) || 0,
      lastFeedbackDate: row.last_feedback_date,
      status: parseInt(row.feedback_count) > 0 ? 'Feedback Complete' : 'No Feedback',
    }));

    // 4. 통합 응답
    res.status(200).json({
      interviews,
      coverLetters,
    });
  } catch (error) {
    console.error('히스토리 조회 에러:', error);
    throw error;
  }
}

/**
 * 면접 상태 레이블 생성
 */
function getStatusLabel(status: string, completedAt: string | null): string {
  if (status === 'completed' && completedAt) {
    return '완료';
  } else if (status === 'in_progress') {
    return '진행 중';
  } else if (status === 'cancelled') {
    return '취소됨';
  } else {
    return '대기 중';
  }
}

export default withErrorHandler(withAuth(handler));

