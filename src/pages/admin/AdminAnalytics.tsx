import { useState, useEffect } from 'react';
import {
  TrendingDown,
  Users,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
} from 'lucide-react';
import { SubscriptionAnalytics as SubscriptionAnalyticsComponent } from '../../components/admin/SubscriptionAnalytics';
import { getSubscriptionAnalytics } from '../../services/subscriptionAnalytics';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

interface MetricData {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  iconColor: string;
}

export function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    await getSubscriptionAnalytics();
    setLoading(false);
  }

  // Simulated traffic data
  const trafficData = [
    { date: 'Mon', visitors: 1250, pageViews: 3420 },
    { date: 'Tue', visitors: 1480, pageViews: 4100 },
    { date: 'Wed', visitors: 1320, pageViews: 3890 },
    { date: 'Thu', visitors: 1580, pageViews: 4560 },
    { date: 'Fri', visitors: 1890, pageViews: 5200 },
    { date: 'Sat', visitors: 2100, pageViews: 5890 },
    { date: 'Sun', visitors: 1650, pageViews: 4320 },
  ];

  const topPages = [
    { path: '/', title: 'Home', views: 12450, change: 12.3 },
    { path: '/dashboard', title: 'Dashboard', views: 8920, change: 8.1 },
    { path: '/charts', title: 'Charts', views: 6340, change: -2.4 },
    { path: '/learn', title: 'Learn', views: 5120, change: 15.7 },
    { path: '/pricing', title: 'Pricing', views: 4890, change: 5.2 },
  ];

  const userMetrics: MetricData[] = [
    {
      label: 'Total Visitors',
      value: '24.5K',
      change: 12.4,
      trend: 'up',
      icon: Eye,
      iconColor: 'text-blue-400',
    },
    {
      label: 'Unique Users',
      value: '8,432',
      change: 8.2,
      trend: 'up',
      icon: Users,
      iconColor: 'text-violet-400',
    },
    {
      label: 'Avg. Session',
      value: '4m 32s',
      change: -3.1,
      trend: 'down',
      icon: Clock,
      iconColor: 'text-amber-400',
    },
    {
      label: 'Bounce Rate',
      value: '34.2%',
      change: -5.8,
      trend: 'up',
      icon: TrendingDown,
      iconColor: 'text-emerald-400',
    },
  ];

  const maxVisitors = Math.max(...trafficData.map((d) => d.visitors));
  const maxPageViews = Math.max(...trafficData.map((d) => d.pageViews));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Monitor platform performance and user engagement</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
            {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {userMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-white/5`}>
                  <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{metric.value}</p>
              <p className="text-sm text-slate-400 mt-1">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Traffic Chart */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Traffic Overview</h2>
            <p className="text-sm text-slate-400 mt-1">Visitors and page views over time</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              Visitors
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-violet-500" />
              Page Views
            </span>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="h-64 flex items-end justify-between gap-2">
          {trafficData.map((data) => (
            <div key={data.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex justify-center gap-1 h-48">
                <div
                  className="w-5 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-md transition-all duration-300"
                  style={{ height: `${(data.visitors / maxVisitors) * 100}%` }}
                />
                <div
                  className="w-5 bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-md transition-all duration-300"
                  style={{ height: `${(data.pageViews / maxPageViews) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{data.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">Top Pages</h2>
          </div>
          <div className="divide-y divide-white/5">
            {topPages.map((page, index) => (
              <div key={page.path} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-slate-400">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{page.title}</p>
                    <p className="text-xs text-slate-500">{page.path}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{page.views.toLocaleString()}</p>
                  <p
                    className={`text-xs ${
                      page.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {page.change >= 0 ? '+' : ''}
                    {page.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Conversion Funnel</h2>
          <div className="space-y-4">
            {[
              { stage: 'Visitors', value: 24500, percent: 100 },
              { stage: 'Sign Ups', value: 3420, percent: 14 },
              { stage: 'Free Trial', value: 1890, percent: 7.7 },
              { stage: 'Paid Conversion', value: 567, percent: 2.3 },
            ].map((step) => (
              <div key={step.stage}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">{step.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{step.value.toLocaleString()}</span>
                    <span className="text-slate-500">{step.percent}%</span>
                  </div>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${step.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Analytics */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-6">
        <SubscriptionAnalyticsComponent />
      </div>
    </div>
  );
}

