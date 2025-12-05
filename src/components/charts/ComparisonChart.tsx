import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getHistoricalData } from '../../services/coingecko';
import { Loader2, X } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ComparisonChartProps {
  cryptocurrencies: {
    id: string;
    symbol: string;
    name: string;
    color?: string;
  }[];
  days?: 1 | 7 | 14 | 30 | 90 | 180 | 365;
  currency?: string;
  height?: number;
  onRemoveCrypto?: (id: string) => void;
}

const DEFAULT_COLORS = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#10b981', // Green
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

export function ComparisonChart({
  cryptocurrencies,
  days = 7,
  currency = 'usd',
  height = 350,
  onRemoveCrypto,
}: ComparisonChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(days);
  const [normalize, setNormalize] = useState(true);

  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      id: string;
      label: string;
      data: number[];
      color: string;
    }[];
  }>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (cryptocurrencies.length > 0) {
      loadComparisonData();
    } else {
      setChartData({ labels: [], datasets: [] });
      setLoading(false);
    }
  }, [cryptocurrencies, selectedPeriod, currency, normalize]);

  async function loadComparisonData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch historical data for all cryptocurrencies
      const dataPromises = cryptocurrencies.map(crypto =>
        getHistoricalData(crypto.id, selectedPeriod, currency)
      );

      const results = await Promise.all(dataPromises);

      // Find the shortest dataset to ensure alignment
      const minLength = Math.min(...results.map(r => r.prices.length));

      // Get timestamps from first dataset
      const labels = results[0].prices.slice(0, minLength).map(([timestamp]) => {
        const date = new Date(timestamp);
        if (selectedPeriod === 1) {
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (selectedPeriod <= 7) {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      });

      // Create datasets
      const datasets = cryptocurrencies.map((crypto, index) => {
        const prices = results[index].prices.slice(0, minLength).map(([, price]) => price);

        // Normalize to percentage change if enabled
        const data = normalize
          ? prices.map(price => ((price - prices[0]) / prices[0]) * 100)
          : prices;

        return {
          id: crypto.id,
          label: crypto.name,
          data,
          color: crypto.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        };
      });

      setChartData({ labels, datasets });
    } catch (err) {
      console.error('Error loading comparison data:', err);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  }

  const data = {
    labels: chartData.labels,
    datasets: chartData.datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.color,
      backgroundColor: `${dataset.color}15`,
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: dataset.color,
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
    })),
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
        borderColor: '#f97316',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y ?? 0;
            if (normalize) {
              return `${label}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
            }
            return `${label}: $${value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: value < 1 ? 6 : 2,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#6b7280',
          maxTicksLimit: 8,
        },
      },
      y: {
        position: 'right' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#6b7280',
          callback: (value) => {
            const num = value as number;
            if (normalize) {
              return `${num >= 0 ? '+' : ''}${num.toFixed(0)}%`;
            }
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

  if (cryptocurrencies.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800"
        style={{ height }}
      >
        <div className="text-center text-gray-400">
          <p className="font-medium mb-1">No Cryptocurrencies Selected</p>
          <p className="text-sm">Select cryptocurrencies to compare</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800"
        style={{ height }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading comparison...</p>
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
          <p className="font-medium mb-1">Failed to load comparison</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Price Comparison</h3>
          
          <div className="flex items-center gap-2">
            {/* Normalize Toggle */}
            <button
              onClick={() => setNormalize(!normalize)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                normalize
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {normalize ? 'Normalized' : 'Absolute'}
            </button>

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
        </div>

        {/* Legend with removable chips */}
        <div className="flex flex-wrap gap-2">
          {chartData.datasets.map((dataset) => {
            const currentPrice = dataset.data[dataset.data.length - 1];
            const startPrice = dataset.data[0];
            const change = normalize 
              ? currentPrice 
              : ((currentPrice - startPrice) / startPrice) * 100;

            return (
              <div
                key={dataset.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dataset.color }}
                />
                <span className="text-sm font-medium text-white">{dataset.label}</span>
                <span className={`text-xs font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </span>
                {onRemoveCrypto && (
                  <button
                    onClick={() => onRemoveCrypto(dataset.id)}
                    className="ml-1 p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <Line data={data} options={options} />
      </div>

      {normalize && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          * Normalized view shows percentage change from starting price
        </p>
      )}
    </div>
  );
}


