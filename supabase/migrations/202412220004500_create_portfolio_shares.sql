-- Portfolio Sharing Tables
-- Allows users to share portfolios via public links with privacy controls

-- Create portfolio_shares table
CREATE TABLE IF NOT EXISTS portfolio_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_code VARCHAR(20) UNIQUE NOT NULL,
    share_url TEXT NOT NULL,

    -- Privacy settings
    show_amounts BOOLEAN DEFAULT FALSE,
    show_cost_basis BOOLEAN DEFAULT FALSE,
    show_profit_loss BOOLEAN DEFAULT TRUE,
    show_transactions BOOLEAN DEFAULT FALSE,

    -- Share settings
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    password_hash TEXT,

    -- Tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,

    -- Metadata
    title TEXT,
    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create share_views table for detailed analytics
CREATE TABLE IF NOT EXISTS share_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES portfolio_shares(id) ON DELETE CASCADE,
    viewer_ip_hash TEXT, -- Hashed for privacy
    user_agent TEXT,
    referer TEXT,
    country_code VARCHAR(2),
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for portfolio_shares
CREATE INDEX IF NOT EXISTS idx_portfolio_shares_portfolio_id ON portfolio_shares(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_shares_user_id ON portfolio_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_shares_share_code ON portfolio_shares(share_code) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_portfolio_shares_expires_at ON portfolio_shares(expires_at) WHERE expires_at IS NOT NULL;

-- Indexes for share_views
CREATE INDEX IF NOT EXISTS idx_share_views_share_id ON share_views(share_id);
CREATE INDEX IF NOT EXISTS idx_share_views_viewed_at ON share_views(viewed_at);
-- Unique index without DATE function to avoid immutability issues
CREATE INDEX IF NOT EXISTS idx_share_views_unique_view ON share_views(share_id, viewer_ip_hash, viewed_at);

-- Enable RLS
ALTER TABLE portfolio_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio_shares
-- Users can read their own shares
CREATE POLICY "Users can view own shares"
    ON portfolio_shares FOR SELECT
    USING (auth.uid() = user_id);

-- Anyone can view active, non-expired shares by share_code (for public access)
CREATE POLICY "Public can view active shares"
    ON portfolio_shares FOR SELECT
    USING (
        is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Users can create shares for their portfolios
CREATE POLICY "Users can create shares"
    ON portfolio_shares FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM portfolios
            WHERE id = portfolio_id AND user_id = auth.uid()
        )
    );

-- Users can update their own shares
CREATE POLICY "Users can update own shares"
    ON portfolio_shares FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete own shares"
    ON portfolio_shares FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for share_views
-- Share owners can view analytics
CREATE POLICY "Share owners can view analytics"
    ON share_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM portfolio_shares
            WHERE id = share_id AND user_id = auth.uid()
        )
    );

-- Anyone can insert views (for tracking)
CREATE POLICY "Anyone can record views"
    ON share_views FOR INSERT
    WITH CHECK (TRUE);

-- Function to increment view count atomically
CREATE OR REPLACE FUNCTION increment_share_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE portfolio_shares
    SET
        view_count = view_count + 1,
        last_viewed_at = NOW()
    WHERE id = NEW.share_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment view count
DROP TRIGGER IF EXISTS trigger_increment_share_views ON share_views;
CREATE TRIGGER trigger_increment_share_views
    AFTER INSERT ON share_views
    FOR EACH ROW
    EXECUTE FUNCTION increment_share_view_count();

-- Function to clean up expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS void AS $$
BEGIN
    UPDATE portfolio_shares
    SET is_active = FALSE
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_portfolio_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_portfolio_shares_updated_at ON portfolio_shares;
CREATE TRIGGER trigger_portfolio_shares_updated_at
    BEFORE UPDATE ON portfolio_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_shares_updated_at();

-- Comments
COMMENT ON TABLE portfolio_shares IS 'Stores portfolio sharing configurations with privacy controls';
COMMENT ON TABLE share_views IS 'Tracks views on shared portfolios for analytics';
COMMENT ON COLUMN portfolio_shares.share_code IS 'Unique code for the share URL';
COMMENT ON COLUMN portfolio_shares.password_hash IS 'SHA-256 hash of password if protected';
COMMENT ON COLUMN share_views.viewer_ip_hash IS 'Hashed IP for privacy-respecting analytics';
