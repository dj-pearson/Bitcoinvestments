/**
 * Lending comparison helpers for /lending.
 *
 * DeFi lending rates come only from the same-origin /api/yields function
 * (DefiLlama data, cached). This module filters that snapshot to the lending
 * protocols listed in src/data/lendingPlatforms.ts and to one asset group.
 * There is no hard-coded rate table and no fallback numbers.
 *
 * The old demo platforms/rates, trust scores, affiliate "bonus" figures and
 * the unused Supabase rate layer were removed: they showed invented numbers
 * and wrote string ids into a UUID column.
 */

import { DEFI_LENDING_PROTOCOLS } from '../data/lendingPlatforms';
import type { YieldPool } from './defiYield';

export interface AssetGroup {
  id: string;
  label: string;
  /** Upper-case DefiLlama symbols that count as this asset. */
  symbols: string[];
}

export const LENDING_ASSET_GROUPS: AssetGroup[] = [
  { id: 'usdc', label: 'USDC', symbols: ['USDC', 'USDC.E'] },
  { id: 'usdt', label: 'USDT', symbols: ['USDT', 'USDT0'] },
  { id: 'dai', label: 'DAI / USDS', symbols: ['DAI', 'USDS', 'SDAI', 'SUSDS'] },
  { id: 'eth', label: 'ETH', symbols: ['ETH', 'WETH'] },
  { id: 'btc', label: 'Bitcoin (wrapped)', symbols: ['WBTC', 'CBBTC', 'TBTC', 'BTC'] },
];

const LENDING_SLUGS = new Map<string, string>(
  DEFI_LENDING_PROTOCOLS.flatMap((p) => p.llamaSlugs.map((s) => [s, p.name] as const))
);

export function protocolNameForSlug(slug: string): string | undefined {
  return LENDING_SLUGS.get(slug);
}

export function protocolUrlForSlug(slug: string): string | undefined {
  return DEFI_LENDING_PROTOCOLS.find((p) => p.llamaSlugs.includes(slug))?.url;
}

/** Single-asset supply pools for the given asset on the tracked lending protocols. */
export function selectLendingPools(pools: YieldPool[], group: AssetGroup, limit = 25): YieldPool[] {
  const wanted = new Set(group.symbols);
  return pools
    .filter((p) => LENDING_SLUGS.has(p.project))
    .filter((p) => !p.symbol.includes('-') && wanted.has(p.symbol))
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, limit);
}

/** Utilization = borrowed / supplied, only when DefiLlama reports both. */
export function utilizationPercent(p: YieldPool): number | null {
  if (!p.totalSupplyUsd || p.totalBorrowUsd === null || p.totalSupplyUsd <= 0) return null;
  return Math.min(100, (p.totalBorrowUsd / p.totalSupplyUsd) * 100);
}

/** Net borrow cost = base borrow APY − borrow rewards; null if not reported. */
export function borrowApy(p: YieldPool): number | null {
  if (p.apyBaseBorrow === null) return null;
  return p.apyBaseBorrow - (p.apyRewardBorrow ?? 0);
}

// ============================================
// Borrowing: health factor / liquidation maths
// ============================================

export interface LiquidationResult {
  ltvPercent: number;
  healthFactor: number;
  /** % the collateral price can fall before liquidation (0 if already liquidatable). */
  dropToLiquidationPercent: number;
}

/**
 * Health factor = collateral value × liquidation threshold ÷ debt.
 * Below 1.0 the position can be liquidated.
 */
export function calculateLiquidation(
  collateralUsd: number,
  debtUsd: number,
  liquidationThresholdPercent: number
): LiquidationResult | null {
  if (collateralUsd <= 0 || debtUsd <= 0 || liquidationThresholdPercent <= 0) return null;
  const lt = liquidationThresholdPercent / 100;
  const healthFactor = (collateralUsd * lt) / debtUsd;
  return {
    ltvPercent: (debtUsd / collateralUsd) * 100,
    healthFactor,
    dropToLiquidationPercent: healthFactor > 1 ? (1 - 1 / healthFactor) * 100 : 0,
  };
}
