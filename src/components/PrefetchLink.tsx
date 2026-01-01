/**
 * PrefetchLink Component
 *
 * An enhanced Link component that prefetches route chunks on hover/focus
 * for faster navigation. Uses IntersectionObserver for viewport-based
 * prefetching and mouse events for intent-based prefetching.
 *
 * Benefits:
 * - Faster perceived navigation
 * - Preloads critical routes before user clicks
 * - Smart prefetching based on user intent
 */

import { Link, type LinkProps } from 'react-router-dom';
import { useCallback, useRef, useState, useEffect } from 'react';

// Route to dynamic import mapping for prefetching
const routeModules: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/learn': () => import('../pages/Learn'),
  '/compare': () => import('../pages/Compare'),
  '/calculators': () => import('../pages/Calculators'),
  '/charts': () => import('../pages/Charts'),
  '/pricing': () => import('../pages/Pricing'),
  '/glossary': () => import('../pages/Glossary'),
  '/scam-database': () => import('../pages/ScamDatabase'),
  '/web3': () => import('../pages/Web3Features'),
  '/profile': () => import('../pages/Profile'),
  '/backtesting': () => import('../pages/Backtesting'),
  '/defi-yield': () => import('../pages/DeFiYield'),
  '/gas-optimizer': () => import('../pages/GasOptimizer'),
  '/staking-calculator': () => import('../pages/StakingCalculator'),
  '/trading-indicators': () => import('../pages/TradingIndicators'),
  '/whale-tracking': () => import('../pages/WhaleTracking'),
  '/social-trading': () => import('../pages/SocialTrading'),
  '/onchain-analytics': () => import('../pages/OnChainAnalytics'),
  '/lending': () => import('../pages/LendingComparison'),
  '/hardware-wallet': () => import('../pages/HardwareWallet'),
  '/retirement-calculator': () => import('../pages/RetirementCalculator'),
  '/multi-exchange': () => import('../pages/MultiExchange'),
  '/portfolio-analysis': () => import('../pages/PortfolioAnalysis'),
  '/dca-automation': () => import('../pages/DCAAutomation'),
  '/rebalancing-alerts': () => import('../pages/RebalancingAlerts'),
  '/alert-bundles': () => import('../pages/SmartAlertBundles'),
};

// Track which routes have been prefetched to avoid duplicate requests
const prefetchedRoutes = new Set<string>();

// Prefetch delay to avoid prefetching on quick hovers
const PREFETCH_DELAY = 100;

interface PrefetchLinkProps extends LinkProps {
  /** Prefetch on hover (default: true) */
  prefetchOnHover?: boolean;
  /** Prefetch when visible in viewport (default: false) */
  prefetchOnVisible?: boolean;
  /** Prefetch delay in ms (default: 100) */
  prefetchDelay?: number;
}

/**
 * Prefetch a route's JavaScript chunk
 */
async function prefetchRoute(path: string) {
  // Normalize path to base route
  const basePath = '/' + path.split('/').filter(Boolean)[0];

  // Check if already prefetched
  if (prefetchedRoutes.has(basePath)) return;

  // Check if we have a module for this route
  const loadModule = routeModules[basePath];
  if (!loadModule) return;

  try {
    // Mark as prefetched immediately to prevent race conditions
    prefetchedRoutes.add(basePath);

    // Prefetch the module
    await loadModule();

    if (import.meta.env.DEV) {
      console.log(`[Prefetch] Loaded route: ${basePath}`);
    }
  } catch (error) {
    // Remove from prefetched set so it can be retried
    prefetchedRoutes.delete(basePath);

    if (import.meta.env.DEV) {
      console.warn(`[Prefetch] Failed to load route: ${basePath}`, error);
    }
  }
}

/**
 * Enhanced Link component with route prefetching
 *
 * @example
 * ```tsx
 * // Prefetch on hover (default behavior)
 * <PrefetchLink to="/dashboard">Dashboard</PrefetchLink>
 *
 * // Prefetch when visible in viewport
 * <PrefetchLink to="/learn" prefetchOnVisible>Learn</PrefetchLink>
 *
 * // Disable prefetching
 * <PrefetchLink to="/profile" prefetchOnHover={false}>Profile</PrefetchLink>
 * ```
 */
export function PrefetchLink({
  to,
  children,
  prefetchOnHover = true,
  prefetchOnVisible = false,
  prefetchDelay = PREFETCH_DELAY,
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isPrefetched, setIsPrefetched] = useState(false);

  // Get the path from the to prop
  const path = typeof to === 'string' ? to : to.pathname || '';

  // Handle prefetch on hover with delay
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetchOnHover && !isPrefetched) {
        timeoutRef.current = setTimeout(() => {
          prefetchRoute(path);
          setIsPrefetched(true);
        }, prefetchDelay);
      }
      onMouseEnter?.(event);
    },
    [path, prefetchOnHover, prefetchDelay, isPrefetched, onMouseEnter]
  );

  // Handle prefetch on focus (for keyboard navigation)
  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLAnchorElement>) => {
      if (prefetchOnHover && !isPrefetched) {
        prefetchRoute(path);
        setIsPrefetched(true);
      }
      onFocus?.(event);
    },
    [path, prefetchOnHover, isPrefetched, onFocus]
  );

  // Cancel prefetch if mouse leaves before delay
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Prefetch when visible in viewport
  useEffect(() => {
    if (!prefetchOnVisible || isPrefetched) return;

    const element = linkRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchRoute(path);
            setIsPrefetched(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start prefetching slightly before visible
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [path, prefetchOnVisible, isPrefetched]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Link
      ref={linkRef}
      to={to}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * Hook to programmatically prefetch routes
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const prefetch = usePrefetch();
 *
 *   useEffect(() => {
 *     // Prefetch dashboard when component mounts
 *     prefetch('/dashboard');
 *   }, [prefetch]);
 * }
 * ```
 */
export function usePrefetch() {
  return useCallback((path: string) => {
    prefetchRoute(path);
  }, []);
}

/**
 * Prefetch multiple routes at once
 *
 * @example
 * ```tsx
 * // Prefetch common routes on app load
 * prefetchRoutes(['/dashboard', '/learn', '/compare']);
 * ```
 */
export function prefetchRoutes(paths: string[]) {
  // Use requestIdleCallback for non-blocking prefetch
  const prefetch = () => {
    paths.forEach((path) => {
      prefetchRoute(path);
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetch, { timeout: 2000 });
  } else {
    setTimeout(prefetch, 200);
  }
}

/**
 * Get list of prefetched routes (useful for debugging)
 */
export function getPrefetchedRoutes(): string[] {
  return Array.from(prefetchedRoutes);
}

export default PrefetchLink;
