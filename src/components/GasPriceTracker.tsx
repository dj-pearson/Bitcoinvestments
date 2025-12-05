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
import type { ChainGasInfo, SupportedChain } from '../types';
import {
  getAllGasPrices,
  getGasPriceForChain,
  formatGasPrice,
  getChainStyle,
} from '../services/gasPrice';
import { cn } from '../lib/utils';

interface GasPriceTrackerProps {
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  chains?: SupportedChain[];
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

export function GasPriceTracker({
  className,
  variant = 'full',
  chains,
  refreshInterval = 30000,
}: GasPriceTrackerProps) {
  const [gasPrices, setGasPrices] = useState<ChainGasInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChain, setSelectedChain] = useState<SupportedChain>('ethereum');

  const fetchGasPrices = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      setError(null);

      let data: ChainGasInfo[];
      if (chains && chains.length > 0) {
        data = await Promise.all(chains.map(chain => getGasPriceForChain(chain)));
      } else {
        data = await getAllGasPrices();
      }

      setGasPrices(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch gas prices');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [chains]);

  useEffect(() => {
    fetchGasPrices();
    const interval = setInterval(() => fetchGasPrices(), refreshInterval);
    return () => clearInterval(interval);
  }, [fetchGasPrices, refreshInterval]);

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
      />
    );
  }

  if (loading) {
    return (
      <div className={cn('glass-card p-6 animate-pulse', className)}>
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white/10 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('glass-card p-6', className)}>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={() => fetchGasPrices(true)}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const selectedGas = gasPrices.find(
    g => g.chainName.toLowerCase().includes(selectedChain) ||
         g.chainId === getChainId(selectedChain)
  );

  return (
    <div className={cn('glass-card p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <Fuel className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Gas Tracker</h3>
            <p className="text-xs text-gray-400">Real-time gas prices across EVM chains</p>
          </div>
        </div>
        <button
          onClick={() => fetchGasPrices(true)}
          disabled={isRefreshing}
          className={cn(
            'p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors',
            isRefreshing && 'animate-spin'
          )}
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Chain Selector Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {gasPrices.map(gas => {
          const chainKey = getChainKey(gas.chainName);
          const style = getChainStyle(chainKey);
          const isSelected = selectedChain === chainKey;

          return (
            <button
              key={gas.chainId}
              onClick={() => setSelectedChain(chainKey)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all',
                isSelected
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              )}
              style={isSelected ? { borderColor: style.color + '40' } : undefined}
            >
              <img
                src={CHAIN_ICONS[chainKey]}
                alt={gas.chainName}
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
                {formatGasPrice(gas.gasPrice.average)} gwei
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Chain Details */}
      {selectedGas && (
        <div className="space-y-6">
          {/* Gas Price Tiers */}
          <div className="grid grid-cols-4 gap-3">
            <GasTierCard
              label="Low"
              price={selectedGas.gasPrice.low}
              waitTime="~10 min"
              icon={<Clock className="w-4 h-4" />}
              color="text-blue-400"
              bgColor="bg-blue-500/10"
            />
            <GasTierCard
              label="Average"
              price={selectedGas.gasPrice.average}
              waitTime="~3 min"
              icon={<Zap className="w-4 h-4" />}
              color="text-green-400"
              bgColor="bg-green-500/10"
              highlighted
            />
            <GasTierCard
              label="High"
              price={selectedGas.gasPrice.high}
              waitTime="~30 sec"
              icon={<Zap className="w-4 h-4" />}
              color="text-orange-400"
              bgColor="bg-orange-500/10"
            />
            <GasTierCard
              label="Instant"
              price={selectedGas.gasPrice.instant || selectedGas.gasPrice.high * 1.5}
              waitTime="Next block"
              icon={<ArrowRight className="w-4 h-4" />}
              color="text-red-400"
              bgColor="bg-red-500/10"
            />
          </div>

          {/* Base Fee Display (for EIP-1559 chains) */}
          {selectedGas.gasPrice.baseFee && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-xl">
              <span>Base Fee:</span>
              <span className="font-mono text-white">
                {formatGasPrice(selectedGas.gasPrice.baseFee)} gwei
              </span>
            </div>
          )}

          {/* Estimated Costs */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Estimated Transaction Costs</h4>
            <div className="grid grid-cols-3 gap-3">
              <CostCard
                label="Transfer"
                icon={<Send className="w-4 h-4" />}
                cost={selectedGas.estimatedCosts.transfer}
                symbol={selectedGas.symbol}
              />
              <CostCard
                label="DEX Swap"
                icon={<Repeat className="w-4 h-4" />}
                cost={selectedGas.estimatedCosts.swap}
                symbol={selectedGas.symbol}
              />
              <CostCard
                label="NFT Mint"
                icon={<ImagePlus className="w-4 h-4" />}
                cost={selectedGas.estimatedCosts.nftMint}
                symbol={selectedGas.symbol}
              />
            </div>
          </div>

          {/* Token Price Info */}
          {selectedGas.nativeTokenPrice && (
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

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-4 text-xs text-gray-500 text-right">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
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
        ${cost.toFixed(2)}
      </div>
      <div className="text-xs text-gray-500">{symbol}</div>
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
}: {
  className?: string;
  gasPrices: ChainGasInfo[];
  loading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  if (loading) {
    return (
      <div className={cn('glass-card p-4 animate-pulse', className)}>
        <div className="h-5 bg-white/10 rounded w-1/2 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-white/10 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glass-card p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Gas Prices</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'p-1.5 rounded-lg hover:bg-white/10 transition-colors',
            isRefreshing && 'animate-spin'
          )}
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      <div className="space-y-2">
        {gasPrices.slice(0, 5).map(gas => {
          const chainKey = getChainKey(gas.chainName);
          const style = getChainStyle(chainKey);

          return (
            <div
              key={gas.chainId}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <img
                  src={CHAIN_ICONS[chainKey]}
                  alt={gas.chainName}
                  className="w-4 h-4"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-sm text-white">{gas.chainName}</span>
              </div>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{ backgroundColor: style.bgColor, color: style.color }}
              >
                {formatGasPrice(gas.gasPrice.average)} gwei
              </span>
            </div>
          );
        })}
      </div>
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
  gasPrices: ChainGasInfo[];
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

  const ethGas = gasPrices.find(g => g.chainName === 'Ethereum');

  if (!ethGas) return null;

  return (
    <button
      onClick={onRefresh}
      className={cn(
        'flex items-center gap-2 px-3 py-2 glass rounded-xl hover:bg-white/10 transition-colors group',
        className
      )}
    >
      <Fuel className="w-4 h-4 text-orange-400" />
      <span className="text-xs text-gray-400">ETH Gas:</span>
      <span className="text-sm font-mono font-medium text-white">
        {formatGasPrice(ethGas.gasPrice.average)} gwei
      </span>
      <RefreshCw className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// Helper functions
function getChainKey(chainName: string): SupportedChain {
  const nameMap: Record<string, SupportedChain> = {
    'ethereum': 'ethereum',
    'polygon': 'polygon',
    'arbitrum one': 'arbitrum',
    'arbitrum': 'arbitrum',
    'optimism': 'optimism',
    'bnb smart chain': 'bsc',
    'bsc': 'bsc',
    'avalanche c-chain': 'avalanche',
    'avalanche': 'avalanche',
    'base': 'base',
  };
  return nameMap[chainName.toLowerCase()] || 'ethereum';
}

function getChainId(chain: SupportedChain): number {
  const chainIds: Record<SupportedChain, number> = {
    ethereum: 1,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    bsc: 56,
    avalanche: 43114,
    base: 8453,
  };
  return chainIds[chain];
}

export default GasPriceTracker;
