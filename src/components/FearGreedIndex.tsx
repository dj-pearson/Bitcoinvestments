import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react';
import type { FearGreedIndex, FearGreedHistorical } from '../types';
import { getCachedFearGreedIndex, getFearGreedHistorical } from '../services/coingecko';
import { cn } from '../lib/utils';

interface FearGreedGaugeProps {
  className?: string;
  showHistory?: boolean;
  historyDays?: number;
}

export function FearGreedGauge({
  className,
  showHistory = true,
  historyDays = 7,
}: FearGreedGaugeProps) {
  const [data, setData] = useState<FearGreedIndex | null>(null);
  const [history, setHistory] = useState<FearGreedHistorical | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [currentData, historicalData] = await Promise.all([
          getCachedFearGreedIndex(),
          showHistory ? getFearGreedHistorical(historyDays) : null,
        ]);

        setData(currentData);
        if (historicalData) {
          setHistory(historicalData);
        }
      } catch (err) {
        setError('Failed to load Fear & Greed Index');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [showHistory, historyDays]);

  if (loading) {
    return (
      <div className={cn('glass-card p-6 animate-pulse', className)}>
        <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
        <div className="h-32 bg-white/10 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn('glass-card p-6', className)}>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error || 'No data available'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glass-card p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Fear & Greed Index</h3>
        <div className="text-xs text-gray-400">
          Updated: {new Date(data.timestamp).toLocaleDateString()}
        </div>
      </div>

      {/* Main Gauge */}
      <div className="flex flex-col items-center mb-6">
        <GaugeDisplay value={data.value} classification={data.value_classification} />
      </div>

      {/* Classification Legend */}
      <div className="grid grid-cols-5 gap-1 mb-6 text-xs">
        <div className="text-center">
          <div className="h-2 bg-red-500 rounded-l-full" />
          <span className="text-gray-400">Extreme Fear</span>
        </div>
        <div className="text-center">
          <div className="h-2 bg-orange-500" />
          <span className="text-gray-400">Fear</span>
        </div>
        <div className="text-center">
          <div className="h-2 bg-yellow-500" />
          <span className="text-gray-400">Neutral</span>
        </div>
        <div className="text-center">
          <div className="h-2 bg-lime-500" />
          <span className="text-gray-400">Greed</span>
        </div>
        <div className="text-center">
          <div className="h-2 bg-green-500 rounded-r-full" />
          <span className="text-gray-400">Extreme Greed</span>
        </div>
      </div>

      {/* Historical Data */}
      {showHistory && history && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Last {historyDays} Days</h4>
          <div className="flex gap-1">
            {history.data.slice(0, historyDays).reverse().map((item, index) => (
              <div
                key={index}
                className="flex-1 group relative"
              >
                <div
                  className={cn(
                    'h-8 rounded transition-all hover:scale-105',
                    getBackgroundColor(item.value)
                  )}
                  style={{ opacity: 0.6 + (index / historyDays) * 0.4 }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {item.value} - {item.value_classification}
                  <br />
                  {new Date(item.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interpretation */}
      <div className="mt-6 p-4 bg-white/5 rounded-xl">
        <h4 className="text-sm font-medium text-gray-300 mb-2">What does this mean?</h4>
        <p className="text-xs text-gray-400">
          {getInterpretation(data.value_classification)}
        </p>
      </div>
    </div>
  );
}

function GaugeDisplay({
  value,
  classification,
}: {
  value: number;
  classification: FearGreedIndex['value_classification'];
}) {
  const angle = (value / 100) * 180 - 90; // Convert to -90 to 90 degrees

  return (
    <div className="relative w-48 h-24 overflow-hidden">
      {/* Gauge Background */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Gradient arc background */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="15"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Needle */}
      <div
        className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-1000"
        style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
      >
        <div className="w-1 h-20 bg-white rounded-full shadow-lg" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full" />
      </div>

      {/* Value Display */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-center">
        <div className={cn('text-4xl font-bold', getTextColor(value))}>
          {value}
        </div>
        <div className={cn('text-sm font-medium', getTextColor(value))}>
          {classification}
        </div>
      </div>

      {/* Icon */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2">
        {getIcon(classification)}
      </div>
    </div>
  );
}

function getBackgroundColor(value: number): string {
  if (value <= 20) return 'bg-red-500';
  if (value <= 40) return 'bg-orange-500';
  if (value <= 60) return 'bg-yellow-500';
  if (value <= 80) return 'bg-lime-500';
  return 'bg-green-500';
}

function getTextColor(value: number): string {
  if (value <= 20) return 'text-red-400';
  if (value <= 40) return 'text-orange-400';
  if (value <= 60) return 'text-yellow-400';
  if (value <= 80) return 'text-lime-400';
  return 'text-green-400';
}

function getIcon(classification: FearGreedIndex['value_classification']) {
  switch (classification) {
    case 'Extreme Fear':
    case 'Fear':
      return <TrendingDown className="w-6 h-6 text-red-400" />;
    case 'Neutral':
      return <Minus className="w-6 h-6 text-yellow-400" />;
    case 'Greed':
    case 'Extreme Greed':
      return <TrendingUp className="w-6 h-6 text-green-400" />;
  }
}

function getInterpretation(classification: FearGreedIndex['value_classification']): string {
  switch (classification) {
    case 'Extreme Fear':
      return 'The market is experiencing extreme fear. This could indicate a potential buying opportunity as prices may be oversold. However, further declines are also possible.';
    case 'Fear':
      return 'The market is fearful. Investors are cautious and prices may continue to be suppressed. Consider accumulating if you believe in long-term fundamentals.';
    case 'Neutral':
      return 'The market sentiment is neutral. Neither fear nor greed dominates. This could be a period of consolidation before the next major move.';
    case 'Greed':
      return 'The market is greedy. Prices may be inflated due to optimism. Consider taking some profits and being cautious about new large positions.';
    case 'Extreme Greed':
      return 'The market is experiencing extreme greed. This could indicate a potential correction is coming. Be very cautious about buying at these levels.';
  }
}

/**
 * Compact version for dashboard widgets
 */
export function FearGreedCompact({ className }: { className?: string }) {
  const [data, setData] = useState<FearGreedIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCachedFearGreedIndex()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className={cn('flex items-center gap-3 p-3 glass rounded-xl animate-pulse', className)}>
        <div className="w-10 h-10 bg-white/10 rounded-full" />
        <div className="h-4 bg-white/10 rounded w-20" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 p-3 glass rounded-xl', className)}>
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
          getBackgroundColor(data.value),
          'bg-opacity-20'
        )}
      >
        <span className={getTextColor(data.value)}>{data.value}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400">Fear & Greed</p>
        <p className={cn('text-sm font-medium', getTextColor(data.value))}>
          {data.value_classification}
        </p>
      </div>
    </div>
  );
}
