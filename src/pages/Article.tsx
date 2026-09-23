/**
 * Legacy /article/:slug route.
 *
 * `/article/:slug` and `/blog/:slug` used to render the same `articles` rows
 * under two self-canonical URLs (duplicate content). `/blog/:slug` is now the
 * only canonical URL; this component redirects client-side navigations, and
 * the edge serves a 301 for direct requests (public/_redirects).
 *
 * A few old internal links pointed at slugs that are really static guides;
 * those go to the guide instead.
 */

import { Navigate, useParams } from 'react-router-dom';

/** Legacy /article slugs that are static guides at /learn/:id. */
const GUIDE_SLUGS = new Set([
  'what-is-bitcoin',
  'how-to-buy-crypto',
  'crypto-wallets-explained',
  'defi-basics',
  'dca-strategies',
  'common-crypto-mistakes',
  'portfolio-rebalancing',
  'yield-farming',
  'defi-risks',
  'risk-management',
]);

export function Article() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/blog" replace />;
  const target = GUIDE_SLUGS.has(slug) ? `/learn/${slug}` : `/blog/${encodeURIComponent(slug)}`;
  return <Navigate to={target} replace />;
}

export default Article;
