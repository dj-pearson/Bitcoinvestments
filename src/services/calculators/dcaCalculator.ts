import type {
  DCACalculatorInput,
  DCACalculatorResult,
  DCAInvestment,
} from '../../types';
import { getHistoricalDataRange } from '../coingecko';

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
      date: date.toISOString().split('T')[0],
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
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));

    switch (frequency) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'biweekly':
        current.setDate(current.getDate() + 14);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
    }
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
  // Calculate number of contributions
  let contributionsPerMonth: number;
  switch (frequency) {
    case 'daily':
      contributionsPerMonth = 30;
      break;
    case 'weekly':
      contributionsPerMonth = 4;
      break;
    case 'biweekly':
      contributionsPerMonth = 2;
      break;
    case 'monthly':
      contributionsPerMonth = 1;
      break;
  }

  const totalContributions = contributionsPerMonth * durationMonths;
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
