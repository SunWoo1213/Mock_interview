/**
 * 공고 히스토리 조회 API
 * GET /api/job-postings/history
 * 로그인한 사용자의 모든 공고 분석 기록을 최신순으로 반환
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user!.userId;

  try {
    const result = await query(
      `SELECT 
        id,
        title,
        company_name,
        extracted_text,
        analysis_json,
        status,
        created_at,
        updated_at
       FROM job_postings
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const jobPostings = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      companyName: row.company_name,
      extractedText: row.extracted_text,
      analysisJson: row.analysis_json,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json({
      jobPostings,
      total: jobPostings.length,
    });
  } catch (error) {
    console.error('공고 히스토리 조회 에러:', error);
    return res.status(500).json({ error: '공고 히스토리 조회에 실패했습니다.' });
  }
}

export default withErrorHandler(withAuth(handler));

