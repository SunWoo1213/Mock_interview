-- user_profiles 테이블에 새로운 필드 추가
-- 간단한 텍스트 필드로 프로필 입력을 더 쉽게 만듭니다

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_job VARCHAR(200),
ADD COLUMN IF NOT EXISTS career_summary TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT;

-- 인덱스 추가 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_job ON user_profiles(current_job);







