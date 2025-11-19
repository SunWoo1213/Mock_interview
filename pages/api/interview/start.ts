/**
 * 면접 시작 API
 * POST /api/interview/start
 * 
 * 순서:
 * 1. JWT 인증 검증 (최우선)
 * 2. 랜덤 목소리 선택
 * 3. DB 세션 생성
 * 4. 첫 질문 생성 및 TTS
 * 5. 응답
 */
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { generateInterviewQuestion, textToSpeech } from '@/lib/openai';
import { uploadToS3 } from '@/lib/s3';

// JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// OpenAI TTS 목소리 목록
const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

// JWT Payload 타입
interface JWTPayload {
  userId: number;
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ========================================
    // 0단계: 요청 정보 로깅
    // ========================================
    console.log('📥 [Interview Start] ========== 요청 수신 ==========');
    console.log('📥 [Interview Start] Request Method:', req.method);
    console.log('📥 [Interview Start] Request Body:', JSON.stringify(req.body, null, 2));
    console.log('📥 [Interview Start] Request Headers (Authorization):', req.headers.authorization ? 'EXISTS' : 'MISSING');
    console.log('📥 [Interview Start] ==========================================');

    // ========================================
    // 1단계: JWT 인증 검증 (최우선)
    // ========================================
    console.log('🔒 [Interview Start] ========== 인증 시작 ==========');
    
    const authHeader = req.headers.authorization;
    console.log('🔒 [Interview Start] Authorization Header:', authHeader ? 'EXISTS' : 'MISSING');
    
    if (!authHeader) {
      console.error('❌ [Interview Start] Authorization header is missing');
      return res.status(401).json({ 
        error: '인증이 필요합니다.',
        debug: { reason: 'Authorization header is missing' }
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ [Interview Start] Authorization header format is invalid');
      return res.status(401).json({ 
        error: '잘못된 인증 형식입니다.',
        debug: { reason: 'Authorization header must start with "Bearer "' }
      });
    }

    // Bearer 토큰 추출
    const token = authHeader.substring(7).trim();
    console.log('🔑 [Interview Start] Token extracted, length:', token.length);

    if (!token || token === 'null' || token === 'undefined') {
      console.error('❌ [Interview Start] Token is empty or invalid');
      return res.status(401).json({ 
        error: '유효하지 않은 토큰입니다.',
        debug: { reason: 'Token is empty or invalid' }
      });
    }

    // JWT 토큰 검증
    console.log('🔍 [Interview Start] Verifying JWT token...');
    let userId: number;
    
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      userId = payload.userId;
      console.log('✅ [Interview Start] JWT verified successfully, userId:', userId);
    } catch (jwtError: any) {
      console.error('❌ [Interview Start] JWT verification failed');
      console.error('   Error Name:', jwtError.name);
      console.error('   Error Message:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: '토큰이 만료되었습니다. 다시 로그인해주세요.',
          debug: { 
            errorName: jwtError.name,
            isExpired: true 
          }
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: '유효하지 않은 토큰입니다.',
          debug: { 
            errorName: jwtError.name,
            isInvalidSignature: true 
          }
        });
      } else {
        return res.status(401).json({ 
          error: '토큰 검증 실패',
          debug: { 
            errorName: jwtError.name,
            errorMessage: jwtError.message 
          }
        });
      }
    }

    console.log('🔒 [Interview Start] ========== 인증 완료 ==========');

    // ========================================
    // 2단계: 요청 본문 검증
    // ========================================
    console.log('📋 [Interview Start] ========== 요청 본문 검증 시작 ==========');
    const { coverLetterId } = req.body;

    console.log('📋 [Interview Start] Body Keys:', Object.keys(req.body));
    console.log('📋 [Interview Start] coverLetterId (raw):', coverLetterId);
    console.log('📋 [Interview Start] coverLetterId (type):', typeof coverLetterId);

    if (!coverLetterId) {
      console.error('❌ [Interview Start] coverLetterId is missing or falsy');
      console.error('❌ [Interview Start] Request Body:', JSON.stringify(req.body));
      return res.status(400).json({ 
        error: 'coverLetterId가 필요합니다.',
        debug: {
          receivedBody: req.body,
          coverLetterId: coverLetterId,
          bodyKeys: Object.keys(req.body)
        }
      });
    }

    console.log('✅ [Interview Start] coverLetterId validated:', coverLetterId);
    console.log('📋 [Interview Start] ========== 요청 본문 검증 완료 ==========');

    // ========================================
    // 자기소개서 및 관련 정보 조회
    // ========================================
    console.log('📝 [Interview Start] Fetching cover letter...');
    const coverLetterResult = await query(
      `SELECT 
        cl.id, cl.content_text, cl.job_posting_id,
        jp.title, jp.company_name, jp.extracted_text, jp.analysis_json
       FROM cover_letters cl
       LEFT JOIN job_postings jp ON cl.job_posting_id = jp.id
       WHERE cl.id = $1 AND cl.user_id = $2`,
      [coverLetterId, userId]
    );

    if (coverLetterResult.rows.length === 0) {
      console.error('❌ [Interview Start] Cover letter not found');
      return res.status(404).json({ error: '자기소개서를 찾을 수 없습니다.' });
    }

    const coverLetter = coverLetterResult.rows[0];
    console.log('✅ [Interview Start] Cover letter found');

    // ========================================
    // 사용자 프로필 조회
    // ========================================
    console.log('👤 [Interview Start] Fetching user profile...');
    const profileResult = await query(
      `SELECT age, gender, current_job, career_summary, certifications,
              career_json, education_json, certificates_json, skills_json
       FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    const userProfile = profileResult.rows[0] || {};
    console.log('✅ [Interview Start] User profile loaded');

    // ========================================
    // 3단계: 랜덤 목소리 선택
    // ========================================
    console.log('🎤 [Interview Start] ========== 랜덤 목소리 선택 ==========');
    console.log('🎤 [Interview Start] Available Voices:', TTS_VOICES);
    const selectedVoice = TTS_VOICES[Math.floor(Math.random() * TTS_VOICES.length)];
    console.log('✅ [Interview Start] 랜덤 선택된 면접관 목소리:', selectedVoice);
    console.log('🎤 [Interview Start] ==========================================');

    // ========================================
    // 4단계: DB 세션 생성
    // ========================================
    console.log('💾 [Interview Start] ========== DB 세션 생성 ==========');
    console.log('💾 [Interview Start] Insert Parameters:');
    console.log('   - userId:', userId);
    console.log('   - coverLetterId:', coverLetterId);
    console.log('   - job_posting_id:', coverLetter.job_posting_id);
    console.log('   - voice:', selectedVoice);
    
    const sessionResult = await query(
      `INSERT INTO interview_sessions 
       (user_id, cover_letter_id, job_posting_id, voice, status, started_at) 
       VALUES ($1, $2, $3, $4, 'in_progress', NOW()) 
       RETURNING id`,
      [userId, coverLetterId, coverLetter.job_posting_id, selectedVoice]
    );

    const sessionId = sessionResult.rows[0].id;
    console.log('✅ [Interview Start] Session created successfully!');
    console.log('✅ [Interview Start] Session ID:', sessionId);
    console.log('💾 [Interview Start] ==========================================');

    // ========================================
    // 첫 번째 질문 생성
    // ========================================
    console.log('💬 [Interview Start] Generating first question...');
    const context = {
      userProfile,
      jobPosting: {
        title: coverLetter.title,
        company_name: coverLetter.company_name,
        extracted_text: coverLetter.extracted_text,
        analysis_json: coverLetter.analysis_json,
      },
      coverLetter: coverLetter.content_text,
      conversationHistory: [],
    };

    const questionText = await generateInterviewQuestion(context, 1, 5);
    console.log('✅ [Interview Start] Question generated');

    // ========================================
    // TTS로 음성 생성
    // ========================================
    console.log('🔊 [Interview Start] Generating TTS audio...');
    const audioBuffer = await textToSpeech(questionText, selectedVoice);
    console.log('✅ [Interview Start] Audio generated, size:', audioBuffer.length, 'bytes');

    // ========================================
    // S3에 음성 업로드
    // ========================================
    console.log('☁️ [Interview Start] Uploading to S3...');
    const questionAudioUrl = await uploadToS3({
      folder: 'interview-questions',
      fileName: `session_${sessionId}_q1.mp3`,
      contentType: 'audio/mpeg',
      buffer: audioBuffer,
    });
    console.log('✅ [Interview Start] Audio uploaded to S3');

    // ========================================
    // 첫 번째 턴 저장
    // ========================================
    console.log('💾 [Interview Start] Saving first turn...');
    await query(
      `INSERT INTO interview_turns 
       (session_id, turn_number, question_text, question_audio_s3_url) 
       VALUES ($1, 1, $2, $3)`,
      [sessionId, questionText, questionAudioUrl]
    );
    console.log('✅ [Interview Start] First turn saved');

    // ========================================
    // 4단계: 응답
    // ========================================
    console.log('🎉 [Interview Start] Interview started successfully!');
    return res.status(201).json({
      message: '면접이 시작되었습니다.',
      sessionId,
      voice: selectedVoice,
      turnNumber: 1,
      questionText,
      questionAudioUrl,
    });

  } catch (error: any) {
    console.error('❌❌❌ [Interview Start] CRITICAL ERROR ❌❌❌');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Detail:', error.detail);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
    console.error('Stack Trace:', error.stack);
    console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
    
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message,
      debug: {
        name: error.name,
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack,
        // PostgreSQL specific error info
        column: error.column,
        table: error.table,
        constraint: error.constraint
      }
    });
  }
}
