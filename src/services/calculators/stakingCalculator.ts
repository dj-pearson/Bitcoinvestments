import type {
  StakingCalculatorInput,
  StakingCalculatorResult,
  StakingMonthlyReward,
} from '../../types';

/**
 * Calculate staking rewards over a period of time
 */
export function calculateStakingRewards(
  input: StakingCalculatorInput
): StakingCalculatorResult {
  const { amount, apy, duration_months, compound_frequency } = input;

  // Convert APY to periodic rate based on compounding frequency
  const periodsPerYear = getPeriodsPerYear(compound_frequency);
  const periodicRate = apy / 100 / periodsPerYear;

  let currentBalance = amount;
  const monthlyRewards: StakingMonthlyReward[] = [];

  // Calculate month by month
  for (let month = 1; month <= duration_months; month++) {
    const startingBalance = currentBalance;
    let rewardsThisMonth = 0;

    if (compound_frequency === 'none') {
      // Simple interest - rewards don't compound
      rewardsThisMonth = (amount * (apy / 100)) / 12;
      currentBalance = amount + (rewardsThisMonth * month);
    } else {
      // Compound interest
      const periodsThisMonth = periodsPerYear / 12;

      for (let period = 0; period < periodsThisMonth; period++) {
        const periodReward = currentBalance * periodicRate;
        rewardsThisMonth += periodReward;
        currentBalance += periodReward;
      }
    }

    monthlyRewards.push({
      month,
      starting_balance: startingBalance,
      rewards_earned: rewardsThisMonth,
      ending_balance: currentBalance,
    });
  }

  const totalRewards = currentBalance - amount;
  const effectiveApy = compound_frequency === 'none'
    ? apy
    : calculateEffectiveAPY(apy, periodsPerYear);

  return {
    initial_amount: amount,
    final_amount: currentBalance,
    total_rewards: totalRewards,
    effective_apy: effectiveApy,
    monthly_rewards: monthlyRewards,
  };
}

/**
 * Get the number of compounding periods per year
 */
function getPeriodsPerYear(frequency: StakingCalculatorInput['compound_frequency']): number {
  switch (frequency) {
    case 'daily':
      return 365;
    case 'weekly':
      return 52;
    case 'monthly':
      return 12;
    case 'none':
      return 1;
  }
}

/**
 * Calculate effective APY when compounding
 * Formula: (1 + r/n)^n - 1
 */
function calculateEffectiveAPY(apy: number, periodsPerYear: number): number {
  const rate = apy / 100;
  const effectiveRate = Math.pow(1 + rate / periodsPerYear, periodsPerYear) - 1;
  return effectiveRate * 100;
}

/**
 * Compare staking rewards across different compounding frequencies
 */
export function compareCompoundingStrategies(
  amount: number,
  apy: number,
  duration_months: number
): {
  daily: StakingCalculatorResult;
  weekly: StakingCalculatorResult;
  monthly: StakingCalculatorResult;
  none: StakingCalculatorResult;
  bestStrategy: 'daily' | 'weekly' | 'monthly' | 'none';
  maxDifference: number;
} {
  const daily = calculateStakingRewards({
    cryptocurrency: 'generic',
    amount,
    apy,
    duration_months,
    compound_frequency: 'daily',
  });

  const weekly = calculateStakingRewards({
    cryptocurrency: 'generic',
    amount,
    apy,
    duration_months,
    compound_frequency: 'weekly',
  });

  const monthly = calculateStakingRewards({
    cryptocurrency: 'generic',
    amount,
    apy,
    duration_months,
    compound_frequency: 'monthly',
  });

  const none = calculateStakingRewards({
    cryptocurrency: 'generic',
    amount,
    apy,
    duration_months,
    compound_frequency: 'none',
  });

  const results = { daily, weekly, monthly, none };
  const finalAmounts = {
    daily: daily.final_amount,
    weekly: weekly.final_amount,
    monthly: monthly.final_amount,
    none: none.final_amount,
  };

  const bestStrategy = (Object.keys(finalAmounts) as Array<keyof typeof finalAmounts>)
    .reduce((a, b) => finalAmounts[a] > finalAmounts[b] ? a : b);

  const maxDifference = Math.max(...Object.values(finalAmounts)) -
    Math.min(...Object.values(finalAmounts));

  return {
    ...results,
    bestStrategy,
    maxDifference,
  };
}

/**
 * Calculate how long it takes to double your stake
 */
export function calculateDoubleTime(apy: number): {
  simple_years: number;
  compound_years: number;
  compound_months: number;
} {
  // Rule of 72 for simple interest approximation
  const simple_years = 72 / apy;

  // Compound interest: ln(2) / ln(1 + r)
  const rate = apy / 100;
  const compound_years = Math.log(2) / Math.log(1 + rate);
  const compound_months = compound_years * 12;

  return {
    simple_years,
    compound_years,
    compound_months,
  };
}

/**
 * Calculate rewards needed to reach a target amount
 */
export function calculateToReachTarget(
  initialAmount: number,
  targetAmount: number,
  apy: number,
  compound_frequency: StakingCalculatorInput['compound_frequency']
): {
  months_required: number;
  years_required: number;
  total_rewards: number;
} {
  const periodsPerYear = getPeriodsPerYear(compound_frequency);
  const periodicRate = apy / 100 / periodsPerYear;

  let currentAmount = initialAmount;
  let periods = 0;

  while (currentAmount < targetAmount && periods < 1200) { // Max 100 years
    if (compound_frequency === 'none') {
      currentAmount += initialAmount * (apy / 100 / periodsPerYear);
    } else {
      currentAmount *= 1 + periodicRate;
    }
    periods++;
  }

  const years = periods / periodsPerYear;
  const months = years * 12;

  return {
    months_required: Math.ceil(months),
    years_required: parseFloat(years.toFixed(2)),
    total_rewards: currentAmount - initialAmount,
  };
}

/**
 * Get popular staking rates for common cryptocurrencies
 * Note: These are approximate and should be updated regularly
 */
export function getPopularStakingRates(): {
  symbol: string;
  name: string;
  apy_range: { min: number; max: number };
  lock_period: string;
}[] {
  return [
    { symbol: 'ETH', name: 'Ethereum', apy_range: { min: 3.5, max: 5.5 }, lock_period: 'Variable' },
    { symbol: 'SOL', name: 'Solana', apy_range: { min: 5.0, max: 7.5 }, lock_period: '2-3 days unstake' },
    { symbol: 'ADA', name: 'Cardano', apy_range: { min: 3.0, max: 5.0 }, lock_period: 'None' },
    { symbol: 'ATOM', name: 'Cosmos', apy_range: { min: 15, max: 20 }, lock_period: '21 days unstake' },
    { symbol: 'DOT', name: 'Polkadot', apy_range: { min: 10, max: 15 }, lock_period: '28 days unstake' },
    { symbol: 'AVAX', name: 'Avalanche', apy_range: { min: 7, max: 10 }, lock_period: '14 days unstake' },
    { symbol: 'MATIC', name: 'Polygon', apy_range: { min: 4, max: 6 }, lock_period: 'Variable' },
    { symbol: 'NEAR', name: 'NEAR Protocol', apy_range: { min: 8, max: 12 }, lock_period: '36-48 hours unstake' },
  ];
}

/**
 * Calculate validator rewards vs delegator rewards
 */
export function calculateValidatorVsDelegator(
  amount: number,
  baseApy: number,
  validatorCommission: number, // percentage, e.g., 10 for 10%
  duration_months: number
): {
  validatorRewards: number;
  delegatorRewards: number;
  commissionPaid: number;
} {
  // Validator gets full APY
  const validatorResult = calculateStakingRewards({
    cryptocurrency: 'generic',
    amount,
    apy: baseApy,
    duration_months,
    compound_frequency: 'daily',
  });

  // Delegator gets APY minus commission
  const effectiveDelegatorApy = baseApy * (1 - validatorCommission / 100);
  const delegatorResult = calculateStakingRewards({
    cryptocurrency: 'generic',
    amount,
    apy: effectiveDelegatorApy,
    duration_months,
    compound_frequency: 'daily',
  });

  return {
    validatorRewards: validatorResult.total_rewards,
    delegatorRewards: delegatorResult.total_rewards,
    commissionPaid: validatorResult.total_rewards - delegatorResult.total_rewards,
  };
}
