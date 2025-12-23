-- Certifications Tables
-- Verifiable certificates for course completions

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(200) NOT NULL,
    enrollment_id UUID, -- Foreign key will be added after course_enrollments table exists
    course_id UUID, -- Foreign key will be added after courses table exists
    course_name VARCHAR(300) NOT NULL,
    instructor_name VARCHAR(200),
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('pending', 'issued', 'revoked', 'expired')),
    grade VARCHAR(5),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    completion_time NUMERIC(5, 1), -- hours
    skills TEXT[],
    verification_url TEXT,
    pdf_url TEXT,
    metadata JSONB DEFAULT '{}',
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    background_color VARCHAR(20) DEFAULT '#FFFFFF',
    border_color VARCHAR(20) DEFAULT '#D4AF37',
    accent_color VARCHAR(20) DEFAULT '#D4AF37',
    logo_url TEXT,
    signature_url TEXT,
    html_template TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create certificate_views table for tracking verification views
CREATE TABLE IF NOT EXISTS certificate_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    viewer_ip VARCHAR(45),
    viewer_user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for certificates
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_issue_date ON certificates(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_enrollment ON certificates(enrollment_id);

-- Indexes for certificate views
CREATE INDEX IF NOT EXISTS idx_certificate_views_cert ON certificate_views(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_views_date ON certificate_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own certificates"
    ON certificates FOR SELECT
    USING (auth.uid() = user_id);

-- Allow public verification by certificate number
CREATE POLICY "Public can verify certificates"
    ON certificates FOR SELECT
    USING (status = 'issued');

CREATE POLICY "Users can view templates"
    ON certificate_templates FOR SELECT
    USING (is_active = true);

CREATE POLICY "System can create certificates"
    ON certificates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Anyone can log a view for analytics
CREATE POLICY "Anyone can log certificate views"
    ON certificate_views FOR INSERT
    WITH CHECK (true);

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number(prefix VARCHAR DEFAULT 'CERT')
RETURNS VARCHAR AS $$
DECLARE
    year_part VARCHAR(4);
    random_part VARCHAR(6);
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;
    random_part := LPAD(FLOOR(RANDOM() * 1000000)::VARCHAR, 6, '0');
    RETURN prefix || '-' || year_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- Function to issue certificate on course completion
-- NOTE: This function will only work after course_enrollments table exists
-- Run the 20241222_create_interactive_courses.sql migration first
CREATE OR REPLACE FUNCTION auto_issue_certificate()
RETURNS TRIGGER AS $$
DECLARE
    v_course RECORD;
    v_user RECORD;
    v_avg_score INTEGER;
    v_grade VARCHAR(5);
    v_cert_number VARCHAR(50);
BEGIN
    -- Only trigger when course is completed
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        -- Get course info
        SELECT c.*, i.name as instructor_name
        INTO v_course
        FROM courses c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        WHERE c.id = NEW.course_id;

        -- Get user info
        SELECT raw_user_meta_data->>'full_name' as full_name, email
        INTO v_user
        FROM auth.users
        WHERE id = NEW.user_id;

        -- Calculate average quiz score
        SELECT COALESCE(AVG(score), 85)::INTEGER
        INTO v_avg_score
        FROM quiz_attempts
        WHERE enrollment_id = NEW.id AND passed = true;

        -- Determine grade
        v_grade := CASE
            WHEN v_avg_score >= 97 THEN 'A+'
            WHEN v_avg_score >= 93 THEN 'A'
            WHEN v_avg_score >= 90 THEN 'A-'
            WHEN v_avg_score >= 87 THEN 'B+'
            WHEN v_avg_score >= 83 THEN 'B'
            WHEN v_avg_score >= 80 THEN 'B-'
            WHEN v_avg_score >= 77 THEN 'C+'
            WHEN v_avg_score >= 73 THEN 'C'
            WHEN v_avg_score >= 70 THEN 'C-'
            ELSE 'D'
        END;

        -- Generate certificate number
        v_cert_number := generate_certificate_number(UPPER(LEFT(v_course.category, 3)));

        -- Insert certificate
        INSERT INTO certificates (
            certificate_number,
            user_id,
            user_name,
            enrollment_id,
            course_id,
            course_name,
            instructor_name,
            grade,
            score,
            completion_time,
            skills,
            verification_url,
            metadata
        ) VALUES (
            v_cert_number,
            NEW.user_id,
            COALESCE(v_user.full_name, SPLIT_PART(v_user.email, '@', 1), 'Student'),
            NEW.id,
            NEW.course_id,
            v_course.title,
            v_course.instructor_name,
            v_grade,
            v_avg_score,
            v_course.estimated_hours,
            v_course.learning_outcomes,
            'https://bitcoinvestments.net/verify/' || v_cert_number,
            jsonb_build_object(
                'lessonsCompleted', (SELECT COUNT(*) FROM lesson_progress WHERE enrollment_id = NEW.id AND is_completed = true),
                'quizzesCompleted', (SELECT COUNT(*) FROM quiz_attempts WHERE enrollment_id = NEW.id AND passed = true),
                'averageQuizScore', v_avg_score
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if course_enrollments table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'course_enrollments') THEN
        DROP TRIGGER IF EXISTS trigger_auto_issue_certificate ON course_enrollments;
        CREATE TRIGGER trigger_auto_issue_certificate
            AFTER UPDATE ON course_enrollments
            FOR EACH ROW
            EXECUTE FUNCTION auto_issue_certificate();
    END IF;
END $$;

-- Function to revoke certificate
CREATE OR REPLACE FUNCTION revoke_certificate(p_certificate_id UUID, p_reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE certificates
    SET status = 'revoked',
        revoked_at = NOW(),
        revoked_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_certificate_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default templates
INSERT INTO certificate_templates (name, description, background_color, border_color, accent_color, is_default)
VALUES
    ('Classic', 'Traditional certificate design with gold accents', '#FFFEF7', '#D4AF37', '#D4AF37', true),
    ('Modern', 'Clean modern design with gradient accents', '#FFFFFF', '#F97316', '#F97316', false),
    ('Dark', 'Professional dark theme certificate', '#1F2937', '#60A5FA', '#60A5FA', false)
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE certificates IS 'Verifiable certificates issued for course completions';
COMMENT ON TABLE certificate_templates IS 'Templates for certificate generation';
COMMENT ON TABLE certificate_views IS 'Analytics for certificate verification views';
COMMENT ON COLUMN certificates.certificate_number IS 'Unique verifiable certificate ID';
COMMENT ON COLUMN certificates.metadata IS 'Additional data like lessons completed, quiz scores';
