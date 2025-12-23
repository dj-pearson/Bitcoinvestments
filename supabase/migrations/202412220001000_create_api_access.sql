-- API Access Tables
-- Developer API key management and usage tracking

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'professional', 'enterprise')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'expired')),
    permissions TEXT[] DEFAULT ARRAY['portfolio:read', 'market:read'],
    rate_limit_per_minute INTEGER DEFAULT 10,
    rate_limit_per_day INTEGER DEFAULT 100,
    requests_today INTEGER DEFAULT 0,
    requests_this_month INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    ip_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_origins TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API endpoints documentation table
CREATE TABLE IF NOT EXISTS api_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('portfolio', 'market', 'trading', 'analytics', 'social', 'account')),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    required_tier VARCHAR(20) DEFAULT 'free',
    required_permissions TEXT[],
    rate_limit_multiplier NUMERIC(3, 1) DEFAULT 1.0,
    request_schema JSONB DEFAULT '{}',
    response_schema JSONB DEFAULT '{}',
    example_request JSONB DEFAULT '{}',
    example_response JSONB DEFAULT '{}',
    is_deprecated BOOLEAN DEFAULT false,
    deprecation_message TEXT,
    version VARCHAR(10) DEFAULT '1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(path, method)
);

-- Create API usage logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size INTEGER,
    response_size INTEGER,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API subscriptions table
CREATE TABLE IF NOT EXISTS api_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'professional', 'enterprise')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API webhooks table
CREATE TABLE IF NOT EXISTS api_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret VARCHAR(64) NOT NULL,
    events TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    failure_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    last_failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook delivery logs table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES api_webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    attempt_count INTEGER DEFAULT 1,
    next_retry_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_tier ON api_keys(tier);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_endpoints_category ON api_endpoints(category);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_path_method ON api_endpoints(path, method);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

CREATE INDEX IF NOT EXISTS idx_api_subscriptions_user ON api_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_webhooks_user ON api_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own API keys"
    ON api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create API keys"
    ON api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
    ON api_keys FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view endpoints"
    ON api_endpoints FOR SELECT
    USING (true);

CREATE POLICY "Users can view own usage logs"
    ON api_usage_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM api_keys WHERE api_keys.id = api_usage_logs.api_key_id AND api_keys.user_id = auth.uid()
    ));

CREATE POLICY "Users can view own subscription"
    ON api_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own webhooks"
    ON api_webhooks FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own webhook deliveries"
    ON webhook_deliveries FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM api_webhooks WHERE api_webhooks.id = webhook_deliveries.webhook_id AND api_webhooks.user_id = auth.uid()
    ));

-- Functions
CREATE OR REPLACE FUNCTION reset_daily_api_usage()
RETURNS void AS $$
BEGIN
    UPDATE api_keys SET requests_today = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_monthly_api_usage()
RETURNS void AS $$
BEGIN
    UPDATE api_keys SET requests_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_api_usage(key_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE api_keys
    SET requests_today = requests_today + 1,
        requests_this_month = requests_this_month + 1,
        last_used_at = NOW()
    WHERE id = key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_rate_limit(key_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    key_record RECORD;
    requests_last_minute INTEGER;
BEGIN
    SELECT * INTO key_record FROM api_keys WHERE id = key_id;

    IF key_record.status != 'active' THEN
        RETURN FALSE;
    END IF;

    IF key_record.requests_today >= key_record.rate_limit_per_day THEN
        RETURN FALSE;
    END IF;

    SELECT COUNT(*) INTO requests_last_minute
    FROM api_usage_logs
    WHERE api_key_id = key_id
      AND created_at > NOW() - INTERVAL '1 minute';

    IF requests_last_minute >= key_record.rate_limit_per_minute THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_api_usage_stats(key_id UUID, time_period TEXT DEFAULT '30d')
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    interval_val INTERVAL;
BEGIN
    interval_val := CASE time_period
        WHEN '24h' THEN INTERVAL '24 hours'
        WHEN '7d' THEN INTERVAL '7 days'
        WHEN '30d' THEN INTERVAL '30 days'
        WHEN '90d' THEN INTERVAL '90 days'
        ELSE INTERVAL '30 days'
    END;

    SELECT jsonb_build_object(
        'totalRequests', COUNT(*),
        'successfulRequests', COUNT(*) FILTER (WHERE status_code < 400),
        'failedRequests', COUNT(*) FILTER (WHERE status_code >= 400),
        'averageResponseTime', ROUND(AVG(response_time_ms))
    ) INTO result
    FROM api_usage_logs
    WHERE api_key_id = key_id
      AND created_at > NOW() - interval_val;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update tier limits on API keys
CREATE OR REPLACE FUNCTION update_api_key_limits()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.tier
        WHEN 'free' THEN
            NEW.rate_limit_per_minute := 10;
            NEW.rate_limit_per_day := 100;
        WHEN 'starter' THEN
            NEW.rate_limit_per_minute := 30;
            NEW.rate_limit_per_day := 1000;
        WHEN 'professional' THEN
            NEW.rate_limit_per_minute := 100;
            NEW.rate_limit_per_day := 10000;
        WHEN 'enterprise' THEN
            NEW.rate_limit_per_minute := 1000;
            NEW.rate_limit_per_day := 100000;
    END CASE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_api_key_limits ON api_keys;
CREATE TRIGGER trigger_update_api_key_limits
    BEFORE INSERT OR UPDATE OF tier ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_key_limits();

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for developer access';
COMMENT ON TABLE api_endpoints IS 'API endpoint documentation';
COMMENT ON TABLE api_usage_logs IS 'API request logs for analytics';
COMMENT ON TABLE api_subscriptions IS 'API tier subscriptions';
COMMENT ON TABLE api_webhooks IS 'User-configured webhooks';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts and logs';
