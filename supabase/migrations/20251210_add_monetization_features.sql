-- Monetization Features Migration
-- Adds tables for: Research Reports, Sponsored Learning Paths, Dashboard Widgets,
-- Course Marketplace, and Consultation Marketplace

-- =============================================================================
-- 1. RESEARCH REPORTS (Pay-Per-Report)
-- Individual deep-dive coin research reports for $5-15 each
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.research_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Report details
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    cryptocurrency_id TEXT NOT NULL, -- e.g., 'bitcoin', 'ethereum'
    cryptocurrency_name TEXT NOT NULL,
    cryptocurrency_symbol TEXT NOT NULL,

    -- Content
    summary TEXT NOT NULL, -- Public preview
    full_content TEXT NOT NULL, -- Paid content
    key_findings JSONB DEFAULT '[]', -- Array of key points

    -- Pricing
    price DECIMAL(10, 2) NOT NULL DEFAULT 9.99,
    currency TEXT DEFAULT 'USD',
    stripe_price_id TEXT,

    -- Metadata
    author_name TEXT DEFAULT 'Bitcoin Investments Research Team',
    report_type TEXT NOT NULL CHECK (report_type IN ('deep_dive', 'technical_analysis', 'fundamental', 'market_outlook', 'sector_report')),
    pages_count INTEGER DEFAULT 10,

    -- AI-generated flag
    ai_generated BOOLEAN DEFAULT false,
    ai_model_used TEXT,

    -- Publishing
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,

    -- Stats
    view_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    average_rating DECIMAL(2, 1) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_report_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES public.research_reports(id) ON DELETE CASCADE,

    -- Payment
    price_paid DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_checkout_session_id TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    purchased_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,

    -- Access tracking
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,

    -- User feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, report_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_research_reports_slug ON public.research_reports(slug);
CREATE INDEX IF NOT EXISTS idx_research_reports_crypto ON public.research_reports(cryptocurrency_id);
CREATE INDEX IF NOT EXISTS idx_research_reports_status ON public.research_reports(status);
CREATE INDEX IF NOT EXISTS idx_research_report_purchases_user ON public.research_report_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_research_report_purchases_report ON public.research_report_purchases(report_id);

-- RLS
ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_report_purchases ENABLE ROW LEVEL SECURITY;

-- Everyone can view published reports (summary only)
CREATE POLICY "Anyone can view published reports" ON public.research_reports
    FOR SELECT USING (status = 'published');

-- Users can view their own purchases
CREATE POLICY "Users can view own report purchases" ON public.research_report_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- System can manage all
CREATE POLICY "System can manage reports" ON public.research_reports
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage report purchases" ON public.research_report_purchases
    FOR ALL USING (true) WITH CHECK (true);


-- =============================================================================
-- 2. SPONSORED LEARNING PATHS
-- Exchanges sponsor educational content (e.g., 'Coinbase Beginner Path')
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sponsored_learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Sponsor details
    sponsor_name TEXT NOT NULL, -- e.g., 'Coinbase', 'Binance'
    sponsor_logo_url TEXT,
    sponsor_website TEXT,
    sponsor_affiliate_url TEXT,

    -- Path details
    title TEXT NOT NULL, -- e.g., 'Coinbase Beginner Path'
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),

    -- Content structure
    modules JSONB NOT NULL DEFAULT '[]', -- Array of module objects
    total_duration_minutes INTEGER DEFAULT 0,
    lessons_count INTEGER DEFAULT 0,

    -- Styling
    primary_color TEXT DEFAULT '#F7931A',
    secondary_color TEXT DEFAULT '#4A90A4',
    badge_image_url TEXT,

    -- Sponsorship terms
    sponsorship_type TEXT NOT NULL CHECK (sponsorship_type IN ('exclusive', 'featured', 'standard')),
    monthly_fee DECIMAL(10, 2),
    contract_start_date DATE,
    contract_end_date DATE,

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired')),

    -- Stats
    enrollments_count INTEGER DEFAULT 0,
    completions_count INTEGER DEFAULT 0,
    affiliate_clicks INTEGER DEFAULT 0,
    affiliate_conversions INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_path_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    path_id UUID NOT NULL REFERENCES public.sponsored_learning_paths(id) ON DELETE CASCADE,

    -- Progress tracking
    current_module INTEGER DEFAULT 0,
    completed_modules JSONB DEFAULT '[]', -- Array of completed module IDs
    progress_percentage DECIMAL(5, 2) DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'abandoned')),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Certificate
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, path_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sponsored_paths_slug ON public.sponsored_learning_paths(slug);
CREATE INDEX IF NOT EXISTS idx_sponsored_paths_status ON public.sponsored_learning_paths(status);
CREATE INDEX IF NOT EXISTS idx_sponsored_paths_sponsor ON public.sponsored_learning_paths(sponsor_name);
CREATE INDEX IF NOT EXISTS idx_path_enrollments_user ON public.learning_path_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_path_enrollments_path ON public.learning_path_enrollments(path_id);

-- RLS
ALTER TABLE public.sponsored_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active learning paths" ON public.sponsored_learning_paths
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view own enrollments" ON public.learning_path_enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in paths" ON public.learning_path_enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments" ON public.learning_path_enrollments
    FOR UPDATE USING (auth.uid() = user_id);


-- =============================================================================
-- 3. CUSTOM DASHBOARD WIDGETS (Premium Feature)
-- Premium users can customize dashboard layout and add widgets
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_dashboard_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Dashboard info
    name TEXT NOT NULL DEFAULT 'My Dashboard',
    is_default BOOLEAN DEFAULT false,

    -- Layout configuration
    layout JSONB NOT NULL DEFAULT '[]', -- Grid layout positions
    widgets JSONB NOT NULL DEFAULT '[]', -- Widget configurations

    -- Theme
    theme TEXT DEFAULT 'default',
    compact_mode BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Available widget types for reference
CREATE TABLE IF NOT EXISTS public.dashboard_widget_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('market', 'portfolio', 'news', 'tools', 'social', 'custom')),
    default_size JSONB DEFAULT '{"w": 2, "h": 2}',
    min_size JSONB DEFAULT '{"w": 1, "h": 1}',
    max_size JSONB DEFAULT '{"w": 4, "h": 4}',
    premium_only BOOLEAN DEFAULT false,
    settings_schema JSONB, -- JSON Schema for widget settings
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_user ON public.user_dashboard_configs(user_id);

-- RLS
ALTER TABLE public.user_dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widget_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dashboards" ON public.user_dashboard_configs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view widget types" ON public.dashboard_widget_types
    FOR SELECT USING (true);

-- Insert default widget types
INSERT INTO public.dashboard_widget_types (id, name, description, category, premium_only) VALUES
    ('price_ticker', 'Price Ticker', 'Live cryptocurrency price display', 'market', false),
    ('portfolio_summary', 'Portfolio Summary', 'Overview of your portfolio value', 'portfolio', false),
    ('fear_greed', 'Fear & Greed Index', 'Market sentiment indicator', 'market', false),
    ('trending_coins', 'Trending Coins', 'Currently trending cryptocurrencies', 'market', false),
    ('news_feed', 'News Feed', 'Latest crypto news', 'news', false),
    ('price_chart', 'Price Chart', 'Interactive price chart for any coin', 'market', true),
    ('portfolio_chart', 'Portfolio Performance', 'Historical portfolio performance chart', 'portfolio', true),
    ('price_alerts', 'Price Alerts', 'Your active price alerts', 'tools', true),
    ('gas_tracker', 'Gas Tracker', 'Ethereum gas prices', 'tools', false),
    ('watchlist', 'Watchlist', 'Custom coin watchlist', 'portfolio', true),
    ('calculator', 'Quick Calculator', 'DCA/Profit calculator widget', 'tools', true),
    ('heatmap', 'Market Heatmap', 'Visual market overview', 'market', true),
    ('dominance_chart', 'BTC Dominance', 'Bitcoin market dominance chart', 'market', true),
    ('exchange_flows', 'Exchange Flows', 'Inflow/outflow tracking', 'market', true),
    ('social_sentiment', 'Social Sentiment', 'Twitter/Reddit sentiment analysis', 'social', true),
    ('upcoming_events', 'Upcoming Events', 'Crypto calendar events', 'news', true),
    ('custom_notes', 'Notes', 'Personal notes widget', 'custom', true)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 4. CRYPTO COURSE MARKETPLACE
-- Partner with educators to sell courses, take 20-30% commission
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.course_educators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Educator profile
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    website TEXT,
    social_links JSONB DEFAULT '{}',

    -- Credentials
    credentials TEXT[], -- Array of credentials/certifications
    years_experience INTEGER,
    specializations TEXT[], -- e.g., ['DeFi', 'Technical Analysis', 'NFTs']

    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verification_documents JSONB,

    -- Commission settings
    commission_rate DECIMAL(5, 2) DEFAULT 25.00, -- Platform takes 25% by default
    payout_method TEXT CHECK (payout_method IN ('stripe', 'paypal', 'crypto')),
    payout_details JSONB,

    -- Stats
    total_students INTEGER DEFAULT 0,
    total_courses INTEGER DEFAULT 0,
    average_rating DECIMAL(2, 1) DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    educator_id UUID NOT NULL REFERENCES public.course_educators(id) ON DELETE CASCADE,

    -- Course details
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    thumbnail_url TEXT,
    preview_video_url TEXT,

    -- Categorization
    category TEXT NOT NULL,
    subcategory TEXT,
    tags TEXT[],
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),

    -- Content structure
    curriculum JSONB NOT NULL DEFAULT '[]', -- Sections and lessons
    total_duration_minutes INTEGER DEFAULT 0,
    lessons_count INTEGER DEFAULT 0,
    resources_count INTEGER DEFAULT 0,

    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    stripe_price_id TEXT,
    sale_price DECIMAL(10, 2),
    sale_ends_at TIMESTAMPTZ,

    -- Access
    lifetime_access BOOLEAN DEFAULT true,
    certificate_included BOOLEAN DEFAULT true,

    -- Requirements
    requirements TEXT[],
    target_audience TEXT[],
    outcomes TEXT[], -- What students will learn

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'archived')),
    published_at TIMESTAMPTZ,

    -- Stats
    enrollments_count INTEGER DEFAULT 0,
    completions_count INTEGER DEFAULT 0,
    average_rating DECIMAL(2, 1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.marketplace_courses(id) ON DELETE CASCADE,

    -- Payment
    price_paid DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_checkout_session_id TEXT,

    -- Commission split
    educator_share DECIMAL(10, 2) NOT NULL,
    platform_share DECIMAL(10, 2) NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'disputed')),
    purchased_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT,

    -- Progress tracking
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    completed_lessons JSONB DEFAULT '[]',
    last_lesson_id TEXT,
    last_accessed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Certificate
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url TEXT,

    -- Review
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    review_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, course_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_educators_status ON public.course_educators(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_courses_slug ON public.marketplace_courses(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_courses_educator ON public.marketplace_courses(educator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_courses_status ON public.marketplace_courses(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_courses_category ON public.marketplace_courses(category);
CREATE INDEX IF NOT EXISTS idx_course_purchases_user ON public.course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_course ON public.course_purchases(course_id);

-- RLS
ALTER TABLE public.course_educators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved educators" ON public.course_educators
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can view published courses" ON public.marketplace_courses
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view own purchases" ON public.course_purchases
    FOR SELECT USING (auth.uid() = user_id);


-- =============================================================================
-- 5. CONSULTATION MARKETPLACE
-- Connect beginners with verified crypto consultants for paid 1:1 sessions
-- Platform takes 15-20% cut
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Profile
    display_name TEXT NOT NULL,
    title TEXT, -- e.g., 'Crypto Investment Advisor'
    bio TEXT NOT NULL,
    avatar_url TEXT,

    -- Contact
    timezone TEXT NOT NULL DEFAULT 'UTC',
    languages TEXT[] DEFAULT ARRAY['English'],

    -- Expertise
    specializations TEXT[] NOT NULL, -- e.g., ['DeFi', 'Tax Planning', 'Portfolio Management']
    experience_years INTEGER NOT NULL,
    credentials TEXT[], -- Certifications, degrees, etc.

    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_level TEXT CHECK (verification_level IN ('basic', 'professional', 'expert')),
    verified_at TIMESTAMPTZ,
    verification_documents JSONB,
    background_check_passed BOOLEAN DEFAULT false,

    -- Pricing (per session)
    hourly_rate DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    session_durations INTEGER[] DEFAULT ARRAY[30, 60], -- Available durations in minutes

    -- Commission
    platform_commission_rate DECIMAL(5, 2) DEFAULT 18.00, -- Platform takes 18%

    -- Availability
    availability_schedule JSONB DEFAULT '{}', -- Weekly availability slots
    booking_lead_time_hours INTEGER DEFAULT 24, -- How far in advance bookings must be made
    max_daily_sessions INTEGER DEFAULT 8,

    -- Session settings
    session_types TEXT[] DEFAULT ARRAY['video', 'audio', 'chat'],
    video_platform TEXT DEFAULT 'zoom', -- zoom, google_meet, custom
    custom_meeting_link TEXT,

    -- Stats
    total_sessions INTEGER DEFAULT 0,
    total_hours DECIMAL(10, 1) DEFAULT 0,
    average_rating DECIMAL(2, 1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    repeat_client_rate DECIMAL(5, 2) DEFAULT 0,
    response_time_hours DECIMAL(5, 1) DEFAULT 24,

    -- Earnings
    total_earnings DECIMAL(10, 2) DEFAULT 0,
    pending_payout DECIMAL(10, 2) DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'inactive')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consultation_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Parties
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    consultant_id UUID NOT NULL REFERENCES public.consultants(id) ON DELETE CASCADE,

    -- Session details
    session_type TEXT NOT NULL CHECK (session_type IN ('video', 'audio', 'chat')),
    duration_minutes INTEGER NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL,

    -- Topic
    topic TEXT NOT NULL,
    description TEXT,
    client_goals TEXT[],

    -- Meeting info
    meeting_link TEXT,
    meeting_password TEXT,

    -- Pricing
    session_price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    consultant_share DECIMAL(10, 2) NOT NULL,
    platform_share DECIMAL(10, 2) NOT NULL,

    -- Payment
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_checkout_session_id TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'disputed')),
    paid_at TIMESTAMPTZ,

    -- Session status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'cancelled_by_client', 'cancelled_by_consultant',
        'rescheduled', 'in_progress', 'completed', 'no_show_client', 'no_show_consultant'
    )),
    confirmed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    actual_duration_minutes INTEGER,

    -- Cancellation
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    refund_amount DECIMAL(10, 2),

    -- Notes
    consultant_notes TEXT, -- Private notes for consultant
    session_summary TEXT, -- Shared summary after session
    resources_shared JSONB DEFAULT '[]', -- Links/files shared

    -- Follow-up
    follow_up_scheduled BOOLEAN DEFAULT false,
    follow_up_booking_id UUID,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consultant_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.consultation_bookings(id) ON DELETE CASCADE,
    consultant_id UUID NOT NULL REFERENCES public.consultants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Rating
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    knowledge_rating INTEGER CHECK (knowledge_rating >= 1 AND knowledge_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),

    -- Review content
    review_text TEXT,
    would_recommend BOOLEAN DEFAULT true,

    -- Moderation
    is_visible BOOLEAN DEFAULT true,
    flagged BOOLEAN DEFAULT false,
    flagged_reason TEXT,

    -- Consultant response
    consultant_response TEXT,
    responded_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(booking_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultants_user ON public.consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_consultants_status ON public.consultants(status);
CREATE INDEX IF NOT EXISTS idx_consultants_specializations ON public.consultants USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.consultation_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant ON public.consultation_bookings(consultant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON public.consultation_bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_consultant ON public.consultant_reviews(consultant_id);

-- RLS
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved consultants" ON public.consultants
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can manage own consultant profile" ON public.consultants
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookings" ON public.consultation_bookings
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Consultants can view their bookings" ON public.consultation_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.consultants
            WHERE id = consultation_bookings.consultant_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bookings" ON public.consultation_bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Anyone can view visible reviews" ON public.consultant_reviews
    FOR SELECT USING (is_visible = true);

CREATE POLICY "Users can create reviews for their bookings" ON public.consultant_reviews
    FOR INSERT WITH CHECK (auth.uid() = client_id);


-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

CREATE TRIGGER update_research_reports_updated_at
    BEFORE UPDATE ON public.research_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_report_purchases_updated_at
    BEFORE UPDATE ON public.research_report_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsored_learning_paths_updated_at
    BEFORE UPDATE ON public.sponsored_learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_path_enrollments_updated_at
    BEFORE UPDATE ON public.learning_path_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dashboard_configs_updated_at
    BEFORE UPDATE ON public.user_dashboard_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_educators_updated_at
    BEFORE UPDATE ON public.course_educators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_courses_updated_at
    BEFORE UPDATE ON public.marketplace_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_purchases_updated_at
    BEFORE UPDATE ON public.course_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultants_updated_at
    BEFORE UPDATE ON public.consultants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_bookings_updated_at
    BEFORE UPDATE ON public.consultation_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultant_reviews_updated_at
    BEFORE UPDATE ON public.consultant_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if user has purchased a research report
CREATE OR REPLACE FUNCTION has_research_report_access(p_user_id UUID, p_report_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.research_report_purchases
        WHERE user_id = p_user_id
        AND report_id = p_report_id
        AND status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has purchased a course
CREATE OR REPLACE FUNCTION has_course_access(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.course_purchases
        WHERE user_id = p_user_id
        AND course_id = p_course_id
        AND status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get consultant availability for a date
CREATE OR REPLACE FUNCTION get_consultant_availability(
    p_consultant_id UUID,
    p_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_consultant consultants;
    v_day_of_week INTEGER;
    v_schedule JSONB;
    v_booked_slots JSONB;
BEGIN
    SELECT * INTO v_consultant FROM public.consultants WHERE id = p_consultant_id;

    IF NOT FOUND THEN
        RETURN '{"error": "Consultant not found"}'::JSONB;
    END IF;

    v_day_of_week := EXTRACT(DOW FROM p_date);
    v_schedule := v_consultant.availability_schedule->v_day_of_week::TEXT;

    -- Get already booked slots
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'start', scheduled_at,
        'duration', duration_minutes
    )), '[]'::JSONB)
    INTO v_booked_slots
    FROM public.consultation_bookings
    WHERE consultant_id = p_consultant_id
    AND DATE(scheduled_at) = p_date
    AND status NOT IN ('cancelled_by_client', 'cancelled_by_consultant');

    RETURN jsonb_build_object(
        'date', p_date,
        'schedule', v_schedule,
        'booked', v_booked_slots
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
