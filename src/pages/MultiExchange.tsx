/**
 * Multi-Exchange Portfolio Aggregation Page
 *
 * Auto-sync portfolios across Coinbase, Binance, Kraken via API.
 * Free users: manual entry only
 * Premium: automatic syncing for unlimited exchanges
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  Check,
  ChevronRight,
  AlertCircle,
  Link2,
  Unlink,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  hasMultiExchangeAccess,
  MULTI_EXCHANGE_PRICING,
} from '../services/subscriptionLimits';
import {
  getConnectedExchanges,
  getAggregatedPortfolio,
  connectExchange,
  disconnectExchange,
  syncAllExchanges,
} from '../services/multiExchange';
import type {
  SupportedExchange,
  ExchangeCredentials,
  AggregatedPortfolio,
} from '../types/premiumFeatures';

import { PageSEO } from '../components/PageSEO';
const SUPPORTED_EXCHANGES_LIST = [
  { exchange: 'coinbase' as SupportedExchange, name: 'Coinbase', logo: '🟡' },
  { exchange: 'binance' as SupportedExchange, name: 'Binance', logo: '🟠' },
  { exchange: 'kraken' as SupportedExchange, name: 'Kraken', logo: '🟣' },
  { exchange: 'gemini' as SupportedExchange, name: 'Gemini', logo: '🔵' },
  { exchange: 'kucoin' as SupportedExchange, name: 'KuCoin', logo: '🟢' },
];

export default function MultiExchange() {
  const { user, profile } = useAuth();
  const [exchanges, setExchanges] = useState<ExchangeCredentials[]>([]);
  const [portfolio, setPortfolio] = useState<AggregatedPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasAccess = hasMultiExchangeAccess(
    undefined,
    profile?.subscription_status
  );

  useEffect(() => {
    loadData();
  }, [user?.id]);

  async function loadData() {
    setIsLoading(true);
    try {
      if (user?.id) {
        const connectedExchanges = await getConnectedExchanges(user.id);
        setExchanges(connectedExchanges);

        if (connectedExchanges.length > 0) {
          const portfolioData = await getAggregatedPortfolio(user.id);
          setPortfolio(portfolioData);
        }
      }
    } catch (err) {
      console.error('Failed to load exchange data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSync() {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      await syncAllExchanges(user.id);
      await loadData();
    } catch {
      setError('Failed to sync exchanges');
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDisconnect(credentialId: string) {
    if (!confirm('Are you sure you want to disconnect this exchange?')) return;
    try {
      await disconnectExchange(credentialId);
      await loadData();
    } catch {
      setError('Failed to disconnect exchange');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="multiExchange" urlPath="/multi-exchange" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ArrowLeftRight className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Multi-Exchange Portfolio
            </h1>
            <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
              PREMIUM
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Sync and track your portfolio across multiple exchanges in one place.
          </p>
        </div>

        {!hasAccess ? (
          /* Premium Upsell */
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-white mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Sync All Your Exchanges</h2>
                <p className="text-orange-100 mb-6">
                  Automatically import your portfolio from Coinbase, Binance, Kraken, and more. Get a unified view of all your crypto holdings.
                </p>
                <ul className="space-y-3 mb-6">
                  {MULTI_EXCHANGE_PRICING.features.premium.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">${MULTI_EXCHANGE_PRICING.price_monthly}</span>
                  <span className="text-orange-200">/month</span>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                >
                  Subscribe Now
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="relative">
                  <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center">
                    <ArrowLeftRight className="h-24 w-24 text-white/80" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <Link2 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Premium Content */
          <>
            {/* Portfolio Summary */}
            {portfolio && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Total Portfolio</span>
                    <button onClick={() => setShowBalances(!showBalances)} className="text-gray-400 hover:text-gray-600">
                      {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {showBalances ? `$${portfolio.total_value_usd.toLocaleString()}` : '••••••'}
                  </p>
                  <p className={`text-sm flex items-center gap-1 ${portfolio.total_change_24h_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {portfolio.total_change_24h_percent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {portfolio.total_change_24h_percent >= 0 ? '+' : ''}{portfolio.total_change_24h_percent.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">BTC Value</span>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {showBalances ? `₿ ${portfolio.total_value_btc.toFixed(4)}` : '••••'}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Exchanges Connected</span>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{portfolio.exchanges.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Assets Tracked</span>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{portfolio.holdings.length}</p>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Plus className="h-5 w-5" />
                Connect Exchange
              </button>
              <button
                onClick={handleSync}
                disabled={isSyncing || exchanges.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync All
              </button>
            </div>

            {/* Connected Exchanges */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Connected Exchanges</h2>
              {exchanges.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                  <ArrowLeftRight className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No Exchanges Connected
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Connect your first exchange to start syncing your portfolio.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    <Plus className="h-5 w-5" />
                    Connect Exchange
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {exchanges.map(exchange => (
                    <div key={exchange.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                            {SUPPORTED_EXCHANGES_LIST.find(e => e.exchange === exchange.exchange)?.logo || '🔷'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{exchange.exchange}</h3>
                            <p className="text-sm text-gray-500">
                              Last synced: {exchange.last_synced_at ? new Date(exchange.last_synced_at).toLocaleString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            exchange.connection_status === 'connected'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {exchange.connection_status}
                          </span>
                          <button
                            onClick={() => handleDisconnect(exchange.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Holdings */}
            {portfolio && portfolio.holdings.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Holdings Breakdown</h3>
                <div className="space-y-4">
                  {portfolio.holdings.slice(0, 10).map((holding, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                          {holding.asset_symbol.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{holding.asset_symbol}</p>
                          <p className="text-xs text-gray-500">
                            {holding.by_exchange.map(e => e.exchange).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {showBalances ? `$${holding.total_usd_value.toLocaleString()}` : '••••'}
                        </p>
                        <p className="text-xs text-gray-500">{holding.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Manual Entry Section for Free Users */}
        {!hasAccess && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manual Portfolio Entry</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              As a free user, you can manually track your portfolio. Upgrade to Premium for automatic syncing.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              Go to Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Add Exchange Modal */}
        {showAddModal && (
          <AddExchangeModal
            onClose={() => setShowAddModal(false)}
            onAdd={async (exchange, apiKey, apiSecret) => {
              const result = await connectExchange(user?.id || '', exchange, apiKey, apiSecret);
              if (result.success) {
                setShowAddModal(false);
                loadData();
              } else {
                setError(result.error || 'Failed to connect exchange');
              }
            }}
          />
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-2 hover:opacity-80">×</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddExchangeModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (exchange: SupportedExchange, apiKey: string, apiSecret: string) => Promise<void>;
}) {
  const [exchange, setExchange] = useState<SupportedExchange>('coinbase');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    await onAdd(exchange, apiKey, apiSecret);
    setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-[calc(100vw-1rem)] sm:max-w-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Connect Exchange</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl p-2 touch-target-sm">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exchange
            </label>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value as SupportedExchange)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {SUPPORTED_EXCHANGES_LIST.map(ex => (
                <option key={ex.exchange} value={ex.exchange}>{ex.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter your API secret"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Security Note:</strong> Only use read-only API keys. We never request withdrawal permissions.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Connecting...' : 'Connect Exchange'}
          </button>
        </form>
      </div>
    </div>
  );
}
