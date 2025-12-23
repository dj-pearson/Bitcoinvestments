/**
 * Staking Rewards Calculator Page
 *
 * Calculate and optimize staking rewards across multiple platforms.
 * Free users: basic calculator, 3 platforms
 * Premium: all platforms, optimization, auto-compound projections
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  Calculator,
  TrendingUp,
  Check,
  ChevronRight,
  Percent,
  Clock,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  hasStakingCalculatorPremium,
  STAKING_CALCULATOR_PRICING,
} from '../services/subscriptionLimits';
import {
  getStakingPlatforms,
  getStakingOpportunities,
  calculateStakingRewards,
  getOptimalStakingStrategy,
} from '../services/stakingCalculator';
import type {
  StakingPlatform,
  StakingOpportunity,
  StakingCalculatorInputs,
  StakingCalculatorResult,
  OptimalStakingStrategy,
} from '../types/premiumFeatures';

export default function StakingCalculatorPage() {
  const { profile } = useAuth();
  const [_platforms, setPlatforms] = useState<StakingPlatform[]>([]);
  const [opportunities, setOpportunities] = useState<StakingOpportunity[]>([]);
  const [selectedAsset, setSelectedAsset] = useState('ETH');
  const [stakeAmount, setStakeAmount] = useState(1000);
  const [duration, setDuration] = useState(12);
  const [selectedOpportunity, setSelectedOpportunity] = useState<StakingOpportunity | null>(null);
  const [result, setResult] = useState<StakingCalculatorResult | null>(null);
  const [optimalStrategy, setOptimalStrategy] = useState<OptimalStakingStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasAccess = hasStakingCalculatorPremium(undefined, profile?.subscription_status);

  useEffect(() => {
    loadData();
  }, [hasAccess, selectedAsset]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [platformData, opportunityData] = await Promise.all([
        getStakingPlatforms(hasAccess),
        getStakingOpportunities(selectedAsset, hasAccess),
      ]);
      setPlatforms(platformData);
      setOpportunities(opportunityData);

      if (opportunityData.length > 0) {
        setSelectedOpportunity(opportunityData[0]);
      }
    } catch (err) {
      console.error('Failed to load staking data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCalculate() {
    if (!selectedOpportunity) return;

    const inputs: StakingCalculatorInputs = {
      asset_symbol: selectedAsset,
      stake_amount: stakeAmount,
      stake_duration_months: duration,
      apy: selectedOpportunity.apy_total,
      compound_frequency: selectedOpportunity.compound_frequency === 'auto' ? 'daily' : selectedOpportunity.compound_frequency === 'manual' ? 'none' : selectedOpportunity.compound_frequency,
      reinvest_rewards: true,
      price_change_assumption: 0,
    };

    const calcResult = calculateStakingRewards(inputs);
    setResult(calcResult);
  }

  async function handleOptimize() {
    if (!hasAccess) return;
    const strategy = await getOptimalStakingStrategy(selectedAsset, stakeAmount, 'medium');
    setOptimalStrategy(strategy);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Staking Rewards Calculator
            </h1>
            {hasAccess && (
              <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                PREMIUM
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Calculate potential staking rewards and find the best platforms for your crypto.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calculator Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <Calculator className="h-5 w-5 inline mr-2" />
                Calculate Rewards
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Asset
                  </label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="SOL">Solana (SOL)</option>
                    <option value="BNB">BNB</option>
                    <option value="ADA">Cardano (ADA)</option>
                    <option value="DOT">Polkadot (DOT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stake Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (Months)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Staking Platform
                  </label>
                  <select
                    value={selectedOpportunity?.id || ''}
                    onChange={(e) => {
                      const opp = opportunities.find(o => o.id === e.target.value);
                      setSelectedOpportunity(opp || null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {opportunities.map(opp => (
                      <option key={opp.id} value={opp.id}>
                        {opp.platform_name} - {opp.apy_total.toFixed(2)}% APY
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCalculate}
                  className="w-full py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600"
                >
                  Calculate Rewards
                </button>

                {hasAccess && (
                  <button
                    onClick={handleOptimize}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90"
                  >
                    Find Optimal Strategy
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calculation Results */}
            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Projected Returns
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Initial Stake</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      ${stakeAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Rewards</p>
                    <p className="text-xl font-bold text-green-600">
                      ${result.total_rewards.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Final Balance</p>
                    <p className="text-xl font-bold text-blue-600">
                      ${result.final_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Effective APY</p>
                    <p className="text-xl font-bold text-orange-600">
                      {result.effective_apy.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Projection Chart */}
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Monthly Projection</h4>
                <div className="h-48 flex items-end gap-1">
                  {result.projections.map((proj, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-purple-500 rounded-t"
                      style={{
                        height: `${(proj.cumulative_rewards / result.total_rewards) * 100}%`,
                        minHeight: '4px',
                      }}
                      title={`Month ${proj.month}: $${proj.cumulative_rewards.toFixed(2)}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Month 1</span>
                  <span>Month {duration}</span>
                </div>
              </div>
            )}

            {/* Optimal Strategy (Premium) */}
            {optimalStrategy && hasAccess && (
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Optimal Staking Strategy
                </h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-purple-200">Expected APY</p>
                    <p className="text-2xl font-bold">{optimalStrategy.total_expected_apy.toFixed(2)}%</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-purple-200">Expected Rewards</p>
                    <p className="text-2xl font-bold">${optimalStrategy.total_expected_rewards_usd.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-purple-200">Risk Score</p>
                    <p className="text-2xl font-bold">{optimalStrategy.risk_adjusted_score.toFixed(1)}/100</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {optimalStrategy.rationale.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-300 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Staking Opportunities */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available Staking Options
                </h3>
                {!hasAccess && (
                  <span className="text-sm text-gray-500">Showing top 3 of {opportunities.length}+</span>
                )}
              </div>
              <div className="space-y-3">
                {opportunities.map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => setSelectedOpportunity(opp)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedOpportunity?.id === opp.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{opp.platform_name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            {opp.apy_total.toFixed(2)}% APY
                          </span>
                          {opp.lock_period_days && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {opp.lock_period_days}d lock
                            </span>
                          )}
                          {opp.slashing_risk && (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <Shield className="h-3 w-3" />
                              Slashing risk
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">{opp.apy_total.toFixed(2)}%</p>
                        <p className="text-xs text-gray-500">APY</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Upsell */}
            {!hasAccess && (
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Unlock Premium Features</h3>
                <ul className="space-y-2 mb-4">
                  {STAKING_CALCULATOR_PRICING.features.premium.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">${STAKING_CALCULATOR_PRICING.price_monthly}</span>
                  <span className="text-purple-200">/month</span>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50"
                >
                  Upgrade Now
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
