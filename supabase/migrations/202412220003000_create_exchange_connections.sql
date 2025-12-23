-- Exchange API Connections Tables
-- Connect to cryptocurrency exchanges for portfolio auto-sync

-- Create exchange_connections table
CREATE TABLE IF NOT EXISTS exchange_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange_id VARCHAR(50) NOT NULL,
    exchange_name VARCHAR(100) NOT NULL,
    auth_type VARCHAR(20) NOT NULL CHECK (auth_type IN ('oauth', 'api_key')),
    -- Encrypted credentials (encrypted at application level before storage)
    encrypted_api_key TEXT,
    encrypted_api_secret TEXT,
    encrypted_passphrase TEXT,
    -- OAuth tokens
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    oauth_expires_at TIMESTAMPTZ,
    -- Connection status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'expired', 'revoked')),
    error_message TEXT,
    -- Permissions
    permissions JSONB DEFAULT '{"read_balance": true, "read_trades": true, "read_deposits": false, "read_withdrawals": false}',
    -- Sync metadata
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20) CHECK (last_sync_status IN ('success', 'partial', 'failed')),
    sync_frequency VARCHAR(20) DEFAULT 'hourly' CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- One connection per exchange per user
    UNIQUE(user_id, exchange_id)
);

-- Create exchange_balances table for cached balances
CREATE TABLE IF NOT EXISTS exchange_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset VARCHAR(20) NOT NULL,
    asset_name VARCHAR(100),
    balance NUMERIC(30, 18) NOT NULL DEFAULT 0,
    available_balance NUMERIC(30, 18) DEFAULT 0,
    locked_balance NUMERIC(30, 18) DEFAULT 0,
    usd_value NUMERIC(20, 2),
    last_price NUMERIC(30, 18),
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(connection_id, asset)
);

-- Create exchange_transactions table for synced transactions
CREATE TABLE IF NOT EXISTS exchange_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange_tx_id VARCHAR(100), -- ID from the exchange
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'deposit', 'withdrawal', 'transfer', 'fee', 'dividend', 'staking_reward')),
    asset VARCHAR(20) NOT NULL,
    amount NUMERIC(30, 18) NOT NULL,
    price NUMERIC(30, 18),
    total_value NUMERIC(20, 2),
    fee NUMERIC(30, 18),
    fee_asset VARCHAR(20),
    -- For trades
    quote_asset VARCHAR(20),
    quote_amount NUMERIC(30, 18),
    -- Transaction metadata
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    executed_at TIMESTAMPTZ NOT NULL,
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(connection_id, exchange_tx_id)
);

-- Create exchange_sync_logs table
CREATE TABLE IF NOT EXISTS exchange_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES exchange_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'success', 'partial', 'failed')),
    assets_synced INTEGER DEFAULT 0,
    transactions_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER
);

-- Indexes for exchange_connections
CREATE INDEX IF NOT EXISTS idx_exchange_connections_user ON exchange_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_exchange ON exchange_connections(exchange_id);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_status ON exchange_connections(status);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_last_sync ON exchange_connections(last_sync_at);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_sync_frequency ON exchange_connections(sync_frequency) WHERE sync_frequency != 'manual';

-- Indexes for exchange_balances
CREATE INDEX IF NOT EXISTS idx_exchange_balances_connection ON exchange_balances(connection_id);
CREATE INDEX IF NOT EXISTS idx_exchange_balances_user ON exchange_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_balances_asset ON exchange_balances(asset);
CREATE INDEX IF NOT EXISTS idx_exchange_balances_usd_value ON exchange_balances(usd_value DESC);

-- Indexes for exchange_transactions
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_connection ON exchange_transactions(connection_id);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_user ON exchange_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_asset ON exchange_transactions(asset);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_type ON exchange_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_executed ON exchange_transactions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_status ON exchange_transactions(status);

-- Indexes for exchange_sync_logs
CREATE INDEX IF NOT EXISTS idx_exchange_sync_logs_connection ON exchange_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_exchange_sync_logs_user ON exchange_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_sync_logs_status ON exchange_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_exchange_sync_logs_started ON exchange_sync_logs(started_at DESC);

-- Enable RLS
ALTER TABLE exchange_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exchange_connections
CREATE POLICY "Users can view own connections"
    ON exchange_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connections"
    ON exchange_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
    ON exchange_connections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
    ON exchange_connections FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for exchange_balances
CREATE POLICY "Users can view own balances"
    ON exchange_balances FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own balances"
    ON exchange_balances FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balances"
    ON exchange_balances FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own balances"
    ON exchange_balances FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for exchange_transactions
CREATE POLICY "Users can view own transactions"
    ON exchange_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions"
    ON exchange_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON exchange_transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON exchange_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for exchange_sync_logs
CREATE POLICY "Users can view own sync logs"
    ON exchange_sync_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sync logs"
    ON exchange_sync_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to update connection timestamp
CREATE OR REPLACE FUNCTION update_exchange_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_exchange_connections_updated_at ON exchange_connections;
CREATE TRIGGER trigger_exchange_connections_updated_at
    BEFORE UPDATE ON exchange_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_exchange_connection_timestamp();

-- Function to calculate total portfolio value from exchange balances
CREATE OR REPLACE FUNCTION get_exchange_portfolio_value(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_value NUMERIC;
BEGIN
    SELECT COALESCE(SUM(usd_value), 0)
    INTO total_value
    FROM exchange_balances
    WHERE user_id = p_user_id;

    RETURN total_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get aggregated balances across all exchanges
CREATE OR REPLACE FUNCTION get_aggregated_balances(p_user_id UUID)
RETURNS TABLE(
    asset VARCHAR(20),
    total_balance NUMERIC(30, 18),
    total_usd_value NUMERIC(20, 2),
    exchange_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        eb.asset,
        SUM(eb.balance)::NUMERIC(30, 18) as total_balance,
        SUM(eb.usd_value)::NUMERIC(20, 2) as total_usd_value,
        COUNT(DISTINCT eb.connection_id)::INTEGER as exchange_count
    FROM exchange_balances eb
    JOIN exchange_connections ec ON eb.connection_id = ec.id
    WHERE eb.user_id = p_user_id
      AND ec.status = 'connected'
    GROUP BY eb.asset
    ORDER BY total_usd_value DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old sync logs (keep last 100 per connection)
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM exchange_sync_logs
    WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY connection_id ORDER BY started_at DESC) as rn
            FROM exchange_sync_logs
        ) ranked
        WHERE rn > 100
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE exchange_connections IS 'User connections to cryptocurrency exchanges';
COMMENT ON TABLE exchange_balances IS 'Cached asset balances from connected exchanges';
COMMENT ON TABLE exchange_transactions IS 'Synced transaction history from exchanges';
COMMENT ON TABLE exchange_sync_logs IS 'Sync operation logs for debugging';
COMMENT ON COLUMN exchange_connections.encrypted_api_key IS 'AES-256 encrypted API key';
COMMENT ON COLUMN exchange_connections.permissions IS 'Granted API permissions';
