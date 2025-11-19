/**
 * 인증 관련 유틸리티 (JWT, 비밀번호 해싱)
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: number;
  email: string;
}

/**
 * 비밀번호 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * JWT 토큰 생성
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('유효하지 않은 토큰입니다.');
  }
}

/**
 * Authorization 헤더에서 토큰 추출
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  // 디버깅 로그
  if (!authHeader) {
    console.error('❌ [extractToken] Authorization header is undefined or empty');
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    console.error('❌ [extractToken] Authorization header does not start with "Bearer "');
    console.error('   Received:', authHeader.substring(0, 50));
    return null;
  }

  // "Bearer " (7글자) 제거하고 토큰 추출
  const token = authHeader.substring(7).trim();
  
  if (!token || token === 'null' || token === 'undefined') {
    console.error('❌ [extractToken] Extracted token is invalid:', token);
    return null;
  }

  console.log('✅ [extractToken] Token extracted successfully');
  return token;
}

