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
  ArcElement,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import type { Portfolio } from '../../types';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { getInvestmentHistory, getPortfolioAllocation } from '../../services/portfolio';
import { todayLocalISODate, parseLocalDate } from '../../lib/utils';
import { fmtAxisUsd, fmtPct } from '../../lib/marketFormat';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface PortfolioChartProps {
  portfolio: Portfolio;
  height?: number;
  type?: 'performance' | 'allocation';
}

export function PortfolioChart({
  portfolio,
  height = 300,
  type = 'performance',
}: PortfolioChartProps) {
  if (type === 'allocation') {
    return <AllocationChart portfolio={portfolio} height={height} />;
  }

  return <InvestedChart portfolio={portfolio} height={height} />;
}

/**
 * Cumulative net amount invested over time (from the transaction ledger),
 * with today's market value shown for reference. We do not store historical
 * prices, so this is deliberately NOT labelled as a value history.
 */
function InvestedChart({ portfolio, height }: { portfolio: Portfolio; height: number }) {
  const history = getInvestmentHistory(portfolio);

  if (history.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800"
        style={{ height }}
      >
        <div className="text-center text-gray-400">
          <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
          <p className="font-medium mb-1">No transactions yet</p>
          <p className="text-sm">Add holdings to see how much you have invested over time</p>
        </div>
      </div>
    );
  }

  const isPositive = portfolio.total_profit_loss >= 0;
  const today = todayLocalISODate();
  const points = history[history.length - 1].date === today
    ? history
    : [...history, { date: today, invested: history[history.length - 1].invested }];

  const data = {
    labels: points.map(p => parseLocalDate(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })),
    datasets: [
      {
        label: 'Net amount invested',
        data: points.map(p => p.invested),
        borderColor: '#9ca3af',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderWidth: 2,
        fill: true,
        stepped: true as const,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Value today',
        data: points.map(() => portfolio.total_value_usd),
        borderColor: isPositive ? '#10b981' : '#ef4444',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
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
        display: true,
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y ?? 0;
            return `${label}: $${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          callback: (value) => fmtAxisUsd(Number(value)),
        },
      },
    },
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-1">Invested vs value today</h3>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-400" aria-hidden="true" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-400" aria-hidden="true" />
          )}
          <span className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {fmtPct(portfolio.total_profit_loss_percentage)}
          </span>
          <span className="text-gray-400 text-sm">
            ({isPositive ? '+' : '-'}${Math.abs(portfolio.total_profit_loss).toLocaleString(undefined, { maximumFractionDigits: 2 })})
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          The grey line is the running total you paid (minus sales). The dashed line is what your holdings are worth now.
          Past market values are not tracked.
        </p>
      </div>

      <div style={{ height }} role="img" aria-label={`Net amount invested over time, currently $${points[points.length - 1].invested.toFixed(2)}, compared with a current value of $${portfolio.total_value_usd.toFixed(2)}`}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

function AllocationChart({ portfolio, height }: { portfolio: Portfolio; height: number }) {
  const allocation = getPortfolioAllocation(portfolio);

  if (allocation.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800"
        style={{ height }}
      >
        <div className="text-center text-gray-400">
          <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium mb-1">No Allocation Data</p>
          <p className="text-sm">Add holdings to see portfolio allocation</p>
        </div>
      </div>
    );
  }

  const data = {
    labels: allocation.map(a => a.symbol),
    datasets: [
      {
        data: allocation.map(a => a.percentage),
        backgroundColor: allocation.map(a => a.color),
        borderColor: '#1a1f2e',
        borderWidth: 3,
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 3,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
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
            const label = context.label || '';
            const value = allocation[context.dataIndex].value;
            const percentage = context.parsed;
            return [
              `${label}: $${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
              `(${percentage.toFixed(1)}%)`,
            ];
          },
        },
      },
    },
    cutout: '70%',
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      <h3 className="text-lg font-bold text-white mb-4">Portfolio Allocation</h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="relative" style={{ height: Math.max(height, 250) }}>
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-white">
              ${portfolio.total_value_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {allocation.map((item) => (
            <div
              key={item.symbol}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="font-medium text-white">{item.symbol}</p>
                  <p className="text-xs text-gray-400">{item.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">{item.percentage.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">
                  ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


