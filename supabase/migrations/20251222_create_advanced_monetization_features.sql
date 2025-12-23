-- Advanced Monetization Features Migration
-- 1. Influencer Verification Program
-- 2. Crypto Lending/Borrowing Comparison
-- 3. NFT Portfolio Tracking (Premium)
-- 4. Social Trading / Copy Portfolio
-- 5. On-Chain Analytics Dashboard

-- ============================================
-- 1. INFLUENCER VERIFICATION PROGRAM
-- Users pay $2.99/month for transparency
-- Influencers pay $49/month for verified badge
-- ============================================

-- Verified influencers table
CREATE TABLE IF NOT EXISTS verified_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    bio TEXT,
    profile_image TEXT,
    banner_image TEXT,

    -- Social media links
    twitter_handle VARCHAR(100),
    twitter_followers INTEGER DEFAULT 0,
    youtube_channel VARCHAR(200),
    youtube_subscribers INTEGER DEFAULT 0,
    tiktok_handle VARCHAR(100),
    tiktok_followers INTEGER DEFAULT 0,
    instagram_handle VARCHAR(100),
    instagram_followers INTEGER DEFAULT 0,
    telegram_channel VARCHAR(200),
    discord_server VARCHAR(200),
    website_url TEXT,

    -- Verification status
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'suspended')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_tier VARCHAR(20) DEFAULT 'standard' CHECK (verification_tier IN ('standard', 'professional', 'elite')),

    -- Subscription
    subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'cancelled')),
    subscription_expires_at TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    monthly_fee NUMERIC(8, 2) DEFAULT 49.00,

    -- Performance metrics (verified)
    total_claimed_trades INTEGER DEFAULT 0,
    verified_trades INTEGER DEFAULT 0,
    claimed_win_rate NUMERIC(5, 2),
    verified_win_rate NUMERIC(5, 2),
    claimed_total_return NUMERIC(12, 2),
    verified_total_return NUMERIC(12, 2),
    accuracy_score NUMERIC(5, 2), -- How accurate are their claims

    -- Engagement
    followers_count INTEGER DEFAULT 0,
    transparency_score NUMERIC(5, 2), -- Based on how much they share
    trust_score NUMERIC(5, 2), -- Calculated based on accuracy and engagement

    -- Wallet verification
    verified_wallets TEXT[] DEFAULT ARRAY[]::TEXT[],
    wallet_verification_status VARCHAR(20) DEFAULT 'none' CHECK (wallet_verification_status IN ('none', 'partial', 'full')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Influencer verification requests
CREATE TABLE IF NOT EXISTS influencer_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Application details
    display_name VARCHAR(200) NOT NULL,
    bio TEXT,
    twitter_handle VARCHAR(100),
    youtube_channel VARCHAR(200),
    other_social_links JSONB DEFAULT '{}',
    website_url TEXT,

    -- Verification evidence
    follower_proof_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    identity_verification_type VARCHAR(50),
    wallet_addresses TEXT[] DEFAULT ARRAY[]::TEXT[],
    previous_content_urls TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Application
    application_text TEXT,
    specialization VARCHAR(100), -- Trading, DeFi, NFTs, etc.
    years_experience INTEGER,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'more_info_needed')),
    reviewer_id UUID REFERENCES auth.users(id),
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Influencer performance snapshots (historical tracking)
CREATE TABLE IF NOT EXISTS influencer_performance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES verified_influencers(id) ON DELETE CASCADE,

    -- Snapshot date
    snapshot_date DATE NOT NULL,

    -- Claimed vs Verified performance
    claimed_portfolio_value NUMERIC(16, 2),
    verified_portfolio_value NUMERIC(16, 2),
    claimed_daily_return NUMERIC(8, 4),
    verified_daily_return NUMERIC(8, 4),
    claimed_weekly_return NUMERIC(8, 4),
    verified_weekly_return NUMERIC(8, 4),
    claimed_monthly_return NUMERIC(8, 4),
    verified_monthly_return NUMERIC(8, 4),

    -- Trade claims
    trades_claimed INTEGER DEFAULT 0,
    trades_verified INTEGER DEFAULT 0,
    winning_trades_claimed INTEGER DEFAULT 0,
    winning_trades_verified INTEGER DEFAULT 0,

    -- Social metrics
    follower_count INTEGER DEFAULT 0,
    engagement_rate NUMERIC(5, 2),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(influencer_id, snapshot_date)
);

-- Influencer transparency subscriptions (users paying to see verified data)
CREATE TABLE IF NOT EXISTS influencer_transparency_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Subscription details
    subscription_type VARCHAR(20) DEFAULT 'monthly' CHECK (subscription_type IN ('monthly', 'yearly')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'past_due', 'cancelled')),
    price_paid NUMERIC(8, 2) NOT NULL DEFAULT 2.99,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Stripe
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),

    -- Dates
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Influencer trade claims (what they say vs reality)
CREATE TABLE IF NOT EXISTS influencer_trade_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES verified_influencers(id) ON DELETE CASCADE,

    -- Claim details
    claim_type VARCHAR(20) NOT NULL CHECK (claim_type IN ('buy', 'sell', 'call', 'prediction')),
    asset_symbol VARCHAR(20) NOT NULL,
    asset_name VARCHAR(200),

    -- Claimed entry/exit
    claimed_entry_price NUMERIC(18, 8),
    claimed_exit_price NUMERIC(18, 8),
    claimed_entry_date TIMESTAMPTZ,
    claimed_exit_date TIMESTAMPTZ,
    claimed_return_percent NUMERIC(10, 4),

    -- Verified data (from on-chain or exchange verification)
    verified_entry_price NUMERIC(18, 8),
    verified_exit_price NUMERIC(18, 8),
    verified_entry_date TIMESTAMPTZ,
    verified_exit_date TIMESTAMPTZ,
    verified_return_percent NUMERIC(10, 4),

    -- Verification status
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed', 'unverifiable', 'false_claim')),
    verification_source VARCHAR(50), -- on-chain, exchange_api, manual
    verification_tx_hash VARCHAR(100),
    verification_notes TEXT,

    -- Social proof
    claim_source_url TEXT, -- Twitter post, YouTube video, etc.
    claim_screenshot_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- ============================================
-- 2. CRYPTO LENDING/BORROWING COMPARISON
-- Affiliate commissions: $500-5000 per referred depositor
-- ============================================

-- Lending platforms
CREATE TABLE IF NOT EXISTS lending_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website_url TEXT NOT NULL,
    description TEXT,

    -- Platform type
    platform_type VARCHAR(30) NOT NULL CHECK (platform_type IN ('cefi', 'defi', 'hybrid')),
    supported_chains TEXT[] DEFAULT ARRAY['ethereum']::TEXT[],

    -- Trust & Safety
    trust_score NUMERIC(3, 1), -- 0-10 scale
    security_audit_url TEXT,
    is_insured BOOLEAN DEFAULT false,
    insurance_details TEXT,
    regulatory_status VARCHAR(50),
    jurisdiction VARCHAR(100),

    -- Features
    supports_lending BOOLEAN DEFAULT true,
    supports_borrowing BOOLEAN DEFAULT true,
    supports_staking BOOLEAN DEFAULT false,
    min_deposit NUMERIC(18, 2),
    max_ltv NUMERIC(5, 2), -- Loan to value ratio
    liquidation_threshold NUMERIC(5, 2),

    -- Affiliate info
    affiliate_program_url TEXT,
    affiliate_commission_type VARCHAR(20) CHECK (affiliate_commission_type IN ('cpa', 'revenue_share', 'hybrid')),
    affiliate_cpa_amount NUMERIC(10, 2), -- One-time payment per referral
    affiliate_revenue_share NUMERIC(5, 2), -- Percentage of revenue
    affiliate_cookie_days INTEGER DEFAULT 30,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deprecated', 'warning')),
    warning_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current lending rates (updated regularly)
CREATE TABLE IF NOT EXISTS lending_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL REFERENCES lending_platforms(id) ON DELETE CASCADE,

    -- Asset info
    asset_symbol VARCHAR(20) NOT NULL,
    asset_name VARCHAR(200),
    asset_type VARCHAR(20) CHECK (asset_type IN ('crypto', 'stablecoin', 'lp_token')),
    chain VARCHAR(50) DEFAULT 'ethereum',

    -- Lending rates (what you earn)
    lending_apy NUMERIC(10, 4), -- Annual percentage yield for lenders
    lending_apy_base NUMERIC(10, 4), -- Base APY without rewards
    lending_apy_rewards NUMERIC(10, 4), -- Additional rewards APY
    lending_rewards_token VARCHAR(20),

    -- Borrowing rates (what you pay)
    borrowing_apy NUMERIC(10, 4),
    borrowing_apy_variable BOOLEAN DEFAULT true,
    borrowing_apy_stable NUMERIC(10, 4), -- If stable rate available

    -- Utilization
    total_supplied NUMERIC(24, 8),
    total_borrowed NUMERIC(24, 8),
    utilization_rate NUMERIC(5, 2),

    -- Collateral info
    can_be_collateral BOOLEAN DEFAULT true,
    collateral_factor NUMERIC(5, 2), -- How much can be borrowed against

    -- Caps and limits
    supply_cap NUMERIC(24, 8),
    borrow_cap NUMERIC(24, 8),

    -- Data freshness
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(50), -- api, scraper, manual

    UNIQUE(platform_id, asset_symbol, chain)
);

-- Historical lending rates
CREATE TABLE IF NOT EXISTS lending_rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL REFERENCES lending_platforms(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(20) NOT NULL,
    chain VARCHAR(50) DEFAULT 'ethereum',

    -- Snapshot
    snapshot_date DATE NOT NULL,
    lending_apy NUMERIC(10, 4),
    borrowing_apy NUMERIC(10, 4),
    utilization_rate NUMERIC(5, 2),
    total_supplied NUMERIC(24, 8),
    total_borrowed NUMERIC(24, 8),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(platform_id, asset_symbol, chain, snapshot_date)
);

-- Lending referrals tracking
CREATE TABLE IF NOT EXISTS lending_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,

    -- Click info
    platform_id UUID NOT NULL REFERENCES lending_platforms(id),
    referral_link TEXT NOT NULL,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),

    -- UTM tracking
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    -- Conversion
    converted BOOLEAN DEFAULT false,
    converted_at TIMESTAMPTZ,
    deposit_amount NUMERIC(18, 2),
    deposit_currency VARCHAR(20),
    commission_earned NUMERIC(10, 2),
    commission_status VARCHAR(20) DEFAULT 'pending' CHECK (commission_status IN ('pending', 'confirmed', 'paid', 'rejected')),

    -- Device info
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. NFT PORTFOLIO TRACKING (PREMIUM)
-- $14.99/month add-on or bundled
-- ============================================

-- NFT collections
CREATE TABLE IF NOT EXISTS nft_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_address VARCHAR(100) NOT NULL,
    chain VARCHAR(50) NOT NULL DEFAULT 'ethereum',

    -- Collection info
    name VARCHAR(300) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    banner_url TEXT,
    external_url TEXT,

    -- Creator info
    creator_address VARCHAR(100),
    creator_name VARCHAR(200),
    creator_royalty_percent NUMERIC(5, 2),

    -- Stats
    total_supply INTEGER,
    num_owners INTEGER,
    floor_price NUMERIC(24, 8),
    floor_price_usd NUMERIC(18, 2),
    total_volume NUMERIC(24, 8),
    total_volume_usd NUMERIC(18, 2),

    -- Market data
    one_day_volume NUMERIC(24, 8),
    one_day_change NUMERIC(8, 4),
    seven_day_volume NUMERIC(24, 8),
    seven_day_change NUMERIC(8, 4),
    thirty_day_volume NUMERIC(24, 8),
    thirty_day_change NUMERIC(8, 4),

    -- Average prices
    average_price NUMERIC(24, 8),
    market_cap NUMERIC(24, 8),

    -- Rarity
    has_rarity_data BOOLEAN DEFAULT false,
    rarity_source VARCHAR(50),

    -- Verification
    is_verified BOOLEAN DEFAULT false,
    opensea_verified BOOLEAN DEFAULT false,

    -- Categories
    category VARCHAR(50),
    traits JSONB DEFAULT '{}',

    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(contract_address, chain)
);

-- User NFT holdings
CREATE TABLE IF NOT EXISTS nft_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(100) NOT NULL,
    chain VARCHAR(50) NOT NULL DEFAULT 'ethereum',

    -- NFT info
    collection_id UUID REFERENCES nft_collections(id) ON DELETE SET NULL,
    contract_address VARCHAR(100) NOT NULL,
    token_id VARCHAR(100) NOT NULL,
    token_standard VARCHAR(20) DEFAULT 'ERC721',

    -- Metadata
    name VARCHAR(300),
    description TEXT,
    image_url TEXT,
    animation_url TEXT,
    attributes JSONB DEFAULT '[]',

    -- Rarity
    rarity_rank INTEGER,
    rarity_score NUMERIC(10, 4),
    rarity_percentile NUMERIC(5, 2),

    -- Acquisition info
    acquired_at TIMESTAMPTZ,
    acquired_price NUMERIC(24, 8),
    acquired_price_usd NUMERIC(18, 2),
    acquisition_tx_hash VARCHAR(100),
    acquisition_type VARCHAR(20) CHECK (acquisition_type IN ('purchase', 'mint', 'transfer', 'airdrop', 'unknown')),

    -- Current valuation
    last_sale_price NUMERIC(24, 8),
    last_sale_date TIMESTAMPTZ,
    estimated_value NUMERIC(24, 8),
    estimated_value_usd NUMERIC(18, 2),
    floor_difference_percent NUMERIC(8, 4), -- How much above/below floor

    -- Status
    is_listed BOOLEAN DEFAULT false,
    listing_price NUMERIC(24, 8),
    listing_marketplace VARCHAR(50),

    -- Tracking
    cost_basis NUMERIC(18, 2),
    unrealized_pnl NUMERIC(18, 2),
    unrealized_pnl_percent NUMERIC(8, 4),

    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(wallet_address, contract_address, token_id, chain)
);

-- NFT price alerts
CREATE TABLE IF NOT EXISTS nft_price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Alert target
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('collection_floor', 'token_price', 'rarity_available')),
    collection_id UUID REFERENCES nft_collections(id) ON DELETE CASCADE,
    token_id VARCHAR(100),

    -- Conditions
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('above', 'below', 'percent_change')),
    target_price NUMERIC(24, 8),
    target_percent NUMERIC(8, 4),

    -- Status
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMPTZ,
    triggered_price NUMERIC(24, 8),

    -- Notification
    notify_email BOOLEAN DEFAULT true,
    notify_push BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFT portfolio subscriptions
CREATE TABLE IF NOT EXISTS nft_portfolio_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Subscription
    subscription_type VARCHAR(20) DEFAULT 'monthly' CHECK (subscription_type IN ('monthly', 'yearly', 'bundled')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'past_due', 'cancelled')),
    price_paid NUMERIC(8, 2) NOT NULL DEFAULT 14.99,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Features
    max_wallets INTEGER DEFAULT 5,
    max_collections_tracked INTEGER DEFAULT 50,
    rarity_analytics BOOLEAN DEFAULT true,
    floor_alerts BOOLEAN DEFAULT true,

    -- Stripe
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),

    -- Dates
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- NFT floor price history
CREATE TABLE IF NOT EXISTS nft_floor_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES nft_collections(id) ON DELETE CASCADE,

    snapshot_time TIMESTAMPTZ NOT NULL,
    floor_price NUMERIC(24, 8) NOT NULL,
    floor_price_usd NUMERIC(18, 2),
    num_listed INTEGER,
    volume_24h NUMERIC(24, 8),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(collection_id, snapshot_time)
);

-- ============================================
-- 4. SOCIAL TRADING / COPY PORTFOLIO
-- Users copy allocation for $9.99/month
-- Original users earn 20% of subscription
-- ============================================

-- Published portfolios (traders share their portfolios)
CREATE TABLE IF NOT EXISTS published_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,

    -- Display info
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    banner_url TEXT,

    -- Trading style
    trading_style VARCHAR(50) CHECK (trading_style IN ('day_trading', 'swing_trading', 'hodl', 'dca', 'yield_farming', 'mixed')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('conservative', 'moderate', 'aggressive', 'degen')),
    specialization VARCHAR(100), -- BTC-focused, Altcoins, DeFi, etc.

    -- Performance (calculated)
    total_return_percent NUMERIC(10, 4),
    monthly_return_percent NUMERIC(8, 4),
    yearly_return_percent NUMERIC(10, 4),
    max_drawdown_percent NUMERIC(8, 4),
    sharpe_ratio NUMERIC(6, 4),
    win_rate NUMERIC(5, 2),
    avg_trade_duration_hours NUMERIC(10, 2),

    -- Engagement
    followers_count INTEGER DEFAULT 0,
    copiers_count INTEGER DEFAULT 0, -- Actively copying
    views_count INTEGER DEFAULT 0,

    -- Pricing
    is_free BOOLEAN DEFAULT false,
    subscription_price NUMERIC(8, 2) DEFAULT 9.99,
    creator_revenue_share NUMERIC(5, 2) DEFAULT 20.00, -- 20% to creator

    -- Settings
    is_active BOOLEAN DEFAULT true,
    show_holdings BOOLEAN DEFAULT true,
    show_transactions BOOLEAN DEFAULT true,
    delay_transactions_hours INTEGER DEFAULT 24, -- Delay showing trades
    min_copy_amount NUMERIC(18, 2) DEFAULT 100,

    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,

    -- Stats period
    stats_updated_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio followers (free to follow)
CREATE TABLE IF NOT EXISTS portfolio_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    published_portfolio_id UUID NOT NULL REFERENCES published_portfolios(id) ON DELETE CASCADE,

    followed_at TIMESTAMPTZ DEFAULT NOW(),
    notifications_enabled BOOLEAN DEFAULT true,

    UNIQUE(follower_user_id, published_portfolio_id)
);

-- Copy trading subscriptions
CREATE TABLE IF NOT EXISTS copy_trading_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    published_portfolio_id UUID NOT NULL REFERENCES published_portfolios(id) ON DELETE CASCADE,
    creator_user_id UUID NOT NULL REFERENCES auth.users(id),

    -- Subscription
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    subscription_type VARCHAR(20) DEFAULT 'monthly' CHECK (subscription_type IN ('monthly', 'yearly')),
    price_paid NUMERIC(8, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Copy settings
    copy_mode VARCHAR(20) DEFAULT 'proportional' CHECK (copy_mode IN ('proportional', 'fixed_amount', 'mirror')),
    allocated_amount NUMERIC(18, 2), -- Amount allocated for copying
    max_position_size NUMERIC(18, 2),
    copy_new_trades BOOLEAN DEFAULT true,
    auto_rebalance BOOLEAN DEFAULT false,

    -- Stripe
    stripe_subscription_id VARCHAR(255),

    -- Revenue share
    creator_earnings NUMERIC(10, 2) DEFAULT 0, -- Total earned by creator
    platform_earnings NUMERIC(10, 2) DEFAULT 0,
    last_payout_at TIMESTAMPTZ,

    -- Dates
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(subscriber_user_id, published_portfolio_id)
);

-- Copy trade executions
CREATE TABLE IF NOT EXISTS copy_trade_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES copy_trading_subscriptions(id) ON DELETE CASCADE,
    copier_user_id UUID NOT NULL REFERENCES auth.users(id),

    -- Original trade
    original_transaction_id UUID REFERENCES transactions(id),

    -- Copy trade details
    trade_type VARCHAR(20) NOT NULL CHECK (trade_type IN ('buy', 'sell', 'rebalance')),
    asset_symbol VARCHAR(20) NOT NULL,
    asset_name VARCHAR(200),

    -- Execution
    original_amount NUMERIC(24, 8),
    copied_amount NUMERIC(24, 8),
    original_price NUMERIC(18, 8),
    copied_price NUMERIC(18, 8),
    slippage_percent NUMERIC(6, 4),

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'skipped')),
    failure_reason TEXT,

    -- Timing
    original_trade_at TIMESTAMPTZ,
    copied_at TIMESTAMPTZ,
    delay_hours NUMERIC(6, 2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published portfolio performance history
CREATE TABLE IF NOT EXISTS published_portfolio_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    published_portfolio_id UUID NOT NULL REFERENCES published_portfolios(id) ON DELETE CASCADE,

    snapshot_date DATE NOT NULL,
    total_value NUMERIC(18, 2),
    daily_return_percent NUMERIC(8, 4),
    cumulative_return_percent NUMERIC(10, 4),
    holdings_count INTEGER,

    -- Top holdings snapshot
    top_holdings JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(published_portfolio_id, snapshot_date)
);

-- Creator earnings/payouts
CREATE TABLE IF NOT EXISTS creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Earnings period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Earnings breakdown
    total_subscribers INTEGER DEFAULT 0,
    subscription_revenue NUMERIC(12, 2) DEFAULT 0,
    creator_share_percent NUMERIC(5, 2) DEFAULT 20,
    creator_earnings NUMERIC(12, 2) DEFAULT 0,
    platform_fee NUMERIC(12, 2) DEFAULT 0,

    -- Payout
    payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    payout_method VARCHAR(50),
    payout_reference VARCHAR(255),
    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(creator_user_id, period_start, period_end)
);

-- ============================================
-- 5. ON-CHAIN ANALYTICS DASHBOARD
-- Free: Basic metrics
-- Premium: $29.99/month for pro analytics
-- ============================================

-- On-chain metrics (aggregated data)
CREATE TABLE IF NOT EXISTS onchain_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Asset info
    asset_symbol VARCHAR(20) NOT NULL,
    asset_name VARCHAR(200),
    chain VARCHAR(50) DEFAULT 'bitcoin',

    -- Metric type
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'active_addresses', 'transaction_count', 'transaction_volume',
        'exchange_inflow', 'exchange_outflow', 'exchange_netflow',
        'miner_revenue', 'miner_outflow', 'hash_rate',
        'difficulty', 'block_size', 'fees',
        'nvt_ratio', 'mvrv_ratio', 'sopr',
        'realized_cap', 'thermocap', 'supply_held_1y_plus',
        'whale_transactions', 'large_transactions',
        'stablecoin_supply', 'defi_tvl'
    )),

    -- Metric data
    timestamp TIMESTAMPTZ NOT NULL,
    value NUMERIC(28, 8) NOT NULL,
    value_usd NUMERIC(24, 2),

    -- Change metrics
    change_24h NUMERIC(10, 4),
    change_7d NUMERIC(10, 4),
    change_30d NUMERIC(10, 4),

    -- Aggregation
    aggregation_period VARCHAR(20) DEFAULT 'daily' CHECK (aggregation_period IN ('hourly', 'daily', 'weekly', 'monthly')),

    -- Source
    data_source VARCHAR(50) NOT NULL, -- glassnode, santiment, intotheblock, etc.

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(asset_symbol, chain, metric_type, timestamp, aggregation_period)
);

-- On-chain analytics subscriptions
CREATE TABLE IF NOT EXISTS onchain_analytics_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Subscription tier
    tier VARCHAR(20) DEFAULT 'pro' CHECK (tier IN ('basic', 'pro', 'enterprise')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'past_due', 'cancelled')),

    -- Pricing
    price_paid NUMERIC(8, 2) NOT NULL DEFAULT 29.99,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_period VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),

    -- Features by tier
    -- Basic (free): limited metrics, daily data only
    -- Pro ($29.99): all metrics, hourly data, alerts, API access
    -- Enterprise (custom): everything + historical data export, team access

    max_alerts INTEGER DEFAULT 20,
    api_access BOOLEAN DEFAULT true,
    historical_days INTEGER DEFAULT 365,
    custom_dashboards BOOLEAN DEFAULT true,
    export_enabled BOOLEAN DEFAULT true,

    -- Stripe
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),

    -- Dates
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- On-chain metric alerts
CREATE TABLE IF NOT EXISTS onchain_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Alert config
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Target metric
    asset_symbol VARCHAR(20) NOT NULL,
    chain VARCHAR(50) DEFAULT 'bitcoin',
    metric_type VARCHAR(50) NOT NULL,

    -- Conditions
    condition VARCHAR(30) NOT NULL CHECK (condition IN (
        'above_threshold', 'below_threshold',
        'percent_increase', 'percent_decrease',
        'crosses_above', 'crosses_below'
    )),
    threshold_value NUMERIC(28, 8),
    percent_change NUMERIC(8, 4),
    lookback_period VARCHAR(20), -- 1h, 24h, 7d, 30d

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    triggered_count INTEGER DEFAULT 0,

    -- Notifications
    notify_email BOOLEAN DEFAULT true,
    notify_push BOOLEAN DEFAULT false,
    cooldown_minutes INTEGER DEFAULT 60, -- Don't trigger again within this period

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User saved dashboards
CREATE TABLE IF NOT EXISTS onchain_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,

    -- Dashboard config
    layout JSONB DEFAULT '[]', -- Widget positions and sizes
    widgets JSONB DEFAULT '[]', -- Widget configurations
    filters JSONB DEFAULT '{}', -- Global filters

    -- Sharing
    share_slug VARCHAR(100) UNIQUE,
    views_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Influencer Verification
CREATE INDEX IF NOT EXISTS idx_verified_influencers_user ON verified_influencers(user_id);
CREATE INDEX IF NOT EXISTS idx_verified_influencers_status ON verified_influencers(verification_status);
CREATE INDEX IF NOT EXISTS idx_verified_influencers_slug ON verified_influencers(slug);
CREATE INDEX IF NOT EXISTS idx_influencer_requests_user ON influencer_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_requests_status ON influencer_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_influencer_snapshots_date ON influencer_performance_snapshots(influencer_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_influencer_transparency_user ON influencer_transparency_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_claims_influencer ON influencer_trade_claims(influencer_id);

-- Lending
CREATE INDEX IF NOT EXISTS idx_lending_platforms_type ON lending_platforms(platform_type);
CREATE INDEX IF NOT EXISTS idx_lending_platforms_status ON lending_platforms(status);
CREATE INDEX IF NOT EXISTS idx_lending_rates_platform ON lending_rates(platform_id);
CREATE INDEX IF NOT EXISTS idx_lending_rates_asset ON lending_rates(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_lending_rates_apy ON lending_rates(lending_apy DESC);
CREATE INDEX IF NOT EXISTS idx_lending_rate_history_date ON lending_rate_history(platform_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_lending_referrals_platform ON lending_referrals(platform_id);
CREATE INDEX IF NOT EXISTS idx_lending_referrals_user ON lending_referrals(user_id);

-- NFT
CREATE INDEX IF NOT EXISTS idx_nft_collections_chain ON nft_collections(chain);
CREATE INDEX IF NOT EXISTS idx_nft_collections_floor ON nft_collections(floor_price_usd DESC);
CREATE INDEX IF NOT EXISTS idx_nft_holdings_user ON nft_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_holdings_wallet ON nft_holdings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_holdings_collection ON nft_holdings(collection_id);
CREATE INDEX IF NOT EXISTS idx_nft_alerts_user ON nft_price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_floor_history ON nft_floor_price_history(collection_id, snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_nft_subscriptions_user ON nft_portfolio_subscriptions(user_id);

-- Social Trading
CREATE INDEX IF NOT EXISTS idx_published_portfolios_user ON published_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_published_portfolios_slug ON published_portfolios(slug);
CREATE INDEX IF NOT EXISTS idx_published_portfolios_copiers ON published_portfolios(copiers_count DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_followers_follower ON portfolio_followers(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_followers_portfolio ON portfolio_followers(published_portfolio_id);
CREATE INDEX IF NOT EXISTS idx_copy_subscriptions_subscriber ON copy_trading_subscriptions(subscriber_user_id);
CREATE INDEX IF NOT EXISTS idx_copy_subscriptions_creator ON copy_trading_subscriptions(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_copy_executions_subscription ON copy_trade_executions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_date ON published_portfolio_history(published_portfolio_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_user ON creator_earnings(creator_user_id);

-- On-Chain Analytics
CREATE INDEX IF NOT EXISTS idx_onchain_metrics_asset ON onchain_metrics(asset_symbol, chain);
CREATE INDEX IF NOT EXISTS idx_onchain_metrics_type ON onchain_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_onchain_metrics_time ON onchain_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_onchain_metrics_combined ON onchain_metrics(asset_symbol, metric_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_onchain_subscriptions_user ON onchain_analytics_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_onchain_alerts_user ON onchain_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_onchain_dashboards_user ON onchain_dashboards(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE verified_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_transparency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_trade_claims ENABLE ROW LEVEL SECURITY;

ALTER TABLE lending_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending_referrals ENABLE ROW LEVEL SECURITY;

ALTER TABLE nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_portfolio_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_floor_price_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE published_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_trading_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_trade_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_portfolio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

ALTER TABLE onchain_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_analytics_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_dashboards ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Verified Influencers - Public viewing for verified, own profile management
CREATE POLICY "Public can view verified influencers"
    ON verified_influencers FOR SELECT
    USING (verification_status = 'verified');

CREATE POLICY "Users can view own influencer profile"
    ON verified_influencers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own influencer profile"
    ON verified_influencers FOR UPDATE
    USING (auth.uid() = user_id);

-- Influencer Requests - Users manage own
CREATE POLICY "Users can view own verification requests"
    ON influencer_verification_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests"
    ON influencer_verification_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verification requests"
    ON influencer_verification_requests FOR UPDATE
    USING (auth.uid() = user_id);

-- Performance Snapshots - Public for verified influencers
CREATE POLICY "Public can view verified influencer snapshots"
    ON influencer_performance_snapshots FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM verified_influencers
        WHERE verified_influencers.id = influencer_performance_snapshots.influencer_id
        AND verified_influencers.verification_status = 'verified'
    ));

-- Transparency Subscriptions - Users manage own
CREATE POLICY "Users can view own transparency subscription"
    ON influencer_transparency_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transparency subscription"
    ON influencer_transparency_subscriptions FOR ALL
    USING (auth.uid() = user_id);

-- Trade Claims - Public for verified influencers
CREATE POLICY "Public can view verified trade claims"
    ON influencer_trade_claims FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM verified_influencers
        WHERE verified_influencers.id = influencer_trade_claims.influencer_id
        AND verified_influencers.verification_status = 'verified'
    ));

-- Lending Platforms - Public read
CREATE POLICY "Public can view lending platforms"
    ON lending_platforms FOR SELECT
    USING (true);

-- Lending Rates - Public read
CREATE POLICY "Public can view lending rates"
    ON lending_rates FOR SELECT
    USING (true);

-- Lending Rate History - Public read
CREATE POLICY "Public can view lending rate history"
    ON lending_rate_history FOR SELECT
    USING (true);

-- Lending Referrals - Users view own
CREATE POLICY "Users can view own lending referrals"
    ON lending_referrals FOR SELECT
    USING (auth.uid() = user_id);

-- NFT Collections - Public read
CREATE POLICY "Public can view NFT collections"
    ON nft_collections FOR SELECT
    USING (true);

-- NFT Holdings - Users manage own
CREATE POLICY "Users can view own NFT holdings"
    ON nft_holdings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own NFT holdings"
    ON nft_holdings FOR ALL
    USING (auth.uid() = user_id);

-- NFT Alerts - Users manage own
CREATE POLICY "Users can view own NFT alerts"
    ON nft_price_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own NFT alerts"
    ON nft_price_alerts FOR ALL
    USING (auth.uid() = user_id);

-- NFT Subscriptions - Users manage own
CREATE POLICY "Users can view own NFT subscription"
    ON nft_portfolio_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own NFT subscription"
    ON nft_portfolio_subscriptions FOR ALL
    USING (auth.uid() = user_id);

-- NFT Floor History - Public read
CREATE POLICY "Public can view floor price history"
    ON nft_floor_price_history FOR SELECT
    USING (true);

-- Published Portfolios - Active ones are public
CREATE POLICY "Public can view active published portfolios"
    ON published_portfolios FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users can manage own published portfolios"
    ON published_portfolios FOR ALL
    USING (auth.uid() = user_id);

-- Portfolio Followers - Users manage own
CREATE POLICY "Users can view own follows"
    ON portfolio_followers FOR SELECT
    USING (auth.uid() = follower_user_id);

CREATE POLICY "Users can manage own follows"
    ON portfolio_followers FOR ALL
    USING (auth.uid() = follower_user_id);

-- Copy Subscriptions - Users view own (subscriber or creator)
CREATE POLICY "Users can view own copy subscriptions"
    ON copy_trading_subscriptions FOR SELECT
    USING (auth.uid() = subscriber_user_id OR auth.uid() = creator_user_id);

CREATE POLICY "Subscribers can manage own subscriptions"
    ON copy_trading_subscriptions FOR ALL
    USING (auth.uid() = subscriber_user_id);

-- Copy Executions - Users view own
CREATE POLICY "Users can view own copy executions"
    ON copy_trade_executions FOR SELECT
    USING (auth.uid() = copier_user_id);

-- Portfolio History - Public for active portfolios
CREATE POLICY "Public can view portfolio history"
    ON published_portfolio_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM published_portfolios
        WHERE published_portfolios.id = published_portfolio_history.published_portfolio_id
        AND published_portfolios.is_active = true
    ));

-- Creator Earnings - Users view own
CREATE POLICY "Users can view own earnings"
    ON creator_earnings FOR SELECT
    USING (auth.uid() = creator_user_id);

-- On-Chain Metrics - Public read (feature-gated in app)
CREATE POLICY "Public can view on-chain metrics"
    ON onchain_metrics FOR SELECT
    USING (true);

-- On-Chain Subscriptions - Users manage own
CREATE POLICY "Users can view own analytics subscription"
    ON onchain_analytics_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analytics subscription"
    ON onchain_analytics_subscriptions FOR ALL
    USING (auth.uid() = user_id);

-- On-Chain Alerts - Users manage own
CREATE POLICY "Users can view own on-chain alerts"
    ON onchain_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own on-chain alerts"
    ON onchain_alerts FOR ALL
    USING (auth.uid() = user_id);

-- On-Chain Dashboards - Users manage own, public ones viewable
CREATE POLICY "Users can view own dashboards"
    ON onchain_dashboards FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own dashboards"
    ON onchain_dashboards FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_monetization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trigger_verified_influencers_updated
    BEFORE UPDATE ON verified_influencers
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_influencer_requests_updated
    BEFORE UPDATE ON influencer_verification_requests
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_influencer_transparency_updated
    BEFORE UPDATE ON influencer_transparency_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_lending_platforms_updated
    BEFORE UPDATE ON lending_platforms
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_nft_collections_updated
    BEFORE UPDATE ON nft_collections
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_nft_holdings_updated
    BEFORE UPDATE ON nft_holdings
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_nft_subscriptions_updated
    BEFORE UPDATE ON nft_portfolio_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_published_portfolios_updated
    BEFORE UPDATE ON published_portfolios
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_copy_subscriptions_updated
    BEFORE UPDATE ON copy_trading_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_creator_earnings_updated
    BEFORE UPDATE ON creator_earnings
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_onchain_subscriptions_updated
    BEFORE UPDATE ON onchain_analytics_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_onchain_alerts_updated
    BEFORE UPDATE ON onchain_alerts
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

CREATE TRIGGER trigger_onchain_dashboards_updated
    BEFORE UPDATE ON onchain_dashboards
    FOR EACH ROW EXECUTE FUNCTION update_monetization_updated_at();

-- Function to update follower count
CREATE OR REPLACE FUNCTION update_portfolio_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE published_portfolios
        SET followers_count = followers_count + 1
        WHERE id = NEW.published_portfolio_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE published_portfolios
        SET followers_count = followers_count - 1
        WHERE id = OLD.published_portfolio_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_portfolio_followers_count
    AFTER INSERT OR DELETE ON portfolio_followers
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_followers_count();

-- Function to update copiers count
CREATE OR REPLACE FUNCTION update_portfolio_copiers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE published_portfolios
        SET copiers_count = copiers_count + 1
        WHERE id = NEW.published_portfolio_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE published_portfolios
        SET copiers_count = copiers_count - 1
        WHERE id = OLD.published_portfolio_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE published_portfolios
            SET copiers_count = copiers_count + 1
            WHERE id = NEW.published_portfolio_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE published_portfolios
            SET copiers_count = copiers_count - 1
            WHERE id = NEW.published_portfolio_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_portfolio_copiers_count
    AFTER INSERT OR DELETE OR UPDATE ON copy_trading_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_copiers_count();

-- Function to update influencer followers count
CREATE OR REPLACE FUNCTION update_influencer_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE verified_influencers
        SET followers_count = followers_count + 1
        WHERE user_id = (
            SELECT user_id FROM published_portfolios WHERE id = NEW.published_portfolio_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get best lending rates for an asset
CREATE OR REPLACE FUNCTION get_best_lending_rates(p_asset_symbol VARCHAR(20))
RETURNS TABLE (
    platform_name VARCHAR(200),
    platform_slug VARCHAR(100),
    platform_type VARCHAR(30),
    lending_apy NUMERIC(10, 4),
    borrowing_apy NUMERIC(10, 4),
    trust_score NUMERIC(3, 1)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        lp.name as platform_name,
        lp.slug as platform_slug,
        lp.platform_type,
        lr.lending_apy,
        lr.borrowing_apy,
        lp.trust_score
    FROM lending_rates lr
    JOIN lending_platforms lp ON lp.id = lr.platform_id
    WHERE lr.asset_symbol = p_asset_symbol
      AND lp.status = 'active'
    ORDER BY lr.lending_apy DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get influencer accuracy score
CREATE OR REPLACE FUNCTION calculate_influencer_accuracy(p_influencer_id UUID)
RETURNS NUMERIC(5, 2) AS $$
DECLARE
    total_claims INTEGER;
    verified_claims INTEGER;
    accurate_claims INTEGER;
    accuracy NUMERIC(5, 2);
BEGIN
    SELECT COUNT(*) INTO total_claims
    FROM influencer_trade_claims
    WHERE influencer_id = p_influencer_id;

    SELECT COUNT(*) INTO verified_claims
    FROM influencer_trade_claims
    WHERE influencer_id = p_influencer_id
      AND verification_status = 'verified';

    SELECT COUNT(*) INTO accurate_claims
    FROM influencer_trade_claims
    WHERE influencer_id = p_influencer_id
      AND verification_status = 'verified'
      AND ABS(COALESCE(claimed_return_percent, 0) - COALESCE(verified_return_percent, 0)) < 5; -- Within 5% is accurate

    IF verified_claims > 0 THEN
        accuracy := (accurate_claims::NUMERIC / verified_claims::NUMERIC) * 100;
    ELSE
        accuracy := NULL;
    END IF;

    RETURN accuracy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE verified_influencers IS 'Verified crypto influencers with performance tracking';
COMMENT ON TABLE influencer_trade_claims IS 'Track influencer trade claims vs verified performance';
COMMENT ON TABLE lending_platforms IS 'DeFi and CeFi lending platforms for rate comparison';
COMMENT ON TABLE lending_rates IS 'Current lending/borrowing rates across platforms';
COMMENT ON TABLE nft_collections IS 'NFT collection metadata and floor prices';
COMMENT ON TABLE nft_holdings IS 'User NFT holdings with rarity and valuation';
COMMENT ON TABLE published_portfolios IS 'Portfolios published for social trading/copying';
COMMENT ON TABLE copy_trading_subscriptions IS 'Users subscribing to copy other portfolios';
COMMENT ON TABLE onchain_metrics IS 'Aggregated on-chain analytics data';
COMMENT ON TABLE onchain_analytics_subscriptions IS 'Premium subscriptions for on-chain analytics';
