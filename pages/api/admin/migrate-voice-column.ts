/**
 * 관리자용 마이그레이션 엔드포인트
 * interview_sessions 테이블에 voice 컬럼 추가
 * 
 * 사용법: POST /api/admin/migrate-voice-column
 * 
 * ⚠️ 주의: 이 엔드포인트는 한 번만 실행해야 합니다.
 * 실행 후 삭제하거나 비활성화하세요.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 [Migration] Starting voice column migration...');

    // Step 1: Check if column already exists
    const checkResult = await query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'interview_sessions' 
       AND column_name = 'voice'`,
      []
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ [Migration] Column "voice" already exists');
      return res.status(200).json({
        success: true,
        message: 'Column "voice" already exists',
        alreadyExists: true
      });
    }

    // Step 2: Add voice column
    console.log('➕ [Migration] Adding voice column...');
    await query(
      `ALTER TABLE interview_sessions 
       ADD COLUMN voice VARCHAR(20) DEFAULT 'nova'`,
      []
    );

    // Step 3: Update existing records
    console.log('🔄 [Migration] Updating existing records...');
    const updateResult = await query(
      `UPDATE interview_sessions 
       SET voice = 'nova' 
       WHERE voice IS NULL`,
      []
    );

    console.log(`✅ [Migration] Updated ${updateResult.rowCount} existing records`);

    // Step 4: Add comment
    await query(
      `COMMENT ON COLUMN interview_sessions.voice 
       IS 'OpenAI TTS voice (alloy, echo, fable, onyx, nova, shimmer)'`,
      []
    );

    // Step 5: Verify the column
    const verifyResult = await query(
      `SELECT column_name, data_type, column_default, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'interview_sessions' AND column_name = 'voice'`,
      []
    );

    console.log('✅ [Migration] Migration completed successfully');
    console.log('📊 [Migration] Column details:', verifyResult.rows[0]);

    return res.status(200).json({
      success: true,
      message: 'Voice column added successfully',
      updatedRecords: updateResult.rowCount,
      columnDetails: verifyResult.rows[0]
    });

  } catch (error: any) {
    console.error('❌ [Migration] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error
    });
  }
}

