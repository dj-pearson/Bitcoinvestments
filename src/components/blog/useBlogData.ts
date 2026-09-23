/**
 * Blog data hooks: render the build-time snapshot immediately, then merge
 * live Supabase data on top once it arrives.
 *
 * The first render (and any server render) always uses the snapshot, so the
 * H1, SEO tags and post content are there without waiting on the network.
 * Live results are cached at module level, but only ever written from effects
 * in the browser, so hydration always starts from the same snapshot data the
 * server used.
 */

import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  fetchLiveBlogIndex,
  fetchLivePostBySlug,
  getBlogSnapshot,
  getSnapshotPost,
  mergeBlogIndex,
  mergePost,
  type BlogIndex,
} from '../../services/blog';
import type { BlogPost } from '../../types/blog';

export type LiveState = 'snapshot-only' | 'loading' | 'live' | 'failed';

let liveIndexCache: BlogIndex | null = null;
const livePostCache = new Map<string, BlogPost>();

function snapshotIndex(): BlogIndex {
  const { posts, categories, authors } = getBlogSnapshot();
  return { posts, categories, authors };
}

/** Published posts, categories and authors: snapshot first, live merged in. */
export function useBlogIndex(): { index: BlogIndex; live: LiveState } {
  const configured = isSupabaseConfigured();
  const [index, setIndex] = useState<BlogIndex>(() => liveIndexCache ?? snapshotIndex());
  const [live, setLive] = useState<LiveState>(() =>
    !configured ? 'snapshot-only' : liveIndexCache ? 'live' : 'loading'
  );

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    fetchLiveBlogIndex().then((result) => {
      if (cancelled) return;
      if (!result) {
        setLive('failed');
        return;
      }
      const merged = mergeBlogIndex(snapshotIndex(), result);
      liveIndexCache = merged;
      setIndex(merged);
      setLive('live');
    });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  return { index, live };
}

export type PostState =
  | { status: 'ready'; post: BlogPost; live: LiveState }
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' };

function initialPostState(slug: string | undefined, configured: boolean): PostState {
  if (!slug) return { status: 'missing' };
  const cached = livePostCache.get(slug);
  if (cached) return { status: 'ready', post: cached, live: 'live' };
  const snap = getSnapshotPost(slug);
  if (snap) return { status: 'ready', post: snap, live: configured ? 'loading' : 'snapshot-only' };
  return configured ? { status: 'loading' } : { status: 'missing' };
}

/**
 * One post by slug. A snapshot hit renders at once; the live row replaces it
 * when newer. `missing` only when the database confirms the post is not
 * published (or there is no database and no snapshot copy).
 */
export function useBlogPost(slug: string | undefined, categories: BlogIndex['categories']): PostState {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<PostState>(() => initialPostState(slug, configured));
  const [prevSlug, setPrevSlug] = useState(slug);

  // Reset synchronously when the route param changes (no stale post flash).
  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setState(initialPostState(slug, configured));
  }

  useEffect(() => {
    if (!slug || !configured) return;
    let cancelled = false;
    fetchLivePostBySlug(slug, categories).then((result) => {
      if (cancelled) return;
      if (result.status === 'found') {
        const merged = mergePost(getSnapshotPost(slug), result.post);
        livePostCache.set(slug, merged);
        setState({ status: 'ready', post: merged, live: 'live' });
      } else if (result.status === 'missing') {
        livePostCache.delete(slug);
        setState({ status: 'missing' });
      } else {
        // Could not reach the database: keep whatever we are showing.
        setState((prev) =>
          prev.status === 'ready' ? { ...prev, live: 'failed' } : { status: 'error' }
        );
      }
    });
    return () => {
      cancelled = true;
    };
    // `categories` only refines labels; refetching when they load is not needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, configured]);

  return state;
}
