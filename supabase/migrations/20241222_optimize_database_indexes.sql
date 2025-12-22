-- Migration: Comprehensive Database Indexing Optimization
-- Created: 2024-12-22
-- Description: Adds optimized indexes for query performance across all tables

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Index for subscription queries (common filter)
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Composite index for active premium users
CREATE INDEX IF NOT EXISTS idx_users_active_premium ON users(subscription_status, subscription_tier)
    WHERE subscription_status = 'active';

-- Index for login tracking
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

-- Index for user creation date (for analytics)
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- TRANSACTIONS TABLE INDEXES
-- ============================================================================

-- Assuming a transactions table exists
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_coin ON transactions(coin_id);

-- Composite index for user portfolio queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_coin ON transactions(user_id, coin_id);

-- Index for tax report queries (date range + type)
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);

-- ============================================================================
-- PLATFORM_REVIEWS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_platform_reviews_user_id ON platform_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_reviews_platform ON platform_reviews(platform_type, platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_reviews_status ON platform_reviews(status);
CREATE INDEX IF NOT EXISTS idx_platform_reviews_rating ON platform_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_platform_reviews_created ON platform_reviews(created_at DESC);

-- Composite index for approved reviews by platform
CREATE INDEX IF NOT EXISTS idx_platform_reviews_approved ON platform_reviews(platform_type, platform_id, created_at DESC)
    WHERE status = 'approved';

-- ============================================================================
-- PRICE_ALERTS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_coin ON price_alerts(coin_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = true;

-- Composite for checking alerts
CREATE INDEX IF NOT EXISTS idx_price_alerts_coin_active ON price_alerts(coin_id, target_price, condition)
    WHERE is_active = true;

-- ============================================================================
-- NEWSLETTERS / EMAIL SUBSCRIPTIONS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active)
    WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created ON newsletter_subscribers(created_at DESC);

-- ============================================================================
-- SUBSCRIPTIONS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period ON subscriptions(current_period_end);

-- Composite for billing queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON subscriptions(status, current_period_end)
    WHERE status = 'active';

-- ============================================================================
-- AD CAMPAIGNS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

-- Active campaigns by position
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active ON ad_campaigns(position, priority DESC)
    WHERE status = 'active';

-- ============================================================================
-- AD IMPRESSIONS/CLICKS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign ON ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_date ON ad_impressions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign ON ad_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_date ON ad_clicks(created_at DESC);

-- Daily aggregation queries
CREATE INDEX IF NOT EXISTS idx_ad_impressions_daily ON ad_impressions(campaign_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_ad_clicks_daily ON ad_clicks(campaign_id, DATE(created_at));

-- ============================================================================
-- AFFILIATE TRACKING INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON affiliate_clicks(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_code ON affiliate_conversions(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_date ON affiliate_conversions(created_at DESC);

-- ============================================================================
-- PORTFOLIOS TABLE INDEXES (if exists)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_updated ON portfolios(updated_at DESC);

-- ============================================================================
-- PORTFOLIO_HOLDINGS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_coin ON portfolio_holdings(coin_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_updated ON portfolio_holdings(updated_at DESC);

-- ============================================================================
-- MODERATION LOGS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_moderation_logs_content ON moderation_logs(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator ON moderation_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON moderation_logs(action);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON moderation_logs(created_at DESC);

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Add full-text search to users (for admin search)
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE INDEX IF NOT EXISTS idx_users_search ON users USING GIN(search_vector);

-- Update search vector function for users
CREATE OR REPLACE FUNCTION update_users_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.id::TEXT, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_search_vector_update ON users;
CREATE TRIGGER users_search_vector_update
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_search_vector();

-- ============================================================================
-- BRIN INDEXES FOR LARGE TIME-SERIES DATA
-- ============================================================================

-- BRIN indexes are much smaller than B-tree for time-series data
-- Only create if tables are expected to be large

-- For audit logs (append-only, time-ordered)
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_brin ON admin_audit_logs
    USING BRIN(created_at) WITH (pages_per_range = 128);

-- For ad impressions (high volume)
CREATE INDEX IF NOT EXISTS idx_ad_impressions_brin ON ad_impressions
    USING BRIN(created_at) WITH (pages_per_range = 128);

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERED QUERIES
-- ============================================================================

-- Only pending scam reports (admin queue)
CREATE INDEX IF NOT EXISTS idx_scam_reports_pending ON scam_reports(created_at DESC)
    WHERE status = 'pending';

-- Only unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC)
    WHERE is_read = false;

-- Only active sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, last_activity_at DESC)
    WHERE is_valid = true;

-- ============================================================================
-- EXPRESSION INDEXES
-- ============================================================================

-- Case-insensitive email search
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));

-- Date-only indexes for reports
CREATE INDEX IF NOT EXISTS idx_transactions_date_only ON transactions(DATE(date));

-- ============================================================================
-- COVERING INDEXES (Include columns to avoid table lookups)
-- ============================================================================

-- Common user lookup with subscription info
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(id)
    INCLUDE (email, role, subscription_status, is_suspended);

-- ============================================================================
-- STATISTICS AND MAINTENANCE
-- ============================================================================

-- Ensure statistics are up to date for query planner
ANALYZE users;
ANALYZE transactions;
ANALYZE platform_reviews;
ANALYZE scam_reports;
ANALYZE support_tickets;
ANALYZE invoices;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_users_active_premium IS 'Optimizes queries for active premium user counts';
COMMENT ON INDEX idx_transactions_user_date IS 'Optimizes portfolio transaction history queries';
COMMENT ON INDEX idx_platform_reviews_approved IS 'Optimizes approved review listings by platform';
COMMENT ON INDEX idx_ad_campaigns_active IS 'Optimizes active ad serving queries';
COMMENT ON INDEX idx_scam_reports_pending IS 'Optimizes admin moderation queue';
