import { useState, useEffect } from 'react';
import {
  HeadphonesIcon,
  Search,
  MessageSquare,
  Clock,
  User,
  ChevronRight,
  Send,
  Paperclip,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { getSupportTickets, updateTicketStatus, addTicketReply, type SupportTicket, type TicketStatus } from '../../services/supportTickets';
import { useAuth } from '../../contexts/AuthContext';

type TicketStatusFilter = TicketStatus | 'all';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

const priorityColors: Record<Priority, string> = {
  low: 'bg-slate-500/10 text-slate-400',
  medium: 'bg-blue-500/10 text-blue-400',
  high: 'bg-amber-500/10 text-amber-400',
  urgent: 'bg-red-500/10 text-red-400',
};

const statusColors: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-400',
  in_progress: 'bg-blue-500/10 text-blue-400',
  resolved: 'bg-emerald-500/10 text-emerald-400',
  closed: 'bg-slate-500/10 text-slate-400',
};

type SupportTicketWithReplies = SupportTicket & { 
  replies?: Array<{ content: string; is_admin: boolean; created_at: string }> 
};

export function SupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithReplies | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  async function loadTickets() {
    setLoading(true);
    const result = await getSupportTickets({
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });

    if (!result.error) {
      setTickets(result.tickets);
    }
    setLoading(false);
  }

  async function handleStatusChange(ticketId: string, status: TicketStatus) {
    const result = await updateTicketStatus(ticketId, status);
    if (result.success) {
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    }
  }

  async function handleSendReply() {
    if (!selectedTicket || !replyText.trim() || !user) return;

    setSending(true);
    const result = await addTicketReply(selectedTicket.id, replyText, user.id);
    if (result.success) {
      setReplyText('');
      // Refresh ticket details
      loadTickets();
    }
    setSending(false);
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        ticket.subject.toLowerCase().includes(search) ||
        ticket.user_email?.toLowerCase().includes(search) ||
        ticket.id.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = [
    { label: 'Open Tickets', value: tickets.filter((t) => t.status === 'open').length, color: 'text-amber-400' },
    { label: 'In Progress', value: tickets.filter((t) => t.status === 'in_progress').length, color: 'text-blue-400' },
    { label: 'Resolved Today', value: 8, color: 'text-emerald-400' },
    { label: 'Avg Response Time', value: '2.4h', color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-slate-400 mt-1">Manage and respond to user support requests</p>
        </div>
        <button
          onClick={loadTickets}
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'open', 'in_progress', 'resolved', 'closed'] as TicketStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <HeadphonesIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No tickets found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate">{ticket.user_email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[ticket.priority as Priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden h-full flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedTicket.user_email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(selectedTicket.created_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        #{selectedTicket.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_on_user">Waiting on User</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {/* Initial message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-white">
                      {selectedTicket.user_email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm p-4">
                      <p className="text-sm text-white">{selectedTicket.description}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Replies */}
                {selectedTicket.replies?.map((reply, index) => (
                  <div key={index} className={`flex gap-3 ${reply.is_admin ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        reply.is_admin
                          ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                          : 'bg-gradient-to-br from-violet-500 to-purple-600'
                      }`}
                    >
                      <span className="text-xs font-semibold text-white">
                        {reply.is_admin ? 'A' : selectedTicket.user_email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div
                        className={`rounded-2xl p-4 ${
                          reply.is_admin
                            ? 'bg-orange-500/10 rounded-tr-sm'
                            : 'bg-white/5 rounded-tl-sm'
                        }`}
                      >
                        <p className="text-sm text-white">{reply.content}</p>
                      </div>
                      <p className={`text-xs text-slate-500 mt-1 ${reply.is_admin ? 'text-right' : ''}`}>
                        {new Date(reply.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-white/5">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sending}
                      className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 h-full flex items-center justify-center">
              <div className="text-center p-8">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

