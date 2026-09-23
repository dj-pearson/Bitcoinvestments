# Review 12: Pricing, API pricing/docs, Search, Legal, Accessibility

## Headline answers
- **Can anyone buy from /pricing in STATIC_MODE?** Not through the UI. `wrangler.toml:16` ships a **live** `pk_live_` publishable key, so `isStripeConfigured()` is true and every buy button is enabled (`Pricing.tsx:338,396,472,533,590,863`). But `StaticAuthProvider` always sets `user = null`, so each click runs `navigate('/login?redirect=/pricing')` (`Pricing.tsx:34-36,64-66,90-92`). `/login` is wrapped in `staticGuard`, so it renders **ComingSoon** (`App.tsx:184`). The result is a dead end: the site sends visitors to a pricing page that cannot take their money. The Header's main static-mode CTA is "View Plans" → `/pricing` (`Header.tsx:299-304`), and about 25 components/pages link to `/pricing`.
- **The server endpoint can still take money, though.** `functions/api/create-checkout-session.ts` has **no authentication**. It only checks that `userId` is shaped like a UUID and `userEmail` like an email (`:106-118`). Anyone who POSTs to it with a random UUID gets a live Stripe Checkout URL, as long as `STRIPE_SECRET_KEY` is set in the Pages dashboard (I can't verify that from the repo). If they pay, `stripe-webhook.ts:260-270` runs `users.update(...).eq('id', userId)` against a row that doesn't exist. **The customer is charged and receives nothing.** A static build has no login and no `/profile`, so there's nowhere to use a subscription anyway.
- **Security bug in the same endpoint (P0):** client-supplied `metadata` is spread into the session metadata (`create-checkout-session.ts:165-168`), and the webhook trusts `metadata.subscriptionType === 'api'` and `metadata.apiTier` (`stripe-webhook.ts:247-249,329`). A buyer can pay for the $9.99 Premium price with `{subscriptionType:'api', apiTier:'enterprise'}` and get an `api_subscriptions` row at the $499 tier. The client also controls `mode` (`:132`).
- **Is the pricing page selling features that don't exist? Yes, and it's the most serious honesty problem in this scope.** Details are in the /pricing section. Examples: "SMS Alerts" (there's no SMS sender in `functions/`), "Ad-free" (no ad component is rendered on any public page), "15-min delay vs Real-time" (`useDataDelay` is never used), "TurboTax/H&R Block integration", "Support for 50+ exchanges", "Client Dashboard / White-label / SSO / Dedicated account manager", "Limited Offer – only 500 spots" (not enforced anywhere), a struck-through "$499" original price that was never charged, "Join thousands of investors", "30-day money-back guarantee" and "50% student discount" (neither appears in the Terms). All of these sit on a site where login is switched off.
- **Is the API product real?** Partly. `functions/api/v1/` has only 3 endpoints: `market/prices`, `market/historical`, `portfolio` (GET/POST). They proxy the free CoinGecko API. Keys have to exist in Supabase `api_keys`, and the only place to create one is `/developers/portal`, which shows ComingSoon in static mode. **So no one can get a key today.** The page advertises webhooks, analytics, tax reports, multi-user/white-label, "10,000+ cryptocurrencies", a `bv_test_` sandbox and an `api.bitcoinvestments.net/v1/...` host. None of those exist in `functions/`; the code serves `/api/v1/*`.
- **Search noindex is broken.** `/search` never renders `<SEO>` (it only calls `usePageTitle`, `SearchResults.tsx:60`). That means `shouldNoindex('/search')` (`index-pruning.ts:30`) never runs, and the page keeps the `index, follow` from `index.html:65` or whatever robots/canonical the previous route left behind. `robots.txt:28` `Disallow: /search?*` sits only in the `*` group. **Googlebot and Bingbot have their own groups (`robots.txt:66-89`) without that rule, so they may crawl and index `/search?q=…`.** `/disclaimer` has the same problem (no SEO component at all).

---

### /pricing — src/pages/Pricing.tsx (+ services/stripe.ts, services/subscriptionLimits.ts, functions/api/create-checkout-session.ts)
- **Purpose / target query:** "bitcoinvestments pricing / premium". This is a navigational and brand page, not a real organic query.
- **Verdict:** Poor. It sells plans that can't be bought and features that don't exist, and it's linked from the main Header CTA.
- **Up-to-date issues:**
  - The tax package is hard-coded to `id: 'tax-season-2025'` and "for the 2024 tax year", with `taxYear: 2024` (`subscriptionLimits.ts:533-540`). In Jan–Apr 2027 `isTaxSeasonActive()` (`:572`) will enable "Buy Tax Package" for a return two years out of date.
  - "Limited Offer" / "only 500 spots" (`Pricing.tsx:412,823`; `stripe.ts:157-158`): `maxPurchases` is never read by any code.
  - The FAQ says you can switch or cancel "from your profile page" (`Pricing.tsx:780`), but `/profile` is ComingSoon.
  - "Get Started Free" and "Start Free" link to `/signup` (`:289,853`), which is ComingSoon.
- **SEO issues:**
  - The title "Pricing Plans - Premium Crypto Tools & Features | Bitcoinvestments" is **66 chars**, over the 60 limit (`seo.ts:173` + `SEO.tsx:109`).
  - The page is indexed and listed in the sitemap (`sitemap.xml:66`, `robots.txt:45`) even though nothing on it is purchasable. Noindex it while STATIC_MODE is on.
  - There's no Product/Offer JSON-LD: `generatePricingSchema` exists (`seo.ts:927`) but nothing uses it. Leaving it unused is the right call until offers are real, because Offer markup for unbuyable products would be misleading.
  - FAQ content (`:774-843`) isn't passed to `PageSEO faqs`.
- **GEO issues:** there's no BLUF saying what's free today. The free tier's actual value (every calculator, guide and comparison, no account needed) is buried under paywall messaging.
- **Static + DB:** renders fully with no DB, from static tier config. Every buy path is a dead end (see headline). The error banner appears below the 30-row comparison table (`:766`), so a user who clicks a button near the top never sees it.
- **Uniqueness / content gaps:** the feature matrix (`Pricing.tsx:128-162`) and tier lists (`stripe.ts:53-176`, `subscriptionLimits.ts:541-558`) promise things that aren't built or can't run statically:
  - SMS Alerts (no SMS code in `functions/`).
  - Ad-free and "Ads displayed" (`stripe.ts:62,76`): `AdUnit`/`Advertisement` aren't rendered on any public page.
  - "15-min delay" (`:135`): `useDataDelay` has no consumers.
  - Tax Software Integration, and TurboTax/H&R Block integration (`subscriptionLimits.ts:552`).
  - "Support for 50+ exchanges" (`:548`).
  - Client Dashboard, White-label, SSO, Team Access, Dedicated Account Manager.
  - "Premium research reports", "Exclusive annual webinars", "Personalized portfolio review", "Community access".
  - "Join thousands of investors" (`:850`) can't be verified.
  - Reference price $499 (`stripe.ts:152`, `Pricing.tsx:422-424`) with no evidence it was ever charged. That's a fake-discount risk under FTC, UK CMA and EU Omnibus rules.
- **Bugs:**
  - **P0** Unauthenticated checkout endpoint plus client metadata injection (see headline): `create-checkout-session.ts:106-168`, `stripe-webhook.ts:247,329`.
  - `successUrl`/`cancelUrl` accept any https URL (`create-checkout-session.ts:147-162`), an open redirect after payment.
  - Tax package checkout (`Pricing.tsx:104-119`) posts `userEmail` possibly `undefined`.
  - The two "Best Value" badges (lifetime `:408` and enterprise `:545`) contradict each other.
  - The emoji prefixes in feature strings (`stripe.ts:75-172`) are read aloud by screen readers, and "✨ Everything in Free, plus:" appears as a checklist item right under the heading "Everything in Free, plus:" (`Pricing.tsx:308`), so it shows twice.
- **Recommended fixes:**
  - **P0** In STATIC_MODE, replace the checkout UI with an honest "Premium is coming. Everything on the site is free today" page plus a newsletter/waitlist signup (`Newsletter` component; Supabase is configured). Do this in `Pricing.tsx` or with `staticGuard` in `App.tsx:216`. Change the Header CTA "View Plans" (`Header.tsx:299-304`) to point to /learn or /calculators.
  - **P0** In `create-checkout-session.ts`, `create-tax-package-checkout.ts` and `create-api-checkout-session.ts`: require a Supabase JWT (`Authorization: Bearer`), derive `userId`/email from the verified token, drop client `metadata` and `mode` (use `priceConfig.mode`), and set `subscriptionType` on the server. Until auth exists, return 503 when STATIC_MODE is on, or unset `STRIPE_SECRET_KEY` in Pages. NEEDS-OWNER: confirm whether `STRIPE_SECRET_KEY` is live in the dashboard, and check Stripe for any orphaned payments.
  - **P0** Delete every feature claim that isn't implemented (listed above), the fake "$499"/"500 spots" scarcity, and "thousands of investors". NEEDS-OWNER: decide the real feature list.
  - **P1** Add refund, cancellation and discount terms to `/terms`, or remove them from the FAQ. NEEDS-OWNER.
  - **P1** Make `TAX_PACKAGE.taxYear` derive from the date (`new Date().getFullYear()-1`) and fix the `id`/description, or remove the product.
  - **P1** Add `noindex` to /pricing while STATIC_MODE is on, and remove it from `sitemap.xml:66`. Shorten the title to "Pricing & Plans".
  - **P2** Strip emoji from feature strings, move the error banner next to the buttons (or show it as a toast), and use one "Best Value" badge.

### /developers/pricing and /developers/docs — src/pages/ApiPricing.tsx (both routes, App.tsx:217,219)
- **Purpose / target query:** "crypto price API pricing".
- **Verdict:** Poor. It advertises an API nobody can get a key for, and "docs" is just the pricing page again.
- **Up-to-date issues:**
  - The sample response has `"timestamp": "2024-12-22T10:00:00Z"` and BTC at $65,000 (`ApiPricing.tsx:379-382`).
  - `MATIC`→`matic-network` (`functions/api/v1/market/prices.ts:61`): Polygon moved to POL in 2024.
- **SEO issues:**
  - `/developers/docs` renders the same component. It's auto-noindexed (`index-pruning.ts:52`), but its canonical is its own path (`SEO.tsx:112`) and its "View Documentation" button (`:442`) links to itself.
  - `PageSEO urlPath` only feeds the schema, not the canonical.
  - `/developers/pricing` is in the sitemap (`sitemap.xml:189`).
  - Grid tier names are `<h3>` with no `<h2>` above them (`:155`).
  - `robots.txt:50` allows `/developer-portal`, a route that doesn't exist.
- **GEO issues:** none worth fixing until the product is real.
- **Static + DB:** tiers come from the static `demoTiers` (`apiAccess.ts:315-398`, via `getApiTiers()` `:566`). "Get Started Free" and "Get API Key" go to `/developers/portal`, which is ComingSoon. Subscribe buttons send users to /login, also ComingSoon. The server needs `VITE_STRIPE_API_*` price env vars, which aren't in `wrangler.toml`, so checkout would return 500 "Price not configured". (Client `API_STRIPE_PRICES` `:9-13` is placeholders and ignored by the server.)
- **Uniqueness / content gaps:** claims versus reality in `functions/api/v1`:
  - The page promises "10,000+ cryptocurrencies"; the endpoint maps 15 symbols and lowercases the rest as CoinGecko IDs (`prices.ts:51-69`).
  - The page promises Webhooks, Analytics, Tax Reports and Multi-User/white-label (`:269-351`); none exist.
  - The `bv_test_` "sandbox" (`:417`) is only a key prefix (`_middleware.ts:108`), with no separate environment.
  - Host `api.bitcoinvestments.net/v1` isn't configured; the code serves `/api/v1/*`.
  - The rate-limit FAQ (`:408`) matches the tiers (OK).
  - NEEDS-OWNER: reselling free/Demo CoinGecko data under a paid plan likely breaks CoinGecko's terms (commercial redistribution needs a paid CoinGecko plan).
- **Bugs:**
  - Dynamic Tailwind classes like `` `border-${color}-500/50` ``, `` `text-${color}-500` ``, `` `hover:bg-${color}-600` `` (`:145,149,196,245-246`) are only generated if the exact literal string appears elsewhere in the code. Some variants (e.g. `border-emerald-500`, `text-emerald-400`, `hover:bg-emerald-500/10`) may not be.
  - `key={index}` (`:194`).
- **Recommended fixes:**
  - **P0** In STATIC_MODE, noindex `/developers/pricing` and drop it from the sitemap, or replace it with a short "Developer API — waitlist" page. Remove the claims for webhooks, analytics, tax, multi-user, 10,000+ coins and sandbox. NEEDS-OWNER: whether to keep the API product at all.
  - **P1** Make `/developers/docs` a real docs page generated from the 3 actual endpoints (params, response shapes from `prices.ts`/`historical.ts`/`portfolio/index.ts`, error codes from `_middleware.ts`). Otherwise `<Navigate to="/developers/pricing" replace/>` in `App.tsx:219`. Fix the example host to `https://bitcoinvestments.net/api/v1/...`.
  - **P2** Replace dynamic Tailwind class strings with a static color map. Fix `robots.txt:50` to `/developers/portal` (or remove it).

### /search — src/pages/SearchResults.tsx (+ services/search.ts, components/GlobalSearch.tsx)
- **Purpose / target query:** on-site search. It should never be indexed.
- **Verdict:** Needs work. It works fully without the DB, but indexing is broken and there are several dead deep links.
- **Up-to-date issues:** `GLOSSARY_TERMS` in `search.ts:66-110` is a separate hand-copied list (36 entries) from the one on `pages/Glossary.tsx` (39 entries), so edits drift apart.
- **SEO issues:**
  - **P0** No `<SEO>` means no noindex and a stale canonical (see headline). `SearchResults.tsx:60` uses only `usePageTitle`. The comment in `usePageTitle.ts` saying such pages are "already path-noindexed" is wrong for this page, because nothing applies the noindex.
  - `robots.txt:28` doesn't cover the Googlebot/Bingbot groups.
- **GEO issues:** not applicable (utility page).
- **Static + DB:** fully static. It searches static guides (`data/guides`), courses and modules, the duplicated glossary list, exchanges and wallets. Crypto search is a live CoinGecko call, which fails gracefully (`search.ts:418-441`). It **does not** index blog posts, scam database entries, calculators/tool pages, or `/compare` category pages. Multi-term AND scoring is sound (`search.ts:163-210`).
- **Uniqueness / content gaps:** add tools and calculators (static list of routes), blog posts (Supabase with fallback), and scam entries (Supabase) as result types.
- **Bugs:**
  - Glossary results link to `/glossary?term=…` (`search.ts:332`), but `Glossary.tsx` never reads the query string, so the user lands at the top of the glossary.
  - Crypto results link to `/charts?coin=…` (`search.ts:428`), but `Charts.tsx` never reads it, so every coin opens the default Bitcoin chart. Use `/coin/:id` (route exists, `App.tsx:177`).
  - The "Courses" filter sends `types:['course']`, and `globalSearch` then drops the `module` results (`search.ts:495-497`). Module hits disappear and there's no "Modules" chip.
  - The filter state isn't written to the URL (`SearchResults.tsx:67-69`). `?type=` is read once, and popular-search buttons reset it (`:215`).
  - The page-variant `GlobalSearch` input starts empty even when `?q=` is present (`GlobalSearch.tsx:75`).
  - The autocomplete has no combobox semantics: no `role="combobox"`/`listbox`/`aria-expanded`/`aria-activedescendant`. Arrow-key selection isn't announced.
  - The "/" focus-search shortcut advertised on /accessibility and in `KeyboardShortcutsHelp.tsx:42` is not implemented anywhere.
- **Recommended fixes:**
  - **P0** Add `<SEO title="Search" description="…" noindex />` to `SearchResults.tsx`. Add `Disallow: /search` to the Googlebot and Bingbot groups in `robots.txt`. Better still, the SPA should set noindex on route change for any page without `<SEO>` (the same bug affects /disclaimer).
  - **P1** Link crypto results to `/coin/${id}`. Make Glossary read `?term=` and scroll to and highlight the term, or link to `/glossary#slug`. Export a single glossary dataset from `src/data/glossary.ts` for both files.
  - **P1** Include `module` whenever `course` is selected. Sync filters to `?type=`. Prefill the input from `q`.
  - **P2** Index tools and blog. Add ARIA combobox semantics. Implement "/" or remove the claim.

### /privacy — src/pages/Privacy.tsx
- **Purpose / target query:** legal/trust page.
- **Verdict:** Needs work. The structure is good (GDPR bases, CCPA, consent, retention), but it describes the full auth product, names no legal entity, and leaves out several processors that are actually running.
- **Up-to-date issues:**
  - `LAST_UPDATED = 'July 23, 2026'` (`:8`), but `sitemap.xml:208` lastmod is 2026-01-01.
  - The text assumes accounts, portfolio sync, payments and scam reports (`:47-51,80,132,160`), none of which are available in STATIC_MODE (enabled Mar 2026). It doesn't say which features are currently off.
- **SEO issues:** title and description are fine. The page could use a WebPage JSON-LD with `dateModified`.
- **GEO issues:** not applicable.
- **Static + DB:** static. The consent reopen button works (`reopenConsentBanner`).
- **Uniqueness / content gaps (compliance):**
  - No legal entity name or postal address: "available on request" (`:38`). GDPR Art. 13(1)(a) requires the controller's identity and contact details.
  - No EU/UK representative (Art. 27) if the business is outside the EU/UK.
  - Missing processors and recipients that are actually live:
    - CoinGecko, alternative.me and CryptoCompare. The browser calls these directly and sends the visitor's IP (`public/_headers` CSP connect-src).
    - Google Fonts, which gets the IP on every page load (`index.html:45`).
    - Cloudflare Turnstile (`challenges.cloudflare.com` in CSP).
    - Anthropic, for AI features (`/api/claude`) when enabled.
    - The email provider: Amazon SES (`wrangler.toml` comments).
    - Stripe is named only as "payment processor"; name it.
  - localStorage use (portfolio tracker, accessibility settings, consent) isn't disclosed.
  - No CCPA "categories collected in last 12 months" table.
  - No named Data Protection Officer or contact beyond an email address. NEEDS-OWNER.
- **Bugs:** none.
- **Recommended fixes:**
  - **P0 NEEDS-OWNER** Add the legal entity name, registered address and jurisdiction.
  - **P1** Add a "What we collect while accounts are disabled" section (newsletter email via Supabase, consent-gated analytics, and local-only browser storage). List CoinGecko, Google Fonts, Cloudflare Turnstile, Amazon SES and Stripe by name, or self-host fonts.
  - **P1** Align `sitemap.xml` lastmod with `LAST_UPDATED`. Consider generating both from one constant.

### /terms and /disclaimer — src/pages/Terms.tsx (one component, two routes, App.tsx:214-215)
- **Purpose / target query:** legal. The disclaimer is also a YMYL trust signal.
- **Verdict:** Needs work.
- **Up-to-date issues:**
  - `LAST_UPDATED = 'July 23, 2026'` (`:6`); sitemap lastmod is 2026-01-01 (`sitemap.xml:215`).
  - "Account Registration" (`:177-191`) describes a feature that's switched off.
  - Nothing covers paid subscriptions, auto-renewal, refunds, lifetime deals or API usage, while /pricing and /developers/pricing sell all of them.
- **SEO issues:**
  - **/disclaimer renders no SEO component** (`Terms.tsx:12-139`). Its title, description, robots and canonical are inherited from whatever page came before, e.g. navigating from /terms leaves `canonical=/terms`, and a direct load shows `index.html`'s "/" canonical with `index`.
  - Its intended noindex (`index-pruning.ts:51`) never applies. /disclaimer isn't in the sitemap.
  - It's arguably worth indexing: a real "Not financial advice / affiliate disclosure" page helps E-E-A-T.
- **GEO issues:** the affiliate disclosure (`#affiliate-disclosure`) is solid and quotable, but it can't be found by search engines as things stand.
- **Static + DB:** static. Fine.
- **Uniqueness / content gaps:**
  - No governing law or venue: "applicable laws" (`:273`). No entity name.
  - The "Use License" bans commercial use and "automated systems to scrape" (`:169-173,212`), which contradicts selling a commercial data API.
  - "Modifications … at any time without notice" (`:263`) is weak for consumer subscriptions in the EU/UK.
  - The disclaimer says affiliate links are "clearly labeled with 'Affiliate' badges" (`:97`). `AffiliateDisclosure.tsx` exists and is used in `Compare.tsx`; I haven't checked every affiliate link sitewide.
- **Bugs:**
  - The disclaimer's own footer lacks Privacy/Terms links (`:132-136`).
  - The Terms footer uses `flex gap-4` without `flex-wrap` (`:285`), which can overflow on narrow phones (Privacy uses `flex-wrap`).
- **Recommended fixes:**
  - **P0** Split the disclaimer into its own `Disclaimer.tsx` with `<PageSEO>` (add a `disclaimer` key to `PAGE_METADATA`) and a self-canonical. Decide index vs noindex (recommend index, and remove it from `CONDITIONAL_INDEX_PATHS`), then add it to the sitemap.
  - **P0 NEEDS-OWNER** Add entity name, governing law and venue, plus subscription, auto-renew, cancellation and refund terms matching the pricing FAQ (30-day refund, student discount) or remove those FAQ claims. Add API terms or remove the API product.
  - **P1** Add a line that says accounts and paid plans are not currently available.

### /accessibility — src/pages/Accessibility.tsx
- **Purpose / target query:** accessibility statement plus preference toggles.
- **Verdict:** Needs work. It's honest about "partially conformant", but several listed features are false.
- **Up-to-date issues:**
  - It references WCAG 2.1 (`:192,386`). WCAG 2.2 (Oct 2023) is current.
  - `4.1.1 Parsing` (`:126`) is obsolete in 2.2.
  - `LAST_REVIEWED` is July 23, 2026 (`:30`).
- **SEO issues:**
  - Uses `<SEO>` directly with its own description (`:169-172`). `PAGE_METADATA.accessibility` ("Accessibility Settings", `seo.ts:472`) is unused and contradicts it.
  - It's noindexed (`index-pruning.ts:35`), which is fine, though accessibility statements are usually left indexable.
- **GEO issues:** not applicable.
- **Static + DB:** static. Settings persist to localStorage (`AccessibilityContext.tsx:63-110`).
- **Uniqueness / content gaps:** claims that don't match the code:
  - "/ Focus search" (`:369-374`) isn't implemented.
  - "Arrow keys for menu navigation" and "44x44px minimum touch targets" haven't been verified.
  - "No time-limited interactions" is fine only while session-expiry is disabled.
  - The assistive-technology list shows green check icons (`:452-455`), which reads as "tested" when the text says "being tested".
  - Several criteria are marked "pass" that this review contradicts: `2.4.2 Page Titled` and `4.1.2 Name, Role, Value` (search combobox) are broken.
- **Bugs:**
  - The "Text Size" `<label>` (`:260`) isn't associated with any control. Use the radiogroup's `aria-labelledby` instead.
  - Radio buttons lack arrow-key roving focus (`role="radio"` on `<button>`, `:265-279`).
- **Recommended fixes:**
  - **P1** Remove or implement "/" search focus. Change AT icons to neutral bullets. Re-mark 2.4.2 and 4.1.2 as partial. Update to WCAG 2.2 and add a "known issues" list.
  - **P2** Fix the label association and roving tabindex. Delete the unused `PAGE_METADATA.accessibility` or use it via `PageSEO`.

---

## Cross-cutting (found while reviewing, outside strict scope)
- **Crawler groups in robots.txt:** `Disallow: /assets/` (`robots.txt:24`) and the query-param disallows apply only to `User-agent: *`. Googlebot and Bingbot use their own groups, so these rules don't apply to them. Other crawlers that fall back to `*` (including AI crawlers without a dedicated group) **are blocked from `/assets/`, which holds all the JS/CSS.** They can't render the SPA at all. Remove `Disallow: /assets/`.
- **Stale robots and canonical on SPA navigation:** any route without `<SEO>` inherits the previous page's robots and canonical tags, because `SEO.tsx:282-285` resets only the title on unmount. Fix it centrally: reset robots and canonical on unmount, or set defaults in `Layout` on each route change.
