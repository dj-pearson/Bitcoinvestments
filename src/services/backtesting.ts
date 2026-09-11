/**
 * Backtesting Service
 *
 * Provides "What if I had invested $X in BTC Y years ago?" functionality
 * with DCA (Dollar Cost Averaging) simulation support.
 *
 * Free: Basic single-asset backtesting
 * Premium: Advanced multi-asset backtesting with DCA simulation
 */

export interface BacktestInput {
  asset: string; // 'bitcoin', 'ethereum', etc.
  initialInvestment: number;
  startDate: string; // ISO date
  endDate?: string; // ISO date, defaults to today
  dcaAmount?: number; // Optional recurring investment
  dcaFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
}

export interface DataCoverage {
  /** Earliest date the dataset has a price anchor for this asset. */
  dataStart: string;
  /** Latest date the dataset has a price anchor for this asset. */
  dataEnd: string;
  /** What the user asked for. */
  requestedStart: string;
  requestedEnd: string;
  /** What was actually simulated, after clamping to the dataset. */
  effectiveStart: string;
  effectiveEnd: string;
  /** True when either endpoint had to be moved to stay inside the dataset. */
  clamped: boolean;
}

export interface BacktestResult {
  asset: string;
  /** Effective (clamped) window the numbers below describe. */
  startDate: string;
  endDate: string;
  initialInvestment: number;
  totalInvested: number;
  finalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  maxDrawdown: number;
  maxDrawdownDate: string;
  allTimeHigh: number;
  allTimeHighDate: string;
  priceHistory: PricePoint[];
  investmentHistory: InvestmentPoint[];
  dcaSummary?: DCASummary;
  coverage: DataCoverage;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface InvestmentPoint {
  date: string;
  invested: number;
  value: number;
  holdings: number;
  profit: number;
  profitPercentage: number;
}

export interface DCASummary {
  totalInvestments: number;
  averageCost: number;
  costBasis: number;
  finalHoldings: number;
  dcaReturnPercentage: number;
  lumpSumReturnPercentage: number;
  dcaAdvantage: number; // Positive = DCA performed better
}

// Historical price data (simplified - in production, fetch from API)
const HISTORICAL_PRICES: Record<string, Record<string, number>> = {
  bitcoin: {
    '2019-12-09': 7400,
    '2020-01-01': 7200,
    '2020-06-01': 9500,
    '2020-12-01': 19500,
    '2021-01-01': 29000,
    '2021-04-01': 58000,
    '2021-06-01': 35000,
    '2021-11-01': 63000,
    '2022-01-01': 47000,
    '2022-06-01': 29000,
    '2022-12-01': 17000,
    '2023-01-01': 16500,
    '2023-06-01': 26500,
    '2023-12-01': 42000,
    '2024-01-01': 44000,
    '2024-03-01': 62000,
    '2024-06-01': 67000,
    '2024-09-01': 58000,
    '2024-12-01': 96000,
    '2024-12-09': 98000,
  },
  ethereum: {
    '2019-12-09': 150,
    '2020-01-01': 130,
    '2020-06-01': 230,
    '2020-12-01': 600,
    '2021-01-01': 730,
    '2021-04-01': 2100,
    '2021-06-01': 2500,
    '2021-11-01': 4600,
    '2022-01-01': 3700,
    '2022-06-01': 1800,
    '2022-12-01': 1200,
    '2023-01-01': 1200,
    '2023-06-01': 1900,
    '2023-12-01': 2300,
    '2024-01-01': 2400,
    '2024-03-01': 3500,
    '2024-06-01': 3800,
    '2024-09-01': 2400,
    '2024-12-01': 3700,
    '2024-12-09': 3900,
  },
  solana: {
    '2021-01-01': 1.5,
    '2021-04-01': 25,
    '2021-06-01': 35,
    '2021-11-01': 250,
    '2022-01-01': 170,
    '2022-06-01': 40,
    '2022-12-01': 13,
    '2023-01-01': 10,
    '2023-06-01': 20,
    '2023-12-01': 110,
    '2024-01-01': 100,
    '2024-03-01': 180,
    '2024-06-01': 150,
    '2024-09-01': 135,
    '2024-12-01': 230,
    '2024-12-09': 220,
  },
};

/**
 * Sorted list of the dates we hold price anchors for, cached per asset.
 */
const anchorCache = new Map<string, string[]>();

function getAnchorDates(asset: string): string[] {
  const key = asset.toLowerCase();
  const cached = anchorCache.get(key);
  if (cached) return cached;

  const prices = HISTORICAL_PRICES[key];
  const dates = prices ? Object.keys(prices).sort() : [];
  anchorCache.set(key, dates);
  return dates;
}

/**
 * The window this asset actually has data for. Returns null for unknown assets.
 */
export function getAssetCoverage(asset: string): { dataStart: string; dataEnd: string } | null {
  const dates = getAnchorDates(asset);
  if (dates.length === 0) return null;
  return { dataStart: dates[0], dataEnd: dates[dates.length - 1] };
}

function toDay(date: string): string {
  return date.slice(0, 10);
}

function clampDate(date: string, min: string, max: string): string {
  const day = toDay(date);
  if (day < min) return min;
  if (day > max) return max;
  return day;
}

/**
 * Price for a date, linearly interpolated between the two surrounding anchors.
 *
 * The dataset is a sparse set of monthly-ish snapshots, so an exact match is the
 * exception. Interpolating (rather than snapping to the nearest anchor) keeps two
 * nearby dates from collapsing onto the same price, which would otherwise report a
 * multi-month window as a flat 0% return. Dates outside the dataset are held at the
 * first/last anchor - callers are expected to clamp first and disclose the clamp.
 */
function getPriceForDate(asset: string, date: string): number {
  const prices = HISTORICAL_PRICES[asset.toLowerCase()];
  const dates = getAnchorDates(asset);
  if (!prices || dates.length === 0) return 0;

  const target = toDay(date);
  if (prices[target] !== undefined) return prices[target];
  if (target <= dates[0]) return prices[dates[0]];
  if (target >= dates[dates.length - 1]) return prices[dates[dates.length - 1]];

  let before = dates[0];
  let after = dates[dates.length - 1];
  for (const d of dates) {
    if (d <= target) before = d;
    if (d >= target) {
      after = d;
      break;
    }
  }

  const beforeTime = new Date(before).getTime();
  const afterTime = new Date(after).getTime();
  const span = afterTime - beforeTime;
  if (span <= 0) return prices[before];

  const ratio = (new Date(target).getTime() - beforeTime) / span;
  return prices[before] + (prices[after] - prices[before]) * ratio;
}

/**
 * Generate price history between two dates.
 *
 * Includes interpolated points at both endpoints so the series always spans the
 * requested window, even when no anchor happens to fall inside it.
 */
function generatePriceHistory(
  asset: string,
  startDate: string,
  endDate: string
): PricePoint[] {
  const prices = HISTORICAL_PRICES[asset.toLowerCase()];
  if (!prices) return [];

  const start = toDay(startDate);
  const end = toDay(endDate);
  if (end < start) return [];

  const interior = getAnchorDates(asset).filter((d) => d > start && d < end);
  const history: PricePoint[] = [{ date: start, price: getPriceForDate(asset, start) }];

  for (const date of interior) {
    history.push({ date, price: prices[date] });
  }

  if (end !== start) {
    history.push({ date: end, price: getPriceForDate(asset, end) });
  }

  return history;
}

/**
 * Calculate lump sum investment result
 */
function calculateLumpSum(
  asset: string,
  investment: number,
  startDate: string,
  endDate: string
): { finalValue: number; holdings: number; returnPercentage: number } {
  const startPrice = getPriceForDate(asset, startDate);
  const endPrice = getPriceForDate(asset, endDate);

  if (startPrice === 0) {
    return { finalValue: 0, holdings: 0, returnPercentage: 0 };
  }

  const holdings = investment / startPrice;
  const finalValue = holdings * endPrice;
  const returnPercentage = ((finalValue - investment) / investment) * 100;

  return { finalValue, holdings, returnPercentage };
}

/**
 * Calculate DCA investment result
 */
function calculateDCA(
  asset: string,
  initialInvestment: number,
  dcaAmount: number,
  frequency: BacktestInput['dcaFrequency'],
  startDate: string,
  endDate: string
): {
  totalInvested: number;
  finalValue: number;
  holdings: number;
  averageCost: number;
  investments: InvestmentPoint[];
} {
  const start = new Date(`${toDay(startDate)}T00:00:00Z`);
  const end = new Date(`${toDay(endDate)}T00:00:00Z`);

  // Monthly contributions land on the same day of each calendar month; the other
  // cadences are fixed-length so a day count is exact.
  const intervalDays = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 0,
  }[frequency || 'monthly'];

  const advance = (date: Date, step: number): void => {
    if (intervalDays === 0) {
      date.setUTCMonth(date.getUTCMonth() + step);
    } else {
      date.setUTCDate(date.getUTCDate() + intervalDays * step);
    }
  };

  let totalInvested = initialInvestment;
  let totalHoldings = 0;
  const investments: InvestmentPoint[] = [];

  // Initial investment
  const initialPrice = getPriceForDate(asset, startDate);
  if (initialPrice > 0) {
    totalHoldings = initialInvestment / initialPrice;
    investments.push({
      date: startDate,
      invested: totalInvested,
      value: totalHoldings * initialPrice,
      holdings: totalHoldings,
      profit: 0,
      profitPercentage: 0,
    });
  }

  // DCA investments
  const currentDate = new Date(start);
  advance(currentDate, 1);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const price = getPriceForDate(asset, dateStr);

    if (price > 0) {
      const newHoldings = dcaAmount / price;
      totalHoldings += newHoldings;
      totalInvested += dcaAmount;

      const currentValue = totalHoldings * price;
      const profit = currentValue - totalInvested;
      const profitPercentage = (profit / totalInvested) * 100;

      investments.push({
        date: dateStr,
        invested: totalInvested,
        value: currentValue,
        holdings: totalHoldings,
        profit,
        profitPercentage,
      });
    }

    advance(currentDate, 1);
  }

  const endPrice = getPriceForDate(asset, endDate);
  const finalValue = totalHoldings * endPrice;
  const averageCost = totalHoldings > 0 ? totalInvested / totalHoldings : 0;

  return {
    totalInvested,
    finalValue,
    holdings: totalHoldings,
    averageCost,
    investments,
  };
}

/**
 * Calculate max drawdown
 */
function calculateMaxDrawdown(investments: InvestmentPoint[]): {
  maxDrawdown: number;
  maxDrawdownDate: string;
  allTimeHigh: number;
  allTimeHighDate: string;
} {
  let allTimeHigh = 0;
  let allTimeHighDate = '';
  let maxDrawdown = 0;
  let maxDrawdownDate = '';

  for (const point of investments) {
    if (point.value > allTimeHigh) {
      allTimeHigh = point.value;
      allTimeHighDate = point.date;
    }

    const drawdown = ((allTimeHigh - point.value) / allTimeHigh) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDate = point.date;
    }
  }

  return { maxDrawdown, maxDrawdownDate, allTimeHigh, allTimeHighDate };
}

/**
 * Calculate annualized return
 */
function calculateAnnualizedReturn(
  totalReturn: number,
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000);

  if (years <= 0) return 0;

  const annualized = (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100;
  return annualized;
}

/**
 * Resolve the requested window against the data we actually have.
 *
 * The dataset is a fixed set of historical snapshots with a hard end date, so a
 * window that runs past it (every "last 12 months" request once the dataset ages)
 * cannot be simulated honestly. Rather than silently pinning both endpoints to the
 * final anchor and reporting a flat 0%, we clamp to the covered range and hand the
 * caller enough metadata to say so - or report the window as unusable when it has
 * no overlap with the data at all.
 */
export function resolveWindow(
  asset: string,
  requestedStart: string,
  requestedEnd: string
): { usable: boolean; coverage: DataCoverage; reason?: string } {
  const assetCoverage = getAssetCoverage(asset);
  const start = toDay(requestedStart);
  const end = toDay(requestedEnd);

  if (!assetCoverage) {
    return {
      usable: false,
      reason: `No historical price data is available for "${asset}".`,
      coverage: {
        dataStart: '',
        dataEnd: '',
        requestedStart: start,
        requestedEnd: end,
        effectiveStart: start,
        effectiveEnd: end,
        clamped: false,
      },
    };
  }

  const { dataStart, dataEnd } = assetCoverage;
  const effectiveStart = clampDate(start, dataStart, dataEnd);
  const effectiveEnd = clampDate(end, dataStart, dataEnd);
  const coverage: DataCoverage = {
    dataStart,
    dataEnd,
    requestedStart: start,
    requestedEnd: end,
    effectiveStart,
    effectiveEnd,
    clamped: effectiveStart !== start || effectiveEnd !== end,
  };

  if (end < start) {
    return { usable: false, reason: 'The end date must fall after the start date.', coverage };
  }

  if (start > dataEnd) {
    return {
      usable: false,
      reason: `Historical data for this asset ends on ${dataEnd}. Choose a start date on or before then.`,
      coverage,
    };
  }

  if (end < dataStart) {
    return {
      usable: false,
      reason: `Historical data for this asset begins on ${dataStart}. Choose an end date on or after then.`,
      coverage,
    };
  }

  if (effectiveEnd === effectiveStart) {
    return {
      usable: false,
      reason: `The covered portion of that range is a single day (${effectiveStart}), so there is nothing to simulate.`,
      coverage,
    };
  }

  return { usable: true, coverage };
}

function emptyResult(input: BacktestInput, coverage: DataCoverage): BacktestResult {
  return {
    asset: input.asset,
    startDate: coverage.effectiveStart,
    endDate: coverage.effectiveEnd,
    initialInvestment: input.initialInvestment,
    totalInvested: input.initialInvestment,
    finalValue: 0,
    totalReturn: 0,
    totalReturnPercentage: 0,
    annualizedReturn: 0,
    maxDrawdown: 0,
    maxDrawdownDate: '',
    allTimeHigh: 0,
    allTimeHighDate: '',
    priceHistory: [],
    investmentHistory: [],
    coverage,
  };
}

/**
 * Run backtest simulation
 */
export function runBacktest(input: BacktestInput): BacktestResult {
  const requestedStart = toDay(input.startDate);
  const requestedEnd = toDay(input.endDate || new Date().toISOString());
  const window = resolveWindow(input.asset, requestedStart, requestedEnd);

  if (!window.usable) {
    return emptyResult(input, window.coverage);
  }

  const { effectiveStart, effectiveEnd } = window.coverage;
  const endDate = effectiveEnd;
  const startDate = effectiveStart;
  const priceHistory = generatePriceHistory(input.asset, startDate, endDate);

  // Calculate based on whether DCA is enabled
  let investmentResult;
  let dcaSummary: DCASummary | undefined;

  if (input.dcaAmount && input.dcaFrequency) {
    // DCA mode
    investmentResult = calculateDCA(
      input.asset,
      input.initialInvestment,
      input.dcaAmount,
      input.dcaFrequency,
      startDate,
      endDate
    );

    // Also calculate lump sum for comparison
    const lumpSum = calculateLumpSum(
      input.asset,
      investmentResult.totalInvested,
      startDate,
      endDate
    );

    const dcaReturn = ((investmentResult.finalValue - investmentResult.totalInvested) / investmentResult.totalInvested) * 100;

    dcaSummary = {
      totalInvestments: investmentResult.investments.length,
      averageCost: investmentResult.averageCost,
      costBasis: investmentResult.totalInvested,
      finalHoldings: investmentResult.holdings,
      dcaReturnPercentage: dcaReturn,
      lumpSumReturnPercentage: lumpSum.returnPercentage,
      dcaAdvantage: dcaReturn - lumpSum.returnPercentage,
    };
  } else {
    // Lump sum mode
    const lumpSum = calculateLumpSum(
      input.asset,
      input.initialInvestment,
      startDate,
      endDate
    );

    investmentResult = {
      totalInvested: input.initialInvestment,
      finalValue: lumpSum.finalValue,
      holdings: lumpSum.holdings,
      averageCost: input.initialInvestment / lumpSum.holdings,
      investments: [{
        date: startDate,
        invested: input.initialInvestment,
        value: input.initialInvestment,
        holdings: lumpSum.holdings,
        profit: 0,
        profitPercentage: 0,
      }, {
        date: endDate,
        invested: input.initialInvestment,
        value: lumpSum.finalValue,
        holdings: lumpSum.holdings,
        profit: lumpSum.finalValue - input.initialInvestment,
        profitPercentage: lumpSum.returnPercentage,
      }],
    };
  }

  const totalReturn = investmentResult.finalValue - investmentResult.totalInvested;
  const totalReturnPercentage = (totalReturn / investmentResult.totalInvested) * 100;
  const annualizedReturn = calculateAnnualizedReturn(totalReturnPercentage, startDate, endDate);
  const drawdownData = calculateMaxDrawdown(investmentResult.investments);

  return {
    asset: input.asset,
    startDate,
    endDate,
    initialInvestment: input.initialInvestment,
    totalInvested: investmentResult.totalInvested,
    finalValue: investmentResult.finalValue,
    totalReturn,
    totalReturnPercentage,
    annualizedReturn,
    maxDrawdown: drawdownData.maxDrawdown,
    maxDrawdownDate: drawdownData.maxDrawdownDate,
    allTimeHigh: drawdownData.allTimeHigh,
    allTimeHighDate: drawdownData.allTimeHighDate,
    priceHistory,
    investmentHistory: investmentResult.investments,
    dcaSummary,
    coverage: window.coverage,
  };
}

/**
 * Get supported assets for backtesting
 */
export function getSupportedAssets(): { id: string; name: string; symbol: string; earliestDate: string; latestDate: string }[] {
  const names: Record<string, { name: string; symbol: string }> = {
    bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
    ethereum: { name: 'Ethereum', symbol: 'ETH' },
    solana: { name: 'Solana', symbol: 'SOL' },
  };

  // Derived from the dataset so the advertised range can never drift from it.
  return Object.keys(names).map((id) => {
    const coverage = getAssetCoverage(id);
    return {
      id,
      name: names[id].name,
      symbol: names[id].symbol,
      earliestDate: coverage?.dataStart ?? '',
      latestDate: coverage?.dataEnd ?? '',
    };
  });
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  const formatted = Math.abs(value).toFixed(2);
  return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
}

/**
 * Get preset time periods.
 *
 * `available` is false when the window would start after the dataset ends, which
 * is what happens to the short presets as the bundled history ages.
 */
export function getPresetPeriods(
  asset = 'bitcoin'
): { label: string; months: number; available: boolean }[] {
  const dataEnd = getAssetCoverage(asset)?.dataEnd ?? '';

  return [
    { label: '1 Year', months: 12 },
    { label: '2 Years', months: 24 },
    { label: '3 Years', months: 36 },
    { label: '5 Years', months: 60 },
    { label: 'All Time', months: 0 },
  ].map((period) => ({
    ...period,
    available: dataEnd !== '' && getStartDateFromPeriod(period.months, asset) < dataEnd,
  }));
}

/**
 * Calculate start date from months ago, bounded by what the asset has data for.
 */
export function getStartDateFromPeriod(months: number, asset = 'bitcoin'): string {
  const coverage = getAssetCoverage(asset);
  if (!coverage) return toDay(new Date().toISOString());

  if (months === 0) {
    return coverage.dataStart;
  }

  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return clampDate(toDay(date.toISOString()), coverage.dataStart, coverage.dataEnd);
}
