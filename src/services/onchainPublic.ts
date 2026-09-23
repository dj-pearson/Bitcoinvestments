/**
 * Client for the same-origin on-chain endpoints (functions/api/onchain/*).
 *
 * The endpoints read free public sources (mempool.space, Blockchain.com
 * Charts) server-side and cache the result. This client never substitutes
 * sample data: on failure it throws, and each metric inside a successful
 * response may itself be marked unavailable.
 */

import type {
  BlockData,
  DailySeriesData,
  DifficultyData,
  FeeData,
  HashrateData,
  LargeTransaction,
  MempoolData,
  Metric,
} from '../../functions/lib/onchainSources';

export type {
  BlockData,
  DailySeriesData,
  DifficultyData,
  FeeData,
  HashrateData,
  LargeTransaction,
  MempoolData,
  Metric,
};

export interface OnchainSnapshot {
  generatedAt: string;
  metrics: {
    hashrate: Metric<HashrateData>;
    difficulty: Metric<DifficultyData>;
    fees: Metric<FeeData>;
    mempool: Metric<MempoolData>;
    blocks: Metric<BlockData[]>;
    transactions: Metric<DailySeriesData>;
    addresses: Metric<DailySeriesData>;
  };
}

export interface LargeTransactionsSnapshot {
  generatedAt: string;
  result: Metric<{ transactions: LargeTransaction[]; blocksScanned: number[] }>;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' }, signal });
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || !type.includes('application/json')) {
    // In `vite dev` there is no Pages Functions runtime, so /api/* returns the
    // SPA's HTML. Say so rather than failing to parse it.
    throw new Error(
      res.ok ? 'The on-chain data service is not available here.' : `The on-chain data service returned HTTP ${res.status}.`
    );
  }
  return (await res.json()) as T;
}

export function fetchOnchainSnapshot(signal?: AbortSignal): Promise<OnchainSnapshot> {
  return getJson<OnchainSnapshot>('/api/onchain', signal);
}

export function fetchLargeTransactions(signal?: AbortSignal): Promise<LargeTransactionsSnapshot> {
  return getJson<LargeTransactionsSnapshot>('/api/onchain/large-transactions', signal);
}

// ---------------------------------------------------------------------------
// Formatting helpers shared by the analytics pages
// ---------------------------------------------------------------------------

/** 6.5e20 H/s -> "650 EH/s" */
export function formatHashrate(hps: number): string {
  const units: [number, string][] = [
    [1e21, 'ZH/s'],
    [1e18, 'EH/s'],
    [1e15, 'PH/s'],
    [1e12, 'TH/s'],
  ];
  for (const [scale, unit] of units) {
    if (hps >= scale) return `${(hps / scale).toLocaleString('en-US', { maximumFractionDigits: 1 })} ${unit}`;
  }
  return `${hps.toLocaleString('en-US')} H/s`;
}

/** 1.2e14 -> "120.0 T" */
export function formatLargeNumber(n: number): string {
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [scale, unit] of units) {
    if (Math.abs(n) >= scale) return `${(n / scale).toLocaleString('en-US', { maximumFractionDigits: 2 })}${unit}`;
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function satsToBtc(sats: number): number {
  return sats / 1e8;
}

/** Local, human-readable timestamp. Only call after data has loaded (client side). */
export function formatDateTime(iso: string | number): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Percent change from the first to the last point of a series, or null. */
export function seriesChangePercent(series: { v: number }[], lookback: number): number | null {
  if (series.length < 2) return null;
  const end = series[series.length - 1].v;
  const startIndex = Math.max(0, series.length - 1 - lookback);
  const start = series[startIndex].v;
  if (!start) return null;
  return ((end - start) / start) * 100;
}
