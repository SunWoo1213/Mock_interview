-- 면접 피드백 구조 개선 마이그레이션
-- interview_turns 테이블의 feedback_text를 JSONB 타입으로 변경하고 구조화된 피드백 저장

-- Step 1: feedback_text 컬럼을 JSONB 타입으로 변경
-- 기존 TEXT 데이터가 있다면 JSON으로 변환 시도
ALTER TABLE interview_turns 
ALTER COLUMN feedback_text TYPE JSONB USING 
  CASE 
    WHEN feedback_text IS NULL THEN NULL
    WHEN feedback_text::text ~ '^[\s]*\{' THEN feedback_text::jsonb
    ELSE json_build_object('legacy_feedback', feedback_text)::jsonb
  END;

-- Step 2: 컬럼 주석 추가 (스키마 문서화)
COMMENT ON COLUMN interview_turns.feedback_text IS 
'구조화된 턴별 피드백 (JSONB 형식)
{
  "user_answer_summary": "답변 요약",
  "strengths": ["잘한 점 1", "잘한 점 2"],
  "improvements": ["개선할 점 1", "개선할 점 2"],
  "better_answer_example": "STAR 기법을 활용한 모범 답안"
}';

-- Step 3: interview_sessions 테이블의 final_feedback_json 컬럼 주석 업데이트
COMMENT ON COLUMN interview_sessions.final_feedback_json IS 
'최종 종합 피드백 (JSONB 형식)
{
  "overall_feedback": "종합 평가",
  "per_turn_feedback": [
    {
      "turn_number": 1,
      "question": "질문",
      "answer": "답변",
      "user_answer_summary": "답변 요약",
      "strengths": ["잘한 점 1", "잘한 점 2"],
      "improvements": ["개선할 점 1", "개선할 점 2"],
      "better_answer_example": "모범 답안"
    }
  ],
  "is_early_finish": false,
  "total_questions_answered": 5
}';

-- Step 4: 인덱스 추가 (JSONB 쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_interview_turns_feedback_gin 
ON interview_turns USING GIN (feedback_text);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_final_feedback_gin 
ON interview_sessions USING GIN (final_feedback_json);

-- 검증 쿼리
-- 컬럼 타입 확인
SELECT 
    table_name,
    column_name, 
    data_type,
    col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_comment
FROM information_schema.columns 
WHERE table_name IN ('interview_turns', 'interview_sessions')
  AND column_name IN ('feedback_text', 'final_feedback_json')
ORDER BY table_name, ordinal_position;

