# Review 14: Site-wide SEO/GEO infrastructure and prerendering design

Scope: index.html, SEO.tsx, PageSEO.tsx, GEOContent.tsx, Breadcrumbs.tsx (+ hooks/useBreadcrumbs.ts), InternalLinks.tsx, lib/seo.ts, lib/index-pruning.ts, public/{sitemap.xml, sitemap-articles.xml, robots.txt, llms.txt, ai.txt, _headers, _redirects, manifest.json}, functions/api/sitemap.ts, scripts/audit-route-indexing.mjs, vite.config.ts, package.json, .github/workflows/ci.yml (and deploy.yml, which is next to it).
Method: I read the code, ran the audit script, and ran an SSR probe that renders 40 routes with `renderToString` and `StaticRouter` through Vite `ssrLoadModule`. The probe lives in the scratchpad (`ssrprobe/probe.mjs`) and wrote nothing to the repo.

---

## 0. The big picture (read this first)

1. **Every URL ships the same HTML to non-JS crawlers, and that HTML claims to be the home page.** `index.html:97` hard-codes `<link rel="canonical" href="https://bitcoinvestments.net/">`, `index.html:65-67` hard-code `index, follow`, and the static FAQPage, BreadcrumbList and ItemList JSON-LD blocks (`index.html:259-357`) go out on every route. So AI crawlers (GPTBot, ClaudeBot, PerplexityBot; none of them run JS) and Google's first HTML-only pass see /admin, /login, /sponsored/x and /learn/what-is-bitcoin as copies of the home page, each canonicalised to "/". Google's rendered canonical then disagrees with the raw-HTML canonical. **This is the #1 problem, and prerendering fixes it.**
2. **The site's JSON-LD contains made-up trust signals.** `AggregateRating 4.8 / 1250` appears in `index.html:248-254` (WebApplication), `index.html:407-413` (FinancialService) and `lib/seo.ts:1227-1230`. `SEO.tsx:647-652` rates the scam DB 4.8 and falls back to a "rating count" of 1000 taken from the number of reports. The same files make unverifiable claims of "1,000+ verified reports" (`index.html:121,305,423`; `llms.txt:6,66`) and "300+ glossary terms" (`seo.ts:141,143,997,1463`; `InternalLinks.tsx:229`; `llms.txt:22,67`). Glossary.tsx has about 39 terms. For a YMYL site this is a structured-data manual-action risk and a trust problem.
3. **llms.txt, ai.txt and sitemap-articles.xml point AI engines at URLs that don't exist.** 7 of 8 `/learn/*` links, 3 of 3 `/course/*` links and `/compare/tax-software` in llms.txt are dead. 15 of 17 URLs in sitemap-articles.xml are dead. Unknown guide slugs `<Navigate>` to /learn (`GuideDetail.tsx:18-19`), which makes them soft 404s.
4. **Prerendering is very feasible.** 38 of the 40 routes probed server-render in Node today with no code changes. The failures and near-empty pages come from a small, fixable set of issues, listed in section 3.

---

## 1. Findings by file

### index.html
- **P0, static head is page-specific but served for every route.** Canonical (`:97`), og:url and twitter:url (`:82,:91`), `robots/googlebot/bingbot` index,follow (`:65-67`), FAQPage (`:259-329`), BreadcrumbList Home>Learn>Tools (`:332-357`) and SiteNavigation ItemList (`:178-221`) all go out on every URL. After JS runs, `SEO.tsx` updates robots, canonical and description, but **`googlebot` and `bingbot` metas are never updated**. Noindexed pages therefore carry `robots: noindex` and `googlebot: index, follow` at the same time. Google picks the most restrictive, so it works, but it's contradictory. The static FAQPage and BreadcrumbList also **stay in the DOM after hydration**, so pages that add their own FAQPage (ScamDatabase, and PageSEO with `faqs`) end up with two FAQPage entities, and every page has a breadcrumb schema that doesn't match its visible breadcrumbs. FAQ markup whose Q&A isn't visible on the page breaks Google's structured-data guidelines.
- **P0, fabricated ratings:** `:248-254` and `:407-413` (see §0.2). Remove both.
- **P1, `FinancialService` type (`:384-415`)** presents an education site as a financial service, which is a YMYL red flag. `priceRange: "Free - $29.99/mo"` is also wrong. `services/stripe.ts` has Premium at $9.99/mo, $99.99/yr, Advisor $49/mo, Enterprise $99/mo and Lifetime $299. `paymentAccepted: "Cryptocurrency"` is not supported by the Stripe-only checkout. Delete the block.
- **P1, SiteNavigation lists "Report a Scam" (`:214-217`)**, which in `STATIC_MODE` renders `<ComingSoon/>` and is noindexed. The WebApplication `featureList` (`:239-247`) advertises Portfolio Tracking, Price Alerts and Tax Reports, which are all ComingSoon in static mode.
- **P1, stale or unverifiable dates:** `citation_publication_date`/`citation_online_date` "2024" (`:441-442`). `foundingDate: "2024"` (`:122,:369`) needs owner confirmation (NEEDS-OWNER).
- **P1, Organization has no `sameAs`** (no social or Wikidata links). That's weak entity/E-E-A-T. NEEDS-OWNER for real profile URLs.
- **P2, dead icon:** `:51` references `/apple-touch-icon.png`, which isn't in `public/`. With SPA fallback it returns index.html as 200 text/html.
- **P2, the `<noscript>` block (`:448-459`) says only "JavaScript Required".** It has no content, no links and no nav. Prerendering replaces it.
- **P2, legacy meta** (`title`, `keywords`, `rating`, `distribution`, `revisit-after`, `geo.*`, `coverage`, `target`, `ai.attribution`). Search engines ignore these. They're harmless, but they add noise to every page.
- **FAQ text is stale:** `:296` says "Binance provides the lowest fees" to a US-focused beginner audience (the site lists Binance.US), and it's placed with no qualification.

### src/components/SEO.tsx
- **P0 for prerender: all head tags are written in `useEffect` (`:133-302`),** so nothing reaches `renderToString` output. The probe confirmed that SSR output has JSON-LD (rendered inline as `<script>`) but no title, meta or canonical. It needs a server-side collector (§4).
- **P1: when a route without `<SEO>` mounts, the previous page's canonical, robots and description stay in place.** Cleanup only resets `document.title` (`:282-285`). Routes with no SEO: `ComingSoon` (so in STATIC_MODE: /login, /signup, /forgot-password, /reset-password, /profile, /report-scam, /tax-reports, /advisor, /affiliate, /affiliate-stats, /ad-manager, /portfolio-analysis, /advertiser, /developers/portal), `SearchResults` (/search) and `ResetPassword`. **So index-pruning's noindex for those paths never applies:** `shouldNoindex` only runs inside `<SEO>` (`:118`). On a direct load they show `index, follow` and canonical "/". Fix it with a route-level default (§4, `RouteHead`).
- **P1, fabricated `aggregateRating` in `generateScamDatabaseSchema` (`:647-653`).** It's a self-assigned 4.8, and `ratingCount` is the report count or 1000.
- **P2: `generateArticleSchema` uses the relative `image: '/og-image.png'` (`:413`),** where it should be an absolute URL. Author is always an Organization, so there's no Person/E-E-A-T signal.
- **P2: canonical is `SITE_URL + location.pathname` (`:112`).** A trailing slash (`/learn/`) produces a self-canonical duplicate. Strip it.
- **P2: two parallel schema libraries.** `SEO.tsx` and `lib/seo.ts` both export `generateFAQSchema`, `generateArticleSchema`, `generateBreadcrumbSchema`, `generateProductSchema`, `generateCourseSchema`, `generateHowToSchema`, `generateOrganizationSchema` and `generateWebsiteSchema`, and the outputs differ. Consolidate into `lib/seo.ts`.
- `generateScamFAQSchema` (`:672-730`) cites "FBI IC3 report for 2024 ... $9.3B". The IC3 2025 report would normally be out by April 2026. **NEEDS-OWNER/verify:** update to the latest IC3 annual figures. It also claims "Our database tracks thousands of confirmed rug pulls" (`:704`), which is unverifiable with no DB.

### src/components/PageSEO.tsx
- The URL fallback `'/' + camel→kebab(pageKey)` (`:84,:94`) produces `/home` for `home`. Every current caller passes `urlPath`, but the fallback is a trap. Take the path from the route manifest instead (§4).
- It passes neither `url` nor `noindex` to `SEO`. That's fine, but it means `WebPage.url` (from `urlPath`) and the canonical (from `location.pathname`) can disagree. Example: `/developers/docs` renders `ApiPricing` with `urlPath="/developers/pricing"`, so the JSON-LD url is /developers/pricing while the canonical is /developers/docs.

### src/lib/seo.ts: PAGE_METADATA
- **Route coverage:** all 35 keys map to real routes. Routes without an entry: `/disclaimer`, `/start`, `/prices`, `/developers/docs` (aliases, all conditionally noindexed); `/reset-password`, `/search` and every gated route (no SEO at all, see above); dynamic routes (`/coin/:id`, `/compare/:type/:id`, `/scam/:id`, `/learn/:guideId`, `/course/*`, `/article/:slug`, `/blog/*`, `/sponsored/:slug`), which use `<SEO>` directly.
- **Not the source of truth.** Keys `home`, `calculators`, `compare`, `learn`, `scamDatabase` and `accessibility` are defined, but those pages hard-code different title/description strings in `<SEO>`. Examples: Calculators.tsx:131 has "Free Crypto Calculators - DCA, Fees, Staking & Tax" where the key says "Cryptocurrency Calculators - DCA, Staking, Tax & More", and ScamDatabase.tsx:236 is 60 chars before the suffix. Prerendering from metadata needs one source, so make these pages use `PageSEO`.
- **Lengths.** `SEO` appends " | Bitcoinvestments" (18 chars), and 21 of 35 entries end up with a full title over 60 chars: calculators 72, glossary 72, stakingCalculator 72, rebalancingAlerts 76, scamDatabase 69, whaleTracking 69, lending 69, developerPortal 69, backtesting 68, gasOptimizer 68, alertBundles 68, influencerVerification 68, reportScam 68, pricing 66, retirementCalculator 66, dcaAutomation 66, onChainAnalytics 64, multiExchange 64, learn 63, compare 61, hardwareWallet 61. Six descriptions exceed 160: home 195, dashboard 172, reportScam 169, learn 167, blog 166, charts 161. There are no duplicate titles or descriptions within PAGE_METADATA. Fix: either keep base titles ≤42 chars or drop the suffix when `title.length > 42`.
- **False claim:** glossary title and description say "300+ Crypto Terms" (`:141,:143`). The page has about 39.
- `SEO_CONFIG.themeColor '#f97316'` (`:22`) doesn't match index.html/manifest `#F7931A`. Minor.
- Dead exports: `generatePageSchemaBundle`, `generateGEOFAQSchema`, `generateComparisonSchema`, `generateDatasetSchema`, `generateEnhancedArticleSchema`, `generateLocalBusinessSchema` (contains the fake 4.8/1250 rating at `:1227-1230`) and `generateEducationalOrganizationSchema` have no callers in `src/**/*.tsx`. `src/hooks/useSEO.ts` also has no importers.

### src/lib/index-pruning.ts
- The logic is fine, but it only takes effect through `<SEO>` (see above).
- `shouldNoindex` reads `window.location.search` (`:81-87`). It's guarded, so it's SSR-safe, but faceted-param noindex then differs between server and client. Pass `search` in explicitly.
- `/accessibility` is noindexed (`:35`). An accessibility statement is a trust page, so consider indexing it. It's already excluded from the sitemap.
- The lists duplicate what the route manifest (§4) should own.

### src/components/Breadcrumbs.tsx and src/hooks/useBreadcrumbs.ts
- **P0 for SSR:** `useBreadcrumbs.ts:79`, `getParent: () => ({ ..., path: `/course/${window.location.pathname.split('/')[2]}` })`, runs during render. It **crashes SSR for `/course/:courseId/:moduleId`**, the only probe failure. Use `params.courseId`.
- **P1, links to routes that don't exist:** the segment fallback builds intermediate crumbs for `/coin`, `/scam`, `/blog/category`, `/developers` and `/sponsored`, none of which are routes, so each goes to NotFound. `/course/:id` crumbs to "Learn", but the module crumb label is "Course", not the course title. `/compare/:type/:id` shows "Exchange - Coinbase Pro" from the slug when the data name is "Coinbase Advanced" (`exchanges.ts:348`). Skip crumbs whose path isn't a real route, and label from data.
- Microdata BreadcrumbList (`Breadcrumbs.tsx:24-71`) conflicts with the static JSON-LD BreadcrumbList in index.html. Keep one: JSON-LD generated per route.

### src/components/GEOContent.tsx
- **The whole file is dead code** (no importers). If it gets adopted, `DirectAnswer` renders an `<h1>` (`:56`), which would double the H1 on any page that already has one. `LastUpdated` parses `new Date('YYYY-MM-DD')` as UTC (`:252`), so US visitors see the previous day, and under SSR it's a hydration mismatch. Format with `timeZone: 'UTC'`. Use these components with the prerender work (BLUF + FAQ + LastUpdated per page), or delete them.

### src/components/InternalLinks.tsx
- Only `RelatedPages` is used (6 pages). `ContextualLinks`, `QuickLinks`, `ContentHub` and `SEOFooterLinks` are dead.
- The dead code links `/article/what-is-bitcoin`, `/article/defi-basics` and `/article/crypto-wallets-explained` (`:230-232`). `/article/:slug` is Supabase-only (`services/database.ts:534-535` returns null with no DB). The static guides live at `/learn/:slug`.
- It also links `/compare?filter=beginners`, `?filter=fees` and `?type=wallets` (`:236-238,:318`). Compare.tsx never reads query params, so these are no-ops, and they're `Disallow`ed in robots and noindexed by index-pruning.
- "300+ terms explained" (`:229`) is false.

### public/sitemap.xml
- 60 URLs, and the audit found no mismatches with routes or noindex. lastmod distribution: 26 URLs at 2026-02-08 (7.5 months old), 2 at 2026-01-01, 13 at 2026-09-01, 19 at 2026-09-10. It's hand-maintained, so freshness is a guess. Generate it at build from the route manifest, using `git log -1 --format=%cs -- <source files>` per route.
- It includes `/compare/exchange/coinbase-pro` (data renamed to "Coinbase Advanced"; the slug is kept, which is fine) and pages that render only a spinner on first paint (§3).

### public/sitemap-articles.xml
- **P0: 15 of 17 URLs don't exist** (only `/learn/what-is-bitcoin` and `/learn/risk-management` are real guides): buying-first-bitcoin, how-bitcoin-works, wallet-security, avoiding-scams, two-factor-authentication, dca-strategy, portfolio-diversification, order-types, choosing-exchange, understanding-fees, crypto-taxes, tax-loss-harvesting, defi-introduction, nft-basics, staking-explained. All client-redirect to /learn. It's advertised in robots.txt:266, and the audit script never reads it. Delete the file and the robots line, or regenerate it from `src/data/guides`. The real guides are already in sitemap.xml.

### functions/api/sitemap.ts
- It lives under `/api/`, which robots.txt:18 disallows, so crawlers can't use it. `lastmod` is always "today" (`:110,:114`), a false freshness signal. It lists 10 `/article/*` slugs (`:87-98`) that are DB-only and blank without Supabase. **Delete it**, or replace it with a DB-driven blog sitemap outside `/api` (§4).

### public/robots.txt
- **P1, `Disallow: /assets/` in `User-agent: *` (`:24`)** blocks the JS/CSS bundles for every crawler without its own group (DuckDuckBot, Yandex, Claude-SearchBot, Claude-User, Perplexity-User, etc.). Rendering crawlers in that group can't render the SPA. Remove it.
- **P1, the AI policy contradicts itself.** The header says "BLOCK: AI training-only scrapers" (`:7`), yet it **allows** GPTBot (OpenAI's training crawler), Google-Extended and Applebot-Extended (training/AI-use control tokens), Meta-ExternalAgent and Cohere-AI. It **blocks** CCBot and `anthropic-ai` (a deprecated UA; Anthropic's crawler is `ClaudeBot`, which is allowed). ai.txt says `allow-training: true`. The retrieval agents Claude-SearchBot, Claude-User, Perplexity-User, DuckAssistBot and MistralAI-User aren't named and fall under `*`. **NEEDS-OWNER: decide "allow training?" yes/no, then make robots.txt and ai.txt agree.**
- Stale Allow lines: `/developer-portal` (`:50`, not a route; the real one is `/developers/portal`, which is noindexed), and `/report-scam` (`:44`, noindexed ComingSoon).
- Group rules don't inherit: the Googlebot group (`:69-74`) drops the `/sponsored/`, `/search?*` and facet disallows. That's acceptable, because noindex covers them, but worth knowing. `Crawl-delay` is ignored by Google.

### public/llms.txt (checked against current routes and content)
| Line | Claim | Reality |
|---|---|---|
| 6, 66 | "over 1,000 verified reports" | No static scam data. With no DB the scam DB is empty. Unverifiable. |
| 22, 67 | "300+ terms" | About 39 terms in Glossary.tsx |
| 15 | Portfolio Tracker "across multiple exchanges" | /portfolio-analysis is ComingSoon in STATIC_MODE; /multi-exchange shows only a spinner on first paint |
| 26-32 | /learn/buying-first-bitcoin, wallet-security, dca-strategy, choosing-exchange, understanding-fees, crypto-taxes, avoiding-scams | **Not real.** The real slugs are how-to-buy-crypto, crypto-wallets-explained, dca-strategies, crypto-taxes-basics, common-crypto-mistakes, understanding-blockchain, portfolio-rebalancing, risk-management, defi-basics, yield-farming, defi-risks |
| 49-51 | /course/bitcoin-fundamentals, crypto-investing-101, defi-basics | **Not real.** The only course is `/course/beginner-complete-course` (6 modules) |
| 59 | /compare/tax-software | **Not a route** (`compare/:type/:id` needs 2 segments), so it shows NotFound |
| 57-58 | Exchange and Wallet comparison both → /compare | Should list the 18 `/compare/exchange|wallet/:id` detail pages |
| — | Missing | /glossary, /blog, /pricing, /hardware-wallet, /lending, /retirement-calculator detail; there's no "last updated" line and no link to an `llms-full.txt` |
| ai.txt:45-51 | high-value pages | 6 of 7 `/learn/*` entries are dead (same list as above). `restricted-paths` lists `/dashboard/*` and `/settings/*`, which don't exist (the public /dashboard is fine). `editorial-standards: fact-checked, cited-sources, expert-reviewed` is unverifiable (NEEDS-OWNER). `last-updated: 2026-02-08`. |

Also: `_headers:66-69` configures `/llms-full.txt`, which doesn't exist. `humans.txt` says "Last update: 2024-12-23".
**Fix:** generate llms.txt (and an llms-full.txt with the guide bodies as plain markdown) at build from the route manifest, `src/data/guides` and `src/data/courses`, so it can't drift.

### public/_headers, _redirects, manifest.json
- `_redirects:6-17` rewrite files onto themselves (`/sitemap.xml /sitemap.xml 200`). That does nothing and can trigger Cloudflare's infinite-loop warning. Remove them.
- `_headers:36-37` `/*.html` no-cache only matches literal `.html` request paths. It does no harm. When prerendering, add a rule for the shell (`X-Robots-Tag: noindex`).
- `X-Robots-Tag: noindex` on the sitemaps is harmless.
- manifest.json is fine. The `/calculators?type=dca` shortcut: Calculators ignores `type`. Minor.

### vite.config.ts and package.json
- `modulePreload: false` with the comment "prevents ... triggering SIWE" (`vite.config.ts:28-31`) is stale, because Web3/SIWE was removed. Turn modulePreload back on. It speeds up hydration of prerendered pages by preloading route chunks.
- package.json has no prerender step. `@playwright/test` and `playwright` are devDeps, which would make option (a) possible.

### .github/workflows/ci.yml and deploy.yml
- CI doesn't run `pnpm audit:routes`. Add it, and extend the script (below).
- **Verify (NEEDS-OWNER):** `deploy.yml` builds with `pnpm run build` and has no `VITE_SUPABASE_*` env. `wrangler.toml [vars]` isn't read by Vite, and no `.env*` file is committed. Unless Cloudflare's git integration builds separately, the deployed bundle may have `isSupabaseConfigured() === false`, which means every DB feature is off in production.

### scripts/audit-route-indexing.mjs
Output (run 2026-09-23):
```
Route indexing OK - 67 routes, 60 sitemap URLs, 18 comparison pages, no mismatches.
```
Blind spots: it never reads `sitemap-articles.xml`, `llms.txt`, `ai.txt` or the robots Allow list. It treats `/learn/` and `/course/` as "CMS/DB" prefixes (`:40`) although they come from repo data (`src/data/guides`, `src/data/courses`), so the 15 dead guide URLs pass. It doesn't catch pages with no `<SEO>` (ComingSoon, Search). Extend it with those checks and run it in CI.

---

## 2. Rendering-related bugs found by the SSR probe

`renderToString` + `StaticRouter` + Layout + Auth/Toast/Accessibility providers (STATIC_MODE=true). Word counts include about 124 words of header/footer chrome.

| Result | Routes |
|---|---|
| **Renders real content** (H1 + body) | / (596w), /learn (560), /learn/what-is-bitcoin (987), /compare (506), /compare/exchange/coinbase (281), /compare/wallet/ledger-nano-x (282), /glossary (309), /privacy (1198), /terms (631), /pricing (884), /developers/pricing (617), /accessibility (725), /course/beginner-complete-course (383), /lending, /social-trading, /onchain-analytics, /influencer-verification, /retirement-calculator, /backtesting, /calculators, /scam-database, /dashboard, /charts, /defi-yield, /gas-optimizer, /blog (shell only) |
| **Throws** | `/course/:courseId/:moduleId`: `window is not defined` at `hooks/useBreadcrumbs.ts:79` |
| **Layout only (no H1, no SEO, no JSON-LD): `isLoading` starts `true` and the page early-returns a spinner before `<PageSEO>`** | /staking-calculator (`StakingCalculator.tsx:107`), /hardware-wallet (`HardwareWallet.tsx:116`), /multi-exchange (`MultiExchange.tsx:114`), /whale-tracking (`WhaleTracking.tsx:92`), /trading-indicators (`TradingIndicators.tsx:179`), /rebalancing-alerts (`RebalancingAlerts.tsx:97`), /dca-automation (`DCAAutomation.tsx:97`), /alert-bundles (`SmartAlertBundles.tsx:93`). This also hurts at runtime: there's no title, meta or H1 until data loads. **Fix:** render `<PageSEO>`, H1, intro and FAQ unconditionally, and put the spinner only inside the data panel. |
| **Layout only because the data is live (expected)** | /coin/:id (CoinGecko), /scam/:id, /article/:slug, /blog/:slug (Supabase). These need the edge function (§4). |
| **Double H1** | every `/learn/:guideId`. GuideDetail.tsx:93 renders the title as `<h1>`, and each guide's markdown starts with `# Title` (`src/data/guides/*.ts:9`), which the ReactMarkdown `h1` override renders as a second `<h1>` (`GuideDetail.tsx:121-122`). Map markdown `h1` to `h2`, or strip the leading `# ` line. |

Other hydration hazards (not crashes):
- `AccessibilityProvider` reads `matchMedia` synchronously in its `useState` initializer (`accessibility/AccessibilityContext.tsx:48-56,60`). On the server it's `false`. A client with reduced-motion gets a different first render, so consumers that skip heavy components produce a mismatch. Initialise from defaults when hydrating and sync in `useLayoutEffect`.
- `new Date()`/`Date.now()` during render in 15 page/component files (relative times, "as of" labels) will differ between build time and view time. React 18 recovers by client-rendering the nearest Suspense boundary. It isn't fatal, but log it via `onRecoverableError` and fix hot spots.
- `SEO.tsx` is effect-only (see §1).
- `EnrollmentPrompt.tsx:540-556` touches `document` at module scope. It has no importers today, but it would crash SSR if anyone imports it. Delete it or guard it.
- Supabase `createClient` at module scope (`lib/supabase.ts:12`) is SSR-safe (no localStorage access at import). CookieConsent, AnalyticsProvider and WebVitalsTracker only touch `window` in effects, so they're safe.

---

## 3. Prerendering options compared

| | (a) Headless browser snapshot (Playwright) | (b) `react-dom/server` SSG with StaticRouter | (c) Head-only injection from PAGE_METADATA + src/data | (d) Pages Function + HTMLRewriter at the edge |
|---|---|---|---|---|
| What crawlers get | Full rendered DOM, including whatever live data was fetched at build time | Full HTML of the static baseline: H1, body, FAQ, JSON-LD, head | Correct title, meta, canonical and JSON-LD, plus a hand-built noscript summary. **No real body.** | Correct head for any URL, including DB rows. Body only if you build it yourself in the function. |
| Build dependency | Chromium. GH Actions `ubuntu-latest` has Chrome and the repo has Playwright, but Cloudflare's own build image doesn't, so it's fragile and slow (about 60 routes × page load, plus network to CoinGecko and Supabase) | Node only. Probe: about 280 ms per route with Vite SSR | Node only, trivial | None at build. Runs per request (Functions quota; cache it). |
| Correctness risk | Bakes live prices, "loading" states and random ads into HTML. The captured `<head>` is correct because SEO effects ran. Non-deterministic. | Deterministic. Needs a head collector (SEO is effect-only), the 1 crash fix, and the 8 spinner-gate fixes. Hydration mismatches are recoverable in React 18. | No hydration concerns at all (body stays empty). | Body mismatch unless the client does `createRoot` for those routes |
| Keeps SPA + live data | Yes | Yes (hydrateRoot; live fetches run in effects as today) | Yes | Yes |
| DB-driven routes (blog posts, scam reports) | Only what exists at build time; new posts need a rebuild | Same as (a) | Same | **Yes, at request time.** New posts are indexable instantly, and real 404s are possible. |
| Effort | Medium | Medium (about 1 to 2 days) | Low | Medium for 3 to 4 routes |

**Recommendation: (b) for every repo-backed route, plus (d) for the DB-backed ones, with (c)'s metadata work as the foundation.**
- (b) is the only option that ships real body text (H1, BLUF, FAQ, guide content, comparison tables) without a browser. The probe shows the codebase is almost SSR-clean already.
- (d) covers what (b) can't: `/blog/:slug`, `/blog/category/:category`, `/scam/:id` and `/sponsored/:slug`, plus optionally `/coin/:id` (head only, or noindex it). It also gives real HTTP 404s for unknown slugs, where today every URL returns 200 with the home HTML.
- Drop (a). It's non-deterministic and the build image has no browser. Use Playwright only in an optional CI smoke test that loads 3 prerendered pages and asserts no hydration errors in the console.

---

## 4. Implementable design

### 4.1 A single route manifest (source of truth)
**New: `src/routes/manifest.ts`**, a pure TS file with no React imports so Node scripts can load it through the SSR build:
```ts
export interface RouteEntry {
  path: string;                 // '/learn/what-is-bitcoin'
  pageKey?: keyof typeof PAGE_METADATA;
  index: boolean;               // drives robots + sitemap
  prerender: 'static' | 'edge' | 'shell';
  sitemap?: { changefreq: string; priority: number };
  sources: string[];            // files whose git date = lastmod
}
export function allRoutes(): RouteEntry[]  // static list + expanders:
// guides (src/data/guides), course + modules (src/data/courses),
// compare/exchange|wallet ids (src/data/exchanges.ts, wallets.ts)
```
- `index-pruning.ts` derives from it (keep `shouldNoindex(path, search)` signature, drop `window`).
- Build-time generators consume it: `sitemap.xml`, `llms.txt`, `llms-full.txt` and the audit script.
- PAGE_METADATA becomes the only place titles and descriptions live. Pages call `<PageSEO pageKey>`. Dynamic pages build metadata from data via a `getRouteMeta(path)` helper that the prerender and the page share.

### 4.2 Head collection that works on server and client
**Change `src/components/SEO.tsx`:** add `HeadContext` (new `src/lib/head.tsx`). On the server, `SEO` writes its resolved tags into the collector **during render** (synchronously, last writer wins). On the client there's no collector, and it keeps today's `useEffect` path. Output: `<title>`, description, robots, canonical, OG/Twitter, `article:*`, and JSON-LD (move JSON-LD into head on the server; the client can keep inline scripts).
**New `src/components/RouteHead.tsx`,** rendered once in `Layout.tsx`. It applies defaults for any route whose page has no `<SEO>`: title from PAGE_METADATA or "Bitcoinvestments", robots from `shouldNoindex`, and self-canonical. That fixes the ComingSoon, Search and ResetPassword leaks. Page-level `SEO` overrides it.

### 4.3 Split router from app
- **Change `src/App.tsx`** to export `AppProviders` (QueryClient passed in, Accessibility, Analytics, Toast, Auth) and `AppRoutes` (the `<Routes>` tree plus the Suspense wrapper). Keep `App` = `BrowserRouter` + those, for the client.
- **New `src/entry-server.tsx`:**
```tsx
export function render(url: string): Promise<{ html: string; head: HeadTags; status: number }> {
  const head = createHeadCollector(); const qc = new QueryClient();
  // renderToPipeableStream + onAllReady so React.lazy routes resolve (verified: /glossary via lazy() renders fully, ~280 ms)
  ... <HeadContext.Provider value={head}><StaticRouter location={url}><AppProviders queryClient={qc}><AppRoutes/></AppProviders></StaticRouter></HeadContext.Provider>
}
```
- **Change `src/main.tsx`:**
```ts
const el = document.getElementById('root')!;
if (el.dataset.ssr === 'static') hydrateRoot(el, app, { onRecoverableError: logToSentry });
else createRoot(el).render(app);   // shell / edge-injected pages
```
With `hydrateRoot`, React 18 keeps the server HTML inside the `<Suspense>` while the lazy route chunk loads, so there's no loader flash. Re-enable `modulePreload` in vite.config.ts, and have the prerender script emit `<link rel="modulepreload">` for the route's chunk (from `dist/.vite/manifest.json`, which needs `build.manifest: true`).

### 4.4 Build pipeline
- **`package.json`:**
  `"build": "tsc -b && vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs"`
- **`vite.config.ts`:** `build.manifest: true`, `modulePreload: true`, and `ssr.noExternal` only if a dep fails at import. None did in the probe.
- **New `scripts/prerender.mjs`:**
  1. Read `dist/index.html` as the template. It contains `<!--app-head-->` and `<div id="root"><!--app-html--></div>`.
  2. For every `prerender:'static'` route, run `render(path)`, inject head + HTML, set `data-ssr="static"`, and write `dist/<path>.html`. Use the flat form (`dist/learn.html`, `dist/learn/what-is-bitcoin.html`): Cloudflare Pages serves `/learn` from `learn.html` without a trailing-slash redirect, which matches the existing canonicals. `/` goes to `dist/index.html`.
  3. Write `dist/_shell.html`: the template with the generic head, `noindex`, an empty root and **no** `data-ssr`. It's used by the edge functions and by client-only routes.
  4. Write `dist/404.html` from rendering `/404` (NotFound). **The top-level 404.html turns off Pages' SPA fallback**, so unknown URLs return a real 404 status instead of 200 + home.
  5. Generate `dist/sitemap.xml` (lastmod = `git log -1 --format=%cs` over `sources`), `dist/llms.txt` and `dist/llms-full.txt`. Delete `public/sitemap*.xml` and `public/llms.txt`. (GH Actions checkout uses depth 1, so set `fetch-depth: 0` in `deploy.yml` for git dates, or fall back to the build date.)
  6. **Fail the build** if any indexable prerendered page has ≠1 `<h1>`, title >60 or description >160, canonical ≠ its URL, <150 words of main text, or a render error. Include the 8 spinner-gate pages and the double-H1 guides, so the build enforces those fixes.
  7. `rm -rf dist-ssr`.
- **`public/_redirects`:** remove the self-rewrites. Add rewrites for client-only paths that aren't prerendered so they still boot the SPA: `/admin/* /_shell 200`, `/search /_shell 200`, `/profile /_shell 200`, … (or prerender them as ComingSoon, which is noindexed by `RouteHead`).
- **`public/_headers`:** `/_shell` → `X-Robots-Tag: noindex`.
- **`public/sw.js`:** bump `CACHE_NAME`. Navigation is already network-first per URL, which is compatible.

### 4.5 Edge functions for DB-driven routes (option d)
New files:
- `functions/blog/[slug].ts`, `functions/blog/category/[category].ts`, `functions/scam/[id].ts`, `functions/sponsored/[slug].ts`, and optionally `functions/coin/[id].ts` (head only; or noindex coin pages, since they're thin CoinGecko mirrors).
- `functions/_lib/shell.ts` (shared HTMLRewriter helpers) and `functions/_lib/supabase-rest.ts` (anon REST fetch).

Flow in each function:
```ts
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params, waitUntil }) => {
  const cache = caches.default; const hit = await cache.match(request); if (hit) return hit;
  const row = await fetchRow(env, params.slug); // GET {SUPABASE_URL}/rest/v1/articles?slug=eq.X&status=eq.published&select=title,excerpt,content,meta_title,meta_description,featured_image,published_at,updated_at
  const shell = await env.ASSETS.fetch(new URL('/_shell', request.url));
  if (!row) return new Response(await render404(env, request), { status: 404 });
  const res = new HTMLRewriter()
    .on('title', setText(row.meta_title ?? row.title))
    .on('meta[name="description"]', setAttr('content', row.meta_description ?? row.excerpt))
    .on('link[rel="canonical"]', setAttr('href', `https://bitcoinvestments.net/blog/${row.slug}`))
    .on('meta[name="robots"]', setAttr('content', 'index, follow, max-snippet:-1'))
    .on('head', appendJsonLd(blogPostingSchema(row)))          // BlogPosting + BreadcrumbList
    .on('#root', setInner(escapedArticleHtml(row)))           // <h1>, byline, date, plain-text paragraphs (escape; no DOMPurify at edge)
    .on('body', appendPreload('__PRELOADED_POST__', row))      // <script type="application/json"> → BlogPost uses as react-query initialData
    .transform(shell);
  const out = new Response(res.body, { headers: { ...res.headers, 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400' } });
  waitUntil(cache.put(request, out.clone())); return out;
};
```
- The root has no `data-ssr="static"`, so `main.tsx` does `createRoot`. BlogPost reads `__PRELOADED_POST__` and renders immediately with no spinner flash.
- Add a blog sitemap as a function outside `/api`: `functions/sitemaps/blog.ts` → `/sitemaps/blog` (id, slug, updated_at from Supabase; cached 1h). List it in robots.txt. **Delete `functions/api/sitemap.ts`.**
- Env: Pages project needs `SUPABASE_URL` and `SUPABASE_ANON_KEY` bindings (non-VITE names).
- `/article/:slug` reads the same `articles` table as `/blog/:slug` (`services/database.ts:534` vs `services/blog.ts:255`), so the same content has two URLs. Make `functions/article/[slug].ts` return a 301 to `/blog/:slug`, or drop the route. NEEDS-OWNER.

### 4.6 Files to create or change (summary)
Create: `src/routes/manifest.ts`, `src/lib/head.tsx`, `src/components/RouteHead.tsx`, `src/entry-server.tsx`, `scripts/prerender.mjs`, `functions/_lib/{shell,supabase-rest}.ts`, `functions/blog/[slug].ts`, `functions/blog/category/[category].ts`, `functions/scam/[id].ts`, `functions/sponsored/[slug].ts`, `functions/sitemaps/blog.ts`, (optional) `functions/coin/[id].ts`, `functions/article/[slug].ts`.
Change: `src/App.tsx` (split), `src/main.tsx` (hydrate vs create), `src/components/SEO.tsx` (collector + cleanup), `src/components/Layout/Layout.tsx` (RouteHead), `src/lib/index-pruning.ts` (from manifest, no window), `src/lib/seo.ts` (lengths, 300+, dead code, consolidate), `src/hooks/useBreadcrumbs.ts` (no window; skip non-routes), `src/pages/GuideDetail.tsx` (markdown h1→h2), 8 spinner-gate pages, `src/pages/{Home,Learn,Calculators,Compare,ScamDatabase,Accessibility}.tsx` (use PageSEO), `src/pages/BlogPost.tsx` (preloaded data), `index.html` (strip page-specific tags, fake ratings, FinancialService, FAQ, Breadcrumb; add placeholders; keep Organization + WebSite), `vite.config.ts`, `package.json`, `public/_redirects`, `public/_headers`, `public/robots.txt`, `public/ai.txt`, `.github/workflows/ci.yml` (run audit + prerender asserts), `.github/workflows/deploy.yml` (fetch-depth, env), `scripts/audit-route-indexing.mjs`.
Delete: `public/sitemap-articles.xml`, `public/sitemap.xml` and `public/llms.txt` (now generated), `functions/api/sitemap.ts`, `src/hooks/useSEO.ts`, dead exports in `GEOContent.tsx`/`InternalLinks.tsx`/`seo.ts` (or wire them up), `src/components/EnrollmentPrompt.tsx` (unused, touches `document` at module scope).

---

## 5. Prioritised fixes

**P0**
1. Remove fabricated `aggregateRating` from `index.html:248-254,407-413`, `SEO.tsx:647-653` and `seo.ts:1227-1230`. Remove the "1,000+ verified reports" and "300+ terms" claims everywhere (index.html, seo.ts, InternalLinks.tsx, llms.txt).
2. Strip page-specific tags from `index.html`: canonical, robots/googlebot/bingbot, og:url, FAQPage, BreadcrumbList, SiteNavigation, WebApplication, FinancialService and Dataset. Keep Organization + WebSite. This can ship **before** prerendering, and it stops every URL claiming canonical "/".
3. Fix the robots/canonical leak on routes without `<SEO>` (add `RouteHead` in Layout), so /login, /profile, /search etc. get `noindex` and a self-canonical.
4. Delete `public/sitemap-articles.xml` and its robots line. Rewrite llms.txt and ai.txt with real URLs (§1 table), then generate them at build.
5. Implement §4 (b + d) prerendering, including the `useBreadcrumbs.ts:79` crash fix, the 8 spinner-gate pages and the double-H1 guides.

**P1**
6. Resolve the robots.txt/ai.txt AI-training contradiction and remove `Disallow: /assets/` (NEEDS-OWNER for the training decision).
7. Shorten the 21 over-long titles and 6 over-long descriptions. Make PAGE_METADATA the only source.
8. Breadcrumbs: stop linking /coin, /scam, /blog/category, /developers and /sponsored. Use data names for labels.
9. Add `audit:routes` to CI and extend it (sitemap-articles, llms.txt, ai.txt, robots Allow list, repo-backed /learn and /course, pages with no SEO).
10. Verify production has `VITE_SUPABASE_*` at build time (deploy.yml sets none). NEEDS-OWNER.
11. Delete `functions/api/sitemap.ts` and replace it with a DB-driven `/sitemaps/blog`.

**P2**
12. Add a missing `apple-touch-icon.png` or drop the link. Remove self-rewrites in `_redirects`. Remove legacy meta tags. Add Organization `sameAs` (NEEDS-OWNER). Fix `LastUpdated` timezone. Delete the dead SEO code (`useSEO.ts`, unused GEOContent/InternalLinks exports and seo.ts generators) and consolidate the duplicate schema generators. Replace `/article/:slug` with a 301 to `/blog/:slug` (NEEDS-OWNER). Update the IC3 figures in `generateScamFAQSchema` to the latest annual report (NEEDS-OWNER/verify).
