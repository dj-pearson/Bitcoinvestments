/**
 * Crypto Lending/Borrowing Comparison Service
 *
 * Compare rates across lending platforms (Aave, Compound, Celsius, etc.)
 * Get affiliate commissions when users sign up: $500-5000 per referred depositor
 */

import { db } from '../lib/supabase';
import type {
  LendingPlatform,
  LendingRate,
  LendingRateHistory,
  LendingReferral,
  LendingRateComparison,
  LendingRatesResponse,
} from '../types/monetization';

// ============================================
// PLATFORM MANAGEMENT
// ============================================

/**
 * Get all active lending platforms
 */
export async function getLendingPlatforms(options?: {
  type?: 'cefi' | 'defi' | 'hybrid';
  chain?: string;
}): Promise<LendingPlatform[]> {
  let query = db
    .from('lending_platforms')
    .select('*')
    .eq('status', 'active')
    .order('trust_score', { ascending: false, nullsFirst: false });

  if (options?.type) {
    query = query.eq('platform_type', options.type);
  }

  if (options?.chain) {
    query = query.contains('supported_chains', [options.chain]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get platform by slug
 */
export async function getPlatformBySlug(slug: string): Promise<LendingPlatform | null> {
  const { data, error } = await db
    .from('lending_platforms')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get platform by ID
 */
export async function getPlatformById(id: string): Promise<LendingPlatform | null> {
  const { data, error } = await db
    .from('lending_platforms')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ============================================
// RATE COMPARISON
// ============================================

/**
 * Get current lending rates for all platforms
 */
export async function getCurrentRates(options?: {
  asset?: string;
  chain?: string;
  type?: 'lending' | 'borrowing';
}): Promise<(LendingRate & { platform: LendingPlatform })[]> {
  let query = db
    .from('lending_rates')
    .select(`
      *,
      platform:lending_platforms(*)
    `)
    .order('lending_apy', { ascending: false, nullsFirst: false });

  if (options?.asset) {
    query = query.eq('asset_symbol', options.asset.toUpperCase());
  }

  if (options?.chain) {
    query = query.eq('chain', options.chain);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Filter out inactive platforms
  return (data || []).filter((r: any) => r.platform?.status === 'active');
}

/**
 * Get best rates for a specific asset
 */
export async function getBestRatesForAsset(
  assetSymbol: string,
  chain: string = 'ethereum'
): Promise<LendingRatesResponse> {
  const rates = await getCurrentRates({ asset: assetSymbol, chain });

  let bestLending: { platform: string; apy: number } | null = null;
  let bestBorrowing: { platform: string; apy: number } | null = null;

  for (const rate of rates) {
    if (rate.lending_apy && (!bestLending || rate.lending_apy > bestLending.apy)) {
      bestLending = { platform: rate.platform.name, apy: rate.lending_apy };
    }
    if (rate.borrowing_apy && (!bestBorrowing || rate.borrowing_apy < bestBorrowing.apy)) {
      bestBorrowing = { platform: rate.platform.name, apy: rate.borrowing_apy };
    }
  }

  return {
    asset: assetSymbol,
    rates,
    best_lending: bestLending,
    best_borrowing: bestBorrowing,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get rate comparison for multiple assets
 */
export async function getRateComparison(
  assets: string[],
  chain: string = 'ethereum'
): Promise<LendingRateComparison[]> {
  const comparisons: LendingRateComparison[] = [];

  for (const asset of assets) {
    const response = await getBestRatesForAsset(asset, chain);

    comparisons.push({
      asset_symbol: asset,
      asset_name: response.rates[0]?.asset_name || asset,
      rates: response.rates.map((r) => ({
        platform: r.platform,
        lending_apy: r.lending_apy || 0,
        borrowing_apy: r.borrowing_apy || 0,
        utilization: r.utilization_rate || 0,
      })),
      best_lending_platform: response.best_lending?.platform || '',
      best_borrowing_platform: response.best_borrowing?.platform || '',
    });
  }

  return comparisons;
}

/**
 * Get top lending opportunities
 */
export async function getTopLendingOpportunities(limit: number = 10): Promise<LendingRate[]> {
  const { data, error } = await db
    .from('lending_rates')
    .select(`
      *,
      platform:lending_platforms(*)
    `)
    .not('lending_apy', 'is', null)
    .order('lending_apy', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).filter((r: any) => r.platform?.status === 'active');
}

/**
 * Get cheapest borrowing options
 */
export async function getCheapestBorrowingOptions(limit: number = 10): Promise<LendingRate[]> {
  const { data, error } = await db
    .from('lending_rates')
    .select(`
      *,
      platform:lending_platforms(*)
    `)
    .not('borrowing_apy', 'is', null)
    .gt('borrowing_apy', 0)
    .order('borrowing_apy', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data || []).filter((r: any) => r.platform?.status === 'active');
}

// ============================================
// RATE HISTORY
// ============================================

/**
 * Get rate history for a platform and asset
 */
export async function getRateHistory(
  platformId: string,
  assetSymbol: string,
  days: number = 30,
  chain: string = 'ethereum'
): Promise<LendingRateHistory[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await db
    .from('lending_rate_history')
    .select('*')
    .eq('platform_id', platformId)
    .eq('asset_symbol', assetSymbol.toUpperCase())
    .eq('chain', chain)
    .gte('snapshot_date', startDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get average rates over time
 */
export async function getAverageRates(
  assetSymbol: string,
  days: number = 30
): Promise<{
  date: string;
  avg_lending_apy: number;
  avg_borrowing_apy: number;
}[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await db
    .from('lending_rate_history')
    .select('snapshot_date, lending_apy, borrowing_apy')
    .eq('asset_symbol', assetSymbol.toUpperCase())
    .gte('snapshot_date', startDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  if (error) throw error;

  // Group by date and calculate averages
  const grouped: Record<string, { lending: number[]; borrowing: number[] }> = {};

  for (const row of data || []) {
    if (!grouped[row.snapshot_date]) {
      grouped[row.snapshot_date] = { lending: [], borrowing: [] };
    }
    if (row.lending_apy) grouped[row.snapshot_date].lending.push(row.lending_apy);
    if (row.borrowing_apy) grouped[row.snapshot_date].borrowing.push(row.borrowing_apy);
  }

  return Object.entries(grouped).map(([date, values]) => ({
    date,
    avg_lending_apy:
      values.lending.length > 0
        ? values.lending.reduce((a, b) => a + b, 0) / values.lending.length
        : 0,
    avg_borrowing_apy:
      values.borrowing.length > 0
        ? values.borrowing.reduce((a, b) => a + b, 0) / values.borrowing.length
        : 0,
  }));
}

// ============================================
// AFFILIATE TRACKING
// ============================================

/**
 * Track affiliate click
 */
export async function trackAffiliateClick(
  platformId: string,
  referralLink: string,
  sessionId: string,
  userId?: string,
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  }
): Promise<LendingReferral> {
  const { data, error } = await db
    .from('lending_referrals')
    .insert({
      platform_id: platformId,
      referral_link: referralLink,
      session_id: sessionId,
      user_id: userId || null,
      utm_source: utmParams?.source || null,
      utm_medium: utmParams?.medium || null,
      utm_campaign: utmParams?.campaign || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get affiliate click stats
 */
export async function getAffiliateStats(
  platformId?: string,
  days: number = 30
): Promise<{
  total_clicks: number;
  unique_users: number;
  conversions: number;
  conversion_rate: number;
  total_deposits: number;
  total_commissions: number;
  by_platform: {
    platform_id: string;
    platform_name: string;
    clicks: number;
    conversions: number;
    commissions: number;
  }[];
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = db
    .from('lending_referrals')
    .select(`
      *,
      platform:lending_platforms(name)
    `)
    .gte('clicked_at', startDate.toISOString());

  if (platformId) {
    query = query.eq('platform_id', platformId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const referrals = data || [];
  const total_clicks = referrals.length;
  const unique_users = new Set(referrals.filter((r: any) => r.user_id).map((r: any) => r.user_id)).size;
  const conversions = referrals.filter((r: any) => r.converted).length;
  const conversion_rate = total_clicks > 0 ? (conversions / total_clicks) * 100 : 0;
  const total_deposits = referrals.reduce((sum: any, r: any) => sum + (r.deposit_amount || 0), 0);
  const total_commissions = referrals.reduce((sum: any, r: any) => sum + (r.commission_earned || 0), 0);

  // Group by platform
  const platformStats: Record<
    string,
    { platform_id: string; platform_name: string; clicks: number; conversions: number; commissions: number }
  > = {};

  for (const r of referrals) {
    if (!platformStats[r.platform_id]) {
      platformStats[r.platform_id] = {
        platform_id: r.platform_id,
        platform_name: r.platform?.name || 'Unknown',
        clicks: 0,
        conversions: 0,
        commissions: 0,
      };
    }
    platformStats[r.platform_id].clicks++;
    if (r.converted) platformStats[r.platform_id].conversions++;
    platformStats[r.platform_id].commissions += r.commission_earned || 0;
  }

  return {
    total_clicks,
    unique_users,
    conversions,
    conversion_rate: Math.round(conversion_rate * 100) / 100,
    total_deposits,
    total_commissions,
    by_platform: Object.values(platformStats),
  };
}

/**
 * Record conversion (called by webhook or admin)
 */
export async function recordConversion(
  referralId: string,
  depositAmount: number,
  depositCurrency: string,
  commission: number
): Promise<void> {
  const { error } = await db
    .from('lending_referrals')
    .update({
      converted: true,
      converted_at: new Date().toISOString(),
      deposit_amount: depositAmount,
      deposit_currency: depositCurrency,
      commission_earned: commission,
      commission_status: 'pending',
    })
    .eq('id', referralId);

  if (error) throw error;
}

// ============================================
// STABLECOIN YIELDS
// ============================================

/**
 * Get best stablecoin yields
 */
export async function getBestStablecoinYields(): Promise<LendingRate[]> {
  const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD', 'FRAX', 'TUSD'];

  const { data, error } = await db
    .from('lending_rates')
    .select(`
      *,
      platform:lending_platforms(*)
    `)
    .in('asset_symbol', stablecoins)
    .not('lending_apy', 'is', null)
    .order('lending_apy', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []).filter((r: any) => r.platform?.status === 'active');
}

// ============================================
// DEMO DATA
// ============================================

export const DEMO_LENDING_PLATFORMS: LendingPlatform[] = [
  {
    id: 'aave-v3',
    name: 'Aave V3',
    slug: 'aave-v3',
    logo_url: '/logos/aave.svg',
    website_url: 'https://aave.com',
    description: 'Leading DeFi lending protocol with multi-chain support',
    platform_type: 'defi',
    supported_chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
    trust_score: 9.5,
    security_audit_url: 'https://aave.com/security',
    is_insured: false,
    supports_lending: true,
    supports_borrowing: true,
    supports_staking: true,
    max_ltv: 80,
    liquidation_threshold: 85,
    affiliate_commission_type: 'revenue_share',
    affiliate_revenue_share: 10,
    affiliate_cookie_days: 30,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as LendingPlatform,
  {
    id: 'compound-v3',
    name: 'Compound V3',
    slug: 'compound-v3',
    logo_url: '/logos/compound.svg',
    website_url: 'https://compound.finance',
    description: 'Algorithmic money market protocol on Ethereum',
    platform_type: 'defi',
    supported_chains: ['ethereum', 'polygon', 'arbitrum'],
    trust_score: 9.2,
    is_insured: false,
    supports_lending: true,
    supports_borrowing: true,
    max_ltv: 75,
    liquidation_threshold: 80,
    affiliate_commission_type: 'cpa',
    affiliate_cpa_amount: 500,
    affiliate_cookie_days: 30,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as LendingPlatform,
  {
    id: 'nexo',
    name: 'Nexo',
    slug: 'nexo',
    logo_url: '/logos/nexo.svg',
    website_url: 'https://nexo.io',
    description: 'CeFi platform offering high-yield crypto accounts',
    platform_type: 'cefi',
    supported_chains: ['ethereum', 'bitcoin', 'polygon'],
    trust_score: 8.5,
    is_insured: true,
    insurance_details: '$375M insurance coverage',
    regulatory_status: 'Licensed in multiple jurisdictions',
    supports_lending: true,
    supports_borrowing: true,
    min_deposit: 10,
    max_ltv: 50,
    affiliate_commission_type: 'cpa',
    affiliate_cpa_amount: 1000,
    affiliate_cookie_days: 60,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as LendingPlatform,
];

export const DEMO_LENDING_RATES: Partial<LendingRate>[] = [
  // Aave rates
  {
    platform_id: 'aave-v3',
    asset_symbol: 'USDC',
    asset_name: 'USD Coin',
    asset_type: 'stablecoin',
    chain: 'ethereum',
    lending_apy: 4.25,
    lending_apy_base: 3.5,
    lending_apy_rewards: 0.75,
    borrowing_apy: 5.8,
    utilization_rate: 78,
    can_be_collateral: true,
    collateral_factor: 80,
  },
  {
    platform_id: 'aave-v3',
    asset_symbol: 'ETH',
    asset_name: 'Ethereum',
    asset_type: 'crypto',
    chain: 'ethereum',
    lending_apy: 2.15,
    borrowing_apy: 3.2,
    utilization_rate: 65,
    can_be_collateral: true,
    collateral_factor: 82.5,
  },
  {
    platform_id: 'aave-v3',
    asset_symbol: 'WBTC',
    asset_name: 'Wrapped Bitcoin',
    asset_type: 'crypto',
    chain: 'ethereum',
    lending_apy: 0.85,
    borrowing_apy: 2.1,
    utilization_rate: 42,
    can_be_collateral: true,
    collateral_factor: 75,
  },
  // Compound rates
  {
    platform_id: 'compound-v3',
    asset_symbol: 'USDC',
    asset_name: 'USD Coin',
    asset_type: 'stablecoin',
    chain: 'ethereum',
    lending_apy: 3.95,
    lending_apy_base: 3.2,
    lending_apy_rewards: 0.75,
    borrowing_apy: 5.5,
    utilization_rate: 72,
  },
  {
    platform_id: 'compound-v3',
    asset_symbol: 'ETH',
    asset_name: 'Ethereum',
    asset_type: 'crypto',
    chain: 'ethereum',
    lending_apy: 1.85,
    borrowing_apy: 2.9,
    utilization_rate: 58,
  },
  // Nexo rates
  {
    platform_id: 'nexo',
    asset_symbol: 'USDC',
    asset_name: 'USD Coin',
    asset_type: 'stablecoin',
    chain: 'ethereum',
    lending_apy: 8.0,
    borrowing_apy: 13.9,
    utilization_rate: 85,
  },
  {
    platform_id: 'nexo',
    asset_symbol: 'BTC',
    asset_name: 'Bitcoin',
    asset_type: 'crypto',
    chain: 'bitcoin',
    lending_apy: 5.0,
    borrowing_apy: 11.9,
    utilization_rate: 70,
  },
];

/**
 * Get demo data for development
 */
export function getDemoRatesComparison(): LendingRateComparison[] {
  return [
    {
      asset_symbol: 'USDC',
      asset_name: 'USD Coin',
      rates: [
        {
          platform: DEMO_LENDING_PLATFORMS[0],
          lending_apy: 4.25,
          borrowing_apy: 5.8,
          utilization: 78,
        },
        {
          platform: DEMO_LENDING_PLATFORMS[1],
          lending_apy: 3.95,
          borrowing_apy: 5.5,
          utilization: 72,
        },
        {
          platform: DEMO_LENDING_PLATFORMS[2],
          lending_apy: 8.0,
          borrowing_apy: 13.9,
          utilization: 85,
        },
      ],
      best_lending_platform: 'Nexo',
      best_borrowing_platform: 'Compound V3',
    },
    {
      asset_symbol: 'ETH',
      asset_name: 'Ethereum',
      rates: [
        {
          platform: DEMO_LENDING_PLATFORMS[0],
          lending_apy: 2.15,
          borrowing_apy: 3.2,
          utilization: 65,
        },
        {
          platform: DEMO_LENDING_PLATFORMS[1],
          lending_apy: 1.85,
          borrowing_apy: 2.9,
          utilization: 58,
        },
      ],
      best_lending_platform: 'Aave V3',
      best_borrowing_platform: 'Compound V3',
    },
  ];
}
