/**
 * 단일 공고 조회 및 삭제 API
 * GET /api/job-postings/[id] - 특정 공고 조회
 * DELETE /api/job-postings/[id] - 특정 공고 삭제
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user!.userId;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID가 필요합니다.' });
  }

  const jobPostingId = parseInt(id, 10);

  if (isNaN(jobPostingId)) {
    return res.status(400).json({ error: '유효하지 않은 ID입니다.' });
  }

  try {
    if (req.method === 'GET') {
      // 공고 조회
      const result = await query(
        `SELECT 
          id,
          title,
          company_name,
          original_s3_url,
          extracted_text,
          analysis_json,
          status,
          created_at,
          updated_at
         FROM job_postings
         WHERE id = $1 AND user_id = $2`,
        [jobPostingId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '공고를 찾을 수 없습니다.' });
      }

      const row = result.rows[0];
      const jobPosting = {
        id: row.id,
        title: row.title,
        companyName: row.company_name,
        originalS3Url: row.original_s3_url,
        extractedText: row.extracted_text,
        analysisJson: row.analysis_json,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return res.status(200).json({ jobPosting });

    } else if (req.method === 'DELETE') {
      // 공고 삭제 (CASCADE로 연관된 자소서도 처리됨)
      const deleteResult = await query(
        'DELETE FROM job_postings WHERE id = $1 AND user_id = $2 RETURNING id',
        [jobPostingId, userId]
      );

      if (deleteResult.rows.length === 0) {
        return res.status(404).json({ error: '공고를 찾을 수 없거나 삭제 권한이 없습니다.' });
      }

      return res.status(200).json({
        message: '공고가 성공적으로 삭제되었습니다.',
        id: jobPostingId,
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('공고 처리 에러:', error);
    return res.status(500).json({ error: '공고 처리에 실패했습니다.' });
  }
}

export default withErrorHandler(withAuth(handler));

