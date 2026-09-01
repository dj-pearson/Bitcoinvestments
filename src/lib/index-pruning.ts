/**
 * Index Pruning Configuration
 *
 * Strategic noindexing of thin, auto-generated, or low-quality pages
 * to preserve domain quality signals. Quality over quantity approach:
 * noindexing low-value pages improves how Google evaluates the whole domain.
 *
 * Pages are categorized as:
 * - indexable: High-quality content pages that should be indexed
 * - noindex: Thin, utility, or user-specific pages that dilute quality
 * - conditional: Pages that are noindexed unless they meet quality thresholds
 */

/** Pages that should always be noindexed (thin, utility, or auth pages) */
const NOINDEX_PATHS: string[] = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/profile',
  '/affiliate-stats',
  '/ad-manager',
  '/tax-reports',
  '/advisor',
  '/affiliate',
  '/portfolio-analysis',
  '/advertiser',
  '/search',
  '/403',
  '/404',
  '/500',
  '/maintenance',
  '/accessibility',
  '/developers/portal',
];

/** Path prefixes that should be noindexed */
const NOINDEX_PREFIXES: string[] = [
  '/admin',
  // Paid placements: advertising, not editorial. Indexing them risks both
  // thin-content and paid-link penalties.
  '/sponsored',
];

/** Pages that should only be indexed if they have substantial content */
const CONDITIONAL_INDEX_PATHS: string[] = [
  '/start',
  '/prices',
  '/disclaimer',
  '/developers/docs',
];

/**
 * Determine if a page should be noindexed based on its path.
 * This implements strategic index pruning to maintain domain quality.
 *
 * @param pathname - The current page pathname
 * @returns true if the page should have noindex meta tag
 */
export function shouldNoindex(pathname: string): boolean {
  const path = pathname.replace(/\/$/, '') || '/';

  // Exact match noindex paths
  if (NOINDEX_PATHS.includes(path)) {
    return true;
  }

  // Prefix match noindex paths
  if (NOINDEX_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return true;
  }

  // Conditional paths default to noindex (they're aliases/thin wrappers)
  if (CONDITIONAL_INDEX_PATHS.includes(path)) {
    return true;
  }

  // Noindex any URL with query parameters that indicate faceted navigation
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const facetedParams = ['sort', 'filter', 'page', 'tab', 'ref', 'utm_source'];
    if (facetedParams.some((p) => params.has(p))) {
      return true;
    }
  }

  return false;
}

/**
 * Get the indexing directive for a page (for use in meta robots tag)
 */
export function getIndexDirective(pathname: string): string {
  if (shouldNoindex(pathname)) {
    return 'noindex, follow';
  }
  return 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
}
