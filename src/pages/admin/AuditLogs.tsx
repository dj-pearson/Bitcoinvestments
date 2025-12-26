import { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Download,
  RefreshCw,
  User,
  Shield,
  Settings,
  CreditCard,
  AlertTriangle,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { getAuditLogs, type AuditLogEntry } from '../../services/auditLog';

const actionCategories = [
  { id: 'all', label: 'All Actions', icon: ScrollText },
  { id: 'user', label: 'User Actions', icon: User },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'subscription', label: 'Subscriptions', icon: CreditCard },
  { id: 'scam_report', label: 'Scam Reports', icon: Shield },
  { id: 'security', label: 'Security', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const getActionColor = (action: string) => {
  if (action.includes('created') || action.includes('approved') || action.includes('verified')) {
    return 'bg-emerald-500/10 text-emerald-400';
  }
  if (action.includes('deleted') || action.includes('rejected') || action.includes('suspended')) {
    return 'bg-red-500/10 text-red-400';
  }
  if (action.includes('updated') || action.includes('changed')) {
    return 'bg-blue-500/10 text-blue-400';
  }
  if (action.includes('flagged') || action.includes('investigating')) {
    return 'bg-amber-500/10 text-amber-400';
  }
  return 'bg-slate-500/10 text-slate-400';
};

const getActionIcon = (action: string) => {
  if (action.startsWith('user.')) return User;
  if (action.startsWith('content.')) return FileText;
  if (action.startsWith('subscription.')) return CreditCard;
  if (action.startsWith('scam_report.')) return Shield;
  if (action.startsWith('security.')) return AlertTriangle;
  if (action.startsWith('settings.')) return Settings;
  return ScrollText;
};

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const ITEMS_PER_PAGE = 20;

  async function loadLogs() {
    setLoading(true);
    const result = await getAuditLogs({
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
    });

    if (!result.error) {
      // Filter by category client-side if needed
      let filteredLogs = result.logs;
      if (selectedCategory !== 'all') {
        filteredLogs = result.logs.filter(log => log.action.startsWith(`${selectedCategory}.`));
      }
      setLogs(filteredLogs);
      setTotalPages(Math.ceil(result.total / ITEMS_PER_PAGE) || 1);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCategory]);

  const filteredLogs = logs.filter((log) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(search) ||
        log.target_id?.toLowerCase().includes(search) ||
        log.admin_email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 mt-1">Track all administrative actions and system events</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
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
                placeholder="Search by action, target, or admin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {actionCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => {
                  const Icon = getActionIcon(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-white">
                            {log.action.replace('.', ' ').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-300">{log.admin_email || 'System'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm">
                          <span className="text-slate-400">{log.target_type}</span>
                          {log.target_id && (
                            <span className="ml-2 text-slate-500 font-mono text-xs">
                              {log.target_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-400 max-w-xs truncate block">
                          {log.details ? JSON.stringify(log.details).slice(0, 50) : '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="w-4 h-4" />
                          {new Date(log.created_at).toLocaleString()}
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
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

