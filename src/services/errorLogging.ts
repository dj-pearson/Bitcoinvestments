/**
 * Error Logging Service
 *
 * Centralized error logging and monitoring using Sentry.
 * This service handles:
 * - Frontend error capture and reporting
 * - User context tracking
 * - Performance monitoring
 * - Custom error boundaries
 */

import * as Sentry from '@sentry/react';

// Check if Sentry DSN is configured
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const IS_PRODUCTION = import.meta.env.PROD;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * Initialize Sentry error tracking
 * Call this once at app startup (in main.tsx)
 */
export function initializeErrorLogging(): void {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error logging is disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PRODUCTION ? 'production' : 'development',
    release: `bitcoinvestments@${APP_VERSION}`,

    // Performance Monitoring
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0, // 10% in production, 100% in dev

    // Session Replay - capture user sessions for debugging
    replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0, // 10% of sessions in production
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Only send errors in production or when explicitly enabled
    enabled: IS_PRODUCTION || import.meta.env.VITE_SENTRY_ENABLED === 'true',

    // Filter out known non-critical errors
    beforeSend(event) {
      // Filter out network errors that are expected (e.g., rate limiting)
      if (event.exception?.values?.[0]?.value?.includes('Failed to fetch')) {
        // Still log network errors but with lower priority
        event.level = 'warning';
      }

      // Filter out ResizeObserver errors (common in charts)
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
        return null;
      }

      // Don't send events in development unless explicitly enabled
      if (!IS_PRODUCTION && import.meta.env.VITE_SENTRY_ENABLED !== 'true') {
        console.error('[Sentry would send]:', event);
        return null;
      }

      return event;
    },

    // Integrations
    integrations: [
      // Browser Tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Track navigation between pages
        enableInp: true,
      }),
      // Replay integration for session recording
      Sentry.replayIntegration({
        // Mask all text for privacy
        maskAllText: true,
        // Block all media for privacy
        blockAllMedia: true,
      }),
    ],

    // Ignored errors - don't report these
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'http://tt.telefonika.mobi/',

      // Common React errors that are handled
      'ChunkLoadError',
      'Loading chunk',

      // Network errors that are expected
      'Network request failed',
      'NetworkError',

      // User-initiated actions
      'AbortError',
      'The operation was aborted',

      // Mobile-specific
      'Non-Error promise rejection captured',
    ],

    // Deny URLs - don't report errors from these sources
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,

      // Analytics and tracking
      /google-analytics\.com/i,
      /googletagmanager\.com/i,

      // Third-party scripts
      /facebook\.net/i,
      /twitter\.com/i,
    ],
  });
}

/**
 * Set user context for error tracking
 * Call this when user logs in
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  subscriptionTier?: string;
}): void {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  // Set custom tags for filtering
  if (user.role) {
    Sentry.setTag('user_role', user.role);
  }
  if (user.subscriptionTier) {
    Sentry.setTag('subscription_tier', user.subscriptionTier);
  }
}

/**
 * Clear user context when logging out
 */
export function clearUserContext(): void {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}

/**
 * Capture an exception with optional context
 */
export function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
    fingerprint?: string[];
  }
): string {
  if (!SENTRY_DSN) {
    console.error('Error captured (Sentry disabled):', error);
    return '';
  }

  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
    fingerprint: context?.fingerprint,
  });
}

/**
 * Capture a message with optional context
 */
export function captureMessage(
  message: string,
  context?: {
    level?: Sentry.SeverityLevel;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string {
  if (!SENTRY_DSN) {
    console.log('Message captured (Sentry disabled):', message);
    return '';
  }

  return Sentry.captureMessage(message, {
    level: context?.level || 'info',
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs show the trail of events leading up to an error
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}): void {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'app',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  });
}

/**
 * Set additional context for error reports
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (!SENTRY_DSN) return;
  Sentry.setContext(name, context);
}

/**
 * Set a tag for filtering errors
 */
export function setTag(key: string, value: string): void {
  if (!SENTRY_DSN) return;
  Sentry.setTag(key, value);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, operation: string): Sentry.Span | undefined {
  if (!SENTRY_DSN) return undefined;

  return Sentry.startInactiveSpan({
    name,
    op: operation,
  });
}

/**
 * Wrap an async function with error handling and reporting
 */
export async function withErrorLogging<T>(
  fn: () => Promise<T>,
  context?: {
    operation: string;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureException(error, {
      tags: { operation: context?.operation || 'unknown', ...context?.tags },
      extra: context?.extra,
    });
    throw error;
  }
}

/**
 * Create a wrapper for API calls with automatic error logging
 */
export function createApiErrorHandler(apiName: string) {
  return async function <T>(
    fn: () => Promise<T>,
    endpoint?: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      captureException(error, {
        tags: {
          api: apiName,
          endpoint: endpoint || 'unknown',
        },
        extra: {
          apiName,
          endpoint,
        },
      });
      throw error;
    }
  };
}

/**
 * Log a custom event for analytics
 */
export function logEvent(
  eventName: string,
  data?: Record<string, unknown>
): void {
  addBreadcrumb({
    message: eventName,
    category: 'event',
    level: 'info',
    data,
  });

  // Also log to console in development
  if (!IS_PRODUCTION) {
    console.log(`[Event] ${eventName}`, data);
  }
}

// Export Sentry's ErrorBoundary for use in components
export { ErrorBoundary } from '@sentry/react';

// Export the raw Sentry object for advanced usage
export { Sentry };
