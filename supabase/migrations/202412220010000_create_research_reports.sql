-- Research Reports Tables
-- Premium weekly crypto analysis and research

-- Create research authors table
CREATE TABLE IF NOT EXISTS research_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    title VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    expertise TEXT[],
    social_links JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research reports table
CREATE TABLE IF NOT EXISTS research_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('weekly_market', 'token_analysis', 'defi_deep_dive', 'macro_outlook', 'sector_report', 'special_report')),
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    author_id UUID REFERENCES research_authors(id) ON DELETE SET NULL,
    is_premium BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ,
    read_time INTEGER DEFAULT 10, -- minutes
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    tags TEXT[],
    assets JSONB DEFAULT '[]',
    key_takeaways TEXT[],
    pdf_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create report likes table
CREATE TABLE IF NOT EXISTS report_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES research_reports(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, report_id)
);

-- Create report downloads table
CREATE TABLE IF NOT EXISTS report_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES research_reports(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create report comments table
CREATE TABLE IF NOT EXISTS report_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES research_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES report_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research subscribers table
CREATE TABLE IF NOT EXISTS research_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_premium BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{"weekly_market": true, "token_analysis": true, "defi_deep_dive": true}',
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_research_reports_type ON research_reports(type);
CREATE INDEX IF NOT EXISTS idx_research_reports_status ON research_reports(status);
CREATE INDEX IF NOT EXISTS idx_research_reports_is_premium ON research_reports(is_premium);
CREATE INDEX IF NOT EXISTS idx_research_reports_published_at ON research_reports(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_reports_author ON research_reports(author_id);
CREATE INDEX IF NOT EXISTS idx_research_reports_slug ON research_reports(slug);
CREATE INDEX IF NOT EXISTS idx_research_reports_tags ON research_reports USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_research_reports_views ON research_reports(views DESC);

CREATE INDEX IF NOT EXISTS idx_report_likes_user ON report_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_report_likes_report ON report_likes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_downloads_user ON report_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_report_downloads_report ON report_downloads(report_id);
CREATE INDEX IF NOT EXISTS idx_report_comments_report ON report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_comments_user ON report_comments(user_id);

-- Enable RLS
ALTER TABLE research_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view authors"
    ON research_authors FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view published reports"
    ON research_reports FOR SELECT
    USING (status = 'published');

CREATE POLICY "Users can like reports"
    ON report_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own likes"
    ON report_likes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can unlike reports"
    ON report_likes FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can download reports"
    ON report_downloads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own downloads"
    ON report_downloads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view comments"
    ON report_comments FOR SELECT
    USING (NOT is_hidden);

CREATE POLICY "Users can add comments"
    ON report_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own comments"
    ON report_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can subscribe"
    ON research_subscribers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view own subscription"
    ON research_subscribers FOR SELECT
    USING (auth.uid() = user_id OR email = current_setting('request.jwt.claims', true)::json->>'email');

-- Functions
CREATE OR REPLACE FUNCTION increment_report_views(report_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE research_reports
    SET views = views + 1
    WHERE id = report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_report_downloads(report_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE research_reports
    SET downloads = downloads + 1
    WHERE id = report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_report_likes(report_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE research_reports r
    SET likes = (SELECT COUNT(*) FROM report_likes WHERE report_likes.report_id = r.id)
    WHERE r.id = report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE research_reports IS 'Premium research reports and market analysis';
COMMENT ON TABLE research_authors IS 'Authors of research content';
COMMENT ON TABLE report_likes IS 'User likes on reports';
COMMENT ON TABLE report_downloads IS 'Download tracking for reports';
COMMENT ON TABLE research_subscribers IS 'Email subscribers for research updates';
