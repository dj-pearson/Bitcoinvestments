/**
 * Portfolio Rebalancing Alerts Page
 *
 * AI-powered alerts when portfolio drifts from target allocation.
 * Free users: monthly alerts, 1 portfolio
 * Premium: real-time, unlimited portfolios, AI optimization
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Bell,
  Check,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  hasRebalancingAlertsPremium,
  REBALANCING_ALERTS_PRICING,
} from '../services/subscriptionLimits';
import {
  getRebalanceAlerts,
  getTargetAllocationTemplates,
  generateRebalanceRecommendation,
} from '../services/portfolioRebalancing';
import type {
  RebalanceAlert,
  RebalanceRecommendation,
  PortfolioRebalanceConfig,
} from '../types/premiumFeatures';

export default function RebalancingAlertsPage() {
  const { user, profile } = useAuth();
  const [alerts, setAlerts] = useState<RebalanceAlert[]>([]);
  const [recommendation, setRecommendation] = useState<RebalanceRecommendation | null>(null);
  const [_showSetupModal, setShowSetupModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const hasAccess = hasRebalancingAlertsPremium(undefined, profile?.subscription_status);
  const templates = getTargetAllocationTemplates();

  useEffect(() => {
    loadData();
  }, [user?.id, hasAccess]);

  async function loadData() {
    setIsLoading(true);
    try {
      if (user?.id) {
        const alertData = await getRebalanceAlerts(user.id, hasAccess);
        setAlerts(alertData);
      }

      // Generate sample recommendation
      const mockConfig: PortfolioRebalanceConfig = {
        id: 'config-1',
        user_id: user?.id || '',
        portfolio_id: 'portfolio-1',
        name: 'My Portfolio',
        is_active: true,
        rebalance_method: 'percent_band',
        check_frequency: 'weekly',
        drift_threshold_percent: 5,
        min_trade_value_usd: 50,
        tax_loss_harvesting: false,
        avoid_short_term_gains: true,
        target_allocations: [
          { id: '1', portfolio_id: 'portfolio-1', asset_symbol: 'BTC', asset_name: 'Bitcoin', target_percent: 50, min_percent: 45, max_percent: 55, priority: 1, created_at: '', updated_at: '' },
          { id: '2', portfolio_id: 'portfolio-1', asset_symbol: 'ETH', asset_name: 'Ethereum', target_percent: 30, min_percent: 25, max_percent: 35, priority: 2, created_at: '', updated_at: '' },
          { id: '3', portfolio_id: 'portfolio-1', asset_symbol: 'SOL', asset_name: 'Solana', target_percent: 10, min_percent: 5, max_percent: 15, priority: 3, created_at: '', updated_at: '' },
          { id: '4', portfolio_id: 'portfolio-1', asset_symbol: 'USDC', asset_name: 'USD Coin', target_percent: 10, min_percent: 5, max_percent: 15, priority: 4, created_at: '', updated_at: '' },
        ],
        created_at: '',
        updated_at: '',
      };

      const rec = await generateRebalanceRecommendation(mockConfig);
      setRecommendation(rec);
    } catch (err) {
      console.error('Failed to load rebalancing data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="h-8 w-8 text-indigo-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Portfolio Rebalancing
            </h1>
            {hasAccess && (
              <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full">
                PREMIUM
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered alerts when your portfolio drifts from target allocation.
            {!hasAccess && ' Free users get monthly alerts.'}
          </p>
        </div>

        {/* Quick Stats */}
        {recommendation && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Drift</span>
              <p className={`text-2xl font-bold ${
                recommendation.total_drift_percent > 5 ? 'text-red-500' :
                recommendation.total_drift_percent > 2 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {recommendation.total_drift_percent.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Rebalance Needed</span>
              <p className={`text-2xl font-bold ${recommendation.is_rebalance_recommended ? 'text-red-500' : 'text-green-500'}`}>
                {recommendation.is_rebalance_recommended ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Suggested Trades</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recommendation.suggested_trades.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Est. Tax Impact</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${recommendation.estimated_tax_impact_usd.toFixed(0)}
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Drift Analysis */}
          <div className="lg:col-span-2">
            {recommendation && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Allocation vs Target
                  </h2>
                  <button
                    onClick={() => setShowSetupModal(true)}
                    className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600"
                  >
                    <Settings className="h-4 w-4" />
                    Configure
                  </button>
                </div>

                <div className="space-y-4">
                  {recommendation.drift_analysis.map(drift => (
                    <div key={drift.asset_symbol} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {drift.asset_symbol.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{drift.asset_symbol}</p>
                            <p className="text-xs text-gray-500">{drift.asset_name}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                          drift.urgency === 'high' ? 'bg-red-100 text-red-700' :
                          drift.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {drift.action_required === 'buy' && <TrendingUp className="h-4 w-4" />}
                          {drift.action_required === 'sell' && <TrendingDown className="h-4 w-4" />}
                          {drift.action_required}
                        </div>
                      </div>

                      {/* Progress bars */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Current: {drift.current_percent.toFixed(1)}%</span>
                            <span>Target: {drift.target_percent}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full relative overflow-hidden">
                            <div
                              className="absolute h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.min(100, drift.current_percent)}%` }}
                            />
                            <div
                              className="absolute h-full w-1 bg-green-500"
                              style={{ left: `${drift.target_percent}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={drift.drift_percent >= 0 ? 'text-red-500' : 'text-green-500'}>
                            {drift.drift_percent >= 0 ? '+' : ''}{drift.drift_percent.toFixed(1)}% drift
                          </span>
                          {drift.action_required !== 'hold' && (
                            <span className="text-gray-500">
                              {drift.action_required === 'buy' ? 'Buy' : 'Sell'} ${drift.trade_amount_usd.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested Actions */}
                {recommendation.suggested_trades.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Suggested Trades to Rebalance
                    </h3>
                    <div className="space-y-2">
                      {recommendation.suggested_trades.map((trade, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            {trade.action === 'buy' ? (
                              <TrendingUp className="h-5 w-5 text-green-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                              {trade.action} {trade.asset_symbol}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${trade.amount_usd.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                      {recommendation.rationale}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alerts Sidebar */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Alerts
                </h3>
              </div>
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-500">No alerts yet</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg ${
                        alert.is_read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {alert.alert_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(alert.triggered_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Allocation Templates
              </h3>
              <div className="space-y-3">
                {templates.map(template => (
                  <button
                    key={template.name}
                    onClick={() => setShowSetupModal(true)}
                    className="w-full p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    <div className="flex gap-1 mt-2">
                      {template.allocations.slice(0, 3).map(a => (
                        <span key={a.asset_symbol} className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                          {a.asset_symbol}: {a.target_percent}%
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Optimization (Premium) */}
            {hasAccess && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="font-semibold">AI Optimization</h3>
                </div>
                <p className="text-sm text-indigo-100 mb-4">
                  Let AI analyze your portfolio and suggest optimal allocation based on your risk tolerance and goals.
                </p>
                <button className="w-full py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50">
                  Run AI Analysis
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Premium Upsell */}
        {!hasAccess && (
          <div className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Unlock Real-Time Rebalancing</h2>
                <p className="text-indigo-100 mb-6">
                  Get instant alerts and AI-powered recommendations to keep your portfolio on track.
                </p>
                <ul className="space-y-3 mb-6">
                  {REBALANCING_ALERTS_PRICING.features.premium.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">${REBALANCING_ALERTS_PRICING.price_monthly}</span>
                  <span className="text-indigo-200">/month</span>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50"
                >
                  Subscribe Now
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <Scale className="h-32 w-32 text-white/30" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
