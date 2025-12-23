import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Users,
  Edit3,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  RefreshCw,
  Plus,
  FileText,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface Newsletter {
  id: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipients: number;
  sent_at?: string;
  scheduled_for?: string;
  open_rate?: number;
  click_rate?: number;
  created_at: string;
}

interface NewsletterDraft {
  subject: string;
  content: string;
  audience: 'all' | 'premium' | 'free';
  schedule?: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500/10 text-slate-400',
  scheduled: 'bg-blue-500/10 text-blue-400',
  sent: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-red-500/10 text-red-400',
};

export function AdminNewsletters() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState<NewsletterDraft>({
    subject: '',
    content: '',
    audience: 'all',
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadNewsletters();
  }, []);

  async function loadNewsletters() {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockNewsletters: Newsletter[] = [
      {
        id: 'nl_1',
        subject: 'Weekly Market Update: Bitcoin Hits New Highs',
        status: 'sent',
        recipients: 2450,
        sent_at: '2024-12-20T10:00:00Z',
        open_rate: 42.5,
        click_rate: 8.3,
        created_at: '2024-12-20T08:00:00Z',
      },
      {
        id: 'nl_2',
        subject: 'New Feature: Advanced Portfolio Analytics',
        status: 'scheduled',
        recipients: 2650,
        scheduled_for: '2024-12-25T10:00:00Z',
        created_at: '2024-12-21T14:00:00Z',
      },
      {
        id: 'nl_3',
        subject: 'Holiday Special: Premium Discount',
        status: 'draft',
        recipients: 0,
        created_at: '2024-12-22T09:00:00Z',
      },
      {
        id: 'nl_4',
        subject: 'Year in Review: Your Crypto Journey',
        status: 'sent',
        recipients: 2380,
        sent_at: '2024-12-15T10:00:00Z',
        open_rate: 38.2,
        click_rate: 6.1,
        created_at: '2024-12-15T08:00:00Z',
      },
    ];

    setNewsletters(mockNewsletters);
    setLoading(false);
  }

  async function handleSend() {
    if (!draft.subject || !draft.content) return;

    setSending(true);
    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSending(false);
    setShowComposer(false);
    setDraft({ subject: '', content: '', audience: 'all' });
    loadNewsletters();
  }

  const stats = [
    { label: 'Total Subscribers', value: '3,245', icon: Users, color: 'text-blue-400' },
    { label: 'Avg Open Rate', value: '38.4%', icon: Eye, color: 'text-emerald-400' },
    { label: 'Avg Click Rate', value: '7.2%', icon: TrendingUp, color: 'text-violet-400' },
    { label: 'Sent This Month', value: '4', icon: Send, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Newsletters</h1>
          <p className="text-slate-400 mt-1">Create and manage email newsletters</p>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Newsletter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-white/5 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-white/5">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Compose Newsletter</h2>
              <button
                onClick={() => setShowComposer(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Enter newsletter subject..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Audience</label>
                <select
                  value={draft.audience}
                  onChange={(e) => setDraft({ ...draft, audience: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option value="all">All Subscribers (3,245)</option>
                  <option value="premium">Premium Only (567)</option>
                  <option value="free">Free Users (2,678)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                <textarea
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  placeholder="Write your newsletter content..."
                  rows={10}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Schedule (optional)
                </label>
                <input
                  type="datetime-local"
                  value={draft.schedule || ''}
                  onChange={(e) => setDraft({ ...draft, schedule: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                  <FileText className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  onClick={handleSend}
                  disabled={!draft.subject || !draft.content || sending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {draft.schedule ? 'Schedule' : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter List */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Newsletters</h2>
          <button
            onClick={loadNewsletters}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading newsletters...</p>
          </div>
        ) : newsletters.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No newsletters yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {newsletters.map((newsletter) => (
              <div key={newsletter.id} className="p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium truncate">{newsletter.subject}</h3>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          statusColors[newsletter.status]
                        }`}
                      >
                        {newsletter.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      {newsletter.status === 'sent' && (
                        <>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {newsletter.recipients.toLocaleString()} recipients
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {newsletter.open_rate}% opened
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {newsletter.click_rate}% clicked
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            Sent {new Date(newsletter.sent_at!).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      {newsletter.status === 'scheduled' && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Scheduled for {new Date(newsletter.scheduled_for!).toLocaleString()}
                        </span>
                      )}
                      {newsletter.status === 'draft' && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created {new Date(newsletter.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {newsletter.status === 'draft' && (
                      <>
                        <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-orange-500/10 text-slate-400 hover:text-orange-400 transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {newsletter.status === 'sent' && (
                      <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

