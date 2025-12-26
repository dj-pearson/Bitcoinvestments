import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flag,
  MessageSquare,
  Star,
  User,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { getFlaggedContent, moderateContent, type FlaggedContent } from '../../services/contentModeration';

type ContentTab = 'review' | 'comment' | 'report' | 'all';
type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

export function ContentModeration() {
  const [content, setContent] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  async function loadContent() {
    setLoading(true);
    const result = await getFlaggedContent({
      type: activeTab !== 'all' ? activeTab : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });

    if (!result.error) {
      setContent(result.content);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter]);

  async function handleModerate(id: string, action: 'approve' | 'reject') {
    const result = await moderateContent(id, action);
    if (result.success) {
      loadContent();
    }
  }

  async function handleBulkAction(action: 'approve' | 'reject') {
    for (const id of selectedItems) {
      await moderateContent(id, action);
    }
    setSelectedItems([]);
    loadContent();
  }

  const tabs = [
    { id: 'all', label: 'All Content', icon: FileText },
    { id: 'review', label: 'Reviews', icon: Star },
    { id: 'comment', label: 'Comments', icon: MessageSquare },
    { id: 'report', label: 'User Reports', icon: Flag },
  ];

  const stats = [
    { label: 'Pending Review', value: content.filter((c) => c.status === 'pending').length, color: 'text-amber-400' },
    { label: 'Approved Today', value: 12, color: 'text-emerald-400' },
    { label: 'Rejected Today', value: 3, color: 'text-red-400' },
    { label: 'Flagged Content', value: content.filter((c) => c.flagged).length, color: 'text-violet-400' },
  ];

  const filteredContent = content.filter((item) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        item.content?.toLowerCase().includes(search) ||
        item.author_email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
          <p className="text-slate-400 mt-1">Review and moderate user-generated content</p>
        </div>
        <button
          onClick={loadContent}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-white/5 p-4"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ContentTab)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mt-4 flex items-center gap-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <span className="text-sm text-orange-400">
              {selectedItems.length} item(s) selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => handleBulkAction('approve')}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve All
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject All
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-3 py-1.5 text-slate-400 text-sm hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-12 text-center">
            <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading content...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No content to review</p>
          </div>
        ) : (
          filteredContent.map((item) => (
            <div
              key={item.id}
              className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border ${
                selectedItems.includes(item.id) ? 'border-orange-500/50' : 'border-white/5'
              } overflow-hidden`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, item.id]);
                      } else {
                        setSelectedItems(selectedItems.filter((id) => id !== item.id));
                      }
                    }}
                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-white/5 text-orange-500 focus:ring-orange-500/50"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.type === 'review'
                            ? 'bg-violet-500/10 text-violet-400'
                            : item.type === 'comment'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {item.type}
                      </span>
                      {item.flagged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-400">
                          <Flag className="w-3 h-3" />
                          Flagged
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400'
                            : item.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-white mb-3">{item.content}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {item.author_email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.flag_reason && (
                        <span className="inline-flex items-center gap-1 text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          {item.flag_reason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleModerate(item.id, 'approve')}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleModerate(item.id, 'reject')}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

