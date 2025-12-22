/**
 * Advanced Monetization Features Types
 *
 * 1. Influencer Verification Program
 * 2. Crypto Lending/Borrowing Comparison
 * 3. NFT Portfolio Tracking (Premium)
 * 4. Social Trading / Copy Portfolio
 * 5. On-Chain Analytics Dashboard
 */

// ============================================
// 1. INFLUENCER VERIFICATION PROGRAM
// ============================================

export type InfluencerVerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';
export type InfluencerVerificationTier = 'standard' | 'professional' | 'elite';
export type InfluencerSubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'cancelled';
export type WalletVerificationStatus = 'none' | 'partial' | 'full';

export interface VerifiedInfluencer {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  profile_image: string | null;
  banner_image: string | null;

  // Social media
  twitter_handle: string | null;
  twitter_followers: number;
  youtube_channel: string | null;
  youtube_subscribers: number;
  tiktok_handle: string | null;
  tiktok_followers: number;
  instagram_handle: string | null;
  instagram_followers: number;
  telegram_channel: string | null;
  discord_server: string | null;
  website_url: string | null;

  // Verification
  verification_status: InfluencerVerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  verification_tier: InfluencerVerificationTier;

  // Subscription ($49/month)
  subscription_status: InfluencerSubscriptionStatus;
  subscription_expires_at: string | null;
  stripe_subscription_id: string | null;
  monthly_fee: number;

  // Performance metrics
  total_claimed_trades: number;
  verified_trades: number;
  claimed_win_rate: number | null;
  verified_win_rate: number | null;
  claimed_total_return: number | null;
  verified_total_return: number | null;
  accuracy_score: number | null;

  // Engagement
  followers_count: number;
  transparency_score: number | null;
  trust_score: number | null;

  // Wallet verification
  verified_wallets: string[];
  wallet_verification_status: WalletVerificationStatus;

  created_at: string;
  updated_at: string;
}

export type VerificationRequestStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'more_info_needed';

export interface InfluencerVerificationRequest {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  twitter_handle: string | null;
  youtube_channel: string | null;
  other_social_links: Record<string, string>;
  website_url: string | null;
  follower_proof_urls: string[];
  identity_verification_type: string | null;
  wallet_addresses: string[];
  previous_content_urls: string[];
  application_text: string | null;
  specialization: string | null;
  years_experience: number | null;
  status: VerificationRequestStatus;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface InfluencerPerformanceSnapshot {
  id: string;
  influencer_id: string;
  snapshot_date: string;
  claimed_portfolio_value: number | null;
  verified_portfolio_value: number | null;
  claimed_daily_return: number | null;
  verified_daily_return: number | null;
  claimed_weekly_return: number | null;
  verified_weekly_return: number | null;
  claimed_monthly_return: number | null;
  verified_monthly_return: number | null;
  trades_claimed: number;
  trades_verified: number;
  winning_trades_claimed: number;
  winning_trades_verified: number;
  follower_count: number;
  engagement_rate: number | null;
  created_at: string;
}

export interface InfluencerTransparencySubscription {
  id: string;
  user_id: string;
  subscription_type: 'monthly' | 'yearly';
  status: 'active' | 'inactive' | 'past_due' | 'cancelled';
  price_paid: number;
  currency: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TradeClaimType = 'buy' | 'sell' | 'call' | 'prediction';
export type TradeClaimVerificationStatus = 'pending' | 'verified' | 'disputed' | 'unverifiable' | 'false_claim';

export interface InfluencerTradeClaim {
  id: string;
  influencer_id: string;
  claim_type: TradeClaimType;
  asset_symbol: string;
  asset_name: string | null;
  claimed_entry_price: number | null;
  claimed_exit_price: number | null;
  claimed_entry_date: string | null;
  claimed_exit_date: string | null;
  claimed_return_percent: number | null;
  verified_entry_price: number | null;
  verified_exit_price: number | null;
  verified_entry_date: string | null;
  verified_exit_date: string | null;
  verified_return_percent: number | null;
  verification_status: TradeClaimVerificationStatus;
  verification_source: string | null;
  verification_tx_hash: string | null;
  verification_notes: string | null;
  claim_source_url: string | null;
  claim_screenshot_url: string | null;
  created_at: string;
  verified_at: string | null;
}

// ============================================
// 2. CRYPTO LENDING/BORROWING COMPARISON
// ============================================

export type LendingPlatformType = 'cefi' | 'defi' | 'hybrid';
export type LendingPlatformStatus = 'active' | 'paused' | 'deprecated' | 'warning';
export type AffiliateCommissionType = 'cpa' | 'revenue_share' | 'hybrid';

export interface LendingPlatform {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string;
  description: string | null;
  platform_type: LendingPlatformType;
  supported_chains: string[];
  trust_score: number | null;
  security_audit_url: string | null;
  is_insured: boolean;
  insurance_details: string | null;
  regulatory_status: string | null;
  jurisdiction: string | null;
  supports_lending: boolean;
  supports_borrowing: boolean;
  supports_staking: boolean;
  min_deposit: number | null;
  max_ltv: number | null;
  liquidation_threshold: number | null;
  affiliate_program_url: string | null;
  affiliate_commission_type: AffiliateCommissionType | null;
  affiliate_cpa_amount: number | null;
  affiliate_revenue_share: number | null;
  affiliate_cookie_days: number;
  status: LendingPlatformStatus;
  warning_message: string | null;
  created_at: string;
  updated_at: string;
}

export type LendingAssetType = 'crypto' | 'stablecoin' | 'lp_token';

export interface LendingRate {
  id: string;
  platform_id: string;
  asset_symbol: string;
  asset_name: string | null;
  asset_type: LendingAssetType | null;
  chain: string;
  lending_apy: number | null;
  lending_apy_base: number | null;
  lending_apy_rewards: number | null;
  lending_rewards_token: string | null;
  borrowing_apy: number | null;
  borrowing_apy_variable: boolean;
  borrowing_apy_stable: number | null;
  total_supplied: number | null;
  total_borrowed: number | null;
  utilization_rate: number | null;
  can_be_collateral: boolean;
  collateral_factor: number | null;
  supply_cap: number | null;
  borrow_cap: number | null;
  last_updated_at: string;
  data_source: string | null;
}

export interface LendingRateHistory {
  id: string;
  platform_id: string;
  asset_symbol: string;
  chain: string;
  snapshot_date: string;
  lending_apy: number | null;
  borrowing_apy: number | null;
  utilization_rate: number | null;
  total_supplied: number | null;
  total_borrowed: number | null;
  created_at: string;
}

export type LendingReferralCommissionStatus = 'pending' | 'confirmed' | 'paid' | 'rejected';

export interface LendingReferral {
  id: string;
  user_id: string | null;
  session_id: string;
  platform_id: string;
  referral_link: string;
  clicked_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  converted: boolean;
  converted_at: string | null;
  deposit_amount: number | null;
  deposit_currency: string | null;
  commission_earned: number | null;
  commission_status: LendingReferralCommissionStatus;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  created_at: string;
}

// Aggregated rate comparison
export interface LendingRateComparison {
  asset_symbol: string;
  asset_name: string;
  rates: {
    platform: LendingPlatform;
    lending_apy: number;
    borrowing_apy: number;
    utilization: number;
  }[];
  best_lending_platform: string;
  best_borrowing_platform: string;
}

// ============================================
// 3. NFT PORTFOLIO TRACKING (PREMIUM)
// ============================================

export interface NFTCollection {
  id: string;
  contract_address: string;
  chain: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  external_url: string | null;
  creator_address: string | null;
  creator_name: string | null;
  creator_royalty_percent: number | null;
  total_supply: number | null;
  num_owners: number | null;
  floor_price: number | null;
  floor_price_usd: number | null;
  total_volume: number | null;
  total_volume_usd: number | null;
  one_day_volume: number | null;
  one_day_change: number | null;
  seven_day_volume: number | null;
  seven_day_change: number | null;
  thirty_day_volume: number | null;
  thirty_day_change: number | null;
  average_price: number | null;
  market_cap: number | null;
  has_rarity_data: boolean;
  rarity_source: string | null;
  is_verified: boolean;
  opensea_verified: boolean;
  category: string | null;
  traits: Record<string, unknown>;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export type NFTAcquisitionType = 'purchase' | 'mint' | 'transfer' | 'airdrop' | 'unknown';

export interface NFTHolding {
  id: string;
  user_id: string;
  wallet_address: string;
  chain: string;
  collection_id: string | null;
  contract_address: string;
  token_id: string;
  token_standard: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  animation_url: string | null;
  attributes: Array<{ trait_type: string; value: string | number }>;
  rarity_rank: number | null;
  rarity_score: number | null;
  rarity_percentile: number | null;
  acquired_at: string | null;
  acquired_price: number | null;
  acquired_price_usd: number | null;
  acquisition_tx_hash: string | null;
  acquisition_type: NFTAcquisitionType | null;
  last_sale_price: number | null;
  last_sale_date: string | null;
  estimated_value: number | null;
  estimated_value_usd: number | null;
  floor_difference_percent: number | null;
  is_listed: boolean;
  listing_price: number | null;
  listing_marketplace: string | null;
  cost_basis: number | null;
  unrealized_pnl: number | null;
  unrealized_pnl_percent: number | null;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export type NFTAlertType = 'collection_floor' | 'token_price' | 'rarity_available';
export type NFTAlertCondition = 'above' | 'below' | 'percent_change';

export interface NFTPriceAlert {
  id: string;
  user_id: string;
  alert_type: NFTAlertType;
  collection_id: string | null;
  token_id: string | null;
  condition: NFTAlertCondition;
  target_price: number | null;
  target_percent: number | null;
  is_active: boolean;
  triggered_at: string | null;
  triggered_price: number | null;
  notify_email: boolean;
  notify_push: boolean;
  created_at: string;
}

export interface NFTPortfolioSubscription {
  id: string;
  user_id: string;
  subscription_type: 'monthly' | 'yearly' | 'bundled';
  status: 'active' | 'inactive' | 'past_due' | 'cancelled';
  price_paid: number;
  currency: string;
  max_wallets: number;
  max_collections_tracked: number;
  rarity_analytics: boolean;
  floor_alerts: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NFTFloorPriceHistory {
  id: string;
  collection_id: string;
  snapshot_time: string;
  floor_price: number;
  floor_price_usd: number | null;
  num_listed: number | null;
  volume_24h: number | null;
  created_at: string;
}

// NFT Portfolio Summary
export interface NFTPortfolioSummary {
  total_nfts: number;
  total_collections: number;
  total_value_eth: number;
  total_value_usd: number;
  total_cost_basis: number;
  total_unrealized_pnl: number;
  total_unrealized_pnl_percent: number;
  top_collections: {
    collection: NFTCollection;
    holdings_count: number;
    total_value: number;
  }[];
}

// ============================================
// 4. SOCIAL TRADING / COPY PORTFOLIO
// ============================================

export type TradingStyle = 'day_trading' | 'swing_trading' | 'hodl' | 'dca' | 'yield_farming' | 'mixed';
export type RiskLevel = 'conservative' | 'moderate' | 'aggressive' | 'degen';

export interface PublishedPortfolio {
  id: string;
  user_id: string;
  portfolio_id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  trading_style: TradingStyle | null;
  risk_level: RiskLevel | null;
  specialization: string | null;
  total_return_percent: number | null;
  monthly_return_percent: number | null;
  yearly_return_percent: number | null;
  max_drawdown_percent: number | null;
  sharpe_ratio: number | null;
  win_rate: number | null;
  avg_trade_duration_hours: number | null;
  followers_count: number;
  copiers_count: number;
  views_count: number;
  is_free: boolean;
  subscription_price: number;
  creator_revenue_share: number;
  is_active: boolean;
  show_holdings: boolean;
  show_transactions: boolean;
  delay_transactions_hours: number;
  min_copy_amount: number;
  is_verified: boolean;
  verified_at: string | null;
  stats_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioFollower {
  id: string;
  follower_user_id: string;
  published_portfolio_id: string;
  followed_at: string;
  notifications_enabled: boolean;
}

export type CopyTradingStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type CopyMode = 'proportional' | 'fixed_amount' | 'mirror';

export interface CopyTradingSubscription {
  id: string;
  subscriber_user_id: string;
  published_portfolio_id: string;
  creator_user_id: string;
  status: CopyTradingStatus;
  subscription_type: 'monthly' | 'yearly';
  price_paid: number;
  currency: string;
  copy_mode: CopyMode;
  allocated_amount: number | null;
  max_position_size: number | null;
  copy_new_trades: boolean;
  auto_rebalance: boolean;
  stripe_subscription_id: string | null;
  creator_earnings: number;
  platform_earnings: number;
  last_payout_at: string | null;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CopyTradeStatus = 'pending' | 'executed' | 'failed' | 'skipped';
export type CopyTradeType = 'buy' | 'sell' | 'rebalance';

export interface CopyTradeExecution {
  id: string;
  subscription_id: string;
  copier_user_id: string;
  original_transaction_id: string | null;
  trade_type: CopyTradeType;
  asset_symbol: string;
  asset_name: string | null;
  original_amount: number | null;
  copied_amount: number | null;
  original_price: number | null;
  copied_price: number | null;
  slippage_percent: number | null;
  status: CopyTradeStatus;
  failure_reason: string | null;
  original_trade_at: string | null;
  copied_at: string | null;
  delay_hours: number | null;
  created_at: string;
}

export interface PublishedPortfolioHistory {
  id: string;
  published_portfolio_id: string;
  snapshot_date: string;
  total_value: number | null;
  daily_return_percent: number | null;
  cumulative_return_percent: number | null;
  holdings_count: number | null;
  top_holdings: Array<{
    symbol: string;
    name: string;
    allocation_percent: number;
  }>;
  created_at: string;
}

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface CreatorEarnings {
  id: string;
  creator_user_id: string;
  period_start: string;
  period_end: string;
  total_subscribers: number;
  subscription_revenue: number;
  creator_share_percent: number;
  creator_earnings: number;
  platform_fee: number;
  payout_status: PayoutStatus;
  payout_method: string | null;
  payout_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// Social Trading Leaderboard
export interface SocialTradingLeaderboard {
  top_performers: PublishedPortfolio[];
  most_copied: PublishedPortfolio[];
  trending: PublishedPortfolio[];
  new_creators: PublishedPortfolio[];
}

// ============================================
// 5. ON-CHAIN ANALYTICS DASHBOARD
// ============================================

export type OnChainMetricType =
  | 'active_addresses'
  | 'transaction_count'
  | 'transaction_volume'
  | 'exchange_inflow'
  | 'exchange_outflow'
  | 'exchange_netflow'
  | 'miner_revenue'
  | 'miner_outflow'
  | 'hash_rate'
  | 'difficulty'
  | 'block_size'
  | 'fees'
  | 'nvt_ratio'
  | 'mvrv_ratio'
  | 'sopr'
  | 'realized_cap'
  | 'thermocap'
  | 'supply_held_1y_plus'
  | 'whale_transactions'
  | 'large_transactions'
  | 'stablecoin_supply'
  | 'defi_tvl';

export type AggregationPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface OnChainMetric {
  id: string;
  asset_symbol: string;
  asset_name: string | null;
  chain: string;
  metric_type: OnChainMetricType;
  timestamp: string;
  value: number;
  value_usd: number | null;
  change_24h: number | null;
  change_7d: number | null;
  change_30d: number | null;
  aggregation_period: AggregationPeriod;
  data_source: string;
  created_at: string;
}

export type OnChainTier = 'basic' | 'pro' | 'enterprise';

export interface OnChainAnalyticsSubscription {
  id: string;
  user_id: string;
  tier: OnChainTier;
  status: 'active' | 'inactive' | 'past_due' | 'cancelled';
  price_paid: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  max_alerts: number;
  api_access: boolean;
  historical_days: number;
  custom_dashboards: boolean;
  export_enabled: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type OnChainAlertCondition =
  | 'above_threshold'
  | 'below_threshold'
  | 'percent_increase'
  | 'percent_decrease'
  | 'crosses_above'
  | 'crosses_below';

export interface OnChainAlert {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  asset_symbol: string;
  chain: string;
  metric_type: OnChainMetricType;
  condition: OnChainAlertCondition;
  threshold_value: number | null;
  percent_change: number | null;
  lookback_period: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  triggered_count: number;
  notify_email: boolean;
  notify_push: boolean;
  cooldown_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface OnChainDashboard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_public: boolean;
  layout: Array<{
    widget_id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  widgets: Array<{
    id: string;
    type: 'chart' | 'metric' | 'table' | 'heatmap';
    title: string;
    config: Record<string, unknown>;
  }>;
  filters: {
    assets?: string[];
    timeframe?: string;
    metrics?: OnChainMetricType[];
  };
  share_slug: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
}

// Pre-defined metric categories for UI
export interface OnChainMetricCategory {
  name: string;
  description: string;
  metrics: OnChainMetricType[];
  tier_required: OnChainTier;
}

export const ON_CHAIN_METRIC_CATEGORIES: OnChainMetricCategory[] = [
  {
    name: 'Network Activity',
    description: 'Basic network usage metrics',
    metrics: ['active_addresses', 'transaction_count', 'transaction_volume'],
    tier_required: 'basic',
  },
  {
    name: 'Exchange Flows',
    description: 'Track crypto moving in/out of exchanges',
    metrics: ['exchange_inflow', 'exchange_outflow', 'exchange_netflow'],
    tier_required: 'pro',
  },
  {
    name: 'Mining Metrics',
    description: 'Miner activity and network security',
    metrics: ['miner_revenue', 'miner_outflow', 'hash_rate', 'difficulty'],
    tier_required: 'pro',
  },
  {
    name: 'Valuation Metrics',
    description: 'On-chain valuation indicators',
    metrics: ['nvt_ratio', 'mvrv_ratio', 'sopr', 'realized_cap', 'thermocap'],
    tier_required: 'pro',
  },
  {
    name: 'Holder Analysis',
    description: 'Long-term holder and whale behavior',
    metrics: ['supply_held_1y_plus', 'whale_transactions', 'large_transactions'],
    tier_required: 'pro',
  },
  {
    name: 'DeFi & Stablecoins',
    description: 'DeFi TVL and stablecoin metrics',
    metrics: ['stablecoin_supply', 'defi_tvl'],
    tier_required: 'pro',
  },
];

// ============================================
// PRICING CONSTANTS
// ============================================

export const MONETIZATION_PRICING = {
  influencer_verification: {
    influencer_monthly: 49.0,
    user_transparency_monthly: 2.99,
    user_transparency_yearly: 29.99,
  },
  nft_portfolio: {
    monthly: 14.99,
    yearly: 149.99,
  },
  copy_trading: {
    default_price: 9.99,
    creator_share_percent: 20,
    platform_share_percent: 80,
  },
  onchain_analytics: {
    basic: 0,
    pro_monthly: 29.99,
    pro_yearly: 299.99,
    enterprise: 'custom',
  },
  lending_affiliate: {
    min_commission: 500,
    max_commission: 5000,
  },
} as const;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface InfluencerSearchResult {
  influencers: VerifiedInfluencer[];
  total: number;
  page: number;
  per_page: number;
}

export interface LendingRatesResponse {
  asset: string;
  rates: (LendingRate & { platform: LendingPlatform })[];
  best_lending: { platform: string; apy: number } | null;
  best_borrowing: { platform: string; apy: number } | null;
  updated_at: string;
}

export interface NFTPortfolioResponse {
  holdings: NFTHolding[];
  collections: NFTCollection[];
  summary: NFTPortfolioSummary;
  alerts: NFTPriceAlert[];
}

export interface SocialTradingResponse {
  portfolio: PublishedPortfolio;
  history: PublishedPortfolioHistory[];
  recent_trades: CopyTradeExecution[];
  creator?: {
    display_name: string;
    avatar_url: string | null;
    verified: boolean;
  };
}

export interface OnChainDashboardResponse {
  metrics: OnChainMetric[];
  alerts: OnChainAlert[];
  subscription: OnChainAnalyticsSubscription | null;
  available_metrics: OnChainMetricCategory[];
}
