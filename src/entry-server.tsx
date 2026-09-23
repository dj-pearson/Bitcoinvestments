/**
 * Server entry for build-time prerendering (scripts/prerender.mjs).
 *
 * Renders one URL to static HTML with the same provider tree the browser uses
 * (main.tsx wraps <App> in StrictMode and AppErrorBoundary), a StaticRouter,
 * and a fresh QueryClient, and collects the page's <SEO> tags into a head
 * collector. renderToPipeableStream + onAllReady lets React.lazy route chunks
 * resolve before the HTML is taken, so lazily loaded pages render in full.
 */

import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'node:stream';
import { QueryClient } from '@tanstack/react-query';
import App from './App';
import { AppErrorBoundary } from './components/ErrorBoundary';
import { HeadContext, createHeadCollector, renderHeadTags } from './lib/head';
import { CURATED_COIN_IDS } from './data/coins';
import { getAllGuides } from './data/guides';
import { getSnapshotPosts, getSnapshotCategories } from './content/blog';

export interface RenderResult {
  html: string;
  head: string;
  errors: string[];
}

export function render(url: string): Promise<RenderResult> {
  const head = createHeadCollector();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const errors: string[] = [];

  return new Promise((resolve, reject) => {
    let html = '';
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        html += chunk.toString();
        callback();
      },
      final(callback) {
        resolve({ html, head: renderHeadTags(head), errors });
        callback();
      },
    });

    const stream = renderToPipeableStream(
      <StrictMode>
        <HeadContext.Provider value={head}>
          <AppErrorBoundary>
            <App location={url} client={client} />
          </AppErrorBoundary>
        </HeadContext.Provider>
      </StrictMode>,
      {
        onAllReady() {
          stream.pipe(sink);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          errors.push(error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error));
        },
      }
    );

    setTimeout(() => {
      stream.abort();
      reject(new Error(`Timed out rendering ${url}`));
    }, 30_000);
  });
}

export { shouldNoindex } from './lib/index-pruning';

/**
 * Extra data-driven routes to prerender that scripts/lib/routes.mjs cannot
 * discover from App.tsx and src/data alone.
 */
export function prerenderExtraPaths(): string[] {
  const posts = getSnapshotPosts();
  const categoriesWithPosts = new Set(posts.map((p) => p.category_slug).filter(Boolean));
  return [
    // Every guide, straight from the data (scripts/lib/routes.mjs finds them
    // from source files too; the union guards against either drifting).
    ...getAllGuides().map((g) => `/learn/${g.id}`),
    // Curated coin profiles are the only indexable /coin pages.
    ...CURATED_COIN_IDS.map((id) => `/coin/${id}`),
    // Published posts from the build-time snapshot of the database; posts
    // published since the build are served by functions/blog.
    ...posts.map((p) => `/blog/${p.slug}`),
    ...getSnapshotCategories()
      .filter((c) => categoriesWithPosts.has(c.slug))
      .map((c) => `/blog/category/${c.slug}`),
  ];
}
