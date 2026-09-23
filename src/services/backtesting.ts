/**
 * Backtesting engine: "what if I had invested $X in BTC on date Y?" for a lump
 * sum, a recurring buy (DCA), or both, on a real price series.
 *
 * Prices come from src/data/priceHistory (weekly baseline, optionally topped up
 * with daily CoinGecko data). Between points prices are linearly interpolated.
 * Pure functions - no network, no browser APIs - so the same code powers the
 * DCA tab on /calculators and the /backtesting page, and can be prerendered.
 */

import {
  addDays,
  addMonths,
  priceOn,
  sliceSeries,
  type PriceSeries,
} from '../data/priceHistory';

export type DcaFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface BacktestInput {
  /** One-off amount invested on the start date (may be 0 when DCA is used). */
  initialInvestment: number;
  startDate: string;
  endDate: string;
  /** Recurring amount; 0 or undefined disables DCA. */
  dcaAmount?: number;
  dcaFrequency?: DcaFrequency;
}

export interface DataCoverage {
  dataStart: string;
  dataEnd: string;
  requestedStart: string;
  requestedEnd: string;
  effectiveStart: string;
  effectiveEnd: string;
  clamped: boolean;
}

export interface Buy {
  date: string;
  amount: number;
  price: number;
  units: number;
}

export interface ValuePoint {
  date: string;
  price: number;
  invested: number;
  value: number;
}

export interface BacktestResult {
  startDate: string;
  endDate: string;
  coverage: DataCoverage;
  buys: Buy[];
  totalInvested: number;
  units: number;
  averageCost: number;
  startPrice: number;
  endPrice: number;
  finalValue: number;
  profit: number;
  /** Total return on money invested, %. */
  totalReturnPct: number;
  /**
   * Annualised return, %. For a single lump sum this is the CAGR; with recurring
   * buys it is the money-weighted return (XIRR), which accounts for when each
   * dollar went in. null when the window is too short to annualise (< 30 days)
   * or XIRR does not converge.
   */
  annualizedReturnPct: number | null;
  annualizedMethod: 'cagr' | 'xirr';
  /** Largest peak-to-trough fall in the asset's price inside the window, %. */
  priceMaxDrawdownPct: number;
  priceDrawdownPeakDate: string;
  priceDrawdownTroughDate: string;
  /** Highest price of the asset inside the window (not its all-time high). */
  windowHighPrice: number;
  windowHighDate: string;
  /** Worst unrealised loss of this strategy (value − invested) during the window. */
  worstPaperLoss: number;
  worstPaperLossPct: number;
  worstPaperLossDate: string;
  /** Value path at every price point and buy date, for charts/tables. */
  path: ValuePoint[];
  /** Same total invested as a single buy on the start date. */
  lumpSumComparison: { finalValue: number; totalReturnPct: number; annualizedReturnPct: number | null } | null;
}

export function resolveWindow(
  series: PriceSeries,
  requestedStart: string,
  requestedEnd: string
): { usable: boolean; coverage: DataCoverage; reason?: string } {
  const start = requestedStart.slice(0, 10);
  const end = requestedEnd.slice(0, 10);
  const clamp = (d: string) => (d < series.start ? series.start : d > series.end ? series.end : d);
  const coverage: DataCoverage = {
    dataStart: series.start,
    dataEnd: series.end,
    requestedStart: start,
    requestedEnd: end,
    effectiveStart: clamp(start),
    effectiveEnd: clamp(end),
    clamped: clamp(start) !== start || clamp(end) !== end,
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return { usable: false, coverage, reason: 'Enter a valid start and end date.' };
  }
  if (end <= start) return { usable: false, coverage, reason: 'The end date must be after the start date.' };
  if (start > series.end) {
    return { usable: false, coverage, reason: `Price data currently ends on ${series.end}. Choose an earlier start date.` };
  }
  if (end < series.start) {
    return { usable: false, coverage, reason: `Price data for this asset starts on ${series.start}. Choose a later end date.` };
  }
  if (coverage.effectiveEnd <= coverage.effectiveStart) {
    return { usable: false, coverage, reason: 'The covered part of that range is too short to backtest.' };
  }
  return { usable: true, coverage };
}

function nextDate(date: string, freq: DcaFrequency, startDate: string, n: number): string {
  switch (freq) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addDays(date, 7);
    case 'biweekly':
      return addDays(date, 14);
    case 'monthly':
      // Count from the start so a buy on the 31st stays on month-ends.
      return addMonths(startDate, n);
  }
}

const DAY_MS = 86400000;
const yearsBetween = (a: string, b: string) =>
  (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / (365.25 * DAY_MS);

/**
 * Money-weighted annual return (XIRR) for dated cash flows. Negative = money
 * in, positive = money out. Newton's method with a bisection fallback.
 */
export function xirr(flows: { date: string; amount: number }[]): number | null {
  if (flows.length < 2) return null;
  const t0 = flows[0].date;
  const ts = flows.map((f) => yearsBetween(t0, f.date));
  const npv = (r: number) => flows.reduce((s, f, i) => s + f.amount / Math.pow(1 + r, ts[i]), 0);
  const dnpv = (r: number) => flows.reduce((s, f, i) => s - (ts[i] * f.amount) / Math.pow(1 + r, ts[i] + 1), 0);

  let r = 0.1;
  for (let k = 0; k < 50; k++) {
    const f = npv(r);
    const d = dnpv(r);
    if (!Number.isFinite(f) || !Number.isFinite(d) || d === 0) break;
    const next = r - f / d;
    if (!Number.isFinite(next) || next <= -0.9999) break;
    if (Math.abs(next - r) < 1e-9) return next;
    r = next;
  }
  // Bisection on [-0.9999, 100].
  let lo = -0.9999;
  let hi = 100;
  let flo = npv(lo);
  const fhi = npv(hi);
  if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const fm = npv(mid);
    if (Math.abs(fm) < 1e-7) return mid;
    if (flo * fm < 0) hi = mid; else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

function cagr(start: number, end: number, years: number): number | null {
  if (years < 30 / 365.25 || start <= 0 || end < 0) return null;
  return Math.pow(end / start, 1 / years) - 1;
}

export function runBacktest(series: PriceSeries, input: BacktestInput): BacktestResult | { error: string; coverage: DataCoverage } {
  const win = resolveWindow(series, input.startDate, input.endDate);
  if (!win.usable) return { error: win.reason ?? 'That range cannot be backtested.', coverage: win.coverage };
  const start = win.coverage.effectiveStart;
  const end = win.coverage.effectiveEnd;

  const buys: Buy[] = [];
  const addBuy = (date: string, amount: number) => {
    const price = priceOn(series, date);
    if (price && amount > 0) buys.push({ date, amount, price, units: amount / price });
  };

  if (input.initialInvestment > 0) addBuy(start, input.initialInvestment);
  const dca = input.dcaAmount && input.dcaAmount > 0 && input.dcaFrequency ? input.dcaFrequency : null;
  if (dca) {
    let d = start;
    let n = 0;
    // Guard against pathological loops (daily for 12 years is ~4,400 buys).
    while (d <= end && n < 20000) {
      addBuy(d, input.dcaAmount!);
      n++;
      d = nextDate(d, dca, start, n);
    }
  }

  const startPrice = priceOn(series, start)!;
  const endPrice = priceOn(series, end)!;
  const totalInvested = buys.reduce((s, b) => s + b.amount, 0);
  const units = buys.reduce((s, b) => s + b.units, 0);
  const finalValue = units * endPrice;
  const profit = finalValue - totalInvested;

  // Value path: every price point in the window plus each buy date.
  const pricePoints = sliceSeries(series, start, end);
  const dates = new Set<string>(pricePoints.map((p) => p.date));
  for (const b of buys) dates.add(b.date);
  const sortedDates = [...dates].sort();
  const path: ValuePoint[] = [];
  let bi = 0;
  let invested = 0;
  let held = 0;
  for (const date of sortedDates) {
    while (bi < buys.length && buys[bi].date <= date) {
      invested += buys[bi].amount;
      held += buys[bi].units;
      bi++;
    }
    const price = priceOn(series, date)!;
    path.push({ date, price, invested, value: held * price });
  }

  // Asset drawdown and window high on the full price path.
  let peak = -Infinity;
  let peakDate = start;
  let maxDd = 0;
  let ddPeak = start;
  let ddTrough = start;
  let high = -Infinity;
  let highDate = start;
  for (const p of pricePoints) {
    if (p.price > peak) { peak = p.price; peakDate = p.date; }
    if (p.price > high) { high = p.price; highDate = p.date; }
    const dd = peak > 0 ? (peak - p.price) / peak : 0;
    if (dd > maxDd) { maxDd = dd; ddPeak = peakDate; ddTrough = p.date; }
  }

  // Worst paper loss of the strategy (value below money put in).
  let worst = 0;
  let worstPct = 0;
  let worstDate = start;
  for (const p of path) {
    const loss = p.value - p.invested;
    if (loss < worst) {
      worst = loss;
      worstPct = p.invested > 0 ? (loss / p.invested) * 100 : 0;
      worstDate = p.date;
    }
  }

  const years = yearsBetween(start, end);
  const singleBuy = buys.length === 1;
  let annualized: number | null;
  if (singleBuy) {
    annualized = cagr(totalInvested, finalValue, years);
  } else if (years < 30 / 365.25) {
    annualized = null;
  } else {
    annualized = xirr([
      ...buys.map((b) => ({ date: b.date, amount: -b.amount })),
      { date: end, amount: finalValue },
    ]);
  }

  const lumpUnits = totalInvested / startPrice;
  const lumpValue = lumpUnits * endPrice;
  const lumpSumComparison = singleBuy
    ? null
    : {
        finalValue: lumpValue,
        totalReturnPct: totalInvested > 0 ? (lumpValue / totalInvested - 1) * 100 : 0,
        annualizedReturnPct: (() => {
          const c = cagr(totalInvested, lumpValue, years);
          return c === null ? null : c * 100;
        })(),
      };

  return {
    startDate: start,
    endDate: end,
    coverage: win.coverage,
    buys,
    totalInvested,
    units,
    averageCost: units > 0 ? totalInvested / units : 0,
    startPrice,
    endPrice,
    finalValue,
    profit,
    totalReturnPct: totalInvested > 0 ? (profit / totalInvested) * 100 : 0,
    annualizedReturnPct: annualized === null ? null : annualized * 100,
    annualizedMethod: singleBuy ? 'cagr' : 'xirr',
    priceMaxDrawdownPct: maxDd * 100,
    priceDrawdownPeakDate: ddPeak,
    priceDrawdownTroughDate: ddTrough,
    windowHighPrice: high,
    windowHighDate: highDate,
    worstPaperLoss: worst,
    worstPaperLossPct: worstPct,
    worstPaperLossDate: worstDate,
    path,
    lumpSumComparison,
  };
}

export function isBacktestError(r: ReturnType<typeof runBacktest>): r is { error: string; coverage: DataCoverage } {
  return 'error' in r;
}

export function formatUsd(amount: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatSignedPct(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const s = Math.abs(value).toFixed(digits);
  return value >= 0 ? `+${s}%` : `-${s}%`;
}

/** Downsample a path to at most `max` points, always keeping the first and last. */
export function samplePath<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}
