import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Download,
  RefreshCw,
  User,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  Ban,
} from 'lucide-react';

interface Subscription {
  id: string;
  user_email: string;
  user_id: string;
  plan: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  amount: number;
  started_at: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  cancelled: 'bg-slate-500/10 text-slate-400',
  past_due: 'bg-red-500/10 text-red-400',
  trialing: 'bg-blue-500/10 text-blue-400',
};

const statusIcons: Record<string, React.ElementType> = {
  active: CheckCircle,
  cancelled: XCircle,
  past_due: AlertCircle,
  trialing: Clock,
};

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  async function loadSubscriptions() {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Mock data
    const mockSubscriptions: Subscription[] = [
      {
        id: 'sub_1',
        user_email: 'john@example.com',
        user_id: 'user_1',
        plan: 'annual',
        status: 'active',
        amount: 99.99,
        started_at: '2024-01-15T00:00:00Z',
        current_period_end: '2025-01-15T00:00:00Z',
        cancel_at_period_end: false,
      },
      {
        id: 'sub_2',
        user_email: 'sarah@example.com',
        user_id: 'user_2',
        plan: 'monthly',
        status: 'active',
        amount: 9.99,
        started_at: '2024-11-01T00:00:00Z',
        current_period_end: '2024-12-01T00:00:00Z',
        cancel_at_period_end: false,
      },
      {
        id: 'sub_3',
        user_email: 'mike@example.com',
        user_id: 'user_3',
        plan: 'monthly',
        status: 'past_due',
        amount: 9.99,
        started_at: '2024-08-15T00:00:00Z',
        current_period_end: '2024-11-15T00:00:00Z',
        cancel_at_period_end: false,
      },
      {
        id: 'sub_4',
        user_email: 'emma@example.com',
        user_id: 'user_4',
        plan: 'annual',
        status: 'cancelled',
        amount: 99.99,
        started_at: '2024-03-01T00:00:00Z',
        current_period_end: '2025-03-01T00:00:00Z',
        cancel_at_period_end: true,
      },
      {
        id: 'sub_5',
        user_email: 'alex@example.com',
        user_id: 'user_5',
        plan: 'monthly',
        status: 'trialing',
        amount: 0,
        started_at: '2024-12-01T00:00:00Z',
        current_period_end: '2024-12-15T00:00:00Z',
        cancel_at_period_end: false,
      },
    ];

    setSubscriptions(mockSubscriptions);
    setLoading(false);
  }

  useEffect(() => {
    loadSubscriptions();
     
  }, [statusFilter, planFilter, page]);

  const stats = [
    {
      label: 'Total MRR',
      value: '$4,892',
      change: '+12.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-400',
    },
    {
      label: 'Active Subscribers',
      value: '234',
      change: '+8.1%',
      trend: 'up',
      icon: User,
      color: 'text-blue-400',
    },
    {
      label: 'Churn Rate',
      value: '2.4%',
      change: '-0.3%',
      trend: 'down',
      icon: TrendingUp,
      color: 'text-violet-400',
    },
    {
      label: 'Past Due',
      value: '12',
      change: '+3',
      trend: 'up',
      icon: AlertCircle,
      color: 'text-amber-400',
    },
  ];

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (planFilter !== 'all' && sub.plan !== planFilter) return false;
    if (searchTerm) {
      return sub.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-slate-400 mt-1">Manage subscriber accounts and billing</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSubscriptions}
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span
                  className={`text-sm ${
                    stat.trend === 'up' && stat.label !== 'Past Due'
                      ? 'text-emerald-400'
                      : stat.trend === 'down' && stat.label === 'Churn Rate'
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="past_due">Past Due</option>
            <option value="trialing">Trialing</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">All Plans</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading subscriptions...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No subscriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Subscriber
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSubscriptions.map((sub) => {
                  const StatusIcon = statusIcons[sub.status];
                  return (
                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <span className="text-xs font-semibold text-white">
                              {sub.user_email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-white">{sub.user_email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            sub.plan === 'annual'
                              ? 'bg-violet-500/10 text-violet-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                            statusColors[sub.status]
                          }`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {sub.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-white font-medium">
                          ${sub.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-400">
                          {new Date(sub.started_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <span className="text-sm text-slate-400">
                            {new Date(sub.current_period_end).toLocaleDateString()}
                          </span>
                          {sub.cancel_at_period_end && (
                            <span className="block text-xs text-red-400 mt-0.5">Cancels</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Cancel Subscription"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Showing {filteredSubscriptions.length} subscriptions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-400">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

