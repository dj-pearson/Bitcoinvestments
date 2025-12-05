import { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Download,
  Trash2,
  X,
  PieChart,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  getPortfolio,
  createPortfolio,
  addHolding,
  updatePortfolioPrices,
  exportPortfolioToCSV,
  deletePortfolio,
  getPortfolioAllocation,
} from '../services/portfolio';
import { PortfolioChart } from './charts';
import type { Portfolio } from '../types';

interface PortfolioTrackerProps {
  variant?: 'full' | 'compact';
}

// Popular cryptocurrencies for quick selection
const POPULAR_CRYPTOS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
];

export function PortfolioTracker({ variant = 'full' }: PortfolioTrackerProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function loadPortfolio() {
    setLoading(true);
    let p = await getPortfolio();

    if (p && p.holdings.length > 0) {
      setUpdating(true);
      p = await updatePortfolioPrices(p);
      setUpdating(false);
    }

    setPortfolio(p);
    setLoading(false);
  }

  async function handleCreatePortfolio() {
    const p = await createPortfolio('My Portfolio');
    setPortfolio(p);
    setShowAddModal(true);
  }

  function handleExport() {
    if (!portfolio) return;

    const csv = exportPortfolioToCSV(portfolio);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDelete() {
    if (confirm('Are you sure you want to delete your portfolio? This cannot be undone.')) {
      deletePortfolio();
      setPortfolio(null);
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="h-20 bg-gray-700 rounded" />
          <div className="h-32 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  // No portfolio - show create option
  if (!portfolio) {
    return (
      <div className="glass-card p-6">
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Track Your Portfolio</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Add your crypto holdings to track performance and see real-time values.
          </p>
          <button
            onClick={handleCreatePortfolio}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Portfolio
          </button>
        </div>
      </div>
    );
  }

  const allocation = getPortfolioAllocation(portfolio);

  if (variant === 'compact') {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Portfolio</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-white">
            ${portfolio.total_value_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <div className={cn(
            'flex items-center gap-1 text-sm',
            portfolio.total_profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {portfolio.total_profit_loss >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {portfolio.total_profit_loss >= 0 ? '+' : ''}
            ${portfolio.total_profit_loss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            ({portfolio.total_profit_loss_percentage.toFixed(2)}%)
          </div>
        </div>

        <div className="space-y-2">
          {portfolio.holdings.slice(0, 3).map((holding) => (
            <div key={holding.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{holding.symbol}</span>
                <span className="text-xs text-gray-400">{holding.amount.toFixed(4)}</span>
              </div>
              <span className={cn(
                'text-xs',
                holding.profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {holding.profit_loss_percentage >= 0 ? '+' : ''}
                {holding.profit_loss_percentage.toFixed(1)}%
              </span>
            </div>
          ))}
          {portfolio.holdings.length > 3 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              +{portfolio.holdings.length - 3} more
            </p>
          )}
        </div>

        <AddHoldingModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          portfolio={portfolio}
          onUpdate={(p) => setPortfolio(p)}
        />
      </div>
    );
  }

  // Full variant
  return (
    <div className="glass-card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Wallet className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{portfolio.name}</h3>
            <p className="text-xs text-gray-400">
              {updating ? 'Updating prices...' : `Updated ${new Date(portfolio.updated_at).toLocaleTimeString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
          <button
            onClick={handleExport}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
            title="Delete Portfolio"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Value</p>
          <p className="text-xl font-bold text-white">
            ${portfolio.total_value_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Cost Basis</p>
          <p className="text-xl font-bold text-white">
            ${portfolio.total_cost_basis.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Profit/Loss</p>
          <p className={cn(
            'text-xl font-bold',
            portfolio.total_profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {portfolio.total_profit_loss >= 0 ? '+' : ''}
            ${portfolio.total_profit_loss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Return %</p>
          <p className={cn(
            'text-xl font-bold',
            portfolio.total_profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {portfolio.total_profit_loss_percentage >= 0 ? '+' : ''}
            {portfolio.total_profit_loss_percentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {portfolio.holdings.length === 0 ? (
        <div className="text-center py-8">
          <PieChart className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No holdings yet. Add your first crypto!</p>
        </div>
      ) : (
        <>
          {/* Portfolio Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <PortfolioChart portfolio={portfolio} type="performance" height={250} />
            <PortfolioChart portfolio={portfolio} type="allocation" height={250} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Holdings List */}
            <div className="lg:col-span-2">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Holdings</h4>
            <div className="space-y-2">
              {portfolio.holdings.map((holding) => (
                <div
                  key={holding.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white">
                      {holding.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{holding.name}</p>
                      <p className="text-xs text-gray-400">
                        {holding.amount.toFixed(4)} {holding.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">
                      ${holding.current_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className={cn(
                      'text-xs',
                      holding.profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {holding.profit_loss_percentage >= 0 ? '+' : ''}
                      {holding.profit_loss_percentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">Allocation</h4>
            <div className="space-y-2">
              {allocation.map((item) => (
                <div key={item.symbol} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-grow">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{item.symbol}</span>
                      <span className="text-gray-400">{item.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
      )}

      <AddHoldingModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        portfolio={portfolio}
        onUpdate={(p) => setPortfolio(p)}
      />
    </div>
  );
}

// Add Holding Modal
function AddHoldingModal({
  open,
  onClose,
  portfolio,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio;
  onUpdate: (p: Portfolio) => void;
}) {
  const [selectedCrypto, setSelectedCrypto] = useState(POPULAR_CRYPTOS[0]);
  const [amount, setAmount] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [customCrypto, setCustomCrypto] = useState({ id: '', symbol: '', name: '' });
  const [useCustom, setUseCustom] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const crypto = useCustom ? customCrypto : selectedCrypto;

    if (!crypto.id || !crypto.symbol || !crypto.name) {
      alert('Please fill in all crypto details');
      return;
    }

    if (!amount || !purchasePrice) {
      alert('Please fill in amount and purchase price');
      return;
    }

    const updatedPortfolio = await addHolding(
      portfolio,
      crypto.id,
      crypto.symbol,
      crypto.name,
      parseFloat(amount),
      parseFloat(purchasePrice),
      purchaseDate
    );

    // Update prices for the new holding
    const withPrices = await updatePortfolioPrices(updatedPortfolio);
    onUpdate(withPrices);

    // Reset form
    setAmount('');
    setPurchasePrice('');
    setCustomCrypto({ id: '', symbol: '', name: '' });
    setUseCustom(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">Add Holding</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Crypto Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Cryptocurrency
            </label>
            {!useCustom ? (
              <>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {POPULAR_CRYPTOS.map((crypto) => (
                    <button
                      key={crypto.id}
                      type="button"
                      onClick={() => setSelectedCrypto(crypto)}
                      className={cn(
                        'p-2 rounded-lg text-xs font-medium transition-colors',
                        selectedCrypto.id === crypto.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      )}
                    >
                      {crypto.symbol}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className="text-xs text-orange-500 hover:underline"
                >
                  Or add custom crypto
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="CoinGecko ID (e.g., bitcoin)"
                  value={customCrypto.id}
                  onChange={(e) => setCustomCrypto({ ...customCrypto, id: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Symbol (e.g., BTC)"
                    value={customCrypto.symbol}
                    onChange={(e) => setCustomCrypto({ ...customCrypto, symbol: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={customCrypto.name}
                    onChange={(e) => setCustomCrypto({ ...customCrypto, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setUseCustom(false)}
                  className="text-xs text-orange-500 hover:underline"
                >
                  Back to popular cryptos
                </button>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          {/* Purchase Price */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Purchase Price (USD per unit)
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Purchase Date
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
            >
              Add Holding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Compact version for sidebar
export function PortfolioCompact() {
  return <PortfolioTracker variant="compact" />;
}
