import { useState } from 'react';
import {
  Send,
  AlertCircle,
  CheckCircle,
  Crown,
  Clock,
  HelpCircle,
  CreditCard,
  Settings,
  Lightbulb,
  Bug,
} from 'lucide-react';
import {
  createSupportTicket,
  type TicketCategory,
  type TicketPriority,
} from '../services/supportTickets';
import { useAuth } from '../contexts/AuthContext';

interface SupportTicketFormProps {
  onSuccess?: (ticketNumber: string) => void;
  onCancel?: () => void;
}

const CATEGORIES: { value: TicketCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'account', label: 'Account Issues', icon: <Settings className="h-5 w-5" /> },
  { value: 'billing', label: 'Billing & Payments', icon: <CreditCard className="h-5 w-5" /> },
  { value: 'technical', label: 'Technical Support', icon: <HelpCircle className="h-5 w-5" /> },
  { value: 'feature_request', label: 'Feature Request', icon: <Lightbulb className="h-5 w-5" /> },
  { value: 'bug_report', label: 'Bug Report', icon: <Bug className="h-5 w-5" /> },
  { value: 'other', label: 'Other', icon: <HelpCircle className="h-5 w-5" /> },
];

const PRIORITIES: { value: TicketPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'General questions, no urgency' },
  { value: 'normal', label: 'Normal', description: 'Standard support request' },
  { value: 'high', label: 'High', description: 'Affecting my workflow' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue, need immediate help' },
];

export function SupportTicketForm({ onSuccess, onCancel }: SupportTicketFormProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('technical');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is premium (you would check this from your subscription system)
  const isPremium = (user as { subscription?: { status: string } } | null)?.subscription?.status === 'active';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Please log in to submit a support ticket');
      return;
    }

    if (!subject.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createSupportTicket({
      userId: user.id,
      userEmail: user.email,
      userName: (user as { name?: string }).name ?? 'User',
      isPremium,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.ticket) {
      setSuccess(result.ticket.ticket_number);
      onSuccess?.(result.ticket.ticket_number);
    }
  };

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Ticket Created Successfully!</h3>
        <p className="text-slate-400 mb-4">
          Your ticket number is <span className="text-green-400 font-mono">{success}</span>
        </p>
        <p className="text-sm text-slate-500">
          {isPremium
            ? "As a Premium member, you'll receive a response within 4 hours."
            : "You'll receive a response within 48 hours."}
        </p>
        <button
          onClick={() => {
            setSuccess(null);
            setSubject('');
            setDescription('');
          }}
          className="mt-6 px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Submit Another Ticket
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Premium Badge */}
      {isPremium && (
        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <Crown className="h-5 w-5 text-orange-400" />
          <span className="text-orange-400 font-medium">Premium Support</span>
          <span className="text-slate-400 text-sm ml-2">
            4-hour response time guaranteed
          </span>
        </div>
      )}

      {/* Response Time Indicator */}
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Clock className="h-4 w-4" />
        <span>
          Expected response time:{' '}
          <span className={isPremium ? 'text-green-400' : 'text-slate-300'}>
            {isPremium ? '4 hours' : '48 hours'}
          </span>
        </span>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          What can we help you with?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                category === cat.value
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {cat.icon}
              <span className="text-sm">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
          Subject <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your issue"
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide as much detail as possible..."
          rows={5}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          required
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Priority Level
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`p-3 rounded-lg border transition-all text-left ${
                priority === p.value
                  ? p.value === 'urgent'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : p.value === 'high'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : p.value === 'normal'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-500/20 border-slate-500 text-slate-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-medium text-sm">{p.label}</div>
              <div className="text-xs opacity-70 mt-1">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Submit Ticket</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
