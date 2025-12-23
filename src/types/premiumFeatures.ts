/**
 * Premium Features Types
 *
 * 1. Hardware Wallet Integration
 * 2. Gas Fee Optimizer
 * 3. DeFi Yield Aggregator
 * 4. Crypto Retirement Calculator
 */

// ============================================
// 1. HARDWARE WALLET INTEGRATION
// ============================================

export type HardwareWalletType = 'ledger' | 'trezor' | 'keepkey' | 'coldcard';
export type HardwareWalletConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type HardwareWalletSubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'cancelled';

export interface HardwareWallet {
  id: string;
  user_id: string;
  wallet_type: HardwareWalletType;
  device_id: string | null;
  device_name: string;
  firmware_version: string | null;
  model: string | null;
  serial_number_hash: string | null;
  connected_at: string | null;
  last_synced_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HardwareWalletAddress {
  id: string;
  hardware_wallet_id: string;
  address: string;
  chain: string;
  derivation_path: string;
  address_index: number;
  label: string | null;
  is_primary: boolean;
  balance: number | null;
  balance_usd: number | null;
  last_synced_at: string | null;
  created_at: string;
}

export interface HardwareWalletHolding {
  id: string;
  wallet_address_id: string;
  asset_symbol: string;
  asset_name: string;
  chain: string;
  contract_address: string | null;
  balance: number;
  balance_usd: number | null;
  price_usd: number | null;
  price_change_24h: number | null;
  last_updated_at: string;
}

export interface HardwareWalletTransaction {
  id: string;
  wallet_address_id: string;
  tx_hash: string;
  chain: string;
  block_number: number;
  timestamp: string;
  from_address: string;
  to_address: string;
  asset_symbol: string;
  asset_name: string | null;
  amount: number;
  amount_usd: number | null;
  fee: number;
  fee_usd: number | null;
  tx_type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'approve' | 'contract';
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

export interface HardwareWalletSubscription {
  id: string;
  user_id: string;
  status: HardwareWalletSubscriptionStatus;
  subscription_type: 'monthly' | 'yearly';
  price_paid: number;
  currency: string;
  max_devices: number;
  max_addresses: number;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HardwareWalletPortfolioSummary {
  total_value_usd: number;
  total_change_24h: number;
  total_change_24h_percent: number;
  wallets_connected: number;
  total_addresses: number;
  holdings_by_chain: {
    chain: string;
    value_usd: number;
    percentage: number;
  }[];
  top_holdings: HardwareWalletHolding[];
  recent_transactions: HardwareWalletTransaction[];
}

// Supported hardware wallet models
export const HARDWARE_WALLET_MODELS = {
  ledger: ['Nano S', 'Nano S Plus', 'Nano X', 'Stax'],
  trezor: ['Model One', 'Model T', 'Safe 3'],
  keepkey: ['KeepKey'],
  coldcard: ['Mk4', 'Q'],
} as const;

// Supported chains by wallet type
export const HARDWARE_WALLET_CHAINS = {
  ledger: ['ethereum', 'bitcoin', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc', 'solana'],
  trezor: ['ethereum', 'bitcoin', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc'],
  keepkey: ['ethereum', 'bitcoin', 'polygon'],
  coldcard: ['bitcoin'],
} as const;

// ============================================
// 2. GAS FEE OPTIMIZER
// ============================================

export type GasPriceTier = 'slow' | 'standard' | 'fast' | 'instant';
export type GasAlertCondition = 'below' | 'above' | 'optimal_detected';

export interface GasPriceData {
  chain: string;
  chain_name: string;
  native_token: string;
  base_fee: number;
  priority_fee_slow: number;
  priority_fee_standard: number;
  priority_fee_fast: number;
  priority_fee_instant: number;
  gas_price_slow: number;
  gas_price_standard: number;
  gas_price_fast: number;
  gas_price_instant: number;
  // USD cost estimates for common transactions
  transfer_cost_usd: {
    slow: number;
    standard: number;
    fast: number;
    instant: number;
  };
  swap_cost_usd: {
    slow: number;
    standard: number;
    fast: number;
    instant: number;
  };
  nft_mint_cost_usd: {
    slow: number;
    standard: number;
    fast: number;
    instant: number;
  };
  updated_at: string;
}

export interface GasPricePrediction {
  chain: string;
  timestamp: string;
  predicted_gas_price: number;
  confidence: number; // 0-1
  optimal_time_windows: {
    start: string;
    end: string;
    predicted_price: number;
    savings_percent: number;
  }[];
  prediction_factors: {
    hour_of_day: number;
    day_of_week: number;
    network_congestion: number;
    pending_transactions: number;
    block_utilization: number;
  };
}

export interface GasPriceHistory {
  id: string;
  chain: string;
  timestamp: string;
  base_fee: number;
  priority_fee: number;
  gas_price: number;
  block_number: number;
  block_utilization: number;
  pending_transactions: number;
}

export interface GasAlert {
  id: string;
  user_id: string;
  chain: string;
  alert_type: 'price_threshold' | 'optimal_time';
  condition: GasAlertCondition;
  threshold_gwei: number | null;
  is_active: boolean;
  triggered_at: string | null;
  notify_email: boolean;
  notify_push: boolean;
  cooldown_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface GasOptimizerSubscription {
  id: string;
  user_id: string;
  tier: 'free' | 'premium';
  status: 'active' | 'inactive';
  // Free: basic current prices, 3 alerts
  // Premium: predictions, unlimited alerts, real-time updates
  max_alerts: number;
  has_predictions: boolean;
  has_realtime: boolean;
  has_historical: boolean;
  created_at: string;
  updated_at: string;
}

// Gas usage estimates for common operations
export const GAS_USAGE_ESTIMATES = {
  eth_transfer: 21000,
  erc20_transfer: 65000,
  erc20_approve: 45000,
  uniswap_v2_swap: 150000,
  uniswap_v3_swap: 180000,
  nft_transfer: 85000,
  nft_mint: 150000,
  contract_deployment: 1500000,
  staking: 120000,
  unstaking: 100000,
} as const;

// ============================================
// 3. DEFI YIELD AGGREGATOR
// ============================================

export type DeFiProtocolType = 'lending' | 'amm' | 'yield_farm' | 'staking' | 'liquid_staking' | 'vault';
export type DeFiRiskLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface DeFiProtocol {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string;
  description: string | null;
  protocol_type: DeFiProtocolType;
  chains: string[];
  tvl: number | null;
  tvl_change_24h: number | null;
  tvl_change_7d: number | null;
  is_audited: boolean;
  audit_reports: string[];
  security_score: number | null; // 0-100
  is_active: boolean;
  launched_at: string | null;
  affiliate_url: string | null;
  affiliate_commission: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeFiPool {
  id: string;
  protocol_id: string;
  protocol_name: string;
  chain: string;
  pool_name: string;
  pool_type: DeFiProtocolType;
  // Token information
  token_a: string;
  token_a_symbol: string;
  token_a_address: string | null;
  token_b: string | null;
  token_b_symbol: string | null;
  token_b_address: string | null;
  // Yield information
  apy_base: number;
  apy_reward: number;
  apy_total: number;
  apy_7d_avg: number | null;
  apy_30d_avg: number | null;
  reward_tokens: string[];
  // Pool stats
  tvl: number;
  volume_24h: number | null;
  volume_7d: number | null;
  // Risk assessment
  risk_level: DeFiRiskLevel;
  impermanent_loss_risk: number | null; // 0-100 for AMM pools
  smart_contract_risk: number | null; // 0-100
  // Additional info
  min_deposit: number | null;
  lock_period_days: number | null;
  withdrawal_fee: number | null;
  deposit_fee: number | null;
  pool_address: string | null;
  is_active: boolean;
  last_updated_at: string;
}

export interface ImpermanentLossCalculation {
  pool_id: string;
  token_a_symbol: string;
  token_b_symbol: string;
  initial_price_ratio: number;
  current_price_ratio: number;
  price_change_percent: number;
  impermanent_loss_percent: number;
  hodl_value: number;
  lp_value: number;
  il_usd: number;
  fees_earned_usd: number | null;
  net_pnl_usd: number | null;
}

export interface YieldOpportunity {
  pool: DeFiPool;
  protocol: DeFiProtocol;
  risk_adjusted_apy: number;
  recommendation_score: number; // 0-100
  pros: string[];
  cons: string[];
  similar_opportunities: DeFiPool[];
}

export interface DeFiPosition {
  id: string;
  user_id: string;
  pool_id: string;
  protocol_name: string;
  chain: string;
  position_type: DeFiProtocolType;
  tokens_deposited: {
    symbol: string;
    amount: number;
    value_usd: number;
  }[];
  lp_tokens_held: number | null;
  current_value_usd: number;
  deposited_value_usd: number;
  rewards_earned_usd: number;
  rewards_pending: {
    symbol: string;
    amount: number;
    value_usd: number;
  }[];
  impermanent_loss_usd: number | null;
  net_pnl_usd: number;
  net_pnl_percent: number;
  entry_date: string;
  last_updated_at: string;
}

export interface DeFiPortfolioSummary {
  total_value_usd: number;
  total_deposited_usd: number;
  total_rewards_earned_usd: number;
  total_impermanent_loss_usd: number;
  net_pnl_usd: number;
  net_pnl_percent: number;
  weighted_avg_apy: number;
  positions_by_protocol: {
    protocol_name: string;
    value_usd: number;
    percentage: number;
  }[];
  positions_by_chain: {
    chain: string;
    value_usd: number;
    percentage: number;
  }[];
  positions: DeFiPosition[];
}

export interface DeFiYieldSubscription {
  id: string;
  user_id: string;
  tier: 'free' | 'premium';
  status: 'active' | 'inactive';
  // Free: view top 10 opportunities per chain, basic IL calculator
  // Premium: all opportunities, portfolio tracking, alerts, API access
  max_tracked_positions: number;
  has_il_calculator: boolean;
  has_portfolio_tracking: boolean;
  has_alerts: boolean;
  has_api_access: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// 4. CRYPTO RETIREMENT CALCULATOR
// ============================================

export type RetirementScenario = 'conservative' | 'moderate' | 'aggressive';
export type WithdrawalStrategy = 'fixed_percent' | 'fixed_amount' | 'bucket' | 'dynamic';

export interface RetirementPortfolioAllocation {
  asset_class: string;
  asset_name: string;
  symbol: string;
  allocation_percent: number;
  expected_return: number;
  volatility: number;
  correlation_to_stocks: number;
}

export interface RetirementInputs {
  // Personal info
  current_age: number;
  retirement_age: number;
  life_expectancy: number;
  // Current savings
  current_savings_usd: number;
  current_crypto_value_usd: number;
  crypto_allocation_percent: number;
  // Contributions
  monthly_contribution: number;
  monthly_crypto_contribution: number;
  contribution_increase_rate: number; // Annual increase
  // Retirement needs
  desired_annual_income: number;
  social_security_income: number;
  pension_income: number;
  other_income: number;
  // Crypto specific
  crypto_allocations: RetirementPortfolioAllocation[];
  rebalancing_frequency: 'monthly' | 'quarterly' | 'annually' | 'never';
  // Tax settings
  tax_filing_status: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
  state: string;
  current_tax_bracket: number;
  expected_retirement_tax_bracket: number;
  // Assumptions
  inflation_rate: number;
  stock_return: number;
  bond_return: number;
  crypto_return: number;
  crypto_volatility: number;
}

export interface MonteCarloResult {
  percentile: number; // 5, 10, 25, 50, 75, 90, 95
  ending_balance: number;
  probability_of_success: number;
  years_portfolio_lasts: number;
  annual_withdrawals: number[];
}

export interface RetirementProjection {
  id: string;
  user_id: string | null;
  inputs: RetirementInputs;
  // Results
  total_needed_at_retirement: number;
  projected_savings_at_retirement: number;
  funding_gap: number;
  funding_ratio: number;
  years_to_retirement: number;
  years_in_retirement: number;
  // Year by year projections
  yearly_projections: {
    year: number;
    age: number;
    contributions: number;
    portfolio_value: number;
    crypto_value: number;
    traditional_value: number;
    withdrawals: number;
    taxes: number;
    inflation_adjusted_income: number;
  }[];
  // Monte Carlo results
  monte_carlo_simulations: number;
  success_probability: number;
  monte_carlo_results: MonteCarloResult[];
  // Tax analysis
  tax_analysis: {
    total_taxes_paid: number;
    effective_tax_rate: number;
    roth_conversion_opportunity: number;
    tax_loss_harvesting_opportunity: number;
    optimal_withdrawal_order: string[];
  };
  // Recommendations
  recommendations: {
    type: 'increase_savings' | 'reduce_expenses' | 'adjust_allocation' | 'delay_retirement' | 'reduce_crypto';
    title: string;
    description: string;
    impact_on_success: number;
  }[];
  created_at: string;
}

export interface RetirementSubscription {
  id: string;
  user_id: string;
  tier: 'free' | 'premium' | 'bundled';
  status: 'active' | 'inactive';
  // Free: basic calculator, 3 scenarios
  // Premium ($99/year): Monte Carlo, tax optimization, unlimited scenarios, PDF exports
  max_scenarios: number;
  has_monte_carlo: boolean;
  has_tax_optimization: boolean;
  has_pdf_export: boolean;
  has_advisor_review: boolean;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

// Default crypto return assumptions
export const CRYPTO_RETURN_ASSUMPTIONS = {
  conservative: {
    btc: { return: 0.10, volatility: 0.50 },
    eth: { return: 0.12, volatility: 0.60 },
    stablecoins: { return: 0.04, volatility: 0.02 },
    altcoins: { return: 0.15, volatility: 0.80 },
  },
  moderate: {
    btc: { return: 0.20, volatility: 0.60 },
    eth: { return: 0.25, volatility: 0.70 },
    stablecoins: { return: 0.05, volatility: 0.02 },
    altcoins: { return: 0.30, volatility: 0.90 },
  },
  aggressive: {
    btc: { return: 0.35, volatility: 0.70 },
    eth: { return: 0.40, volatility: 0.80 },
    stablecoins: { return: 0.08, volatility: 0.05 },
    altcoins: { return: 0.50, volatility: 1.00 },
  },
} as const;

// Tax brackets 2024
export const FEDERAL_TAX_BRACKETS_2024 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_filing_jointly: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
} as const;

export const CAPITAL_GAINS_BRACKETS_2024 = {
  single: [
    { min: 0, max: 47025, rate: 0 },
    { min: 47025, max: 518900, rate: 0.15 },
    { min: 518900, max: Infinity, rate: 0.20 },
  ],
  married_filing_jointly: [
    { min: 0, max: 94050, rate: 0 },
    { min: 94050, max: 583750, rate: 0.15 },
    { min: 583750, max: Infinity, rate: 0.20 },
  ],
} as const;

// ============================================
// PRICING CONSTANTS
// ============================================

export const PREMIUM_FEATURES_PRICING = {
  hardware_wallet: {
    monthly: 14.99,
    yearly: 149.99,
    max_devices_basic: 2,
    max_devices_premium: 5,
    max_addresses_basic: 10,
    max_addresses_premium: 50,
    partner_affiliates: ['ledger', 'trezor'],
  },
  gas_optimizer: {
    free_alerts: 3,
    premium_alerts: 50,
    premium_monthly: 4.99,
    premium_yearly: 49.99,
  },
  defi_yield: {
    free_pools_per_chain: 10,
    premium_monthly: 19.99,
    premium_yearly: 199.99,
    affiliate_commission_percent: 0.5,
  },
  retirement_calculator: {
    free_scenarios: 3,
    premium_yearly: 99,
    bundled_with_premium: true,
    monte_carlo_simulations: 10000,
  },
} as const;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface HardwareWalletResponse {
  wallets: HardwareWallet[];
  addresses: HardwareWalletAddress[];
  portfolio: HardwareWalletPortfolioSummary;
  subscription: HardwareWalletSubscription | null;
}

export interface GasOptimizerResponse {
  current_prices: GasPriceData[];
  predictions: GasPricePrediction[];
  alerts: GasAlert[];
  history_24h: GasPriceHistory[];
}

export interface DeFiYieldResponse {
  opportunities: YieldOpportunity[];
  top_by_apy: DeFiPool[];
  top_by_tvl: DeFiPool[];
  user_positions: DeFiPosition[] | null;
  portfolio_summary: DeFiPortfolioSummary | null;
}

export interface RetirementCalculatorResponse {
  projection: RetirementProjection;
  scenarios: {
    conservative: RetirementProjection;
    moderate: RetirementProjection;
    aggressive: RetirementProjection;
  };
  saved_projections: RetirementProjection[];
}
