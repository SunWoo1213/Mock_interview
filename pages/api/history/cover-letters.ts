/**
 * 사용자의 자기소개서 히스토리 API
 * GET /api/history/cover-letters
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
    // 자기소개서 목록 조회 (피드백 포함)
    const result = await query(
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

    const coverLetters = result.rows.map((row) => ({
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

    res.status(200).json({
      coverLetters,
      total: coverLetters.length,
    });
  } catch (error) {
    console.error('자기소개서 히스토리 조회 에러:', error);
    throw error;
  }
}

export default withErrorHandler(withAuth(handler));


