-- Early Access Features Tables
-- Beta features enrollment and feedback system

-- Create early access features table
CREATE TABLE IF NOT EXISTS early_access_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('trading', 'portfolio', 'analytics', 'social', 'tools', 'integrations')),
    status VARCHAR(20) DEFAULT 'beta' CHECK (status IN ('alpha', 'beta', 'stable', 'deprecated')),
    version VARCHAR(20) DEFAULT '0.1.0',
    icon VARCHAR(50),
    screenshot_url TEXT,
    max_beta_users INTEGER,
    current_beta_users INTEGER DEFAULT 0,
    requirements TEXT[],
    changelog JSONB DEFAULT '[]',
    is_premium_only BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    release_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create beta enrollments table
CREATE TABLE IF NOT EXISTS beta_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES early_access_features(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked', 'graduated')),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    opted_out_at TIMESTAMPTZ,
    UNIQUE(feature_id, user_id)
);

-- Create feature feedback table
CREATE TABLE IF NOT EXISTS feature_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES early_access_features(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'suggestion', 'praise', 'question')),
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'resolved', 'closed')),
    admin_response TEXT,
    responded_at TIMESTAMPTZ,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback votes table
CREATE TABLE IF NOT EXISTS feedback_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES feature_feedback(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(feedback_id, user_id)
);

-- Create feature announcements table
CREATE TABLE IF NOT EXISTS feature_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID REFERENCES early_access_features(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'update' CHECK (type IN ('launch', 'update', 'deprecation', 'graduation')),
    is_pinned BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_early_access_features_category ON early_access_features(category);
CREATE INDEX IF NOT EXISTS idx_early_access_features_status ON early_access_features(status);
CREATE INDEX IF NOT EXISTS idx_early_access_features_slug ON early_access_features(slug);
CREATE INDEX IF NOT EXISTS idx_early_access_features_is_active ON early_access_features(is_active);

CREATE INDEX IF NOT EXISTS idx_beta_enrollments_feature ON beta_enrollments(feature_id);
CREATE INDEX IF NOT EXISTS idx_beta_enrollments_user ON beta_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_enrollments_status ON beta_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_feature_feedback_feature ON feature_feedback(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_user ON feature_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_type ON feature_feedback(type);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_status ON feature_feedback(status);

CREATE INDEX IF NOT EXISTS idx_feature_announcements_feature ON feature_announcements(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_announcements_published ON feature_announcements(published_at DESC);

-- Enable RLS
ALTER TABLE early_access_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active features"
    ON early_access_features FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users can enroll in beta"
    ON beta_enrollments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own enrollments"
    ON beta_enrollments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
    ON beta_enrollments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can submit feedback"
    ON feature_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view feedback"
    ON feature_feedback FOR SELECT
    USING (true);

CREATE POLICY "Users can update own feedback"
    ON feature_feedback FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can vote on feedback"
    ON feedback_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view votes"
    ON feedback_votes FOR SELECT
    USING (true);

CREATE POLICY "Users can remove own votes"
    ON feedback_votes FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view announcements"
    ON feature_announcements FOR SELECT
    USING (true);

-- Functions
CREATE OR REPLACE FUNCTION increment_beta_users(feature_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE early_access_features
    SET current_beta_users = current_beta_users + 1
    WHERE id = feature_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_beta_users(feature_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE early_access_features
    SET current_beta_users = GREATEST(current_beta_users - 1, 0)
    WHERE id = feature_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_feedback_upvotes(feedback_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE feature_feedback f
    SET upvotes = (SELECT COUNT(*) FROM feedback_votes WHERE feedback_votes.feedback_id = f.id)
    WHERE f.id = feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_feature_usage(p_feature_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE beta_enrollments
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE feature_id = p_feature_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update beta user count
CREATE OR REPLACE FUNCTION update_beta_user_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        PERFORM increment_beta_users(NEW.feature_id);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            PERFORM increment_beta_users(NEW.feature_id);
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            PERFORM decrement_beta_users(NEW.feature_id);
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        PERFORM decrement_beta_users(OLD.feature_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_beta_user_count ON beta_enrollments;
CREATE TRIGGER trigger_update_beta_user_count
    AFTER INSERT OR UPDATE OR DELETE ON beta_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_beta_user_count();

-- Comments
COMMENT ON TABLE early_access_features IS 'Beta features available for early access';
COMMENT ON TABLE beta_enrollments IS 'User enrollments in beta features';
COMMENT ON TABLE feature_feedback IS 'User feedback on beta features';
COMMENT ON TABLE feedback_votes IS 'Upvotes on feedback items';
COMMENT ON TABLE feature_announcements IS 'Announcements about feature updates';
