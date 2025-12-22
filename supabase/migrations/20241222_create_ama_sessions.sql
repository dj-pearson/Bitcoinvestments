-- Expert AMA Sessions Tables
-- Live Q&A sessions with cryptocurrency experts

-- Create AMA experts table
CREATE TABLE IF NOT EXISTS ama_experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    title VARCHAR(200),
    company VARCHAR(200),
    bio TEXT,
    avatar_url TEXT,
    expertise TEXT[],
    social_links JSONB DEFAULT '{}',
    total_sessions INTEGER DEFAULT 0,
    average_rating NUMERIC(2, 1) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AMA sessions table
CREATE TABLE IF NOT EXISTS ama_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    expert_id UUID NOT NULL REFERENCES ama_experts(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration INTEGER DEFAULT 60, -- minutes
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    is_premium BOOLEAN DEFAULT false,
    max_attendees INTEGER,
    attendee_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    stream_url TEXT,
    recording_url TEXT,
    topics TEXT[],
    thumbnail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AMA registrations table
CREATE TABLE IF NOT EXISTS ama_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ama_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attended BOOLEAN DEFAULT false,
    reminder_sent BOOLEAN DEFAULT false,
    UNIQUE(session_id, user_id)
);

-- Create AMA questions table
CREATE TABLE IF NOT EXISTS ama_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ama_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'answered', 'rejected')),
    answer TEXT,
    answered_at TIMESTAMPTZ,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AMA question votes table
CREATE TABLE IF NOT EXISTS ama_question_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES ama_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_id, user_id)
);

-- Create AMA session ratings table
CREATE TABLE IF NOT EXISTS ama_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ama_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ama_sessions_expert ON ama_sessions(expert_id);
CREATE INDEX IF NOT EXISTS idx_ama_sessions_status ON ama_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ama_sessions_scheduled ON ama_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ama_sessions_is_premium ON ama_sessions(is_premium);
CREATE INDEX IF NOT EXISTS idx_ama_sessions_slug ON ama_sessions(slug);

CREATE INDEX IF NOT EXISTS idx_ama_registrations_session ON ama_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_ama_registrations_user ON ama_registrations(user_id);

CREATE INDEX IF NOT EXISTS idx_ama_questions_session ON ama_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_ama_questions_user ON ama_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_ama_questions_status ON ama_questions(status);
CREATE INDEX IF NOT EXISTS idx_ama_questions_upvotes ON ama_questions(upvotes DESC);

-- Enable RLS
ALTER TABLE ama_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ama_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ama_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ama_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ama_question_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ama_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view experts"
    ON ama_experts FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view sessions"
    ON ama_sessions FOR SELECT
    USING (status != 'cancelled');

CREATE POLICY "Users can register for sessions"
    ON ama_registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own registrations"
    ON ama_registrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view approved questions"
    ON ama_questions FOR SELECT
    USING (status IN ('approved', 'answered') OR auth.uid() = user_id);

CREATE POLICY "Users can submit questions"
    ON ama_questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can vote on questions"
    ON ama_question_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view votes"
    ON ama_question_votes FOR SELECT
    USING (true);

CREATE POLICY "Users can rate sessions"
    ON ama_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ratings"
    ON ama_ratings FOR SELECT
    USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION increment_ama_attendees(session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE ama_sessions
    SET attendee_count = attendee_count + 1
    WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_ama_questions(session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE ama_sessions
    SET question_count = question_count + 1
    WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_question_upvotes(question_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE ama_questions q
    SET upvotes = (SELECT COUNT(*) FROM ama_question_votes WHERE ama_question_votes.question_id = q.id)
    WHERE q.id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update expert session count and rating after session ends
CREATE OR REPLACE FUNCTION update_expert_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ended' AND OLD.status != 'ended' THEN
        UPDATE ama_experts
        SET total_sessions = total_sessions + 1,
            average_rating = (
                SELECT COALESCE(AVG(r.rating), 0)
                FROM ama_ratings r
                JOIN ama_sessions s ON r.session_id = s.id
                WHERE s.expert_id = NEW.expert_id
            )
        WHERE id = NEW.expert_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_expert_stats ON ama_sessions;
CREATE TRIGGER trigger_update_expert_stats
    AFTER UPDATE ON ama_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_stats();

-- Comments
COMMENT ON TABLE ama_experts IS 'Cryptocurrency experts hosting AMA sessions';
COMMENT ON TABLE ama_sessions IS 'Scheduled and past AMA sessions';
COMMENT ON TABLE ama_registrations IS 'User registrations for AMA sessions';
COMMENT ON TABLE ama_questions IS 'Questions submitted for AMA sessions';
