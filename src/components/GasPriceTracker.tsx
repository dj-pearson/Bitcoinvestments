import { useState, useEffect, useCallback } from 'react';
import {
  Fuel,
  RefreshCw,
  AlertCircle,
  Zap,
  Clock,
  ArrowRight,
  Send,
  Repeat,
  ImagePlus,
} from 'lucide-react';
import type { SupportedChain } from '../types';
import {
  getAllGasPrices,
  getGasPriceForChain,
  formatGasPrice,
  getChainStyle,
  type ChainGasStatus,
} from '../services/gasPrice';
import { cn } from '../lib/utils';

interface GasPriceTrackerProps {
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  chains?: SupportedChain[];
  /** Polling interval in ms. The server refreshes its snapshot every ~15 s. */
  refreshInterval?: number;
}

// Chain logos/icons mapping
const CHAIN_ICONS: Record<SupportedChain, string> = {
  ethereum: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
  polygon: 'https://cryptologos.cc/logos/polygon-matic-logo.svg',
  arbitrum: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg',
  optimism: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg',
  bsc: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg',
  avalanche: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg',
  base: 'https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg',
};

function formatTime(ms: number | null): string {
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatUsd(value: number): string {
  if (value > 0 && value < 0.01) return '<$0.01';
  return `$${value.toFixed(2)}`;
}

export function GasPriceTracker({
  className,
  variant = 'full',
  chains,
  refreshInterval = 60000,
}: GasPriceTrackerProps) {
  const [gasPrices, setGasPrices] = useState<ChainGasStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChain, setSelectedChain] = useState<SupportedChain>('ethereum');
  const chainKey = chains?.join(',') ?? '';

  const fetchGasPrices = useCallback(async (force = false) => {
    if (force) setIsRefreshing(true);
    try {
      const list = chainKey
        ? await Promise.all((chainKey.split(',') as SupportedChain[]).map((c) => getGasPriceForChain(c, { force })))
        : await getAllGasPrices({ force });
      setGasPrices(list);
      setLastChecked(Date.now());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [chainKey]);

  useEffect(() => {
    fetchGasPrices();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchGasPrices();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchGasPrices, refreshInterval]);

  const anyAvailable = gasPrices.some((g) => g.available);

  if (variant === 'minimal') {
    return (
      <GasPriceMinimal
        className={className}
        gasPrices={gasPrices}
        loading={loading}
        onRefresh={() => fetchGasPrices(true)}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <GasPriceCompact
        className={className}
        gasPrices={gasPrices}
        loading={loading}
        onRefresh={() => fetchGasPrices(true)}
        isRefreshing={isRefreshing}
        anyAvailable={anyAvailable}
      />
    );
  }

  if (loading) {
    return (
      <div className={cn('glass-card p-6 animate-pulse', className)} aria-busy="true">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white/10 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const selectedGas = gasPrices.find(g => g.chain === selectedChain) ?? gasPrices[0];

  return (
    <div className={cn('glass-card p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <Fuel className="w-5 h-5 text-orange-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Gas Tracker</h3>
            <p className="text-xs text-gray-400">Current network fees on EVM chains, refreshed about once a minute</p>
          </div>
        </div>
        <button
          onClick={() => fetchGasPrices(true)}
          disabled={isRefreshing}
          aria-label="Refresh gas prices"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4 text-gray-400', isRefreshing && 'animate-spin')} aria-hidden="true" />
        </button>
      </div>

      {!anyAvailable && (
        <div className="flex items-start gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4" role="status">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>Gas data is unavailable right now. We show nothing rather than a guessed number.</span>
        </div>
      )}

      {/* Chain Selector Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide" role="group" aria-label="Select chain">
        {gasPrices.map(gas => {
          const style = getChainStyle(gas.chain);
          const isSelected = selectedGas?.chain === gas.chain;

          return (
            <button
              key={gas.chainId}
              onClick={() => setSelectedChain(gas.chain)}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all',
                isSelected
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              )}
              style={isSelected ? { borderColor: style.color + '40' } : undefined}
            >
              <img
                src={CHAIN_ICONS[gas.chain]}
                alt=""
                className="w-5 h-5"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-sm font-medium text-white">{gas.chainName}</span>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{ backgroundColor: style.bgColor, color: style.color }}
              >
                {gas.available ? `${formatGasPrice(gas.gasPrice.average)} gwei` : 'unavailable'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Chain Details */}
      {selectedGas && !selectedGas.available && (
        <p className="text-sm text-gray-400 bg-white/5 rounded-xl p-4">
          {selectedGas.chainName} gas data is unavailable right now.
        </p>
      )}

      {selectedGas && selectedGas.available && (
        <div className="space-y-6">
          {selectedGas.stale && (
            <p className="text-xs text-amber-300">
              Showing the last reading from {formatTime(selectedGas.fetchedAt)}; the latest refresh failed.
            </p>
          )}
          {/* Gas Price Tiers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <GasTierCard
              label="Low"
              price={selectedGas.gasPrice.low}
              waitTime="~10 min"
              icon={<Clock className="w-4 h-4" aria-hidden="true" />}
              color="text-blue-400"
              bgColor="bg-blue-500/10"
            />
            <GasTierCard
              label="Average"
              price={selectedGas.gasPrice.average}
              waitTime="~3 min"
              icon={<Zap className="w-4 h-4" aria-hidden="true" />}
              color="text-green-400"
              bgColor="bg-green-500/10"
              highlighted
            />
            <GasTierCard
              label="High"
              price={selectedGas.gasPrice.high}
              waitTime="~30 sec"
              icon={<Zap className="w-4 h-4" aria-hidden="true" />}
              color="text-orange-400"
              bgColor="bg-orange-500/10"
            />
            <GasTierCard
              label="Instant"
              price={selectedGas.gasPrice.instant || selectedGas.gasPrice.high * 1.5}
              waitTime="Next block"
              icon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
              color="text-red-400"
              bgColor="bg-red-500/10"
            />
          </div>

          {/* Base Fee Display (for EIP-1559 chains) */}
          {selectedGas.gasPrice.baseFee !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-xl">
              <span>Base Fee:</span>
              <span className="font-mono text-white">
                {formatGasPrice(selectedGas.gasPrice.baseFee)} gwei
              </span>
            </div>
          )}

          {/* Estimated Costs */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Estimated Transaction Costs (average tier)</h4>
            {selectedGas.costsAvailable ? (
              <div className="grid grid-cols-3 gap-3">
                <CostCard
                  label="Transfer"
                  icon={<Send className="w-4 h-4" aria-hidden="true" />}
                  cost={selectedGas.estimatedCosts.transfer}
                  symbol={selectedGas.symbol}
                />
                <CostCard
                  label="DEX Swap"
                  icon={<Repeat className="w-4 h-4" aria-hidden="true" />}
                  cost={selectedGas.estimatedCosts.swap}
                  symbol={selectedGas.symbol}
                />
                <CostCard
                  label="NFT Mint"
                  icon={<ImagePlus className="w-4 h-4" aria-hidden="true" />}
                  cost={selectedGas.estimatedCosts.nftMint}
                  symbol={selectedGas.symbol}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                USD estimates are unavailable because the {selectedGas.symbol} price could not be loaded.
              </p>
            )}
            {selectedGas.excludesL1DataFee && (
              <p className="text-xs text-gray-500 mt-2">
                {selectedGas.chainName} is a rollup: these figures cover L2 execution gas only. Each transaction also
                pays an L1 data fee that depends on its size and on Ethereum fees, and it is often the larger part.
              </p>
            )}
          </div>

          {/* Token Price Info */}
          {selectedGas.nativeTokenPrice !== undefined && (
            <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-white/10">
              <span>{selectedGas.symbol} Price</span>
              <span className="font-mono text-white">
                ${selectedGas.nativeTokenPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500 text-right">
        Source: public RPC nodes (eth_gasPrice, eth_feeHistory); prices from CoinGecko.
        {lastChecked && ` Checked ${formatTime(lastChecked)}.`}
      </p>
    </div>
  );
}

function GasTierCard({
  label,
  price,
  waitTime,
  icon,
  color,
  bgColor,
  highlighted = false,
}: {
  label: string;
  price: number;
  waitTime: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl text-center transition-all',
        highlighted ? 'bg-white/10 border border-white/20' : 'bg-white/5',
        'hover:bg-white/10'
      )}
    >
      <div className={cn('flex items-center justify-center gap-1 mb-2', color)}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={cn('text-2xl font-bold font-mono text-white mb-1')}>
        {formatGasPrice(price)}
      </div>
      <div className="text-xs text-gray-400">gwei</div>
      <div className={cn('mt-2 text-xs px-2 py-1 rounded-full', bgColor, color)}>
        {waitTime}
      </div>
    </div>
  );
}

function CostCard({
  label,
  icon,
  cost,
  symbol,
}: {
  label: string;
  icon: React.ReactNode;
  cost: number;
  symbol: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-bold text-white font-mono">
        {formatUsd(cost)}
      </div>
      <div className="text-xs text-gray-500">paid in {symbol}</div>
    </div>
  );
}

/**
 * Compact version for sidebar or smaller spaces
 */
function GasPriceCompact({
  className,
  gasPrices,
  loading,
  onRefresh,
  isRefreshing,
  anyAvailable,
}: {
  className?: string;
  gasPrices: ChainGasStatus[];
  loading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  anyAvailable: boolean;
}) {
  if (loading) {
    return (
      <div className={cn('glass-card p-4 animate-pulse', className)} aria-busy="true">
        <div className="h-5 bg-white/10 rounded w-1/2 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-white/10 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const newest = gasPrices.reduce<number | null>(
    (max, g) => (g.available && g.fetchedAt && (!max || g.fetchedAt > max) ? g.fetchedAt : max),
    null
  );
  const anyStale = gasPrices.some((g) => g.available && g.stale);

  return (
    <div className={cn('glass-card p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-orange-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-white">Gas Prices</h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh gas prices"
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 text-gray-400', isRefreshing && 'animate-spin')} aria-hidden="true" />
        </button>
      </div>

      {!anyAvailable ? (
        <p className="text-sm text-gray-400" role="status">
          Gas data is unavailable right now. Try refreshing in a minute.
        </p>
      ) : (
        <ul className="space-y-2">
          {gasPrices.map(gas => {
            const style = getChainStyle(gas.chain);

            return (
              <li
                key={gas.chainId}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={CHAIN_ICONS[gas.chain]}
                    alt=""
                    className="w-4 h-4"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="text-sm text-white">{gas.chainName}</span>
                </div>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={gas.available ? { backgroundColor: style.bgColor, color: style.color } : undefined}
                >
                  {gas.available ? `${formatGasPrice(gas.gasPrice.average)} gwei` : 'unavailable'}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {anyAvailable && (
        <p className="text-xs text-gray-500 mt-3">
          {anyStale ? 'Some values are from an earlier reading. ' : ''}
          {newest ? `As of ${formatTime(newest)}. ` : ''}Average tier, in gwei.
        </p>
      )}
    </div>
  );
}

/**
 * Minimal ticker-style version
 */
function GasPriceMinimal({
  className,
  gasPrices,
  loading,
  onRefresh,
}: {
  className?: string;
  gasPrices: ChainGasStatus[];
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 p-2 glass rounded-lg animate-pulse', className)}>
        <div className="w-4 h-4 bg-white/10 rounded" />
        <div className="w-16 h-4 bg-white/10 rounded" />
      </div>
    );
  }

  const ethGas = gasPrices.find(g => g.chain === 'ethereum');

  if (!ethGas) return null;

  return (
    <button
      onClick={onRefresh}
      aria-label="Refresh Ethereum gas price"
      className={cn(
        'flex items-center gap-2 px-3 py-2 glass rounded-xl hover:bg-white/10 transition-colors group',
        className
      )}
    >
      <Fuel className="w-4 h-4 text-orange-400" aria-hidden="true" />
      <span className="text-xs text-gray-400">ETH Gas:</span>
      <span className="text-sm font-mono font-medium text-white">
        {ethGas.available ? `${formatGasPrice(ethGas.gasPrice.average)} gwei` : 'unavailable'}
      </span>
      <RefreshCw className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
    </button>
  );
}

export default GasPriceTracker;
