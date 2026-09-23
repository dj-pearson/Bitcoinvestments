/**
 * Historical price series shared by the DCA calculator (/calculators) and the
 * backtester (/backtesting).
 *
 * The committed baseline (`weeklyPrices.ts`) is one USD price per week, so every
 * page can render a real result on first paint without a network call. When the
 * browser can reach CoinGecko, `mergeLivePrices` replaces the tail of the weekly
 * series with daily prices from the API (the free API serves about 365 days), so
 * recent windows get daily resolution and run up to today.
 *
 * Between two points the price is linearly interpolated. With weekly points that
 * smooths out intra-week moves, which is disclosed wherever results are shown.
 *
 * How the baseline was generated (2026-09-23):
 *  1. Download csv/btc.csv and csv/eth.csv from github.com/coinmetrics/data and
 *     take `PriceUSD` on every Monday from 2014-01-06 (BTC) / 2015-08-10 (ETH).
 *  2. For Mondays after the last Coin Metrics row, and for SOL (no price column in
 *     the community file before May 2026), take the CoinGecko USD price from
 *     github.com/IQUXAe/daily-crypto-commit `crypto_prices_YYYYMMDD.json`.
 *  3. Append the latest available day.
 * NEEDS-OWNER: automate this as a scheduled script (e.g. scripts/update-price-history.mjs
 * using a CoinGecko API key) so SOL history back to 2020 and future weeks are added.
 */

import {
  WEEKLY_PRICES,
  PRICE_HISTORY_GENERATED,
  type PriceHistoryAssetId,
} from './weeklyPrices';

export type { PriceHistoryAssetId };
export { PRICE_HISTORY_GENERATED };

export interface PricePoint {
  date: string; // YYYY-MM-DD (UTC)
  price: number; // USD
}

export interface PriceSeries {
  asset: PriceHistoryAssetId;
  points: PricePoint[];
  /** First and last dates covered. */
  start: string;
  end: string;
  /** True when the tail of the series came from a live CoinGecko request. */
  live: boolean;
  /** First date served by the live data (daily resolution from here on). */
  liveFrom: string | null;
}

export const PRICE_ASSETS: ReadonlyArray<{
  id: PriceHistoryAssetId;
  name: string;
  symbol: string;
}> = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
];

export function isPriceAsset(value: string | null | undefined): value is PriceHistoryAssetId {
  return value === 'bitcoin' || value === 'ethereum' || value === 'solana';
}

export const PRICE_HISTORY_SOURCES =
  'Coin Metrics community data (daily close) through May 2026, then daily CoinGecko snapshots';

/** The committed weekly baseline for an asset. Pure and SSR-safe. */
export function getStaticSeries(asset: PriceHistoryAssetId): PriceSeries {
  const points = WEEKLY_PRICES[asset].points.map(([date, price]) => ({ date, price }));
  return {
    asset,
    points,
    start: points[0].date,
    end: points[points.length - 1].date,
    live: false,
    liveFrom: null,
  };
}

/** Where the static baseline switches from Coin Metrics to CoinGecko snapshots. */
export function getCoinMetricsThrough(asset: PriceHistoryAssetId): string | null {
  return WEEKLY_PRICES[asset].coinMetricsThrough;
}

function toUtcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Splice daily prices from CoinGecko (`[timestampMs, price][]`) onto the weekly
 * baseline. Static points on or after the first live day are dropped so the two
 * sources never interleave. Returns the static series unchanged if `live` is empty.
 */
export function mergeLivePrices(
  base: PriceSeries,
  live: ReadonlyArray<readonly [number, number]>
): PriceSeries {
  const byDay = new Map<string, number>();
  for (const [ms, price] of live) {
    if (Number.isFinite(ms) && Number.isFinite(price) && price > 0) {
      // Last value for a day wins (CoinGecko appends the current price last).
      byDay.set(toUtcDay(ms), price);
    }
  }
  if (byDay.size === 0) return base;

  const liveDays = [...byDay.keys()].sort();
  const liveFrom = liveDays[0];
  const points = [
    ...base.points.filter((p) => p.date < liveFrom),
    ...liveDays.map((date) => ({ date, price: byDay.get(date)! })),
  ];

  return {
    ...base,
    points,
    start: points[0].date,
    end: points[points.length - 1].date,
    live: true,
    liveFrom,
  };
}

function dayMs(date: string): number {
  return Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
}

/**
 * Index of the last point whose date is <= `date`, or -1. Binary search because
 * a daily DCA over ten years asks this ~3,600 times.
 */
function floorIndex(points: PricePoint[], date: string): number {
  let lo = 0;
  let hi = points.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].date <= date) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/**
 * Price on a given day, linearly interpolated between the surrounding points.
 * Returns null outside the covered range - callers must clamp or report it.
 */
export function priceOn(series: PriceSeries, date: string): number | null {
  const day = date.slice(0, 10);
  if (day < series.start || day > series.end) return null;
  const i = floorIndex(series.points, day);
  if (i < 0) return null;
  const a = series.points[i];
  if (a.date === day || i === series.points.length - 1) return a.price;
  const b = series.points[i + 1];
  const span = dayMs(b.date) - dayMs(a.date);
  if (span <= 0) return a.price;
  const t = (dayMs(day) - dayMs(a.date)) / span;
  return a.price + (b.price - a.price) * t;
}

/** Points strictly inside (start, end) plus interpolated endpoints. */
export function sliceSeries(series: PriceSeries, start: string, end: string): PricePoint[] {
  const s = priceOn(series, start);
  const e = priceOn(series, end);
  if (s === null || e === null || end < start) return [];
  const out: PricePoint[] = [{ date: start, price: s }];
  for (const p of series.points) {
    if (p.date > start && p.date < end) out.push(p);
  }
  if (end !== start) out.push({ date: end, price: e });
  return out;
}

/** Add whole months to an ISO day, clamping to the month's last day. */
export function addMonths(date: string, months: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
