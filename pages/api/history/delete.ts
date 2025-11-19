/**
 * 히스토리 항목 삭제 API
 * DELETE /api/history/delete
 * 
 * 사용자의 면접 세션 또는 자기소개서를 영구적으로 삭제합니다.
 */
import { NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { withAuth, withErrorHandler, AuthenticatedRequest } from '@/lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userId = req.user!.userId;
  const { id, type } = req.body;

  // 입력 유효성 검사
  if (!id || !type) {
    res.status(400).json({ error: 'id와 type이 필요합니다.' });
    return;
  }

  if (type !== 'interview' && type !== 'cover_letter') {
    res.status(400).json({ error: 'type은 "interview" 또는 "cover_letter"여야 합니다.' });
    return;
  }

  try {
    if (type === 'interview') {
      // 면접 세션 삭제
      // 1. 먼저 해당 세션이 현재 사용자의 것인지 확인
      const checkResult = await query(
        'SELECT id FROM interview_sessions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        res.status(404).json({ error: '해당 면접을 찾을 수 없거나 권한이 없습니다.' });
        return;
      }

      // 2. 삭제 (CASCADE로 interview_turns도 함께 삭제됨)
      await query(
        'DELETE FROM interview_sessions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      res.status(200).json({ 
        message: '면접이 삭제되었습니다.',
        deletedId: id,
        type: 'interview'
      });

    } else if (type === 'cover_letter') {
      // 자기소개서 삭제
      // 1. 먼저 해당 자기소개서가 현재 사용자의 것인지 확인
      const checkResult = await query(
        'SELECT id FROM cover_letters WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        res.status(404).json({ error: '해당 자기소개서를 찾을 수 없거나 권한이 없습니다.' });
        return;
      }

      // 2. 삭제 (CASCADE로 cover_letter_feedbacks도 함께 삭제됨)
      await query(
        'DELETE FROM cover_letters WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      res.status(200).json({ 
        message: '자기소개서가 삭제되었습니다.',
        deletedId: id,
        type: 'cover_letter'
      });
    }

  } catch (error) {
    console.error('히스토리 삭제 에러:', error);
    throw new Error('삭제 중 오류가 발생했습니다.');
  }
}

export default withErrorHandler(withAuth(handler));

