/**
 * Error Logging Service (Mock Version)
 *
 * Simplified error logging without Sentry dependency.
 * Logs errors to console for development purposes.
 */

const IS_PRODUCTION = import.meta.env.PROD;

/**
 * Initialize error logging (no-op in mock version)
 */
export function initializeErrorLogging(): void {
  console.log('Error logging initialized (mock mode)');
}

/**
 * Capture an exception
 */
export function captureException(
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
): void {
  console.error('Error captured:', error, context);
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
): void {
  console.log(`[${level.toUpperCase()}]`, message, context);
}

/**
 * Set user context
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  console.log('User context set:', user);
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  console.log('User context cleared');
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void {
  if (!IS_PRODUCTION) {
    console.log('[Breadcrumb]', breadcrumb);
  }
}

/**
 * Set custom context
 */
export function setCustomContext(
  key: string,
  value: Record<string, unknown>
): void {
  console.log(`Context [${key}]:`, value);
}

/**
 * Set a tag
 */
export function setTag(key: string, value: string): void {
  console.log(`Tag [${key}]:`, value);
}

/**
 * Log a custom event
 */
export function logEvent(
  eventName: string,
  data?: Record<string, unknown>
): void {
  if (!IS_PRODUCTION) {
    console.log(`[Event] ${eventName}`, data);
  }
}
