/**
 * DCA Automation Service Page
 *
 * Automate dollar-cost averaging purchases through integrated exchanges.
 * Free: manual DCA only (calculator)
 * Basic: 1 schedule, 1% fee, $9.99/month
 * Premium: unlimited schedules, 0.5% fee, $19.99/month
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Repeat,
  Calculator,
  Plus,
  Check,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDCAAutomationTier,
  DCA_AUTOMATION_PRICING,
} from '../services/subscriptionLimits';
import {
  getUserDCASchedules,
  getDCAPerformance,
  calculateDCAProjection,
  getDCAPlans,
  pauseDCASchedule,
  resumeDCASchedule,
} from '../services/dcaAutomation';
import type {
  DCASchedule,
  DCAPerformance,
} from '../types/premiumFeatures';

export default function DCAAutomationPage() {
  const { user, profile } = useAuth();
  const [schedules, setSchedules] = useState<DCASchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<DCASchedule | null>(null);
  const [_performance, setPerformance] = useState<DCAPerformance | null>(null);
  const [calcAmount, setCalcAmount] = useState(100);
  const [calcFrequency, setCalcFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [calcDuration, setCalcDuration] = useState(12);
  const [isLoading, setIsLoading] = useState(true);

  const tier = getDCAAutomationTier(undefined, profile?.subscription_status);
  const plans = getDCAPlans();

  useEffect(() => {
    loadData();
  }, [user?.id, tier]);

  async function loadData() {
    setIsLoading(true);
    try {
      if (user?.id) {
        const scheduleData = await getUserDCASchedules(user.id, tier);
        setSchedules(scheduleData);

        if (scheduleData.length > 0) {
          setSelectedSchedule(scheduleData[0]);
          const perfData = await getDCAPerformance(scheduleData[0].id);
          setPerformance(perfData);
        }
      }
    } catch (err) {
      console.error('Failed to load DCA data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const projection = calculateDCAProjection(calcAmount, calcFrequency, calcDuration, 50);

  async function handleToggleSchedule(schedule: DCASchedule) {
    try {
      if (schedule.status === 'active') {
        await pauseDCASchedule(schedule.id);
      } else {
        await resumeDCASchedule(schedule.id);
      }
      loadData();
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Repeat className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              DCA Automation
            </h1>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              tier === 'premium' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
              tier === 'basic' ? 'bg-emerald-100 text-emerald-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {tier.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Automate your dollar-cost averaging strategy and never miss a buy.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* DCA Calculator */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                DCA Calculator
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Investment Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    value={calcFrequency}
                    onChange={(e) => setCalcFrequency(e.target.value as 'weekly' | 'monthly')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (Months)
                  </label>
                  <select
                    value={calcDuration}
                    onChange={(e) => setCalcDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                    <option value="60">5 years</option>
                  </select>
                </div>

                {/* Projection Results */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Projection</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Invested</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${projection.totalInvested.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Purchases</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {projection.executionCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Projected Value*</span>
                      <span className="font-semibold text-emerald-500">
                        ${projection.projectedValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Projected Return*</span>
                      <span className="font-semibold text-emerald-500">
                        +{projection.projectedReturnPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    *Based on 50% annual return assumption. Actual results may vary.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tier Info */}
            <div className={`rounded-xl p-6 ${
              tier === 'premium' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' :
              tier === 'basic' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
              'bg-gray-100 dark:bg-gray-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${tier === 'premium' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {DCA_AUTOMATION_PRICING.tiers[tier].name}
                  </h3>
                  <p className={`text-sm ${tier === 'premium' ? 'text-emerald-100' : 'text-gray-600 dark:text-gray-400'}`}>
                    {tier === 'free' ? 'Manual DCA only - Use the calculator above' :
                     tier === 'basic' ? '1 automated schedule, 1% fee per trade' :
                     'Unlimited schedules, 0.5% fee per trade'}
                  </p>
                </div>
                {tier === 'free' || tier === 'basic' ? (
                  <Link
                    to="/pricing"
                    className="px-4 py-2 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    Upgrade
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Active Schedules */}
            {tier !== 'free' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Active DCA Schedules
                  </h2>
                  <button
                    disabled={tier === 'basic' && schedules.length >= 1}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                    New Schedule
                  </button>
                </div>

                {schedules.length === 0 ? (
                  <div className="text-center py-8">
                    <Repeat className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No active DCA schedules</p>
                    <p className="text-sm text-gray-500">Create your first automated investment schedule</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map(schedule => (
                      <div
                        key={schedule.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSchedule?.id === schedule.id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                        onClick={() => setSelectedSchedule(schedule)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                              <span className="font-bold text-emerald-600">{schedule.asset_symbol}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{schedule.name}</p>
                              <p className="text-sm text-gray-500">
                                ${schedule.amount_usd} {schedule.frequency} on {schedule.exchange}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              schedule.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {schedule.status}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSchedule(schedule);
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              {schedule.status === 'active' ? (
                                <Pause className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Play className="h-4 w-4 text-green-500" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Schedule Stats */}
                        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="text-xs text-gray-500">Invested</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              ${schedule.total_invested_usd.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Purchased</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {schedule.total_purchased.toFixed(4)} {schedule.asset_symbol}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Avg Price</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              ${schedule.average_price.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Executions</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {schedule.execution_count}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DCA Plans */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Popular DCA Strategies
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-lg border-2 ${
                      plan.is_recommended
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {plan.is_recommended && (
                      <span className="text-xs font-semibold text-emerald-600 mb-2 block">RECOMMENDED</span>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {plan.assets.map(asset => (
                        <span
                          key={asset.symbol}
                          className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
                        >
                          {asset.symbol}: {asset.allocation_percent}%
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Min: ${plan.min_amount_usd} {plan.frequency}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Upsell */}
            {tier !== 'premium' && (
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Upgrade to DCA Premium</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <ul className="space-y-2">
                    {DCA_AUTOMATION_PRICING.tiers.premium.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-300" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col justify-center items-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold">${DCA_AUTOMATION_PRICING.tiers.premium.price_monthly}</p>
                      <p className="text-emerald-200">/month</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50"
                >
                  Start Automating
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
