/**
 * Web Vitals Performance Monitoring Hook
 *
 * Tracks Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint) - loading performance
 * - INP (Interaction to Next Paint) - responsiveness (replaced FID as of March 2024)
 * - CLS (Cumulative Layout Shift) - visual stability
 * - FCP (First Contentful Paint) - initial render
 * - TTFB (Time to First Byte) - server response time
 * - FID (First Input Delay) - legacy metric, kept for backwards compatibility
 */

import { useEffect, useCallback } from 'react';

interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

type ReportHandler = (metric: WebVitalMetric) => void;

// Thresholds based on Google's Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals to analytics or logging service
 */
function reportToAnalytics(metric: WebVitalMetric) {
  // Send to Google Analytics 4 if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
    });
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    const color = metric.rating === 'good' ? '#0CCE6B' : metric.rating === 'needs-improvement' ? '#FFA400' : '#FF4E42';
    console.log(
      `%c${metric.name} %c${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}${metric.name === 'CLS' ? '' : 'ms'} %c(${metric.rating})`,
      'font-weight: bold',
      `color: ${color}; font-weight: bold`,
      `color: ${color}`
    );
  }
}

/**
 * Observe Largest Contentful Paint
 */
function observeLCP(onReport: ReportHandler) {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;

      if (lastEntry) {
        const value = lastEntry.startTime;
        onReport({
          name: 'LCP',
          value,
          rating: getRating('LCP', value),
          delta: value,
          id: `lcp-${Date.now()}`,
          navigationType: getNavigationType(),
        });
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    return () => observer.disconnect();
  } catch {
    // LCP not supported
  }
}

/**
 * Observe First Input Delay
 */
function observeFID(onReport: ReportHandler) {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEventTiming;
        if (fidEntry.processingStart) {
          const value = fidEntry.processingStart - fidEntry.startTime;
          onReport({
            name: 'FID',
            value,
            rating: getRating('FID', value),
            delta: value,
            id: `fid-${Date.now()}`,
            navigationType: getNavigationType(),
          });
        }
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
    return () => observer.disconnect();
  } catch {
    // FID not supported
  }
}

/**
 * Observe Cumulative Layout Shift
 */
function observeCLS(onReport: ReportHandler) {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };

        // Only count layout shifts without recent user input
        if (!layoutShiftEntry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0] as PerformanceEntry | undefined;
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1] as PerformanceEntry | undefined;

          // If the entry occurred less than 1 second after the previous entry and
          // less than 5 seconds after the first entry in the session, include the
          // entry in the current session.
          if (
            sessionValue &&
            firstSessionEntry &&
            lastSessionEntry &&
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            entry.startTime - firstSessionEntry.startTime < 5000
          ) {
            sessionValue += layoutShiftEntry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = layoutShiftEntry.value;
            sessionEntries = [entry];
          }

          // If the current session value is larger than the current CLS value,
          // update CLS and report.
          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            onReport({
              name: 'CLS',
              value: clsValue,
              rating: getRating('CLS', clsValue),
              delta: layoutShiftEntry.value,
              id: `cls-${Date.now()}`,
              navigationType: getNavigationType(),
            });
          }
        }
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });
    return () => observer.disconnect();
  } catch {
    // CLS not supported
  }
}

/**
 * Observe First Contentful Paint
 */
function observeFCP(onReport: ReportHandler) {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');

      if (fcpEntry) {
        const value = fcpEntry.startTime;
        onReport({
          name: 'FCP',
          value,
          rating: getRating('FCP', value),
          delta: value,
          id: `fcp-${Date.now()}`,
          navigationType: getNavigationType(),
        });
      }
    });

    observer.observe({ type: 'paint', buffered: true });
    return () => observer.disconnect();
  } catch {
    // FCP not supported
  }
}

/**
 * Observe Time to First Byte
 */
function observeTTFB(onReport: ReportHandler) {
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navEntry) {
      const value = navEntry.responseStart;
      onReport({
        name: 'TTFB',
        value,
        rating: getRating('TTFB', value),
        delta: value,
        id: `ttfb-${Date.now()}`,
        navigationType: getNavigationType(),
      });
    }
  } catch {
    // TTFB not supported
  }
}

/**
 * Observe Interaction to Next Paint
 */
function observeINP(onReport: ReportHandler) {
  if (!('PerformanceObserver' in window)) return;

  const interactions: number[] = [];

  // Extended type for INP entries (not yet in standard TypeScript definitions)
  interface INPEntry extends PerformanceEventTiming {
    interactionId?: number;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        const eventEntry = entry as INPEntry;
        if (eventEntry.interactionId && eventEntry.duration) {
          interactions.push(eventEntry.duration);

          // Calculate INP (98th percentile of interactions)
          interactions.sort((a, b) => b - a);
          const p98Index = Math.floor(interactions.length * 0.02);
          const inp = interactions[p98Index] || interactions[0];

          if (inp) {
            onReport({
              name: 'INP',
              value: inp,
              rating: getRating('INP', inp),
              delta: eventEntry.duration,
              id: `inp-${Date.now()}`,
              navigationType: getNavigationType(),
            });
          }
        }
      });
    });

    // durationThreshold is a newer API property
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    return () => observer.disconnect();
  } catch {
    // INP not supported
  }
}

/**
 * Get navigation type
 */
function getNavigationType(): string {
  if (typeof window === 'undefined') return 'unknown';

  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  return navEntry?.type || 'unknown';
}

/**
 * Hook to track Web Vitals metrics
 *
 * @example
 * ```tsx
 * function App() {
 *   useWebVitals(); // Automatically tracks and reports metrics
 *   return <div>...</div>;
 * }
 * ```
 */
export function useWebVitals(onReport?: ReportHandler) {
  const handleReport = useCallback(
    (metric: WebVitalMetric) => {
      reportToAnalytics(metric);
      onReport?.(metric);
    },
    [onReport]
  );

  useEffect(() => {
    const cleanupFns: ((() => void) | undefined)[] = [];

    // Start observing all metrics
    cleanupFns.push(observeLCP(handleReport));
    cleanupFns.push(observeFID(handleReport));
    cleanupFns.push(observeCLS(handleReport));
    cleanupFns.push(observeFCP(handleReport));
    cleanupFns.push(observeINP(handleReport));

    // TTFB is observed once on load
    observeTTFB(handleReport);

    // Cleanup observers on unmount
    return () => {
      cleanupFns.forEach((cleanup) => cleanup?.());
    };
  }, [handleReport]);
}

/**
 * Get current performance score based on Core Web Vitals
 * Updated: INP replaces FID as the primary responsiveness metric (March 2024+)
 */
export function getPerformanceScore(metrics: Record<string, number>): number {
  let score = 100;

  // Weight each metric based on importance
  // INP is the primary responsiveness metric (replaced FID in March 2024)
  // FID kept at low weight for legacy compatibility
  const weights = {
    LCP: 0.25,
    INP: 0.30,
    CLS: 0.25,
    FCP: 0.10,
    TTFB: 0.05,
    FID: 0.05,
  };

  Object.entries(weights).forEach(([name, weight]) => {
    const value = metrics[name];
    if (value !== undefined) {
      const rating = getRating(name as keyof typeof THRESHOLDS, value);
      if (rating === 'needs-improvement') {
        score -= weight * 30;
      } else if (rating === 'poor') {
        score -= weight * 70;
      }
    }
  });

  return Math.max(0, Math.round(score));
}

export default useWebVitals;
