/**
 * Gas Fee Optimizer Page
 *
 * Predict optimal times for Ethereum transactions to minimize gas fees.
 * Free: Basic current prices, 3 alerts
 * Premium: Real-time predictions, unlimited alerts
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Fuel,
  TrendingDown,
  Clock,
  Bell,
  AlertCircle,
  Check,
  ChevronRight,
  RefreshCw,
  Zap,
  DollarSign,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  SUPPORTED_GAS_CHAINS,
  GAS_OPTIMIZER_PRICING,
  getCurrentGasPrices,
  getGasPricePredictions,
  createGasAlert,
  getUserGasAlerts,
  deleteGasAlert,
  toggleGasAlert,
  estimateTransactionCost,
  formatGasPrice,
  getRecommendedTier,
} from '../services/gasOptimizer';
import { GAS_USAGE_ESTIMATES } from '../types/premiumFeatures';
import type { GasPriceData, GasPricePrediction, GasAlert, GasPriceTier } from '../types/premiumFeatures';

import { PageSEO } from '../components/PageSEO';
export default function GasOptimizerPage() {
  const { user } = useAuth();
  const [isPremium] = useState(false); // Would check subscription
  const [gasPrices, setGasPrices] = useState<GasPriceData[]>([]);
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [prediction, setPrediction] = useState<GasPricePrediction | null>(null);
  const [alerts, setAlerts] = useState<GasAlert[]>([]);
  const [selectedTier, setSelectedTier] = useState<GasPriceTier>('standard');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isPremium && selectedChain) {
      loadPrediction();
    }
  }, [selectedChain, isPremium]);

  async function loadData() {
    setIsLoading(true);
    try {
      const prices = await getCurrentGasPrices();
      setGasPrices(prices);

      if (user?.id) {
        setAlerts(getUserGasAlerts(user.id));
      }
    } catch (err) {
      console.error('Failed to load gas prices:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPrediction() {
    try {
      const pred = await getGasPricePredictions(selectedChain);
      setPrediction(pred);
    } catch (err) {
      console.error('Failed to load predictions:', err);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }

  const currentChainData = gasPrices.find(p => p.chain === selectedChain);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="gasOptimizer" urlPath="/gas-optimizer" isTool toolName="Gas Fee Optimizer" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Fuel className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gas Fee Optimizer
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track gas prices and find the optimal time for your transactions.
          </p>
        </div>

        {/* Chain Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SUPPORTED_GAS_CHAINS.map(chain => (
            <button
              key={chain.id}
              onClick={() => setSelectedChain(chain.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedChain === chain.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {chain.name}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : currentChainData ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Current Gas Prices */}
            <div className="lg:col-span-2 space-y-6">
              {/* Price Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['slow', 'standard', 'fast', 'instant'] as GasPriceTier[]).map(tier => {
                  const priceKey = `gas_price_${tier}` as keyof GasPriceData;
                  const gasPrice = currentChainData[priceKey] as number;
                  const isSelected = selectedTier === tier;

                  return (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{tier}</span>
                        {tier === 'standard' && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatGasPrice(gasPrice)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ~{getRecommendedTier(tier === 'slow' ? 'low' : tier === 'instant' ? 'immediate' : tier === 'fast' ? 'high' : 'medium').waitTime}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Transaction Cost Estimates */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Transaction Cost Estimates ({selectedTier})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { type: 'eth_transfer', label: 'ETH Transfer', icon: ArrowRight },
                    { type: 'erc20_transfer', label: 'Token Transfer', icon: ArrowRight },
                    { type: 'uniswap_v3_swap', label: 'Uniswap Swap', icon: Zap },
                    { type: 'nft_mint', label: 'NFT Mint', icon: Zap },
                    { type: 'staking', label: 'Stake', icon: DollarSign },
                    { type: 'contract_deployment', label: 'Deploy Contract', icon: Zap },
                  ].map(({ type, label, icon: Icon }) => {
                    const estimate = estimateTransactionCost(
                      currentChainData,
                      type as keyof typeof GAS_USAGE_ESTIMATES,
                      selectedTier
                    );
                    return (
                      <div key={type} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ${estimate.costUsd.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {estimate.gasUsed.toLocaleString()} gas
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optimal Time Windows (Premium) */}
              {isPremium && prediction ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Optimal Transaction Windows
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {prediction.optimal_time_windows.map((window, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(window.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {new Date(window.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(window.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400">
                            Save {window.savings_percent.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ~{formatGasPrice(window.predicted_price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !isPremium ? (
                /* Premium Upsell */
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">Unlock Gas Predictions</h3>
                      <p className="text-orange-100 mb-4">
                        Get AI-powered predictions for optimal transaction timing and save up to 50% on gas fees.
                      </p>
                      <ul className="space-y-2 mb-4">
                        {GAS_OPTIMIZER_PRICING.premium.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/pricing"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50"
                      >
                        Upgrade for ${GAS_OPTIMIZER_PRICING.premium.price_monthly}/mo
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <TrendingDown className="h-16 w-16 text-white/30" />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Sidebar - Alerts */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Network Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base Fee</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatGasPrice(currentChainData.base_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Priority Fee</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatGasPrice(currentChainData.priority_fee_standard)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(currentChainData.updated_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Alerts */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Price Alerts</h3>
                  </div>
                  <button
                    onClick={() => setShowAlertModal(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {alerts.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Get notified when gas prices drop
                    </p>
                    <button
                      onClick={() => setShowAlertModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Create your first alert
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border ${
                          alert.is_active
                            ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {alert.chain}
                            </p>
                            <p className="text-xs text-gray-500">
                              Alert when {alert.condition} {alert.threshold_gwei} Gwei
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                if (user?.id) {
                                  await toggleGasAlert(user.id, alert.id);
                                  setAlerts(getUserGasAlerts(user.id));
                                }
                              }}
                              className={`w-10 h-6 rounded-full transition-colors ${
                                alert.is_active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                  alert.is_active ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <button
                              onClick={async () => {
                                if (user?.id) {
                                  await deleteGasAlert(user.id, alert.id);
                                  setAlerts(getUserGasAlerts(user.id));
                                }
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  {alerts.length} of {isPremium ? 50 : 3} alerts used
                </p>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Gas Saving Tips</h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Gas is typically lowest on weekends and between 2-6 AM UTC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Batch multiple transactions when possible to save on gas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Use Layer 2 networks (Arbitrum, Optimism) for lower fees</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Failed to load gas prices. Please try again.</p>
          </div>
        )}

        {/* Create Alert Modal */}
        {showAlertModal && (
          <CreateAlertModal
            chain={selectedChain}
            currentPrice={currentChainData?.gas_price_standard || 0}
            onClose={() => setShowAlertModal(false)}
            onCreate={async (chain, threshold, condition) => {
              if (!user?.id) return;
              const { error } = await createGasAlert(user.id, chain, threshold, condition);
              if (error) {
                setError(error);
              } else {
                setAlerts(getUserGasAlerts(user.id));
                setShowAlertModal(false);
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

// Create Alert Modal
function CreateAlertModal({
  chain,
  currentPrice,
  onClose,
  onCreate,
}: {
  chain: string;
  currentPrice: number;
  onClose: () => void;
  onCreate: (chain: string, threshold: number, condition: 'below' | 'above') => void;
}) {
  const [threshold, setThreshold] = useState(Math.floor(currentPrice * 0.8));
  const [condition, setCondition] = useState<'below' | 'above'>('below');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-[calc(100vw-1rem)] sm:max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Gas Alert</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alert Condition
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setCondition('below')}
                className={`flex-1 py-3 rounded-lg border-2 font-medium ${
                  condition === 'below'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Below
              </button>
              <button
                onClick={() => setCondition('above')}
                className={`flex-1 py-3 rounded-lg border-2 font-medium ${
                  condition === 'above'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Above
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Threshold (Gwei)
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-sm text-gray-500 mt-1">
              Current price: {formatGasPrice(currentPrice)}
            </p>
          </div>

          <button
            onClick={() => onCreate(chain, threshold, condition)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Create Alert
          </button>
        </div>
      </div>
    </div>
  );
}
