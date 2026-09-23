import { useState, useEffect, memo } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { FearGreedIndex, FearGreedHistorical } from '../types';
import { getCachedFearGreedIndex, getFearGreedHistorical } from '../services/coingecko';
import { cn } from '../lib/utils';

interface FearGreedGaugeProps {
  className?: string;
  showHistory?: boolean;
  historyDays?: number;
}

export const FearGreedGauge = memo(function FearGreedGauge({
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
        <h3 className="text-lg font-bold text-white mb-3">Fear &amp; Greed Index</h3>
        <p className="text-sm text-gray-300 mb-3">
          Today&apos;s reading can&apos;t be loaded right now, so here is what the index is.
        </p>
        <p className="text-sm text-gray-400 mb-3">
          The Crypto Fear &amp; Greed Index, published by alternative.me, scores market sentiment
          from 0 (extreme fear) to 100 (extreme greed). It combines price volatility, trading
          momentum and volume, social media activity, Bitcoin&apos;s share of the total crypto market
          and search trends. It describes the mood of the market; it does not predict prices.
        </p>
        <FearGreedSource />
      </div>
    );
  }

  return (
    <div className={cn('glass-card p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Fear &amp; Greed Index</h3>
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
          <ol className="flex gap-1" aria-label={`Fear and Greed readings for the last ${historyDays} days, oldest first`}>
            {history.data.slice(0, historyDays).reverse().map((item, index) => (
              <li
                key={item.timestamp}
                className="flex-1 text-center"
                title={`${new Date(item.timestamp).toLocaleDateString()}: ${item.value} (${item.value_classification})`}
              >
                <div
                  className={cn('h-8 rounded', getBackgroundColor(item.value))}
                  style={{ opacity: 0.6 + (index / historyDays) * 0.4 }}
                  aria-hidden="true"
                />
                <span className="block text-[10px] text-gray-400 mt-1">{item.value}</span>
                <span className="sr-only">
                  {new Date(item.timestamp).toLocaleDateString()}: {item.value_classification}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Interpretation */}
      <div className="mt-6 p-4 bg-white/5 rounded-xl">
        <h4 className="text-sm font-medium text-gray-300 mb-2">What does this mean?</h4>
        <p className="text-xs text-gray-400">
          {getInterpretation(data.value_classification)}
        </p>
      </div>
      <div className="mt-4">
        <FearGreedSource />
      </div>
    </div>
  );
});

function FearGreedSource() {
  return (
    <p className="text-xs text-gray-400">
      Source:{' '}
      <a
        href="https://alternative.me/crypto/fear-and-greed-index/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-white"
      >
        alternative.me Crypto Fear &amp; Greed Index
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      . Sentiment is not a buy or sell signal.
    </p>
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
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-[106px]" aria-hidden="true">
        <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
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
          {/* Needle pivots on the arc's centre (100,100). */}
          <g transform={`rotate(${angle} 100 100)`}>
            <line x1="100" y1="100" x2="100" y2="24" stroke="white" strokeWidth="4" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="100" r="7" fill="white" />
        </svg>
      </div>

      {/* The value sits below the gauge in normal flow so it is never clipped. */}
      <div className="mt-2 text-center">
        <div className="flex items-center justify-center gap-2">
          {getIcon(classification)}
          <span className={cn('text-4xl font-bold', getTextColor(value))}>{value}</span>
          <span className="text-sm text-gray-400">/ 100</span>
        </div>
        <div className={cn('text-sm font-medium', getTextColor(value))}>{classification}</div>
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
      return 'Most of the signals the index tracks point to strong pessimism: prices have been falling or swinging sharply, and social and search activity is subdued. Readings like this have occurred both near market lows and partway through longer declines.';
    case 'Fear':
      return 'Sentiment leans pessimistic. Traders are cautious and volatility or selling has been above normal. The index describes mood; it does not tell you where prices go next.';
    case 'Neutral':
      return 'Neither fear nor greed dominates. Volatility, momentum and social activity are close to their recent averages.';
    case 'Greed':
      return 'Sentiment leans optimistic. Prices have been rising and trading and social activity are above normal. The index describes mood; it does not tell you where prices go next.';
    case 'Extreme Greed':
      return 'Most of the signals point to strong optimism: prices have been rising fast and social and search interest is high. Readings like this have occurred both near market peaks and partway through longer rallies.';
    default:
      return 'The index scores market sentiment from 0 (extreme fear) to 100 (extreme greed).';
  }
}

/**
 * Compact version for dashboard widgets
 */
export const FearGreedCompact = memo(function FearGreedCompact({ className }: { className?: string }) {
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
});
