/**
 * Blog System Type Definitions
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_json: object | null;
  featured_image: string | null;
  og_image: string | null;
  author_id: string;
  category: string;
  tags: string[];
  meta_keywords: string[];
  seo_title: string | null;
  seo_description: string | null;
  status: 'draft' | 'published' | 'archived';
  ai_generated: boolean;
  ai_source_urls: string[] | null;
  ai_generation_settings: AIGenerationSettings | null;
  word_count: number;
  read_time_minutes: number;
  view_count: number;
  last_edited_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  /** Public author profile (`authors` table). Never the private `users` row. */
  author_profile_id?: string | null;
  // Joined / derived fields
  author?: BlogAuthor | null;
  /** Normalised category slug, derived from `category` + `blog_categories`. */
  category_slug?: string;
  /** Human-readable category name, derived from `blog_categories`. */
  category_name?: string;
}

/**
 * Public author profile. Readable by anyone (see migration
 * 20260923000200_public_authors.sql); contains no private account data.
 */
export interface BlogAuthor {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  credentials: string | null;
  avatar_url: string | null;
  /** Public profile URLs (X, LinkedIn, personal site…) — schema.org sameAs. */
  profile_links: string[] | null;
}

/** Build-time blog export written by scripts/export-blog.mjs. */
export interface BlogSnapshot {
  generatedAt: string | null;
  posts: BlogPost[];
  categories: BlogCategory[];
  authors: BlogAuthor[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface BlogRevision {
  id: string;
  article_id: string;
  title: string;
  content: string;
  content_json: object | null;
  revision_number: number;
  created_by: string | null;
  created_at: string;
  // Joined fields
  author?: {
    id: string;
    email: string;
  };
}

export interface AIGenerationSettings {
  model: string;
  temperature: number;
  style: 'educational' | 'news' | 'analysis';
  length: 'short' | 'medium' | 'long';
  prompt_used: string;
  source_count?: number;
}

export interface BlogFilters {
  status?: 'draft' | 'published' | 'archived' | 'all';
  category?: string;
  ai_generated?: boolean;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'published_at' | 'view_count' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  content_json?: object | null;
  featured_image?: string | null;
  og_image?: string | null;
  category: string;
  tags?: string[];
  meta_keywords?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  status?: 'draft' | 'published' | 'archived';
  ai_generated?: boolean;
  ai_source_urls?: string[] | null;
  ai_generation_settings?: AIGenerationSettings | null;
}

export interface BlogPostUpdate {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  content_json?: object | null;
  featured_image?: string | null;
  og_image?: string | null;
  category?: string;
  tags?: string[];
  meta_keywords?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  status?: 'draft' | 'published' | 'archived';
  published_at?: string | null;
}

export interface PaginatedBlogPosts {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  aiGeneratedPosts: number;
  totalViews: number;
  postsThisMonth: number;
}

export interface NewsSourceForGeneration {
  id: string;
  title: string;
  body: string;
  source: string;
  url: string;
  publishedAt: number;
  categories: string[];
  selected?: boolean;
}

export interface AIContentGenerationOptions {
  style: 'educational' | 'news' | 'analysis';
  length: 'short' | 'medium' | 'long';
  topic?: string;
  additionalContext?: string;
}

export interface GeneratedBlogContent {
  title: string;
  content: string;
  excerpt: string;
  meta_description: string;
  meta_keywords: string[];
  suggested_category: string;
  suggested_tags: string[];
}
