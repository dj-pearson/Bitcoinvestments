-- Blog System Enhancement Migration
-- Extends the existing articles table with blog-specific fields
-- Creates blog_categories and blog_revisions tables

-- ============================================
-- EXTEND ARTICLES TABLE
-- ============================================

-- Add TipTap JSON content field
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS content_json JSONB;

-- Add AI generation tracking fields
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS ai_source_urls TEXT[];
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS ai_generation_settings JSONB;

-- Add SEO enhancement fields
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS meta_keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Add content metrics
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

-- Add editing tracking
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES public.users(id);

-- ============================================
-- BLOG CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BLOG REVISIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog_revisions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_json JSONB,
  revision_number INTEGER NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for AI-generated content filtering
CREATE INDEX IF NOT EXISTS idx_articles_ai_generated ON public.articles(ai_generated);

-- Index for revision lookup
CREATE INDEX IF NOT EXISTS idx_blog_revisions_article ON public.blog_revisions(article_id);

-- Index for article revision ordering
CREATE INDEX IF NOT EXISTS idx_blog_revisions_article_number ON public.blog_revisions(article_id, revision_number DESC);

-- Index for category slug lookup
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON public.blog_categories(slug);

-- Full-text search index for articles
CREATE INDEX IF NOT EXISTS idx_articles_fulltext ON public.articles
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_revisions ENABLE ROW LEVEL SECURITY;

-- Blog Categories Policies
-- Anyone can view categories (public)
DROP POLICY IF EXISTS "blog_categories_select_public" ON public.blog_categories;
CREATE POLICY "blog_categories_select_public"
  ON public.blog_categories FOR SELECT
  USING (true);

-- Only admins can manage categories
DROP POLICY IF EXISTS "blog_categories_insert_admin" ON public.blog_categories;
CREATE POLICY "blog_categories_insert_admin"
  ON public.blog_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_suspended = FALSE
    )
  );

DROP POLICY IF EXISTS "blog_categories_update_admin" ON public.blog_categories;
CREATE POLICY "blog_categories_update_admin"
  ON public.blog_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_suspended = FALSE
    )
  );

DROP POLICY IF EXISTS "blog_categories_delete_admin" ON public.blog_categories;
CREATE POLICY "blog_categories_delete_admin"
  ON public.blog_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_suspended = FALSE
    )
  );

-- Blog Revisions Policies
-- Only admins can view revisions
DROP POLICY IF EXISTS "blog_revisions_select_admin" ON public.blog_revisions;
CREATE POLICY "blog_revisions_select_admin"
  ON public.blog_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_suspended = FALSE
    )
  );

-- Only admins can create revisions
DROP POLICY IF EXISTS "blog_revisions_insert_admin" ON public.blog_revisions;
CREATE POLICY "blog_revisions_insert_admin"
  ON public.blog_revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_suspended = FALSE
    )
  );

-- Only super admins can delete revisions
DROP POLICY IF EXISTS "blog_revisions_delete_super_admin" ON public.blog_revisions;
CREATE POLICY "blog_revisions_delete_super_admin"
  ON public.blog_revisions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_suspended = FALSE
    )
  );

-- ============================================
-- ARTICLES TABLE RLS (ensure admin access)
-- ============================================

-- Drop existing article policies if they exist (be careful with existing data)
DROP POLICY IF EXISTS "articles_select_public" ON public.articles;
DROP POLICY IF EXISTS "articles_select_admin" ON public.articles;
DROP POLICY IF EXISTS "articles_insert_admin" ON public.articles;
DROP POLICY IF EXISTS "articles_update_admin" ON public.articles;
DROP POLICY IF EXISTS "articles_delete_admin" ON public.articles;

-- Anyone can view published articles
CREATE POLICY "articles_select_public"
  ON public.articles FOR SELECT
  USING (status = 'published');

-- Admins can view all articles (including drafts)
CREATE POLICY "articles_select_admin"
  ON public.articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_suspended = FALSE
    )
  );

-- Only admins can create articles
CREATE POLICY "articles_insert_admin"
  ON public.articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_suspended = FALSE
    )
  );

-- Only admins can update articles
CREATE POLICY "articles_update_admin"
  ON public.articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_suspended = FALSE
    )
  );

-- Only admins can delete articles
CREATE POLICY "articles_delete_admin"
  ON public.articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_suspended = FALSE
    )
  );

-- ============================================
-- GRANTS
-- ============================================

-- Grant permissions on blog_categories
GRANT SELECT ON public.blog_categories TO anon;
GRANT SELECT ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;

-- Grant permissions on blog_revisions
GRANT SELECT, INSERT ON public.blog_revisions TO authenticated;
GRANT ALL ON public.blog_revisions TO service_role;

-- ============================================
-- SEED DEFAULT CATEGORIES
-- ============================================

INSERT INTO public.blog_categories (name, slug, description, sort_order) VALUES
  ('Bitcoin', 'bitcoin', 'All things Bitcoin - news, analysis, and guides', 1),
  ('Altcoins', 'altcoins', 'Coverage of alternative cryptocurrencies', 2),
  ('DeFi', 'defi', 'Decentralized finance protocols and strategies', 3),
  ('Trading', 'trading', 'Trading strategies, technical analysis, and market insights', 4),
  ('Security', 'security', 'Wallet security, scam prevention, and best practices', 5),
  ('Regulation', 'regulation', 'Crypto regulations and legal developments', 6),
  ('Technology', 'technology', 'Blockchain technology and development', 7),
  ('Education', 'education', 'Educational content for beginners and intermediates', 8)
ON CONFLICT (slug) DO NOTHING;
