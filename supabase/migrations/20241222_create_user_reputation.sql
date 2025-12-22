-- User Reputation System Tables
-- Gamification with points, badges, and levels

-- Create user_reputation table
CREATE TABLE IF NOT EXISTS user_reputation (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    badges JSONB DEFAULT '[]',
    stats JSONB DEFAULT '{"totalTrades":0,"articlesRead":0,"reviewsWritten":0,"questionsAnswered":0,"referrals":0,"daysActive":0,"coursesCompleted":0}',
    streak JSONB DEFAULT '{"current":0,"longest":0,"lastActivityDate":""}',
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reputation_history table for tracking point changes
CREATE TABLE IF NOT EXISTS reputation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    multiplier NUMERIC(3,2) DEFAULT 1.0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_reputation_points ON user_reputation(points DESC);
CREATE INDEX IF NOT EXISTS idx_user_reputation_rank ON user_reputation(rank) WHERE rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reputation_history_user_id ON reputation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_history_action ON reputation_history(action);
CREATE INDEX IF NOT EXISTS idx_reputation_history_created_at ON reputation_history(created_at);

-- Enable RLS
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reputation
-- Users can view all reputations (for leaderboard)
CREATE POLICY "Anyone can view reputations"
    ON user_reputation FOR SELECT
    USING (TRUE);

-- Users can only update their own reputation
CREATE POLICY "Users can update own reputation"
    ON user_reputation FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- System can insert for new users
CREATE POLICY "System can insert reputation"
    ON user_reputation FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reputation_history
-- Users can view their own history
CREATE POLICY "Users can view own history"
    ON reputation_history FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert history
CREATE POLICY "System can insert history"
    ON reputation_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to update ranks based on points
CREATE OR REPLACE FUNCTION update_reputation_ranks()
RETURNS void AS $$
BEGIN
    WITH ranked AS (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY points DESC) as new_rank
        FROM user_reputation
    )
    UPDATE user_reputation ur
    SET rank = r.new_rank
    FROM ranked r
    WHERE ur.user_id = r.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update rank when points change
CREATE OR REPLACE FUNCTION trigger_update_ranks()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all ranks when any points change
    PERFORM update_reputation_ranks();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reputation_points_change ON user_reputation;
CREATE TRIGGER trigger_reputation_points_change
    AFTER INSERT OR UPDATE OF points ON user_reputation
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_ranks();

-- Function to create reputation record for new users
CREATE OR REPLACE FUNCTION create_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_reputation (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create reputation for new users
DROP TRIGGER IF EXISTS trigger_create_user_reputation ON auth.users;
CREATE TRIGGER trigger_create_user_reputation
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_reputation();

-- Comments
COMMENT ON TABLE user_reputation IS 'User gamification data including points, badges, and streaks';
COMMENT ON TABLE reputation_history IS 'History of all point-earning actions';
COMMENT ON COLUMN user_reputation.badges IS 'JSONB array of earned badges with metadata';
COMMENT ON COLUMN user_reputation.streak IS 'Login streak information';
COMMENT ON COLUMN user_reputation.stats IS 'Activity statistics for badge calculation';
