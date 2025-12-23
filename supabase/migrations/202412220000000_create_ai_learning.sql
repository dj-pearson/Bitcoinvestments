-- AI Learning Assistant Tables
-- Conversational AI for crypto education

-- Create AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    topic VARCHAR(30) CHECK (topic IN ('basics', 'trading', 'defi', 'security', 'tax', 'technical_analysis', 'fundamentals', 'portfolio')),
    messages JSONB DEFAULT '[]',
    message_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create learning paths table
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    topic VARCHAR(30) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours INTEGER DEFAULT 5,
    thumbnail_url TEXT,
    modules JSONB DEFAULT '[]',
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create learning path progress table
CREATE TABLE IF NOT EXISTS learning_path_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    completed_modules TEXT[] DEFAULT ARRAY[]::TEXT[],
    quiz_scores JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, path_id)
);

-- Create user learning progress table
CREATE TABLE IF NOT EXISTS user_learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_conversations INTEGER DEFAULT 0,
    questions_asked INTEGER DEFAULT 0,
    topics_explored TEXT[] DEFAULT ARRAY[]::TEXT[],
    quizzes_taken INTEGER DEFAULT 0,
    total_quiz_score INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS learning_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(10),
    criteria JSONB NOT NULL,
    points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES learning_achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    module_id VARCHAR(100) NOT NULL,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create topic suggestions table
CREATE TABLE IF NOT EXISTS learning_topic_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(30) NOT NULL,
    suggestion TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_topic ON ai_conversations(topic);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON ai_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_paths_topic ON learning_paths(topic);
CREATE INDEX IF NOT EXISTS idx_learning_paths_difficulty ON learning_paths(difficulty);
CREATE INDEX IF NOT EXISTS idx_learning_paths_slug ON learning_paths(slug);

CREATE INDEX IF NOT EXISTS idx_learning_path_progress_user ON learning_path_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_progress_path ON learning_path_progress(path_id);

CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_topic_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON ai_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
    ON ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view learning paths"
    ON learning_paths FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users can view own progress"
    ON learning_path_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON learning_path_progress FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning progress"
    ON user_learning_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress"
    ON user_learning_progress FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view achievements"
    ON learning_achievements FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts"
    ON quiz_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can submit quiz attempts"
    ON quiz_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view topic suggestions"
    ON learning_topic_suggestions FOR SELECT
    USING (is_active = true);

-- Functions
CREATE OR REPLACE FUNCTION append_conversation_messages(
    conversation_id UUID,
    new_messages JSONB
)
RETURNS void AS $$
BEGIN
    UPDATE ai_conversations
    SET messages = messages || new_messages,
        message_count = message_count + jsonb_array_length(new_messages),
        updated_at = NOW()
    WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_learning_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER;
    last_date DATE;
BEGIN
    SELECT streak_days, last_active_date INTO current_streak, last_date
    FROM user_learning_progress
    WHERE user_id = p_user_id;

    IF last_date IS NULL THEN
        INSERT INTO user_learning_progress (user_id, streak_days, last_active_date)
        VALUES (p_user_id, 1, CURRENT_DATE)
        RETURNING streak_days INTO current_streak;
    ELSIF last_date = CURRENT_DATE - 1 THEN
        UPDATE user_learning_progress
        SET streak_days = streak_days + 1,
            longest_streak = GREATEST(longest_streak, streak_days + 1),
            last_active_date = CURRENT_DATE,
            last_active_at = NOW()
        WHERE user_id = p_user_id
        RETURNING streak_days INTO current_streak;
    ELSIF last_date = CURRENT_DATE THEN
        -- Already active today, return current streak
        NULL;
    ELSE
        UPDATE user_learning_progress
        SET streak_days = 1,
            last_active_date = CURRENT_DATE,
            last_active_at = NOW()
        WHERE user_id = p_user_id
        RETURNING streak_days INTO current_streak;
    END IF;

    RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_questions_asked(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO user_learning_progress (user_id, questions_asked)
    VALUES (p_user_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET
        questions_asked = user_learning_progress.questions_asked + 1,
        last_active_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_topic_explored(p_user_id UUID, p_topic TEXT)
RETURNS void AS $$
BEGIN
    UPDATE user_learning_progress
    SET topics_explored = array_append(
        CASE WHEN p_topic = ANY(topics_explored) THEN topics_explored ELSE topics_explored END,
        CASE WHEN NOT p_topic = ANY(topics_explored) THEN p_topic ELSE NULL END
    )
    WHERE user_id = p_user_id AND NOT p_topic = ANY(topics_explored);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_path_progress(p_user_id UUID, p_path_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_modules INTEGER;
    completed INTEGER;
BEGIN
    SELECT jsonb_array_length(modules) INTO total_modules
    FROM learning_paths WHERE id = p_path_id;

    SELECT array_length(completed_modules, 1) INTO completed
    FROM learning_path_progress
    WHERE user_id = p_user_id AND path_id = p_path_id;

    IF total_modules = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND((COALESCE(completed, 0)::NUMERIC / total_modules) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation count
CREATE OR REPLACE FUNCTION update_conversation_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_learning_progress (user_id, total_conversations)
        VALUES (NEW.user_id, 1)
        ON CONFLICT (user_id)
        DO UPDATE SET total_conversations = user_learning_progress.total_conversations + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_count ON ai_conversations;
CREATE TRIGGER trigger_update_conversation_count
    AFTER INSERT ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_count();

-- Insert default achievements
INSERT INTO learning_achievements (name, description, icon, criteria) VALUES
    ('First Steps', 'Started your learning journey', '🎯', '{"conversations": 1}'),
    ('Curious Mind', 'Asked 100 questions', '💡', '{"questions": 100}'),
    ('Week Warrior', '7-day learning streak', '🔥', '{"streak": 7}'),
    ('Quiz Master', 'Scored 100% on 5 quizzes', '🏆', '{"perfect_quizzes": 5}'),
    ('DeFi Explorer', 'Completed DeFi learning path', '🌐', '{"path_completed": "defi"}'),
    ('Security Expert', 'Completed security learning path', '🔒', '{"path_completed": "security"}'),
    ('Trading Pro', 'Completed trading learning path', '📈', '{"path_completed": "trading"}'),
    ('Crypto Scholar', 'Completed all learning paths', '🎓', '{"all_paths_completed": true}')
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE ai_conversations IS 'AI chat conversations for learning';
COMMENT ON TABLE learning_paths IS 'Structured learning paths with modules';
COMMENT ON TABLE learning_path_progress IS 'User progress on learning paths';
COMMENT ON TABLE user_learning_progress IS 'Overall learning statistics per user';
COMMENT ON TABLE learning_achievements IS 'Available achievements';
COMMENT ON TABLE user_achievements IS 'Unlocked achievements per user';
COMMENT ON TABLE quiz_attempts IS 'Quiz submission history';
