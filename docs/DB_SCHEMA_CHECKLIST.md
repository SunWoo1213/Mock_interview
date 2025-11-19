# 데이터베이스 스키마 체크리스트

## 현재 코드에서 요구하는 DB 구조

### 1. 테이블 목록
- [x] `users` - 사용자 정보
- [x] `user_profiles` - 사용자 프로필
- [x] `job_postings` - 채용 공고
- [x] `cover_letters` - 자기소개서
- [x] `cover_letter_feedbacks` - 자기소개서 피드백
- [x] `interview_sessions` - 면접 세션
- [x] `interview_turns` - 면접 턴 (질문/답변)

### 2. 중요 컬럼 타입

#### interview_turns
- [x] `feedback_text` - **JSONB** 타입 (구조화된 턴별 피드백)
  ```json
  {
    "user_answer_summary": "답변 요약",
    "strengths": ["잘한 점 1", "잘한 점 2"],
    "improvements": ["개선할 점 1", "개선할 점 2"],
    "better_answer_example": "모범 답안"
  }
  ```

#### interview_sessions
- [x] `final_feedback_json` - **JSONB** 타입 (최종 종합 피드백)
  ```json
  {
    "overall_feedback": "종합 평가",
    "per_turn_feedback": [...],
    "is_early_finish": false,
    "total_questions_answered": 5
  }
  ```

#### job_postings
- [x] `title` - VARCHAR(500)
- [x] `company_name` - VARCHAR(200)
- [x] `original_s3_url` - TEXT
- [x] `extracted_text` - TEXT
- [x] `analysis_json` - **JSONB** (AI 분석 결과)
- [x] `status` - VARCHAR(50) (pending, analyzed, failed)
- [x] `created_at` - TIMESTAMP
- [x] `updated_at` - TIMESTAMP

#### user_profiles
- [x] `current_job` - VARCHAR(200)
- [x] `career_summary` - TEXT
- [x] `certifications` - TEXT
- [x] `career_json` - JSONB
- [x] `education_json` - JSONB
- [x] `certificates_json` - JSONB
- [x] `skills_json` - JSONB

### 3. CASCADE 설정

#### 필수 CASCADE 설정
- [x] `cover_letters.job_posting_id` → `job_postings(id)` **ON DELETE CASCADE**
  - 공고 삭제 시 연결된 자소서도 삭제
- [x] `interview_turns.session_id` → `interview_sessions(id)` **ON DELETE CASCADE**
  - 세션 삭제 시 턴도 삭제
- [x] `cover_letter_feedbacks.cover_letter_id` → `cover_letters(id)` **ON DELETE CASCADE**
  - 자소서 삭제 시 피드백도 삭제
- [x] `user_profiles.user_id` → `users(id)` **ON DELETE CASCADE**
  - 사용자 삭제 시 프로필도 삭제

#### SET NULL 설정
- [x] `interview_sessions.cover_letter_id` → `cover_letters(id)` **ON DELETE SET NULL**
- [x] `interview_sessions.job_posting_id` → `job_postings(id)` **ON DELETE SET NULL**

### 4. 인덱스

#### 기본 인덱스
- [x] `idx_user_profiles_user_id`
- [x] `idx_user_profiles_current_job`
- [x] `idx_job_postings_user_id`
- [x] `idx_cover_letters_user_id`
- [x] `idx_cover_letters_job_posting_id`
- [x] `idx_interview_sessions_user_id`
- [x] `idx_interview_sessions_status`
- [x] `idx_interview_turns_session_id`

#### GIN 인덱스 (JSONB 성능 최적화)
- [x] `idx_interview_turns_feedback_gin` - `interview_turns(feedback_text)`
- [x] `idx_interview_sessions_final_feedback_gin` - `interview_sessions(final_feedback_json)`

### 5. 트리거

- [x] `update_updated_at_column()` 함수
- [x] `update_users_updated_at` 트리거
- [x] `update_user_profiles_updated_at` 트리거
- [x] `update_job_postings_updated_at` 트리거
- [x] `update_cover_letters_updated_at` 트리거
- [x] `update_interview_sessions_updated_at` 트리거

## 스키마 검증 방법

### 자동 검증 스크립트 실행
```bash
npm run db:verify:schema
```

### 수동 검증 SQL

#### 1. 컬럼 타입 확인
```sql
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name IN ('interview_turns', 'interview_sessions')
  AND column_name IN ('feedback_text', 'final_feedback_json');
```

예상 결과:
```
   table_name       | column_name          | data_type 
--------------------+----------------------+-----------
 interview_turns    | feedback_text        | jsonb
 interview_sessions | final_feedback_json  | jsonb
```

#### 2. CASCADE 설정 확인
```sql
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'cover_letters'
  AND kcu.column_name = 'job_posting_id';
```

#### 3. GIN 인덱스 확인
```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE '%feedback%gin%';
```

## 마이그레이션 필요 시

### 면접 피드백 구조 마이그레이션
```bash
npm run db:migrate:feedback
```

이 마이그레이션은:
- `interview_turns.feedback_text`를 TEXT → JSONB로 변경
- 기존 TEXT 데이터를 JSON으로 안전하게 변환
- GIN 인덱스 추가

### 프로필 필드 마이그레이션
```bash
npm run db:migrate:profile
```

이 마이그레이션은:
- `user_profiles`에 `current_job`, `career_summary`, `certifications` 추가

## 트러블슈팅

### "column does not exist" 에러
```bash
# 해당 컬럼을 추가하는 마이그레이션 실행
npm run db:migrate:profile
# 또는
npm run db:migrate:feedback
```

### "invalid input syntax for type jsonb" 에러
- `interview_turns.feedback_text`가 아직 TEXT 타입일 수 있음
- 마이그레이션 실행:
```bash
npm run db:migrate:feedback
```

### 성능 문제 (JSONB 쿼리 느림)
- GIN 인덱스가 없을 수 있음
- 마이그레이션 실행으로 인덱스 추가:
```bash
npm run db:migrate:feedback
```

## 현재 상태

### ✅ 구현 완료
- 모든 테이블 생성
- JSONB 타입 적용 (feedback_text, final_feedback_json, analysis_json)
- CASCADE 설정
- GIN 인덱스
- 트리거 함수

### 🔧 필요한 작업
- 프로덕션 DB에 마이그레이션 적용 (처음 배포 시)
- 검증 스크립트 실행하여 확인

## 참고 문서
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - 상세 마이그레이션 가이드
- [database/schema.sql](../database/schema.sql) - 전체 스키마 정의
- [scripts/update-interview-feedback-structure.sql](../scripts/update-interview-feedback-structure.sql) - 피드백 구조 마이그레이션

