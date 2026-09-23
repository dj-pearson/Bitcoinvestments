import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Search, User } from 'lucide-react';
import { db, isSupabaseConfigured } from '../../lib/supabase';
import { usePageTitle } from '../../hooks/usePageTitle';

/**
 * Paying members, read from public.users (the Stripe webhook keeps
 * subscription_status / subscription_tier / expiry in step with Stripe).
 *
 * This page used to render hard-coded subscribers and made-up MRR, subscriber
 * and churn figures behind a "demo data" banner. Revenue is not stored in the
 * database, so it is not shown here; see the Stripe dashboard for money.
 */

interface MemberRow {
  id: string;
  email: string | null;
  subscription_status: string;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  stripe_customer_id: string | null;
  payment_failed_at: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  premium: 'Premium',
  advisor: 'Advisor',
  enterprise: 'Enterprise',
  lifetime: 'Lifetime',
  api: 'API',
};

const PAGE_SIZE = 50;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' });
}

export function AdminSubscriptions() {
  usePageTitle('Subscriptions | Admin');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  // Counted when the rows load (not during render, which must stay pure).
  const [lapsed, setLapsed] = useState(0);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured in this build.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let query = db
      .from('users')
      .select(
        'id, email, subscription_status, subscription_tier, subscription_expires_at, stripe_customer_id, payment_failed_at, created_at',
        { count: 'exact' }
      )
      .neq('subscription_status', 'free')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (statusFilter !== 'all') query = query.eq('subscription_status', statusFilter);
    const { data, error: loadError, count } = await query;
    if (loadError) {
      console.error('Error loading subscribers:', loadError);
      setError(loadError.message);
      setMembers([]);
      setTotal(0);
    } else {
      const rows = (data as MemberRow[]) ?? [];
      const now = Date.now();
      setMembers(rows);
      setTotal(count ?? 0);
      setLapsed(
        rows.filter(
          (m) => m.subscription_status !== 'lifetime' && m.subscription_expires_at && Date.parse(m.subscription_expires_at) < now
        ).length
      );
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? members.filter((m) => (m.email ?? '').toLowerCase().includes(term)) : members;
  }, [members, search]);

  const failing = members.filter((m) => m.payment_failed_at).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-slate-400 mt-1">
            Members on a paid plan, as recorded by the Stripe webhook. Revenue and invoices are in the Stripe dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Reload"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: statusFilter === 'all' ? 'Paid members' : `${STATUS_LABEL[statusFilter] ?? statusFilter} members`, value: total },
          { label: 'Last payment failed (this page)', value: failing },
          { label: 'Past expiry date (this page)', value: lapsed },
        ].map((stat) => (
          <div key={stat.label} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{loading ? '…' : stat.value.toLocaleString('en-US')}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <label htmlFor="sub-search" className="sr-only">Search by email</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
          <input
            id="sub-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <label htmlFor="sub-status" className="sr-only">Plan</label>
        <select
          id="sub-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none"
        >
          <option value="all">All paid plans</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300 flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-white/5">
              <th scope="col" className="px-4 py-3 font-medium">Member</th>
              <th scope="col" className="px-4 py-3 font-medium">Plan</th>
              <th scope="col" className="px-4 py-3 font-medium">Renews / expires</th>
              <th scope="col" className="px-4 py-3 font-medium">Payment</th>
              <th scope="col" className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No paid members {statusFilter !== 'all' || search ? 'match these filters' : 'yet'}.
                </td>
              </tr>
            )}
            {visible.map((m) => (
              <tr key={m.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-white">
                  <span className="inline-flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    {m.email ?? m.id}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {STATUS_LABEL[m.subscription_status] ?? m.subscription_status}
                  {m.subscription_tier && m.subscription_tier !== m.subscription_status && (
                    <span className="text-slate-500"> · {m.subscription_tier}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {m.subscription_status === 'lifetime' ? 'Never' : formatDate(m.subscription_expires_at)}
                </td>
                <td className="px-4 py-3">
                  {m.payment_failed_at ? (
                    <span className="text-red-400">Failed {formatDate(m.payment_failed_at)}</span>
                  ) : m.stripe_customer_id ? (
                    <span className="text-emerald-400">OK</span>
                  ) : (
                    <span className="text-slate-500">No Stripe customer</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400">{formatDate(m.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > PAGE_SIZE && (
          <p className="px-4 py-3 text-xs text-slate-500">
            Showing the newest {PAGE_SIZE} of {total.toLocaleString('en-US')}.
          </p>
        )}
      </div>
    </div>
  );
}
