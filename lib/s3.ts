/**
 * AWS S3 업로드 유틸리티
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// S3 버킷 리전 (실제 버킷 위치: ap-southeast-2 시드니)
const BUCKET_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ai-interview-bucket';

const s3Client = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface UploadOptions {
  folder: string; // 'job-postings', 'interview-questions', 'user-answers'
  fileName: string;
  contentType: string;
  buffer: Buffer;
}

/**
 * S3에 파일 업로드 (Presigned URL 반환)
 */
export async function uploadToS3(options: UploadOptions): Promise<string> {
  const { folder, fileName, contentType, buffer } = options;
  const key = `${folder}/${Date.now()}_${fileName}`;

  // 오디오 파일인 경우 버퍼 검증
  if (contentType.startsWith('audio/')) {
    console.log(`🎵 [S3 Upload] Audio buffer size: ${buffer.length} bytes`);
    if (buffer.length < 100) {
      console.error('❌ [S3 Upload] Audio buffer too small, likely invalid');
      throw new Error('생성된 오디오 파일이 유효하지 않습니다.');
    }
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // 추가 메타데이터 설정
    CacheControl: 'max-age=31536000', // 1년 캐싱
    // ACL은 버킷 정책으로 관리 (ACL 비활성화 시 에러 방지)
  });

  try {
    await s3Client.send(command);
    console.log(`✅ [S3 Upload] Successfully uploaded: ${key}`);
    
    // Presigned URL 생성 (24시간 유효)
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, getCommand, { 
      expiresIn: 86400 // 24시간
    });
    
    console.log(`🔗 [S3 Upload] Presigned URL generated`);
    return presignedUrl;
  } catch (error) {
    console.error('❌ [S3 Upload] Error:', error);
    throw new Error('파일 업로드에 실패했습니다.');
  }
}

/**
 * S3에서 파일 다운로드 (Buffer 반환)
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);
    const stream = response.Body as Readable;
    
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('S3 다운로드 에러:', error);
    throw new Error('파일 다운로드에 실패했습니다.');
  }
}

/**
 * Presigned URL 생성 (클라이언트 직접 업로드용)
 */
export async function getPresignedUploadUrl(
  folder: string,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const key = `${folder}/${Date.now()}_${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const fileUrl = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl };
}

/**
 * S3 URL에서 Key 추출
 */
export function extractKeyFromUrl(url: string): string {
  const urlObj = new URL(url);
  return urlObj.pathname.substring(1); // 첫 번째 '/' 제거
}

