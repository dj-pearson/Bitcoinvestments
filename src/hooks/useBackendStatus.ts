/**
 * Is the database this build depends on actually there?
 *
 * Account features must not light up just because Supabase answers: a database
 * that responds with the wrong schema is the realistic failure (signup without
 * a profile trigger, Stripe writes to columns that do not exist). So the check
 * reads `app_meta.schema_version`, which the reconcile migration creates and
 * later migrations bump, and compares it with the version this build needs.
 *
 * - Runs lazily: only when a component that calls the hook mounts (the gated
 *   routes), never on public pages.
 * - One request per page load at most: the result is cached in memory for five
 *   minutes and concurrent callers share the in-flight request.
 * - Gives up after three seconds, so a paused or unreachable project degrades to
 *   the "coming soon" page instead of an endless spinner.
 * - Touches no browser globals during render (safe to prerender).
 */

import { useEffect, useState } from 'react';
import { isSupabaseConfigured, db } from '../lib/supabase';
import { ACCOUNTS_ENABLED } from '../config/staticMode';

/**
 * The newest migration this build relies on. Must match (or be lower than) the
 * value seeded by supabase/migrations/20260923000300_reconcile_schema.sql.
 * Bump it together with any migration the front end starts to depend on.
 */
export const REQUIRED_SCHEMA_VERSION = '20260923000300';

export type BackendStatus =
  /** Accounts switched off at build time, or Supabase env vars missing. */
  | 'disabled'
  /** Check in progress. */
  | 'checking'
  /** Database reachable and at least REQUIRED_SCHEMA_VERSION. */
  | 'up'
  /** Database reachable but older than this build expects. */
  | 'outdated'
  /** Request failed or timed out. */
  | 'down';

const CACHE_TTL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 3000;

let cached: { status: Exclude<BackendStatus, 'checking' | 'disabled'>; at: number } | null = null;
let inFlight: Promise<Exclude<BackendStatus, 'checking' | 'disabled'>> | null = null;

function isEnabled(): boolean {
  return ACCOUNTS_ENABLED && isSupabaseConfigured();
}

function freshCachedStatus(): Exclude<BackendStatus, 'checking' | 'disabled'> | null {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.status;
  return null;
}

/** Compare two migration version strings (digits only, e.g. 20260923000300). */
export function isSchemaVersionAtLeast(actual: string, required: string): boolean {
  const a = actual.trim();
  const r = required.trim();
  if (!/^\d+$/.test(a) || !/^\d+$/.test(r)) return false;
  if (a.length !== r.length) return a.length > r.length;
  return a >= r;
}

async function probe(): Promise<Exclude<BackendStatus, 'checking' | 'disabled'>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const { data, error } = await db
      .from('app_meta')
      .select('value')
      .eq('key', 'schema_version')
      .abortSignal(controller.signal)
      .maybeSingle();

    if (error) {
      // 42P01 / PGRST205: app_meta does not exist, i.e. the reconcile migration
      // has not been applied. Anything else is a connectivity or auth problem.
      const missingTable = error.code === '42P01' || error.code === 'PGRST205';
      if (!missingTable) console.warn('[backend-status] schema check failed:', error.message);
      return missingTable ? 'outdated' : 'down';
    }
    const value = (data as { value?: unknown } | null)?.value;
    if (typeof value !== 'string') return 'outdated';
    return isSchemaVersionAtLeast(value, REQUIRED_SCHEMA_VERSION) ? 'up' : 'outdated';
  } catch (err) {
    console.warn('[backend-status] database unreachable:', err instanceof Error ? err.message : err);
    return 'down';
  } finally {
    clearTimeout(timer);
  }
}

/** Run (or reuse) the check. Exported for non-React callers. */
export function checkBackendStatus(): Promise<BackendStatus> {
  if (!isEnabled()) return Promise.resolve('disabled');
  const fresh = freshCachedStatus();
  if (fresh) return Promise.resolve(fresh);
  if (!inFlight) {
    inFlight = probe()
      .then((status) => {
        cached = { status, at: Date.now() };
        return status;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useBackendStatus(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>(() => {
    if (!isEnabled()) return 'disabled';
    return freshCachedStatus() ?? 'checking';
  });

  useEffect(() => {
    if (status === 'disabled') return;
    let cancelled = false;
    checkBackendStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
    // Run once per mount; the module cache handles repeat mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
}

/** Test/admin helper: forget the cached result so the next mount re-checks. */
export function resetBackendStatusCache(): void {
  cached = null;
}
