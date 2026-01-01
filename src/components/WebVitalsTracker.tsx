/**
 * Web Vitals Tracker Component
 *
 * A component that automatically tracks Core Web Vitals
 * and reports them to analytics. Place this at the root
 * of your app for automatic performance monitoring.
 */

import { useWebVitals } from '../hooks/useWebVitals';
import { prefetchRoutes } from './PrefetchLink';
import { useEffect } from 'react';

/**
 * Tracks Core Web Vitals and prefetches common routes
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <WebVitalsTracker />
 *       <Routes>...</Routes>
 *     </>
 *   );
 * }
 * ```
 */
export function WebVitalsTracker() {
  // Start tracking Web Vitals
  useWebVitals();

  // Prefetch common routes after initial load
  useEffect(() => {
    // Wait for page to be interactive before prefetching
    const prefetchCommonRoutes = () => {
      prefetchRoutes([
        '/dashboard',
        '/learn',
        '/compare',
        '/calculators',
      ]);
    };

    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchCommonRoutes, { timeout: 5000 });
    } else {
      // Fallback for Safari
      setTimeout(prefetchCommonRoutes, 2000);
    }
  }, []);

  // This component doesn't render anything
  return null;
}

export default WebVitalsTracker;
