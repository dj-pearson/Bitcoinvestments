import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { PageLoader } from './LoadingSkeletons';

// Lazy load the entire Web3 provider and its dependencies
// This prevents the ~5MB of Web3 bundles from loading on non-Web3 pages
const Web3ProviderWrapper = lazy(() => import('./Web3ProviderWrapper'));

interface Web3RouteProps {
  children: ReactNode;
}

/**
 * Wrapper component for routes that need Web3/wallet functionality.
 * Lazily loads WagmiProvider, RainbowKit, and associated dependencies
 * only when a Web3-enabled route is accessed.
 *
 * This reduces initial bundle size by ~1.3MB (gzip) on non-Web3 pages.
 */
export function Web3Route({ children }: Web3RouteProps) {
  return (
    <Suspense fallback={<PageLoader message="Loading Web3..." />}>
      <Web3ProviderWrapper>
        {children}
      </Web3ProviderWrapper>
    </Suspense>
  );
}

export default Web3Route;
