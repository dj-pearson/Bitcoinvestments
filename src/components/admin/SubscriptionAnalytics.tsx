import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
} from 'lucide-react';
import {
  getSubscriptionAnalytics,
  getCohortRetention,
  formatCurrency,
  formatPercentage,
  type SubscriptionMetrics,
  type CohortData,
} from '../../services/subscriptionAnalytics';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, changeLabel, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-slate-700/50 rounded-lg">{icon}</div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm ${
              trend === 'up'
                ? 'text-green-400'
                : trend === 'down'
                ? 'text-red-400'
                : 'text-slate-400'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="h-4 w-4" />
            ) : null}
            <span>{formatPercentage(change)}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
      {changeLabel && <div className="text-xs text-slate-500 mt-1">{changeLabel}</div>}
    </div>
  );
}

interface ChartBarProps {
  value: number;
  maxValue: number;
  label: string;
}

function ChartBar({ value, maxValue, label }: ChartBarProps) {
  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-24 w-6 bg-slate-700/50 rounded-t relative flex items-end">
        <div
          className="w-full bg-orange-500 rounded-t transition-all duration-300"
          style={{ height: `${height}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

export function SubscriptionAnalytics() {
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [metricsResult, cohortsResult] = await Promise.all([
      getSubscriptionAnalytics(),
      getCohortRetention(),
    ]);

    if (metricsResult.error) {
      setError(metricsResult.error);
    } else {
      setMetrics(metricsResult.metrics);
    }

    if (!cohortsResult.error) {
      setCohorts(cohortsResult.cohorts);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 text-center">
        <p className="text-slate-400">No subscription data available</p>
      </div>
    );
  }

  const maxMrr = Math.max(...metrics.mrrHistory.map((m) => m.value));
  const maxSubs = Math.max(...metrics.subscriberHistory.map((s) => s.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Subscription Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">
            Track MRR, churn, and subscriber health
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr)}
          change={metrics.mrrGrowth}
          changeLabel="vs last month"
          icon={<DollarSign className="h-5 w-5 text-green-400" />}
          trend={metrics.mrrGrowth > 0 ? 'up' : metrics.mrrGrowth < 0 ? 'down' : 'neutral'}
        />
        <MetricCard
          title="Active Subscribers"
          value={metrics.activeSubscribers}
          change={
            metrics.newSubscribersThisMonth > 0
              ? ((metrics.newSubscribersThisMonth / (metrics.activeSubscribers - metrics.newSubscribersThisMonth || 1)) * 100)
              : 0
          }
          changeLabel={`${metrics.newSubscribersThisMonth} new this month`}
          icon={<Users className="h-5 w-5 text-blue-400" />}
          trend={metrics.newSubscribersThisMonth > 0 ? 'up' : 'neutral'}
        />
        <MetricCard
          title="Churn Rate"
          value={`${metrics.churnRate}%`}
          change={-metrics.churnRate}
          changeLabel={`${metrics.cancelledThisMonth} cancelled`}
          icon={<TrendingDown className="h-5 w-5 text-red-400" />}
          trend={metrics.churnRate > 5 ? 'down' : 'up'}
        />
        <MetricCard
          title="Lifetime Value"
          value={formatCurrency(metrics.ltv)}
          changeLabel={`~${metrics.avgSubscriptionLength.toFixed(1)} months avg.`}
          icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-orange-400" />
            <h3 className="font-semibold text-white">Annual Recurring Revenue</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatCurrency(metrics.arr)}
          </div>
          <div className="text-sm text-slate-400">Projected yearly revenue</div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-orange-400" />
            <h3 className="font-semibold text-white">Tier Breakdown</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Monthly</span>
                <span className="text-white">{metrics.tierBreakdown.monthly}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{
                    width: `${
                      metrics.activeSubscribers > 0
                        ? (metrics.tierBreakdown.monthly / metrics.activeSubscribers) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Annual</span>
                <span className="text-white">{metrics.tierBreakdown.annual}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{
                    width: `${
                      metrics.activeSubscribers > 0
                        ? (metrics.tierBreakdown.annual / metrics.activeSubscribers) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-orange-400" />
            <h3 className="font-semibold text-white">Retention Rate</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {metrics.retentionRate}%
          </div>
          <div className="text-sm text-slate-400">
            ARPU: {formatCurrency(metrics.avgRevenuePerUser)}/mo
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR History */}
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-orange-400" />
            <h3 className="font-semibold text-white">MRR Trend (12 Months)</h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {metrics.mrrHistory.map((month) => (
              <ChartBar
                key={month.month}
                value={month.value}
                maxValue={maxMrr}
                label={month.month}
              />
            ))}
          </div>
        </div>

        {/* Subscriber History */}
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-orange-400" />
            <h3 className="font-semibold text-white">Subscriber Trend (12 Months)</h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {metrics.subscriberHistory.map((month) => (
              <ChartBar
                key={month.month}
                value={month.value}
                maxValue={maxSubs}
                label={month.month}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cohort Retention Table */}
      {cohorts.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 overflow-x-auto">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-orange-400" />
            <h3 className="font-semibold text-white">Cohort Retention</h3>
          </div>
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                <th className="pb-3 pr-4">Cohort</th>
                <th className="pb-3 px-4 text-center">Size</th>
                <th className="pb-3 px-4 text-center">Month 1</th>
                <th className="pb-3 px-4 text-center">Month 2</th>
                <th className="pb-3 px-4 text-center">Month 3</th>
                <th className="pb-3 px-4 text-center">Month 4</th>
                <th className="pb-3 px-4 text-center">Month 5</th>
                <th className="pb-3 pl-4 text-center">Month 6</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={cohort.cohort} className="border-b border-slate-700/50">
                  <td className="py-3 pr-4 text-white font-medium">{cohort.cohort}</td>
                  <td className="py-3 px-4 text-center text-slate-300">{cohort.size}</td>
                  {[0, 1, 2, 3, 4, 5].map((month) => (
                    <td key={month} className="py-3 px-4 text-center">
                      {cohort.retention[month] !== undefined ? (
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            cohort.retention[month] >= 80
                              ? 'bg-green-500/20 text-green-400'
                              : cohort.retention[month] >= 50
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {cohort.retention[month]}%
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
