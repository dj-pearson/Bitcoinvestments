import type {
  DCACalculatorInput,
  DCACalculatorResult,
  DCAInvestment,
} from '../../types';
import { getHistoricalDataRange } from '../coingecko';
import { toLocalISODate } from '../../lib/utils';

/**
 * Calculate DCA (Dollar-Cost Averaging) investment performance
 * Uses historical price data to simulate what would have happened
 * if you had invested a fixed amount at regular intervals
 */
export async function calculateDCA(
  input: DCACalculatorInput
): Promise<DCACalculatorResult> {
  const { cryptocurrency, investment_amount, frequency, start_date, end_date } = input;

  // Convert dates to timestamps
  const startTimestamp = Math.floor(new Date(start_date).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(end_date).getTime() / 1000);

  // Fetch historical data
  const historicalData = await getHistoricalDataRange(
    cryptocurrency,
    startTimestamp,
    endTimestamp
  );

  if (!historicalData.prices || historicalData.prices.length === 0) {
    throw new Error('No historical price data available for the selected period');
  }

  // Generate investment dates based on frequency
  const investmentDates = generateInvestmentDates(
    new Date(start_date),
    new Date(end_date),
    frequency
  );

  // Calculate DCA investments
  const investments: DCAInvestment[] = [];
  let totalCoins = 0;
  let totalInvested = 0;

  for (const date of investmentDates) {
    const price = getPriceAtDate(historicalData.prices, date);

    if (price === null) {
      continue; // Skip if no price data for this date
    }

    const coinsBought = investment_amount / price;
    totalCoins += coinsBought;
    totalInvested += investment_amount;

    investments.push({
      date: toLocalISODate(date),
      price,
      coins_bought: coinsBought,
      total_coins: totalCoins,
      total_invested: totalInvested,
      value_at_purchase: totalCoins * price,
    });
  }

  // Get current price (last price in data)
  const currentPrice = historicalData.prices[historicalData.prices.length - 1][1];
  const currentValue = totalCoins * currentPrice;
  const profitLoss = currentValue - totalInvested;
  const profitLossPercentage = totalInvested > 0
    ? (profitLoss / totalInvested) * 100
    : 0;
  const averageCost = totalCoins > 0 ? totalInvested / totalCoins : 0;

  return {
    total_invested: totalInvested,
    current_value: currentValue,
    total_coins: totalCoins,
    average_cost: averageCost,
    profit_loss: profitLoss,
    profit_loss_percentage: profitLossPercentage,
    investments,
  };
}

/**
 * Generate array of investment dates based on frequency
 */
function generateInvestmentDates(
  startDate: Date,
  endDate: Date,
  frequency: DCACalculatorInput['frequency']
): Date[] {
  const dates: Date[] = [];

  if (frequency === 'monthly') {
    // Monthly steps are anchored to the start date's day-of-month rather than
    // advanced with setMonth, which overflows instead of clamping. Starting on
    // 31 Jan 2023, setMonth(+1) asks for 31 Feb and JavaScript rolls that
    // forward to 3 Mar - so February was skipped entirely and every later
    // purchase drifted to the 3rd, permanently. Any start date after the 28th
    // lost a contribution and priced the rest on the wrong days.
    const anchorDay = startDate.getDate();

    for (let monthOffset = 0; ; monthOffset++) {
      // Land on the first of the target month before setting the day, so the
      // month arithmetic itself cannot overflow.
      const candidate = new Date(startDate);
      candidate.setDate(1);
      candidate.setMonth(startDate.getMonth() + monthOffset);

      // Clamp to the last day of a short month: 31 Jan is followed by 28 Feb.
      const daysInMonth = new Date(
        candidate.getFullYear(),
        candidate.getMonth() + 1,
        0
      ).getDate();
      candidate.setDate(Math.min(anchorDay, daysInMonth));

      if (candidate > endDate) break;
      dates.push(candidate);
    }

    return dates;
  }

  const stepDays = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 14;
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + stepDays);
  }

  return dates;
}

/**
 * Find the closest price to a given date from historical data
 */
function getPriceAtDate(
  prices: [number, number][],
  targetDate: Date
): number | null {
  const targetTimestamp = targetDate.getTime();

  // Find the closest price point
  let closestPrice: number | null = null;
  let closestDiff = Infinity;

  for (const [timestamp, price] of prices) {
    const diff = Math.abs(timestamp - targetTimestamp);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestPrice = price;
    }
  }

  // Only return if within 24 hours
  if (closestDiff <= 24 * 60 * 60 * 1000) {
    return closestPrice;
  }

  return null;
}

/**
 * Calculate DCA with hypothetical future projections
 */
export function projectFutureDCA(
  investmentAmount: number,
  frequency: DCACalculatorInput['frequency'],
  durationMonths: number,
  expectedAnnualReturn: number // as decimal, e.g., 0.20 for 20%
): {
  totalInvested: number;
  projectedValue: number;
  totalContributions: number;
} {
  // Contributions per month, as the exact average rather than a rounded-down
  // whole number. Using 4 for weekly and 30 for daily counted 48 and 360
  // contributions a year instead of 52 and 365, understating both the amount
  // invested and the projected value by roughly 8% for weekly and biweekly.
  let contributionsPerMonth: number;
  switch (frequency) {
    case 'daily':
      contributionsPerMonth = 365 / 12;
      break;
    case 'weekly':
      contributionsPerMonth = 52 / 12;
      break;
    case 'biweekly':
      contributionsPerMonth = 26 / 12;
      break;
    case 'monthly':
      contributionsPerMonth = 1;
      break;
  }

  // A contribution count is a whole number even though the monthly average is not.
  const totalContributions = Math.round(contributionsPerMonth * durationMonths);
  const totalInvested = investmentAmount * totalContributions;

  // Calculate projected value with compound growth
  // Using monthly compounding for simplicity
  const monthlyReturn = expectedAnnualReturn / 12;
  let projectedValue = 0;

  for (let month = 0; month < durationMonths; month++) {
    // Add contributions for this month
    const monthlyContribution = investmentAmount * contributionsPerMonth;
    projectedValue += monthlyContribution;

    // Apply growth
    projectedValue *= 1 + monthlyReturn;
  }

  return {
    totalInvested,
    projectedValue,
    totalContributions,
  };
}

/**
 * Compare lump sum vs DCA investment
 */
export async function compareLumpSumVsDCA(
  cryptocurrency: string,
  totalAmount: number,
  startDate: string,
  endDate: string,
  dcaFrequency: DCACalculatorInput['frequency']
): Promise<{
  lumpSum: {
    invested: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
  };
  dca: {
    invested: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    averageCost: number;
  };
  winner: 'lumpSum' | 'dca';
}> {
  // Calculate DCA result
  const investmentDates = generateInvestmentDates(
    new Date(startDate),
    new Date(endDate),
    dcaFrequency
  );
  const dcaAmount = totalAmount / investmentDates.length;

  const dcaResult = await calculateDCA({
    cryptocurrency,
    investment_amount: dcaAmount,
    frequency: dcaFrequency,
    start_date: startDate,
    end_date: endDate,
  });

  // Calculate lump sum result
  const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

  const historicalData = await getHistoricalDataRange(
    cryptocurrency,
    startTimestamp,
    endTimestamp
  );

  const startPrice = historicalData.prices[0][1];
  const endPrice = historicalData.prices[historicalData.prices.length - 1][1];
  const coinsIfLumpSum = totalAmount / startPrice;
  const lumpSumValue = coinsIfLumpSum * endPrice;
  const lumpSumProfitLoss = lumpSumValue - totalAmount;
  const lumpSumProfitLossPercentage = (lumpSumProfitLoss / totalAmount) * 100;

  return {
    lumpSum: {
      invested: totalAmount,
      currentValue: lumpSumValue,
      profitLoss: lumpSumProfitLoss,
      profitLossPercentage: lumpSumProfitLossPercentage,
    },
    dca: {
      invested: dcaResult.total_invested,
      currentValue: dcaResult.current_value,
      profitLoss: dcaResult.profit_loss,
      profitLossPercentage: dcaResult.profit_loss_percentage,
      averageCost: dcaResult.average_cost,
    },
    winner: lumpSumProfitLossPercentage > dcaResult.profit_loss_percentage
      ? 'lumpSum'
      : 'dca',
  };
}
