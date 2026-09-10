/**
 * usePageTitle Hook
 *
 * Sets the document title for pages that do not render the <SEO> component.
 *
 * Most public pages use <SEO> / <PageSEO>, which set the title from a useEffect
 * inside the rendered tree. Authenticated and admin pages frequently return early
 * (loading, error, or permission states) before that markup is reached, which left
 * the browser tab showing the title of whatever page was visited previously.
 *
 * Calling this hook at the top of a component guarantees the title is set on every
 * render path. It also gives assistive technology a stable landmark: screen readers
 * announce the document title on client-side navigation, so an unchanged title makes
 * route changes silent.
 *
 * Robots directives are unaffected — <SEO> derives those from the pathname via
 * `shouldNoindex`, and every page reached by this hook is already path-noindexed.
 *
 * @example
 * export function Profile() {
 *   usePageTitle('Profile');
 *   // ...
 * }
 */

import { useEffect } from 'react';
import { SEO_CONFIG } from '../lib/seo';

/**
 * Set `document.title` to `"<title> | <siteName>"` for the lifetime of the component.
 *
 * @param title - Page-specific title segment. When empty, the bare site name is used.
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    const trimmed = title.trim();
    document.title = trimmed
      ? `${trimmed} | ${SEO_CONFIG.siteName}`
      : SEO_CONFIG.siteName;
  }, [title]);
}

export default usePageTitle;
