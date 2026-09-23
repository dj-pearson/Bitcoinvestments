/**
 * DeFi yield data + impermanent-loss maths.
 *
 * Yield numbers come only from the same-origin /api/yields Pages Function,
 * which serves a curated, cached slice of DefiLlama's free yields dataset.
 * There is no fallback data generator: if the request fails, the page shows
 * its static educational baseline instead of numbers.
 */

export type YieldCategory = 'lending' | 'liquid-staking' | 'dex' | 'savings' | 'yield';

/** Mirrors the pool shape returned by functions/api/yields.ts. */
export interface YieldPool {
  id: string;
  project: string;
  projectName: string;
  category: YieldCategory;
  chain: string;
  symbol: string;
  poolMeta: string | null;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  apyMean30d: number | null;
  stablecoin: boolean;
  ilRisk: boolean;
  exposure: 'single' | 'multi' | null;
  apyBaseBorrow: number | null;
  apyRewardBorrow: number | null;
  totalSupplyUsd: number | null;
  totalBorrowUsd: number | null;
  ltv: number | null;
  url: string;
}

export interface YieldsResponse {
  asOf: string;
  source: string;
  sourceUrl: string;
  pools: YieldPool[];
}

export const YIELD_CATEGORY_LABELS: Record<YieldCategory, string> = {
  lending: 'Lending',
  'liquid-staking': 'Liquid staking',
  dex: 'DEX liquidity',
  savings: 'Savings rate',
  yield: 'Yield vault',
};

/** Protocol home pages (plain links, no referral codes). */
export const PROTOCOL_SITES: Record<string, string> = {
  'aave-v3': 'https://aave.com',
  'compound-v3': 'https://compound.finance',
  sparklend: 'https://spark.fi',
  'spark-savings': 'https://spark.fi',
  'sky-lending': 'https://sky.money',
  'morpho-blue': 'https://morpho.org',
  'morpho-v1': 'https://morpho.org',
  'fluid-lending': 'https://fluid.io',
  lido: 'https://lido.fi',
  'rocket-pool': 'https://rocketpool.net',
  'coinbase-wrapped-staked-eth': 'https://www.coinbase.com/cbeth',
  'jito-liquid-staking': 'https://www.jito.network',
  'marinade-liquid-staking': 'https://marinade.finance',
  'uniswap-v3': 'https://app.uniswap.org',
  'uniswap-v4': 'https://app.uniswap.org',
  'curve-dex': 'https://curve.finance',
  'balancer-v2': 'https://balancer.fi',
  'aerodrome-v1': 'https://aerodrome.finance',
  'aerodrome-slipstream': 'https://aerodrome.finance',
  'convex-finance': 'https://www.convexfinance.com',
  'yearn-finance': 'https://yearn.fi',
};

function isYieldsResponse(v: unknown): v is YieldsResponse {
  if (!v || typeof v !== 'object') return false;
  const r = v as Partial<YieldsResponse>;
  return typeof r.asOf === 'string' && Array.isArray(r.pools);
}

/**
 * Fetch the curated yields snapshot. Throws on any failure so callers can
 * show their static baseline; never substitutes made-up data.
 */
export async function fetchYields(signal?: AbortSignal): Promise<YieldsResponse> {
  const res = await fetch('/api/yields', { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Yield data unavailable (${res.status})`);
  const ct = res.headers.get('content-type') || '';
  // On the Vite dev server /api/* falls through to index.html.
  if (!ct.includes('application/json')) throw new Error('Yield data unavailable');
  const json: unknown = await res.json();
  if (!isYieldsResponse(json)) throw new Error('Unexpected yield data');
  return json;
}

// ============================================
// Impermanent loss (50/50 constant-product pool)
// ============================================

/**
 * Impermanent loss for a 50/50 constant-product pool, as a positive
 * percentage, when one asset's price changes by `priceChangePercent` relative
 * to the other. A -100% move (one side goes to zero) is a 100% loss.
 */
export function estimateImpermanentLoss(priceChangePercent: number): number {
  const k = 1 + priceChangePercent / 100;
  if (!Number.isFinite(k)) return NaN;
  if (k <= 0) return 100;
  const il = (2 * Math.sqrt(k)) / (1 + k) - 1;
  return Math.abs(il) * 100;
}

export interface ImpermanentLossResult {
  ilPercent: number;
  hodlValue: number;
  lpValue: number;
  ilUsd: number;
  /** LP value + fees − HODL value: positive means providing liquidity won. */
  netVsHodl: number;
  /** Fees (as % of deposit) needed to break even with holding. */
  breakevenFeePercent: number;
}

/**
 * Compare depositing `depositUsd` into a 50/50 pool with simply holding the
 * two assets, after asset A moves `priceChangePercent` against asset B.
 */
export function calculateImpermanentLoss(
  depositUsd: number,
  priceChangePercent: number,
  feesEarnedUsd = 0
): ImpermanentLossResult {
  const r = Math.max(0, 1 + priceChangePercent / 100);
  const hodlValue = (depositUsd / 2) * r + depositUsd / 2;
  const lpValue = depositUsd * Math.sqrt(r);
  const ilUsd = hodlValue - lpValue;
  return {
    ilPercent: hodlValue > 0 ? (ilUsd / hodlValue) * 100 : 0,
    hodlValue,
    lpValue,
    ilUsd,
    netVsHodl: lpValue + feesEarnedUsd - hodlValue,
    breakevenFeePercent: depositUsd > 0 ? (ilUsd / depositUsd) * 100 : 0,
  };
}

/** Reference points computed from the formula (not hard-coded). */
export const IL_REFERENCE_MOVES = [-75, -50, -25, 25, 50, 100, 200, 400];

// ============================================
// Formatting
// ============================================

export function formatApy(apy: number | null | undefined): string {
  if (apy === null || apy === undefined || !Number.isFinite(apy)) return 'n/a';
  return `${apy.toFixed(2)}%`;
}

export function formatUsdCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

/** "Sep 23, 2026, 14:05 UTC" — call only in effects/handlers or on fetched data. */
export function formatAsOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return (
    d.toLocaleString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' UTC'
  );
}
