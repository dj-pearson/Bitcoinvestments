-- Migration: Comprehensive Database Indexing Optimization
-- Created: 2024-12-22
-- Description: Adds optimized indexes for query performance across all tables

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Create indexes only if columns exist
DO $$
BEGIN
    -- Index for subscription queries (common filter)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
        CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
    END IF;

    -- Index for email lookups
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    END IF;

    -- Composite index for active premium users
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
        CREATE INDEX IF NOT EXISTS idx_users_active_premium ON users(subscription_status, subscription_tier)
            WHERE subscription_status = 'active';
    END IF;

    -- Index for login tracking
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);
    END IF;

    -- Index for user creation date (for analytics)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
    END IF;
END $$;

-- ============================================================================
-- TRANSACTIONS TABLE INDEXES
-- ============================================================================

-- Create indexes only if table and columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'date') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'type') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'coin_id') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_coin ON transactions(coin_id);
        END IF;

        -- Composite index for user portfolio queries
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'date') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'coin_id') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_user_coin ON transactions(user_id, coin_id);
        END IF;

        -- Index for tax report queries (date range + type)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'date')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'type') THEN
            CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PLATFORM_REVIEWS TABLE INDEXES
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_reviews') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_platform_reviews_user_id ON platform_reviews(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'platform_type')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'platform_id') THEN
            CREATE INDEX IF NOT EXISTS idx_platform_reviews_platform ON platform_reviews(platform_type, platform_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_platform_reviews_status ON platform_reviews(status);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'rating') THEN
            CREATE INDEX IF NOT EXISTS idx_platform_reviews_rating ON platform_reviews(rating);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_platform_reviews_created ON platform_reviews(created_at DESC);
        END IF;

        -- Composite index for approved reviews by platform
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'platform_type')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'platform_id')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'created_at')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_reviews' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_platform_reviews_approved ON platform_reviews(platform_type, platform_id, created_at DESC)
                WHERE status = 'approved';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PRICE_ALERTS TABLE INDEXES
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_alerts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_alerts' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_alerts' AND column_name = 'coin_id') THEN
            CREATE INDEX IF NOT EXISTS idx_price_alerts_coin ON price_alerts(coin_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_alerts' AND column_name = 'is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = true;
        END IF;

        -- Composite for checking alerts
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_alerts' AND column_name = 'coin_id')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_alerts' AND column_name = 'target_price')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_alerts' AND column_name = 'condition')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_alerts' AND column_name = 'is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_price_alerts_coin_active ON price_alerts(coin_id, target_price, condition)
                WHERE is_active = true;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- NEWSLETTERS / EMAIL SUBSCRIPTIONS INDEXES
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscribers') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'email') THEN
            CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active)
                WHERE is_active = true;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created ON newsletter_subscribers(created_at DESC);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- SUBSCRIPTIONS TABLE INDEXES
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'stripe_subscription_id') THEN
            CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'current_period_end') THEN
            CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period ON subscriptions(current_period_end);
        END IF;

        -- Composite for billing queries
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'status')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'current_period_end') THEN
            CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON subscriptions(status, current_period_end)
                WHERE status = 'active';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- AD CAMPAIGNS TABLE INDEXES
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_campaigns') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'advertiser_id') THEN
            CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'start_date')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'end_date') THEN
            CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
        END IF;

        -- Active campaigns by position
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'position')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'priority')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active ON ad_campaigns(position, priority DESC)
                WHERE status = 'active';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- AD IMPRESSIONS/CLICKS TABLE INDEXES
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_impressions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_impressions' AND column_name = 'campaign_id') THEN
            CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign ON ad_impressions(campaign_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_impressions' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_ad_impressions_date ON ad_impressions(created_at DESC);
            -- Daily aggregation queries (skipped - expression indexes can be problematic)
            -- IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_impressions' AND column_name = 'campaign_id') THEN
            --     CREATE INDEX IF NOT EXISTS idx_ad_impressions_daily ON ad_impressions(campaign_id, CAST(created_at AS DATE));
            -- END IF;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_clicks') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_clicks' AND column_name = 'campaign_id') THEN
            CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign ON ad_clicks(campaign_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_clicks' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_ad_clicks_date ON ad_clicks(created_at DESC);
            -- Daily aggregation queries (skipped - expression indexes can be problematic)
            -- IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_clicks' AND column_name = 'campaign_id') THEN
            --     CREATE INDEX IF NOT EXISTS idx_ad_clicks_daily ON ad_clicks(campaign_id, CAST(created_at AS DATE));
            -- END IF;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- AFFILIATE TRACKING INDEXES
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_clicks') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_clicks' AND column_name = 'affiliate_code') THEN
            CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON affiliate_clicks(affiliate_code);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_clicks' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON affiliate_clicks(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_clicks' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(created_at DESC);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_conversions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_conversions' AND column_name = 'affiliate_code') THEN
            CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_code ON affiliate_conversions(affiliate_code);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_conversions' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_date ON affiliate_conversions(created_at DESC);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PORTFOLIOS TABLE INDEXES (if exists)
-- ============================================================================
-- Note: Portfolios indexes are created in 20241222_create_portfolios.sql
-- These are backup/additional indexes if needed

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolios') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'updated_at') THEN
            CREATE INDEX IF NOT EXISTS idx_portfolios_updated ON portfolios(updated_at DESC);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PORTFOLIO_HOLDINGS TABLE INDEXES
-- ============================================================================
-- Note: Portfolio holdings indexes are created in 20241222_create_portfolios.sql
-- These are backup/additional indexes if needed

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_holdings') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_holdings' AND column_name = 'portfolio_id') THEN
            CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio ON portfolio_holdings(portfolio_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_holdings' AND column_name = 'coin_id') THEN
            CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_coin ON portfolio_holdings(coin_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_holdings' AND column_name = 'updated_at') THEN
            CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_updated ON portfolio_holdings(updated_at DESC);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- MODERATION LOGS INDEXES
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderation_logs') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moderation_logs' AND column_name = 'content_type')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moderation_logs' AND column_name = 'content_id') THEN
            CREATE INDEX IF NOT EXISTS idx_moderation_logs_content ON moderation_logs(content_type, content_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moderation_logs' AND column_name = 'performed_by') THEN
            CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator ON moderation_logs(performed_by);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moderation_logs' AND column_name = 'action') THEN
            CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON moderation_logs(action);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moderation_logs' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON moderation_logs(created_at DESC);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Add full-text search to users (for admin search)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'search_vector') THEN
            ALTER TABLE users ADD COLUMN search_vector TSVECTOR;
        END IF;

        CREATE INDEX IF NOT EXISTS idx_users_search ON users USING GIN(search_vector);
    END IF;
END $$;

-- Update search vector function for users
CREATE OR REPLACE FUNCTION update_users_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'users' THEN
        NEW.search_vector :=
            setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.id::TEXT, '')), 'B');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if users table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TRIGGER IF EXISTS users_search_vector_update ON users;
        CREATE TRIGGER users_search_vector_update
            BEFORE INSERT OR UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_users_search_vector();
    END IF;
END $$;

-- ============================================================================
-- BRIN INDEXES FOR LARGE TIME-SERIES DATA
-- ============================================================================

-- BRIN indexes are much smaller than B-tree for time-series data
-- Only create if tables are expected to be large

DO $$
BEGIN
    -- For audit logs (append-only, time-ordered)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_audit_logs' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_brin ON admin_audit_logs
                USING BRIN(created_at) WITH (pages_per_range = 128);
        END IF;
    END IF;

    -- For ad impressions (high volume)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_impressions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_impressions' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_ad_impressions_brin ON ad_impressions
                USING BRIN(created_at) WITH (pages_per_range = 128);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERED QUERIES
-- ============================================================================

DO $$
BEGIN
    -- Only pending scam reports (admin queue)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scam_reports') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scam_reports' AND column_name = 'created_at')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scam_reports' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_scam_reports_pending ON scam_reports(created_at DESC)
                WHERE status = 'pending';
        END IF;
    END IF;

    -- Only unread notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_at')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
            CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC)
                WHERE is_read = false;
        END IF;
    END IF;

    -- Only active sessions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'user_id')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'last_activity_at')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'is_valid') THEN
            CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, last_activity_at DESC)
                WHERE is_valid = true;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- EXPRESSION INDEXES
-- ============================================================================

DO $$
BEGIN
    -- Case-insensitive email search
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
            CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
        END IF;
    END IF;

    -- Date-only indexes for reports (skipped - expression indexes can be problematic)
    -- IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    --     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'date') THEN
    --         CREATE INDEX IF NOT EXISTS idx_transactions_date_only ON transactions(CAST(date AS DATE));
    --     END IF;
    -- END IF;
END $$;

-- ============================================================================
-- COVERING INDEXES (Include columns to avoid table lookups)
-- ============================================================================

DO $$
BEGIN
    -- Common user lookup with subscription info
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Check if all required columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
            
            -- Build INCLUDE clause dynamically based on available columns
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status')
               AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_suspended') THEN
                CREATE INDEX IF NOT EXISTS idx_users_auth ON users(id)
                    INCLUDE (email, role, subscription_status, is_suspended);
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
                CREATE INDEX IF NOT EXISTS idx_users_auth ON users(id)
                    INCLUDE (email, role, subscription_status);
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_suspended') THEN
                CREATE INDEX IF NOT EXISTS idx_users_auth ON users(id)
                    INCLUDE (email, role, is_suspended);
            ELSE
                CREATE INDEX IF NOT EXISTS idx_users_auth ON users(id)
                    INCLUDE (email, role);
            END IF;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- STATISTICS AND MAINTENANCE
-- ============================================================================

-- Ensure statistics are up to date for query planner (only for tables that exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ANALYZE users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        ANALYZE transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_reviews') THEN
        ANALYZE platform_reviews;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scam_reports') THEN
        ANALYZE scam_reports;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        ANALYZE support_tickets;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        ANALYZE invoices;
    END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_active_premium') THEN
        COMMENT ON INDEX idx_users_active_premium IS 'Optimizes queries for active premium user counts';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transactions_user_date') THEN
        COMMENT ON INDEX idx_transactions_user_date IS 'Optimizes portfolio transaction history queries';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_platform_reviews_approved') THEN
        COMMENT ON INDEX idx_platform_reviews_approved IS 'Optimizes approved review listings by platform';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ad_campaigns_active') THEN
        COMMENT ON INDEX idx_ad_campaigns_active IS 'Optimizes active ad serving queries';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scam_reports_pending') THEN
        COMMENT ON INDEX idx_scam_reports_pending IS 'Optimizes admin moderation queue';
    END IF;
END $$;
