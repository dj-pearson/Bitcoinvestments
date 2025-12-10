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

export interface BacktestResult {
  asset: string;
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
 * Get price for a specific date (interpolates if exact date not available)
 */
function getPriceForDate(asset: string, date: string): number {
  const prices = HISTORICAL_PRICES[asset.toLowerCase()];
  if (!prices) return 0;

  // Find closest date
  const dates = Object.keys(prices).sort();
  const targetDate = new Date(date).getTime();

  let closestDate = dates[0];
  let closestDiff = Math.abs(new Date(dates[0]).getTime() - targetDate);

  for (const d of dates) {
    const diff = Math.abs(new Date(d).getTime() - targetDate);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestDate = d;
    }
  }

  return prices[closestDate] || 0;
}

/**
 * Generate price history between two dates
 */
function generatePriceHistory(
  asset: string,
  startDate: string,
  endDate: string
): PricePoint[] {
  const prices = HISTORICAL_PRICES[asset.toLowerCase()];
  if (!prices) return [];

  const history: PricePoint[] = [];
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  // Get all dates in range
  const dates = Object.keys(prices).sort().filter(d => {
    const time = new Date(d).getTime();
    return time >= start && time <= end;
  });

  for (const date of dates) {
    history.push({
      date,
      price: prices[date],
    });
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
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate interval in days
  const intervalDays = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  }[frequency || 'monthly'];

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
  let currentDate = new Date(start);
  currentDate.setDate(currentDate.getDate() + intervalDays);

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

    currentDate.setDate(currentDate.getDate() + intervalDays);
  }

  const endPrice = getPriceForDate(asset, endDate);
  const finalValue = totalHoldings * endPrice;
  const averageCost = totalInvested / totalHoldings;

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
 * Run backtest simulation
 */
export function runBacktest(input: BacktestInput): BacktestResult {
  const endDate = input.endDate || new Date().toISOString().split('T')[0];
  const priceHistory = generatePriceHistory(input.asset, input.startDate, endDate);

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
      input.startDate,
      endDate
    );

    // Also calculate lump sum for comparison
    const lumpSum = calculateLumpSum(
      input.asset,
      investmentResult.totalInvested,
      input.startDate,
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
      input.startDate,
      endDate
    );

    investmentResult = {
      totalInvested: input.initialInvestment,
      finalValue: lumpSum.finalValue,
      holdings: lumpSum.holdings,
      averageCost: input.initialInvestment / lumpSum.holdings,
      investments: [{
        date: input.startDate,
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
  const annualizedReturn = calculateAnnualizedReturn(totalReturnPercentage, input.startDate, endDate);
  const drawdownData = calculateMaxDrawdown(investmentResult.investments);

  return {
    asset: input.asset,
    startDate: input.startDate,
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
  };
}

/**
 * Get supported assets for backtesting
 */
export function getSupportedAssets(): { id: string; name: string; symbol: string; earliestDate: string }[] {
  return [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', earliestDate: '2019-12-09' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', earliestDate: '2019-12-09' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', earliestDate: '2021-01-01' },
  ];
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
 * Get preset time periods
 */
export function getPresetPeriods(): { label: string; months: number }[] {
  return [
    { label: '1 Year', months: 12 },
    { label: '2 Years', months: 24 },
    { label: '3 Years', months: 36 },
    { label: '5 Years', months: 60 },
    { label: 'All Time', months: 0 },
  ];
}

/**
 * Calculate start date from months ago
 */
export function getStartDateFromPeriod(months: number): string {
  if (months === 0) {
    // All time - return earliest available
    return '2019-12-09';
  }

  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}
