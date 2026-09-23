# 05 — Database-driven content: /blog, /blog/category/:category, /blog/:slug, /article/:slug, /sponsored/:slug

## Summary (read first)

- **There is no static or seed content for any of these routes.** No posts exist in `src/data`, and no migration inserts rows into `articles` (only `blog_categories` are seeded, at `supabase/migrations/20260130_enhance_blog_system.sql:248-257`). Without Supabase, `/blog` shows a heading and "No posts found." (`src/pages/Blog.tsx:178-187`), and every `/blog/:slug` and `/article/:slug` shows "Not Found". Crawlers without JS get an empty `index.html`, and no prerender step exists (`package.json:9` is just `tsc -b && vite build`).
- **The public blog queries probably fail for anonymous visitors even when the DB is up (P0, check against live).** `getPublicBlogPosts`, `getBlogPostBySlug` and `getFeaturedPost` embed `author:users!articles_author_id_fkey(id, email)` (`src/services/blog.ts:388-391, 257-260, 483-486`). Migration `20260911000000_fix_users_rls_admin_row_exposure.sql:135` runs `REVOKE ALL ON public.users FROM anon`. When PostgREST embeds a table the role has no privilege on, it returns `permission denied for table users` for the whole request. So `/blog` would show "No posts found" and `/blog/:slug` "Post Not Found" to logged-out users. `/article/:slug` uses `select('*')` with no embed (`src/services/database.ts:537-542`), so it would still work.
- **Blog category pages can never return posts.** The editor saves the category *name* ("Bitcoin") (`src/pages/admin/AdminBlogEditor.tsx:108, 397`), but `Blog.tsx` filters `.eq('category', categoryParam)` using the URL *slug* ("bitcoin") (`src/services/blog.ts:394-396`, `Blog.tsx:36`). PostgREST `eq` is case-sensitive.
- **The same `articles` table is published under two URL systems.** Learn links go to `/article/:slug` (`src/pages/Learn.tsx:218`, `src/components/InternalLinks.tsx:230-232`) and the blog links to `/blog/:slug` (`BlogPostCard.tsx`). Both self-canonicalise (`SEO.tsx` canonical = `location.pathname`), so every post is duplicate content. `/article/` also has different breadcrumbs, back-links and no related posts.
- **Both sitemaps are hand-written and wrong.** `public/sitemap-articles.xml` (advertised in `robots.txt:266`) lists 17 `/learn/*` URLs and no blog posts. 15 of the 17 slugs (`buying-first-bitcoin`, `how-bitcoin-works`, `wallet-security`, `avoiding-scams`, `two-factor-authentication`, `dca-strategy`, `portfolio-diversification`, `choosing-exchange`, `understanding-fees`, `order-types`, `crypto-taxes`, `tax-loss-harvesting`, `defi-introduction`, `nft-basics`, `staking-explained`) don't exist in `src/data/guides/index.ts:24-40`, and `GuideDetail.tsx:13,19` `<Navigate to="/learn">`s them, so they are soft 404s. `functions/api/sitemap.ts:87-98` hardcodes 10 `/article/*` slugs ("would come from a CMS or database in production"), gives every URL `lastmod = today` (`:114-118`), lists the dead `coinbase-pro` (`:67`), and is not advertised anywhere.
- **Sponsored pages show fake content and lose fields when data is live.** Without the DB, or on any DB error, `/sponsored/diversified-crypto-portfolio-strategies` renders a made-up paid article from the invented sponsor "CryptoExchange Pro", with an `example.com` CTA and markdown shown as raw text (`src/services/sponsoredContent.ts:114-209, 250-251, 268-270`). With the DB, rows come back snake_case and are cast straight to a camelCase type with no mapping (`:265`). So `ctaUrl`, `seoTitle`, `featuredImage`, `publishedAt`, `authorName` and `readTimeMinutes` are all `undefined`: no CTA, no date, no image. The sponsor name never shows to readers because `sponsors` SELECT is owner-only (`202512220000500_create_sponsored_content.sql:182-183`).

---

### /blog and /blog/category/:category — src/pages/Blog.tsx

- **Purpose / target query:** Hub for editorial news and analysis ("crypto blog", "bitcoin news analysis"), plus category hubs ("defi news", "crypto regulation news").
- **Verdict:** Poor. The page is an empty shell without the DB, probably empty for anonymous users even with it, and category pages are always empty.
- **Up-to-date issues:**
  - `public/sitemap.xml:73-74`: `/blog` has lastmod `2026-02-08`, which is stale. It should come from the newest `published_at`.
  - There is no visible "last updated" date on the hub.
- **SEO issues:**
  - `src/lib/seo.ts:430-433`: the meta description is 166 chars (over 160). The title is exactly 59 chars with the suffix, which is OK.
  - `Blog.tsx:96`: category pages reuse `PageSEO pageKey="blog"`, so every `/blog/category/*` has the same title and description as `/blog`. The canonical is self (pathname) but the content is empty, which is a duplicate/thin set.
  - `Blog.tsx:105`: the H1 is just "Blog", with no keyword.
  - Sidebar headings are `<h3>` (`:254, :269, :304, :329`) with no H2 above them, which skips a level. The featured card's title is an `<h2>` inside a link (`BlogPostCard.tsx`), which is fine.
  - The empty state has no `noindex`. An indexable `/blog` with zero posts is a soft 404.
  - There is no `Blog`/`CollectionPage`/`ItemList` JSON-LD, only the generic WebPage from PageSEO.
  - `/blog?tag=x` and `?q=` stay indexable, with canonical `/blog` (pathname). Acceptable, but `?q=` should be noindex.
- **GEO issues:** There is no BLUF, no intro copy, no "what we cover / editorial policy" text, and no author or entity signals. An LLM has nothing to quote without JS and DB.
- **Static + DB:**
  - No DB: `getPublicBlogPosts` returns `{data:null, error}` (`blog.ts:379-381`), and Blog ignores the error, so posts stay `[]`, categories stay `[]`, and "No posts found." shows. There are no seed posts. The category H1 falls back to "Blog" because `categories` is empty (`:90-92`).
  - DB up, anonymous visitor: the `users` embed probably 42501s (see Summary), giving the same empty state. The error is swallowed, so the owner would see nothing wrong.
  - DB up, category route: always empty (name vs slug mismatch, `blog.ts:394-396`).
  - There is no error state that tells the user or owner the DB failed, and no retry.
  - `getFeaturedPost` makes a separate request for the same newest row the list already fetched (`Blog.tsx:43-45`). The featured post is then filtered out of the grid, so page 1 shows 11 cards instead of 12 (`:196`).
- **Uniqueness / content gaps:** No hub copy, no "Start here" pinned posts, and no link-out to the static `/learn` guides, which are the site's real evergreen content. Category pages have no description when the DB is down.
- **Bugs:**
  - `Blog.tsx:344`: the RSS link `/blog/rss.xml` doesn't exist in `public/` or `functions/`. The SPA fallback routes it to `BlogPost` with slug `rss.xml`, which shows "Post Not Found".
  - `Blog.tsx:334-339`: "Subscribe Now" links to `/` instead of an actual signup. The `Newsletter` component used on Article.tsx should be used here.
  - The category filter never matches (above).
  - The search input has no `<label>` or `aria-label` (`:256-262`), an a11y issue.
  - Pagination renders every page button with no cap (`:222`).
- **Recommended fixes:**
  - **P0** `src/services/blog.ts`: remove the `users` embed from every public query (`:257-260`, `:388-391`, `:483-486`) and select explicit columns. Author display belongs in a public `authors` table or view (see Design, §4).
  - **P0** `src/services/blog.ts:394-396`: make the category filter match. Either resolve the slug to a name via `blog_categories` first, or (better) store `category_slug` on `articles` and filter on that. Update `AdminBlogEditor.tsx:397` to `value={cat.slug}` and add a migration that backfills `lower(regexp_replace(category,'[^a-z0-9]+','-','gi'))`.
  - **P0** Add a static baseline (Design below) so `/blog` renders real posts with no DB, and show an error or "showing cached posts" note when the live fetch fails.
  - **P1** `Blog.tsx`: on category routes, pass `title={`${cat.name} News & Guides`}` and `description={cat.description}` to `PageSEO`, with `urlPath={`/blog/category/${slug}`}`. Add a `CollectionPage` + `ItemList` schema of the post URLs. Set `noindex` when the list is empty or `q` is present.
  - **P1** Generate `/blog/rss.xml` at build time (Design §3), or remove the link.
  - **P1** Replace the newsletter CTA with `<Newsletter source="blog-sidebar" variant="card" />`.
  - **P2** Shorten the `seo.ts:432` description to 160 chars or less. Change the H1 to "Bitcoinvestments Blog: Crypto News, Analysis & Guides". Make the sidebar headings `<h2>`. Add `aria-label="Search posts"`.

### /blog/:slug — src/pages/BlogPost.tsx

- **Purpose / target query:** Individual posts (long-tail news and analysis).
- **Verdict:** Needs work. The SEO scaffolding is decent (Article + Breadcrumb, BLUF from the excerpt), but the data path is broken for anonymous users, there are PII and E-E-A-T problems, and the TOC is broken.
- **Up-to-date issues:** Only `published_at` is shown (`:124-130, :219`). `updated_at` is sent to meta but not displayed, so a reader can't see "Updated on".
- **SEO issues:**
  - `:156-163`: the schema is `Article` with `author` defaulting to Organization "Bitcoinvestments" (`SEO.tsx:414-417`). It should be `BlogPosting` with `author` Person (name, url), `wordCount`, `articleSection`, `keywords`, `inLanguage`, and an image with dimensions.
  - `:148`: the `author` meta is set only when `post.author.email` exists, which for anonymous users is never. So the byline meta and schema disagree.
  - `:106-122`: the not-found state has no `<SEO noindex>`. The previous page's title, meta and canonical stay in the head, and the URL is a soft 404 with a 200 status.
  - `:275-279`: the featured image has no `width`/`height` (CLS) and no `fetchpriority`. The alt is always the title.
  - `:377`: author bio heading `<h3>` sits directly under the content's H2s. OK.
- **GEO issues:** `blufSummary={post.excerpt}` is good (`:153`). But the author is shown as a raw email or "Bitcoinvestments Team" with a generic bio (`:378-381`), with no credentials, reviewer or sources section. The "AI Generated" badge (`:198-203`) has no human-review statement, which is weak for YMYL. Nothing is prerendered.
- **Static + DB:**
  - No DB: `getBlogPostBySlug` returns error "Database not configured", and the page shows "Post Not Found" with that internal message printed to the user (`:111`).
  - DB up, anonymous: likely a 42501 from the `users` embed (Summary), so the page shows "Post Not Found" with the Postgres message. A logged-in admin viewing their own post would get `author.email` and **display their email publicly** in the byline and bio (`:215, :373, :378`). That is a PII leak and poor E-E-A-T, and it depends on who is viewing.
  - `blog.ts:270-274`: the view-count increment is a client `UPDATE`. RLS allows updates only to the author or admin (`20260128000000_comprehensive_rls_security.sql:437`, `20260130...:208-216`), so for visitors it silently does nothing. The visible "N views" (`:225-228`) is therefore stale or 0, which hurts trust. It is also a read-modify-write race.
  - `getRelatedPosts` works for anonymous users (no embed) but filters on `category` only. `_tags` is unused (`blog.ts:443`).
- **Uniqueness / content gaps:** Missing: a key-takeaways box, sources/citations list, "Updated" date, author page, disclaimer ("not financial advice"), and links to the relevant static `/learn` guide and tool (calculator or compare) by category.
- **Bugs:**
  - **TOC anchors never match.** `:333-336` does `.replace(/<h2([^>]*)>/g, (_, attrs, i) => ...)`. In a `String.replace` callback the third argument is the *character offset*, not a counter, so ids come out as `heading-1532` and so on while the TOC links to `#heading-0..n` (`:134-137, :296`). If a stored `<h2>` already has an `id`, a duplicate `id` attribute is produced. The TOC is also built from unsanitised `post.content` (`:133`) while the body is built from sanitised content, so they can disagree.
  - `:79`: `navigator.clipboard.writeText` has no try/catch, so it throws on non-secure or denied contexts.
  - Share icon links and the copy button have no accessible names (`:234-263`).
  - The category link is `/blog/category/${post.category.toLowerCase()}` (`:193`). This only matches a slug for single-word names, and the listing filter is broken anyway.
- **Recommended fixes:**
  - **P0** Same service fix: remove the `users` embed. Never render `author.email`. Replace it with an `author` object from a public `authors` table (display_name, slug, bio, avatar, credentials, same_as[]) that `articles.author_profile_id` points to. NEEDS-OWNER: real author names and bios.
  - **P0** Fix the heading ids: keep a counter (`let n = 0; html.replace(/<h2(\s[^>]*)?>/gi, (_m, a = '') => `<h2${a.replace(/\sid="[^"]*"/,'')} id="heading-${n++}">`)`) and build `toc` from the same sanitised string.
  - **P0** Not-found branch: render `<SEO title="Post not found" noindex />` and a generic message, not `error`.
  - **P1** Views: add a `SECURITY DEFINER` RPC `increment_article_view(p_slug text)` (grant execute to anon) and call it fire-and-forget. Or hide the view count until it is real.
  - **P1** Schema: add `generateBlogPostingSchema` in `src/lib/seo.ts` with Person author, `dateModified`, `wordCount`, `articleSection`, `keywords`, and `isPartOf` Blog. Show "Updated {date}" when `updated_at - published_at > 1 day`.
  - **P1** AI posts: require a `reviewed_by` field before publish and render "Written with AI assistance, reviewed by {editor} on {date}". NEEDS-OWNER: editorial policy.
  - **P2** Add aria-labels on the share buttons, try/catch on clipboard, and width/height on the hero image. Use tags in `getRelatedPosts` (`.overlaps('tags', tags)`).

### /article/:slug — src/pages/Article.tsx

- **Purpose / target query:** A legacy renderer for the same `articles` rows, linked from Learn "Latest Articles" and `InternalLinks.education`.
- **Verdict:** Poor. It duplicates `/blog/:slug`, and three sitewide internal links point to slugs that exist only as static `/learn` guides.
- **Up-to-date issues:** `InternalLinks.tsx:230-232` links `/article/what-is-bitcoin`, `/article/defi-basics`, `/article/crypto-wallets-explained`. Those are static guides at `/learn/<id>` (`src/data/guides/index.ts:25-37`), so the links hit "Article Not Found" unless a DB row with the same slug exists. `functions/api/sitemap.ts:87-98` lists 10 of these `/article/*` slugs too.
- **SEO issues:**
  - The self-canonical (`SEO.tsx` pathname) duplicates `/blog/:slug` for every published row.
  - `:74-92`: the not-found state has no `<SEO noindex>`, so it is a soft 404 with stale head tags.
  - `:108`: the breadcrumb middle item points to `/learn?category=...`, a URL Learn doesn't treat as a distinct page.
  - `:121`: the keywords stuffing is harmless but pointless.
- **GEO issues:** The excerpt callout (`:197-199`) is a good BLUF. There is no author (`author: 'Bitcoinvestments'` org), no updated date shown, and no sources.
- **Static + DB:** No DB: `getArticleBySlug` returns null, showing "Article Not Found". DB up: works for anonymous users (no users embed). `:549-555` **awaits** the view-count UPDATE before rendering, which adds a round trip, and RLS blocks it for anonymous users anyway.
- **Uniqueness / content gaps:** None relative to `/blog/:slug`. It is strictly the thinner of the two (no TOC, no related posts).
- **Bugs:** `:51`: the clipboard call has no await or catch. The share menu has no outside-click close or Escape handling (a11y).
- **Recommended fixes:**
  - **P0** Consolidate. Delete the `Article` route and add to `public/_redirects` (specific rules first):
    ```
    /article/what-is-bitcoin            /learn/what-is-bitcoin 301
    /article/how-to-buy-crypto          /learn/how-to-buy-crypto 301
    /article/crypto-wallets-explained   /learn/crypto-wallets-explained 301
    /article/defi-basics                /learn/defi-basics 301
    /article/dca-strategies             /learn/dca-strategies 301
    /article/common-crypto-mistakes     /learn/common-crypto-mistakes 301
    /article/portfolio-rebalancing      /learn/portfolio-rebalancing 301
    /article/yield-farming              /learn/yield-farming 301
    /article/defi-risks                 /learn/defi-risks 301
    /article/risk-management            /learn/risk-management 301
    /article/:slug                      /blog/:slug 301
    ```
    In App.tsx, replace the route with a small `<Navigate>` component doing the same mapping for client-side navigations.
  - **P0** `InternalLinks.tsx:230-232`: change to `/learn/<id>`. In `Learn.tsx:218`, link DB articles to `/blog/${slug}`.
  - **P1** If the route is kept for any reason, add `<SEO noindex>` on not-found and a canonical `url` pointing at `/blog/:slug`.

### /sponsored/:slug — src/pages/SponsoredArticle.tsx

- **Purpose / target query:** Paid placements (not for search). Noindexed by `index-pruning.ts:44` and explicitly at `:124, :165`.
- **Verdict:** Needs work. The page handles disclosure, noindex, `rel="sponsored"` and the timeout well, but the data layer is broken and it falls back to fake ads.
- **Up-to-date issues:** Demo data dated 2024 (`sponsoredContent.ts:128, 146, 163, 202-203`) with fabricated claims: "Trade Bitcoin with 0% fees", "Earn up to 12% APY" (`:137, :155`), and "60/30/10 rule" allocation advice (`:187-188`).
- **SEO issues:** Correctly noindex/nofollow. The breadcrumb puts sponsored content under "Blog" (`:169`). Fine.
- **GEO issues:** N/A (noindexed).
- **Static + DB:**
  - No DB: `getSponsoredArticleBySlug` returns the demo article for its slug (`sponsoredContent.ts:250-251`). The page renders a fabricated paid article presented as real ("Paid for by CryptoExchange Pro"), with a CTA to `https://example.com/portfolio-tools`. The content is markdown (`# ...`) passed through the HTML sanitiser, so it shows literal `#` characters. This is a trust and YMYL problem.
  - DB error: the same demo fallback (`:268-270`).
  - DB up: the raw snake_case row is cast to `SponsoredArticle` (`:265`) with no mapper, so `seoTitle`, `seoDescription`, `featuredImage`, `authorName`, `ctaText`, `ctaUrl`, `readTimeMinutes` and `publishedAt` are undefined. The CTA block (`:234`), date, byline and image never render, and `trackSponsoredContentEvent` sends `destination: undefined`. `sponsor` embed: the `sponsors` SELECT policy is `auth.uid() = user_id` only (`202512220000500...sql:182-183`), so for readers `sponsor` is null and "Paid for by …" (`:188-192`) is hidden. The FTC label still shows, but the payer is not named.
  - The same snake/camel bug affects `getSponsoredArticles` (`:236`) used by `SponsoredFeed`. `SponsoredFeed` is not mounted on any public page (grep), so nothing links to `/sponsored/*` except the advertiser dashboard.
- **Uniqueness / content gaps:** N/A.
- **Bugs:** As above. `:220`: the hero image `loading="lazy"` is above the fold.
- **Recommended fixes:**
  - **P0** `sponsoredContent.ts`: add `mapSponsoredArticle(row)` (snake to camel, plus `sponsor` mapping) and use it in `getSponsoredArticleBySlug` and `getSponsoredArticles`.
  - **P0** Remove the demo fallback from the reader path. Return `null` when not configured or on error, and keep demo data only for the `/advertiser` preview, behind an explicit flag.
  - **P0** Denormalise `sponsor_name` and `sponsor_url` onto `sponsored_articles` (set by trigger), or add a public SELECT policy on `sponsors` for `status='approved'` limited to a view exposing `id, name, website_url, logo_url`. The payer must be visible (FTC).
  - **P2** Change the hero `loading` to eager.

### Sitemaps — public/sitemap-articles.xml, functions/api/sitemap.ts

- `sitemap-articles.xml` is hand-maintained and contains no blog or DB content. 15 of its 17 URLs redirect to `/learn`, and the other 2 duplicate `sitemap.xml:225-302`. The lastmods (2026-01-10 to 2026-02-08) are fabricated or stale.
- `functions/api/sitemap.ts` duplicates `sitemap.xml` with hardcoded arrays, `lastmod = today` for everything (`:114-118`), dead `coinbase-pro` (`:67`), and `/article/*` URLs. It isn't advertised, but it is live at `/api/sitemap`.
- **Fix (P0):** delete `public/sitemap-articles.xml` and replace it with a build-generated `sitemap-blog.xml` (Design §3). Either delete `functions/api/sitemap.ts` or rewrite it to fetch `articles?select=slug,updated_at&status=eq.published` from Supabase REST (anon key from env) and fall back to `dist/content/blog/index.json`. Update `robots.txt:266`, `_redirects:7`, `_headers:45`, `public/sw.js:211`, and `scripts/audit-route-indexing.mjs` so every sitemap URL resolves to a route or post slug.

---

## Recommended design: static baseline + live DB

Goal: posts render fully with no DB and for no-JS crawlers, while the DB stays the source of truth and edits appear without a redeploy.

1. **Content snapshot at build time.** Add `scripts/export-blog.mjs`, run as `"prebuild"`:
   - If `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set (add them to `.github/workflows/deploy.yml` build `env`; currently none are set, `deploy.yml:28-29`, so the GitHub-built bundle may have `isSupabaseConfigured() === false` in production, which should be verified), fetch `articles?status=eq.published&select=id,slug,title,excerpt,content,featured_image,og_image,category,category_slug,tags,seo_title,seo_description,published_at,updated_at,read_time_minutes,word_count,author_profile_id,ai_generated` plus `blog_categories` and `authors`.
   - Write `src/content/blog/snapshot.json` (committed, so builds without secrets still ship the last known posts) and `public/content/blog/<slug>.json`.
   - Also support **seed posts in the repo**: `content/blog/*.md` with frontmatter (title, slug, date, updated, author, category, tags, excerpt). They are merged into the snapshot, and the DB wins on slug collision by newer `updated_at`. This gives the owner 5-10 evergreen posts (NEEDS-OWNER: content) even if Supabase is never provisioned.
2. **Service layer reads static first, then revalidates.** In `src/services/blog.ts`, `getPublicBlogPosts`, `getBlogPostBySlug`, `getCategories` and `getFeaturedPost`:
   - Return snapshot data immediately (as React Query `initialData` or a synchronous import).
   - If `isSupabaseConfigured()`, fetch live with a timeout (reuse the 8 s `Promise.race` pattern from `SponsoredArticle.tsx:57-60`) and merge. New DB-only posts appear, and edited posts replace their snapshot version.
   - On error, keep the snapshot and log. Show an error UI only when both are empty.
   - Slug lookup: snapshot hit renders at once. A miss with the DB available triggers the fetch. A miss everywhere shows the noindexed not-found page.
3. **Prerender and feeds (post-build).** Add `scripts/prerender-blog.mjs`, run after `vite build`, reading the snapshot:
   - For each post, write `dist/blog/<slug>/index.html` from the `dist/index.html` template with `<title>`, meta description, canonical, OG/Twitter tags, BlogPosting + Breadcrumb JSON-LD, and the sanitised article HTML inside `#root` (React replaces it on mount). Cloudflare Pages serves these files before the SPA fallback.
   - Do the same for `dist/blog/index.html` and `dist/blog/category/<slug>/index.html`, with post lists.
   - Emit `dist/sitemap-blog.xml` (lastmod = `updated_at`), `dist/blog/rss.xml` (fixing `Blog.tsx:344`), and a "Blog" section in `llms.txt` listing post titles and URLs.
4. **Author entity.** Add a migration creating `public.authors(id, slug, display_name, bio, avatar_url, credentials, same_as text[])` with a public SELECT policy, and `articles.author_profile_id uuid references authors`. Public queries select `author:authors(display_name,slug,bio,avatar_url,credentials,same_as)`. Stop touching `public.users` from public code.
5. **Freshness without redeploy.** Posts published after a build still render client-side via the live fetch. To get them prerendered and into sitemaps promptly, add a Supabase database webhook on `articles` (status becomes published, or update) that calls a Cloudflare Pages deploy hook. Alternatively, a nightly scheduled GitHub workflow runs the build. Optionally, `functions/blog/[slug].ts` can SSR meta tags from Supabase for slugs not in the snapshot.
6. **One URL per post.** `/blog/:slug` is canonical, and `/article/*` 301s as listed above.

## Priority list (all routes)

- **P0**
  - Remove the `users` embed from the public blog queries (`blog.ts`) and stop rendering emails.
  - Fix the category name vs slug filter.
  - Fix the TOC id bug (`BlogPost.tsx:333-336`).
  - Add noindex to the not-found states (`BlogPost.tsx:106`, `Article.tsx:74`).
  - Redirect `/article/*` and fix `InternalLinks.tsx:230-232` and `Learn.tsx:218`.
  - Replace `sitemap-articles.xml` and `functions/api/sitemap.ts`.
  - Sponsored: add the row mapper, remove the fake demo fallback, and make the sponsor name visible.
  - Build the static snapshot + seed posts + prerender pipeline.
- **P1**
  - View counter via RPC, or hide it.
  - BlogPosting schema with a Person author and a visible "Updated" date.
  - Category-specific SEO and CollectionPage schema.
  - RSS feed.
  - Real newsletter CTA.
  - AI-content review disclosure (NEEDS-OWNER).
  - Add Supabase env to the deploy build (verify how production is built).
- **P2**
  - Accessibility labels (search input, share buttons).
  - Hero image dimensions and loading attributes.
  - Tag-based related posts.
  - Meta description length.
