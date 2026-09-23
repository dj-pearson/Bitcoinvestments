import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, Database, Key, Shield, RefreshCw } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { isSupabaseConfigured } from '../../lib/supabase';
import { ACCOUNTS_ENABLED } from '../../config/staticMode';
import {
  checkBackendStatus,
  resetBackendStatusCache,
  REQUIRED_SCHEMA_VERSION,
  type BackendStatus,
} from '../../hooks/useBackendStatus';

/**
 * System status and where each setting really lives.
 *
 * This page used to show an editable settings form whose "load" and "save"
 * were both setTimeout stubs ("Settings saved successfully!" without saving
 * anything), and an environment list that marked every key as "configured"
 * whether or not it was. None of those settings were read anywhere in the app.
 *
 * It now reports only what the browser can actually verify, and for everything
 * else says where the setting is configured, so nothing here pretends to have
 * an effect it does not have.
 */

interface BuildVar {
  name: string;
  purpose: string;
  set: boolean;
}

/** Build-time variables the bundle can check (values are never shown). */
const BUILD_VARS: BuildVar[] = [
  { name: 'VITE_ACCOUNTS_ENABLED', purpose: 'Master switch for accounts and the admin panel', set: ACCOUNTS_ENABLED },
  { name: 'VITE_SUPABASE_URL', purpose: 'Supabase project URL', set: Boolean(import.meta.env.VITE_SUPABASE_URL) },
  { name: 'VITE_SUPABASE_PUBLISHABLE_KEY', purpose: 'Supabase publishable (anon) key', set: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) },
  { name: 'VITE_STRIPE_PUBLISHABLE_KEY', purpose: 'Stripe Checkout in the browser', set: Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) },
  { name: 'VITE_STRIPE_PRICE_MONTHLY', purpose: 'Premium monthly price id', set: Boolean(import.meta.env.VITE_STRIPE_PRICE_MONTHLY) },
  { name: 'VITE_STRIPE_PRICE_ANNUAL', purpose: 'Premium annual price id', set: Boolean(import.meta.env.VITE_STRIPE_PRICE_ANNUAL) },
];

/** Server-side secrets: set in Cloudflare Pages, invisible to the browser by design. */
const SERVER_SECRETS: { name: string; purpose: string }[] = [
  { name: 'SUPABASE_SERVICE_ROLE_KEY', purpose: 'Stripe webhook, cron jobs and server writes' },
  { name: 'STRIPE_SECRET_KEY', purpose: 'Creating Checkout and billing-portal sessions' },
  { name: 'STRIPE_WEBHOOK_SECRET', purpose: 'Verifying Stripe webhook signatures' },
  { name: 'RESEND_API_KEY', purpose: 'Sending email (welcome, alerts, support replies)' },
  { name: 'FROM_EMAIL', purpose: 'Sender address for outgoing email' },
  { name: 'CLAUDE_API_KEY', purpose: 'AI features via /api/claude' },
  { name: 'COINGECKO_API_KEY', purpose: 'Optional CoinGecko key for the price proxy' },
];

/** Settings that exist, and the one place each is actually controlled. */
const WHERE_CONFIGURED: { setting: string; where: string }[] = [
  { setting: 'New sign-ups, email confirmation, password rules', where: 'Supabase dashboard → Authentication → Providers / Sign In' },
  { setting: 'Session length', where: 'Supabase dashboard → Authentication → Sessions (JWT expiry and refresh)' },
  { setting: 'Password-reset and confirmation redirect URLs', where: 'Supabase dashboard → Authentication → URL Configuration (add https://bitcoinvestments.net/reset-password)' },
  { setting: 'Email sender (SMTP) for auth emails', where: 'Supabase dashboard → Authentication → SMTP (use the same provider as RESEND_API_KEY)' },
  { setting: 'Failed sign-in lockout', where: 'Code: src/services/auth.ts (5 attempts in 15 minutes, 30-minute lockout, per browser tab)' },
  { setting: 'Admin roles', where: 'SQL: UPDATE public.users SET role = \'admin\' WHERE email = …  (super_admin for this page)' },
  { setting: 'AI models', where: 'Code: functions/api/claude.ts (see the AI Settings page)' },
];

const STATUS_TEXT: Record<BackendStatus, { label: string; ok: boolean; detail: string }> = {
  disabled: {
    label: 'Accounts off',
    ok: false,
    detail: 'VITE_ACCOUNTS_ENABLED is not "true" or Supabase is not configured in this build.',
  },
  checking: { label: 'Checking…', ok: false, detail: 'Reading app_meta.schema_version.' },
  up: { label: 'Connected', ok: true, detail: `Schema is at or above ${REQUIRED_SCHEMA_VERSION}.` },
  outdated: {
    label: 'Schema out of date',
    ok: false,
    detail: `The database is reachable but app_meta.schema_version is missing or below ${REQUIRED_SCHEMA_VERSION}. Apply the migrations (rebuild/REBUILD_GUIDE.md).`,
  },
  down: {
    label: 'Unreachable',
    ok: false,
    detail: 'The schema check failed or timed out after 3 seconds. The project may be paused.',
  },
};

function StatusPill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full ${
        ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
      }`}
    >
      {children}
    </span>
  );
}

export function SystemSettings() {
  usePageTitle('System Status | Admin');
  const [backend, setBackend] = useState<BackendStatus>('checking');

  const runCheck = () => {
    setBackend('checking');
    resetBackendStatusCache();
    checkBackendStatus().then(setBackend);
  };

  useEffect(() => {
    let cancelled = false;
    checkBackendStatus().then((s) => {
      if (!cancelled) setBackend(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const status = STATUS_TEXT[backend];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Status</h1>
        <p className="text-slate-400 mt-1">
          What this build can verify about its configuration, and where every other setting is changed.
          Nothing on this page is editable here: each setting lives in exactly one place, listed below.
        </p>
      </div>

      <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-6" aria-labelledby="db-status">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 id="db-status" className="text-lg font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-400" aria-hidden="true" /> Database
          </h2>
          <div className="flex items-center gap-3">
            <StatusPill ok={status.ok}>{status.label}</StatusPill>
            <button
              type="button"
              onClick={runCheck}
              disabled={backend === 'checking' || !ACCOUNTS_ENABLED || !isSupabaseConfigured()}
              className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Re-check
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-400">{status.detail}</p>
      </section>

      <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-6" aria-labelledby="build-vars">
        <h2 id="build-vars" className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
          <Key className="w-5 h-5 text-slate-400" aria-hidden="true" /> Build variables
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Baked into the JavaScript bundle when Cloudflare Pages builds the site, so they must be set as Pages
          <strong> build</strong> variables. Changing one needs a new deployment.
        </p>
        <ul className="space-y-3">
          {BUILD_VARS.map((v) => (
            <li key={v.name} className="flex items-center justify-between gap-4 p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                {v.set ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />
                )}
                <div>
                  <p className="font-mono text-sm text-white">{v.name}</p>
                  <p className="text-xs text-slate-500">{v.purpose}</p>
                </div>
              </div>
              <StatusPill ok={v.set}>{v.set ? 'set' : 'not set'}</StatusPill>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-6" aria-labelledby="server-secrets">
        <h2 id="server-secrets" className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-slate-400" aria-hidden="true" /> Server secrets
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Read by Pages Functions at runtime. The browser cannot see them, so their status is not shown here; check
          Cloudflare Pages → Settings → Variables and Secrets.
        </p>
        <ul className="grid sm:grid-cols-2 gap-3">
          {SERVER_SECRETS.map((v) => (
            <li key={v.name} className="p-3 bg-white/5 rounded-xl">
              <p className="font-mono text-sm text-white">{v.name}</p>
              <p className="text-xs text-slate-500">{v.purpose}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-6" aria-labelledby="where">
        <h2 id="where" className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-slate-400" aria-hidden="true" /> Where settings are changed
        </h2>
        <dl className="divide-y divide-white/5">
          {WHERE_CONFIGURED.map((row) => (
            <div key={row.setting} className="py-3 grid sm:grid-cols-3 gap-2">
              <dt className="text-sm font-medium text-white">{row.setting}</dt>
              <dd className="sm:col-span-2 text-sm text-slate-400">{row.where}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
