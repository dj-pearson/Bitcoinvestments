/**
 * Analytics Service
 *
 * Provides a unified interface for analytics tracking using Plausible.
 * Plausible is privacy-focused and doesn't use cookies.
 *
 * Features:
 * - Page view tracking (automatic with script)
 * - Custom event tracking
 * - Goal tracking
 * - Revenue tracking
 * - User properties
 */

// Plausible event type
declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        revenue?: { currency: string; amount: number };
        callback?: () => void;
      }
    ) => void;
  }
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  domain: string;
  apiHost?: string;
  trackLocalhost?: boolean;
  enabled?: boolean;
}

// Default configuration
let config: AnalyticsConfig = {
  domain: 'bitcoinvestments.com',
  apiHost: 'https://plausible.io',
  trackLocalhost: false,
  enabled: true,
};

/**
 * Initialize analytics with custom configuration
 */
export function initializeAnalytics(customConfig?: Partial<AnalyticsConfig>): void {
  if (customConfig) {
    config = { ...config, ...customConfig };
  }

  // Don't initialize in development unless explicitly enabled
  if (!config.enabled) {
    console.log('[Analytics] Disabled');
    return;
  }

  if (!config.trackLocalhost && isLocalhost()) {
    console.log('[Analytics] Skipping on localhost');
    return;
  }

  // Check if script is already loaded
  if (document.querySelector('script[data-domain]')) {
    return;
  }

  // Load Plausible script
  const script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', config.domain);
  script.setAttribute('data-api', `${config.apiHost}/api/event`);
  script.src = `${config.apiHost}/js/script.js`;

  // Add file-downloads and outbound-links tracking
  script.src = `${config.apiHost}/js/script.file-downloads.outbound-links.js`;

  document.head.appendChild(script);

  console.log('[Analytics] Initialized for', config.domain);
}

/**
 * Check if running on localhost
 */
function isLocalhost(): boolean {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''
  );
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>
): void {
  if (!config.enabled && !isLocalhost()) {
    return;
  }

  if (window.plausible) {
    window.plausible(eventName, props ? { props } : undefined);
    console.log('[Analytics] Event:', eventName, props);
  } else {
    console.log('[Analytics] Event (not sent - script not loaded):', eventName, props);
  }
}

/**
 * Track a pageview (usually automatic, but can be called manually for SPAs)
 */
export function trackPageview(url?: string): void {
  if (!config.enabled && !isLocalhost()) {
    return;
  }

  if (window.plausible) {
    window.plausible('pageview', url ? { props: { url } } : undefined);
  }
}

/**
 * Track a goal/conversion
 */
export function trackGoal(goalName: string, props?: Record<string, string | number | boolean>): void {
  trackEvent(goalName, props);
}

/**
 * Track revenue (for purchases/signups with value)
 */
export function trackRevenue(
  eventName: string,
  amount: number,
  currency: string = 'USD',
  props?: Record<string, string | number | boolean>
): void {
  if (!config.enabled && !isLocalhost()) {
    return;
  }

  if (window.plausible) {
    window.plausible(eventName, {
      revenue: { currency, amount },
      props,
    });
    console.log('[Analytics] Revenue:', eventName, { amount, currency, props });
  }
}

// ============================================
// Pre-defined Events for Bitcoinvestments
// ============================================

/**
 * Track when user views a guide
 */
export function trackGuideView(guideId: string, guideName: string, category: string): void {
  trackEvent('Guide View', {
    guide_id: guideId,
    guide_name: guideName,
    category,
  });
}

/**
 * Track when user starts a course
 */
export function trackCourseStart(courseId: string, courseName: string): void {
  trackEvent('Course Start', {
    course_id: courseId,
    course_name: courseName,
  });
}

/**
 * Track when user completes a course module
 */
export function trackModuleComplete(
  courseId: string,
  moduleId: string,
  moduleName: string,
  moduleNumber: number
): void {
  trackEvent('Module Complete', {
    course_id: courseId,
    module_id: moduleId,
    module_name: moduleName,
    module_number: moduleNumber,
  });
}

/**
 * Track when user completes a course
 */
export function trackCourseComplete(courseId: string, courseName: string): void {
  trackEvent('Course Complete', {
    course_id: courseId,
    course_name: courseName,
  });
}

/**
 * Track exchange comparison view
 */
export function trackExchangeCompare(exchangeId: string, exchangeName: string): void {
  trackEvent('Exchange View', {
    exchange_id: exchangeId,
    exchange_name: exchangeName,
  });
}

/**
 * Track wallet comparison view
 */
export function trackWalletCompare(walletId: string, walletName: string): void {
  trackEvent('Wallet View', {
    wallet_id: walletId,
    wallet_name: walletName,
  });
}

/**
 * Track affiliate link click
 */
export function trackAffiliateClick(
  type: 'exchange' | 'wallet',
  name: string,
  url: string
): void {
  trackEvent('Affiliate Click', {
    type,
    name,
    destination: url,
  });
}

/**
 * Track search query
 */
export function trackSearch(query: string, resultCount: number): void {
  trackEvent('Search', {
    query,
    result_count: resultCount,
  });
}

/**
 * Track search result click
 */
export function trackSearchResultClick(
  query: string,
  resultType: string,
  resultTitle: string
): void {
  trackEvent('Search Click', {
    query,
    result_type: resultType,
    result_title: resultTitle,
  });
}

/**
 * Track newsletter signup
 */
export function trackNewsletterSignup(source: string): void {
  trackEvent('Newsletter Signup', {
    source,
  });
}

/**
 * Track 2FA enabled
 */
export function track2FAEnabled(method: string): void {
  trackEvent('2FA Enabled', {
    method,
  });
}

/**
 * Track calculator usage
 */
export function trackCalculatorUse(calculatorType: string): void {
  trackEvent('Calculator Use', {
    type: calculatorType,
  });
}

/**
 * Track glossary term view
 */
export function trackGlossaryView(term: string, category: string): void {
  trackEvent('Glossary View', {
    term,
    category,
  });
}

/**
 * Track price chart view
 */
export function trackChartView(cryptocurrency: string): void {
  trackEvent('Chart View', {
    cryptocurrency,
  });
}

/**
 * Track error occurrence (for error monitoring)
 */
export function trackError(errorType: string, errorMessage: string, page: string): void {
  trackEvent('Error', {
    error_type: errorType,
    error_message: errorMessage.slice(0, 100), // Truncate long messages
    page,
  });
}

export default {
  initialize: initializeAnalytics,
  trackEvent,
  trackPageview,
  trackGoal,
  trackRevenue,
  // Specific events
  trackGuideView,
  trackCourseStart,
  trackModuleComplete,
  trackCourseComplete,
  trackExchangeCompare,
  trackWalletCompare,
  trackAffiliateClick,
  trackSearch,
  trackSearchResultClick,
  trackNewsletterSignup,
  track2FAEnabled,
  trackCalculatorUse,
  trackGlossaryView,
  trackChartView,
  trackError,
};
