/**
 * Cookie / tracking consent management (GDPR, ePrivacy, CCPA).
 *
 * Central source of truth for the user's consent choices. This module is the
 * only place that should read/write the consent record so that every part of
 * the app (analytics loaders, the consent banner, the footer "Cookie
 * preferences" link) stays in sync.
 *
 * Compliance notes:
 * - No analytics or marketing storage is activated until the user opts in.
 *   Google Analytics uses Consent Mode v2 (default: denied) which is set
 *   inline in index.html before gtag runs; this module flips it to "granted"
 *   only after consent. Plausible (cookie-less) is only injected on consent.
 * - Consent can be withdrawn as easily as it was given via reopenConsentBanner().
 */

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

/** localStorage key holding the JSON-encoded CookiePreferences. */
export const COOKIE_CONSENT_KEY = 'bitcoin_investments_cookie_consent';

/** Fired on window whenever consent is saved/changed. */
export const CONSENT_CHANGED_EVENT = 'cookie-consent-changed';

/** Fired on window to request the consent banner be reopened. */
export const CONSENT_REOPEN_EVENT = 'cookie-consent-reopen';

type GtagConsentValue = 'granted' | 'denied';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Read the saved consent record, or null if the user has not chosen yet. */
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
    return {
      necessary: true, // necessary cookies are always on
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

/** True if the user has recorded any consent choice. */
export function hasConsentDecision(): boolean {
  return getCookiePreferences() !== null;
}

/** True if the user has consented to the given category. */
export function hasConsent(type: ConsentCategory): boolean {
  if (type === 'necessary') return true;
  const prefs = getCookiePreferences();
  return prefs ? Boolean(prefs[type]) : false;
}

/**
 * Push the user's choices into Google Consent Mode. Safe to call before gtag
 * has loaded — the command is queued on dataLayer via the gtag shim.
 */
export function applyGoogleConsent(prefs: CookiePreferences): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  const analytics: GtagConsentValue = prefs.analytics ? 'granted' : 'denied';
  const marketing: GtagConsentValue = prefs.marketing ? 'granted' : 'denied';

  window.gtag('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  });
}

/**
 * Persist the user's choices and propagate them to all tracking integrations.
 * This is the single entry point the consent banner calls on save.
 */
export function saveCookiePreferences(prefs: CookiePreferences): void {
  if (typeof window === 'undefined') return;

  const normalized: CookiePreferences = {
    necessary: true,
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
  };

  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(normalized));
  applyGoogleConsent(normalized);
  window.dispatchEvent(
    new CustomEvent<CookiePreferences>(CONSENT_CHANGED_EVENT, { detail: normalized })
  );
}

/** Request that the consent banner be reopened (e.g. from a footer link). */
export function reopenConsentBanner(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONSENT_REOPEN_EVENT));
}
