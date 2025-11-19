/**
 * 채용 공고 텍스트 직접 제출 API
 * POST /api/job-postings/submit-text
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user!.userId;
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: '채용 공고 텍스트가 필요합니다.' });
  }

  const trimmedText = text.trim();

  if (trimmedText.length < 50) {
    return res.status(400).json({ error: '채용 공고 내용이 너무 짧습니다. 최소 50자 이상 입력해주세요.' });
  }

  if (trimmedText.length > 50000) {
    return res.status(400).json({ error: '채용 공고 내용이 너무 깁니다. 최대 50,000자까지 입력 가능합니다.' });
  }

  // DB에 저장 (original_s3_url은 null, extracted_text에 직접 입력한 텍스트 저장)
  const result = await query(
    `INSERT INTO job_postings 
     (user_id, original_s3_url, extracted_text, status) 
     VALUES ($1, $2, $3, 'pending') 
     RETURNING id`,
    [userId, null, trimmedText]
  );

  const jobPostingId = result.rows[0].id;

  return res.status(201).json({
    message: '공고가 등록되었습니다. 분석을 진행해주세요.',
    jobPostingId,
    extractedText: trimmedText,
  });
}

const submitTextHandler = withErrorHandler(withAuth(handler));

export default submitTextHandler;


