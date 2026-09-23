import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions, ScriptableContext } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchHistoricalData, describeMarketError } from '../../services/coingecko';
import { formatCompactCurrency } from '../../lib/utils';
import { fmtAxisUsd, fmtUsd, fmtPct, fmtDateTime } from '../../lib/marketFormat';
import { Loader2, RefreshCw } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export type ChartPeriod = 1 | 7 | 14 | 30 | 90 | 180 | 365;

export const CHART_PERIODS: { label: string; long: string; value: ChartPeriod }[] = [
  { label: '24H', long: '24 hours', value: 1 },
  { label: '7D', long: '7 days', value: 7 },
  { label: '14D', long: '14 days', value: 14 },
  { label: '1M', long: '1 month', value: 30 },
  { label: '3M', long: '3 months', value: 90 },
  { label: '6M', long: '6 months', value: 180 },
  { label: '1Y', long: '1 year', value: 365 },
];

export function formatChartLabel(timestamp: number, period: number): string {
  const date = new Date(timestamp);
  if (period === 1) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (period <= 7) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface PriceChartProps {
  cryptocurrencyId: string;
  cryptocurrencyName?: string;
  days?: ChartPeriod;
  currency?: string;
  height?: number;
  showVolume?: boolean;
  /**
   * When provided, the period is controlled by the parent (`days` is the
   * current value) and this is called when the user picks another period.
   */
  onPeriodChange?: (days: ChartPeriod) => void;
  /** Heading level for the chart title (default h3). */
  titleAs?: 'h2' | 'h3';
}

export const PriceChart = memo(function PriceChart({
  cryptocurrencyId,
  cryptocurrencyName,
  days = 7,
  currency = 'usd',
  height = 300,
  showVolume = false,
  onPeriodChange,
  titleAs: TitleTag = 'h3',
}: PriceChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalPeriod, setInternalPeriod] = useState<ChartPeriod>(days);
  const selectedPeriod: ChartPeriod = onPeriodChange ? days : internalPeriod;
  const [meta, setMeta] = useState<{ fetchedAt: number; stale: boolean } | null>(null);
  const chartRef = useRef<ChartJS<'line'>>(null);

  const [chartData, setChartData] = useState<{
    labels: string[];
    prices: number[];
    volumes: number[];
  }>({
    labels: [],
    prices: [],
    volumes: [],
  });

  function selectPeriod(value: ChartPeriod) {
    if (onPeriodChange) onPeriodChange(value);
    else setInternalPeriod(value);
  }

  const loadChartData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchHistoricalData(cryptocurrencyId, selectedPeriod, currency, { force });
      const data = result.data;

      if (!data.prices || data.prices.length === 0) {
        throw new Error('No price data available');
      }

      const labels = data.prices.map(([timestamp]) => formatChartLabel(timestamp, selectedPeriod));
      const prices = data.prices.map(([, price]) => price);
      const volumes = data.total_volumes?.map(([, volume]) => volume) || [];

      setChartData({ labels, prices, volumes });
      setMeta({ fetchedAt: result.fetchedAt, stale: result.stale });
    } catch (err) {
      setError(describeMarketError(err));
    } finally {
      setLoading(false);
    }
  }, [cryptocurrencyId, selectedPeriod, currency]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  const priceChange = useMemo(() => chartData.prices.length > 0 && chartData.prices[0] > 0
    ? ((chartData.prices[chartData.prices.length - 1] - chartData.prices[0]) / chartData.prices[0]) * 100
    : 0, [chartData.prices]);

  const isPositive = priceChange >= 0;

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: cryptocurrencyName || cryptocurrencyId,
        data: chartData.prices,
        borderColor: isPositive ? '#10b981' : '#ef4444',
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)');
          gradient.addColorStop(1, isPositive ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)');
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: isPositive ? '#10b981' : '#ef4444',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: isPositive ? '#10b981' : '#ef4444',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => fmtUsd(context.parsed.y ?? 0),
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#6b7280',
          maxTicksLimit: 8,
          autoSkip: true,
        },
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#6b7280',
          callback: (value) => fmtAxisUsd(Number(value)),
        },
      },
    },
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800"
        style={{ height }}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={`Loading ${cryptocurrencyName || cryptocurrencyId} price chart`}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" aria-hidden="true" />
          <p className="text-gray-400 text-sm">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800"
        style={{ height }}
        role="alert"
      >
        <div className="text-center text-red-400 px-4">
          <p className="font-medium mb-1">Chart unavailable</p>
          <p className="text-sm text-gray-400 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => loadChartData(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = chartData.prices[chartData.prices.length - 1];
  const periodLabel = CHART_PERIODS.find((p) => p.value === selectedPeriod)?.long ?? `${selectedPeriod} days`;
  const chartDescription = `${cryptocurrencyName || cryptocurrencyId} price chart showing ${periodLabel} of history. Latest price is ${fmtUsd(currentPrice)}. Price has ${isPositive ? 'increased' : 'decreased'} by ${Math.abs(priceChange).toFixed(2)} percent during this period.`;
  const recentVolumes = chartData.volumes.slice(-50);
  const maxVolume = recentVolumes.length > 0 ? Math.max(...recentVolumes) : 0;

  return (
    <figure
      className="bg-gray-900/50 rounded-xl border border-gray-800 p-4"
      aria-label={`${cryptocurrencyName || cryptocurrencyId} price chart`}
    >
      {/* Screen reader description */}
      <figcaption className="sr-only">{chartDescription}</figcaption>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          {cryptocurrencyName && (
            <TitleTag className="text-lg font-bold text-white mb-1">{cryptocurrencyName} Price</TitleTag>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{fmtUsd(currentPrice)}</span>
            <span
              className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}
              aria-label={`Change over ${periodLabel}: ${isPositive ? 'up' : 'down'} ${Math.abs(priceChange).toFixed(2)} percent`}
            >
              {fmtPct(priceChange)}
            </span>
          </div>
          {meta && (
            <p className={`text-xs mt-1 ${meta.stale ? 'text-amber-300' : 'text-gray-500'}`}>
              {meta.stale ? 'Could not refresh; data as of ' : 'CoinGecko data, updated '}
              {fmtDateTime(meta.fetchedAt)}
            </p>
          )}
        </div>

        {/* Period Selector */}
        <div
          className="flex flex-wrap gap-1 bg-gray-800/50 rounded-lg p-1"
          role="group"
          aria-label="Time period"
        >
          {CHART_PERIODS.map((period) => (
            <button
              key={period.value}
              type="button"
              onClick={() => selectPeriod(period.value)}
              aria-pressed={selectedPeriod === period.value}
              aria-label={`Show ${period.long} of price history`}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }} role="img" aria-label={chartDescription}>
        <Line ref={chartRef} data={data} options={options} />
      </div>

      {/* Volume Chart (Optional) */}
      {showVolume && recentVolumes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-2">
            Trading volume (rolling 24h), latest {recentVolumes.length} data points
          </p>
          <div className="flex gap-1 h-12" aria-hidden="true">
            {recentVolumes.map((volume, index) => {
              const heightPercent = maxVolume > 0 ? (volume / maxVolume) * 100 : 0;
              return (
                <div
                  key={index}
                  className="flex-1 bg-gray-700/30 rounded-t relative group"
                  style={{ height: `${heightPercent}%`, alignSelf: 'flex-end' }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatCompactCurrency(volume)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </figure>
  );
});
