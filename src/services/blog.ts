/**
 * Blog Service
 * CRUD operations for blog posts, categories, and revisions
 */

import { db, isSupabaseConfigured } from '../lib/supabase';
import type {
  BlogPost,
  BlogCategory,
  BlogRevision,
  BlogPostInput,
  BlogPostUpdate,
  BlogFilters,
  PaginatedBlogPosts,
  BlogStats,
} from '../types/blog';

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
      .select(`
        *,
        author:users!articles_author_id_fkey(id, email)
      `)
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
 * Get a blog post by slug (for public viewing)
 */
export async function getBlogPostBySlug(
  slug: string
): Promise<{ data: BlogPost | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('articles')
      .select(`
        *,
        author:users!articles_author_id_fkey(id, email)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error('Error fetching blog post by slug:', error);
      return { data: null, error: error.message };
    }

    // Increment view count asynchronously
    db.from('articles')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)
      .then(() => {});

    return { data: data as BlogPost, error: null };
  } catch (err) {
    console.error('Error fetching blog post by slug:', err);
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
      .select(`
        *,
        author:users!articles_author_id_fkey(id, email)
      `, { count: 'exact' });

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
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
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
 * Get published blog posts for public viewing
 */
export async function getPublicBlogPosts(
  options: {
    category?: string;
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ data: PaginatedBlogPosts | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const { category, tag, search, page = 1, limit = 12 } = options;

    let query = db
      .from('articles')
      .select(`
        *,
        author:users!articles_author_id_fkey(id, email)
      `, { count: 'exact' })
      .eq('status', 'published');

    if (category) {
      query = query.eq('category', category);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    query = query.order('published_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching public blog posts:', error);
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
    console.error('Error fetching public blog posts:', err);
    return { data: null, error: 'Failed to fetch blog posts' };
  }
}

/**
 * Get related posts by category/tags
 */
export async function getRelatedPosts(
  postId: string,
  category: string,
  _tags: string[],
  limit: number = 3
): Promise<{ data: BlogPost[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .neq('id', postId)
      .eq('category', category)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching related posts:', error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as BlogPost[], error: null };
  } catch (err) {
    console.error('Error fetching related posts:', err);
    return { data: [], error: 'Failed to fetch related posts' };
  }
}

/**
 * Get featured/latest post
 */
export async function getFeaturedPost(): Promise<{ data: BlogPost | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('articles')
      .select(`
        *,
        author:users!articles_author_id_fkey(id, email)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching featured post:', error);
      return { data: null, error: error.message };
    }

    return { data: data as BlogPost | null, error: null };
  } catch (err) {
    console.error('Error fetching featured post:', err);
    return { data: null, error: 'Failed to fetch featured post' };
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
