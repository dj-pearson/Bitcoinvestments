# Blog snapshot (static baseline)

`snapshot.json` is the static copy of the blog that ships with every build.
Supabase stays the source of truth; this file makes the blog work without it.

## How it flows

1. **Build time**: `scripts/export-blog.mjs` (run as `prebuild`) reads
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (falling back to
   `wrangler.toml` `[vars]`). It fetches the following with the public anon key:
   - published `articles`
   - `blog_categories`
   - public `authors`

   It then rewrites `snapshot.json` as `{ generatedAt, posts, categories, authors }`.
   If credentials or the network are missing, or a request fails, it keeps the
   existing file and logs a warning. It never fails the build. It also refuses
   to replace a non-empty snapshot with zero posts unless
   `BLOG_EXPORT_ALLOW_EMPTY=1` is set.
2. **First render**: `src/content/blog/index.ts` normalises the snapshot.
   `/blog`, `/blog/category/:slug` and `/blog/:slug` render it synchronously,
   so headings, SEO tags, JSON-LD and post bodies are present with no network
   request. Prerendering can use it too.
3. **In the browser**: `src/services/blog.ts` (`fetchLiveBlogIndex`,
   `fetchLivePostBySlug`) queries Supabase with a 4-second timeout and merges
   the result over the snapshot:
   - posts are matched by id or slug
   - the live row wins unless the snapshot copy has a newer `updated_at`
   - if the live list is complete, posts unpublished since the build drop out

   If the live request fails, the page keeps the snapshot and says it is
   showing the saved copy.

## Commit it

Commit `snapshot.json` after a build that had database access. Then a build
without credentials (CI forks, local builds) still ships the last known posts.
A fresh repo starts with empty arrays and `generatedAt: null`.

## Helpers for prerendering / feeds

From `src/content/blog` (or re-exported from `src/services/blog`):

- `getSnapshotPosts()`: published posts, newest first, with `category_slug`,
  `category_name` and `author` resolved.
- `getSnapshotPost(slug)`, `getSnapshotCategories()`, `getBlogSnapshot()`.
- `FALLBACK_AUTHOR_NAME`: the byline for posts with no author profile
  ("Bitcoinvestments Editorial Team").

Post bodies are stored unsanitised, exactly as they are in the database. Run
them through `sanitizeArticleHtml` before rendering.
