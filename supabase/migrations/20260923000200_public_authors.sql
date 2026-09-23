-- ============================================================================
-- Public blog data: authors, category slugs, view counter, sponsor disclosure
-- ============================================================================
--
-- Why this exists
-- ---------------
-- 1. Public blog queries used to embed `users!articles_author_id_fkey(id, email)`.
--    `anon` has no privileges on `public.users` (20260911000000), so the whole
--    request failed for logged-out readers, and for admins it printed their
--    email address as the byline. Bylines now come from a separate, deliberately
--    public `authors` table that holds only what a reader should see.
-- 2. The editor saved the category *name* ("Bitcoin") while the listing filters
--    on the URL *slug* ("bitcoin"). The editor now saves the slug; existing rows
--    are backfilled here.
-- 3. View counts were incremented with a client-side UPDATE that RLS blocks for
--    readers. `increment_article_view` does it server-side.
-- 4. Readers could not see who paid for a sponsored article because `sponsors`
--    is owner-only. The sponsor's public name/website are copied onto
--    `sponsored_articles` so the "Paid for by" disclosure can always render.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Public authors
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.authors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  bio           TEXT,
  credentials   TEXT,
  avatar_url    TEXT,
  -- Public profile URLs (X, LinkedIn, personal site). Rendered as schema.org sameAs.
  profile_links TEXT[] NOT NULL DEFAULT '{}',
  -- Optional link to the account that writes as this author. Never exposed
  -- through a join to `users`; it only lets admins tie a login to a byline.
  user_id       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT authors_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authors_select_public" ON public.authors;
CREATE POLICY "authors_select_public"
  ON public.authors FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "authors_insert_admin" ON public.authors;
CREATE POLICY "authors_insert_admin"
  ON public.authors FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "authors_update_admin" ON public.authors;
CREATE POLICY "authors_update_admin"
  ON public.authors FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "authors_delete_admin" ON public.authors;
CREATE POLICY "authors_delete_admin"
  ON public.authors FOR DELETE TO authenticated
  USING (public.is_admin());

-- Every column is public by design. `user_id` is an opaque id; `public.users`
-- itself stays closed to anon, so it reveals nothing on its own.
GRANT SELECT ON public.authors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authors TO authenticated;
GRANT ALL ON public.authors TO service_role;

CREATE OR REPLACE FUNCTION public.authors_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS authors_touch_updated_at ON public.authors;
CREATE TRIGGER authors_touch_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW EXECUTE FUNCTION public.authors_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 2. articles.author_profile_id
-- ----------------------------------------------------------------------------
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS author_profile_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'articles_author_profile_id_fkey'
      AND conrelid = 'public.articles'::regclass
  ) THEN
    ALTER TABLE public.articles
      ADD CONSTRAINT articles_author_profile_id_fkey
      FOREIGN KEY (author_profile_id) REFERENCES public.authors(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_articles_author_profile_id
  ON public.articles(author_profile_id);

-- ----------------------------------------------------------------------------
-- 3. Category backfill: store the category slug, not its display name
-- ----------------------------------------------------------------------------
UPDATE public.articles a
SET category = c.slug
FROM public.blog_categories c
WHERE a.category IS DISTINCT FROM c.slug
  AND lower(btrim(a.category)) = lower(btrim(c.name));

-- ----------------------------------------------------------------------------
-- 4. View counter that works for anonymous readers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_article_view(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only published posts count, and only the counter column is touched.
  UPDATE public.articles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = p_slug
    AND status = 'published';
END;
$$;

REVOKE ALL ON FUNCTION public.increment_article_view(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_article_view(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. Sponsor disclosure readable by everyone
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.sponsored_articles') IS NULL
     OR to_regclass('public.sponsors') IS NULL THEN
    RAISE NOTICE 'sponsored content tables not present; skipping sponsor disclosure columns';
    RETURN;
  END IF;

  ALTER TABLE public.sponsored_articles ADD COLUMN IF NOT EXISTS sponsor_name TEXT;
  ALTER TABLE public.sponsored_articles ADD COLUMN IF NOT EXISTS sponsor_website_url TEXT;

  -- Backfill existing rows.
  UPDATE public.sponsored_articles sa
  SET sponsor_name = s.name,
      sponsor_website_url = s.website_url
  FROM public.sponsors s
  WHERE s.id = sa.sponsor_id
    AND (sa.sponsor_name IS DISTINCT FROM s.name
         OR sa.sponsor_website_url IS DISTINCT FROM s.website_url);
END;
$$;

-- Keep the copy in sync when an article is written. SECURITY DEFINER because
-- the writer (a sponsor user) can read its own sponsor row but the function
-- must behave the same for admins and service jobs.
CREATE OR REPLACE FUNCTION public.sponsored_articles_set_sponsor_disclosure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT s.name, s.website_url
  INTO NEW.sponsor_name, NEW.sponsor_website_url
  FROM public.sponsors s
  WHERE s.id = NEW.sponsor_id;
  RETURN NEW;
END;
$$;

-- ...and when the sponsor renames itself.
CREATE OR REPLACE FUNCTION public.sponsors_propagate_disclosure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sponsored_articles
  SET sponsor_name = NEW.name,
      sponsor_website_url = NEW.website_url
  WHERE sponsor_id = NEW.id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sponsored_articles_set_sponsor_disclosure() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sponsors_propagate_disclosure() FROM PUBLIC;

DO $$
BEGIN
  IF to_regclass('public.sponsored_articles') IS NULL
     OR to_regclass('public.sponsors') IS NULL THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS sponsored_articles_set_sponsor_disclosure ON public.sponsored_articles;
  CREATE TRIGGER sponsored_articles_set_sponsor_disclosure
    -- Every write, so a sponsor cannot hand-edit the disclosure columns.
    BEFORE INSERT OR UPDATE ON public.sponsored_articles
    FOR EACH ROW EXECUTE FUNCTION public.sponsored_articles_set_sponsor_disclosure();

  DROP TRIGGER IF EXISTS sponsors_propagate_disclosure ON public.sponsors;
  CREATE TRIGGER sponsors_propagate_disclosure
    AFTER UPDATE OF name, website_url ON public.sponsors
    FOR EACH ROW EXECUTE FUNCTION public.sponsors_propagate_disclosure();
END;
$$;

COMMENT ON TABLE public.authors IS
  'Public author profiles for blog bylines. Readable by anyone; admin-writable. Never join public.users from public code.';
COMMENT ON FUNCTION public.increment_article_view(TEXT) IS
  'Fire-and-forget view counter for published articles; callable by anon.';
