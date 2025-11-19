# Voice Column Migration Guide

## 문제
`interview_sessions` 테이블에 `voice` 컬럼이 없어서 면접 시작 시 에러 발생:
```
column "voice" of relation "interview_sessions" does not exist
```

## 해결 방법

### 방법 1: API 엔드포인트를 통한 마이그레이션 (권장)

1. **코드 배포**
   ```bash
   git add -A
   git commit -m "fix: add voice column to interview_sessions table"
   git push
   ```

2. **Vercel 배포 대기** (자동 배포 완료까지 1-2분)

3. **마이그레이션 API 호출**
   
   **Postman/Thunder Client/curl 사용:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/admin/migrate-voice-column
   ```

   **브라우저에서 (개발자 도구 콘솔):**
   ```javascript
   fetch('/api/admin/migrate-voice-column', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     }
   })
   .then(res => res.json())
   .then(data => console.log(data))
   .catch(err => console.error(err));
   ```

4. **응답 확인**
   ```json
   {
     "success": true,
     "message": "Voice column added successfully",
     "updatedRecords": 0,
     "columnDetails": {
       "column_name": "voice",
       "data_type": "character varying",
       "column_default": "'nova'::character varying",
       "is_nullable": "YES"
     }
   }
   ```

5. **마이그레이션 완료 후 API 엔드포인트 삭제 (선택)**
   ```bash
   # 보안을 위해 마이그레이션 완료 후 삭제
   rm pages/api/admin/migrate-voice-column.ts
   git add -A
   git commit -m "chore: remove migration endpoint"
   git push
   ```

---

### 방법 2: Prisma를 통한 마이그레이션 (로컬 개발 환경)

1. **환경 변수 확인**
   ```bash
   # .env.local 파일에 POSTGRES_URL이 설정되어 있는지 확인
   cat .env.local | grep POSTGRES_URL
   ```

2. **Prisma 클라이언트 재생성**
   ```bash
   npx prisma generate
   ```

3. **데이터베이스 푸시**
   ```bash
   npx prisma db push
   ```

4. **확인**
   ```bash
   npx prisma studio
   # interview_sessions 테이블에 voice 컬럼이 추가되었는지 확인
   ```

---

### 방법 3: 직접 SQL 실행 (psql 또는 DB 클라이언트)

Vercel Postgres 대시보드 또는 `psql` 클라이언트를 사용하여 직접 실행:

```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'interview_sessions' 
AND column_name = 'voice';

-- Add voice column (if not exists)
ALTER TABLE interview_sessions 
ADD COLUMN voice VARCHAR(20) DEFAULT 'nova';

-- Update existing records
UPDATE interview_sessions 
SET voice = 'nova' 
WHERE voice IS NULL;

-- Add comment
COMMENT ON COLUMN interview_sessions.voice 
IS 'OpenAI TTS voice (alloy, echo, fable, onyx, nova, shimmer)';

-- Verify
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'interview_sessions' AND column_name = 'voice';
```

---

## 변경 사항

### 1. Prisma Schema 업데이트
- `prisma/schema.prisma`에 `voice` 필드 추가
- 타입: `String?`
- 기본값: `"nova"`
- 컬럼 타입: `VARCHAR(20)`

### 2. 지원되는 목소리
OpenAI TTS에서 지원하는 목소리:
- `alloy` - 중성적인 목소리
- `echo` - 남성적인 목소리
- `fable` - 영국식 여성 목소리
- `onyx` - 깊은 남성 목소리
- `nova` - 활기찬 여성 목소리 (기본값)
- `shimmer` - 부드러운 여성 목소리

### 3. 동작 방식
- 면접 시작 시 랜덤으로 목소리 선택
- 선택된 목소리는 세션 전체에 적용
- 기존 세션은 자동으로 'nova'로 설정됨

---

## 마이그레이션 완료 확인

면접 시작 API를 다시 호출하여 에러가 없는지 확인:

```bash
POST /api/interview/start
{
  "coverLetterId": 2
}
```

**예상 성공 응답:**
```json
{
  "sessionId": 123,
  "voice": "fable",
  "message": "면접 세션이 시작되었습니다."
}
```

---

## 문제 해결

### "Column already exists" 에러
```
ERROR: column "voice" already exists
```
→ 이미 컬럼이 추가되어 있습니다. 정상입니다.

### "Permission denied" 에러
```
ERROR: permission denied for table interview_sessions
```
→ 데이터베이스 사용자 권한을 확인하세요. Vercel Postgres에서는 자동으로 권한이 부여됩니다.

### 마이그레이션 후에도 에러 발생
1. Vercel 재배포 확인
2. 브라우저 캐시 지우기
3. 데이터베이스 연결 풀 재시작 (Vercel 프로젝트 재배포)

---

## 참고 파일
- `prisma/schema.prisma` - Prisma 스키마 정의
- `database/schema.sql` - 원본 SQL 스키마
- `scripts/add-voice-column.sql` - 마이그레이션 SQL
- `pages/api/admin/migrate-voice-column.ts` - 마이그레이션 API

