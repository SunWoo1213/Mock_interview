# Voice Column Migration Guide

## 개요

`interview_sessions` 테이블에 `voice` 컬럼을 추가하여 랜덤 면접관 목소리 기능을 지원합니다.

---

## 문제 증상

### 500 Internal Server Error
```
POST /api/interview/start 500 (Internal Server Error)
```

### 원인
- `interview_sessions` 테이블에 `voice` 컬럼이 없음
- SQL INSERT 문에서 존재하지 않는 컬럼 참조

---

## 해결 방법

### Option 1: NPM 스크립트 실행 (권장)

```bash
npm run db:migrate:voice
```

**이 명령은 다음을 수행합니다:**
1. `voice` 컬럼이 존재하는지 확인
2. 없으면 `VARCHAR(20) DEFAULT 'nova'`로 추가
3. 기존 레코드의 `voice`를 `'nova'`로 업데이트
4. 컬럼에 주석 추가
5. 검증 쿼리 실행 및 결과 표시

**예상 출력:**
```
🔄 Starting migration: Add voice column...

✅ Connected to database

📝 Executing migration SQL...

✅ Migration completed successfully!

📊 Verification result:
┌─────────┬───────────────┬──────────────┬─────────────┬──────────────┐
│ (index) │ column_name   │ data_type    │ column_default │ is_nullable │
├─────────┼───────────────┼──────────────┼─────────────┼──────────────┤
│    0    │ 'voice'       │ 'character varying' │ 'nova'::character varying │ 'YES' │
└─────────┴───────────────┴──────────────┴─────────────┴──────────────┘

🎉 Voice column is now ready for use!
   Supported voices: alloy, echo, fable, onyx, nova, shimmer

🔌 Database connection closed
```

---

### Option 2: SQL 직접 실행

데이터베이스에 직접 연결하여 다음 SQL을 실행:

```sql
-- Add voice column
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS voice VARCHAR(20) DEFAULT 'nova';

-- Update existing records
UPDATE interview_sessions 
SET voice = 'nova' 
WHERE voice IS NULL;

-- Add comment
COMMENT ON COLUMN interview_sessions.voice IS 'OpenAI TTS voice (alloy, echo, fable, onyx, nova, shimmer)';
```

---

## 검증

마이그레이션 후 다음 쿼리로 확인:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'interview_sessions' AND column_name = 'voice';
```

**예상 결과:**
| column_name | data_type | column_default | is_nullable |
|-------------|-----------|----------------|-------------|
| voice | character varying | 'nova'::character varying | YES |

---

## 지원되는 목소리

OpenAI TTS에서 지원하는 6가지 목소리:

1. **alloy** - 중성적이고 균형잡힌 목소리
2. **echo** - 남성적이고 깊은 목소리
3. **fable** - 여성적이고 부드러운 목소리
4. **onyx** - 남성적이고 강렬한 목소리
5. **nova** - 여성적이고 생동감 있는 목소리 (기본값)
6. **shimmer** - 여성적이고 명랑한 목소리

---

## 로직 흐름

### 1. 면접 시작 시 (`/api/interview/start`)
```typescript
// 랜덤 목소리 선택
const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const selectedVoice = TTS_VOICES[Math.floor(Math.random() * TTS_VOICES.length)];

// DB에 저장
INSERT INTO interview_sessions (user_id, cover_letter_id, voice, ...)
VALUES ($1, $2, $3, ...)
```

### 2. 질문 생성 시 (`/api/interview/answer`)
```typescript
// 저장된 voice 사용
SELECT voice FROM interview_sessions WHERE id = $1;

// TTS 생성 시 해당 voice 적용
const audioBuffer = await textToSpeech(questionText, sessionVoice);
```

---

## 트러블슈팅

### 문제: 여전히 500 에러 발생

**확인 사항:**
1. 마이그레이션이 성공적으로 완료되었는가?
2. Vercel 환경의 데이터베이스에도 마이그레이션을 적용했는가?
3. 애플리케이션을 다시 배포했는가?

**해결:**
```bash
# 로컬 데이터베이스
npm run db:migrate:voice

# Vercel 프로덕션 데이터베이스
# Vercel Postgres 대시보드에서 SQL 쿼리 탭을 통해 직접 실행
```

---

### 문제: "column 'voice' does not exist"

**원인:** 마이그레이션이 실행되지 않음

**해결:**
```bash
npm run db:migrate:voice
```

---

### 문제: 기존 세션에 voice가 NULL

**원인:** 마이그레이션 전에 생성된 세션

**해결:**
```sql
UPDATE interview_sessions 
SET voice = 'nova' 
WHERE voice IS NULL;
```

---

## 참고 문서

- [OpenAI TTS API Documentation](https://platform.openai.com/docs/guides/text-to-speech)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Node.js pg Client](https://node-postgres.com/)

---

## 관련 파일

- **SQL 마이그레이션:** `scripts/add-voice-column.sql`
- **실행 스크립트:** `scripts/run-add-voice-column.js`
- **API 엔드포인트:** `pages/api/interview/start.ts`, `pages/api/interview/answer.ts`
- **데이터베이스 스키마:** `database/schema.sql` (Line 85)
