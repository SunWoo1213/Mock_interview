/**
 * 사용자의 면접 세션 히스토리 API
 * GET /api/history/interviews
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
    // 면접 세션 목록 조회
    const result = await query(
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
        (SELECT COUNT(*) FROM interview_turns it WHERE it.session_id = iss.id) as answered_questions
      FROM interview_sessions iss
      LEFT JOIN job_postings jp ON iss.job_posting_id = jp.id
      LEFT JOIN cover_letters cl ON iss.cover_letter_id = cl.id
      WHERE iss.user_id = $1
      ORDER BY iss.created_at DESC`,
      [userId]
    );

    const interviews = result.rows.map((row) => ({
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

    res.status(200).json({
      interviews,
      total: interviews.length,
    });
  } catch (error) {
    console.error('면접 히스토리 조회 에러:', error);
    throw error;
  }
}

function getStatusLabel(status: string, completedAt: string | null): string {
  if (status === 'completed' && completedAt) {
    return 'Interview Complete';
  } else if (status === 'in_progress') {
    return 'In Progress';
  } else if (status === 'cancelled') {
    return 'Cancelled';
  } else {
    return 'Pending';
  }
}

export default withErrorHandler(withAuth(handler));


