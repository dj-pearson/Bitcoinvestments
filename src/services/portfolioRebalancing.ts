/**
 * Portfolio rebalancing maths for the client-side rebalancing calculator
 * (/rebalancing-alerts).
 *
 * Pure functions only: no network, no storage, no mock data. The page supplies
 * the holdings the visitor typed in.
 */

export interface RebalanceHolding {
  /** Ticker or label, e.g. "BTC". Compared case-insensitively. */
  symbol: string;
  /** Current market value in USD. */
  value: number;
}

export interface RebalanceTarget {
  symbol: string;
  /** Target weight, 0-100. */
  targetPercent: number;
}

export type RebalanceMode = 'full' | 'buy-only';

export interface RebalanceOptions {
  /** Tolerance band in percentage points, e.g. 5 means target ±5 points. */
  bandPoints: number;
  /** Trades smaller than this (USD) are skipped. */
  minTradeUsd: number;
  /** New cash to invest this time (USD). */
  newCashUsd: number;
  /** 'full' buys and sells back to target; 'buy-only' only spends new cash. */
  mode: RebalanceMode;
  /** Estimated trading cost as a percentage of each trade (0-100). */
  feePercent: number;
}

export interface DriftRow {
  symbol: string;
  currentValue: number;
  currentPercent: number;
  targetPercent: number;
  /** currentPercent - targetPercent, in percentage points. */
  driftPoints: number;
  /** True when the holding has no target and so counts as a 0% target. */
  untargeted: boolean;
  outsideBand: boolean;
}

export interface Trade {
  symbol: string;
  action: 'buy' | 'sell';
  amountUsd: number;
}

export interface RebalanceResult {
  totalValue: number;
  totalAfter: number;
  rows: DriftRow[];
  /** Largest absolute drift of any asset, in percentage points. */
  maxDriftPoints: number;
  /** Sum of |drift| / 2: the share of the portfolio that sits in the "wrong" asset. */
  totalDriftPoints: number;
  /** True when at least one asset is outside the band. */
  bandBreached: boolean;
  trades: Trade[];
  /** Trades that were computed but fall under the minimum trade size. */
  skippedTrades: Trade[];
  estimatedFeesUsd: number;
  /** New cash left unspent in buy-only mode (because of min trade size). */
  unallocatedCashUsd: number;
}

const norm = (s: string) => s.trim().toUpperCase();
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Sum of target weights. The calculator requires this to be 100. */
export function sumTargets(targets: RebalanceTarget[]): number {
  return targets.reduce((sum, t) => sum + (Number.isFinite(t.targetPercent) ? t.targetPercent : 0), 0);
}

/**
 * Current weight vs target weight for every asset that is either held or
 * targeted. A holding with no target is treated as a 0% target (so it shows up
 * as fully overweight) instead of being silently dropped, which would make the
 * displayed weights sum to less than 100%.
 */
export function analyzeDrift(
  holdings: RebalanceHolding[],
  targets: RebalanceTarget[],
  bandPoints = 5
): DriftRow[] {
  const values = new Map<string, number>();
  for (const h of holdings) {
    const key = norm(h.symbol);
    if (!key) continue;
    const v = Number.isFinite(h.value) && h.value > 0 ? h.value : 0;
    values.set(key, (values.get(key) ?? 0) + v);
  }

  const targetMap = new Map<string, number>();
  for (const t of targets) {
    const key = norm(t.symbol);
    if (!key) continue;
    const pct = Number.isFinite(t.targetPercent) && t.targetPercent > 0 ? t.targetPercent : 0;
    targetMap.set(key, (targetMap.get(key) ?? 0) + pct);
  }

  const totalValue = [...values.values()].reduce((a, b) => a + b, 0);
  const symbols = [...new Set([...values.keys(), ...targetMap.keys()])];

  return symbols.map((symbol) => {
    const currentValue = values.get(symbol) ?? 0;
    const hasTarget = targetMap.has(symbol);
    const targetPercent = targetMap.get(symbol) ?? 0;
    const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    const driftPoints = currentPercent - targetPercent;
    return {
      symbol,
      currentValue,
      currentPercent,
      targetPercent,
      driftPoints,
      untargeted: !hasTarget && currentValue > 0,
      outsideBand: totalValue > 0 && Math.abs(driftPoints) > bandPoints,
    };
  });
}

/**
 * Trades that bring the portfolio to its target weights.
 *
 * - 'full': the post-trade portfolio (current value + new cash) is split by
 *   target weight; each asset buys or sells the difference.
 * - 'buy-only': nothing is sold. New cash goes to underweight assets in
 *   proportion to how far each is below its target value.
 *
 * Trades below `minTradeUsd` are reported as skipped rather than executed.
 */
export function computeRebalance(
  holdings: RebalanceHolding[],
  targets: RebalanceTarget[],
  options: RebalanceOptions
): RebalanceResult {
  const band = Math.max(0, options.bandPoints || 0);
  const minTrade = Math.max(0, options.minTradeUsd || 0);
  const newCash = Math.max(0, options.newCashUsd || 0);
  const feeRate = Math.max(0, options.feePercent || 0) / 100;

  const rows = analyzeDrift(holdings, targets, band);
  const totalValue = rows.reduce((s, r) => s + r.currentValue, 0);
  const totalAfter = totalValue + newCash;
  const maxDriftPoints = rows.reduce((m, r) => Math.max(m, Math.abs(r.driftPoints)), 0);
  const totalDriftPoints = rows.reduce((s, r) => s + Math.abs(r.driftPoints), 0) / 2;
  const bandBreached = rows.some((r) => r.outsideBand);

  const raw: Trade[] = [];
  let unallocatedCashUsd = 0;

  if (options.mode === 'buy-only') {
    const deficits = rows.map((r) => ({
      symbol: r.symbol,
      deficit: Math.max(0, (r.targetPercent / 100) * totalAfter - r.currentValue),
    }));
    const totalDeficit = deficits.reduce((s, d) => s + d.deficit, 0);
    if (newCash > 0 && totalDeficit > 0) {
      const scale = Math.min(1, newCash / totalDeficit);
      for (const d of deficits) {
        const amount = d.deficit * scale;
        if (amount > 0.005) raw.push({ symbol: d.symbol, action: 'buy', amountUsd: amount });
      }
    }
    const spent = raw.reduce((s, t) => s + t.amountUsd, 0);
    unallocatedCashUsd = Math.max(0, newCash - spent);
  } else {
    for (const r of rows) {
      const targetValue = (r.targetPercent / 100) * totalAfter;
      const diff = targetValue - r.currentValue;
      if (Math.abs(diff) > 0.005) {
        raw.push({ symbol: r.symbol, action: diff > 0 ? 'buy' : 'sell', amountUsd: Math.abs(diff) });
      }
    }
  }

  const trades: Trade[] = [];
  const skippedTrades: Trade[] = [];
  for (const t of raw) {
    const rounded = { ...t, amountUsd: round2(t.amountUsd) };
    if (rounded.amountUsd < minTrade) skippedTrades.push(rounded);
    else trades.push(rounded);
  }
  if (options.mode === 'buy-only') {
    unallocatedCashUsd += skippedTrades.reduce((s, t) => s + t.amountUsd, 0);
  }

  // Sells first, then buys: the order you would place them in.
  trades.sort((a, b) => (a.action === b.action ? b.amountUsd - a.amountUsd : a.action === 'sell' ? -1 : 1));

  const estimatedFeesUsd = round2(trades.reduce((s, t) => s + t.amountUsd * feeRate, 0));

  return {
    totalValue,
    totalAfter,
    rows,
    maxDriftPoints,
    totalDriftPoints,
    bandBreached,
    trades,
    skippedTrades,
    estimatedFeesUsd,
    unallocatedCashUsd: round2(unallocatedCashUsd),
  };
}

export interface AllocationTemplate {
  name: string;
  description: string;
  targets: RebalanceTarget[];
}

/**
 * Example target mixes used to prefill the calculator. They are illustrations
 * of different risk levels, not recommendations.
 */
export function getTargetAllocationTemplates(): AllocationTemplate[] {
  return [
    {
      name: 'Bitcoin + cash buffer',
      description: 'Mostly BTC, some ETH, a stablecoin buffer to buy dips with.',
      targets: [
        { symbol: 'BTC', targetPercent: 50 },
        { symbol: 'ETH', targetPercent: 25 },
        { symbol: 'USDC', targetPercent: 25 },
      ],
    },
    {
      name: 'Large-cap mix',
      description: 'BTC and ETH core with a smaller SOL slice and a stablecoin buffer.',
      targets: [
        { symbol: 'BTC', targetPercent: 40 },
        { symbol: 'ETH', targetPercent: 30 },
        { symbol: 'SOL', targetPercent: 15 },
        { symbol: 'USDC', targetPercent: 15 },
      ],
    },
    {
      name: 'Bitcoin only + cash',
      description: 'A two-asset split: rebalancing just moves money between BTC and a stablecoin.',
      targets: [
        { symbol: 'BTC', targetPercent: 80 },
        { symbol: 'USDC', targetPercent: 20 },
      ],
    },
  ];
}
