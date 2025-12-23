-- Expert Webinars Tables
-- Live educational sessions with cryptocurrency experts

-- Create webinar hosts table
CREATE TABLE IF NOT EXISTS webinar_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    title VARCHAR(200),
    company VARCHAR(200),
    bio TEXT,
    avatar_url TEXT,
    expertise TEXT[],
    webinar_count INTEGER DEFAULT 0,
    average_rating NUMERIC(2, 1) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webinars table
CREATE TABLE IF NOT EXISTS webinars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL CHECK (category IN ('trading', 'investing', 'defi', 'security', 'tax', 'fundamentals', 'technical_analysis', 'market_outlook')),
    host_id UUID NOT NULL REFERENCES webinar_hosts(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended', 'cancelled')),
    is_premium BOOLEAN DEFAULT false,
    price NUMERIC(10, 2),
    max_attendees INTEGER,
    attendee_count INTEGER DEFAULT 0,
    stream_url TEXT,
    recording_url TEXT,
    slides_url TEXT,
    thumbnail TEXT,
    learning_outcomes TEXT[],
    prerequisites TEXT[],
    materials JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webinar registrations table
CREATE TABLE IF NOT EXISTS webinar_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attended BOOLEAN DEFAULT false,
    watch_time INTEGER DEFAULT 0,
    completed_materials TEXT[],
    reminder_sent BOOLEAN DEFAULT false,
    UNIQUE(webinar_id, user_id)
);

-- Create webinar ratings table
CREATE TABLE IF NOT EXISTS webinar_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(webinar_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webinars_host ON webinars(host_id);
CREATE INDEX IF NOT EXISTS idx_webinars_category ON webinars(category);
CREATE INDEX IF NOT EXISTS idx_webinars_status ON webinars(status);
CREATE INDEX IF NOT EXISTS idx_webinars_scheduled ON webinars(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_webinars_is_premium ON webinars(is_premium);
CREATE INDEX IF NOT EXISTS idx_webinars_slug ON webinars(slug);

CREATE INDEX IF NOT EXISTS idx_webinar_registrations_webinar ON webinar_registrations(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_user ON webinar_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_webinar_ratings_webinar ON webinar_ratings(webinar_id);

-- Enable RLS
ALTER TABLE webinar_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view hosts"
    ON webinar_hosts FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view webinars"
    ON webinars FOR SELECT
    USING (status != 'cancelled');

CREATE POLICY "Users can register for webinars"
    ON webinar_registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own registrations"
    ON webinar_registrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can rate webinars"
    ON webinar_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
    ON webinar_ratings FOR UPDATE
    USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION increment_webinar_attendees(webinar_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE webinars
    SET attendee_count = attendee_count + 1
    WHERE id = webinar_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE webinar_hosts IS 'Hosts of educational webinars';
COMMENT ON TABLE webinars IS 'Scheduled and past educational webinars';
COMMENT ON TABLE webinar_registrations IS 'User registrations for webinars';
COMMENT ON TABLE webinar_ratings IS 'User ratings and feedback for webinars';
