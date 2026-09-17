/**
 * 인증 관련 유틸리티 (JWT, 비밀번호 해싱)
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

/**
 * JWT 서명 키 조회
 * 하드코딩된 기본값으로 토큰이 위조되지 않도록, 환경 변수가 없으면 즉시 실패시킨다.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
  }
  return secret;
}

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
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d',
  });
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JWTPayload;
    return payload;
  } catch (error: any) {
    // 구체적인 JWT 에러 타입 확인
    console.error('❌ [verifyToken] JWT Verification Failed');
    console.error('   Error Name:', error.name);
    console.error('   Error Message:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      console.error('   ⏰ Token has EXPIRED');
      console.error('   Expired At:', error.expiredAt);
      throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('   🔒 Invalid JWT signature or format');
      throw new Error('유효하지 않은 토큰 형식입니다.');
    } else if (error.name === 'NotBeforeError') {
      console.error('   ⏳ Token is not active yet');
      throw new Error('토큰이 아직 활성화되지 않았습니다.');
    } else {
      console.error('   ❓ Unknown JWT error');
      throw new Error('토큰 검증 중 오류가 발생했습니다: ' + error.message);
    }
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
    return null;
  }

  // "Bearer " (7글자) 제거하고 토큰 추출
  const token = authHeader.substring(7).trim();
  
  if (!token || token === 'null' || token === 'undefined') {
    console.error('❌ [extractToken] Extracted token is invalid');
    return null;
  }

  console.log('✅ [extractToken] Token extracted successfully');
  return token;
}

