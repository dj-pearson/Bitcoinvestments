/**
 * DeFi Yield Aggregator Service
 *
 * Compare yield farming opportunities across protocols.
 * Show APY, risks, and impermanent loss calculations.
 * Earn affiliate fees from protocol integrations.
 */

import type {
  DeFiProtocol,
  DeFiPool,
  YieldOpportunity,
  ImpermanentLossCalculation,
  DeFiProtocolType,
  DeFiRiskLevel,
} from '../types/premiumFeatures';
import { PREMIUM_FEATURES_PRICING } from '../types/premiumFeatures';

// Supported chains for DeFi
export const SUPPORTED_DEFI_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0' },
  { id: 'optimism', name: 'Optimism', color: '#FF0420' },
  { id: 'avalanche', name: 'Avalanche', color: '#E84142' },
  { id: 'bsc', name: 'BNB Chain', color: '#F0B90B' },
  { id: 'base', name: 'Base', color: '#0052FF' },
  { id: 'solana', name: 'Solana', color: '#14F195' },
] as const;

// DeFi Yield Pricing
export const DEFI_YIELD_PRICING = {
  free: {
    id: 'defi-yield-free',
    name: 'DeFi Yield Free',
    price: 0,
    features: [
      'Top 10 pools per chain',
      'Basic APY information',
      'Simple IL calculator',
      'Protocol safety scores',
    ],
    limits: {
      poolsPerChain: 10,
      hasPortfolioTracking: false,
      hasAlerts: false,
      hasApiAccess: false,
    },
  },
  premium: {
    id: 'defi-yield-premium',
    name: 'DeFi Yield Pro',
    price_monthly: PREMIUM_FEATURES_PRICING.defi_yield.premium_monthly,
    price_yearly: PREMIUM_FEATURES_PRICING.defi_yield.premium_yearly,
    features: [
      'All pools across all chains',
      'Real-time APY tracking',
      'Advanced IL calculator',
      'Portfolio position tracking',
      'Yield alerts & notifications',
      'Historical APY data',
      'Risk-adjusted rankings',
      'API access',
    ],
    limits: {
      poolsPerChain: Infinity,
      hasPortfolioTracking: true,
      hasAlerts: true,
      hasApiAccess: true,
    },
    stripePriceId: {
      monthly: import.meta.env.VITE_STRIPE_DEFI_YIELD_MONTHLY || 'price_defi_monthly',
      yearly: import.meta.env.VITE_STRIPE_DEFI_YIELD_YEARLY || 'price_defi_yearly',
    },
  },
} as const;

// Major DeFi protocols with affiliate info
const DEFI_PROTOCOLS: DeFiProtocol[] = [
  {
    id: 'aave-v3',
    name: 'Aave V3',
    slug: 'aave',
    logo_url: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    website_url: 'https://aave.com',
    description: 'Decentralized lending and borrowing protocol',
    protocol_type: 'lending',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'],
    tvl: 12500000000,
    tvl_change_24h: 2.5,
    tvl_change_7d: -1.2,
    is_audited: true,
    audit_reports: ['https://github.com/aave/aave-v3-core/tree/master/audits'],
    security_score: 95,
    is_active: true,
    launched_at: '2023-01-27',
    affiliate_url: 'https://app.aave.com/?ref=bitcoinvestments',
    affiliate_commission: 0.05,
    created_at: '2023-01-01',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'uniswap-v3',
    name: 'Uniswap V3',
    slug: 'uniswap',
    logo_url: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    website_url: 'https://uniswap.org',
    description: 'Leading decentralized exchange with concentrated liquidity',
    protocol_type: 'amm',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc'],
    tvl: 5800000000,
    tvl_change_24h: 1.8,
    tvl_change_7d: 3.2,
    is_audited: true,
    audit_reports: ['https://github.com/Uniswap/v3-core/tree/main/audits'],
    security_score: 92,
    is_active: true,
    launched_at: '2021-05-05',
    affiliate_url: null,
    affiliate_commission: null,
    created_at: '2021-05-01',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lido',
    name: 'Lido',
    slug: 'lido',
    logo_url: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png',
    website_url: 'https://lido.fi',
    description: 'Liquid staking protocol for Ethereum and other chains',
    protocol_type: 'liquid_staking',
    chains: ['ethereum', 'polygon', 'solana'],
    tvl: 32000000000,
    tvl_change_24h: 0.5,
    tvl_change_7d: 2.1,
    is_audited: true,
    audit_reports: ['https://github.com/lidofinance/audits'],
    security_score: 90,
    is_active: true,
    launched_at: '2020-12-17',
    affiliate_url: 'https://stake.lido.fi/?ref=bitcoinvestments',
    affiliate_commission: 0.01,
    created_at: '2020-12-01',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'curve',
    name: 'Curve Finance',
    slug: 'curve',
    logo_url: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png',
    website_url: 'https://curve.fi',
    description: 'Stablecoin and low-slippage swaps AMM',
    protocol_type: 'amm',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
    tvl: 2100000000,
    tvl_change_24h: -0.8,
    tvl_change_7d: -2.5,
    is_audited: true,
    audit_reports: ['https://github.com/curvefi/curve-contract/tree/master/audits'],
    security_score: 88,
    is_active: true,
    launched_at: '2020-01-20',
    affiliate_url: null,
    affiliate_commission: null,
    created_at: '2020-01-01',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'compound-v3',
    name: 'Compound V3',
    slug: 'compound',
    logo_url: 'https://cryptologos.cc/logos/compound-comp-logo.png',
    website_url: 'https://compound.finance',
    description: 'Algorithmic interest rate protocol',
    protocol_type: 'lending',
    chains: ['ethereum', 'polygon', 'arbitrum', 'base'],
    tvl: 2800000000,
    tvl_change_24h: 1.2,
    tvl_change_7d: 0.5,
    is_audited: true,
    audit_reports: ['https://github.com/compound-finance/comet/tree/main/audits'],
    security_score: 91,
    is_active: true,
    launched_at: '2022-08-26',
    affiliate_url: null,
    affiliate_commission: null,
    created_at: '2022-08-01',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'yearn',
    name: 'Yearn Finance',
    slug: 'yearn',
    logo_url: 'https://cryptologos.cc/logos/yearn-finance-yfi-logo.png',
    website_url: 'https://yearn.fi',
    description: 'Yield aggregator and vault strategies',
    protocol_type: 'vault',
    chains: ['ethereum', 'arbitrum', 'optimism'],
    tvl: 450000000,
    tvl_change_24h: 0.3,
    tvl_change_7d: 1.8,
    is_audited: true,
    audit_reports: ['https://github.com/yearn/yearn-security/tree/master/audits'],
    security_score: 85,
    is_active: true,
    launched_at: '2020-07-17',
    affiliate_url: null,
    affiliate_commission: null,
    created_at: '2020-07-01',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'gmx',
    name: 'GMX',
    slug: 'gmx',
    logo_url: 'https://assets.coingecko.com/coins/images/18323/small/arbit.png',
    website_url: 'https://gmx.io',
    description: 'Decentralized perpetuals exchange',
    protocol_type: 'yield_farm',
    chains: ['arbitrum', 'avalanche'],
    tvl: 580000000,
    tvl_change_24h: 2.1,
    tvl_change_7d: 5.3,
    is_audited: true,
    audit_reports: ['https://github.com/gmx-io/gmx-contracts/tree/master/audits'],
    security_score: 82,
    is_active: true,
    launched_at: '2021-09-01',
    affiliate_url: 'https://app.gmx.io/?ref=bitcoinvestments',
    affiliate_commission: 0.15,
    created_at: '2021-09-01',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rocketpool',
    name: 'Rocket Pool',
    slug: 'rocketpool',
    logo_url: 'https://cryptologos.cc/logos/rocket-pool-rpl-logo.png',
    website_url: 'https://rocketpool.net',
    description: 'Decentralized Ethereum staking',
    protocol_type: 'liquid_staking',
    chains: ['ethereum'],
    tvl: 3200000000,
    tvl_change_24h: 0.8,
    tvl_change_7d: 1.5,
    is_audited: true,
    audit_reports: ['https://rocketpool.net/protocol/audits'],
    security_score: 89,
    is_active: true,
    launched_at: '2021-11-09',
    affiliate_url: null,
    affiliate_commission: null,
    created_at: '2021-11-01',
    updated_at: new Date().toISOString(),
  },
];

// Generate sample pools
function generateDeFiPools(): DeFiPool[] {
  const pools: DeFiPool[] = [];

  // Aave lending pools
  ['USDC', 'USDT', 'DAI', 'ETH', 'WBTC'].forEach((token) => {
    ['ethereum', 'polygon', 'arbitrum'].forEach(chain => {
      pools.push({
        id: `aave-${chain}-${token.toLowerCase()}`,
        protocol_id: 'aave-v3',
        protocol_name: 'Aave V3',
        chain,
        pool_name: `${token} Lending`,
        pool_type: 'lending',
        token_a: token,
        token_a_symbol: token,
        token_a_address: null,
        token_b: null,
        token_b_symbol: null,
        token_b_address: null,
        apy_base: 2 + Math.random() * 5,
        apy_reward: Math.random() * 2,
        apy_total: 3 + Math.random() * 6,
        apy_7d_avg: 3.5 + Math.random() * 5,
        apy_30d_avg: 4 + Math.random() * 4,
        reward_tokens: ['AAVE'],
        tvl: 50000000 + Math.random() * 500000000,
        volume_24h: 1000000 + Math.random() * 50000000,
        volume_7d: 7000000 + Math.random() * 350000000,
        risk_level: 'low',
        impermanent_loss_risk: null,
        smart_contract_risk: 10,
        min_deposit: null,
        lock_period_days: null,
        withdrawal_fee: null,
        deposit_fee: null,
        pool_address: null,
        is_active: true,
        last_updated_at: new Date().toISOString(),
      });
    });
  });

  // Uniswap AMM pools
  const uniPairs = [
    { a: 'ETH', b: 'USDC' },
    { a: 'ETH', b: 'WBTC' },
    { a: 'ETH', b: 'USDT' },
    { a: 'WBTC', b: 'USDC' },
    { a: 'LINK', b: 'ETH' },
  ];

  uniPairs.forEach(pair => {
    ['ethereum', 'arbitrum', 'polygon'].forEach(chain => {
      pools.push({
        id: `uniswap-${chain}-${pair.a.toLowerCase()}-${pair.b.toLowerCase()}`,
        protocol_id: 'uniswap-v3',
        protocol_name: 'Uniswap V3',
        chain,
        pool_name: `${pair.a}/${pair.b}`,
        pool_type: 'amm',
        token_a: pair.a,
        token_a_symbol: pair.a,
        token_a_address: null,
        token_b: pair.b,
        token_b_symbol: pair.b,
        token_b_address: null,
        apy_base: 5 + Math.random() * 25,
        apy_reward: 0,
        apy_total: 5 + Math.random() * 25,
        apy_7d_avg: 8 + Math.random() * 20,
        apy_30d_avg: 10 + Math.random() * 15,
        reward_tokens: [],
        tvl: 10000000 + Math.random() * 200000000,
        volume_24h: 5000000 + Math.random() * 100000000,
        volume_7d: 35000000 + Math.random() * 700000000,
        risk_level: 'medium',
        impermanent_loss_risk: 20 + Math.random() * 40,
        smart_contract_risk: 15,
        min_deposit: null,
        lock_period_days: null,
        withdrawal_fee: 0.3,
        deposit_fee: null,
        pool_address: null,
        is_active: true,
        last_updated_at: new Date().toISOString(),
      });
    });
  });

  // Lido staking
  pools.push({
    id: 'lido-ethereum-steth',
    protocol_id: 'lido',
    protocol_name: 'Lido',
    chain: 'ethereum',
    pool_name: 'ETH Staking (stETH)',
    pool_type: 'liquid_staking',
    token_a: 'ETH',
    token_a_symbol: 'ETH',
    token_a_address: null,
    token_b: null,
    token_b_symbol: null,
    token_b_address: null,
    apy_base: 3.5 + Math.random() * 1,
    apy_reward: 0,
    apy_total: 3.5 + Math.random() * 1,
    apy_7d_avg: 3.6,
    apy_30d_avg: 3.7,
    reward_tokens: [],
    tvl: 32000000000,
    volume_24h: 50000000,
    volume_7d: 350000000,
    risk_level: 'low',
    impermanent_loss_risk: null,
    smart_contract_risk: 12,
    min_deposit: 0.01,
    lock_period_days: null,
    withdrawal_fee: null,
    deposit_fee: null,
    pool_address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    is_active: true,
    last_updated_at: new Date().toISOString(),
  });

  // Rocket Pool staking
  pools.push({
    id: 'rocketpool-ethereum-reth',
    protocol_id: 'rocketpool',
    protocol_name: 'Rocket Pool',
    chain: 'ethereum',
    pool_name: 'ETH Staking (rETH)',
    pool_type: 'liquid_staking',
    token_a: 'ETH',
    token_a_symbol: 'ETH',
    token_a_address: null,
    token_b: null,
    token_b_symbol: null,
    token_b_address: null,
    apy_base: 3.3 + Math.random() * 0.8,
    apy_reward: 0,
    apy_total: 3.3 + Math.random() * 0.8,
    apy_7d_avg: 3.4,
    apy_30d_avg: 3.5,
    reward_tokens: [],
    tvl: 3200000000,
    volume_24h: 15000000,
    volume_7d: 105000000,
    risk_level: 'low',
    impermanent_loss_risk: null,
    smart_contract_risk: 14,
    min_deposit: 0.01,
    lock_period_days: null,
    withdrawal_fee: null,
    deposit_fee: null,
    pool_address: null,
    is_active: true,
    last_updated_at: new Date().toISOString(),
  });

  // Curve stable pools
  ['3pool', 'stETH/ETH', 'FRAX/USDC'].forEach(poolName => {
    pools.push({
      id: `curve-ethereum-${poolName.toLowerCase().replace('/', '-')}`,
      protocol_id: 'curve',
      protocol_name: 'Curve Finance',
      chain: 'ethereum',
      pool_name: poolName,
      pool_type: 'amm',
      token_a: poolName.split('/')[0] || 'USDC',
      token_a_symbol: poolName.split('/')[0] || 'USDC',
      token_a_address: null,
      token_b: poolName.split('/')[1] || 'DAI',
      token_b_symbol: poolName.split('/')[1] || 'DAI',
      token_b_address: null,
      apy_base: 1 + Math.random() * 4,
      apy_reward: 2 + Math.random() * 5,
      apy_total: 4 + Math.random() * 8,
      apy_7d_avg: 5 + Math.random() * 6,
      apy_30d_avg: 4.5 + Math.random() * 5,
      reward_tokens: ['CRV', 'CVX'],
      tvl: 100000000 + Math.random() * 400000000,
      volume_24h: 10000000 + Math.random() * 50000000,
      volume_7d: 70000000 + Math.random() * 350000000,
      risk_level: 'low',
      impermanent_loss_risk: 2 + Math.random() * 5,
      smart_contract_risk: 15,
      min_deposit: null,
      lock_period_days: null,
      withdrawal_fee: 0.04,
      deposit_fee: null,
      pool_address: null,
      is_active: true,
      last_updated_at: new Date().toISOString(),
    });
  });

  return pools;
}

const DEFI_POOLS = generateDeFiPools();

/**
 * Get all DeFi protocols
 */
export function getProtocols(): DeFiProtocol[] {
  return DEFI_PROTOCOLS;
}

/**
 * Get protocol by ID
 */
export function getProtocol(protocolId: string): DeFiProtocol | null {
  return DEFI_PROTOCOLS.find(p => p.id === protocolId) || null;
}

/**
 * Get all pools, optionally filtered
 */
export async function getPools(options?: {
  chain?: string;
  protocolId?: string;
  poolType?: DeFiProtocolType;
  minApy?: number;
  maxRisk?: DeFiRiskLevel;
  limit?: number;
}): Promise<DeFiPool[]> {
  let pools = [...DEFI_POOLS];

  if (options?.chain) {
    pools = pools.filter(p => p.chain === options.chain);
  }

  if (options?.protocolId) {
    pools = pools.filter(p => p.protocol_id === options.protocolId);
  }

  if (options?.poolType) {
    pools = pools.filter(p => p.pool_type === options.poolType);
  }

  if (options?.minApy !== undefined) {
    pools = pools.filter(p => p.apy_total >= options.minApy!);
  }

  if (options?.maxRisk) {
    const riskOrder: DeFiRiskLevel[] = ['low', 'medium', 'high', 'very_high'];
    const maxRiskIndex = riskOrder.indexOf(options.maxRisk);
    pools = pools.filter(p => riskOrder.indexOf(p.risk_level) <= maxRiskIndex);
  }

  // Sort by APY
  pools.sort((a, b) => b.apy_total - a.apy_total);

  if (options?.limit) {
    pools = pools.slice(0, options.limit);
  }

  return pools;
}

/**
 * Get top yield opportunities with recommendations
 */
export async function getYieldOpportunities(options?: {
  chain?: string;
  riskTolerance?: DeFiRiskLevel;
  limit?: number;
}): Promise<YieldOpportunity[]> {
  const pools = await getPools({
    chain: options?.chain,
    maxRisk: options?.riskTolerance,
    limit: options?.limit || 20,
  });

  return pools.map(pool => {
    const protocol = getProtocol(pool.protocol_id)!;

    // Calculate risk-adjusted APY (simplified Sharpe-like ratio)
    const riskMultiplier = {
      low: 1,
      medium: 0.8,
      high: 0.5,
      very_high: 0.3,
    }[pool.risk_level];

    const riskAdjustedApy = pool.apy_total * riskMultiplier;

    // Generate pros/cons
    const pros: string[] = [];
    const cons: string[] = [];

    if (pool.apy_total > 15) pros.push('High yield opportunity');
    if (pool.tvl > 100000000) pros.push('High TVL indicates trust');
    if (protocol.is_audited) pros.push('Smart contracts audited');
    if (pool.risk_level === 'low') pros.push('Low risk profile');
    if (pool.reward_tokens.length > 0) pros.push(`Bonus rewards in ${pool.reward_tokens.join(', ')}`);

    if (pool.impermanent_loss_risk && pool.impermanent_loss_risk > 30) {
      cons.push('High impermanent loss risk');
    }
    if (pool.lock_period_days) cons.push(`${pool.lock_period_days} day lock period`);
    if (pool.withdrawal_fee) cons.push(`${pool.withdrawal_fee}% withdrawal fee`);
    if (pool.risk_level === 'high' || pool.risk_level === 'very_high') {
      cons.push('Higher smart contract risk');
    }

    // Find similar opportunities
    const similar = DEFI_POOLS.filter(
      p => p.id !== pool.id && p.pool_type === pool.pool_type && p.chain === pool.chain
    ).slice(0, 3);

    return {
      pool,
      protocol,
      risk_adjusted_apy: riskAdjustedApy,
      recommendation_score: Math.min(100, riskAdjustedApy * 5 + (protocol.security_score || 0) / 2),
      pros,
      cons,
      similar_opportunities: similar,
    };
  });
}

/**
 * Calculate impermanent loss for a liquidity position
 */
export function calculateImpermanentLoss(
  initialTokenAAmount: number,
  initialTokenBAmount: number,
  initialPriceRatio: number,
  currentPriceRatio: number,
  tokenASymbol: string,
  tokenBSymbol: string,
  feesEarned?: number
): ImpermanentLossCalculation {
  // IL formula: IL = 2 * sqrt(k) / (1 + k) - 1, where k = P_current / P_initial
  const k = currentPriceRatio / initialPriceRatio;
  const sqrtK = Math.sqrt(k);
  const ilPercent = (2 * sqrtK) / (1 + k) - 1;
  const ilPercentAbs = Math.abs(ilPercent) * 100;

  // Calculate HODL value
  const priceChange = (currentPriceRatio - initialPriceRatio) / initialPriceRatio;
  const initialValue = initialTokenAAmount + initialTokenBAmount; // Assuming equal initial values
  const hodlValue = initialTokenAAmount * (1 + priceChange) + initialTokenBAmount;

  // Calculate LP value
  const lpValue = hodlValue * (1 + ilPercent);
  const ilUsd = hodlValue - lpValue;

  // Net P&L including fees
  const netPnlUsd = feesEarned ? lpValue + feesEarned - initialValue : null;

  return {
    pool_id: '',
    token_a_symbol: tokenASymbol,
    token_b_symbol: tokenBSymbol,
    initial_price_ratio: initialPriceRatio,
    current_price_ratio: currentPriceRatio,
    price_change_percent: priceChange * 100,
    impermanent_loss_percent: ilPercentAbs,
    hodl_value: hodlValue,
    lp_value: lpValue,
    il_usd: ilUsd,
    fees_earned_usd: feesEarned || null,
    net_pnl_usd: netPnlUsd,
  };
}

/**
 * Estimate IL for different price movements
 */
export function estimateImpermanentLoss(priceChangePercent: number): number {
  // Quick IL estimation based on price change
  const k = 1 + priceChangePercent / 100;
  const sqrtK = Math.sqrt(k);
  const il = (2 * sqrtK) / (1 + k) - 1;
  return Math.abs(il) * 100;
}

// Common IL reference points
export const IL_REFERENCE_TABLE = [
  { priceChange: 25, il: 0.6 },
  { priceChange: 50, il: 2.0 },
  { priceChange: 75, il: 3.8 },
  { priceChange: 100, il: 5.7 },
  { priceChange: 200, il: 13.4 },
  { priceChange: 300, il: 20.0 },
  { priceChange: 400, il: 25.5 },
  { priceChange: 500, il: 30.0 },
];

/**
 * Get risk level color
 */
export function getRiskColor(risk: DeFiRiskLevel): string {
  switch (risk) {
    case 'low':
      return 'text-green-500';
    case 'medium':
      return 'text-yellow-500';
    case 'high':
      return 'text-orange-500';
    case 'very_high':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Format APY for display
 */
export function formatApy(apy: number): string {
  if (apy >= 1000) return `${(apy / 1000).toFixed(1)}K%`;
  if (apy >= 100) return `${Math.round(apy)}%`;
  return `${apy.toFixed(2)}%`;
}

/**
 * Format TVL for display
 */
export function formatTvl(tvl: number): string {
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
  if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(2)}K`;
  return `$${tvl.toFixed(2)}`;
}

/**
 * Get pool type label
 */
export function getPoolTypeLabel(type: DeFiProtocolType): string {
  const labels: Record<DeFiProtocolType, string> = {
    lending: 'Lending',
    amm: 'Liquidity Pool',
    yield_farm: 'Yield Farm',
    staking: 'Staking',
    liquid_staking: 'Liquid Staking',
    vault: 'Vault',
  };
  return labels[type] || type;
}

/**
 * Track affiliate click for DeFi protocol
 */
export async function trackAffiliateClick(
  userId: string | null,
  protocolId: string,
  poolId?: string
): Promise<void> {
  const protocol = getProtocol(protocolId);
  if (!protocol?.affiliate_url) return;

  // In production, log to analytics/database
  console.log('DeFi affiliate click:', { userId, protocolId, poolId });
}

/**
 * Get affiliate URL for protocol
 */
export function getAffiliateUrl(protocolId: string): string | null {
  const protocol = getProtocol(protocolId);
  return protocol?.affiliate_url || protocol?.website_url || null;
}
