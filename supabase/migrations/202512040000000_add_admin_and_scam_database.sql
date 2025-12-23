-- Migration: Add Admin Infrastructure and Scam Database
-- Created: 2025-12-04
-- Description: Adds role-based access control, admin audit logs, and crypto scam database

-- ============================================================================
-- PART 1: ADMIN INFRASTRUCTURE
-- ============================================================================

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create role enum (for documentation, TEXT is used for flexibility)
COMMENT ON COLUMN users.role IS 'User role: user, admin, super_admin';

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(is_suspended);

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'user.suspend', 'user.activate', 'scam.create', etc.
  target_type TEXT, -- 'user', 'scam', 'article', etc.
  target_id TEXT, -- ID of affected entity
  details JSONB, -- Additional context about the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT, -- 'general', 'security', 'features', etc.
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);

-- ============================================================================
-- PART 2: CRYPTO SCAM DATABASE
-- ============================================================================

-- Create scam_reports table
CREATE TABLE IF NOT EXISTS scam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  scam_type TEXT NOT NULL, -- 'phishing', 'ponzi', 'rug_pull', 'fake_ico', 'impersonation', 'fake_exchange', 'pump_dump', 'other'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'investigating'

  -- Associated entities
  website_url TEXT,
  social_media_links JSONB, -- Array of social media URLs
  wallet_addresses TEXT[], -- Array of known scam wallet addresses
  email_addresses TEXT[], -- Array of scam email addresses
  phone_numbers TEXT[], -- Array of scam phone numbers

  -- Cryptocurrency specific
  token_name TEXT,
  token_symbol TEXT,
  blockchain TEXT, -- 'ethereum', 'bitcoin', 'binance-smart-chain', etc.
  contract_address TEXT,

  -- Metadata
  red_flags TEXT[], -- Array of warning signs
  victims_count INTEGER DEFAULT 0,
  estimated_loss_usd DECIMAL(20, 2),
  first_reported_date DATE,

  -- Reporting info
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Evidence
  evidence_links TEXT[], -- Array of URLs to evidence
  screenshots JSONB, -- Array of screenshot URLs

  -- Search optimization
  search_vector TSVECTOR,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scam_reports_type ON scam_reports(scam_type);
CREATE INDEX IF NOT EXISTS idx_scam_reports_severity ON scam_reports(severity);
CREATE INDEX IF NOT EXISTS idx_scam_reports_status ON scam_reports(status);
CREATE INDEX IF NOT EXISTS idx_scam_reports_blockchain ON scam_reports(blockchain);
CREATE INDEX IF NOT EXISTS idx_scam_reports_created ON scam_reports(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_scam_reports_search ON scam_reports USING GIN(search_vector);

-- Index for array searches
CREATE INDEX IF NOT EXISTS idx_scam_reports_wallet_addresses ON scam_reports USING GIN(wallet_addresses);
CREATE INDEX IF NOT EXISTS idx_scam_reports_email_addresses ON scam_reports USING GIN(email_addresses);

-- Create trigger to update search_vector
CREATE OR REPLACE FUNCTION update_scam_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.token_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.token_symbol, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.website_url, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scam_reports_search_vector_update
  BEFORE INSERT OR UPDATE ON scam_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_scam_search_vector();

-- Create scam_report_comments table
CREATE TABLE IF NOT EXISTS scam_report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scam_report_id UUID NOT NULL REFERENCES scam_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scam_comments_report ON scam_report_comments(scam_report_id);
CREATE INDEX IF NOT EXISTS idx_scam_comments_user ON scam_report_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_scam_comments_created ON scam_report_comments(created_at DESC);

-- Create scam_categories table for better organization
CREATE TABLE IF NOT EXISTS scam_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name for UI
  color TEXT, -- Color code for UI
  reports_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default scam categories
INSERT INTO scam_categories (name, slug, description, icon, color) VALUES
  ('Phishing', 'phishing', 'Fake websites or emails attempting to steal credentials', 'fish', '#ef4444'),
  ('Ponzi Scheme', 'ponzi', 'Investment fraud promising high returns', 'trending-up', '#f97316'),
  ('Rug Pull', 'rug-pull', 'Projects that suddenly withdraw all liquidity', 'trash-2', '#dc2626'),
  ('Fake ICO/IDO', 'fake-ico', 'Fraudulent initial coin offerings', 'coins', '#eab308'),
  ('Impersonation', 'impersonation', 'Fake accounts impersonating legitimate entities', 'user-x', '#8b5cf6'),
  ('Fake Exchange', 'fake-exchange', 'Fraudulent cryptocurrency exchange platforms', 'building-2', '#3b82f6'),
  ('Pump and Dump', 'pump-dump', 'Coordinated price manipulation schemes', 'trending-up', '#06b6d4'),
  ('Other', 'other', 'Other types of cryptocurrency scams', 'alert-triangle', '#6b7280')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Admin audit logs - only admins can view
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Admin settings - only admins can modify
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view admin settings"
  ON admin_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify settings"
  ON admin_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Scam reports - public read, authenticated write
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified scam reports"
  ON scam_reports FOR SELECT
  USING (status = 'verified' OR auth.uid() = reported_by OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Authenticated users can create scam reports"
  ON scam_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reports"
  ON scam_reports FOR UPDATE
  USING (auth.uid() = reported_by OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can delete scam reports"
  ON scam_reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Scam report comments
ALTER TABLE scam_report_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments on verified reports"
  ON scam_report_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scam_reports
      WHERE scam_reports.id = scam_report_id
      AND scam_reports.status = 'verified'
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON scam_report_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments"
  ON scam_report_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON scam_report_comments FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
  ));

-- Scam categories - public read, admin write
ALTER TABLE scam_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scam categories"
  ON scam_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify categories"
  ON scam_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user stats for admin dashboard
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  premium_users BIGINT,
  suspended_users BIGINT,
  new_users_7d BIGINT,
  new_users_30d BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE NOT is_suspended) as active_users,
    COUNT(*) FILTER (WHERE subscription_status = 'premium') as premium_users,
    COUNT(*) FILTER (WHERE is_suspended) as suspended_users,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d
  FROM users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get scam database stats
CREATE OR REPLACE FUNCTION get_scam_stats()
RETURNS TABLE (
  total_reports BIGINT,
  verified_reports BIGINT,
  pending_reports BIGINT,
  total_victims BIGINT,
  total_loss_usd NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_reports,
    COUNT(*) FILTER (WHERE status = 'verified') as verified_reports,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
    COALESCE(SUM(victims_count), 0) as total_victims,
    COALESCE(SUM(estimated_loss_usd), 0) as total_loss_usd
  FROM scam_reports;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE admin_audit_logs IS 'Tracks all administrative actions for security and auditing';
COMMENT ON TABLE admin_settings IS 'System-wide configuration settings manageable by admins';
COMMENT ON TABLE scam_reports IS 'Database of reported cryptocurrency scams and fraudulent schemes';
COMMENT ON TABLE scam_report_comments IS 'Community and admin comments on scam reports';
COMMENT ON TABLE scam_categories IS 'Categorization of different types of scams';

-- ============================================================================
-- GRANT PERMISSIONS (if needed for service role)
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON scam_reports TO authenticated;
GRANT INSERT ON scam_reports TO authenticated;
GRANT SELECT ON scam_categories TO authenticated;
GRANT SELECT, INSERT ON scam_report_comments TO authenticated;
