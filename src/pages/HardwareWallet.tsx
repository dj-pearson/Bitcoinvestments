/**
 * Hardware Wallet Integration Page
 *
 * Premium feature for tracking cold storage with Ledger/Trezor devices.
 * $14.99/month or bundled. Partner affiliate revenue from hardware sales.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HardDrive,
  Plus,
  RefreshCw,
  Shield,
  Wallet,
  ExternalLink,
  ChevronRight,
  Check,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  HARDWARE_WALLET_PRICING,
  HARDWARE_WALLET_AFFILIATES,
  hasHardwareWalletAccess,
  getHardwareWalletLimits,
  getSupportedChains,
  addHardwareWalletManually,
  syncWalletBalances,
  getPortfolioSummary,
  getUserWallets,
  getWalletAddresses,
  removeWallet,
  exportWalletData,
  trackAffiliateClick,
} from '../services/hardwareWallet';
import type {
  HardwareWallet,
  HardwareWalletAddress,
  HardwareWalletType,
  HardwareWalletPortfolioSummary,
  HardwareWalletSubscription,
} from '../types/premiumFeatures';

import { PageSEO } from '../components/PageSEO';
export default function HardwareWalletPage() {
  const { user } = useAuth();
  const [subscription] = useState<HardwareWalletSubscription | null>(null);
  const [wallets, setWallets] = useState<HardwareWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<HardwareWallet | null>(null);
  const [, setAddresses] = useState<HardwareWalletAddress[]>([]);
  const [portfolio, setPortfolio] = useState<HardwareWalletPortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasAccess = hasHardwareWalletAccess(subscription);
  const limits = getHardwareWalletLimits(subscription);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  async function loadData() {
    setIsLoading(true);
    try {
      if (user?.id) {
        const userWallets = getUserWallets(user.id);
        setWallets(userWallets);

        const portfolioData = await getPortfolioSummary(user.id);
        setPortfolio(portfolioData);
      }
    } catch (err) {
      console.error('Failed to load hardware wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSync() {
    if (!selectedWallet) return;
    setIsSyncing(true);
    try {
      await syncWalletBalances(selectedWallet.id);
      await loadData();
    } catch {
      setError('Failed to sync wallet balances');
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleExport(format: 'csv' | 'json') {
    if (!user?.id) return;
    const { data, filename, error } = await exportWalletData(user.id, format);
    if (error) {
      setError(error);
      return;
    }

    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="hardwareWallet" urlPath="/hardware-wallet" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Hardware Wallet Integration
            </h1>
            <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
              PREMIUM
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Securely track your cold storage assets across Ledger, Trezor, and other hardware wallets.
          </p>
        </div>

        {!hasAccess ? (
          /* Premium Upsell */
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Unlock Hardware Wallet Tracking</h2>
                <p className="text-blue-100 mb-6">
                  Track your cold storage holdings in real-time. Connect your Ledger, Trezor, or other hardware wallets for complete portfolio visibility.
                </p>
                <ul className="space-y-3 mb-6">
                  {HARDWARE_WALLET_PRICING.monthly.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">${HARDWARE_WALLET_PRICING.monthly.price}</span>
                  <span className="text-blue-200">/month</span>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Subscribe Now
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="relative">
                  <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center">
                    <HardDrive className="h-24 w-24 text-white/80" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="h-8 w-8 text-white" />
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
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Total Value</span>
                    <button onClick={() => setShowBalances(!showBalances)} className="text-gray-400 hover:text-gray-600">
                      {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {showBalances ? `$${portfolio.total_value_usd.toLocaleString()}` : '••••••'}
                  </p>
                  <p className={`text-sm ${portfolio.total_change_24h_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {portfolio.total_change_24h_percent >= 0 ? '+' : ''}{portfolio.total_change_24h_percent.toFixed(2)}% (24h)
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Wallets Connected</span>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{portfolio.wallets_connected}</p>
                  <p className="text-sm text-gray-500">of {limits.maxDevices} allowed</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Total Addresses</span>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{portfolio.total_addresses}</p>
                  <p className="text-sm text-gray-500">of {limits.maxAddresses} allowed</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Chains Tracked</span>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{portfolio.holdings_by_chain.length}</p>
                  <div className="flex gap-1 mt-1">
                    {portfolio.holdings_by_chain.slice(0, 4).map((chain, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {chain.chain}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => setShowAddModal(true)}
                disabled={wallets.length >= limits.maxDevices}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
                Add Wallet
              </button>
              <button
                onClick={handleSync}
                disabled={isSyncing || wallets.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync All
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={wallets.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
            </div>

            {/* Wallets List */}
            {wallets.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                <HardDrive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Hardware Wallets Connected
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Add your first hardware wallet to start tracking your cold storage.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Wallet
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {wallets.map(wallet => (
                  <div key={wallet.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{wallet.device_name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{wallet.wallet_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedWallet(wallet);
                            setAddresses(getWalletAddresses(wallet.id));
                          }}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        >
                          View Addresses
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to remove this wallet?')) {
                              await removeWallet(wallet.id);
                              loadData();
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Chain Distribution */}
            {portfolio && portfolio.holdings_by_chain.length > 0 && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Holdings by Chain</h3>
                <div className="space-y-3">
                  {portfolio.holdings_by_chain.map((chain, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{chain.chain}</span>
                        <span className="text-gray-900 dark:text-white">
                          {showBalances ? `$${chain.value_usd.toLocaleString()}` : '••••'} ({chain.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${chain.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Buy Hardware Wallet Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Don't Have a Hardware Wallet?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Protect your crypto with a hardware wallet. We recommend these trusted brands:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(HARDWARE_WALLET_AFFILIATES).map(([key, brand]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{brand.name}</h3>
                <div className="space-y-3 mb-6">
                  {brand.products.map((product, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">${product.price}</span>
                    </div>
                  ))}
                </div>
                <a
                  href={brand.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackAffiliateClick(user?.id || null, key as 'ledger' | 'trezor', 'general')}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Shop {brand.name}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Add Wallet Modal */}
        {showAddModal && (
          <AddWalletModal
            onClose={() => setShowAddModal(false)}
            onAdd={async (type, name, addrs) => {
              if (!user?.id) return;
              const result = await addHardwareWalletManually(user.id, type, name, addrs);
              if (result.error) {
                setError(result.error);
              } else {
                setShowAddModal(false);
                loadData();
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

// Add Wallet Modal Component
function AddWalletModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (type: HardwareWalletType, name: string, addresses: { address: string; chain: string; label?: string }[]) => void;
}) {
  const [step, setStep] = useState<'type' | 'addresses'>('type');
  const [walletType, setWalletType] = useState<HardwareWalletType>('ledger');
  const [deviceName, setDeviceName] = useState('');
  const [addressInputs, setAddressInputs] = useState([{ address: '', chain: 'ethereum', label: '' }]);

  const supportedChains = getSupportedChains(walletType);

  function addAddressInput() {
    setAddressInputs([...addressInputs, { address: '', chain: 'ethereum', label: '' }]);
  }

  function updateAddress(index: number, field: 'address' | 'chain' | 'label', value: string) {
    const updated = [...addressInputs];
    updated[index][field] = value;
    setAddressInputs(updated);
  }

  function removeAddressInput(index: number) {
    setAddressInputs(addressInputs.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const validAddresses = addressInputs.filter(a => a.address.trim());
    if (validAddresses.length === 0) return;
    onAdd(walletType, deviceName || `My ${walletType}`, validAddresses);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Hardware Wallet</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>

        <div className="p-6">
          {step === 'type' ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Select your hardware wallet type:</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(['ledger', 'trezor', 'keepkey', 'coldcard'] as HardwareWalletType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setWalletType(type)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      walletType === type
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">{type}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {getSupportedChains(type).length} chains supported
                    </p>
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Device name (optional)"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              />
              <button
                onClick={() => setStep('addresses')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Enter your wallet addresses:</p>
              <div className="space-y-3 mb-4">
                {addressInputs.map((input, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={input.chain}
                      onChange={(e) => updateAddress(index, 'chain', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {supportedChains.map(chain => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Address"
                      value={input.address}
                      onChange={(e) => updateAddress(index, 'address', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    {addressInputs.length > 1 && (
                      <button
                        onClick={() => removeAddressInput(index)}
                        className="px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addAddressInput}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-6"
              >
                + Add Another Address
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('type')}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!addressInputs.some(a => a.address.trim())}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Wallet
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
