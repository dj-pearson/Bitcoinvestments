import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Activity,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getUserStats, getScamDatabaseStats } from '../services/admin';
import { SubscriptionAnalytics } from '../components/admin/SubscriptionAnalytics';
import { AdminPageHeader, AdminCard } from '../components/admin/AdminLayout';
import type { UserStats, ScamStats } from '../types/admin-database';

export function AdminDashboard() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [scamStats, setScamStats] = useState<ScamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionAnalytics, setShowSubscriptionAnalytics] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);

    const [users, scams] = await Promise.all([
      getUserStats(),
      getScamDatabaseStats(),
    ]);

    setUserStats(users);
    setScamStats(scams);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: userStats?.total_users || 0,
      change: `+${userStats?.new_users_7d || 0} this week`,
      icon: Users,
      color: 'blue',
      link: '/admin/users',
    },
    {
      name: 'Active Users',
      value: userStats?.active_users || 0,
      change: `${userStats?.suspended_users || 0} suspended`,
      icon: Activity,
      color: 'green',
      link: '/admin/users',
    },
    {
      name: 'Premium Users',
      value: userStats?.premium_users || 0,
      change: `${Math.round(((userStats?.premium_users || 0) / (userStats?.total_users || 1)) * 100)}% conversion`,
      icon: TrendingUp,
      color: 'purple',
      link: '/admin/users?filter=premium',
    },
    {
      name: 'Scam Reports',
      value: scamStats?.total_reports || 0,
      change: `${scamStats?.pending_reports || 0} pending review`,
      icon: Shield,
      color: 'orange',
      link: '/admin/scam-database',
    },
    {
      name: 'Verified Scams',
      value: scamStats?.verified_reports || 0,
      change: `${scamStats?.total_victims || 0} victims`,
      icon: AlertTriangle,
      color: 'red',
      link: '/admin/scam-database?status=verified',
    },
    {
      name: 'Total Losses',
      value: `$${((scamStats?.total_loss_usd || 0) / 1000000).toFixed(1)}M`,
      change: 'Estimated total',
      icon: BarChart3,
      color: 'yellow',
      link: '/admin/scam-database',
    },
  ];

  return (
    <div>
      {/* Header */}
      <AdminPageHeader
        title="Admin Dashboard"
        description="Manage users, content, and monitor system health"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, { bg: string; text: string }> = {
            blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
            green: { bg: 'bg-green-500/10', text: 'text-green-400' },
            purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
            orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
            red: { bg: 'bg-red-500/10', text: 'text-red-400' },
            yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
          };
          const colors = colorClasses[stat.color] || colorClasses.blue;
          return (
            <Link
              key={stat.name}
              to={stat.link}
              className="block"
            >
              <AdminCard className="hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">
                      {stat.name}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                </div>
              </AdminCard>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/admin/users"
              className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-400 mr-3" />
                <span className="text-white font-medium">
                  Manage Users
                </span>
              </div>
            </Link>
            <Link
              to="/admin/scam-database"
              className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-orange-400 mr-3" />
                <span className="text-white font-medium">
                  Review Scam Reports
                </span>
              </div>
            </Link>
            <Link
              to="/admin/audit-logs"
              className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-green-400 mr-3" />
                <span className="text-white font-medium">
                  View Audit Logs
                </span>
              </div>
            </Link>
            <Link
              to="/admin/ai-settings"
              className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center">
                <Bot className="w-5 h-5 text-purple-400 mr-3" />
                <span className="text-white font-medium">
                  AI Model Settings
                </span>
              </div>
            </Link>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">
            System Health
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Database</span>
                <span className="text-green-400 font-medium">
                  Operational
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">API Services</span>
                <span className="text-green-400 font-medium">
                  Operational
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Authentication</span>
                <span className="text-green-400 font-medium">
                  Operational
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">AI Services (Claude)</span>
                <Link
                  to="/admin/ai-settings"
                  className="text-purple-400 font-medium hover:underline"
                >
                  Configure
                </Link>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Subscription Analytics Section */}
      <AdminCard padding="none" className="mb-8">
        <button
          onClick={() => setShowSubscriptionAnalytics(!showSubscriptionAnalytics)}
          className="w-full px-6 py-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-orange-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Subscription Analytics
              </h2>
              <p className="text-sm text-gray-400">
                MRR, churn rate, LTV, and subscriber metrics
              </p>
            </div>
          </div>
          {showSubscriptionAnalytics ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {showSubscriptionAnalytics && (
          <div className="px-6 pb-6">
            <SubscriptionAnalytics />
          </div>
        )}
      </AdminCard>
    </div>
  );
}
