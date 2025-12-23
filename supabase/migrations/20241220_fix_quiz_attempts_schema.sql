-- Fix quiz_attempts table schema if it exists with wrong columns
-- This migration ensures quiz_attempts has the correct schema before other migrations run

DO $$ 
BEGIN
    -- Check if quiz_attempts exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_attempts') THEN
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'quiz_attempts' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        -- Add path_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'quiz_attempts' 
            AND column_name = 'path_id'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE;
        END IF;
        
        -- Add module_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'quiz_attempts' 
            AND column_name = 'module_id'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN module_id VARCHAR(100);
        END IF;
        
        -- Add answers column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'quiz_attempts' 
            AND column_name = 'answers'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN answers JSONB;
        END IF;
        
        -- Add score column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'quiz_attempts' 
            AND column_name = 'score'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN score INTEGER;
        END IF;
        
        -- Add total_questions column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'quiz_attempts' 
            AND column_name = 'total_questions'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN total_questions INTEGER;
        END IF;
        
        -- Add time_taken_seconds column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'quiz_attempts' 
            AND column_name = 'time_taken_seconds'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN time_taken_seconds INTEGER;
        END IF;
    END IF;
END $$;

