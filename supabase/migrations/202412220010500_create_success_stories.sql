-- Success Stories Tables
-- User-submitted crypto investment journeys

-- Create success stories table
CREATE TABLE IF NOT EXISTS success_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(200) NOT NULL,
    author_avatar TEXT,
    author_location VARCHAR(200),
    is_anonymous BOOLEAN DEFAULT false,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('first_investment', 'portfolio_growth', 'learning_journey', 'trading_success', 'defi_experience', 'mistake_learned', 'hodl_story', 'retirement_planning')),
    thumbnail_url TEXT,
    start_date DATE,
    investment_amount VARCHAR(50),
    returns VARCHAR(50),
    timeframe VARCHAR(50),
    key_lessons TEXT[],
    tags TEXT[],
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'featured', 'rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create story likes table
CREATE TABLE IF NOT EXISTS story_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES success_stories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- Create story comments table
CREATE TABLE IF NOT EXISTS story_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES success_stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for success stories
CREATE INDEX IF NOT EXISTS idx_success_stories_user ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_category ON success_stories(category);
CREATE INDEX IF NOT EXISTS idx_success_stories_status ON success_stories(status);
CREATE INDEX IF NOT EXISTS idx_success_stories_is_featured ON success_stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_success_stories_published ON success_stories(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_success_stories_views ON success_stories(views DESC);
CREATE INDEX IF NOT EXISTS idx_success_stories_likes ON success_stories(likes DESC);
CREATE INDEX IF NOT EXISTS idx_success_stories_slug ON success_stories(slug);
CREATE INDEX IF NOT EXISTS idx_success_stories_tags ON success_stories USING GIN(tags);

-- Indexes for story likes and comments
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON story_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_story ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user ON story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_parent ON story_comments(parent_id);

-- Enable RLS
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for success stories
CREATE POLICY "Public can view approved stories"
    ON success_stories FOR SELECT
    USING (status IN ('approved', 'featured'));

CREATE POLICY "Users can view own stories"
    ON success_stories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can submit stories"
    ON success_stories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own pending stories"
    ON success_stories FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

-- RLS Policies for story likes
CREATE POLICY "Users can like stories"
    ON story_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view likes"
    ON story_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can unlike"
    ON story_likes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for story comments
CREATE POLICY "Public can view comments"
    ON story_comments FOR SELECT
    USING (NOT is_hidden);

CREATE POLICY "Users can add comments"
    ON story_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own comments"
    ON story_comments FOR UPDATE
    USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION increment_story_views(story_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE success_stories
    SET views = views + 1
    WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_story_likes(story_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE success_stories s
    SET likes = (SELECT COUNT(*) FROM story_likes WHERE story_likes.story_id = s.id)
    WHERE s.id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_story_comments(story_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE success_stories
    SET comments_count = comments_count + 1
    WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_story_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_story_updated_at ON success_stories;
CREATE TRIGGER trigger_story_updated_at
    BEFORE UPDATE ON success_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_story_timestamp();

-- Comments
COMMENT ON TABLE success_stories IS 'User-submitted crypto investment journey stories';
COMMENT ON TABLE story_likes IS 'User likes on stories';
COMMENT ON TABLE story_comments IS 'Comments on success stories';
COMMENT ON COLUMN success_stories.status IS 'pending=awaiting review, approved=published, featured=highlighted, rejected=not approved';
