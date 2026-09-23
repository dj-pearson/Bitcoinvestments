import { useState, useEffect, useRef, useId, useCallback } from 'react';
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Download,
  Trash2,
  X,
  PieChart,
  Info,
  RefreshCw,
} from 'lucide-react';
import { cn, todayLocalISODate } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import {
  getPortfolio,
  createPortfolio,
  addHolding,
  refreshPortfolioPrices,
  removeHolding,
  exportPortfolioToCSV,
  deletePortfolio,
  getPortfolioAllocation,
  AssetLimitError,
} from '../services/portfolio';
import { fmtDateTime, fmtPct } from '../lib/marketFormat';
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

interface PriceStatus {
  fetchedAt: number | null;
  stale: boolean;
  error?: string;
  missingIds: string[];
}

function money(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function PortfolioTracker({ variant = 'full' }: PortfolioTrackerProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [priceStatus, setPriceStatus] = useState<PriceStatus | null>(null);
  const toast = useToast();

  const refreshPrices = useCallback(async (p: Portfolio) => {
    setUpdating(true);
    const result = await refreshPortfolioPrices(p);
    setPriceStatus({
      fetchedAt: result.fetchedAt,
      stale: result.stale,
      error: result.error,
      missingIds: result.missingIds,
    });
    setUpdating(false);
    // New object so React re-renders with the mutated holdings.
    return { ...result.portfolio, holdings: [...result.portfolio.holdings] };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let p: Portfolio | null = null;
      try {
        p = await getPortfolio();
      } catch {
        p = null;
      }
      if (cancelled) return;
      setPortfolio(p);
      setLoading(false);
      if (p && p.holdings.length > 0) {
        const refreshed = await refreshPrices(p);
        if (!cancelled) setPortfolio(refreshed);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshPrices]);

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
    a.download = `portfolio-${todayLocalISODate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported', 'Portfolio exported to a CSV file.');
  }

  function handleDelete() {
    if (confirm('Delete your whole portfolio from this browser? This cannot be undone. Export a CSV first if you want a backup.')) {
      deletePortfolio();
      setPortfolio(null);
      setPriceStatus(null);
      toast.info('Portfolio deleted', 'Your portfolio has been removed from this browser.');
    }
  }

  async function handleRemoveHolding(holdingId: string, label: string) {
    if (!portfolio) return;
    if (!confirm(`Remove ${label} and all its transactions from your portfolio?`)) return;
    try {
      const updated = await removeHolding(portfolio, holdingId);
      setPortfolio({ ...updated, holdings: [...updated.holdings] });
      toast.info('Holding removed', `${label} was removed.`);
    } catch (err) {
      toast.error('Could not remove holding', err instanceof Error ? err.message : undefined);
    }
  }

  const isLocal = portfolio?.user_id === 'local';

  if (loading) {
    return (
      <div className="glass-card p-6" aria-busy="true">
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
          <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-bold text-white mb-2">Track your holdings</h3>
          <p className="text-gray-400 text-sm mb-2 max-w-sm mx-auto">
            Add the coins you own to see their current value and profit or loss at today&apos;s prices.
          </p>
          <p className="text-gray-500 text-xs mb-6 max-w-sm mx-auto">
            Saved in this browser only. Nothing is sent to our servers except coin ids for price lookups.
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCreatePortfolio}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allocation = getPortfolioAllocation(portfolio);
  const missing = new Set(priceStatus?.missingIds ?? []);
  const missingCount = portfolio.holdings.filter((h) => missing.has(h.cryptocurrency_id)).length;

  const statusText = updating
    ? 'Updating prices…'
    : priceStatus?.fetchedAt
      ? `${priceStatus.stale ? 'Could not refresh; prices as of' : 'Prices as of'} ${fmtDateTime(priceStatus.fetchedAt)}`
      : priceStatus?.error
        ? 'Live prices unavailable right now'
        : portfolio.holdings.length > 0
          ? 'Live prices not loaded'
          : '';

  const onAdded = async (p: Portfolio) => {
    setPortfolio({ ...p, holdings: [...p.holdings] });
    setPortfolio(await refreshPrices(p));
  };

  const storageNote = isLocal ? (
    <p className="flex items-start gap-2 text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2 mb-4">
      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>
        Saved in this browser only. It is not synced to an account, and clearing your browser data deletes it. Use
        Export to keep a CSV backup.
      </span>
    </p>
  ) : null;

  const missingNote =
    missingCount > 0 && !updating ? (
      <p className="text-xs text-amber-300 mb-4" role="status">
        {missingCount === portfolio.holdings.length
          ? 'Live prices could not be loaded, so values below use your purchase prices.'
          : `No live price for ${missingCount} holding${missingCount === 1 ? '' : 's'}; those use the purchase price.`}{' '}
        <button type="button" className="underline" onClick={async () => setPortfolio(await refreshPrices(portfolio))}>
          Retry
        </button>
      </p>
    ) : null;

  if (variant === 'compact') {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Portfolio</h3>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            aria-label="Add holding"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {storageNote}
        {missingNote}

        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-white">{money(portfolio.total_value_usd)}</p>
          <div className={cn('flex items-center gap-1 text-sm', portfolio.total_profit_loss >= 0 ? 'text-green-400' : 'text-red-400')}>
            {portfolio.total_profit_loss >= 0 ? <TrendingUp className="w-4 h-4" aria-hidden="true" /> : <TrendingDown className="w-4 h-4" aria-hidden="true" />}
            {portfolio.total_profit_loss >= 0 ? '+' : '-'}
            {money(Math.abs(portfolio.total_profit_loss))} ({fmtPct(portfolio.total_profit_loss_percentage)})
          </div>
          {statusText && <p className="text-xs text-gray-500 mt-1">{statusText}</p>}
        </div>

        <ul className="space-y-2">
          {portfolio.holdings.slice(0, 3).map((holding) => (
            <li key={holding.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{holding.symbol}</span>
                <span className="text-xs text-gray-400">{holding.amount.toFixed(4)}</span>
              </span>
              <span className={cn('text-xs', holding.profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400')}>
                {missing.has(holding.cryptocurrency_id) ? '—' : fmtPct(holding.profit_loss_percentage, { digits: 1 })}
              </span>
            </li>
          ))}
          {portfolio.holdings.length > 3 && (
            <li className="text-xs text-gray-500 text-center pt-2">+{portfolio.holdings.length - 3} more</li>
          )}
        </ul>

        <AddHoldingModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          portfolio={portfolio}
          onUpdate={onAdded}
        />
      </div>
    );
  }

  // Full variant
  return (
    <div className="glass-card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Wallet className="w-5 h-5 text-orange-500" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{portfolio.name}</h3>
            {statusText && <p className="text-xs text-gray-400">{statusText}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add
          </button>
          {portfolio.holdings.length > 0 && (
            <button
              type="button"
              onClick={async () => setPortfolio(await refreshPrices(portfolio))}
              disabled={updating}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Refresh prices"
            >
              <RefreshCw className={cn('w-4 h-4', updating && 'animate-spin')} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Export portfolio as CSV"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Delete portfolio"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {storageNote}
      {missingNote}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Current Value</p>
          <p className="text-xl font-bold text-white">{money(portfolio.total_value_usd)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Cost Basis</p>
          <p className="text-xl font-bold text-white">{money(portfolio.total_cost_basis)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Profit/Loss</p>
          <p className={cn('text-xl font-bold', portfolio.total_profit_loss >= 0 ? 'text-green-400' : 'text-red-400')}>
            {portfolio.total_profit_loss >= 0 ? '+' : '-'}
            {money(Math.abs(portfolio.total_profit_loss))}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Return %</p>
          <p className={cn('text-xl font-bold', portfolio.total_profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400')}>
            {fmtPct(portfolio.total_profit_loss_percentage)}
          </p>
        </div>
      </div>

      {portfolio.holdings.length === 0 ? (
        <div className="text-center py-8">
          <PieChart className="w-10 h-10 text-gray-500 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-400">No holdings yet. Add your first coin.</p>
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
              <ul className="space-y-2">
                {portfolio.holdings.map((holding) => {
                  const noPrice = missing.has(holding.cryptocurrency_id);
                  return (
                    <li
                      key={holding.id}
                      className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0" aria-hidden="true">
                          {holding.symbol.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{holding.name}</p>
                          <p className="text-xs text-gray-400">
                            {holding.amount.toFixed(4)} {holding.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium text-white">{money(holding.current_value)}</p>
                          <p className={cn('text-xs', noPrice ? 'text-gray-500' : holding.profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400')}>
                            {noPrice ? 'no live price' : fmtPct(holding.profit_loss_percentage)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHolding(holding.id, holding.name)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                          aria-label={`Remove ${holding.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Allocation */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Allocation</h4>
              <ul className="space-y-2">
                {allocation.map((item) => (
                  <li key={item.symbol} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                    <div className="flex-grow">
                      <div className="flex justify-between text-sm">
                        <span className="text-white">{item.symbol}</span>
                        <span className="text-gray-400">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden" aria-hidden="true">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <AddHoldingModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        portfolio={portfolio}
        onUpdate={onAdded}
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
  portfolio: Portfolio | null;
  onUpdate: (p: Portfolio) => unknown;
}) {
  const [selectedCrypto, setSelectedCrypto] = useState(POPULAR_CRYPTOS[0]);
  const [amount, setAmount] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayLocalISODate());
  const [customCrypto, setCustomCrypto] = useState({ id: '', symbol: '', name: '' });
  const [useCustom, setUseCustom] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Escape to close, focus the first field, trap Tab, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const timer = setTimeout(() => firstFieldRef.current?.focus(), 0);
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open || !portfolio) return null;
  const activePortfolio = portfolio;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const crypto = useCustom ? customCrypto : selectedCrypto;

    if (!crypto.id || !crypto.symbol || !crypto.name) {
      setFormError('Please fill in the coin’s CoinGecko id, symbol and name.');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(crypto.id)) {
      setFormError('The CoinGecko id should look like “bitcoin” or “avalanche-2” (lowercase letters, numbers and dashes).');
      return;
    }

    const amountNum = Number(amount);
    const priceNum = Number(purchasePrice);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setFormError('Amount must be a number greater than zero.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setFormError('Purchase price must be a number greater than zero.');
      return;
    }
    if (purchaseDate && purchaseDate > todayLocalISODate()) {
      setFormError('Purchase date cannot be in the future.');
      return;
    }

    setSubmitting(true);
    try {
      const updatedPortfolio = await addHolding(
        activePortfolio,
        crypto.id,
        crypto.symbol,
        crypto.name,
        amountNum,
        priceNum,
        purchaseDate
      );
      await onUpdate(updatedPortfolio);
      toast.success('Holding added', `${crypto.symbol} has been added to your portfolio.`);

      setAmount('');
      setPurchasePrice('');
      setCustomCrypto({ id: '', symbol: '', name: '' });
      setUseCustom(false);
      onClose();
    } catch (err) {
      if (err instanceof AssetLimitError) {
        setFormError(
          `This tracker holds up to ${err.maxCount} different coins. Remove a holding to add a new coin, or add to a coin you already track.`
        );
      } else {
        setFormError(err instanceof Error ? err.message : 'Could not add the holding. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id={`${uid}-title`} className="text-lg font-bold text-white">Add Holding</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4" noValidate>
          {/* Crypto Selection */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-400 mb-2">Cryptocurrency</legend>
            {!useCustom ? (
              <>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {POPULAR_CRYPTOS.map((crypto) => (
                    <button
                      key={crypto.id}
                      type="button"
                      onClick={() => setSelectedCrypto(crypto)}
                      aria-pressed={selectedCrypto.id === crypto.id}
                      aria-label={crypto.name}
                      className={cn(
                        'p-2 rounded-lg text-xs font-medium transition-colors',
                        selectedCrypto.id === crypto.id ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      )}
                    >
                      {crypto.symbol}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setUseCustom(true)} className="text-xs text-orange-500 hover:underline">
                  Or add another coin
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <label htmlFor={`${uid}-cgid`} className="block text-xs text-gray-400">
                  CoinGecko id (from the coin’s CoinGecko URL, e.g. “bitcoin”)
                </label>
                <input
                  id={`${uid}-cgid`}
                  type="text"
                  placeholder="bitcoin"
                  value={customCrypto.id}
                  onChange={(e) => setCustomCrypto({ ...customCrypto, id: e.target.value.trim().toLowerCase() })}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={`${uid}-sym`} className="block text-xs text-gray-400 mb-1">Symbol</label>
                    <input
                      id={`${uid}-sym`}
                      type="text"
                      placeholder="BTC"
                      value={customCrypto.symbol}
                      onChange={(e) => setCustomCrypto({ ...customCrypto, symbol: e.target.value.toUpperCase() })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-name`} className="block text-xs text-gray-400 mb-1">Name</label>
                    <input
                      id={`${uid}-name`}
                      type="text"
                      placeholder="Bitcoin"
                      value={customCrypto.name}
                      onChange={(e) => setCustomCrypto({ ...customCrypto, name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <button type="button" onClick={() => setUseCustom(false)} className="text-xs text-orange-500 hover:underline">
                  Back to popular coins
                </button>
              </div>
            )}
          </fieldset>

          <div>
            <label htmlFor={`${uid}-amount`} className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
            <input
              ref={firstFieldRef}
              id={`${uid}-amount`}
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor={`${uid}-price`} className="block text-sm font-medium text-gray-400 mb-2">
              Purchase Price (USD per coin)
            </label>
            <input
              id={`${uid}-price`}
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor={`${uid}-date`} className="block text-sm font-medium text-gray-400 mb-2">Purchase Date</label>
            <input
              id={`${uid}-date`}
              type="date"
              value={purchaseDate}
              max={todayLocalISODate()}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {formError && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3" role="alert">
              {formError}
            </p>
          )}

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
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-60"
            >
              {submitting ? 'Adding…' : 'Add Holding'}
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
