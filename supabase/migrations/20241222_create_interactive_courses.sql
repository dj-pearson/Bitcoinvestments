-- Interactive Courses Tables
-- Structured learning paths with modules, lessons, and quizzes

-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    title VARCHAR(100),
    expertise TEXT[],
    social_links JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    category VARCHAR(50) NOT NULL CHECK (category IN ('bitcoin', 'ethereum', 'defi', 'trading', 'security', 'investing', 'technical_analysis', 'fundamentals')),
    level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    thumbnail_url TEXT,
    instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    is_premium BOOLEAN DEFAULT false,
    price NUMERIC(10, 2),
    estimated_hours NUMERIC(4, 1) DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    total_quizzes INTEGER DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    average_rating NUMERIC(2, 1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    prerequisites TEXT[],
    learning_outcomes TEXT[],
    tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create course modules table
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

-- Create course lessons table
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'article', 'quiz', 'interactive', 'assignment')),
    order_index INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    content JSONB DEFAULT '[]',
    video_url TEXT,
    is_free BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_id, order_index)
);

-- Create course quizzes table
CREATE TABLE IF NOT EXISTS course_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    passing_score INTEGER DEFAULT 70,
    time_limit INTEGER, -- in seconds
    questions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create course enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Create lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(enrollment_id, lesson_id)
);

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    passed BOOLEAN NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0
);

-- Create course ratings table
CREATE TABLE IF NOT EXISTS course_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Indexes for courses
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_is_premium ON courses(is_premium);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_enrollment_count ON courses(enrollment_count DESC);
CREATE INDEX IF NOT EXISTS idx_courses_average_rating ON courses(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_courses_published_at ON courses(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_tags ON courses USING GIN(tags);

-- Indexes for modules and lessons
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_type ON course_lessons(type);

-- Indexes for enrollments and progress
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_progress ON course_enrollments(progress);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_completed ON course_enrollments(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_enrollment ON quiz_attempts(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- Indexes for ratings
CREATE INDEX IF NOT EXISTS idx_course_ratings_course ON course_ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_user ON course_ratings(user_id);

-- Enable RLS
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view instructors" ON instructors;
DROP POLICY IF EXISTS "Public can view published courses" ON courses;
DROP POLICY IF EXISTS "Public can view course modules" ON course_modules;
DROP POLICY IF EXISTS "Public can view course lessons" ON course_lessons;
DROP POLICY IF EXISTS "Public can view quizzes" ON course_quizzes;
DROP POLICY IF EXISTS "Users can view own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can enroll in courses" ON course_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can view own lesson progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can update own lesson progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can upsert own lesson progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can submit quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view course ratings" ON course_ratings;
DROP POLICY IF EXISTS "Users can rate courses" ON course_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON course_ratings;

-- Public read access for courses
CREATE POLICY "Public can view instructors"
    ON instructors FOR SELECT
    USING (true);

CREATE POLICY "Public can view published courses"
    ON courses FOR SELECT
    USING (is_published = true);

CREATE POLICY "Public can view course modules"
    ON course_modules FOR SELECT
    USING (EXISTS (SELECT 1 FROM courses WHERE id = course_id AND is_published = true));

CREATE POLICY "Public can view course lessons"
    ON course_lessons FOR SELECT
    USING (EXISTS (SELECT 1 FROM courses WHERE id = course_id AND is_published = true));

CREATE POLICY "Public can view quizzes"
    ON course_quizzes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM course_lessons l
        JOIN courses c ON l.course_id = c.id
        WHERE l.id = lesson_id AND c.is_published = true
    ));

-- User-specific policies
CREATE POLICY "Users can view own enrollments"
    ON course_enrollments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses"
    ON course_enrollments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
    ON course_enrollments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lesson progress"
    ON public.lesson_progress FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.user_id = auth.uid()));

CREATE POLICY "Users can update own lesson progress"
    ON public.lesson_progress FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.user_id = auth.uid()));

CREATE POLICY "Users can upsert own lesson progress"
    ON public.lesson_progress FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.user_id = auth.uid()));

CREATE POLICY "Users can view own quiz attempts"
    ON public.quiz_attempts FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.user_id = auth.uid()));

CREATE POLICY "Users can submit quiz attempts"
    ON public.quiz_attempts FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.user_id = auth.uid()));

CREATE POLICY "Users can view course ratings"
    ON course_ratings FOR SELECT
    USING (true);

CREATE POLICY "Users can rate courses"
    ON course_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
    ON course_ratings FOR UPDATE
    USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION increment_enrollment_count(course_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE courses
    SET enrollment_count = enrollment_count + 1
    WHERE id = course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_course_rating(p_course_id UUID)
RETURNS void AS $$
DECLARE
    avg_rating NUMERIC;
    count_ratings INTEGER;
BEGIN
    SELECT AVG(rating)::NUMERIC(2,1), COUNT(*)
    INTO avg_rating, count_ratings
    FROM course_ratings
    WHERE course_id = p_course_id;

    UPDATE courses
    SET average_rating = COALESCE(avg_rating, 0),
        rating_count = count_ratings
    WHERE id = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update course lesson/quiz counts
CREATE OR REPLACE FUNCTION update_course_counts()
RETURNS TRIGGER AS $$
DECLARE
    target_course_id UUID;
BEGIN
    -- Get course_id from NEW or OLD record
    IF TG_OP = 'DELETE' THEN
        target_course_id := OLD.course_id;
    ELSE
        target_course_id := NEW.course_id;
    END IF;

    -- Update course counts
    UPDATE courses c
    SET total_lessons = (SELECT COUNT(*) FROM course_lessons WHERE course_id = target_course_id),
        total_quizzes = (SELECT COUNT(*) FROM course_lessons WHERE course_id = target_course_id AND type = 'quiz'),
        updated_at = NOW()
    WHERE c.id = target_course_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_course_counts ON course_lessons;
CREATE TRIGGER trigger_update_course_counts
    AFTER INSERT OR UPDATE OR DELETE ON course_lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_course_counts();

-- Comments
COMMENT ON TABLE courses IS 'Interactive courses with structured learning paths';
COMMENT ON TABLE course_modules IS 'Course modules grouping related lessons';
COMMENT ON TABLE course_lessons IS 'Individual lessons within modules';
COMMENT ON TABLE course_enrollments IS 'User enrollments in courses';
COMMENT ON TABLE lesson_progress IS 'User progress through individual lessons';
COMMENT ON TABLE quiz_attempts IS 'Quiz submission history';
