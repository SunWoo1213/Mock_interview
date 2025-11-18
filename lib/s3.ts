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
 * S3에 파일 업로드
 */
export async function uploadToS3(options: UploadOptions): Promise<string> {
  const { folder, fileName, contentType, buffer } = options;
  const key = `${folder}/${Date.now()}_${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    // 리전별 올바른 URL 형식 사용
    return `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 업로드 에러:', error);
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

