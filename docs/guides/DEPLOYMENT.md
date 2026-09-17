# 배포 가이드 📦

## 1. PostgreSQL 데이터베이스 설정

### 옵션 A: Vercel Postgres (권장)

1. Vercel 대시보드에서 Storage > Create Database > Postgres 선택
2. 데이터베이스 생성 후 `DATABASE_URL` 자동 생성
3. 로컬에서 연결 테스트:

```bash
psql "postgresql://..."
```

4. 마이그레이션 실행:

```bash
npm run db:migrate
```

### 옵션 B: Supabase

1. https://supabase.com/ 회원가입
2. New Project 생성
3. Settings > Database에서 Connection String 복사
4. `.env` 파일에 `DATABASE_URL` 설정

### 옵션 C: AWS RDS

1. AWS Console > RDS > Create Database
2. PostgreSQL 14+ 선택
3. Public Access 활성화 (또는 VPC 설정)
4. Security Group에서 5432 포트 허용
5. Connection String 구성:

```
postgresql://username:password@endpoint:5432/dbname
```

## 2. AWS S3 설정

### S3 버킷 생성

1. AWS Console > S3 > Create Bucket
2. Bucket name: `your-bucket-name` (또는 원하는 이름)
3. Region: `ap-southeast-2` (시드니, 본 프로젝트 기준)
4. Block Public Access: 체크 해제 (또는 Bucket Policy로 관리)

### IAM 사용자 생성

1. AWS Console > IAM > Users > Add User
2. Access Type: Programmatic access
3. Attach Policy: `AmazonS3FullAccess`
4. Access Key ID와 Secret Access Key 저장

### CORS 설정

S3 버킷 > Permissions > CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Bucket Policy (선택사항)

공개 읽기 허용:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## 3. OpenAI API 설정

1. https://platform.openai.com/ 회원가입
2. API Keys > Create new secret key
3. API Key 복사 (한 번만 표시됨!)
4. Usage Limits 설정 권장 (비용 관리)

### 필요한 모델
- **GPT-4o**: 텍스트 생성 (공고 분석, 피드백, 질문 생성)
- **TTS-1-HD**: 텍스트 → 음성 (한/영 혼합 발음 개선을 위해 tts-1에서 변경)
- **Whisper-1**: 음성 → 텍스트

### 비용 예상 (2024년 기준)
- GPT-4o: $5 / 1M input tokens, $15 / 1M output tokens
- TTS-1-HD: $30 / 1M characters
- Whisper-1: $0.006 / minute

## 4. Vercel 배포

### 4.1. GitHub 연동 (권장)

1. GitHub에 저장소 생성 및 푸시:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/ai-interview-service.git
git push -u origin main
```

2. https://vercel.com/ 로그인
3. Import Project > GitHub Repository 선택
4. 저장소 선택 > Import

### 4.2. Vercel CLI로 배포

```bash
npm i -g vercel
vercel login
vercel
```

### 4.3. 환경 변수 설정

Vercel Dashboard > Project > Settings > Environment Variables:

```
DATABASE_URL=postgresql://...
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=your-bucket-name
OPENAI_API_KEY=sk-...
JWT_SECRET=your-random-secret-key-here
```

**중요**: 
- Production, Preview, Development 환경 모두 설정
- `JWT_SECRET`은 최소 32자 이상의 무작위 문자열 사용

### 4.4. 도메인 설정 (선택사항)

1. Vercel Dashboard > Project > Settings > Domains
2. 커스텀 도메인 추가 (예: `ai-interview.com`)
3. DNS 레코드 설정 (A/CNAME)

## 5. 데이터베이스 마이그레이션

배포 후 데이터베이스 초기화:

### 로컬에서 실행

```bash
DATABASE_URL="postgresql://..." npm run db:migrate
```

### Vercel에서 실행

Vercel Dashboard > Project > Settings > Functions > Add Script:

```json
{
  "name": "migrate",
  "command": "node scripts/migrate.js"
}
```

또는 로컬에서 프로덕션 DB에 직접 연결:

```bash
DATABASE_URL="프로덕션_DB_URL" node scripts/migrate.js
```

## 6. 프로덕션 체크리스트

### 보안
- [ ] 모든 환경 변수 설정 완료
- [ ] `JWT_SECRET` 강력한 랜덤 문자열 사용
- [ ] S3 버킷 접근 권한 최소화
- [ ] PostgreSQL 연결 SSL 활성화

### 성능
- [ ] Vercel Pro 플랜 고려 (60초 제한)
- [ ] OpenAI API Rate Limiting 설정
- [ ] S3 CloudFront CDN 연동 (선택사항)

### 모니터링
- [ ] Vercel Analytics 활성화
- [ ] OpenAI API Usage 모니터링
- [ ] AWS S3 비용 알림 설정

### 테스트
- [ ] 회원가입/로그인 동작 확인
- [ ] 채용 공고 업로드 및 분석
- [ ] 자소서 피드백 생성
- [ ] 모의 면접 전체 플로우
- [ ] 면접 결과 조회

## 7. 자주 발생하는 문제

### 문제 1: Vercel 서버리스 함수 타임아웃

**증상**: AI 작업 중 504 Gateway Timeout

**해결**:
- Vercel Pro 플랜으로 업그레이드 (60초)
- 또는 비동기 작업 + 폴링 방식으로 변경

### 문제 2: OpenAI API Rate Limit

**증상**: 429 Too Many Requests

**해결**:
- API Key의 Rate Limit 확인
- Retry 로직 추가
- 요청 속도 제한 (throttling)

### 문제 3: S3 업로드 실패

**증상**: Access Denied

**해결**:
- IAM 사용자 권한 확인
- S3 버킷 CORS 설정 확인
- Access Key가 올바른지 확인

### 문제 4: 데이터베이스 연결 실패

**증상**: Connection refused

**해결**:
- `DATABASE_URL` 형식 확인
- 데이터베이스 Public Access 확인
- Security Group/방화벽 설정 확인

## 8. 성능 최적화

### Vercel Edge Functions (고급)

응답 속도 개선을 위해 일부 API를 Edge Functions로 마이그레이션:

```typescript
export const config = {
  runtime: 'edge',
}
```

### OpenAI Streaming

긴 응답에는 스트리밍 사용:

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  stream: true,
})
```

### S3 CloudFront CDN

정적 파일 캐싱:

1. AWS CloudFront 배포 생성
2. Origin: S3 버킷
3. Cache Policy 설정

## 9. 백업 및 복구

### 데이터베이스 백업

```bash
pg_dump "postgresql://..." > backup.sql
```

### 복구

```bash
psql "postgresql://..." < backup.sql
```

### 자동 백업 (AWS RDS)

RDS > Automated Backups > Enable

## 10. 비용 관리

### 월간 예상 비용 (1000명 사용자 기준)

- **Vercel Hobby**: 무료 (Pro: $20/월)
- **Vercel Postgres**: $20/월 ~
- **AWS S3**: $5~10/월 (저장 + 전송)
- **OpenAI API**: $50~200/월 (사용량에 따라)

**총계**: 약 $75~250/월

### 비용 절감 팁

1. OpenAI API 캐싱 (동일 질문 재사용)
2. S3 Lifecycle Policy (오래된 파일 삭제)
3. Vercel Edge Functions 활용
4. PostgreSQL Connection Pooling

---

배포 완료 후 https://your-project.vercel.app 에서 서비스를 확인하세요! 🎉

