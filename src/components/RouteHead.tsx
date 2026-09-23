/**
 * Route-level head defaults.
 *
 * <SEO> manages title, robots and canonical for the pages that render it, but a
 * route that renders no <SEO> (ComingSoon, redirects in flight, error
 * boundaries, some admin screens) used to keep whatever the previous page had
 * written - or, on a direct load, index.html's defaults. That served
 * `index, follow` with the homepage canonical on pages index-pruning says must
 * be noindexed.
 *
 * This component runs on every navigation and writes the route's defaults
 * first. It is rendered before the page in the tree, so React runs its effect
 * before the page's <SEO> effect in the same commit and the page still has the
 * last word.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getIndexDirective } from '../lib/index-pruning';

const SITE_URL = 'https://bitcoinvestments.net';

function upsert(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function RouteHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.replace(/\/$/, '') || '/';
    const url = `${SITE_URL}${path === '/' ? '/' : path}`;

    upsert(
      'meta[name="robots"]',
      () => Object.assign(document.createElement('meta'), { name: 'robots' }),
      'content',
      getIndexDirective(path)
    );
    upsert(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
      'href',
      url
    );
    upsert(
      'meta[property="og:url"]',
      () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:url');
        return m;
      },
      'content',
      url
    );
  }, [pathname]);

  return null;
}
