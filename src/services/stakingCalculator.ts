/**
 * Staking Rewards Calculator Service
 *
 * Calculate and optimize staking rewards across multiple platforms.
 * Free users: basic calculator, 3 platforms
 * Premium: all platforms, optimization, auto-compound projections
 */

import type {
  StakingPlatform,
  StakingOpportunity,
  StakingCalculatorInputs,
  StakingCalculatorResult,
  StakingProjection,
  OptimalStakingStrategy,
} from '../types/premiumFeatures';

// Mock staking platforms data
const mockPlatforms: StakingPlatform[] = [
  { id: 'lido', name: 'Lido', slug: 'lido', logo_url: '/platforms/lido.svg', platform_type: 'liquid_staking', website_url: 'https://lido.fi', is_verified: true, tvl_usd: 14200000000, supported_assets: ['ETH', 'SOL', 'MATIC'], min_stake_usd: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'rocketpool', name: 'Rocket Pool', slug: 'rocketpool', logo_url: '/platforms/rocketpool.svg', platform_type: 'liquid_staking', website_url: 'https://rocketpool.net', is_verified: true, tvl_usd: 2800000000, supported_assets: ['ETH'], min_stake_usd: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'coinbase', name: 'Coinbase', slug: 'coinbase', logo_url: '/platforms/coinbase.svg', platform_type: 'centralized_exchange', website_url: 'https://coinbase.com', is_verified: true, tvl_usd: 5000000000, supported_assets: ['ETH', 'SOL', 'ADA', 'ATOM'], min_stake_usd: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'binance', name: 'Binance', slug: 'binance', logo_url: '/platforms/binance.svg', platform_type: 'centralized_exchange', website_url: 'https://binance.com', is_verified: true, tvl_usd: 8000000000, supported_assets: ['ETH', 'BNB', 'SOL', 'ADA', 'DOT'], min_stake_usd: 10, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'kraken', name: 'Kraken', slug: 'kraken', logo_url: '/platforms/kraken.svg', platform_type: 'centralized_exchange', website_url: 'https://kraken.com', is_verified: true, tvl_usd: 3000000000, supported_assets: ['ETH', 'SOL', 'DOT', 'ATOM'], min_stake_usd: 0.1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'marinade', name: 'Marinade Finance', slug: 'marinade', logo_url: '/platforms/marinade.svg', platform_type: 'liquid_staking', website_url: 'https://marinade.finance', is_verified: true, tvl_usd: 1200000000, supported_assets: ['SOL'], min_stake_usd: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Mock staking opportunities
const mockOpportunities: StakingOpportunity[] = [
  { id: 'lido-eth', platform_id: 'lido', platform_name: 'Lido', asset_symbol: 'ETH', asset_name: 'Ethereum', apy_base: 4.2, apy_reward: 0, apy_total: 4.2, apy_7d_avg: 4.15, apy_30d_avg: 4.1, reward_token: 'stETH', lock_period_days: null, unlock_period_days: null, min_stake: 0, max_stake: null, compound_frequency: 'auto', slashing_risk: true, validator_commission: 10, tvl_usd: 14200000000, is_active: true, last_updated_at: new Date().toISOString() },
  { id: 'rocketpool-eth', platform_id: 'rocketpool', platform_name: 'Rocket Pool', asset_symbol: 'ETH', asset_name: 'Ethereum', apy_base: 4.5, apy_reward: 0.3, apy_total: 4.8, apy_7d_avg: 4.7, apy_30d_avg: 4.6, reward_token: 'rETH', lock_period_days: null, unlock_period_days: null, min_stake: 0.01, max_stake: null, compound_frequency: 'auto', slashing_risk: true, validator_commission: 14, tvl_usd: 2800000000, is_active: true, last_updated_at: new Date().toISOString() },
  { id: 'coinbase-eth', platform_id: 'coinbase', platform_name: 'Coinbase', asset_symbol: 'ETH', asset_name: 'Ethereum', apy_base: 3.8, apy_reward: 0, apy_total: 3.8, apy_7d_avg: 3.75, apy_30d_avg: 3.7, reward_token: 'ETH', lock_period_days: null, unlock_period_days: 3, min_stake: 0.001, max_stake: null, compound_frequency: 'manual', slashing_risk: false, validator_commission: 25, tvl_usd: 5000000000, is_active: true, last_updated_at: new Date().toISOString() },
  { id: 'binance-eth', platform_id: 'binance', platform_name: 'Binance', asset_symbol: 'ETH', asset_name: 'Ethereum', apy_base: 4.0, apy_reward: 0, apy_total: 4.0, apy_7d_avg: 3.95, apy_30d_avg: 3.9, reward_token: 'BETH', lock_period_days: null, unlock_period_days: null, min_stake: 0.001, max_stake: null, compound_frequency: 'daily', slashing_risk: false, validator_commission: 20, tvl_usd: 8000000000, is_active: true, last_updated_at: new Date().toISOString() },
  { id: 'lido-sol', platform_id: 'lido', platform_name: 'Lido', asset_symbol: 'SOL', asset_name: 'Solana', apy_base: 6.8, apy_reward: 0, apy_total: 6.8, apy_7d_avg: 6.75, apy_30d_avg: 6.7, reward_token: 'stSOL', lock_period_days: null, unlock_period_days: 2, min_stake: 0.01, max_stake: null, compound_frequency: 'auto', slashing_risk: true, validator_commission: 10, tvl_usd: 500000000, is_active: true, last_updated_at: new Date().toISOString() },
  { id: 'marinade-sol', platform_id: 'marinade', platform_name: 'Marinade Finance', asset_symbol: 'SOL', asset_name: 'Solana', apy_base: 7.2, apy_reward: 0.5, apy_total: 7.7, apy_7d_avg: 7.6, apy_30d_avg: 7.5, reward_token: 'mSOL', lock_period_days: null, unlock_period_days: 2, min_stake: 0, max_stake: null, compound_frequency: 'auto', slashing_risk: true, validator_commission: 6, tvl_usd: 1200000000, is_active: true, last_updated_at: new Date().toISOString() },
  { id: 'binance-bnb', platform_id: 'binance', platform_name: 'Binance', asset_symbol: 'BNB', asset_name: 'BNB', apy_base: 2.5, apy_reward: 0, apy_total: 2.5, apy_7d_avg: 2.45, apy_30d_avg: 2.4, reward_token: 'BNB', lock_period_days: 7, unlock_period_days: 7, min_stake: 1, max_stake: null, compound_frequency: 'daily', slashing_risk: false, validator_commission: 0, tvl_usd: 2000000000, is_active: true, last_updated_at: new Date().toISOString() },
];

/**
 * Get all staking platforms
 */
export async function getStakingPlatforms(isPremium: boolean = false): Promise<StakingPlatform[]> {
  if (isPremium) {
    return mockPlatforms;
  }
  // Free users only see top 3 platforms
  return mockPlatforms.slice(0, 3);
}

/**
 * Get staking opportunities for an asset
 */
export async function getStakingOpportunities(
  assetSymbol?: string,
  isPremium: boolean = false
): Promise<StakingOpportunity[]> {
  let opportunities = [...mockOpportunities];

  if (assetSymbol) {
    opportunities = opportunities.filter(o => o.asset_symbol === assetSymbol);
  }

  // Sort by APY
  opportunities.sort((a, b) => b.apy_total - a.apy_total);

  if (!isPremium) {
    // Free users see limited opportunities
    return opportunities.slice(0, 3);
  }

  return opportunities;
}

/**
 * Calculate staking rewards
 */
export function calculateStakingRewards(inputs: StakingCalculatorInputs): StakingCalculatorResult {
  const { stake_amount, stake_duration_months, apy, compound_frequency, reinvest_rewards, price_change_assumption } = inputs;

  // Calculate compound periods per year
  const compoundsPerYear = {
    daily: 365,
    weekly: 52,
    monthly: 12,
    yearly: 1,
    none: 0,
  }[compound_frequency];

  const projections: StakingProjection[] = [];
  let currentAmount = stake_amount;
  let cumulativeRewards = 0;

  for (let month = 1; month <= stake_duration_months; month++) {
    let monthlyReward: number;

    if (compoundsPerYear === 0) {
      // Simple interest
      monthlyReward = stake_amount * (apy / 100 / 12);
    } else {
      // Compound interest
      const periodsThisMonth = compoundsPerYear / 12;
      const ratePerPeriod = (apy / 100) / compoundsPerYear;
      const newAmount = currentAmount * Math.pow(1 + ratePerPeriod, periodsThisMonth);
      monthlyReward = newAmount - currentAmount;

      if (reinvest_rewards) {
        currentAmount = newAmount;
      }
    }

    if (!reinvest_rewards) {
      cumulativeRewards += monthlyReward;
    } else {
      cumulativeRewards = currentAmount - stake_amount;
    }

    // Apply price change assumption
    const priceMultiplier = 1 + (price_change_assumption / 100) * (month / stake_duration_months);

    projections.push({
      month,
      staked_amount: reinvest_rewards ? currentAmount : stake_amount,
      rewards_earned: monthlyReward,
      cumulative_rewards: cumulativeRewards,
      total_value_usd: (reinvest_rewards ? currentAmount : stake_amount + cumulativeRewards) * priceMultiplier,
      effective_apy: apy,
    });
  }

  const finalBalance = reinvest_rewards ? currentAmount : stake_amount + cumulativeRewards;
  const priceMultiplier = 1 + (price_change_assumption / 100);

  return {
    inputs,
    total_rewards: cumulativeRewards,
    total_rewards_usd: cumulativeRewards * priceMultiplier,
    final_balance: finalBalance,
    final_balance_usd: finalBalance * priceMultiplier,
    effective_apy: apy,
    projections,
  };
}

/**
 * Get optimal staking strategy (Premium feature)
 */
export async function getOptimalStakingStrategy(
  assetSymbol: string,
  stakeAmount: number,
  riskTolerance: 'low' | 'medium' | 'high'
): Promise<OptimalStakingStrategy> {
  const opportunities = await getStakingOpportunities(assetSymbol, true);

  // Score opportunities based on risk tolerance
  const scoredOpportunities = opportunities.map(opp => {
    let riskScore = 50; // Base risk score

    // Adjust for platform type
    if (opp.platform_name === 'Coinbase' || opp.platform_name === 'Binance') {
      riskScore -= 20; // Lower risk for CEX
    }
    if (opp.slashing_risk) {
      riskScore += 15;
    }
    if (opp.lock_period_days) {
      riskScore += opp.lock_period_days / 10;
    }

    // Calculate risk-adjusted APY
    const riskMultiplier = {
      low: 0.7,
      medium: 1.0,
      high: 1.3,
    }[riskTolerance];

    const adjustedScore = (opp.apy_total * riskMultiplier) - (riskScore / 10);

    return {
      opportunity: opp,
      riskScore,
      adjustedScore,
    };
  });

  // Sort by adjusted score and select top recommendations
  scoredOpportunities.sort((a, b) => b.adjustedScore - a.adjustedScore);

  const platform = mockPlatforms.find(p => p.id === scoredOpportunities[0].opportunity.platform_id)!;

  const expectedRewards = stakeAmount * (scoredOpportunities[0].opportunity.apy_total / 100);

  return {
    recommended_platforms: [{
      platform,
      opportunity: scoredOpportunities[0].opportunity,
      allocation_percent: 100,
      expected_rewards_usd: expectedRewards,
      risk_score: scoredOpportunities[0].riskScore,
    }],
    total_expected_apy: scoredOpportunities[0].opportunity.apy_total,
    total_expected_rewards_usd: expectedRewards,
    diversification_score: 30, // Single platform = low diversification
    risk_adjusted_score: scoredOpportunities[0].adjustedScore,
    rationale: [
      `${platform.name} offers the best risk-adjusted return for your ${riskTolerance} risk tolerance`,
      `Current APY of ${scoredOpportunities[0].opportunity.apy_total}% is ${scoredOpportunities[0].opportunity.apy_total > 5 ? 'above' : 'at'} market average`,
      scoredOpportunities[0].opportunity.slashing_risk
        ? 'Note: This option includes slashing risk from validator misbehavior'
        : 'This is a low-risk option with no slashing exposure',
    ],
  };
}

/**
 * Compare staking across platforms
 */
export async function compareStakingRewards(
  assetSymbol: string,
  stakeAmount: number,
  durationMonths: number
): Promise<StakingCalculatorResult[]> {
  const opportunities = await getStakingOpportunities(assetSymbol, true);

  return opportunities.map(opp => {
    const inputs: StakingCalculatorInputs = {
      asset_symbol: assetSymbol,
      stake_amount: stakeAmount,
      stake_duration_months: durationMonths,
      apy: opp.apy_total,
      compound_frequency: opp.compound_frequency === 'auto' ? 'daily' : opp.compound_frequency === 'manual' ? 'none' : opp.compound_frequency,
      reinvest_rewards: true,
      price_change_assumption: 0,
    };

    const result = calculateStakingRewards(inputs);

    return {
      ...result,
      comparison: [{
        platform: opp.platform_name,
        apy: opp.apy_total,
        total_rewards: result.total_rewards,
        difference: 0,
      }],
    };
  });
}
