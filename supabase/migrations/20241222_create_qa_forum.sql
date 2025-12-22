-- Q&A Forum Tables
-- Community discussion platform with questions, answers, and voting

-- Create forum_questions table
CREATE TABLE IF NOT EXISTS forum_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(100),
    author_avatar TEXT,
    title VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(50) DEFAULT 'general',
    views INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    answer_count INTEGER DEFAULT 0,
    accepted_answer_id UUID,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forum_answers table
CREATE TABLE IF NOT EXISTS forum_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES forum_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(100),
    author_avatar TEXT,
    body TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forum_comments table
CREATE TABLE IF NOT EXISTS forum_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL,
    parent_type VARCHAR(20) NOT NULL CHECK (parent_type IN ('question', 'answer')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(100),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forum_votes table
CREATE TABLE IF NOT EXISTS forum_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('question', 'answer')),
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_id, target_type)
);

-- Indexes for forum_questions
CREATE INDEX IF NOT EXISTS idx_forum_questions_user_id ON forum_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_category ON forum_questions(category);
CREATE INDEX IF NOT EXISTS idx_forum_questions_created_at ON forum_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_upvotes ON forum_questions(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_views ON forum_questions(views DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_tags ON forum_questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_forum_questions_unanswered ON forum_questions(created_at DESC) WHERE answer_count = 0;
CREATE INDEX IF NOT EXISTS idx_forum_questions_search ON forum_questions USING GIN(to_tsvector('english', title || ' ' || body));

-- Indexes for forum_answers
CREATE INDEX IF NOT EXISTS idx_forum_answers_question_id ON forum_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_user_id ON forum_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_upvotes ON forum_answers(upvotes DESC);

-- Indexes for forum_comments
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_id, parent_type);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user_id ON forum_comments(user_id);

-- Indexes for forum_votes
CREATE INDEX IF NOT EXISTS idx_forum_votes_target ON forum_votes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_forum_votes_user ON forum_votes(user_id);

-- Enable RLS
ALTER TABLE forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_questions
CREATE POLICY "Anyone can view questions"
    ON forum_questions FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create questions"
    ON forum_questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions"
    ON forum_questions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
    ON forum_questions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for forum_answers
CREATE POLICY "Anyone can view answers"
    ON forum_answers FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create answers"
    ON forum_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
    ON forum_answers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
    ON forum_answers FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for forum_comments
CREATE POLICY "Anyone can view comments"
    ON forum_comments FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create comments"
    ON forum_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON forum_comments FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for forum_votes
CREATE POLICY "Users can view own votes"
    ON forum_votes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can vote"
    ON forum_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change own votes"
    ON forum_votes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes"
    ON forum_votes FOR DELETE
    USING (auth.uid() = user_id);

-- Function to increment answer count
CREATE OR REPLACE FUNCTION increment_answer_count(q_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE forum_questions
    SET answer_count = answer_count + 1,
        updated_at = NOW()
    WHERE id = q_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set author name from profile
CREATE OR REPLACE FUNCTION set_forum_author_name()
RETURNS TRIGGER AS $$
BEGIN
    SELECT username INTO NEW.author_name
    FROM user_profiles
    WHERE user_id = NEW.user_id;

    IF NEW.author_name IS NULL THEN
        NEW.author_name := 'Anonymous';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to set author name
DROP TRIGGER IF EXISTS trigger_set_question_author ON forum_questions;
CREATE TRIGGER trigger_set_question_author
    BEFORE INSERT ON forum_questions
    FOR EACH ROW
    EXECUTE FUNCTION set_forum_author_name();

DROP TRIGGER IF EXISTS trigger_set_answer_author ON forum_answers;
CREATE TRIGGER trigger_set_answer_author
    BEFORE INSERT ON forum_answers
    FOR EACH ROW
    EXECUTE FUNCTION set_forum_author_name();

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_forum_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_forum_questions_updated_at ON forum_questions;
CREATE TRIGGER trigger_forum_questions_updated_at
    BEFORE UPDATE ON forum_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_updated_at();

DROP TRIGGER IF EXISTS trigger_forum_answers_updated_at ON forum_answers;
CREATE TRIGGER trigger_forum_answers_updated_at
    BEFORE UPDATE ON forum_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_updated_at();

-- Comments
COMMENT ON TABLE forum_questions IS 'Community Q&A questions';
COMMENT ON TABLE forum_answers IS 'Answers to forum questions';
COMMENT ON TABLE forum_comments IS 'Comments on questions and answers';
COMMENT ON TABLE forum_votes IS 'User votes on questions and answers';
