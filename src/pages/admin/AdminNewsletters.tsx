import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Mail, RefreshCw, Send, Users } from 'lucide-react';
import { db, isSupabaseConfigured } from '../../lib/supabase';
import { usePageTitle } from '../../hooks/usePageTitle';

/**
 * Newsletter audience, read from public.newsletter_subscribers.
 *
 * The previous version showed invented campaigns, subscriber counts and
 * open/click rates, and a composer whose "send" did nothing. Sending is done
 * server-side by the weekly-newsletter cron worker (workers/weekly-newsletter-
 * cron.ts calling /api/send-newsletter with the scheduled-job secret), and no
 * open/click tracking is stored, so this page shows only what is recorded:
 * who is subscribed and where they signed up (including the "coming soon"
 * waitlists, whose source is `waitlist-<feature>`).
 */

interface SubscriberRow {
  is_active: boolean | null;
  source: string | null;
  subscribed_at: string | null;
}

interface Summary {
  total: number;
  active: number;
  last30: number;
  bySource: { source: string; active: number }[];
}

const MAX_ROWS = 10000;

export function AdminNewsletters() {
  usePageTitle('Newsletters | Admin');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured in this build.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: loadError, count } = await db
      .from('newsletter_subscribers')
      .select('is_active, source, subscribed_at', { count: 'exact' })
      .limit(MAX_ROWS);
    if (loadError) {
      console.error('Error loading newsletter subscribers:', loadError);
      setError(loadError.message);
      setSummary(null);
      setLoading(false);
      return;
    }
    const rows = (data as SubscriberRow[]) ?? [];
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const sources = new Map<string, number>();
    let active = 0;
    let last30 = 0;
    for (const row of rows) {
      if (row.is_active) {
        active++;
        const key = row.source || '(unknown)';
        sources.set(key, (sources.get(key) ?? 0) + 1);
      }
      if (row.subscribed_at && Date.parse(row.subscribed_at) >= cutoff) last30++;
    }
    setSummary({
      total: count ?? rows.length,
      active,
      last30,
      bySource: [...sources.entries()]
        .map(([source, n]) => ({ source, active: n }))
        .sort((a, b) => b.active - a.active),
    });
    setTruncated((count ?? 0) > rows.length);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = [
    { label: 'Active subscribers', value: summary?.active, icon: Users },
    { label: 'All sign-ups (incl. unsubscribed)', value: summary?.total, icon: Mail },
    { label: 'Signed up in the last 30 days', value: summary?.last30, icon: Send },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Newsletter</h1>
          <p className="text-slate-400 mt-1">
            Subscribers and where they signed up. The weekly issue is sent automatically by the newsletter cron worker.
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

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300 flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Icon className="w-4 h-4" aria-hidden="true" /> {stat.label}
              </div>
              <p className="text-2xl font-bold text-white mt-1">
                {loading || stat.value === undefined ? '…' : stat.value.toLocaleString('en-US')}
              </p>
            </div>
          );
        })}
      </div>

      <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-6" aria-labelledby="nl-sources">
        <h2 id="nl-sources" className="text-lg font-semibold text-white mb-1">Active subscribers by sign-up source</h2>
        <p className="text-sm text-slate-400 mb-4">
          Sources starting with <code>waitlist-</code> come from the &quot;coming soon&quot; page of that feature.
        </p>
        {summary && summary.bySource.length === 0 && !loading && (
          <p className="text-sm text-slate-400">No active subscribers yet.</p>
        )}
        {summary && summary.bySource.length > 0 && (
          <ul className="divide-y divide-white/5">
            {summary.bySource.map((row) => (
              <li key={row.source} className="py-2 flex items-center justify-between text-sm">
                <span className="font-mono text-slate-300">{row.source}</span>
                <span className="text-white">{row.active.toLocaleString('en-US')}</span>
              </li>
            ))}
          </ul>
        )}
        {truncated && (
          <p className="mt-3 text-xs text-slate-500">Breakdown uses the first {MAX_ROWS.toLocaleString('en-US')} rows.</p>
        )}
      </section>
    </div>
  );
}
