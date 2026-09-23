import { useEffect, useState, memo, useMemo, useCallback } from 'react';
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
import { fetchHistoricalData, describeMarketError } from '../../services/coingecko';
import { fmtAxisUsd, fmtUsd, fmtPct, fmtDateTime } from '../../lib/marketFormat';
import { CHART_PERIODS, formatChartLabel, type ChartPeriod } from './PriceChart';
import { Loader2, X, RefreshCw } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface ComparedCoin {
  id: string;
  symbol: string;
  name: string;
  color?: string;
}

interface ComparisonChartProps {
  cryptocurrencies: ComparedCoin[];
  days?: ChartPeriod;
  currency?: string;
  height?: number;
  onRemoveCrypto?: (id: string) => void;
  /** Controlled period: when provided, `days` is the current value. */
  onPeriodChange?: (days: ChartPeriod) => void;
}

/** Shared 8-colour palette (the comparison is limited to 8 coins). */
export const COMPARISON_COLORS = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#10b981', // Green
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

export const MAX_COMPARED_COINS = COMPARISON_COLORS.length;

interface SeriesStats {
  start: number;
  end: number;
  change: number;
  high: number;
  low: number;
  maxDrawdown: number;
}

interface LoadedSeries {
  id: string;
  label: string;
  symbol: string;
  color: string;
  /** Price aligned to the shared timeline (null before the coin's data starts). */
  prices: (number | null)[];
  stats: SeriesStats;
}

function computeStats(points: [number, number][]): SeriesStats {
  const prices = points.map(([, p]) => p).filter((p) => Number.isFinite(p));
  const start = prices[0];
  const end = prices[prices.length - 1];
  let peak = -Infinity;
  let maxDrawdown = 0;
  let high = -Infinity;
  let low = Infinity;
  for (const p of prices) {
    if (p > peak) peak = p;
    if (peak > 0) maxDrawdown = Math.min(maxDrawdown, ((p - peak) / peak) * 100);
    high = Math.max(high, p);
    low = Math.min(low, p);
  }
  return {
    start,
    end,
    change: start > 0 ? ((end - start) / start) * 100 : NaN,
    high,
    low,
    maxDrawdown,
  };
}

/**
 * Align a series to reference timestamps: for each reference time, take the
 * latest point at or before it (null if the series has not started yet).
 */
function alignToTimeline(timeline: number[], points: [number, number][]): (number | null)[] {
  const out: (number | null)[] = [];
  let j = 0;
  let last: number | null = null;
  for (const t of timeline) {
    while (j < points.length && points[j][0] <= t) {
      last = points[j][1];
      j++;
    }
    out.push(last);
  }
  return out;
}

export const ComparisonChart = memo(function ComparisonChart({
  cryptocurrencies,
  days = 7,
  currency = 'usd',
  height = 350,
  onRemoveCrypto,
  onPeriodChange,
}: ComparisonChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [internalPeriod, setInternalPeriod] = useState<ChartPeriod>(days);
  const selectedPeriod: ChartPeriod = onPeriodChange ? days : internalPeriod;
  const [normalize, setNormalize] = useState(true);
  const [timeline, setTimeline] = useState<number[]>([]);
  const [series, setSeries] = useState<LoadedSeries[]>([]);
  const [asOf, setAsOf] = useState<{ fetchedAt: number; stale: boolean } | null>(null);

  // Stable dependency on the list's contents rather than the array identity.
  const coinsKey = cryptocurrencies.map((c) => `${c.id}:${c.color ?? ''}`).join('|');

  function selectPeriod(value: ChartPeriod) {
    if (onPeriodChange) onPeriodChange(value);
    else setInternalPeriod(value);
  }

  const loadComparisonData = useCallback(async (force = false) => {
    const coins = cryptocurrencies.slice(0, MAX_COMPARED_COINS);
    if (coins.length === 0) {
      setSeries([]);
      setTimeline([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const results = await Promise.allSettled(
      coins.map((coin) => fetchHistoricalData(coin.id, selectedPeriod, currency, { force }))
    );

    const ok: { coin: ComparedCoin; index: number; points: [number, number][]; fetchedAt: number; stale: boolean }[] = [];
    const failedNames: string[] = [];
    let firstError: unknown = null;
    results.forEach((result, index) => {
      const coin = coins[index];
      if (result.status === 'fulfilled' && result.value.data.prices?.length > 1) {
        ok.push({
          coin,
          index,
          points: result.value.data.prices,
          fetchedAt: result.value.fetchedAt,
          stale: result.value.stale,
        });
      } else {
        failedNames.push(coin.name);
        if (result.status === 'rejected' && !firstError) firstError = result.reason;
      }
    });

    setFailed(failedNames);

    if (ok.length === 0) {
      setSeries([]);
      setTimeline([]);
      setError(describeMarketError(firstError));
      setLoading(false);
      return;
    }

    // Use the series with the most points as the shared timeline.
    const reference = ok.reduce((a, b) => (b.points.length > a.points.length ? b : a));
    const times = reference.points.map(([t]) => t);

    setTimeline(times);
    setSeries(
      ok.map(({ coin, index, points }) => ({
        id: coin.id,
        label: coin.name,
        symbol: coin.symbol,
        color: coin.color || COMPARISON_COLORS[index % COMPARISON_COLORS.length],
        prices: alignToTimeline(times, points),
        stats: computeStats(points),
      }))
    );
    setAsOf({
      fetchedAt: Math.min(...ok.map((o) => o.fetchedAt)),
      stale: ok.some((o) => o.stale),
    });
    setLoading(false);
    // coinsKey captures the relevant contents of `cryptocurrencies`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinsKey, selectedPeriod, currency]);

  useEffect(() => {
    loadComparisonData();
  }, [loadComparisonData]);

  const labels = useMemo(
    () => timeline.map((t) => formatChartLabel(t, selectedPeriod)),
    [timeline, selectedPeriod]
  );

  // Normalising is a pure transform; toggling it does not refetch.
  const datasets = useMemo(
    () =>
      series.map((s) => {
        const base = s.prices.find((p): p is number => p !== null && p > 0);
        const values = normalize
          ? s.prices.map((p) => (p === null || !base ? null : ((p - base) / base) * 100))
          : s.prices;
        return {
          label: s.label,
          data: values,
          borderColor: s.color,
          backgroundColor: `${s.color}15`,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: s.color,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
          spanGaps: false,
        };
      }),
    [series, normalize]
  );

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
            const value = context.parsed.y;
            if (value === null || value === undefined) return `${label}: no data`;
            return normalize ? `${label}: ${fmtPct(value)}` : `${label}: ${fmtUsd(value)}`;
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
            const num = Number(value);
            return normalize ? `${num >= 0 ? '+' : ''}${num.toFixed(0)}%` : fmtAxisUsd(num);
          },
        },
      },
    },
  };

  if (cryptocurrencies.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800"
        style={{ height }}
      >
        <div className="text-center text-gray-400">
          <p className="font-medium mb-1">No cryptocurrencies selected</p>
          <p className="text-sm">Search above to add up to {MAX_COMPARED_COINS} coins</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800"
        style={{ height }}
        role="status"
        aria-busy="true"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" aria-hidden="true" />
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
        role="alert"
      >
        <div className="text-center text-red-400 px-4">
          <p className="font-medium mb-1">Comparison unavailable</p>
          <p className="text-sm text-gray-400 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => loadComparisonData(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const periodLong = CHART_PERIODS.find((p) => p.value === selectedPeriod)?.long ?? `${selectedPeriod} days`;

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">Price comparison, last {periodLong}</h3>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setNormalize(!normalize)}
              aria-pressed={normalize}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                normalize
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {normalize ? 'Showing % change' : 'Showing prices'}
            </button>

            <div className="flex flex-wrap gap-1 bg-gray-800/50 rounded-lg p-1" role="group" aria-label="Time period">
              {CHART_PERIODS.map((period) => (
                <button
                  key={period.value}
                  type="button"
                  onClick={() => selectPeriod(period.value)}
                  aria-pressed={selectedPeriod === period.value}
                  aria-label={`Compare over ${period.long}`}
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

        {failed.length > 0 && (
          <p className="text-xs text-amber-300" role="status">
            Could not load {failed.join(', ')}; showing the rest.{' '}
            <button type="button" className="underline" onClick={() => loadComparisonData(true)}>
              Retry
            </button>
          </p>
        )}

        {/* Legend with removable chips */}
        <ul className="flex flex-wrap gap-2">
          {series.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700"
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
              <span className="text-sm font-medium text-white">{s.label}</span>
              <span className={`text-xs font-medium ${s.stats.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmtPct(s.stats.change)}
              </span>
              {onRemoveCrypto && (
                <button
                  type="button"
                  onClick={() => onRemoveCrypto(s.id)}
                  aria-label={`Remove ${s.label} from comparison`}
                  className="ml-1 p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Chart */}
      <div style={{ height }} role="img" aria-label={`Line chart comparing ${series.map((s) => s.label).join(', ')} over ${periodLong}`}>
        <Line data={{ labels, datasets }} options={options} />
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {normalize
          ? '% change view: every line starts at 0% at the beginning of the period, so coins with very different prices can be compared.'
          : 'Price view: absolute USD prices. Coins with very different prices will look flat next to each other; switch to % change to compare performance.'}
        {asOf && (
          <span className={asOf.stale ? ' text-amber-300' : ''}>
            {' '}CoinGecko data {asOf.stale ? '(could not refresh) as of' : 'as of'} {fmtDateTime(asOf.fetchedAt)}.
          </span>
        )}
      </p>

      {/* Performance summary */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="text-left text-sm font-semibold text-white mb-2">
            Performance over the last {periodLong}
          </caption>
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th scope="col" className="text-left py-2 pr-3 font-medium">Coin</th>
              <th scope="col" className="text-right py-2 px-3 font-medium">Start</th>
              <th scope="col" className="text-right py-2 px-3 font-medium">Latest</th>
              <th scope="col" className="text-right py-2 px-3 font-medium">Change</th>
              <th scope="col" className="text-right py-2 px-3 font-medium">High</th>
              <th scope="col" className="text-right py-2 px-3 font-medium">Low</th>
              <th scope="col" className="text-right py-2 pl-3 font-medium">
                <abbr title="Largest fall from a peak to a later low within the period">Max drawdown</abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...series]
              .sort((a, b) => (b.stats.change || 0) - (a.stats.change || 0))
              .map((s) => (
                <tr key={s.id} className="border-b border-gray-800/60">
                  <th scope="row" className="text-left py-2 pr-3 font-medium text-white">
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: s.color }} aria-hidden="true" />
                    {s.label} <span className="text-gray-500 uppercase">{s.symbol}</span>
                  </th>
                  <td className="text-right py-2 px-3 text-gray-300">{fmtUsd(s.stats.start)}</td>
                  <td className="text-right py-2 px-3 text-gray-300">{fmtUsd(s.stats.end)}</td>
                  <td className={`text-right py-2 px-3 font-medium ${s.stats.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmtPct(s.stats.change)}
                  </td>
                  <td className="text-right py-2 px-3 text-gray-300">{fmtUsd(s.stats.high)}</td>
                  <td className="text-right py-2 px-3 text-gray-300">{fmtUsd(s.stats.low)}</td>
                  <td className="text-right py-2 pl-3 text-red-300">{fmtPct(s.stats.maxDrawdown)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Past performance does not predict future returns.</p>
      </div>
    </div>
  );
});
