// User Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  subscription_status: 'free' | 'premium';
  subscription_expires_at?: string;
  preferences: UserPreferences;
  referral_code?: string;
  referred_by?: string;
}

export interface UserPreferences {
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  risk_tolerance: 'low' | 'medium' | 'high';
  favorite_cryptocurrencies: string[];
  notification_settings: NotificationSettings;
  theme: 'dark' | 'light';
}

export interface NotificationSettings {
  price_alerts: boolean;
  news_alerts: boolean;
  weekly_summary: boolean;
  marketing_emails: boolean;
}

// Cryptocurrency Types
export interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation?: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  price_change_percentage_30d?: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply?: number;
  max_supply?: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };
}

export interface CryptoHistoricalData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// Platform Types (Exchanges & Wallets)
export interface Exchange {
  id: string;
  name: string;
  logo: string;
  description: string;
  url: string;
  affiliate_url?: string;
  affiliate_commission?: string;
  year_established: number;
  country: string;
  trust_score: number; // 1-10
  trading_volume_24h?: number;
  fees: ExchangeFees;
  features: ExchangeFeatures;
  supported_cryptocurrencies: number;
  supported_fiat: string[];
  kyc_required: boolean;
  mobile_app: boolean;
  pros: string[];
  cons: string[];
  user_rating: number; // 1-5
  review_count: number;
}

export interface ExchangeFees {
  maker_fee: number;
  taker_fee: number;
  withdrawal_fee_btc?: number;
  withdrawal_fee_eth?: number;
  deposit_fee_fiat?: number;
  withdrawal_fee_fiat?: number;
}

export interface ExchangeFeatures {
  spot_trading: boolean;
  margin_trading: boolean;
  futures_trading: boolean;
  staking: boolean;
  lending: boolean;
  debit_card: boolean;
  earn_program: boolean;
  nft_marketplace: boolean;
  advanced_charts: boolean;
  api_access: boolean;
}

export interface Wallet {
  id: string;
  name: string;
  logo: string;
  description: string;
  url: string;
  affiliate_url?: string;
  type: 'hardware' | 'software' | 'mobile' | 'web' | 'paper';
  price?: number;
  supported_cryptocurrencies: number;
  supported_chains: string[];
  security_features: WalletSecurityFeatures;
  features: WalletFeatures;
  pros: string[];
  cons: string[];
  user_rating: number;
  review_count: number;
  ease_of_use: number; // 1-10
}

export interface WalletSecurityFeatures {
  two_factor_auth: boolean;
  biometric_auth: boolean;
  multi_sig: boolean;
  seed_phrase_backup: boolean;
  pin_protection: boolean;
  passphrase_support: boolean;
  secure_element: boolean; // for hardware wallets
  open_source: boolean;
}

export interface WalletFeatures {
  built_in_exchange: boolean;
  staking: boolean;
  nft_support: boolean;
  defi_access: boolean;
  browser_extension: boolean;
  mobile_app: boolean;
  desktop_app: boolean;
  hardware_wallet_support: boolean;
}

// Portfolio Types
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  holdings: PortfolioHolding[];
  total_value_usd: number;
  total_cost_basis: number;
  total_profit_loss: number;
  total_profit_loss_percentage: number;
}

export interface PortfolioHolding {
  id: string;
  portfolio_id: string;
  cryptocurrency_id: string;
  symbol: string;
  name: string;
  amount: number;
  average_buy_price: number;
  current_price: number;
  current_value: number;
  cost_basis: number;
  profit_loss: number;
  profit_loss_percentage: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  holding_id: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'staking_reward';
  amount: number;
  price_per_unit: number;
  total_value: number;
  fee?: number;
  date: string;
  notes?: string;
  exchange?: string;
}

// Calculator Types
export interface DCACalculatorInput {
  cryptocurrency: string;
  investment_amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  start_date: string;
  end_date: string;
}

export interface DCACalculatorResult {
  total_invested: number;
  current_value: number;
  total_coins: number;
  average_cost: number;
  profit_loss: number;
  profit_loss_percentage: number;
  investments: DCAInvestment[];
}

export interface DCAInvestment {
  date: string;
  price: number;
  coins_bought: number;
  total_coins: number;
  total_invested: number;
  value_at_purchase: number;
}

export interface FeeCalculatorInput {
  exchange_id: string;
  trade_amount: number;
  trade_type: 'buy' | 'sell';
  payment_method: 'bank' | 'card' | 'crypto';
}

export interface FeeCalculatorResult {
  exchange_name: string;
  trade_amount: number;
  trading_fee: number;
  deposit_fee: number;
  withdrawal_fee: number;
  total_fees: number;
  net_amount: number;
  fee_percentage: number;
}

export interface StakingCalculatorInput {
  cryptocurrency: string;
  amount: number;
  apy: number;
  duration_months: number;
  compound_frequency: 'daily' | 'weekly' | 'monthly' | 'none';
}

export interface StakingCalculatorResult {
  initial_amount: number;
  final_amount: number;
  total_rewards: number;
  effective_apy: number;
  monthly_rewards: StakingMonthlyReward[];
}

export interface StakingMonthlyReward {
  month: number;
  starting_balance: number;
  rewards_earned: number;
  ending_balance: number;
}

export interface TaxCalculatorInput {
  purchase_price: number;
  purchase_date: string;
  sale_price: number;
  sale_date: string;
  amount: number;
  tax_bracket: number; // percentage
  state?: string;
}

export interface TaxCalculatorResult {
  cost_basis: number;
  proceeds: number;
  gain_loss: number;
  holding_period: 'short_term' | 'long_term';
  tax_rate: number;
  estimated_tax: number;
  net_profit: number;
}

// Market Sentiment Types
export interface FearGreedIndex {
  value: number;
  value_classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: string;
  time_until_update?: string;
}

export interface FearGreedHistorical {
  data: FearGreedIndex[];
}

// Gas Price Types
export interface GasPrice {
  low: number;
  average: number;
  high: number;
  instant?: number;
  baseFee?: number;
  lastUpdated: string;
}

export interface ChainGasInfo {
  chainId: number;
  chainName: string;
  symbol: string;
  gasPrice: GasPrice;
  nativeTokenPrice?: number;
  estimatedCosts: {
    transfer: number; // Cost in USD for a simple transfer
    swap: number; // Cost in USD for a DEX swap
    nftMint: number; // Cost in USD for NFT mint
  };
}

export type SupportedChain =
  | 'ethereum'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'bsc'
  | 'avalanche'
  | 'base';

// Advertisement Types
export interface Advertisement {
  id: string;
  campaign_name: string;
  advertiser_id: string;
  ad_zone: 'banner' | 'sidebar' | 'native' | 'popup';
  image_url: string;
  target_url: string;
  alt_text: string;
  cta_text?: string;
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  status: 'active' | 'paused' | 'ended';
  targeting?: AdTargeting;
}

export interface AdTargeting {
  countries?: string[];
  experience_levels?: ('beginner' | 'intermediate' | 'advanced')[];
  pages?: string[];
}

// Content Types
export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  author_id: string;
  category: ArticleCategory;
  tags: string[];
  published_at?: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'archived';
  seo_title?: string;
  seo_description?: string;
  read_time_minutes: number;
  view_count: number;
}

export type ArticleCategory =
  | 'beginner_guide'
  | 'market_analysis'
  | 'security'
  | 'defi'
  | 'nft'
  | 'regulation'
  | 'exchange_review'
  | 'wallet_review'
  | 'tax_guide'
  | 'staking';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Affiliate Tracking Types
export interface AffiliateClick {
  id: string;
  user_id?: string;
  session_id: string;
  affiliate_id: string;
  platform_type: 'exchange' | 'wallet' | 'tax_software' | 'course';
  platform_name: string;
  source_page: string;
  clicked_at: string;
  converted: boolean;
  conversion_value?: number;
}

export interface AffiliatePartner {
  id: string;
  name: string;
  type: 'exchange' | 'wallet' | 'tax_software' | 'course' | 'other';
  commission_type: 'percentage' | 'fixed' | 'hybrid';
  commission_rate: number;
  cookie_duration_days: number;
  affiliate_url_template: string;
  tracking_id: string;
  status: 'active' | 'pending' | 'inactive';
}
