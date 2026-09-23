# Review 01: Home (`/`), site shell, utility pages, index.html

Scope: `src/pages/Home.tsx` and what it renders (Hero, price ticker, feature grid, FearGreedGauge, NewsFeed, "Why us", Testimonials, Newsletter, final CTA), `src/components/Layout/{Layout,Header,Footer}.tsx`, `/404`, `/403`, `/500`, `/maintenance`, `src/pages/ComingSoon.tsx`, and `index.html`.
Note: **`SuccessStories.tsx` is not rendered on Home or anywhere else.** It is dead code, and `grep` finds no importer.

Link audit: every internal link in Header, Footer, Home, Hero, NotFound, Forbidden and ComingSoon points to a route that exists in `src/App.tsx`. But the `?tab=wallets` links don't work (see Header/Footer below), and in STATIC_MODE `/signup`, `/login`, `/portfolio-analysis`, `/tax-reports` and similar routes render `<ComingSoon/>`.

---

### `/` — src/pages/Home.tsx (+ Hero, Testimonials, Newsletter, FearGreedIndex, NewsFeed)
- **Purpose / target query:** Brand homepage and hub. Targets "learn crypto investing for beginners" and "how to invest in Bitcoin".
- **Verdict:** Poor. The design is attractive, but the page has fabricated social proof, stats that contradict each other, no crawlable content, and several widgets that go blank or break without their APIs.

- **Up-to-date issues:**
  - Hero.tsx:116-117 says "50+ Guides". There are 12 guides (`src/data/guides/index.ts:24-38`) and 1 course (`src/data/courses/index.ts:26`). Testimonials.tsx:188 repeats "50+ Educational Guides".
  - Audience numbers disagree with each other and have no source. Hero.tsx:111 says "10K+ Readers", Testimonials.tsx:184 says "15K+ Active Users", Newsletter.tsx:132 says "Join 10,000+ investors", Testimonials.tsx:192 says "120+ Countries", and Testimonials.tsx:196 shows a "4.8" rating. **NEEDS-OWNER**: supply real figures or remove them.
  - Home.tsx:268-270 says "Completely Free… 100% free to use forever", and Hero.tsx:121-122 says "Free / Forever". Both contradict the paid plans in `src/services/stripe.ts:67-110` ($9.99/mo, $99.99/yr, $49 Advisor, $299 lifetime) and the header's "View Plans" CTA.
  - Home.tsx:116 and :206, plus the meta description at :132, promise "portfolio tracking". In STATIC_MODE the portfolio features are Coming Soon.
  - Home.tsx:306 says "Join thousands of beginners…". It is unsubstantiated.
  - NewsFeed uses the legacy CryptoCompare endpoint `min-api.cryptocompare.com/data/v2/news/` (services/news.ts:20) and links "View All" to cryptocompare.com/news (NewsFeed.tsx:60). CryptoCompare's data business is now CoinDesk Data. Verify the endpoint still returns data without an API key.
  - The welcome email that Newsletter triggers goes through MailChannels' keyless Workers endpoint (`functions/api/send-email.ts:62`). MailChannels ended that free Cloudflare Workers integration in 2024, so the welcome mail most likely never sends. The failure is silent: database.ts:464-468 is fire-and-forget.

- **SEO issues:**
  - Meta description is 195 chars; it should be under 160 (Home.tsx:132). The same string is at `lib/seo.ts:41-44` and index.html:62. Home also duplicates `PAGE_METADATA.home` inline instead of importing it.
  - The H1 "The Future of Crypto Investing" (Hero.tsx:86-89) doesn't match the title's target phrase "Learn Crypto Investing for Beginners". The "next generation of investors" copy (Hero.tsx:92) doesn't fit the stated 25-55 audience.
  - Heading order: FearGreed "Fear & Greed Index" h3 (FearGreedIndex.tsx:76) and NewsFeed h3 (NewsFeed.tsx:58) have no parent h2 of their own. They sit under the "Everything You Need…" h2.
  - WebPage JSON-LD (Home.tsx:48-126) references `isPartOf @id …/#website`, but the WebSite block in index.html:150-174 has no `@id`, so the entity graph is broken. `provider` is a new anonymous Organization instead of `{ "@id": ".../#organization" }`.
  - All the site-wide JSON-LD lives in the static index.html head, so every route inherits it (see the index.html section).
  - Price ticker `alt={coin.name}` is fine. The duplicated marquee items (Home.tsx:156) are exposed to screen readers twice.

- **GEO issues:**
  - No BLUF or answer-first summary, no definition of what the site is or who runs it, no visible FAQ, no "last updated" date, and no author or editorial signals.
  - "All our content is vetted by crypto experts" (Home.tsx:260) is not backed by any author, reviewer or About page. **There is no `/about`, editorial-policy or affiliate-disclosure route in App.tsx.**
  - Nothing on the page is quotable: there are no numbers with sources. The only facts are live widget values, and they are client-rendered.
  - Non-JS crawlers and LLM fetchers get index.html's `<noscript>` "JavaScript Required" H1 (index.html:448-459) and nothing else. Home needs prerendering: the H1, intro, feature grid, "how to start" steps, FAQ and footer links.

- **Static + DB:**
  - Prices (Hero.tsx:31-43 and Home.tsx:19-25) come from CoinGecko through `/api/coingecko`, and Footer fetches separately. That is 3 separate requests with different cache keys (limits 6, 3 and 1), where 1 would do. On failure `getTopCryptocurrencies` returns `[]` (coingecko.ts:173-177). The ticker then renders an empty 48px strip (Home.tsx:154-168), and the Hero card shows only "View All Prices" with no message (Hero.tsx:157). There is no static fallback or "prices unavailable" note.
  - FearGreed (alternative.me) shows a red "Failed to load" box on error (FearGreedIndex.tsx:62-71). It has no static explainer fallback and no attribution to alternative.me.
  - The NewsFeed error state is unreachable. `getLatestNews` swallows errors and returns `[]` (news.ts:74-77), so on failure the card shows just the "Latest Crypto News" header with an empty body (NewsFeed.tsx:54-100). There is no empty state.
  - Newsletter without Supabase: the user types an email, submits, and gets "Newsletter subscription is not configured" (database.ts:409-411). The form appears on Home and in the footer of every page.
  - Newsletter with Supabase: the "already subscribed" pre-check selects by email (database.ts:414-418), but RLS allows SELECT only for admins (`supabase/migrations/20260128000000_comprehensive_rls_security.sql:723-726`). The check therefore always misses. A repeat subscriber then hits the `email UNIQUE` constraint (`supabase/schema.sql:141`) and sees the raw Postgres "duplicate key…" message (database.ts:458-460). The reactivation branch (:420-447) can't be reached by anonymous users. Emails aren't trimmed or lowercased. The success text says "Check your email for confirmation" (Newsletter.tsx:23), but there is no double opt-in.
  - Testimonials are hardcoded (Testimonials.tsx:13-56). They are fabricated reviews presented as real, and one is from a "Financial Planner" who "recommends to all my clients". This is a YMYL trust problem and a potential FTC fake-review issue. The DB-backed `SuccessStories` component exists but is unused.

- **Uniqueness / content gaps:** The page is a generic SaaS template (hero, 4 feature cards, "why us", testimonials, CTA) and could belong to any crypto site. It is missing:
  - (a) a 3-step "Start here" path: learn → pick an exchange → set up DCA, linking the real guides `/learn/what-is-bitcoin`, `/learn/how-to-buy-crypto` and `/learn/crypto-wallets-explained`.
  - (b) a "Check before you send" scam-lookup search box that posts to `/scam-database?q=`, which ScamDatabase.tsx:69 already reads.
  - (c) a small inline DCA example with real historical numbers and a source.
  - (d) a static list of "latest guides and posts" with dates.
  - (e) a visible 5-6 question FAQ that mirrors the JSON-LD.
  - (f) a "Who we are / how we make money" strip with an affiliate disclosure.

- **Bugs:**
  - **FearGreed gauge value is clipped.** The container is `relative w-48 h-24 overflow-hidden` (FearGreedIndex.tsx:159). The value/classification block is `absolute bottom-0 … translate-y-8` (:195), which pushes it 32px below the clipped box. The number is only partly visible and the classification label is hidden. The icon at `top-2` (:204) also overlaps the needle near 50.
  - Testimonials carousel math: each step moves `100/3 + 2`% (Testimonials.tsx:108), but cards are `calc(33.333% - 16px)` plus a 24px gap (:113), so positions drift. On mobile, cards are `w-full` but `itemsPerView` is fixed at 3 (:71). The 4 dots then step about 35% of one card per step, so cards 4-6 are never fully shown.
  - Autoplay (Testimonials.tsx:82-86) pauses only on mouse hover. There is no keyboard or touch pause control (WCAG 2.2.2), it ignores reduced motion, and the dots lack `aria-current`. The marquee ticker also has no pause control.
  - Hero coin rows have `cursor-pointer` but aren't links (Hero.tsx:158). They should link to `/coin/{id}`.
  - A null `price_change_percentage_24h` renders a bare "%" in red (Hero.tsx:174-176, Home.tsx:161-163).
  - "Create Account" CTA → `/signup` → ComingSoon in STATIC_MODE (Home.tsx:316-321).
  - Double top padding: `main` has `pt-20` (Layout.tsx:19) and Hero also has `pt-20` plus `min-h-[90vh]` (Hero.tsx:65).
  - FearGreed history tooltips are hover-only (FearGreedIndex.tsx:128), and the values are shown by colour only.
  - FearGreed "What does this mean?" copy gives trading advice: "Consider accumulating…", "Consider taking some profits" (FearGreedIndex.tsx:241-252). This is a YMYL issue; reword it as neutral description.

- **Recommended fixes:**
  - **P0** Delete the fabricated testimonials and the stats bar (Testimonials.tsx), or replace them with `SuccessStories` fed from the DB and shown only when approved rows exist. Remove or correct "10K+", "15K+", "50+", "120+", "4.8" and "10,000+" in Hero.tsx, Testimonials.tsx and Newsletter.tsx. **NEEDS-OWNER** for any real numbers.
  - **P0** Resolve the "100% free forever" claim against the paid plans. Change it to "Free guides and calculators; optional Premium" in Home.tsx:268-270 and Hero.tsx:121-122. **NEEDS-OWNER** to confirm the pricing strategy.
  - **P0** Newsletter:
    - Hide the form, or swap it for a "coming soon" note, when `!isSupabaseConfigured()`.
    - Replace the select-then-insert with one `insert` and handle error code `23505` as "You're already subscribed". Better still, use a `security definer` RPC `subscribe_newsletter(email, source)`.
    - Trim and lowercase the email.
    - Change the success text to "You're subscribed".
    - Replace MailChannels in `functions/api/send-email.ts` with a working provider (Resend, Postmark, SES). **NEEDS-OWNER** for the provider and key. Also require a server-side check so `/api/send-email` can't send arbitrary HTML to arbitrary recipients: send the welcome mail from a DB trigger or a server function, not from the client.
  - **P0** Prerender `/` at build time (e.g. `vite-plugin-prerender`/`react-snap`, or a Cloudflare Pages Function that injects static HTML). At minimum the H1, intro, feature links and FAQ should be in the static HTML.
  - **P1** Fix the FearGreed gauge clipping: remove `overflow-hidden` from the wrapper, or render the value below the SVG in normal flow. Add a "Source: alternative.me" link, make the interpretation copy neutral, and replace the error box with a static explainer of the index.
  - **P1** Add static fallbacks. Ticker: hide the section when `prices.length === 0`. Hero card: show "Live prices unavailable, view Dashboard". NewsFeed: add an empty state, or hide the card and show the latest 4 internal blog or guide links from `src/data/guides`.
  - **P1** Add GEO content sections to Home.tsx: a BLUF paragraph under the H1 ("Bitcoinvestments is a free, independent education site that…"), a "Start here" 3-step list, a scam-check search box, a visible FAQ, and a "Last reviewed: <date>" line. Emit the FAQ via `generateFAQSchema` only on `/`, and move FAQ JSON-LD out of index.html.
  - **P1** Retarget the H1, e.g. "Learn to Invest in Crypto, Safely", keeping "The Future of Crypto Investing" as an eyebrow. Shorten the description to about 150 chars and drop "portfolio tracking". Import `PAGE_METADATA.home` instead of duplicating it.
  - **P1** Build the About / Editorial Policy / How We Make Money pages. Add an author/reviewer entity and link it from Home and Footer. **NEEDS-OWNER**: names, bios, credentials.
  - **P2** Fetch top coins once, e.g. with react-query key `['top', 6]` shared by Hero, Home and Footer. Make Hero coin rows `<Link to={/coin/${id}}>`. Replace "Create Account" with a newsletter or "Start with Bitcoin basics" CTA while STATIC_MODE is on. Fix carousel math or use CSS scroll-snap, add pause/play, and respect `settings.reducedMotion`. Hide the duplicated marquee half with `aria-hidden`. Remove Hero's `pt-20`.

---

### Site shell — src/components/Layout/Layout.tsx, Header.tsx, Footer.tsx
- **Purpose:** Global nav, footer, and a11y scaffolding (SkipLinks, RouteAnnouncer, Breadcrumbs, CookieConsent).
- **Verdict:** Needs work. The link targets all exist, but the wallet tab links don't work, there are two nav a11y bugs, the STATIC_MODE messaging is contradictory, and E-E-A-T links are missing.

- **Up-to-date issues:**
  - In STATIC_MODE the header CTA is "View Plans" → `/pricing` (Header.tsx:297-305, :560-567). `config/staticMode.ts:8` says the header "shows newsletter signup instead of auth buttons". Plans can't be bought without auth.
  - The STATIC_MODE Tools menu advertises Multi-Exchange ("Manage multiple exchanges"), Rebalancing Alerts and Smart Alert Bundles (Header.tsx:84-89). The Research menu advertises Social Trading ("Follow top traders", :110). These are account and DB features; confirm with the per-page reviews whether they work statically.
  - The "Dashboard" description "Your portfolio overview" (Header.tsx:47) and NotFound.tsx:36 "View your portfolio" are wrong in STATIC_MODE, where it is a prices page.

- **SEO issues:**
  - `/compare?tab=wallets` (Header.tsx:62, Footer.tsx:125 "Wallet Guide") and `?tab=exchanges` (Header.tsx:61) are ignored. `Compare.tsx:64` uses `useState('exchanges')` and never reads search params, so the "Wallets" and "Wallet Guide" links land on the exchanges tab. The query-string URLs also create duplicates of `/compare`. Use a real route (e.g. `/compare/wallets`) or read `tab`.
  - The footer has no About, Contact page, Editorial policy, Affiliate disclosure or social profiles, and there is no `sameAs` anywhere. These are weak entity and E-E-A-T signals. "Contact Us" is only a mailto (Footer.tsx:166).
  - `/disclaimer` renders `<Terms/>` (App.tsx:215) and is linked from Footer.tsx:147. That is duplicate content (conditional-noindexed in index-pruning.ts:51).
  - Breadcrumbs render for any unmatched URL too (useBreadcrumbs.ts:209-216 only hides `/` and the auth pages). A 404 at `/foo/bar` emits microdata BreadcrumbList links to `/foo`. Every page also carries index.html's static BreadcrumbList "Home > Learn > Tools" (index.html:332-357), so there are conflicting breadcrumb schemas.

- **GEO issues:** The footer has a one-line "Not financial advice" (Footer.tsx:183) but no link to a full risk disclosure, no "about the publisher", and no last-reviewed or editorial statement. Footer links are client-rendered, so crawlers without JS see no internal links at all.

- **Static + DB:** The header skips auth in STATIC_MODE (Header.tsx:150-157), which is good. The Footer BTC pill silently hides on failure, which is fine. The Footer newsletter fails without the DB, as described above.

- **Uniqueness / content gaps:** 7 top-level menus with about 25 children is heavy for a beginner audience, and the IA is odd: "Hardware Wallet Guide" sits under DeFi (Header.tsx:122), Scam Database under Research. Consider putting "Start here", Scam Checker and Exchanges/Wallets at the top level.

- **Bugs:**
  - **Nav links have no accessible name at 1024–1279px.** The label is `hidden xl:inline` (Header.tsx:243). lucide-react 0.555 sets `aria-hidden="true"` on icons, so the link is empty for screen readers, and sighted users get unlabeled icons with no tooltip.
  - **Collapsed mobile accordion links stay focusable.** They are hidden only via `max-h-0 opacity-0` (Header.tsx:507-513), so keyboard and screen-reader users tab through about 25 invisible links. Add `hidden`/`inert` when collapsed.
  - Nested landmarks: `div role="navigation"` wraps another `<nav>` (Header.tsx:470-473).
  - `role="menu"`/`menuitem` is applied to plain link lists (Header.tsx:256, :278) without arrow-key handling, which misuses the ARIA menu pattern. Enter/Space on a parent link calls `preventDefault` (Header.tsx:193-197), so keyboard users can't follow the parent link itself.
  - Footer.tsx:191 calls `btcPrice.change.toFixed(2)`. A null 24h change from CoinGecko would throw inside the Layout and take down every page (only AppErrorBoundary catches it). Footer.tsx:189 uses `toLocaleString()` instead of `formatCryptoPrice` and can show 3 decimals.
  - Newsletter footer variant uses `<a href="/privacy">` (Newsletter.tsx:58), which does a full page reload. Use `<Link>`.

- **Recommended fixes:**
  - **P0** Make `Compare.tsx` read `useSearchParams().get('tab')` to set the initial tab, and set `canonical` to `/compare`. Alternatively, add `/compare/wallets` and update Header.tsx:61-62 and Footer.tsx:125.
  - **P1** Header.tsx:243: give the link `aria-label={item.label}` or keep the label as `sr-only` below xl. Add `title` for sighted users.
  - **P1** Header.tsx:507: add `hidden={!isExpanded}` (or `inert`) to collapsed sections. Remove the outer `role="navigation"`.
  - **P1** In STATIC_MODE, replace "View Plans" with a newsletter or "Start Learning" CTA, or keep it only if Pricing clearly says "launching soon". **NEEDS-OWNER.**
  - **P1** Add footer links to About, Editorial Policy, Affiliate Disclosure and Contact once they exist, plus social profiles, and add them as `sameAs` in the Organization schema. **NEEDS-OWNER** for profile URLs.
  - **P2** Guard `btcPrice.change` against null and use `formatCryptoPrice`. Replace ARIA `menu` roles with a disclosure pattern. Stop rendering breadcrumbs when the route is the `*` catch-all.

---

### `index.html` (static fallback + head for every route)
- **Verdict:** Poor. It is the only thing non-JS crawlers see. It is identical for every URL and full of site-wide structured data that is wrong for most pages and partly fabricated.
- **Up-to-date / accuracy issues:**
  - `aggregateRating 4.8 / 1250` on WebApplication (index.html:248-254) and FinancialService (:407-413). There is no review system behind it. These are fabricated, self-serving ratings, which violates Google's review snippet policy and invites a manual action. **Remove.**
  - "1,000+ verified reports" appears at index.html:121, :305 and :423, and in llms.txt:6. **NEEDS-OWNER**: verify against the real scam DB count in static mode.
  - `priceRange "Free - $29.99/mo"` (:393) matches no plan in stripe.ts ($9.99/$99.99/$49/$299). `paymentAccepted "…Cryptocurrency"` (:395) is unverified.
  - The FAQ says "Binance provides the lowest fees" as a beginner recommendation (:296). Binance.com is unavailable to US users, and the page declares `geo.region US` (:74). This is stale and YMYL-risky.
  - `citation_publication_date` / `citation_online_date` are "2024" (:441-442) and are served on every page. SEO.tsx never overrides them, so every article claims a 2024 date.
  - The FAQ "Is Bitcoinvestments free?" (:314) sells premium features (multi-exchange, whale alerts, tax reports) that are Coming Soon in STATIC_MODE.
  - `apple-touch-icon.png` (:51) does not exist in `public/`, so it returns 404 or the SPA HTML.
- **SEO issues:**
  - All 9 JSON-LD blocks (Organization, WebSite, SiteNavigation, WebApplication, FAQPage, BreadcrumbList, EducationalOrganization, FinancialService, Dataset) are static in the head, so **every URL** carries them. Examples: the FAQPage on the privacy page, and the Dataset and BreadcrumbList "Home > Learn > Tools" on a blog post. The FAQ content isn't visible on any page.
  - Three separate org entities (`#organization`, `#educationalOrganization`, `#business`) describe the same publisher.
  - SiteNavigation lists `/report-scam` (:215-217), which is noindexed and renders ComingSoon.
  - Sitelinks SearchAction (:155-173) is obsolete; Google retired the sitelinks search box in late 2024. It's harmless but can be removed.
  - The title order "Bitcoinvestments | Learn…" (:60) differs from the SEO component's "Learn… | Bitcoinvestments".
  - Obsolete meta tags (`keywords`, `revisit-after`, `rating`, `distribution`, `coverage`, `target`, `title`) are noise. `twitter:url` and `meta name="title"` are never updated by SEO.tsx, so they keep saying "/" on every page.
  - Description is 195 chars (:62).
- **GEO issues:** The body contains only a `<noscript>` "JavaScript Required" H1 (:448-459), so LLM crawlers see nothing citable. The static FAQ answers are the only content and aren't on any visible page.
- **Recommended fixes:**
  - **P0** Delete both `aggregateRating` blocks and the FinancialService block. Merge EducationalOrganization into one `Organization` (`@id #organization`) with `sameAs`, `logo` and `contactPoint`. Give WebSite `@id #website`. Keep only Organization and WebSite in index.html.
  - **P0** Move FAQPage (with Binance removed or rewritten neutrally), BreadcrumbList and Dataset out of index.html. Emit the FAQ from Home via `<SEO schema>` together with a visible FAQ section, Dataset from ScamDatabase, and breadcrumbs per page.
  - **P0** Add build-time prerendering for indexable routes, at least `/`, `/learn`, `/learn/*`, `/compare`, `/calculators` and `/glossary`, so the body contains real HTML. Keep the noscript message beneath it.
  - **P1** Fix the numbers ($ range, 1,000+) after owner confirmation. Remove `citation_publication_date`/`citation_online_date` from index.html, or have SEO.tsx overwrite them per page. Add `public/apple-touch-icon.png` or remove the link. Trim obsolete meta tags and shorten the description.

---

### `/404` and `*` — src/pages/NotFound.tsx
- **Purpose:** Error page for unmatched URLs.
- **Verdict:** Needs work. It is accessible and noindexed, but it is a soft 404 with a thin recovery path.
- **Up-to-date issues:** "Dashboard: View your portfolio" (NotFound.tsx:36) is wrong in STATIC_MODE, and the Search icon is on the Dashboard link.
- **SEO issues:**
  - It is a soft 404: Cloudflare Pages serves index.html with HTTP 200 for any path (`public/_redirects` comments). `noindex` (NotFound.tsx:47-51) mitigates this.
  - The canonical is set to the bad URL (SEO.tsx:111). For a 404 it's better to omit the canonical.
  - The static index.html JSON-LD (FAQ, rating) is still present on every 404 URL.
- **GEO issues:** N/A (noindex).
- **Static + DB:** Fully static. OK.
- **Uniqueness / content gaps:** There is no search box, even though GlobalSearch exists, and no links to Scam Database, Calculators, Compare or Glossary. The page doesn't try to match `location.pathname` against known guide slugs, which matters because llms.txt advertises 7 wrong `/learn/*` slugs (see Cross-cutting).
- **Bugs:** The manual `role="alert"` div appended to `document.body` (NotFound.tsx:20-32) duplicates RouteAnnouncer's announcement. "Go Back" (:91-97) does nothing when the page has no history (direct landing). Hide it when `window.history.length <= 1`.
- **Recommended fixes:**
  - **P1** Add a Cloudflare Pages Function (`functions/[[path]].ts`) or `_routes`-based check that returns HTTP 404 for paths not in the route list, e.g. generated from App.tsx by `scripts/audit-route-indexing.mjs`.
  - **P1** Add GlobalSearch and links to Learn, Scam Database, Calculators and Compare. Add fuzzy "Did you mean /learn/how-to-buy-crypto?" matching against `guides` keys.
  - **P2** Skip the canonical when `noindex`. Remove the duplicate alert. Fix the Dashboard label and icon.

### `/403` — src/pages/Forbidden.tsx
- **Verdict:** Good for what it is. It is never linked or navigated to: grep finds no `navigate('/403')`, and ProtectedRoute/AdminRoute redirect to `/login`.
- **SEO:** Noindex via prop and path. OK. **Static + DB:** Uses `useAuth`. In STATIC_MODE `user` is null, so it shows "Sign In" → `/login` → ComingSoon (Forbidden.tsx:47-53), which is a dead end.
- **Recommended fixes:** **P2** In STATIC_MODE, show "Accounts are coming soon" with Learn and Home links instead of Sign In. Consider removing the route if nothing uses it.

### `/500` — src/pages/ServerError.tsx
- **Verdict:** Needs work (minor).
- **Bugs / accuracy:** "Our team has been notified" (ServerError.tsx:33) is false: nothing is logged, although `functions/api/log-error.ts` exists. The "Error Reference" ID (:12) is random, never stored, and regenerated on every render. The route is never navigated to.
- **Recommended fixes:** **P2** Either POST the reference ID to `/api/log-error` on mount and memoise it with `useState(() => …)`, or remove the "notified" sentence and the reference code.

### `/maintenance` — src/pages/Maintenance.tsx
- **Verdict:** Needs work (minor).
- **Bugs:** It is nested inside `<Layout>` (App.tsx:249), so the "we're offline" page shows the full header, nav, footer, live BTC price and newsletter form. It also has `min-h-screen` and its own background. The support email appears twice (Maintenance.tsx:38-49). `text-gray-600` on the dark background (:48) fails contrast. There is no ETA or status link.
- **Recommended fixes:** **P2** Move the route outside `<Layout>`, like `/admin`. Real maintenance mode should be a Cloudflare-level switch returning 503 with `Retry-After`, because a client route can't do that. Drop the duplicate line and raise contrast to `text-gray-400`.

### ComingSoon (rendered for 14 `staticGuard` routes) — src/pages/ComingSoon.tsx
- **Purpose:** Placeholder for auth/DB routes while STATIC_MODE is on (App.tsx:46-48).
- **Verdict:** Needs work.
- **SEO issues:** **ComingSoon never renders `<SEO>`**, only `usePageTitle` (ComingSoon.tsx:6), so `shouldNoindex` never runs for these URLs. The comment in `usePageTitle.ts:16-17` claims otherwise. The results:
  - On a direct load, `/login`, `/signup`, `/report-scam`, `/tax-reports` and the rest keep index.html's `robots: index, follow` and `canonical: https://bitcoinvestments.net/` (index.html:65, :97). They are indexable, with a canonical pointing at the homepage, and they carry the homepage FAQ, rating and Dataset JSON-LD.
  - On client-side navigation they keep the previous page's canonical and robots tags.
- **Static + DB:** Static. OK.
- **Uniqueness / content gaps:** The message is generic. It doesn't say which feature is coming (e.g. "Scam reporting"), when, or offer a way to be notified.
- **Bugs:** Decorative icons lack `aria-hidden`. lucide adds it automatically, so this is fine.
- **Recommended fixes:**
  - **P0** Render `<SEO title="Coming Soon" noindex />` in ComingSoon.tsx, or make `usePageTitle` also set `robots=noindex` and remove the canonical.
  - **P1** Accept an optional `feature` prop from `staticGuard` (e.g. `staticGuard(el, 'Scam reporting')`) and show a feature-specific message. For `/report-scam`, link to external reporting bodies (FBI IC3, FTC, Action Fraud) so the page is useful. Add a "notify me" newsletter form only once Newsletter works.

---

### Cross-cutting findings (outside strict scope but homepage-adjacent)
- `public/llms.txt:25-32`: 7 of 8 guide links use slugs that don't exist, such as `/learn/buying-first-bitcoin`, `/learn/wallet-security` and `/learn/dca-strategy`. The real slugs are in `src/data/guides/index.ts:24-38` and match `public/sitemap.xml:225-302`.
- `public/llms.txt:49-51` lists courses (`bitcoin-fundamentals`, `crypto-investing-101`, `defi-basics`) that don't exist; only `beginner-complete-course` does.
- `public/llms.txt:59` points to `/compare/tax-software`, which matches no route (`compare/:type/:id` needs 2 segments), so it lands on NotFound.
- llms.txt also claims "300+ glossary terms" and "1,000+ verified reports". **NEEDS-OWNER / verify.**
