-- Sponsored Content Tables
-- Native advertising and sponsored articles system

-- Sponsors table (advertisers/brands)
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional linked user account
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(200),
    industry VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
    billing_email VARCHAR(255),
    company_address TEXT,
    tax_id VARCHAR(100),
    total_spent NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsored content campaigns
CREATE TABLE IF NOT EXISTS sponsored_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('article', 'native_ad', 'banner', 'newsletter', 'video')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'active', 'paused', 'completed', 'rejected')),
    budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
    spent NUMERIC(12, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    targeting JSONB DEFAULT '{}', -- { categories: [], keywords: [], countries: [], devices: [] }
    frequency_cap INTEGER, -- Max impressions per user per day
    priority INTEGER DEFAULT 0, -- Higher = more priority
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsored articles (native content)
CREATE TABLE IF NOT EXISTS sponsored_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES sponsored_campaigns(id) ON DELETE CASCADE,
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    author_name VARCHAR(200), -- Can be sponsor name or custom author
    author_avatar TEXT,
    category VARCHAR(50),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    cta_text VARCHAR(100), -- Call-to-action button text
    cta_url TEXT, -- Call-to-action destination URL
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'archived', 'rejected')),
    review_notes TEXT, -- Notes from content review
    seo_title VARCHAR(200),
    seo_description VARCHAR(300),
    read_time_minutes INTEGER DEFAULT 5,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Native ads (in-feed sponsored items)
CREATE TABLE IF NOT EXISTS native_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES sponsored_campaigns(id) ON DELETE CASCADE,
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    headline VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    image_url TEXT,
    destination_url TEXT NOT NULL,
    display_url VARCHAR(100), -- Shortened display URL
    cta_text VARCHAR(50) DEFAULT 'Learn More',
    placement VARCHAR(50) NOT NULL CHECK (placement IN ('article_feed', 'sidebar', 'in_article', 'newsletter', 'learn_page', 'dashboard')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'rejected')),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsored content performance tracking
CREATE TABLE IF NOT EXISTS sponsored_content_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('article', 'native_ad', 'banner')),
    content_id UUID NOT NULL,
    campaign_id UUID REFERENCES sponsored_campaigns(id) ON DELETE SET NULL,
    sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('impression', 'view', 'click', 'cta_click', 'share', 'scroll_depth', 'time_on_page', 'conversion')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    page_url TEXT,
    referrer TEXT,
    device_type VARCHAR(20),
    country VARCHAR(2),
    city VARCHAR(100),
    metadata JSONB DEFAULT '{}', -- Additional event data (scroll %, time, conversion value, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsored content billing/invoices
CREATE TABLE IF NOT EXISTS sponsored_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES sponsored_campaigns(id) ON DELETE SET NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    cpm_rate NUMERIC(8, 4) DEFAULT 0, -- Cost per 1000 impressions
    cpc_rate NUMERIC(8, 4) DEFAULT 0, -- Cost per click
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue', 'cancelled')),
    invoice_number VARCHAR(50),
    invoice_url TEXT,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disclosure compliance tracking
CREATE TABLE IF NOT EXISTS sponsored_disclosures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL,
    content_id UUID NOT NULL,
    disclosure_text TEXT NOT NULL DEFAULT 'Sponsored Content',
    disclosure_position VARCHAR(20) DEFAULT 'top' CHECK (disclosure_position IN ('top', 'bottom', 'inline', 'overlay')),
    ftc_compliant BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsors_status ON sponsors(status);
CREATE INDEX IF NOT EXISTS idx_sponsors_slug ON sponsors(slug);

CREATE INDEX IF NOT EXISTS idx_campaigns_sponsor ON sponsored_campaigns(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON sponsored_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON sponsored_campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_sponsored_articles_campaign ON sponsored_articles(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_articles_status ON sponsored_articles(status);
CREATE INDEX IF NOT EXISTS idx_sponsored_articles_slug ON sponsored_articles(slug);
CREATE INDEX IF NOT EXISTS idx_sponsored_articles_published ON sponsored_articles(published_at DESC) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_native_ads_campaign ON native_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_native_ads_placement ON native_ads(placement);
CREATE INDEX IF NOT EXISTS idx_native_ads_status ON native_ads(status);

CREATE INDEX IF NOT EXISTS idx_content_events_campaign ON sponsored_content_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_events_content ON sponsored_content_events(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_events_created ON sponsored_content_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_events_type ON sponsored_content_events(event_type);

CREATE INDEX IF NOT EXISTS idx_billing_sponsor ON sponsored_billing(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON sponsored_billing(status);

-- Enable RLS
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_content_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_disclosures ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Sponsors - users can view their own sponsor profile
CREATE POLICY "Users can view own sponsor profile"
    ON sponsors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sponsor profile"
    ON sponsors FOR UPDATE
    USING (auth.uid() = user_id);

-- Campaigns - sponsor users can manage their campaigns
CREATE POLICY "Sponsor users can view own campaigns"
    ON sponsored_campaigns FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM sponsors WHERE sponsors.id = sponsored_campaigns.sponsor_id AND sponsors.user_id = auth.uid()
    ));

CREATE POLICY "Sponsor users can manage own campaigns"
    ON sponsored_campaigns FOR ALL
    USING (EXISTS (
        SELECT 1 FROM sponsors WHERE sponsors.id = sponsored_campaigns.sponsor_id AND sponsors.user_id = auth.uid()
    ));

-- Sponsored articles - public can view published, sponsors can manage their own
CREATE POLICY "Public can view published sponsored articles"
    ON sponsored_articles FOR SELECT
    USING (status = 'published' AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Sponsor users can manage own articles"
    ON sponsored_articles FOR ALL
    USING (EXISTS (
        SELECT 1 FROM sponsors WHERE sponsors.id = sponsored_articles.sponsor_id AND sponsors.user_id = auth.uid()
    ));

-- Native ads - sponsors can manage their own
CREATE POLICY "Sponsor users can manage own native ads"
    ON native_ads FOR ALL
    USING (EXISTS (
        SELECT 1 FROM sponsors WHERE sponsors.id = native_ads.sponsor_id AND sponsors.user_id = auth.uid()
    ));

-- Events - sponsors can view their own analytics
CREATE POLICY "Sponsor users can view own events"
    ON sponsored_content_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM sponsors WHERE sponsors.id = sponsored_content_events.sponsor_id AND sponsors.user_id = auth.uid()
    ));

-- Billing - sponsors can view their own billing
CREATE POLICY "Sponsor users can view own billing"
    ON sponsored_billing FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM sponsors WHERE sponsors.id = sponsored_billing.sponsor_id AND sponsors.user_id = auth.uid()
    ));

-- Functions

-- Track sponsored content impression/view
CREATE OR REPLACE FUNCTION track_sponsored_content_view(
    p_content_type VARCHAR(20),
    p_content_id UUID,
    p_event_type VARCHAR(30) DEFAULT 'view',
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
    v_campaign_id UUID;
    v_sponsor_id UUID;
BEGIN
    -- Get campaign and sponsor IDs based on content type
    IF p_content_type = 'article' THEN
        SELECT campaign_id, sponsor_id INTO v_campaign_id, v_sponsor_id
        FROM sponsored_articles WHERE id = p_content_id;

        -- Update view count
        IF p_event_type = 'view' THEN
            UPDATE sponsored_articles SET view_count = view_count + 1 WHERE id = p_content_id;
        ELSIF p_event_type = 'click' OR p_event_type = 'cta_click' THEN
            UPDATE sponsored_articles SET click_count = click_count + 1 WHERE id = p_content_id;
        ELSIF p_event_type = 'share' THEN
            UPDATE sponsored_articles SET share_count = share_count + 1 WHERE id = p_content_id;
        END IF;
    ELSIF p_content_type = 'native_ad' THEN
        SELECT campaign_id, sponsor_id INTO v_campaign_id, v_sponsor_id
        FROM native_ads WHERE id = p_content_id;

        -- Update counts
        IF p_event_type = 'impression' THEN
            UPDATE native_ads SET impressions = impressions + 1 WHERE id = p_content_id;
        ELSIF p_event_type = 'click' THEN
            UPDATE native_ads SET clicks = clicks + 1 WHERE id = p_content_id;
        END IF;
    END IF;

    -- Log the event
    INSERT INTO sponsored_content_events (
        content_type, content_id, campaign_id, sponsor_id,
        event_type, user_id, session_id, metadata
    ) VALUES (
        p_content_type, p_content_id, v_campaign_id, v_sponsor_id,
        p_event_type, p_user_id, p_session_id, p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active native ads for a placement
CREATE OR REPLACE FUNCTION get_active_native_ads(
    p_placement VARCHAR(50),
    p_limit INTEGER DEFAULT 3,
    p_user_id UUID DEFAULT NULL
)
RETURNS SETOF native_ads AS $$
BEGIN
    RETURN QUERY
    SELECT na.*
    FROM native_ads na
    JOIN sponsored_campaigns sc ON sc.id = na.campaign_id
    WHERE na.placement = p_placement
      AND na.status = 'active'
      AND sc.status = 'active'
      AND (sc.start_date IS NULL OR sc.start_date <= CURRENT_DATE)
      AND (sc.end_date IS NULL OR sc.end_date >= CURRENT_DATE)
      AND sc.spent < sc.budget
    ORDER BY sc.priority DESC, RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get campaign analytics summary
CREATE OR REPLACE FUNCTION get_campaign_analytics(
    p_campaign_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'impressions', COUNT(*) FILTER (WHERE event_type = 'impression'),
        'views', COUNT(*) FILTER (WHERE event_type = 'view'),
        'clicks', COUNT(*) FILTER (WHERE event_type IN ('click', 'cta_click')),
        'shares', COUNT(*) FILTER (WHERE event_type = 'share'),
        'conversions', COUNT(*) FILTER (WHERE event_type = 'conversion'),
        'ctr', CASE
            WHEN COUNT(*) FILTER (WHERE event_type = 'impression') > 0
            THEN ROUND(
                (COUNT(*) FILTER (WHERE event_type = 'click')::NUMERIC /
                 COUNT(*) FILTER (WHERE event_type = 'impression')::NUMERIC) * 100, 2
            )
            ELSE 0
        END,
        'unique_users', COUNT(DISTINCT user_id),
        'by_device', (
            SELECT jsonb_object_agg(
                COALESCE(device_type, 'unknown'),
                cnt
            )
            FROM (
                SELECT device_type, COUNT(*) as cnt
                FROM sponsored_content_events
                WHERE campaign_id = p_campaign_id
                  AND created_at::DATE BETWEEN p_start_date AND p_end_date
                GROUP BY device_type
            ) device_stats
        ),
        'by_day', (
            SELECT jsonb_agg(jsonb_build_object(
                'date', day,
                'impressions', impressions,
                'clicks', clicks
            ))
            FROM (
                SELECT
                    created_at::DATE as day,
                    COUNT(*) FILTER (WHERE event_type = 'impression') as impressions,
                    COUNT(*) FILTER (WHERE event_type = 'click') as clicks
                FROM sponsored_content_events
                WHERE campaign_id = p_campaign_id
                  AND created_at::DATE BETWEEN p_start_date AND p_end_date
                GROUP BY created_at::DATE
                ORDER BY day
            ) daily_stats
        )
    ) INTO result
    FROM sponsored_content_events
    WHERE campaign_id = p_campaign_id
      AND created_at::DATE BETWEEN p_start_date AND p_end_date;

    RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_sponsored_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sponsors_updated_at
    BEFORE UPDATE ON sponsors
    FOR EACH ROW EXECUTE FUNCTION update_sponsored_updated_at();

CREATE TRIGGER trigger_campaigns_updated_at
    BEFORE UPDATE ON sponsored_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_sponsored_updated_at();

CREATE TRIGGER trigger_articles_updated_at
    BEFORE UPDATE ON sponsored_articles
    FOR EACH ROW EXECUTE FUNCTION update_sponsored_updated_at();

CREATE TRIGGER trigger_native_ads_updated_at
    BEFORE UPDATE ON native_ads
    FOR EACH ROW EXECUTE FUNCTION update_sponsored_updated_at();

-- Comments
COMMENT ON TABLE sponsors IS 'Advertiser/brand accounts for sponsored content';
COMMENT ON TABLE sponsored_campaigns IS 'Advertising campaigns containing multiple pieces of content';
COMMENT ON TABLE sponsored_articles IS 'Native sponsored articles/content marketing';
COMMENT ON TABLE native_ads IS 'In-feed native advertisements';
COMMENT ON TABLE sponsored_content_events IS 'Analytics events for sponsored content';
COMMENT ON TABLE sponsored_billing IS 'Billing records for sponsored content';
COMMENT ON TABLE sponsored_disclosures IS 'FTC disclosure compliance tracking';
