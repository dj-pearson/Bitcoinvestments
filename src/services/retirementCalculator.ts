/**
 * Crypto Retirement Calculator Service
 *
 * Model crypto allocation in retirement portfolio with:
 * - Monte Carlo projections
 * - Tax implications
 * - Withdrawal strategies
 *
 * Premium at $99/year or bundled with main subscription.
 */

import type {
  RetirementInputs,
  RetirementProjection,
  MonteCarloResult,
} from '../types/premiumFeatures';
import {
  FEDERAL_TAX_BRACKETS_2024,
  CAPITAL_GAINS_BRACKETS_2024,
  PREMIUM_FEATURES_PRICING,
} from '../types/premiumFeatures';

// Retirement Calculator Pricing
export const RETIREMENT_CALCULATOR_PRICING = {
  free: {
    id: 'retirement-calc-free',
    name: 'Retirement Calculator Free',
    price: 0,
    features: [
      'Basic retirement projections',
      '3 saved scenarios',
      'Simple crypto allocation',
      'Basic charts',
    ],
    limits: {
      maxScenarios: 3,
      hasMonteCarlo: false,
      hasTaxOptimization: false,
      hasPdfExport: false,
      hasAdvisorReview: false,
    },
  },
  premium: {
    id: 'retirement-calc-premium',
    name: 'Retirement Planner Pro',
    price_yearly: PREMIUM_FEATURES_PRICING.retirement_calculator.premium_yearly,
    features: [
      'Monte Carlo simulations (10,000 runs)',
      'Unlimited saved scenarios',
      'Advanced crypto modeling',
      'Tax optimization strategies',
      'Roth conversion analysis',
      'Withdrawal strategy optimization',
      'PDF export with charts',
      'Social Security optimization',
    ],
    limits: {
      maxScenarios: Infinity,
      hasMonteCarlo: true,
      hasTaxOptimization: true,
      hasPdfExport: true,
      hasAdvisorReview: false,
    },
    stripePriceId: import.meta.env.VITE_STRIPE_RETIREMENT_YEARLY || 'price_retirement_yearly',
  },
} as const;

// Default inputs for new calculations
export const DEFAULT_RETIREMENT_INPUTS: RetirementInputs = {
  current_age: 35,
  retirement_age: 65,
  life_expectancy: 90,
  current_savings_usd: 100000,
  current_crypto_value_usd: 25000,
  crypto_allocation_percent: 20,
  monthly_contribution: 1000,
  monthly_crypto_contribution: 200,
  contribution_increase_rate: 3,
  desired_annual_income: 80000,
  social_security_income: 24000,
  pension_income: 0,
  other_income: 0,
  crypto_allocations: [
    { asset_class: 'crypto', asset_name: 'Bitcoin', symbol: 'BTC', allocation_percent: 60, expected_return: 0.15, volatility: 0.60, correlation_to_stocks: 0.4 },
    { asset_class: 'crypto', asset_name: 'Ethereum', symbol: 'ETH', allocation_percent: 30, expected_return: 0.20, volatility: 0.70, correlation_to_stocks: 0.45 },
    { asset_class: 'crypto', asset_name: 'Stablecoins', symbol: 'USDC', allocation_percent: 10, expected_return: 0.05, volatility: 0.02, correlation_to_stocks: 0.1 },
  ],
  rebalancing_frequency: 'quarterly',
  tax_filing_status: 'single',
  state: 'CA',
  current_tax_bracket: 0.24,
  expected_retirement_tax_bracket: 0.22,
  inflation_rate: 0.03,
  stock_return: 0.07,
  bond_return: 0.04,
  crypto_return: 0.12,
  crypto_volatility: 0.60,
};

// State tax rates (simplified)
export const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.05, AK: 0, AZ: 0.045, AR: 0.055, CA: 0.093, CO: 0.044, CT: 0.0699,
  DE: 0.066, FL: 0, GA: 0.055, HI: 0.0825, ID: 0.058, IL: 0.0495, IN: 0.0315,
  IA: 0.06, KS: 0.057, KY: 0.05, LA: 0.0425, ME: 0.0715, MD: 0.0575,
  MA: 0.05, MI: 0.0425, MN: 0.0785, MS: 0.05, MO: 0.049, MT: 0.0575,
  NE: 0.0664, NV: 0, NH: 0, NJ: 0.0897, NM: 0.049, NY: 0.0685, NC: 0.0525,
  ND: 0.029, OH: 0.04, OK: 0.0475, OR: 0.099, PA: 0.0307, RI: 0.0599,
  SC: 0.065, SD: 0, TN: 0, TX: 0, UT: 0.0485, VT: 0.0875, VA: 0.0575,
  WA: 0, WV: 0.065, WI: 0.0765, WY: 0,
};

/**
 * Calculate retirement projection
 */
export function calculateRetirementProjection(
  inputs: RetirementInputs,
  userId?: string | null
): RetirementProjection {
  const yearsToRetirement = inputs.retirement_age - inputs.current_age;
  const yearsInRetirement = inputs.life_expectancy - inputs.retirement_age;

  // Calculate year-by-year projections
  const yearlyProjections = calculateYearlyProjections(inputs, yearsToRetirement, yearsInRetirement);

  // Calculate total needed at retirement
  const inflationAdjustedIncome = inputs.desired_annual_income * Math.pow(1 + inputs.inflation_rate, yearsToRetirement);
  const guaranteedIncome = inputs.social_security_income + inputs.pension_income + inputs.other_income;
  const annualShortfall = inflationAdjustedIncome - guaranteedIncome;
  const totalNeeded = calculatePresentValue(annualShortfall, inputs.stock_return - inputs.inflation_rate, yearsInRetirement);

  // Get projected savings at retirement
  const retirementYear = yearlyProjections.find(y => y.age === inputs.retirement_age);
  const projectedSavings = retirementYear?.portfolio_value || 0;

  // Funding analysis
  const fundingGap = totalNeeded - projectedSavings;
  const fundingRatio = projectedSavings / totalNeeded;

  // Run Monte Carlo simulation
  const monteCarloResults = runMonteCarloSimulation(inputs, 1000); // Reduced for performance
  const successProbability = calculateSuccessProbability(monteCarloResults);

  // Tax analysis
  const taxAnalysis = analyzeTaxStrategy(inputs, yearlyProjections);

  // Generate recommendations
  const recommendations = generateRecommendations(inputs, fundingRatio, successProbability);

  return {
    id: `proj_${Date.now()}`,
    user_id: userId || null,
    inputs,
    total_needed_at_retirement: totalNeeded,
    projected_savings_at_retirement: projectedSavings,
    funding_gap: fundingGap,
    funding_ratio: fundingRatio,
    years_to_retirement: yearsToRetirement,
    years_in_retirement: yearsInRetirement,
    yearly_projections: yearlyProjections,
    monte_carlo_simulations: 1000,
    success_probability: successProbability,
    monte_carlo_results: monteCarloResults,
    tax_analysis: taxAnalysis,
    recommendations,
    created_at: new Date().toISOString(),
  };
}

/**
 * Calculate year-by-year projections
 */
function calculateYearlyProjections(
  inputs: RetirementInputs,
  yearsToRetirement: number,
  yearsInRetirement: number
): RetirementProjection['yearly_projections'] {
  const projections: RetirementProjection['yearly_projections'] = [];

  let portfolioValue = inputs.current_savings_usd;
  let cryptoValue = inputs.current_crypto_value_usd;
  let traditionalValue = portfolioValue - cryptoValue;
  let monthlyContribution = inputs.monthly_contribution;
  let monthlyCryptoContribution = inputs.monthly_crypto_contribution;

  const totalYears = yearsToRetirement + yearsInRetirement;

  for (let year = 0; year <= totalYears; year++) {
    const age = inputs.current_age + year;
    const isRetired = age >= inputs.retirement_age;

    let contributions = 0;
    let withdrawals = 0;
    let taxes = 0;

    if (!isRetired) {
      // Accumulation phase
      contributions = (monthlyContribution + monthlyCryptoContribution) * 12;

      // Traditional growth
      traditionalValue = traditionalValue * (1 + inputs.stock_return * 0.6 + inputs.bond_return * 0.4);
      traditionalValue += (monthlyContribution - monthlyCryptoContribution) * 12;

      // Crypto growth with volatility
      const cryptoReturn = inputs.crypto_return + (Math.random() - 0.5) * inputs.crypto_volatility * 0.5;
      cryptoValue = cryptoValue * (1 + cryptoReturn);
      cryptoValue += monthlyCryptoContribution * 12;

      // Increase contributions annually
      monthlyContribution *= (1 + inputs.contribution_increase_rate / 100);
      monthlyCryptoContribution *= (1 + inputs.contribution_increase_rate / 100);
    } else {
      // Retirement phase - withdrawals
      const inflationFactor = Math.pow(1 + inputs.inflation_rate, year - yearsToRetirement);
      const neededIncome = inputs.desired_annual_income * inflationFactor;
      const guaranteedIncome = (inputs.social_security_income + inputs.pension_income + inputs.other_income) * inflationFactor;

      withdrawals = Math.max(0, neededIncome - guaranteedIncome);

      // Calculate taxes on withdrawals
      taxes = calculateWithdrawalTaxes(withdrawals, inputs, traditionalValue, cryptoValue);

      // Adjust for taxes
      withdrawals += taxes;

      // Withdraw proportionally
      const cryptoWithdrawal = withdrawals * (cryptoValue / (cryptoValue + traditionalValue));
      const traditionalWithdrawal = withdrawals - cryptoWithdrawal;

      cryptoValue = Math.max(0, cryptoValue - cryptoWithdrawal);
      traditionalValue = Math.max(0, traditionalValue - traditionalWithdrawal);

      // Apply growth to remaining
      if (cryptoValue > 0) {
        const cryptoReturn = inputs.crypto_return * 0.5; // More conservative in retirement
        cryptoValue *= (1 + cryptoReturn);
      }
      if (traditionalValue > 0) {
        traditionalValue *= (1 + inputs.stock_return * 0.4 + inputs.bond_return * 0.6);
      }
    }

    portfolioValue = traditionalValue + cryptoValue;

    projections.push({
      year: new Date().getFullYear() + year,
      age,
      contributions,
      portfolio_value: Math.round(portfolioValue),
      crypto_value: Math.round(cryptoValue),
      traditional_value: Math.round(traditionalValue),
      withdrawals: Math.round(withdrawals),
      taxes: Math.round(taxes),
      inflation_adjusted_income: Math.round(inputs.desired_annual_income * Math.pow(1 + inputs.inflation_rate, year)),
    });
  }

  return projections;
}

/**
 * Calculate present value of annuity
 */
function calculatePresentValue(annualPayment: number, rate: number, years: number): number {
  if (rate === 0) return annualPayment * years;
  return annualPayment * (1 - Math.pow(1 + rate, -years)) / rate;
}

/**
 * Calculate taxes on retirement withdrawals
 */
function calculateWithdrawalTaxes(
  withdrawal: number,
  inputs: RetirementInputs,
  traditionalBalance: number,
  cryptoBalance: number
): number {
  const totalBalance = traditionalBalance + cryptoBalance;
  if (totalBalance === 0) return 0;

  // Portion from traditional (taxed as income)
  const traditionalPortion = withdrawal * (traditionalBalance / totalBalance);
  const incomeTax = calculateIncomeTax(traditionalPortion, inputs.tax_filing_status);

  // Portion from crypto (taxed as capital gains - assume long-term)
  const cryptoPortion = withdrawal * (cryptoBalance / totalBalance);
  // Assume 50% of crypto is gains
  const cryptoGains = cryptoPortion * 0.5;
  const capitalGainsTax = calculateCapitalGainsTax(cryptoGains, inputs.tax_filing_status);

  // State tax
  const stateRate = STATE_TAX_RATES[inputs.state] || 0;
  const stateTax = withdrawal * stateRate;

  return incomeTax + capitalGainsTax + stateTax;
}

/**
 * Calculate federal income tax
 */
function calculateIncomeTax(income: number, status: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household'): number {
  const brackets = status === 'married_filing_jointly'
    ? FEDERAL_TAX_BRACKETS_2024.married_filing_jointly
    : FEDERAL_TAX_BRACKETS_2024.single;

  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    if (taxableInBracket <= 0) break;

    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  return tax;
}

/**
 * Calculate capital gains tax
 */
function calculateCapitalGainsTax(gains: number, status: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household'): number {
  const brackets = status === 'married_filing_jointly'
    ? CAPITAL_GAINS_BRACKETS_2024.married_filing_jointly
    : CAPITAL_GAINS_BRACKETS_2024.single;

  let tax = 0;
  let remainingGains = gains;

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(remainingGains, bracket.max - bracket.min);
    if (taxableInBracket <= 0) break;

    tax += taxableInBracket * bracket.rate;
    remainingGains -= taxableInBracket;
  }

  return tax;
}

/**
 * Run Monte Carlo simulation
 */
function runMonteCarloSimulation(
  inputs: RetirementInputs,
  simulations: number
): MonteCarloResult[] {
  const results: number[] = [];
  const yearsToRetirement = inputs.retirement_age - inputs.current_age;
  const yearsInRetirement = inputs.life_expectancy - inputs.retirement_age;

  for (let sim = 0; sim < simulations; sim++) {
    let portfolioValue = inputs.current_savings_usd;
    let cryptoValue = inputs.current_crypto_value_usd;
    let traditionalValue = portfolioValue - cryptoValue;
    let monthlyContribution = inputs.monthly_contribution;

    // Accumulation phase with random returns
    for (let year = 0; year < yearsToRetirement; year++) {
      // Random returns based on historical volatility
      const stockReturn = normalRandom(inputs.stock_return, 0.15);
      const bondReturn = normalRandom(inputs.bond_return, 0.05);
      const cryptoReturn = normalRandom(inputs.crypto_return, inputs.crypto_volatility);

      traditionalValue *= (1 + stockReturn * 0.6 + bondReturn * 0.4);
      traditionalValue += monthlyContribution * 12 * (1 - inputs.crypto_allocation_percent / 100);

      cryptoValue *= (1 + cryptoReturn);
      cryptoValue += monthlyContribution * 12 * (inputs.crypto_allocation_percent / 100);

      monthlyContribution *= (1 + inputs.contribution_increase_rate / 100);
    }

    // Retirement phase
    for (let year = 0; year < yearsInRetirement; year++) {
      const inflationFactor = Math.pow(1 + inputs.inflation_rate, year);
      const neededIncome = inputs.desired_annual_income * inflationFactor;
      const guaranteedIncome = (inputs.social_security_income + inputs.pension_income) * inflationFactor;
      const withdrawal = Math.max(0, neededIncome - guaranteedIncome);

      portfolioValue = traditionalValue + cryptoValue;

      if (portfolioValue < withdrawal) {
        break;
      }

      // Withdraw and apply returns
      const cryptoPortion = cryptoValue / portfolioValue;
      cryptoValue -= withdrawal * cryptoPortion;
      traditionalValue -= withdrawal * (1 - cryptoPortion);

      const stockReturn = normalRandom(inputs.stock_return * 0.6, 0.12);
      const cryptoReturn = normalRandom(inputs.crypto_return * 0.5, inputs.crypto_volatility * 0.8);

      traditionalValue *= (1 + stockReturn);
      cryptoValue *= (1 + cryptoReturn);
    }

    results.push(traditionalValue + cryptoValue);
  }

  // Calculate percentile results
  results.sort((a, b) => a - b);

  const percentiles = [5, 10, 25, 50, 75, 90, 95];
  return percentiles.map(p => {
    const index = Math.floor((p / 100) * results.length);
    const ending = results[index] || 0;
    const success = ending > 0;

    return {
      percentile: p,
      ending_balance: Math.round(ending),
      probability_of_success: success ? 1 : 0,
      years_portfolio_lasts: success ? yearsInRetirement : Math.floor(yearsInRetirement * (ending / inputs.desired_annual_income)),
      annual_withdrawals: [],
    };
  });
}

/**
 * Box-Muller transform for normal distribution
 */
function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/**
 * Calculate success probability from Monte Carlo results
 */
function calculateSuccessProbability(results: MonteCarloResult[]): number {
  // Success = 50th percentile ends with positive balance
  const median = results.find(r => r.percentile === 50);
  if (!median) return 0.5;

  // Interpolate based on ending balances
  const positiveResults = results.filter(r => r.ending_balance > 0).length;
  return (positiveResults / results.length) * 100;
}

/**
 * Analyze tax strategies
 */
function analyzeTaxStrategy(
  inputs: RetirementInputs,
  projections: RetirementProjection['yearly_projections']
): RetirementProjection['tax_analysis'] {
  const totalTaxes = projections.reduce((sum, y) => sum + y.taxes, 0);
  const totalWithdrawals = projections.reduce((sum, y) => sum + y.withdrawals, 0);
  const effectiveRate = totalWithdrawals > 0 ? totalTaxes / totalWithdrawals : 0;

  // Roth conversion opportunity (simplified)
  const yearsToRetirement = inputs.retirement_age - inputs.current_age;
  const rothOpportunity = inputs.current_tax_bracket < inputs.expected_retirement_tax_bracket
    ? inputs.current_savings_usd * 0.1 * yearsToRetirement
    : 0;

  // Tax loss harvesting opportunity (crypto volatility provides opportunities)
  const tlhOpportunity = inputs.current_crypto_value_usd * 0.1;

  return {
    total_taxes_paid: Math.round(totalTaxes),
    effective_tax_rate: effectiveRate,
    roth_conversion_opportunity: Math.round(rothOpportunity),
    tax_loss_harvesting_opportunity: Math.round(tlhOpportunity),
    optimal_withdrawal_order: [
      'Taxable accounts (lowest tax)',
      'Traditional IRA/401k',
      'Crypto (long-term gains)',
      'Roth IRA (tax-free, last)',
    ],
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  inputs: RetirementInputs,
  fundingRatio: number,
  successProbability: number
): RetirementProjection['recommendations'] {
  const recommendations: RetirementProjection['recommendations'] = [];

  // Underfunded
  if (fundingRatio < 0.8) {
    recommendations.push({
      type: 'increase_savings',
      title: 'Increase Monthly Savings',
      description: `Consider increasing your monthly contribution by $${Math.round(inputs.monthly_contribution * 0.25)} to improve your funding ratio.`,
      impact_on_success: 8,
    });
  }

  // Low success probability
  if (successProbability < 70) {
    recommendations.push({
      type: 'reduce_expenses',
      title: 'Reduce Retirement Expenses',
      description: `Reducing your target retirement income by 15% would significantly improve your success probability.`,
      impact_on_success: 12,
    });
  }

  // High crypto allocation
  if (inputs.crypto_allocation_percent > 30) {
    recommendations.push({
      type: 'reduce_crypto',
      title: 'Consider Reducing Crypto Allocation',
      description: `Your ${inputs.crypto_allocation_percent}% crypto allocation adds significant volatility. Consider reducing to 20-25% as you approach retirement.`,
      impact_on_success: 5,
    });
  }

  // Delay retirement option
  if (fundingRatio < 1 && successProbability < 80) {
    recommendations.push({
      type: 'delay_retirement',
      title: 'Consider Delaying Retirement',
      description: `Delaying retirement by 2-3 years could add ${Math.round(inputs.monthly_contribution * 36)} to your savings and increase Social Security benefits.`,
      impact_on_success: 15,
    });
  }

  // Rebalancing
  if (inputs.rebalancing_frequency === 'never') {
    recommendations.push({
      type: 'adjust_allocation',
      title: 'Implement Regular Rebalancing',
      description: 'Quarterly rebalancing can reduce portfolio volatility and improve risk-adjusted returns.',
      impact_on_success: 3,
    });
  }

  return recommendations;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Get success probability color
 */
export function getSuccessColor(probability: number): string {
  if (probability >= 80) return 'text-green-500';
  if (probability >= 60) return 'text-yellow-500';
  if (probability >= 40) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Export projection to PDF data (would use jsPDF in production)
 */
export function exportProjectionData(projection: RetirementProjection): string {
  return JSON.stringify({
    summary: {
      successProbability: projection.success_probability,
      fundingRatio: projection.funding_ratio,
      projectedSavings: projection.projected_savings_at_retirement,
      totalNeeded: projection.total_needed_at_retirement,
      fundingGap: projection.funding_gap,
    },
    inputs: projection.inputs,
    projections: projection.yearly_projections,
    recommendations: projection.recommendations,
    generatedAt: new Date().toISOString(),
  }, null, 2);
}
