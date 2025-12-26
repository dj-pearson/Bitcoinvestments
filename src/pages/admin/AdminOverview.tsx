import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Zap,
  UserPlus,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { getUserStats, getScamDatabaseStats } from '../../services/admin';
import { getSubscriptionAnalytics, formatCurrency } from '../../services/subscriptionAnalytics';
import { getAuditSummary } from '../../services/auditLog';
import type { UserStats, ScamStats } from '../../types/admin-database';

interface QuickStat {
  name: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  link: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface RecentActivity {
  id: string;
  action: string;
  target: string;
  time: string;
  status: 'success' | 'warning' | 'error';
}

export function AdminOverview() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [scamStats, setScamStats] = useState<ScamStats | null>(null);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState<any>(null);
  const [auditSummary, setAuditSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboardData() {
    setLoading(true);

    const [users, scams, subscriptions, audit] = await Promise.all([
      getUserStats(),
      getScamDatabaseStats(),
      getSubscriptionAnalytics(),
      getAuditSummary(),
    ]);

    setUserStats(users);
    setScamStats(scams);
    setSubscriptionMetrics(subscriptions.metrics);
    setAuditSummary(audit.summary);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const quickStats: QuickStat[] = [
    {
      name: 'Total Users',
      value: userStats?.total_users || 0,
      change: userStats?.new_users_7d ? ((userStats.new_users_7d / (userStats.total_users - userStats.new_users_7d)) * 100) : 0,
      changeLabel: `+${userStats?.new_users_7d || 0} this week`,
      icon: Users,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      link: '/admin/users',
      trend: 'up',
    },
    {
      name: 'Monthly Revenue',
      value: formatCurrency(subscriptionMetrics?.mrr || 0),
      change: subscriptionMetrics?.mrrGrowth || 0,
      changeLabel: 'vs last month',
      icon: DollarSign,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      link: '/admin/subscriptions',
      trend: (subscriptionMetrics?.mrrGrowth || 0) >= 0 ? 'up' : 'down',
    },
    {
      name: 'Active Subscribers',
      value: subscriptionMetrics?.activeSubscribers || 0,
      change: subscriptionMetrics?.newSubscribersThisMonth ? ((subscriptionMetrics.newSubscribersThisMonth / (subscriptionMetrics.activeSubscribers - subscriptionMetrics.newSubscribersThisMonth)) * 100) : 0,
      changeLabel: `+${subscriptionMetrics?.newSubscribersThisMonth || 0} new`,
      icon: CreditCard,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
      link: '/admin/subscriptions',
      trend: 'up',
    },
    {
      name: 'Pending Reports',
      value: scamStats?.pending_reports || 0,
      changeLabel: 'Needs review',
      icon: Shield,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      link: '/admin/scam-database',
      trend: 'neutral',
    },
  ];

  const systemStatus = [
    { name: 'Database', status: 'operational', latency: '12ms' },
    { name: 'API Services', status: 'operational', latency: '45ms' },
    { name: 'Authentication', status: 'operational', latency: '23ms' },
    { name: 'AI Services', status: 'operational', latency: '180ms' },
    { name: 'Payment Gateway', status: 'operational', latency: '89ms' },
  ];

  const recentActivities: RecentActivity[] = [
    { id: '1', action: 'New user registration', target: 'user@example.com', time: '2 min ago', status: 'success' },
    { id: '2', action: 'Subscription upgraded', target: 'Premium Plan', time: '15 min ago', status: 'success' },
    { id: '3', action: 'Scam report submitted', target: '#SR-1234', time: '32 min ago', status: 'warning' },
    { id: '4', action: 'Support ticket created', target: '#TK-5678', time: '1 hour ago', status: 'warning' },
    { id: '5', action: 'Failed login attempt', target: 'admin@site.com', time: '2 hours ago', status: 'error' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, Admin</h1>
          <p className="text-slate-400 mt-1">Here's what's happening with your platform today.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.link}
              className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-5 border border-white/5 hover:border-orange-500/30 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                {stat.change !== undefined && (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      stat.trend === 'up'
                        ? 'text-emerald-400'
                        : stat.trend === 'down'
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : stat.trend === 'down' ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : null}
                    <span>{Math.abs(stat.change).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </h3>
                <p className="text-sm text-slate-400">{stat.name}</p>
                {stat.changeLabel && (
                  <p className="text-xs text-slate-500">{stat.changeLabel}</p>
                )}
              </div>
              <ExternalLink className="absolute top-4 right-4 w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & System Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/admin/users"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm text-white font-medium">Add User</span>
              </Link>
              <Link
                to="/admin/scam-database"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-sm text-white font-medium">Review Scams</span>
              </Link>
              <Link
                to="/admin/support"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="p-3 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                  <MessageSquare className="w-5 h-5 text-violet-400" />
                </div>
                <span className="text-sm text-white font-medium">View Tickets</span>
              </Link>
              <Link
                to="/admin/newsletters"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-white font-medium">Send Newsletter</span>
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">System Status</h2>
              <span className="flex items-center gap-2 text-sm text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {systemStatus.map((service) => (
                <div key={service.name} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-white">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">{service.latency}</span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 capitalize">
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm text-slate-400">Churn Rate</span>
              </div>
              <p className="text-2xl font-bold text-white">{subscriptionMetrics?.churnRate || 0}%</p>
              <p className="text-xs text-slate-500 mt-1">{subscriptionMetrics?.cancelledThisMonth || 0} cancelled this month</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm text-slate-400">Lifetime Value</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(subscriptionMetrics?.ltv || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">~{(subscriptionMetrics?.avgSubscriptionLength || 0).toFixed(1)} months avg</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-slate-400">Active Today</span>
              </div>
              <p className="text-2xl font-bold text-white">{auditSummary?.total_actions_today || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Admin actions</p>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <Link to="/admin/audit-logs" className="text-sm text-orange-400 hover:text-orange-300">
                View all
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 p-1.5 rounded-full ${
                        activity.status === 'success'
                          ? 'bg-emerald-500/10'
                          : activity.status === 'warning'
                          ? 'bg-amber-500/10'
                          : 'bg-red-500/10'
                      }`}
                    >
                      {activity.status === 'success' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : activity.status === 'warning' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.action}</p>
                      <p className="text-xs text-slate-500 truncate">{activity.target}</p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Stats */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Platform Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Premium Conversion</span>
                  <span className="text-white font-medium">
                    {Math.round(((userStats?.premium_users || 0) / (userStats?.total_users || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${((userStats?.premium_users || 0) / (userStats?.total_users || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Verified Scams</span>
                  <span className="text-white font-medium">{scamStats?.verified_reports || 0}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${((scamStats?.verified_reports || 0) / (scamStats?.total_reports || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Retention Rate</span>
                  <span className="text-white font-medium">{subscriptionMetrics?.retentionRate || 0}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${subscriptionMetrics?.retentionRate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Total Losses Warning */}
          {(scamStats?.total_loss_usd || 0) > 0 && (
            <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 rounded-2xl border border-red-500/20 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-sm font-medium text-red-400">Scam Impact</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ${((scamStats?.total_loss_usd || 0) / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-red-400/70 mt-1">
                Total estimated losses • {scamStats?.total_victims || 0} victims
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

