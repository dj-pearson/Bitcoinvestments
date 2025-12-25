/**
 * Whale Wallet Tracking Page
 *
 * Track and get alerts on major wallet movements (whales).
 * Free users: 24h delayed data, 3 alerts, top 10 whales
 * Premium: real-time, unlimited alerts, custom tracking
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Fish,
  Bell,
  Check,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { RelatedPages } from '../components/InternalLinks';
import {
  hasWhaleTrackingPremium,
  WHALE_TRACKING_PRICING,
} from '../services/subscriptionLimits';
import {
  getWhaleWallets,
  getWhaleTransactions,
  getWhaleActivity,
  getUserWhaleAlerts,
} from '../services/whaleTracking';
import type {
  WhaleWallet,
  WhaleTransaction,
  WhaleActivity,
  WhaleAlert,
} from '../types/premiumFeatures';

export default function WhaleTrackingPage() {
  const { user, profile } = useAuth();
  const [wallets, setWallets] = useState<WhaleWallet[]>([]);
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [activity, setActivity] = useState<WhaleActivity | null>(null);
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [isLoading, setIsLoading] = useState(true);

  const hasAccess = hasWhaleTrackingPremium(undefined, profile?.subscription_status);

  useEffect(() => {
    loadData();
  }, [hasAccess, selectedChain]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [walletData, txData, activityData, alertData] = await Promise.all([
        getWhaleWallets(hasAccess, { chain: selectedChain }),
        getWhaleTransactions(hasAccess, { chain: selectedChain }),
        getWhaleActivity(selectedChain, hasAccess),
        user?.id ? getUserWhaleAlerts(user.id, hasAccess) : Promise.resolve([]),
      ]);
      setWallets(walletData);
      setTransactions(txData);
      setActivity(activityData);
      setAlerts(alertData);
    } catch (err) {
      console.error('Failed to load whale data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function formatAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function formatAmount(amount: number) {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        pageKey="whaleTracking"
        isTool
        toolName="Cryptocurrency Whale Tracker"
        urlPath="/whale-tracking"
        faqs={[
          {
            question: 'What is a crypto whale?',
            answer: 'A crypto whale is an individual or entity that holds a large amount of cryptocurrency. Whale movements can significantly impact market prices.',
          },
          {
            question: 'Why should I track whale wallets?',
            answer: 'Tracking whale wallets can provide insights into market sentiment and potential price movements. Large inflows to exchanges often signal selling pressure.',
          },
        ]}
      />
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Fish className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Whale Tracker
            </h1>
            <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full">
              {hasAccess ? 'PREMIUM' : 'LIMITED'}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track major wallet movements and follow the smart money.
            {!hasAccess && ' Data is 24 hours delayed for free users.'}
          </p>
        </div>

        {/* Chain Selector */}
        <div className="flex gap-2 mb-6">
          {['ethereum', 'bitcoin'].map(chain => (
            <button
              key={chain}
              onClick={() => setSelectedChain(chain)}
              className={`px-4 py-2 rounded-lg font-medium capitalize ${
                selectedChain === chain
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>

        {/* Activity Summary */}
        {activity && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <span className="text-gray-600 dark:text-gray-400 text-sm">24h Volume</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(activity.total_volume_24h)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Net Exchange Flow</span>
              <p className={`text-2xl font-bold ${activity.net_exchange_flow >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {activity.net_exchange_flow >= 0 ? '+' : ''}{formatAmount(activity.net_exchange_flow)}
              </p>
              <p className="text-xs text-gray-500">
                {activity.net_exchange_flow >= 0 ? 'Inflow (bearish)' : 'Outflow (bullish)'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Large Transactions</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activity.large_transactions_count}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Market Sentiment</span>
              <p className={`text-2xl font-bold capitalize ${
                activity.sentiment === 'bullish' ? 'text-green-500' :
                activity.sentiment === 'bearish' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {activity.sentiment}
              </p>
              <p className="text-xs text-gray-500">Score: {activity.sentiment_score}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Whale Transactions
                  </h2>
                  {!hasAccess && (
                    <span className="flex items-center gap-1 text-sm text-yellow-600">
                      <Clock className="h-4 w-4" />
                      24h delayed
                    </span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map(tx => (
                  <div key={tx.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {tx.transaction_type.includes('deposit') ? (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        ) : tx.transaction_type.includes('withdrawal') ? (
                          <ArrowDownRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-blue-500" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {tx.transaction_type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatAmount(tx.amount_usd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-500">
                        <span>{tx.from_label || formatAddress(tx.from_address)}</span>
                        <span className="mx-2">→</span>
                        <span>{tx.to_label || formatAddress(tx.to_address)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </span>
                        <a
                          href={`https://etherscan.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        tx.from_category === 'exchange' ? 'bg-blue-100 text-blue-700' :
                        tx.from_category === 'whale' ? 'bg-purple-100 text-purple-700' :
                        tx.from_category === 'institution' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tx.from_category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {tx.amount.toLocaleString()} {tx.asset_symbol}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Whales & Alerts */}
          <div className="space-y-6">
            {/* User Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Your Alerts
                </h3>
                <button
                  disabled={!hasAccess && alerts.length >= 3}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-500">No alerts configured</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.alert_type.join(', ').replace(/_/g, ' ')}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${alert.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Min: {formatAmount(alert.min_amount_usd)} | Triggered: {alert.triggered_count}x
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {!hasAccess && (
                <p className="text-xs text-gray-500 mt-2">Free tier: 3 alerts max</p>
              )}
            </div>

            {/* Top Wallets */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Whale Wallets</h3>
              <div className="space-y-3">
                {wallets.slice(0, 5).map((wallet, i) => (
                  <div key={wallet.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center text-sm font-bold bg-gray-100 dark:bg-gray-700 rounded">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {wallet.label || formatAddress(wallet.address)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{wallet.category}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(wallet.balance_usd)}
                    </span>
                  </div>
                ))}
              </div>
              {!hasAccess && (
                <p className="text-xs text-gray-500 mt-4">Free tier: Top 10 wallets only</p>
              )}
            </div>
          </div>
        </div>

        {/* Premium Upsell */}
        {!hasAccess && (
          <div className="mt-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Unlock Real-Time Whale Tracking</h2>
                <p className="text-blue-100 mb-6">
                  Get instant alerts when whales move. Premium subscribers get real-time data and unlimited tracking.
                </p>
                <ul className="space-y-3 mb-6">
                  {WHALE_TRACKING_PRICING.features.premium.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">${WHALE_TRACKING_PRICING.price_monthly}</span>
                  <span className="text-blue-200">/month</span>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
                >
                  Subscribe Now
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <Fish className="h-32 w-32 text-white/30" />
              </div>
            </div>
          </div>
        )}

        {/* Related Content */}
        <div className="mt-8">
          <RelatedPages currentPath="/whale-tracking" title="More Analytics" variant="list" />
        </div>
      </div>
    </div>
    </>
  );
}
