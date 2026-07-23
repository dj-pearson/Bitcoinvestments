/**
 * Analytics Provider Component
 *
 * Initializes analytics on app load and provides page tracking.
 * Wraps the application to enable analytics throughout.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeAnalytics, trackPageview } from '../services/analytics';
import { CONSENT_CHANGED_EVENT } from '@/lib/consent';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  domain?: string;
  enabled?: boolean;
}

/**
 * Analytics Provider
 *
 * Initialize once at the top level of your app.
 *
 * @example
 * ```tsx
 * <AnalyticsProvider domain="example.com">
 *   <App />
 * </AnalyticsProvider>
 * ```
 */
export function AnalyticsProvider({
  children,
  domain = 'bitcoinvestments.net',
  enabled = true,
}: AnalyticsProviderProps) {
  // Initialize analytics on mount, and again if/when the user grants consent.
  // initializeAnalytics() itself no-ops until analytics consent exists, so it
  // is safe to call eagerly and re-call on consent changes.
  useEffect(() => {
    const isProduction = import.meta.env.PROD;
    const shouldEnable = enabled && isProduction;

    const init = () =>
      initializeAnalytics({
        domain,
        enabled: shouldEnable,
        trackLocalhost: false,
      });

    init();
    window.addEventListener(CONSENT_CHANGED_EVENT, init);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, init);
  }, [domain, enabled]);

  return <>{children}</>;
}

/**
 * Page Tracker Component
 *
 * Place inside Router to automatically track page views.
 * Uses React Router's useLocation to detect route changes.
 */
export function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const url = location.pathname + location.search;
    trackPageview(url);
  }, [location]);

  return null;
}

/**
 * Hook to track page views (alternative to PageTracker component)
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location]);
}

export default AnalyticsProvider;
