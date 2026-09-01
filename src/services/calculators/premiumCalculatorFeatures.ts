/**
 * Premium Calculator Features
 *
 * Advanced calculator features for premium subscribers:
 * - Advanced projections with Monte Carlo simulations
 * - Multi-asset comparison tools
 * - Tax optimization strategies
 * - Risk analysis and scenario planning
 * - Historical backtesting with advanced metrics
 *
 * Free users have access to basic calculator features only.
 */

import {
  canUseCalculatorFeature,
  type CalculatorFeature,
} from '../subscriptionLimits';
import type { DCACalculatorResult, SubscriptionStatus } from '../../types';

// ==================== Types ====================

export interface PremiumCalculatorError {
  type: 'feature_locked';
  feature: CalculatorFeature;
  message: string;
  upgradeRequired: boolean;
}

export interface MonteCarloResult {
  simulations: number;
  percentiles: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  probabilityOfProfit: number;
  scenarios: ScenarioResult[];
}

export interface ScenarioResult {
  name: string;
  probability: number;
  projectedValue: number;
  returnPercentage: number;
}

export interface MultiAssetComparison {
  assets: string[];
  dateRange: { start: Date; end: Date };
  results: AssetComparisonResult[];
  correlationMatrix: number[][];
  recommendations: string[];
}

export interface AssetComparisonResult {
  symbol: string;
  name: string;
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestMonth: number;
  worstMonth: number;
}

export interface TaxOptimizationResult {
  currentTaxLiability: number;
  optimizedTaxLiability: number;
  savings: number;
  strategies: TaxStrategy[];
  harvestingOpportunities: HarvestingOpportunity[];
}

export interface TaxStrategy {
  name: string;
  description: string;
  potentialSavings: number;
  implementation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface HarvestingOpportunity {
  asset: string;
  symbol: string;
  unrealizedLoss: number;
  taxBenefit: number;
  action: string;
}

export interface RiskAnalysisResult {
  portfolioValue: number;
  valueAtRisk: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  stressTests: StressTestResult[];
  riskScore: number; // 0-100
  riskCategory: 'conservative' | 'moderate' | 'aggressive';
  recommendations: string[];
}

export interface StressTestResult {
  scenario: string;
  description: string;
  portfolioImpact: number;
  impactPercentage: number;
}

export interface AdvancedBacktestResult extends DCACalculatorResult {
  advancedMetrics: {
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    maxDrawdown: number;
    maxDrawdownDuration: number; // days
    winRate: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    recoveryFactor: number;
  };
  drawdownPeriods: DrawdownPeriod[];
  monthlyReturns: { month: string; return: number }[];
  rollingReturns: { period: string; return: number }[];
}

export interface DrawdownPeriod {
  startDate: string;
  endDate: string;
  depth: number;
  duration: number;
  recoveryDays: number;
}

// ==================== Feature Access Checks ====================

/**
 * Check if user can access a premium calculator feature
 * Returns an error object if access denied
 */
export function checkFeatureAccess(
  feature: CalculatorFeature,
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): PremiumCalculatorError | null {
  if (canUseCalculatorFeature(feature, subscriptionStatus, subscriptionExpiresAt)) {
    return null;
  }

  const featureNames: Record<CalculatorFeature, string> = {
    basic: 'Basic Calculator',
    advanced: 'Advanced Projections',
    projections: 'Monte Carlo Projections',
    comparisons: 'Multi-Asset Comparisons',
    taxOptimization: 'Tax Optimization',
  };

  return {
    type: 'feature_locked',
    feature,
    message: `${featureNames[feature]} is a premium feature. Upgrade to access advanced calculator tools.`,
    upgradeRequired: true,
  };
}

// ==================== Monte Carlo Simulations ====================

/**
 * Run Monte Carlo simulation for investment projections
 * Premium feature: projections
 */
export async function runMonteCarloSimulation(
  currentValue: number,
  monthlyContribution: number,
  years: number,
  expectedReturn: number, // Annual expected return (e.g., 0.10 for 10%)
  volatility: number, // Annual volatility (e.g., 0.60 for 60%)
  simulations: number = 1000,
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): Promise<MonteCarloResult | PremiumCalculatorError> {
  const accessError = checkFeatureAccess('projections', subscriptionStatus, subscriptionExpiresAt);
  if (accessError) return accessError;

  const months = years * 12;
  const monthlyReturn = expectedReturn / 12;
  const monthlyVolatility = volatility / Math.sqrt(12);

  const finalValues: number[] = [];
  const allReturns: number[] = [];

  // Run simulations
  for (let sim = 0; sim < simulations; sim++) {
    let value = currentValue;
    let maxValue = value;
    let maxDrawdown = 0;

    for (let month = 0; month < months; month++) {
      // Generate random return using normal distribution (Box-Muller)
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      const monthReturn = monthlyReturn + monthlyVolatility * z;
      value = value * (1 + monthReturn) + monthlyContribution;

      // Track max drawdown
      if (value > maxValue) maxValue = value;
      const drawdown = (maxValue - value) / maxValue;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    finalValues.push(value);
    const totalContributed = currentValue + monthlyContribution * months;
    allReturns.push((value - totalContributed) / totalContributed);
  }

  // Sort for percentile calculation
  finalValues.sort((a, b) => a - b);

  const getPercentile = (arr: number[], p: number) => {
    const index = Math.floor((p / 100) * arr.length);
    return arr[Math.min(index, arr.length - 1)];
  };

  // Calculate probability of profit
  const totalContributed = currentValue + monthlyContribution * months;
  const profitableSimulations = finalValues.filter(v => v > totalContributed).length;

  // Calculate Sharpe Ratio (simplified)
  const avgReturn = allReturns.reduce((a, b) => a + b, 0) / allReturns.length;
  const returnStdDev = Math.sqrt(
    allReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / allReturns.length
  );
  const sharpeRatio = avgReturn / returnStdDev;

  return {
    simulations,
    percentiles: {
      p5: getPercentile(finalValues, 5),
      p25: getPercentile(finalValues, 25),
      p50: getPercentile(finalValues, 50),
      p75: getPercentile(finalValues, 75),
      p95: getPercentile(finalValues, 95),
    },
    expectedReturn: avgReturn,
    volatility: returnStdDev,
    sharpeRatio,
    maxDrawdown: Math.max(...allReturns.map((_, i) => {
      const vals = finalValues.slice(0, i + 1);
      const max = Math.max(...vals);
      return (max - vals[vals.length - 1]) / max;
    })),
    probabilityOfProfit: (profitableSimulations / simulations) * 100,
    scenarios: [
      {
        name: 'Bear Case (5th percentile)',
        probability: 5,
        projectedValue: getPercentile(finalValues, 5),
        returnPercentage: ((getPercentile(finalValues, 5) - totalContributed) / totalContributed) * 100,
      },
      {
        name: 'Base Case (50th percentile)',
        probability: 50,
        projectedValue: getPercentile(finalValues, 50),
        returnPercentage: ((getPercentile(finalValues, 50) - totalContributed) / totalContributed) * 100,
      },
      {
        name: 'Bull Case (95th percentile)',
        probability: 5,
        projectedValue: getPercentile(finalValues, 95),
        returnPercentage: ((getPercentile(finalValues, 95) - totalContributed) / totalContributed) * 100,
      },
    ],
  };
}

// ==================== Multi-Asset Comparison ====================

/**
 * Compare multiple assets performance
 * Premium feature: comparisons
 */
export async function compareMultipleAssets(
  assets: { symbol: string; name: string }[],
  historicalReturns: { symbol: string; monthlyReturns: number[] }[],
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): Promise<MultiAssetComparison | PremiumCalculatorError> {
  const accessError = checkFeatureAccess('comparisons', subscriptionStatus, subscriptionExpiresAt);
  if (accessError) return accessError;

  const results: AssetComparisonResult[] = [];

  for (const asset of assets) {
    const returns = historicalReturns.find(r => r.symbol === asset.symbol);
    if (!returns) continue;

    const monthlyReturns = returns.monthlyReturns;
    const totalReturn = monthlyReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
    const annualizedReturn = Math.pow(1 + totalReturn, 12 / monthlyReturns.length) - 1;

    // Calculate volatility (standard deviation of returns)
    const avgReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
    const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / monthlyReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(12); // Annualized

    // Calculate Sharpe Ratio (assuming 0% risk-free rate for simplicity)
    const sharpeRatio = volatility > 0 ? annualizedReturn / volatility : 0;

    // Calculate max drawdown
    let peak = 1;
    let maxDrawdown = 0;
    let value = 1;
    for (const r of monthlyReturns) {
      value *= (1 + r);
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    results.push({
      symbol: asset.symbol,
      name: asset.name,
      totalReturn: totalReturn * 100,
      annualizedReturn: annualizedReturn * 100,
      volatility: volatility * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      bestMonth: Math.max(...monthlyReturns) * 100,
      worstMonth: Math.min(...monthlyReturns) * 100,
    });
  }

  // Sort by Sharpe Ratio (best risk-adjusted returns)
  results.sort((a, b) => b.sharpeRatio - a.sharpeRatio);

  // Generate recommendations
  const recommendations: string[] = [];
  if (results.length > 0) {
    recommendations.push(`${results[0].symbol} has the best risk-adjusted returns (Sharpe: ${results[0].sharpeRatio.toFixed(2)})`);
  }
  if (results.length > 1) {
    const lowestVol = results.reduce((a, b) => a.volatility < b.volatility ? a : b);
    recommendations.push(`${lowestVol.symbol} has the lowest volatility (${lowestVol.volatility.toFixed(1)}%)`);
  }

  return {
    assets: assets.map(a => a.symbol),
    dateRange: { start: new Date(), end: new Date() }, // Would be set based on actual data
    results,
    correlationMatrix: [], // Would calculate actual correlation
    recommendations,
  };
}

// ==================== Tax Optimization ====================

/**
 * Analyze tax optimization opportunities
 * Premium feature: taxOptimization
 */
export async function analyzeTaxOptimization(
  holdings: {
    symbol: string;
    name: string;
    costBasis: number;
    currentValue: number;
    holdingPeriod: 'short' | 'long';
  }[],
  taxBracket: number,
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): Promise<TaxOptimizationResult | PremiumCalculatorError> {
  const accessError = checkFeatureAccess('taxOptimization', subscriptionStatus, subscriptionExpiresAt);
  if (accessError) return accessError;

  // Calculate current unrealized gains/losses
  let totalShortTermGains = 0;
  let totalLongTermGains = 0;
  let totalShortTermLosses = 0;
  let totalLongTermLosses = 0;

  const harvestingOpportunities: HarvestingOpportunity[] = [];

  for (const holding of holdings) {
    const gainLoss = holding.currentValue - holding.costBasis;

    if (gainLoss > 0) {
      if (holding.holdingPeriod === 'short') {
        totalShortTermGains += gainLoss;
      } else {
        totalLongTermGains += gainLoss;
      }
    } else {
      if (holding.holdingPeriod === 'short') {
        totalShortTermLosses += Math.abs(gainLoss);
      } else {
        totalLongTermLosses += Math.abs(gainLoss);
      }

      // Add to harvesting opportunities
      harvestingOpportunities.push({
        asset: holding.name,
        symbol: holding.symbol,
        unrealizedLoss: Math.abs(gainLoss),
        taxBenefit: Math.abs(gainLoss) * (taxBracket / 100),
        action: `Sell ${holding.symbol} to realize ${formatCurrency(Math.abs(gainLoss))} loss`,
      });
    }
  }

  // Calculate current tax liability
  const shortTermTaxRate = taxBracket / 100;
  const longTermTaxRate = taxBracket > 37 ? 0.20 : taxBracket > 35 ? 0.15 : 0;

  const currentTaxLiability =
    totalShortTermGains * shortTermTaxRate +
    totalLongTermGains * longTermTaxRate;

  // Calculate optimized liability by harvesting the losses above.
  //
  // Losses net against gains of the SAME holding period first, and only the
  // remainder crosses over to the other period (IRC 1211/1212). The previous
  // implementation pooled every loss together and applied the whole pool to
  // short-term gains only, which left long-term gains entirely un-offset — so
  // it over-stated savings for a portfolio whose losses were long-term and
  // gains short-term, and under-stated them for the reverse. The
  // `totalShortTermLosses` / `totalLongTermLosses` buckets were already being
  // accumulated for this and then went unused.
  const netShortTerm = totalShortTermGains - totalShortTermLosses;
  const netLongTerm = totalLongTermGains - totalLongTermLosses;

  // Cross-apply whichever period came out negative against the other.
  let taxableShortTerm = Math.max(0, netShortTerm);
  let taxableLongTerm = Math.max(0, netLongTerm);

  if (netShortTerm < 0) {
    taxableLongTerm = Math.max(0, taxableLongTerm + netShortTerm);
  } else if (netLongTerm < 0) {
    taxableShortTerm = Math.max(0, taxableShortTerm + netLongTerm);
  }

  const optimizedTaxLiability =
    taxableShortTerm * shortTermTaxRate +
    taxableLongTerm * longTermTaxRate;

  const strategies: TaxStrategy[] = [
    {
      name: 'Tax-Loss Harvesting',
      description: 'Sell losing positions to offset gains and reduce tax liability',
      potentialSavings: harvestingOpportunities.reduce((sum, h) => sum + h.taxBenefit, 0),
      implementation: 'Sell underperforming assets before year-end, wait 30 days to avoid wash sale rules',
      riskLevel: 'low',
    },
    {
      name: 'Long-Term Holding',
      description: 'Hold assets for over 1 year to qualify for lower long-term capital gains rates',
      potentialSavings: totalShortTermGains * (shortTermTaxRate - longTermTaxRate),
      implementation: 'Delay selling short-term holdings until they qualify as long-term',
      riskLevel: 'medium',
    },
    {
      name: 'Charitable Giving',
      description: 'Donate appreciated assets to charity to avoid capital gains entirely',
      potentialSavings: totalLongTermGains * longTermTaxRate,
      implementation: 'Transfer appreciated crypto directly to qualified charitable organizations',
      riskLevel: 'low',
    },
  ];

  return {
    currentTaxLiability,
    optimizedTaxLiability,
    savings: currentTaxLiability - optimizedTaxLiability,
    strategies: strategies.filter(s => s.potentialSavings > 0),
    harvestingOpportunities: harvestingOpportunities.sort((a, b) => b.taxBenefit - a.taxBenefit),
  };
}

// ==================== Risk Analysis ====================

/**
 * Perform comprehensive risk analysis
 * Premium feature: advanced
 */
export async function analyzePortfolioRisk(
  portfolio: {
    symbol: string;
    value: number;
    volatility: number; // Historical volatility
    weight: number; // Percentage of portfolio
  }[],
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): Promise<RiskAnalysisResult | PremiumCalculatorError> {
  const accessError = checkFeatureAccess('advanced', subscriptionStatus, subscriptionExpiresAt);
  if (accessError) return accessError;

  const totalValue = portfolio.reduce((sum, p) => sum + p.value, 0);

  // Calculate weighted portfolio volatility
  const weightedVolatility = portfolio.reduce(
    (sum, p) => sum + p.weight * p.volatility,
    0
  );

  // Calculate Value at Risk (simplified - assuming normal distribution)
  const zScores = { daily: 1.645, weekly: 1.645, monthly: 1.645 }; // 95% confidence
  const dailyVol = weightedVolatility / Math.sqrt(252);
  const weeklyVol = weightedVolatility / Math.sqrt(52);
  const monthlyVol = weightedVolatility / Math.sqrt(12);

  const valueAtRisk = {
    daily: totalValue * dailyVol * zScores.daily,
    weekly: totalValue * weeklyVol * zScores.weekly,
    monthly: totalValue * monthlyVol * zScores.monthly,
  };

  // Stress tests
  const stressTests: StressTestResult[] = [
    {
      scenario: 'Market Crash (-30%)',
      description: 'Simulates a major market correction similar to March 2020',
      portfolioImpact: -totalValue * 0.30,
      impactPercentage: -30,
    },
    {
      scenario: 'Crypto Winter (-70%)',
      description: 'Simulates a prolonged bear market similar to 2018-2019',
      portfolioImpact: -totalValue * 0.70,
      impactPercentage: -70,
    },
    {
      scenario: 'Flash Crash (-20%)',
      description: 'Simulates a sudden market drop with quick recovery',
      portfolioImpact: -totalValue * 0.20,
      impactPercentage: -20,
    },
    {
      scenario: 'Bull Run (+100%)',
      description: 'Simulates a strong bull market rally',
      portfolioImpact: totalValue * 1.00,
      impactPercentage: 100,
    },
  ];

  // Calculate risk score (0-100)
  let riskScore = 50; // Base score
  if (weightedVolatility > 0.80) riskScore += 25;
  else if (weightedVolatility > 0.50) riskScore += 15;
  else if (weightedVolatility < 0.30) riskScore -= 15;

  // Concentration risk
  const maxWeight = Math.max(...portfolio.map(p => p.weight));
  if (maxWeight > 0.50) riskScore += 15;
  else if (maxWeight > 0.30) riskScore += 5;
  else riskScore -= 10;

  riskScore = Math.max(0, Math.min(100, riskScore));

  const riskCategory: 'conservative' | 'moderate' | 'aggressive' =
    riskScore < 35 ? 'conservative' : riskScore < 65 ? 'moderate' : 'aggressive';

  // Recommendations
  const recommendations: string[] = [];
  if (maxWeight > 0.50) {
    recommendations.push('Consider diversifying - one asset represents over 50% of your portfolio');
  }
  if (weightedVolatility > 0.70) {
    recommendations.push('High portfolio volatility - consider adding stable assets');
  }
  if (portfolio.length < 3) {
    recommendations.push('Limited diversification - consider adding more assets');
  }
  if (riskCategory === 'aggressive') {
    recommendations.push('Aggressive risk profile - ensure this aligns with your investment goals');
  }

  return {
    portfolioValue: totalValue,
    valueAtRisk,
    stressTests,
    riskScore,
    riskCategory,
    recommendations,
  };
}

// ==================== Helper Functions ====================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Get premium calculator features available to user
 */
export function getAvailablePremiumFeatures(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): { feature: CalculatorFeature; name: string; available: boolean; description: string }[] {
  const features: { feature: CalculatorFeature; name: string; description: string }[] = [
    {
      feature: 'basic',
      name: 'Basic Calculators',
      description: 'DCA, Tax, Staking, and Fee calculators',
    },
    {
      feature: 'advanced',
      name: 'Advanced Analytics',
      description: 'Risk analysis, portfolio optimization, and advanced metrics',
    },
    {
      feature: 'projections',
      name: 'Monte Carlo Projections',
      description: 'Statistical simulations for investment outcome predictions',
    },
    {
      feature: 'comparisons',
      name: 'Multi-Asset Comparisons',
      description: 'Compare performance across multiple cryptocurrencies',
    },
    {
      feature: 'taxOptimization',
      name: 'Tax Optimization',
      description: 'Tax-loss harvesting strategies and optimization recommendations',
    },
  ];

  return features.map(f => ({
    ...f,
    available: canUseCalculatorFeature(f.feature, subscriptionStatus, subscriptionExpiresAt),
  }));
}
