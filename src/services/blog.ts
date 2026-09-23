/**
 * Blog Service
 * CRUD operations for blog posts, categories, and revisions
 */

import { db, isSupabaseConfigured } from '../lib/supabase';
import type {
  BlogAuthor,
  BlogPost,
  BlogCategory,
  BlogRevision,
  BlogPostInput,
  BlogPostUpdate,
  BlogFilters,
  PaginatedBlogPosts,
  BlogStats,
} from '../types/blog';
import { pgrestContains } from '../lib/postgrestFilter';
import {
  normalizeAuthor,
  normalizeCategory,
  normalizePost,
  postTimestamp,
  sortPosts,
} from '../content/blog';

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

/**
 * Calculate word count from text content
 */
export function calculateWordCount(content: string): number {
  // Strip HTML tags and count words
  const text = content.replace(/<[^>]*>/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculate read time in minutes (avg 200 words per minute)
 */
export function calculateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

// ============================================
// BLOG POST OPERATIONS
// ============================================

/**
 * Create a new blog post
 */
export async function createBlogPost(
  post: BlogPostInput,
  authorId: string
): Promise<{ data: BlogPost | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const slug = post.slug || generateSlug(post.title);
    const wordCount = calculateWordCount(post.content);
    const readTime = calculateReadTime(wordCount);

    const { data, error } = await db
      .from('articles')
      .insert({
        title: post.title,
        slug,
        excerpt: post.excerpt,
        content: post.content,
        content_json: post.content_json || null,
        featured_image: post.featured_image || null,
        og_image: post.og_image || null,
        author_id: authorId,
        category: post.category,
        tags: post.tags || [],
        meta_keywords: post.meta_keywords || [],
        seo_title: post.seo_title || null,
        seo_description: post.seo_description || null,
        status: post.status || 'draft',
        ai_generated: post.ai_generated || false,
        ai_source_urls: post.ai_source_urls || null,
        ai_generation_settings: post.ai_generation_settings || null,
        word_count: wordCount,
        read_time_minutes: readTime,
        last_edited_by: authorId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      return { data: null, error: error.message };
    }

    return { data: data as BlogPost, error: null };
  } catch (err) {
    console.error('Error creating blog post:', err);
    return { data: null, error: 'Failed to create blog post' };
  }
}

/**
 * Update an existing blog post
 */
export async function updateBlogPost(
  id: string,
  updates: BlogPostUpdate,
  editorId: string
): Promise<{ data: BlogPost | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
      last_edited_by: editorId,
    };

    // Recalculate word count and read time if content changed
    if (updates.content) {
      updateData.word_count = calculateWordCount(updates.content);
      updateData.read_time_minutes = calculateReadTime(updateData.word_count as number);
    }

    // Set published_at when publishing
    if (updates.status === 'published' && !updates.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await db
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog post:', error);
      return { data: null, error: error.message };
    }

    return { data: data as BlogPost, error: null };
  } catch (err) {
    console.error('Error updating blog post:', err);
    return { data: null, error: 'Failed to update blog post' };
  }
}

/**
 * Delete (archive) a blog post
 */
export async function deleteBlogPost(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    // Soft delete by setting status to archived
    const { error } = await db
      .from('articles')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting blog post:', err);
    return { success: false, error: 'Failed to delete blog post' };
  }
}

/**
 * Permanently delete a blog post
 */
export async function permanentlyDeleteBlogPost(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { error } = await db
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error permanently deleting blog post:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error permanently deleting blog post:', err);
    return { success: false, error: 'Failed to delete blog post' };
  }
}

/**
 * Get a blog post by ID
 */
export async function getBlogPostById(
  id: string
): Promise<{ data: BlogPost | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching blog post:', error);
      return { data: null, error: error.message };
    }

    return { data: data as BlogPost, error: null };
  } catch (err) {
    console.error('Error fetching blog post:', err);
    return { data: null, error: 'Failed to fetch blog post' };
  }
}

/**
 * Get blog posts for admin (with filters and pagination)
 */
export async function getAdminBlogPosts(
  filters: BlogFilters = {}
): Promise<{ data: PaginatedBlogPosts | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const {
      status = 'all',
      category,
      ai_generated,
      search,
      tag,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filters;

    let query = db
      .from('articles')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (ai_generated !== undefined) {
      query = query.eq('ai_generated', ai_generated);
    }

    if (search) {
      query = query.or(
        `title.ilike.${pgrestContains(search)},content.ilike.${pgrestContains(search)}`
      );
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching admin blog posts:', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        posts: (data || []) as BlogPost[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      error: null,
    };
  } catch (err) {
    console.error('Error fetching admin blog posts:', err);
    return { data: null, error: 'Failed to fetch blog posts' };
  }
}

/**
 * Publish a blog post
 */
export async function publishBlogPost(
  id: string,
  editorId: string
): Promise<{ success: boolean; error: string | null }> {
  const result = await updateBlogPost(
    id,
    {
      status: 'published',
      published_at: new Date().toISOString(),
    },
    editorId
  );
  return { success: result.data !== null, error: result.error };
}

/**
 * Unpublish a blog post (revert to draft)
 */
export async function unpublishBlogPost(
  id: string,
  editorId: string
): Promise<{ success: boolean; error: string | null }> {
  const result = await updateBlogPost(
    id,
    { status: 'draft' },
    editorId
  );
  return { success: result.data !== null, error: result.error };
}

/**
 * Bulk update post status
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: 'draft' | 'published' | 'archived'
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await db
      .from('articles')
      .update(updateData)
      .in('id', ids);

    if (error) {
      console.error('Error bulk updating status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error bulk updating status:', err);
    return { success: false, error: 'Failed to update posts' };
  }
}

// ============================================
// REVISION OPERATIONS
// ============================================

/**
 * Create a revision for a blog post
 */
export async function createRevision(
  articleId: string,
  title: string,
  content: string,
  contentJson: object | null,
  createdBy: string
): Promise<{ data: BlogRevision | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    // Get the next revision number
    const { data: lastRevision } = await db
      .from('blog_revisions')
      .select('revision_number')
      .eq('article_id', articleId)
      .order('revision_number', { ascending: false })
      .limit(1)
      .single();

    const revisionNumber = (lastRevision?.revision_number || 0) + 1;

    const { data, error } = await db
      .from('blog_revisions')
      .insert({
        article_id: articleId,
        title,
        content,
        content_json: contentJson,
        revision_number: revisionNumber,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating revision:', error);
      return { data: null, error: error.message };
    }

    return { data: data as BlogRevision, error: null };
  } catch (err) {
    console.error('Error creating revision:', err);
    return { data: null, error: 'Failed to create revision' };
  }
}

/**
 * Get revisions for a blog post
 */
export async function getRevisions(
  articleId: string
): Promise<{ data: BlogRevision[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('blog_revisions')
      .select(`
        *,
        author:users!blog_revisions_created_by_fkey(id, email)
      `)
      .eq('article_id', articleId)
      .order('revision_number', { ascending: false });

    if (error) {
      console.error('Error fetching revisions:', error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as BlogRevision[], error: null };
  } catch (err) {
    console.error('Error fetching revisions:', err);
    return { data: [], error: 'Failed to fetch revisions' };
  }
}

/**
 * Restore a revision
 */
export async function restoreRevision(
  articleId: string,
  revisionId: string,
  editorId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    // Get the revision
    const { data: revision, error: revError } = await db
      .from('blog_revisions')
      .select('*')
      .eq('id', revisionId)
      .single();

    if (revError || !revision) {
      return { success: false, error: 'Revision not found' };
    }

    // Update the article with the revision content
    const result = await updateBlogPost(
      articleId,
      {
        title: revision.title,
        content: revision.content,
        content_json: revision.content_json,
      },
      editorId
    );

    return { success: result.data !== null, error: result.error };
  } catch (err) {
    console.error('Error restoring revision:', err);
    return { success: false, error: 'Failed to restore revision' };
  }
}

// ============================================
// CATEGORY OPERATIONS
// ============================================

/**
 * Get all blog categories
 */
export async function getCategories(): Promise<{ data: BlogCategory[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as BlogCategory[], error: null };
  } catch (err) {
    console.error('Error fetching categories:', err);
    return { data: [], error: 'Failed to fetch categories' };
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  description?: string
): Promise<{ data: BlogCategory | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const slug = generateSlug(name);

    // Get the max sort order
    const { data: lastCategory } = await db
      .from('blog_categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastCategory?.sort_order || 0) + 1;

    const { data, error } = await db
      .from('blog_categories')
      .insert({
        name,
        slug,
        description: description || null,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return { data: null, error: error.message };
    }

    return { data: data as BlogCategory, error: null };
  } catch (err) {
    console.error('Error creating category:', err);
    return { data: null, error: 'Failed to create category' };
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  updates: { name?: string; description?: string; sort_order?: number }
): Promise<{ data: BlogCategory | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const updateData: Record<string, unknown> = { ...updates };
    if (updates.name) {
      updateData.slug = generateSlug(updates.name);
    }

    const { data, error } = await db
      .from('blog_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return { data: null, error: error.message };
    }

    return { data: data as BlogCategory, error: null };
  } catch (err) {
    console.error('Error updating category:', err);
    return { data: null, error: 'Failed to update category' };
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { error } = await db
      .from('blog_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting category:', err);
    return { success: false, error: 'Failed to delete category' };
  }
}

// ============================================
// STATS & ANALYTICS
// ============================================

/**
 * Get blog statistics
 */
export async function getBlogStats(): Promise<{ data: BlogStats | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const [totalResult, publishedResult, draftResult, aiResult, viewsResult, monthResult] =
      await Promise.all([
        db.from('articles').select('*', { count: 'exact', head: true }),
        db.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        db.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        db.from('articles').select('*', { count: 'exact', head: true }).eq('ai_generated', true),
        db.from('articles').select('view_count'),
        db
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
      ]);

    const totalViews = (viewsResult.data || []).reduce(
      (sum, post) => sum + (post.view_count || 0),
      0
    );

    return {
      data: {
        totalPosts: totalResult.count || 0,
        publishedPosts: publishedResult.count || 0,
        draftPosts: draftResult.count || 0,
        aiGeneratedPosts: aiResult.count || 0,
        totalViews,
        postsThisMonth: monthResult.count || 0,
      },
      error: null,
    };
  } catch (err) {
    console.error('Error fetching blog stats:', err);
    return { data: null, error: 'Failed to fetch stats' };
  }
}

/**
 * Check if a slug is unique
 */
export async function isSlugUnique(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    let query = db.from('articles').select('id').eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.limit(1);
    return !data || data.length === 0;
  } catch {
    return false;
  }
}

// ============================================
// PUBLIC READS: static snapshot first, live Supabase on top
// ============================================
//
// Public pages render the build-time snapshot (src/content/blog) on their
// first render, then call the functions below from an effect and merge the
// result. A failed or slow live request never replaces snapshot content with
// an error; it only reports failure so the page can say it is showing the
// saved copy.
//
// Public reads never touch `public.users`: `anon` has no privileges on it
// (the embed failed the whole request) and it exposed author emails. Bylines
// come from the public `authors` table instead.

/** Give up on a live request after this long and keep the snapshot. */
export const LIVE_TIMEOUT_MS = 4000;
/** Posts fetched for the live index; below this the list is known complete. */
const LIVE_INDEX_LIMIT = 500;

const LIST_COLUMNS =
  'id,slug,title,excerpt,featured_image,og_image,category,tags,meta_keywords,seo_title,seo_description,status,ai_generated,word_count,read_time_minutes,published_at,created_at,updated_at,author_profile_id';
// Columns from the original `articles` schema, used when the newer migrations
// (blog enhancements, public authors) have not been applied to the database.
const BASE_LIST_COLUMNS =
  'id,slug,title,excerpt,featured_image,category,tags,seo_title,seo_description,status,read_time_minutes,published_at,created_at,updated_at';
const AUTHOR_COLUMNS = 'id,slug,display_name,bio,credentials,avatar_url,profile_links';
const AUTHOR_EMBED = `author:authors(${AUTHOR_COLUMNS})`;

export interface BlogIndex {
  posts: BlogPost[];
  categories: BlogCategory[];
  authors: BlogAuthor[];
}

export interface LiveBlogIndex extends BlogIndex {
  /** True when every published post was returned (no truncation). */
  complete: boolean;
}

export type LivePostResult =
  | { status: 'found'; post: BlogPost }
  | { status: 'missing' }
  | { status: 'error' };

function withTimeout<T>(promise: PromiseLike<T>, ms = LIVE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

type Row = Record<string, unknown>;
interface PgResult {
  data: unknown;
  error: { message: string; code?: string } | null;
}

/**
 * Run a published-articles query with progressively simpler column sets, so
 * a database that is missing the `authors` table or newer columns still
 * returns posts (without bylines) instead of failing outright.
 */
async function selectPublishedArticles(
  columnSets: string[],
  build: (columns: string) => PromiseLike<PgResult>
): Promise<unknown> {
  let lastError: PgResult['error'] = null;
  for (const columns of columnSets) {
    const { data, error } = await withTimeout(build(columns));
    if (!error) return data;
    lastError = error;
    // Only fall back for schema mismatches (unknown column / relationship);
    // anything else (RLS, network) will not be fixed by asking for less.
    const schemaError =
      error.code === 'PGRST200' || error.code === 'PGRST204' || error.code === '42703' || error.code === '42P01';
    if (!schemaError) break;
  }
  throw new Error(lastError?.message || 'Query failed');
}

async function fetchLiveCategories(): Promise<BlogCategory[]> {
  const { data, error } = await withTimeout(
    db
      .from('blog_categories')
      .select('id,name,slug,description,sort_order,created_at')
      .order('sort_order', { ascending: true })
  );
  if (error) throw new Error(error.message);
  return ((data || []) as Row[]).map(normalizeCategory);
}

async function fetchLiveAuthors(): Promise<BlogAuthor[]> {
  // Optional: the table only exists once 20260923000200_public_authors.sql is applied.
  try {
    const { data, error } = await withTimeout(db.from('authors').select(AUTHOR_COLUMNS));
    if (error) return [];
    return ((data || []) as Row[])
      .map((r) => normalizeAuthor(r))
      .filter((a): a is BlogAuthor => a !== null);
  } catch {
    return [];
  }
}

/**
 * Fetch the live list of published posts (without bodies), categories and
 * authors. Returns null when Supabase is not configured or the request fails.
 */
export async function fetchLiveBlogIndex(): Promise<LiveBlogIndex | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const [rows, categories, authors] = await Promise.all([
      selectPublishedArticles(
        [`${LIST_COLUMNS},${AUTHOR_EMBED}`, LIST_COLUMNS, BASE_LIST_COLUMNS],
        (columns) =>
          db
            .from('articles')
            .select(columns)
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(LIVE_INDEX_LIMIT)
      ),
      fetchLiveCategories().catch(() => [] as BlogCategory[]),
      fetchLiveAuthors(),
    ]);
    const list = Array.isArray(rows) ? (rows as Row[]) : [];
    return {
      posts: sortPosts(list.map((r) => normalizePost(r, categories, authors))),
      categories,
      authors,
      complete: list.length < LIVE_INDEX_LIMIT,
    };
  } catch (err) {
    console.warn('Live blog index unavailable; showing the saved snapshot.', err);
    return null;
  }
}

/**
 * Fetch one published post (with body) by slug. `missing` means the database
 * answered and the post is not published; `error` means we could not tell.
 */
export async function fetchLivePostBySlug(
  slug: string,
  categories: BlogCategory[] = []
): Promise<LivePostResult> {
  if (!isSupabaseConfigured()) return { status: 'error' };
  try {
    const row = await selectPublishedArticles(
      [`${LIST_COLUMNS},content,${AUTHOR_EMBED}`, `${LIST_COLUMNS},content`, `${BASE_LIST_COLUMNS},content`],
      (columns) =>
        db.from('articles').select(columns).eq('slug', slug).eq('status', 'published').maybeSingle()
    );
    if (!row || typeof row !== 'object' || Array.isArray(row)) return { status: 'missing' };
    return { status: 'found', post: normalizePost(row as Row, categories, []) };
  } catch (err) {
    console.warn('Live blog post unavailable; showing the saved snapshot if there is one.', err);
    return { status: 'error' };
  }
}

/**
 * Merge a live post over its snapshot copy: the live row wins unless the
 * snapshot is strictly newer, and a body missing from a list row is kept.
 */
export function mergePost(snapshot: BlogPost | undefined, live: BlogPost): BlogPost {
  if (!snapshot) return live;
  if (postTimestamp(snapshot) > postTimestamp(live)) return snapshot;
  return {
    ...live,
    content: live.content || snapshot.content,
    author: live.author || snapshot.author || null,
  };
}

/**
 * Merge the live index over the snapshot, matching posts by id or slug.
 * When the live list is complete it is authoritative, so snapshot posts that
 * have since been unpublished drop out.
 */
export function mergeBlogIndex(snapshot: BlogIndex, live: LiveBlogIndex): BlogIndex {
  const categories = live.categories.length ? live.categories : snapshot.categories;
  const authors = [
    ...live.authors,
    ...snapshot.authors.filter((a) => !live.authors.some((l) => l.id === a.id)),
  ];

  const findSnap = (p: BlogPost) => snapshot.posts.find((s) => s.id === p.id || s.slug === p.slug);
  const merged: BlogPost[] = live.posts.map((p) => {
    const m = mergePost(findSnap(p), p);
    // Re-resolve the author if the live row had no embed (older schema).
    const author =
      m.author || (m.author_profile_id ? authors.find((a) => a.id === m.author_profile_id) || null : null);
    return { ...m, author };
  });

  if (!live.complete) {
    for (const s of snapshot.posts) {
      if (!merged.some((p) => p.id === s.id || p.slug === s.slug)) merged.push(s);
    }
  }
  return { posts: sortPosts(merged), categories, authors };
}

/** Filter posts for the listing. Category matches by slug, case-insensitively. */
export function filterPosts(
  posts: BlogPost[],
  { category, tag, search }: { category?: string; tag?: string; search?: string }
): BlogPost[] {
  const cat = category?.toLowerCase();
  const t = tag?.toLowerCase();
  const q = search?.trim().toLowerCase();
  return posts.filter((p) => {
    if (cat && (p.category_slug || '').toLowerCase() !== cat) return false;
    if (t && !p.tags.some((x) => x.toLowerCase() === t)) return false;
    if (q) {
      const haystack = `${p.title} ${p.excerpt} ${p.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** Up to `limit` related posts: same category first, then shared tags. */
export function getRelatedFrom(posts: BlogPost[], post: BlogPost, limit = 3): BlogPost[] {
  const tags = new Set(post.tags.map((t) => t.toLowerCase()));
  return posts
    .filter((p) => p.id !== post.id && p.slug !== post.slug)
    .map((p) => ({
      p,
      score:
        (p.category_slug && p.category_slug === post.category_slug ? 10 : 0) +
        p.tags.filter((t) => tags.has(t.toLowerCase())).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

/**
 * Count a view. Fire-and-forget: never awaited before render, and failures
 * (no database, RPC not deployed yet) are ignored.
 */
export function incrementArticleView(slug: string): void {
  if (!isSupabaseConfigured() || !slug) return;
  try {
    db.rpc('increment_article_view', { p_slug: slug }).then(
      () => undefined,
      () => undefined
    );
  } catch {
    // ignore
  }
}

export {
  getBlogSnapshot,
  getSnapshotPosts,
  getSnapshotPost,
  getSnapshotCategories,
  FALLBACK_AUTHOR_NAME,
} from '../content/blog';
