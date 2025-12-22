-- Create portfolios table for multi-portfolio support

CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#f97316',
    icon TEXT NOT NULL DEFAULT 'wallet',
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create portfolio_holdings table
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    coin_id TEXT NOT NULL,
    coin_name TEXT NOT NULL,
    coin_symbol TEXT NOT NULL,
    coin_image TEXT,
    quantity DECIMAL(20, 8) NOT NULL DEFAULT 0,
    average_cost DECIMAL(20, 8) NOT NULL DEFAULT 0,
    current_price DECIMAL(20, 8),
    current_value DECIMAL(20, 8),
    profit_loss DECIMAL(20, 8),
    profit_loss_percentage DECIMAL(10, 4),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(portfolio_id, coin_id)
);

-- Create portfolio_transactions table
CREATE TABLE IF NOT EXISTS portfolio_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    coin_id TEXT NOT NULL,
    coin_symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'transfer_in', 'transfer_out', 'staking_reward', 'airdrop')),
    quantity DECIMAL(20, 8) NOT NULL,
    price_per_unit DECIMAL(20, 8) NOT NULL,
    total_value DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    notes TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_default ON portfolios(user_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_coin ON portfolio_holdings(coin_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_value ON portfolio_holdings(current_value DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_portfolio ON portfolio_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_date ON portfolio_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_coin ON portfolio_transactions(portfolio_id, coin_id);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;

-- Portfolio policies
CREATE POLICY "Users can view own portfolios"
    ON portfolios
    FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own portfolios"
    ON portfolios
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
    ON portfolios
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios"
    ON portfolios
    FOR DELETE
    USING (auth.uid() = user_id);

-- Holdings policies
CREATE POLICY "Users can view holdings of own portfolios"
    ON portfolio_holdings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM portfolios
            WHERE portfolios.id = portfolio_holdings.portfolio_id
            AND (portfolios.user_id = auth.uid() OR portfolios.is_public = true)
        )
    );

CREATE POLICY "Users can manage holdings of own portfolios"
    ON portfolio_holdings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM portfolios
            WHERE portfolios.id = portfolio_holdings.portfolio_id
            AND portfolios.user_id = auth.uid()
        )
    );

-- Transaction policies
CREATE POLICY "Users can view transactions of own portfolios"
    ON portfolio_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM portfolios
            WHERE portfolios.id = portfolio_transactions.portfolio_id
            AND (portfolios.user_id = auth.uid() OR portfolios.is_public = true)
        )
    );

CREATE POLICY "Users can manage transactions of own portfolios"
    ON portfolio_transactions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM portfolios
            WHERE portfolios.id = portfolio_transactions.portfolio_id
            AND portfolios.user_id = auth.uid()
        )
    );

-- Function to ensure only one default portfolio per user
CREATE OR REPLACE FUNCTION ensure_single_default_portfolio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE portfolios
        SET is_default = false, updated_at = NOW()
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_default
    BEFORE INSERT OR UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_portfolio();

-- Function to update holdings from transactions
CREATE OR REPLACE FUNCTION update_holdings_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_existing_quantity DECIMAL(20, 8);
    v_existing_cost DECIMAL(20, 8);
    v_new_quantity DECIMAL(20, 8);
    v_new_avg_cost DECIMAL(20, 8);
BEGIN
    -- Get existing holding
    SELECT quantity, average_cost INTO v_existing_quantity, v_existing_cost
    FROM portfolio_holdings
    WHERE portfolio_id = NEW.portfolio_id AND coin_id = NEW.coin_id;

    IF NEW.type IN ('buy', 'transfer_in', 'staking_reward', 'airdrop') THEN
        -- Add to position
        IF v_existing_quantity IS NULL THEN
            -- Create new holding
            INSERT INTO portfolio_holdings (portfolio_id, coin_id, coin_name, coin_symbol, quantity, average_cost, last_updated)
            VALUES (NEW.portfolio_id, NEW.coin_id, NEW.coin_symbol, NEW.coin_symbol, NEW.quantity, NEW.price_per_unit, NOW());
        ELSE
            -- Update existing holding with weighted average cost
            v_new_quantity := v_existing_quantity + NEW.quantity;
            v_new_avg_cost := ((v_existing_quantity * v_existing_cost) + (NEW.quantity * NEW.price_per_unit)) / v_new_quantity;

            UPDATE portfolio_holdings
            SET quantity = v_new_quantity,
                average_cost = v_new_avg_cost,
                last_updated = NOW()
            WHERE portfolio_id = NEW.portfolio_id AND coin_id = NEW.coin_id;
        END IF;
    ELSIF NEW.type IN ('sell', 'transfer_out') THEN
        -- Reduce position
        IF v_existing_quantity IS NOT NULL THEN
            v_new_quantity := v_existing_quantity - NEW.quantity;

            IF v_new_quantity <= 0 THEN
                DELETE FROM portfolio_holdings
                WHERE portfolio_id = NEW.portfolio_id AND coin_id = NEW.coin_id;
            ELSE
                UPDATE portfolio_holdings
                SET quantity = v_new_quantity,
                    last_updated = NOW()
                WHERE portfolio_id = NEW.portfolio_id AND coin_id = NEW.coin_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_holdings_on_transaction
    AFTER INSERT ON portfolio_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_holdings_from_transaction();

-- Add comments
COMMENT ON TABLE portfolios IS 'User portfolios for multi-portfolio support';
COMMENT ON TABLE portfolio_holdings IS 'Current holdings in each portfolio';
COMMENT ON TABLE portfolio_transactions IS 'Transaction history for each portfolio';
COMMENT ON COLUMN portfolios.is_public IS 'Whether the portfolio is viewable by others via a public link';
