# Per-page review: action plan

**Date:** 2026-09-23
**Inputs:** 14 page-group reviews in [`reviews/`](reviews/), produced against [`REVIEW_BRIEF.md`](REVIEW_BRIEF.md).
**Goal:** every page is current, follows SEO/GEO best practice, renders a complete static baseline that lights up with the database when it is available, and gives visitors something unique and true.

---

## 1. What the reviews found

| # | Area | Verdict | Headline problem |
|---|------|---------|------------------|
| 01 | Home, layout, error pages | Poor | Fabricated 4.8★/1,250-review rating and FAQ/Dataset JSON-LD in `index.html` shipped on **every** URL; newsletter form fails in every config |
| 02 | Dashboard, prices, charts, coin | Poor–Needs work | Gas widget shows `<0.01 gwei` as live (CSP blocks the RPC); CoinGecko errors are swallowed; `/coin/:id` has no unique content |
| 03 | Learn + 12 guides | Needs work | Unknown guide = soft 404; double H1 on every guide; FTX/TaxBit/stale regulation claims; no author/date |
| 04 | Courses + glossary | Poor | "300+ terms" (39 exist); definitions hidden from crawlers; positional fake "completed" progress |
| 05 | Blog / article / sponsored | Poor | No static baseline; anon blog query likely fails after the 2026-09-11 RLS change; fake sponsored fallback |
| 06 | Compare | Poor | Invented ratings fed to Product schema; literal `AFFILIATE_ID` in every affiliate link; sponsored shown as rank #1 |
| 07 | Calculators | Poor | DCA always returns $0; 2024 tax brackets; fake 4.7★ rating; backtest data ends 2024-12 |
| 08 | Scam database | Poor | Green "No scams found" shown when nothing was checked (false safety); RLS lets users self-verify reports |
| 09 | Lending, DeFi yield, HW wallet, gas | Poor | `Math.random()` APYs/gas shown as live; affiliate commission shown as user bonus |
| 10 | Social, on-chain, whale, indicators, multi-exchange | Poor | Invented traders/returns and invented whale moves attributed to real companies |
| 11 | Rebalancing, DCA automation, alert bundles, influencer | Poor | Fake subscriber counts and "verified" influencer scores under real-looking handles; price alerts can never fire (symbol vs CoinGecko id) |
| 12 | Pricing, API, search, legal | Poor | **Checkout metadata injection** (pay $9.99, record Enterprise API); pricing sells features that don't exist |
| 13 | Auth-gated + admin | Not ready | Flipping `STATIC_MODE` would break signup (no profile trigger) and Stripe (enum/columns missing); noindex never emitted |
| 14 | SEO/GEO infrastructure | — | SPA ships the homepage's HTML/canonical to every non-JS crawler; `robots.txt` blocks `/assets/`; llms.txt/ai.txt/sitemap-articles list dead URLs |

## 2. Principles applied to every fix

1. **Nothing fabricated.** No invented ratings, counts, testimonials, traders, whale moves, APYs or "live" numbers. If real data isn't available, the page says so and teaches instead.
2. **Static baseline first.** Every public page renders its H1, answer-first summary, body, FAQ and JSON-LD from repo data on the first render (no spinner-only first paint, no `window` during render), so it can be prerendered.
3. **Database lights up on top.** DB reads are guarded by `isSupabaseConfigured()`, time out, and fall back to the static baseline; DB-only actions show an honest "needs an account — coming soon" state.
4. **One source of truth** for routes, metadata, index/noindex and the sitemap.
5. **Dated facts.** Volatile facts (fees, APYs, models, regulation) carry a visible "last verified" date.
6. **Owner-only facts are flagged, not invented** (see §5).

## 3. Workstreams

### P0: security (done first)
- [x] Checkout: ignore caller metadata/mode; own-origin redirect URLs only.
- [x] `/api/send-email`: require worker secret or signed-in user (own address or admin); welcome mail moved to a fixed-template `/api/newsletter-welcome`; Resend-first mailer.
- [x] Scam-report RLS: drop the permissive legacy policies, force `pending` on insert, `SECURITY DEFINER` vote trigger (WS-E, migration `20260923000100`).
- [x] Scam detail: render reported URLs as plain text, block `javascript:`; stop showing emails (WS-E).
- [x] Found during WS-K: a leftover wallet-login policy let any signed-in user without a profile insert one with `role = 'super_admin'`; API-key owners could raise their own tier; review authors could approve their own reviews (migration `20260923000300`).
- [x] Admin user list selected `*` on `users`, shipping every account's 2FA secret to the admin's browser.

### WS-0: site-wide SEO/GEO hygiene
- Strip page-specific and fabricated JSON-LD from `index.html` (keep Organization + WebSite); fix meta description; drop "1,000+ reports", "300+ terms", "$29.99/mo" and crypto-payments claims.
- `RouteHead` default: every route gets correct canonical + robots even without `<SEO>`; `<SEO noindex>` in ComingSoon and SearchResults; sync `googlebot`/`bingbot` tags.
- `_headers`: `X-Robots-Tag: noindex` for gated/admin/utility routes; CSP additions needed by the new real data sources.
- `robots.txt`: stop blocking `/assets/`; one consistent AI-crawler policy (allow answer and search bots); drop stale Allow lines.
- Delete `public/sitemap-articles.xml` and `functions/api/sitemap.ts`; regenerate `llms.txt`/`ai.txt` from real routes.
- Redirects: `/prices` → `/dashboard`, `/start` → `/learn`, `/developers/docs` → `/developers/pricing`, `/article/:slug` → `/blog/:slug`, legacy guide slugs → real guides.
- Unknown IDs (guide, course, module, compare, coin, scam, blog) render `<NotFound/>` (noindex), never a redirect.
- Titles ≤ 60 chars incl. suffix, descriptions ≤ 160; `PAGE_METADATA` is the single source.

### WS-A: Learn, guides, courses, glossary
Fix facts (FTX, TaxBit, regulation/GENIUS Act, halving, spot ETFs, 1099-DA, Trezor/Ledger lineups, POL, Sky/USDS), maths errors, double H1, soft 404s, computed read time, author/updated fields + Article/FAQ/HowTo schema, internal links to tools, glossary definitions in the DOM with per-term anchors, one glossary source shared with search, real (localStorage) course progress.

### WS-B: Compare
Remove invented ratings and review counts from UI and schema; clear "Sponsored" labelling that never overrides sort; env-driven affiliate links with `rel="sponsored"`; refresh every exchange/wallet fact with `lastVerified`; honour `?tab=`; NotFound for unknown ids; "best for" verdicts and head-to-head tables from existing helpers.

### WS-C: Calculators
One dated tax table (2025/2026, filing status, NIIT), fix DCA (historical prices), staking compounding, retirement Monte Carlo (lognormal), backtest DCA wiring and refreshed price history; URL-param state; visible method + FAQ; remove fake rating and dead premium gates.

### WS-D: Market pages
Working gas data (CSP + service), surfaced CoinGecko errors with cached fallback, real refresh, curated static profiles for top coins on `/coin/:id` (index those, noindex the rest), crawlable links, null-safe formatting, honest "stored in this browser" portfolio messaging.

### WS-E: Scam database
Sourced static baseline (`scamTypes`, notable documented cases), neutral "no match in our records — that does not mean it's safe" wording, security migration, defanged URLs, crawlable cards, working URL state, noindex thin/unverified reports, `/report-scam` becomes a public "how to report a scam" guide.

### WS-F: DeFi and wallet tools
Real yields via a cached `/api/yields` Pages Function over DefiLlama with "as of" dates; remove fake bonus/best-rate banners; lending page leads with CeFi collapse lessons; hardware wallet page becomes a dated comparison guide; gas optimizer uses the real gas service, fixes the cost bug, adds L2 data-fee caveat.

### WS-G: Analytics and trading
`/trading-indicators` fixed and kept; `/onchain-analytics` and `/whale-tracking` rebuilt on free public data with an educational baseline; `/social-trading` becomes an honest copy-trading guide; `/multi-exchange` gated (ComingSoon + noindex).

### WS-H: Alerts and automation
`/rebalancing-alerts` → client-side rebalancing calculator; `/dca-automation` → DCA planner + recurring-buy guide (no 50% return); `/alert-bundles` → browser-saved price alerts; `/influencer-verification` → "how to vet a crypto influencer" guide. Price-alert pipeline: CoinGecko id mapping so alerts can fire.

### WS-I: Blog (static + database)
Build-time export of published posts to a committed snapshot; blog service returns the snapshot then merges live Supabase results; public `authors` table instead of reading `users`; category slug fix; working TOC anchors; sponsored page without fake fallback and with "Paid for by" disclosure; `/article/*` → `/blog/*`.

### WS-J: Home, pricing, legal
Remove fabricated testimonials/counts/claims; fix Fear & Greed gauge; honest pricing page for static mode (waitlist instead of dead-end buy buttons, no non-existent features); legal pages list the services actually used; About/editorial-policy page.

### WS-K: Database readiness
Idempotent reconcile migration (signup profile trigger + backfill, missing `users` columns, enum values, missing tables, `app_meta` schema version), migration replay fixes, `FeatureGate` + `useBackendStatus` replacing the global flag (flag stays on until the owner flips it), fixed tax year, rewritten REBUILD_GUIDE.

### WS-L: Build-time prerendering (after A–K land)
`src/routes/manifest.ts` → sitemap, llms.txt, index-pruning, audit; server head collector for `<SEO>`; `entry-server.tsx` + `scripts/prerender.mjs` writing per-route HTML with real H1/body/JSON-LD; `hydrateRoot` on prerendered pages; Pages Functions with HTMLRewriter for DB routes (`/blog/:slug`, `/scam/:id`) with real 404s; audit + prerender checks in CI.

## 4. Execution order
1. P0 security → 2. WS-0 hygiene → 3. WS-A…WS-K in parallel (each owns its own files; shared files go through WS-0) → 4. WS-L prerender → 5. full build, lint, audit, prerender checks.

## 5. Needs the owner (not invented; defaults chosen are noted)
- Real audience numbers, testimonials, author names/bios, editorial reviewer for tax content. *Default: removed until supplied.*
- Affiliate IDs per partner (env vars) and which sponsorships are real. *Default: sponsored labels only where data says sponsored; links fall back to plain URLs.*
- AI training policy. *Default: allow search/answer and training crawlers, consistent across robots.txt and ai.txt.*
- Whether Supabase project `mkdckqrukmukbmgxabyk` is live and which migrations it has; production `VITE_SUPABASE_*` build vars. *Default: `STATIC_MODE` stays on.*
- Email provider (Resend key) and legal entity/address for Terms and Privacy.
- Whether paid plans, the API product and the tax package will launch. *Default: waitlist, no dead-end checkout.*

---

## 6. Status (2026-09-23): all workstreams complete

| Workstream | Status | Notes |
|---|---|---|
| P0 security | Done | Checkout metadata injection, open email relay, scam RLS, super_admin self-grant, admin 2FA leak |
| WS-0 hygiene | Done | index.html stripped of fabricated/page-specific schema; RouteHead; robots, llms.txt, ai.txt, redirects, X-Robots-Tag |
| WS-A Learn/guides/courses/glossary | Done | Facts refreshed and dated, single H1, real 404s, bylines + schema, 113-term glossary in the DOM, real course progress |
| WS-B Compare + hardware wallets | Done | No invented ratings, honest sponsored labels, env affiliate IDs, refreshed lineups/fees with sources |
| WS-C Calculators | Done | 2025/2026 tax tables, historical DCA, lognormal Monte Carlo, price history to Sep 2026 |
| WS-D Market pages | Done | Working gas via `/api/gas`, typed CoinGecko errors + last-good cache, 20 curated coin profiles |
| WS-E Scam database | Done | Sourced scam-type guide, IC3 figures, documented cases, neutral no-match wording, how-to-report guide |
| WS-F DeFi/lending/gas | Done | Real yields via `/api/yields` (DefiLlama), CeFi collapse lessons, fixed gas cost bug |
| WS-G Analytics | Done | Indicators fixed; on-chain + whale pages on public data via `/api/onchain`; copy-trading guide; multi-exchange gated |
| WS-H Alerts/automation | Done | Rebalancing calculator, DCA planner, browser price alerts, influencer-vetting guide; price-alert emails can fire |
| WS-I Blog | Done | Build-time snapshot + live merge, public `authors`, category fix, sponsored disclosure |
| WS-J Home/pricing/legal | Done | No fabricated social proof, honest pricing/waitlist, accurate legal pages, About, unsubscribe |
| WS-K Database readiness | Done | Reconcile migration, replayable migrations, FeatureGate + `VITE_ACCOUNTS_ENABLED`, fixed Stripe webhook, rebuild guide |
| WS-L Prerendering | Done | 113 routes prerendered (92 indexable), generated sitemap, real 404s, functions for DB routes, CI-enforced checks |

**Verified here:** `pnpm run build` with `PRERENDER_STRICT=1` (every indexable page: one H1, self-canonical, title <= 60, description <= 160), `pnpm run lint` (0 errors), `pnpm run audit:routes`, and a Playwright pass over 43 routes (all hydrate with no errors; client navigation and tools work).

**Not verifiable from this environment** (no network to these hosts): Supabase (migrations untested against the live project; replayed on PGlite), DefiLlama, mempool.space, Blockchain.com, CoinGecko. Check `/api/yields`, `/api/onchain`, `/api/gas`, `/api/btc-fees` on a preview deploy.

### Owner checklist
1. Confirm the Supabase project is live; apply migrations `20260923000000`-`20260923000400` (order in `rebuild/REBUILD_GUIDE.md`).
2. Set repository/Pages build variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; secrets `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. If Cloudflare builds from git instead of `deploy.yml`, set them there as build variables.
3. Supply: author names/bios (`authors` table, `EDITORIAL_AUTHOR`), a CPA/EA reviewer for tax content, affiliate IDs (`VITE_AFFILIATE_*`), which sponsorships are real (`src/data/exchanges.ts`), legal entity/governing law (Terms/Privacy placeholders).
4. Re-check flagged facts: Gemini ActiveTrader fees, hardware wallet prices, unverified state tax rows, IC3 2025 figures, `src/data/notableScams.ts`, `src/data/coins.ts`.
5. Decide: AI-training crawler policy (currently allowed), which paid products will launch, price-history data licence (Coin Metrics CC BY-NC), whether to pause the price-alert cron while accounts are off.
6. When ready for accounts: set `VITE_ACCOUNTS_ENABLED=true` and follow the go-live checklist.
