# TTS 오디오 재생 에러 수정 가이드

## 문제 증상
- `MEDIA_ELEMENT_ERROR: Format error (code 4)`
- `NotSupportedError: Failed to load because no supported source was found.`
- S3에 업로드된 MP3 파일이 브라우저에서 재생되지 않음

## 원인 분석
1. **S3 CORS 설정 부족**: 브라우저가 crossorigin 요청을 차단
2. **Content-Type 누락**: S3 객체의 MIME type이 올바르게 설정되지 않음
3. **OpenAI TTS 응답 검증 부족**: 생성된 오디오 버퍼가 유효하지 않을 수 있음

## 적용된 수정사항

### 1. 백엔드 수정 (`lib/openai.ts`)
- OpenAI TTS API 호출 시 `response_format: 'mp3'` 명시적 지정
- 생성된 오디오 버퍼 크기 검증 (최소 100 bytes)
- MP3 파일 헤더 검증 (ID3 또는 MPEG 헤더)
- 상세한 로깅 추가

### 2. S3 업로드 수정 (`lib/s3.ts`)
- 오디오 파일 버퍼 크기 검증
- `Cache-Control` 헤더 추가
- 상세한 로깅 추가

### 3. 프론트엔드 수정 (`components/InterviewPage.tsx`)
- `<audio>` 태그에 `crossOrigin="anonymous"` 추가
- `<source>` 태그로 명시적 MIME type 지정 (`type="audio/mpeg"`)
- 추가 디버그 로깅 (networkState, readyState)

## S3 버킷 CORS 설정

AWS S3 콘솔에서 다음 CORS 설정을 적용하세요:

### 설정 방법
1. AWS S3 콘솔 접속
2. 버킷 선택 (`my-interview-project-bucket-2025`)
3. **Permissions** 탭 → **Cross-origin resource sharing (CORS)** 섹션
4. 다음 JSON 설정 추가:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD",
            "PUT",
            "POST"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### 프로덕션 환경용 CORS (보안 강화)
```json
[
    {
        "AllowedHeaders": [
            "Authorization",
            "Content-Type"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://yourdomain.com",
            "https://www.yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type"
        ],
        "MaxAgeSeconds": 3600
    }
]
```

## S3 버킷 정책 설정

버킷의 모든 객체를 공개 읽기로 설정하려면:

1. **Permissions** 탭 → **Bucket Policy** 섹션
2. 다음 정책 추가:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::my-interview-project-bucket-2025/*"
        }
    ]
}
```

**주의**: 버킷 이름을 실제 버킷 이름으로 변경하세요.

## Object ACL 설정 (선택사항)

S3 버킷에서 ACL이 활성화되어 있다면:

1. **Permissions** 탭 → **Object Ownership**
2. **ACLs enabled** 선택
3. 코드에서 ACL 사용 가능:

```typescript
const command = new PutObjectCommand({
  Bucket: BUCKET_NAME,
  Key: key,
  Body: buffer,
  ContentType: contentType,
  ACL: 'public-read', // 이제 사용 가능
});
```

## 테스트 방법

### 1. 서버 로그 확인
```bash
# 백엔드 로그에서 다음을 확인:
🎤 [TTS] Generating speech for text (XXX chars)
✅ [TTS] Speech generated successfully (XXXX bytes)
🎵 [S3 Upload] Audio buffer size: XXXX bytes
✅ [S3 Upload] Successfully uploaded: interview-questions/...
```

### 2. 브라우저 콘솔 확인
```javascript
// 정상 재생 시:
🎵 [TTS DEBUG] Current Audio URL: https://...
🔄 [TTS DEBUG] Audio load started
📥 [TTS DEBUG] Audio data loaded
✅ [TTS DEBUG] Audio can play now
▶️ [TTS DEBUG] Attempting to play audio...
✅ [TTS DEBUG] Audio started playing
🏁 [TTS DEBUG] Audio playback ended
```

### 3. S3 URL 직접 접근
브라우저에서 S3 URL을 직접 열어 다운로드 또는 재생 확인:
```
https://my-interview-project-bucket-2025.s3.ap-southeast-2.amazonaws.com/interview-questions/...
```

## 추가 디버깅

### MP3 파일 무결성 확인
```bash
# 로컬에서 MP3 파일 다운로드 후 재생 테스트
curl -O "S3_URL"
# VLC, Windows Media Player 등으로 재생 확인
```

### Network 탭 확인
1. 브라우저 개발자 도구 → **Network** 탭
2. MP3 파일 요청 확인
3. **Response Headers** 확인:
   - `Content-Type: audio/mpeg` ✅
   - `Access-Control-Allow-Origin: *` ✅
   - `Content-Length: > 100` ✅

## 문제가 계속되는 경우

1. **OpenAI API 키 확인**: 유효한 API 키인지 확인
2. **OpenAI TTS 할당량 확인**: 사용량 제한 초과 여부
3. **S3 버킷 리전 확인**: `ap-southeast-2`가 올바른지 확인
4. **네트워크 방화벽**: 회사/학교 방화벽이 S3 접근을 차단하는지 확인

## 참고 자료
- [OpenAI TTS API 문서](https://platform.openai.com/docs/guides/text-to-speech)
- [AWS S3 CORS 설정 가이드](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [HTML5 Audio crossOrigin 속성](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-crossorigin)

