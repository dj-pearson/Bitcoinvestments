-- Video Tutorial Library Tables
-- Educational video content with progress tracking

-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    avatar TEXT,
    bio TEXT,
    expertise TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create video_tutorials table
CREATE TABLE IF NOT EXISTS video_tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    video_url TEXT,
    embed_id VARCHAR(50), -- YouTube video ID
    duration INTEGER DEFAULT 0, -- seconds
    category VARCHAR(50) DEFAULT 'getting_started',
    tags TEXT[] DEFAULT '{}',
    difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    instructor_id UUID REFERENCES instructors(id),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create video_playlists table
CREATE TABLE IF NOT EXISTS video_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    category VARCHAR(50),
    difficulty VARCHAR(20) DEFAULT 'mixed',
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create playlist_videos junction table
CREATE TABLE IF NOT EXISTS playlist_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES video_playlists(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES video_tutorials(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    UNIQUE(playlist_id, video_id)
);

-- Create user_video_progress table
CREATE TABLE IF NOT EXISTS user_video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES video_tutorials(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    bookmarked BOOLEAN DEFAULT FALSE,
    liked BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Indexes for video_tutorials
CREATE INDEX IF NOT EXISTS idx_video_tutorials_category ON video_tutorials(category);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_difficulty ON video_tutorials(difficulty);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_instructor ON video_tutorials(instructor_id);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_published_at ON video_tutorials(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_views ON video_tutorials(views DESC);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_featured ON video_tutorials(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_video_tutorials_premium ON video_tutorials(is_premium);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_tags ON video_tutorials USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_search ON video_tutorials USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Indexes for playlist_videos
CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist ON playlist_videos(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_video ON playlist_videos(video_id);

-- Indexes for user_video_progress
CREATE INDEX IF NOT EXISTS idx_user_video_progress_user ON user_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_video ON user_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_bookmarked ON user_video_progress(user_id) WHERE bookmarked = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_video_progress_completed ON user_video_progress(user_id) WHERE completed = TRUE;

-- Enable RLS
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instructors
CREATE POLICY "Anyone can view instructors"
    ON instructors FOR SELECT
    USING (TRUE);

-- RLS Policies for video_tutorials
CREATE POLICY "Anyone can view videos"
    ON video_tutorials FOR SELECT
    USING (TRUE);

-- RLS Policies for video_playlists
CREATE POLICY "Anyone can view playlists"
    ON video_playlists FOR SELECT
    USING (TRUE);

-- RLS Policies for playlist_videos
CREATE POLICY "Anyone can view playlist videos"
    ON playlist_videos FOR SELECT
    USING (TRUE);

-- RLS Policies for user_video_progress
CREATE POLICY "Users can view own progress"
    ON user_video_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON user_video_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress"
    ON user_video_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update video likes
CREATE OR REPLACE FUNCTION update_video_likes(v_id UUID, increment INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE video_tutorials
    SET likes = GREATEST(0, likes + increment)
    WHERE id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_video_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_video_tutorials_updated_at ON video_tutorials;
CREATE TRIGGER trigger_video_tutorials_updated_at
    BEFORE UPDATE ON video_tutorials
    FOR EACH ROW
    EXECUTE FUNCTION update_video_updated_at();

-- Insert sample instructor
INSERT INTO instructors (id, name, avatar, bio, expertise)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Alex Crypto',
    'https://i.pravatar.cc/150?u=instructor1',
    'Crypto educator with 5+ years of experience in blockchain technology and trading.',
    ARRAY['Bitcoin', 'Trading', 'DeFi', 'Technical Analysis']
) ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE instructors IS 'Video tutorial instructors';
COMMENT ON TABLE video_tutorials IS 'Educational video content library';
COMMENT ON TABLE video_playlists IS 'Curated video playlists';
COMMENT ON TABLE playlist_videos IS 'Videos in playlists with ordering';
COMMENT ON TABLE user_video_progress IS 'User progress tracking for videos';
