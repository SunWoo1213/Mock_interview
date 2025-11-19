-- Add voice column to interview_sessions table
-- Migration: Add voice support for random interviewer voice selection

-- Step 1: Check if column already exists and add if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'interview_sessions' 
        AND column_name = 'voice'
    ) THEN
        -- Add voice column with default value
        ALTER TABLE interview_sessions 
        ADD COLUMN voice VARCHAR(20) DEFAULT 'nova';
        
        RAISE NOTICE 'Column "voice" added to interview_sessions table';
    ELSE
        RAISE NOTICE 'Column "voice" already exists in interview_sessions table';
    END IF;
END $$;

-- Step 2: Update existing records without voice to have default value
UPDATE interview_sessions 
SET voice = 'nova' 
WHERE voice IS NULL;

-- Step 3: Add comment to document the column
COMMENT ON COLUMN interview_sessions.voice IS 'OpenAI TTS voice (alloy, echo, fable, onyx, nova, shimmer)';

-- Verification query
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'interview_sessions' AND column_name = 'voice';



