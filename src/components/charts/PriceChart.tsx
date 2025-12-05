import { useEffect, useRef, useState } from 'react';
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

export function PriceChart({
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

  const priceChange = chartData.prices.length > 0
    ? ((chartData.prices[chartData.prices.length - 1] - chartData.prices[0]) / chartData.prices[0]) * 100
    : 0;

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
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
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
      >
        <div className="text-center text-red-400">
          <p className="font-medium mb-1">Failed to load chart</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          {cryptocurrencyName && (
            <h3 className="text-lg font-bold text-white mb-1">{cryptocurrencyName} Price</h3>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              ${chartData.prices[chartData.prices.length - 1]?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: chartData.prices[chartData.prices.length - 1] < 1 ? 6 : 2,
              })}
            </span>
            <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
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
      <div style={{ height }}>
        <Line ref={chartRef} data={data} options={options} />
      </div>

      {/* Volume Chart (Optional) */}
      {showVolume && chartData.volumes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-2">24h Volume</p>
          <div className="flex gap-1 h-12">
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
    </div>
  );
}

