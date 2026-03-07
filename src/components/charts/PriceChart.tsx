import { useEffect, useRef, useState, memo, useMemo } from 'react';
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
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getHistoricalData } from '../../services/coingecko';
import { Loader2 } from 'lucide-react';

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

interface PriceChartProps {
  cryptocurrencyId: string;
  cryptocurrencyName?: string;
  days?: 1 | 7 | 14 | 30 | 90 | 180 | 365;
  currency?: string;
  height?: number;
  showVolume?: boolean;
}

export const PriceChart = memo(function PriceChart({
  cryptocurrencyId,
  cryptocurrencyName,
  days = 7,
  currency = 'usd',
  height = 300,
  showVolume = false,
}: PriceChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(days);
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

  useEffect(() => {
    loadChartData();
  }, [cryptocurrencyId, selectedPeriod, currency]);

  async function loadChartData() {
    setLoading(true);
    setError(null);

    try {
      const data = await getHistoricalData(cryptocurrencyId, selectedPeriod, currency);

      if (!data.prices || data.prices.length === 0) {
        throw new Error('No price data available');
      }

      // Format data for Chart.js
      const labels = data.prices.map(([timestamp]) => {
        const date = new Date(timestamp);
        if (selectedPeriod === 1) {
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (selectedPeriod <= 7) {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
        } else {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      });

      const prices = data.prices.map(([, price]) => price);
      const volumes = data.total_volumes?.map(([, volume]) => volume) || [];

      setChartData({ labels, prices, volumes });
    } catch (err) {
      console.error('Error loading chart data:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }

  const priceChange = useMemo(() => chartData.prices.length > 0
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
        backgroundColor: (context: any) => {
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
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return `$${value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: value < 1 ? 6 : 2,
            })}`;
          },
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
          callback: (value) => {
            const num = value as number;
            if (num >= 1000) {
              return `$${(num / 1000).toFixed(1)}k`;
            }
            return `$${num.toLocaleString(undefined, { maximumFractionDigits: num < 1 ? 2 : 0 })}`;
          },
        },
      },
    },
  };

  const periods = [
    { label: '24H', value: 1 },
    { label: '7D', value: 7 },
    { label: '14D', value: 14 },
    { label: '1M', value: 30 },
    { label: '3M', value: 90 },
    { label: '6M', value: 180 },
    { label: '1Y', value: 365 },
  ];

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
        aria-live="assertive"
      >
        <div className="text-center text-red-400">
          <p className="font-medium mb-1">Failed to load chart</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const currentPrice = chartData.prices[chartData.prices.length - 1];
  const periodLabel = selectedPeriod === 1 ? '24 hours' : selectedPeriod === 7 ? '7 days' : selectedPeriod === 14 ? '14 days' : selectedPeriod === 30 ? '1 month' : selectedPeriod === 90 ? '3 months' : selectedPeriod === 180 ? '6 months' : '1 year';
  const chartDescription = `${cryptocurrencyName || cryptocurrencyId} price chart showing ${periodLabel} of history. Current price is $${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Price has ${isPositive ? 'increased' : 'decreased'} by ${Math.abs(priceChange).toFixed(2)} percent during this period.`;

  return (
    <figure
      className="bg-gray-900/50 rounded-xl border border-gray-800 p-4"
      role="figure"
      aria-label={`${cryptocurrencyName || cryptocurrencyId} price chart`}
    >
      {/* Screen reader description */}
      <figcaption className="sr-only">{chartDescription}</figcaption>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          {cryptocurrencyName && (
            <h3 className="text-lg font-bold text-white mb-1">{cryptocurrencyName} Price</h3>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white" aria-label={`Current price: $${currentPrice?.toLocaleString()}`}>
              ${currentPrice?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: currentPrice < 1 ? 6 : 2,
              })}
            </span>
            <span
              className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}
              aria-label={`Price change: ${isPositive ? 'up' : 'down'} ${Math.abs(priceChange).toFixed(2)} percent`}
            >
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Period Selector */}
        <div
          className="flex gap-1 bg-gray-800/50 rounded-lg p-1"
          role="tablist"
          aria-label="Select time period"
        >
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              role="tab"
              aria-selected={selectedPeriod === period.value}
              aria-label={`Show ${period.label === '24H' ? '24 hour' : period.label === '7D' ? '7 day' : period.label === '14D' ? '14 day' : period.label === '1M' ? '1 month' : period.label === '3M' ? '3 month' : period.label === '6M' ? '6 month' : '1 year'} price history`}
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

      {/* Accessible data summary for screen readers */}
      <div className="sr-only" role="table" aria-label="Price data summary">
        <div role="rowgroup">
          <div role="row">
            <span role="columnheader">Time</span>
            <span role="columnheader">Price</span>
          </div>
        </div>
        <div role="rowgroup">
          {chartData.labels.slice(0, 5).map((label, index) => (
            <div key={index} role="row">
              <span role="cell">{label}</span>
              <span role="cell">${chartData.prices[index]?.toLocaleString()}</span>
            </div>
          ))}
          {chartData.labels.length > 5 && (
            <div role="row">
              <span role="cell">...and {chartData.labels.length - 5} more data points</span>
            </div>
          )}
        </div>
      </div>

      {/* Volume Chart (Optional) */}
      {showVolume && chartData.volumes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800" role="img" aria-label="Trading volume visualization">
          <p className="text-xs text-gray-400 mb-2">24h Volume</p>
          <div className="flex gap-1 h-12" aria-hidden="true">
            {chartData.volumes.slice(-50).map((volume, index) => {
              const maxVolume = Math.max(...chartData.volumes);
              const heightPercent = (volume / maxVolume) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-gray-700/30 rounded-t relative group"
                  style={{ height: `${heightPercent}%`, alignSelf: 'flex-end' }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    ${(volume / 1e9).toFixed(2)}B
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

