# 데이터베이스 마이그레이션 가이드

## 📋 목차
1. [User Profiles 테이블 마이그레이션](#1-user-profiles-테이블-마이그레이션)
2. [면접 피드백 구조 마이그레이션 (최신)](#2-면접-피드백-구조-마이그레이션-최신)

---

## 1. User Profiles 테이블 마이그레이션

### 문제 상황
`user_profiles` 테이블에 `current_job`, `career_summary`, `certifications` 컬럼이 누락되어 다음 에러가 발생합니다:
```
error: column p.current_job does not exist
```

### 해결 방법

### 방법 1: 기존 테이블에 컬럼 추가 (권장 - 기존 데이터 유지)

프로덕션 데이터베이스에 직접 연결하여 다음 SQL을 실행하세요:

```bash
# PostgreSQL 클라이언트로 연결
psql $DATABASE_URL

# 또는 Vercel Postgres의 경우
vercel postgres:shell
```

그런 다음 SQL 실행:

```sql
-- user_profiles 테이블에 새로운 필드 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_job VARCHAR(200),
ADD COLUMN IF NOT EXISTS career_summary TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT;

-- 인덱스 추가 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_job ON user_profiles(current_job);
```

또는 스크립트 파일 실행:

```bash
# 로컬에서 실행
psql $DATABASE_URL -f scripts/add-profile-fields.sql

# 또는 Node.js 스크립트 사용
node scripts/run-migration.js
```

### 방법 2: 전체 스키마 재실행 (새 데이터베이스용)

새로운 데이터베이스이거나 데이터를 모두 지워도 괜찮은 경우:

```bash
node scripts/migrate.js
```

### 방법 3: Prisma 마이그레이션 사용

Prisma를 사용하는 경우:

```bash
# Prisma 스키마를 데이터베이스에 적용
npx prisma db push

# 또는 마이그레이션 생성 및 적용
npx prisma migrate dev --name add_profile_text_fields
npx prisma migrate deploy  # 프로덕션용
```

## 검증

마이그레이션 후 다음 쿼리로 컬럼이 추가되었는지 확인:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('current_job', 'career_summary', 'certifications');
```

예상 결과:
```
   column_name   |     data_type      
-----------------+--------------------
 current_job     | character varying
 career_summary  | text
 certifications  | text
```

## Vercel 배포 시 주의사항

1. **환경 변수 확인**: Vercel 대시보드에서 `DATABASE_URL` 또는 `POSTGRES_URL`이 올바르게 설정되어 있는지 확인
2. **마이그레이션 실행**: 배포 전에 프로덕션 데이터베이스에 마이그레이션을 먼저 실행
3. **재배포**: 코드는 이미 마이그레이션된 스키마를 예상하므로, 데이터베이스 마이그레이션 후 애플리케이션을 재배포할 필요 없음

## 문제 해결

### "relation does not exist" 에러가 계속되는 경우

데이터베이스 풀 연결을 재시작해야 할 수 있습니다:

```bash
# Vercel에서 함수를 다시 배포하거나
vercel --prod

# 또는 데이터베이스 연결 풀 재시작
# (클라우드 제공업체 대시보드에서)
```

### 연결 문자열 확인

```bash
# DATABASE_URL 형식 확인
echo $DATABASE_URL
# 예: postgresql://user:password@host:5432/database?sslmode=require
```

---

## 2. 면접 피드백 구조 마이그레이션 (최신)

### 개요
면접 피드백 시스템이 개선되어, 각 턴별로 구조화된 상세 피드백을 제공합니다.
`interview_turns.feedback_text` 컬럼을 TEXT에서 JSONB로 변경하여 성능과 쿼리 기능을 향상시킵니다.

### 변경 사항
- `interview_turns.feedback_text`: TEXT → JSONB
- 새로운 피드백 구조:
  ```json
  {
    "user_answer_summary": "답변 요약",
    "strengths": ["잘한 점 1", "잘한 점 2"],
    "improvements": ["개선할 점 1", "개선할 점 2"],
    "better_answer_example": "STAR 기법을 활용한 모범 답안"
  }
  ```
- GIN 인덱스 추가로 JSONB 쿼리 성능 향상
- 스키마 문서화를 위한 컬럼 주석 추가

### 방법 1: Node.js 스크립트 사용 (권장)

```bash
# 로컬에서 실행
node scripts/run-feedback-migration.js

# 또는 프로덕션 데이터베이스에 대해 실행
DATABASE_URL=your_production_db_url node scripts/run-feedback-migration.js
```

### 방법 2: SQL 직접 실행

```bash
# PostgreSQL 클라이언트로 연결
psql $DATABASE_URL -f scripts/update-interview-feedback-structure.sql

# 또는 Vercel Postgres
vercel postgres:shell
```

그런 다음 SQL 실행:

```sql
-- interview_turns.feedback_text를 JSONB로 변경
ALTER TABLE interview_turns 
ALTER COLUMN feedback_text TYPE JSONB USING 
  CASE 
    WHEN feedback_text IS NULL THEN NULL
    WHEN feedback_text::text ~ '^[\s]*\{' THEN feedback_text::jsonb
    ELSE json_build_object('legacy_feedback', feedback_text)::jsonb
  END;

-- GIN 인덱스 추가 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_interview_turns_feedback_gin 
ON interview_turns USING GIN (feedback_text);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_final_feedback_gin 
ON interview_sessions USING GIN (final_feedback_json);
```

### 검증

마이그레이션 후 다음 쿼리로 변경 사항 확인:

```sql
-- 컬럼 타입 확인
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'interview_turns' 
  AND column_name = 'feedback_text';
```

예상 결과:
```
   table_name    | column_name   | data_type 
-----------------+---------------+-----------
 interview_turns | feedback_text | jsonb
```

### 기존 데이터 호환성
- 기존 TEXT 데이터는 자동으로 JSON으로 변환됩니다
- JSON이 아닌 레거시 데이터는 `{"legacy_feedback": "..."}`로 래핑됩니다
- 프론트엔드는 구버전 피드백과 신버전 피드백을 모두 지원합니다

### Vercel 배포 시 주의사항

1. **마이그레이션 먼저 실행**: 코드 배포 전에 프로덕션 DB에 마이그레이션 실행
2. **제로 다운타임**: 마이그레이션은 기존 데이터를 보존하며, 애플리케이션 중단 없이 실행 가능
3. **롤백 계획**: 문제 발생 시 컬럼을 다시 TEXT로 변경 가능 (데이터 손실 없음)

