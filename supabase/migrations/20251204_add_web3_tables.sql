-- Migration: Add Web3 features tables
-- Created: 2025-12-04
-- Description: Adds tables for wallet connections, transaction syncing, and token approvals

-- Table: user_wallets
-- Stores connected wallet addresses for each user
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL, -- 'ethereum', 'polygon', 'arbitrum', 'optimism', 'solana'
  wallet_label TEXT, -- User-friendly label like 'MetaMask - Main Wallet'
  wallet_type TEXT, -- 'metamask', 'walletconnect', 'coinbase', etc.
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, wallet_address, chain)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_wallets_chain ON user_wallets(chain);

-- Table: transaction_syncs
-- Tracks transaction sync history for each wallet
CREATE TABLE IF NOT EXISTS transaction_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  transactions_imported INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  error_message TEXT,
  from_block TEXT,
  to_block TEXT
);

CREATE INDEX IF NOT EXISTS idx_transaction_syncs_user_id ON transaction_syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_syncs_wallet ON transaction_syncs(wallet_address, chain);
CREATE INDEX IF NOT EXISTS idx_transaction_syncs_status ON transaction_syncs(sync_status);

-- Extend transactions table with blockchain data
-- Note: This assumes transactions table already exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS blockchain_chain TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS synced_from_wallet BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gas_fee NUMERIC(20, 8);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS token_address TEXT;

-- Add index for blockchain transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_chain ON transactions(blockchain_chain);

-- Table: token_approvals
-- Tracks token approval events for monitoring and revocation
CREATE TABLE IF NOT EXISTS token_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_name TEXT,
  token_symbol TEXT,
  spender_address TEXT NOT NULL,
  spender_name TEXT, -- Known protocol name like 'Uniswap V3', 'OpenSea', etc.
  allowance TEXT, -- Stored as string to handle large numbers
  is_unlimited BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  approval_tx_hash TEXT,
  risk_level TEXT DEFAULT 'unknown' -- 'low', 'medium', 'high', 'unknown'
);

CREATE INDEX IF NOT EXISTS idx_token_approvals_user_id ON token_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_token_approvals_wallet ON token_approvals(wallet_address, chain);
CREATE INDEX IF NOT EXISTS idx_token_approvals_token ON token_approvals(token_address);
CREATE INDEX IF NOT EXISTS idx_token_approvals_active ON token_approvals(is_revoked) WHERE is_revoked = FALSE;

-- Table: wallet_auth_nonces
-- Stores nonces for Sign-In with Ethereum (SIWE) authentication
CREATE TABLE IF NOT EXISTS wallet_auth_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  UNIQUE(wallet_address, nonce)
);

CREATE INDEX IF NOT EXISTS idx_wallet_auth_nonces_address ON wallet_auth_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_auth_nonces_expires ON wallet_auth_nonces(expires_at);

-- Add RLS (Row Level Security) policies

-- user_wallets policies
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
  ON user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets"
  ON user_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
  ON user_wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
  ON user_wallets FOR DELETE
  USING (auth.uid() = user_id);

-- transaction_syncs policies
ALTER TABLE transaction_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync history"
  ON transaction_syncs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync records"
  ON transaction_syncs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- token_approvals policies
ALTER TABLE token_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own token approvals"
  ON token_approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token approvals"
  ON token_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own token approvals"
  ON token_approvals FOR UPDATE
  USING (auth.uid() = user_id);

-- wallet_auth_nonces policies
ALTER TABLE wallet_auth_nonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert nonces"
  ON wallet_auth_nonces FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view unexpired nonces"
  ON wallet_auth_nonces FOR SELECT
  USING (expires_at > NOW() AND used = FALSE);

CREATE POLICY "Anyone can mark nonces as used"
  ON wallet_auth_nonces FOR UPDATE
  USING (expires_at > NOW());

-- Function to clean up expired nonces
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS void AS $$
BEGIN
  DELETE FROM wallet_auth_nonces
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE user_wallets IS 'Stores wallet addresses connected by users for portfolio tracking';
COMMENT ON TABLE transaction_syncs IS 'Tracks blockchain transaction sync history and status';
COMMENT ON TABLE token_approvals IS 'Monitors ERC20/SPL token approvals for security and revocation';
COMMENT ON TABLE wallet_auth_nonces IS 'Nonces for Sign-In with Ethereum (SIWE) authentication';
