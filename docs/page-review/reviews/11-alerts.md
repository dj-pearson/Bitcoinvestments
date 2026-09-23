# Review 11: Alerts and automation pages

Scope: `/rebalancing-alerts`, `/dca-automation`, `/alert-bundles`, `/influencer-verification`, and the price-alert pipeline (`PriceAlerts.tsx`, `functions/api/check-price-alerts.ts`, `workers/price-alerts-cron.ts`).

## Summary: what happens in STATIC_MODE

None of the four routes goes through `staticGuard`. They all render publicly (`src/App.tsx:223,239-241`), they are all indexable (none is listed in `src/lib/index-pruning.ts`), and they are all in `public/sitemap.xml:167,174,181,200`. In STATIC_MODE, `useAuth()` returns a static value with no user and no profile, so every page shows its free or anonymous state. That state is built from data hard-coded in the services, and much of it is presented as if it were real. Every paid CTA leads to `/pricing`. The Pricing buttons then go to `/login` (`Pricing.tsx:35,65,91`), and `/login` is static-guarded (`App.tsx:185`), so it shows ComingSoon. The funnel is a dead end.

No Supabase tables exist for rebalancing configs, DCA schedules or alert bundles. The only migration hits are the `verified_influencers` and `influencer_*` tables in `supabase/migrations/202512220000000_create_advanced_monetization_features.sql:15-166`, plus `price_alerts` in `20251223161809_remote_schema.sql:120` with RLS in `20260128000000_comprehensive_rls_security.sql:250+`. The services `portfolioRebalancing.ts`, `dcaAutomation.ts` and `smartAlertBundles.ts` contain no DB calls at all. They are purely in-memory mocks.

| Route | Works static? | Fabricated data shown | Recommendation |
|---|---|---|---|
| /rebalancing-alerts | Renders, but only shows a fixed demo portfolio. All buttons are dead. | Mock holdings at 2024 prices (BTC $43k), unlabeled | **Fix**: rebuild as a client-side rebalancing calculator. Noindex until then. |
| /dca-automation | Renders. Calculator works, but it assumes a 50%/yr return. | 50% return assumption; product claims (0.5% or 1% trade fee, exchange execution) | **Fix**: turn it into a DCA planner and education page, or merge into /calculators. Remove the automation upsell. |
| /alert-bundles | Renders fully fake product | Subscriber counts, success rates, random "alerts sent", fake "notable alerts" | **Noindex now** (remove from sitemap and header). Later rebuild as a localStorage price-alert page. |
| /influencer-verification | Renders fake "verified" influencers | Win rates, returns and trust scores tied to real-looking Twitter handles | **Noindex and unlink now, or remove** (legal/YMYL risk) |
| Price-alert pipeline | Unreachable (PriceAlerts is only on /profile, which is guarded). Cron still deploys every 5 min. | n/a | **Fix bugs** before re-enabling; pause cron while static |

---

### /rebalancing-alerts — src/pages/RebalancingAlerts.tsx (+ src/services/portfolioRebalancing.ts)
- **Purpose / target query:** "crypto portfolio rebalancing", "rebalancing calculator", "portfolio drift alerts".
- **Verdict:** Poor. The page shows one fixed demo portfolio as if it were the user's own and has no inputs. Every interactive control is a no-op.
- **Up-to-date issues:**
  - `portfolioRebalancing.ts:28-34`: mock holdings use 2024-era prices (BTC $43,000, ETH $2,400, SOL $100). These feed every number on the page.
  - `portfolioRebalancing.ts:279`: the "Aggressive" template includes AVAX and LINK with no rationale or date. Fine as an example, but it needs an "example, not advice" label.
- **SEO issues:**
  - The title renders as "Portfolio Rebalancing Alerts - Maintain Target Allocation | Bitcoinvestments" (76 chars) (`src/lib/seo.ts:337`, suffix at `SEO.tsx:109`).
  - The description promises "Automatic rebalancing recommendations" and alerts (`seo.ts:339`), which the page cannot deliver.
  - There is no tool, WebApplication, FAQ or HowTo schema. `PageSEO` is called without `isTool` (`RebalancingAlerts.tsx:107`).
  - It is indexed and in the sitemap (`sitemap.xml:174`), and linked from the STATIC_MODE header nav (`Header.tsx:88`).
- **GEO issues:** There is no explanatory text: no definition of drift or rebalancing, no calendar-vs-threshold explanation, no tax note, no FAQ and no last-updated date. The only prose is one sentence (`:122-125`) claiming "AI-powered alerts", which do not exist.
- **Static + DB:**
  - The page renders without the DB. `loadData` always builds a hard-coded `mockConfig` (`:66-86`) and runs it against `mockHoldings`.
  - Alerts only load when `user?.id` is set (`:60`), so in static mode the sidebar says "No alerts yet".
  - If auth were on, `getRebalanceAlerts` would return three fabricated alerts (`portfolioRebalancing.ts:193-233`). One says "BTC is overweight by 5.2%", which contradicts the page's own numbers (BTC is underweight).
  - `createRebalanceConfig` (`:39-82`) persists nothing. No tables exist, so there is nothing to light up later.
- **Uniqueness / content gaps:** The page has no tool value today. A strong version would be a client-side rebalancing calculator: the user enters holdings (symbol, amount, price, with an optional live-price prefill via CoinGecko), picks a template or custom targets, sets a band (e.g. ±5%) and a min trade size, and gets buy/sell amounts. Useful additions: a "sell-only / buy-only (new cash)" mode, fee estimates, and an explainer on calendar vs threshold rebalancing, taxable events (selling crypto is a disposal in most jurisdictions) and wash-sale status. The owner should confirm the jurisdiction wording.
- **Bugs:**
  - Holdings with no target are silently ignored in the drift maths. `analyzeDrift` maps only over `targetAllocations` (`portfolioRebalancing.ts:93`), so the $3,000 LINK position (6.7% of the portfolio) is excluded. The displayed allocations then sum to 93.3%, and the "4.4% total drift" understates the real drift. Untargeted holdings should appear as target 0% and be flagged as a sell.
  - With the demo data every row is "hold", "Rebalance Needed: No", 0 trades and $0 tax. The page's main showcase shows nothing, and the `rationale` is only rendered when trades exist (`RebalancingAlerts.tsx:237,261`).
  - The "Configure" button (`:170`) and all template buttons (`:316-318`) call `setShowSetupModal(true)`, but that state is unused (`_showSetupModal`, `:43`). No modal exists. "Run AI Analysis" (`:345`) has no handler.
  - The tax estimate is 15% of the *sale amount* (`portfolioRebalancing.ts:152`), not of the gains, and it has no jurisdiction. That is misleading.
  - Drift colouring: overweight is red and underweight is green (`:222`). Direction should not be coloured as good or bad.
  - `alert.alert_type.replace('_', ' ')` only replaces the first underscore (`:294`). This is minor.
  - A full-screen spinner runs on every load (`:97-103`), although no async work is needed when the user is logged out.
- **Recommended fixes:**
  - P0: Add `/rebalancing-alerts` to `NOINDEX_PATHS` in `src/lib/index-pruning.ts`, remove it from `public/sitemap.xml:173-178` and from the STATIC_MODE header list (`Header.tsx:88`) until the rebuild ships.
  - P0: Rewrite `RebalancingAlerts.tsx` as a "Crypto Rebalancing Calculator":
    - Editable holdings table and target table in component state, plus `localStorage` for per-browser saving.
    - Reuse `analyzeDrift` after fixing it to include untargeted holdings as target 0%.
    - Remove `mockHoldings` defaults from `generateRebalanceRecommendation`/`checkRebalancingNeeded` (`portfolioRebalancing.ts:132,290`).
    - Wire the templates to prefill targets.
    - Delete the AI Optimization card and the $9.99 upsell (`:335-387`).
  - P0: Remove the tax-impact tile, or replace it with a "Selling may create a taxable gain; see /tax-guide" note (check that the route exists). NEEDS-OWNER for jurisdiction wording.
  - P1: Add an honest note: "Automatic drift alerts by email need an account — coming soon." Link it to the newsletter signup rather than /pricing.
  - P1: Add a BLUF intro, an explainer of the two rebalancing methods, a worked example, and a 4-6 item FAQ. Pass `isTool`/`toolName`/`faqs` to `PageSEO`. Retitle to e.g. "Crypto Rebalancing Calculator" (<45 chars before the suffix) and add a visible "Last updated" date. Prerender the intro and FAQ.
  - P2 (DB later): Add `rebalance_configs`/`rebalance_alerts` tables and a cron that evaluates saved configs against prices. The existing `check-price-alerts` pattern could be extended. Keep this behind `!STATIC_MODE && isSupabaseConfigured()`.

### /dca-automation — src/pages/DCAAutomation.tsx (+ src/services/dcaAutomation.ts)
- **Purpose / target query:** "DCA crypto", "automate bitcoin DCA", "recurring bitcoin buy".
- **Verdict:** Poor. It sells a trade-execution service that does not exist, and its only working tool projects returns at 50% a year.
- **Up-to-date issues:**
  - `dcaAutomation.ts:194`: "current price" is hard-coded at BTC 43000 / ETH 2400.
  - `dcaAutomation.ts:35-37,74-77`: mock schedule and execution prices are at 2024 levels.
- **SEO issues:**
  - The title renders at 66 chars (`seo.ts:324`). The description promises "Schedule recurring purchases… automatically", which is false.
  - No tool or FAQ schema. The page is indexed and in the sitemap at priority 0.7 (`sitemap.xml:167-171`).
  - It competes with the real DCA calculator at `/calculators` (default type `dca`, `Calculators.tsx:12,47`), which Footer and InternalLinks already point to (`Footer.tsx:34`, `InternalLinks.tsx:220,307`). The result is keyword cannibalisation with a weaker page.
- **GEO issues:** No definition of DCA, no evidence, no FAQ, no last-updated date. The "*Based on 50% annual return assumption" footnote (`:214-216`) is the only disclosure, and it is the kind of figure an LLM might quote as a site claim.
- **Static + DB:**
  - In static mode the tier is `free` (`:51-55`). The "Active DCA Schedules" block is hidden (`:253`) and the calculator, plans and upsell render.
  - With auth, `getUserDCASchedules` returns fabricated schedules for *any* user (`dcaAutomation.ts:157`, `|| s.user_id === 'user-1'`), claiming 52 executions on "coinbase" and "binance". Pause and resume only mutate the in-memory array (`:238-266`).
  - There are no DB tables, no exchange-credential storage and no execution worker. The "0.5% / 1% fee per trade" product (`DCAAutomation.tsx:237-238`, `subscriptionLimits.ts:1513-1560`) would make the site a custodial or brokerage-like executor, which raises regulatory questions. NEEDS-OWNER.
- **Uniqueness / content gaps:** The useful baseline is a DCA planner plus an explainer:
  - "How much will I have invested", with purchase count and schedule calendar.
  - User-selectable return scenarios (-50% / 0% / +20%, labelled hypothetical).
  - A link to the historical backtest at /calculators.
  - A section on how to set up recurring buys on exchanges that offer them natively. NEEDS-OWNER to verify the current exchange list and fees.
  - A fee-drag table showing how a 1.5% spread on $25 buys compares with $100 buys.
  - An `.ics` reminder download for manual DCA.
- **Bugs:**
  - `calculateDCAProjection(..., 50)` is hard-coded (`DCAAutomation.tsx:82`). A 5-year horizon at 50%/yr shows enormous, unhedged "Projected Return" figures in green. This is a YMYL problem.
  - Clearing the amount input gives `Number('')=0`, so `totalInvested=0` and the return shows "+NaN%" (`dcaAutomation.ts:318`, `DCAAutomation.tsx:210`). Negative amounts are accepted too. `min="10"` is not enforced.
  - The `calcFrequency` state type is `'weekly'|'monthly'` (`:47`), but the select offers daily and biweekly (`:161-164`), hidden by a cast. `executionsPerMonth` daily=30 is an approximation.
  - Labels have no `htmlFor`/`id` (`:140-182`), so they are not associated with their inputs (a11y).
  - The "New Schedule" button has no handler (`:259`). `_performance` is fetched but never rendered (`:45,71`).
  - "Free" tier copy says "Use the calculator above" (`:236`), but the calculator is in the left column, not above.
- **Recommended fixes:**
  - P0: Remove the 50% assumption. Default to 0% and add a user-editable "hypothetical annual return" input with presets, a plain "not a forecast" disclaimer and neutral colour styling.
  - P0: Remove the tier badge, the tier card and the "Upgrade to DCA Premium / Start Automating" upsell (`:116-122,224-250,394-422`), and the `getUserDCASchedules` path. Replace them with: "We don't execute trades. Here's how to automate DCA on your exchange." NEEDS-OWNER for which exchanges to list.
  - P1: Decide between merge and differentiate:
    - (a) 301 or canonical `/dca-automation` to `/calculators?type=dca` and drop it from the sitemap, or
    - (b) keep it as "DCA Planner & Recurring-Buy Guide" with unique content (planner, schedule calendar, exchange setup steps, fee-drag table, FAQ, HowTo schema) and cross-link both ways.
    - Either way, fix the title to <60 chars rendered, and add `isTool` + `faqs` + a visible last-updated date. Prerender the guide text.
  - P1: Fix the NaN bug by clamping the amount to at least 1 and guarding `totalInvested>0`. Add `htmlFor`/`id` to the labels.
  - P2: Offer optional `localStorage` "My DCA plan" saving plus an `.ics` export for reminders. Show the note "Email reminders need an account — coming soon".
  - P2 (DB later): Only a reminder product (a `dca_reminders` table plus the existing Resend cron pattern) is realistic. Drop automated execution unless the owner has a licensed exchange partner (NEEDS-OWNER).

### /alert-bundles — src/pages/SmartAlertBundles.tsx (+ src/services/smartAlertBundles.ts)
- **Purpose / target query:** "crypto alerts", "whale alerts", "crypto price alert app".
- **Verdict:** Poor. The whole page is a fabricated paid product with made-up social proof and track records. It is a trust and YMYL liability.
- **Up-to-date issues:** The "Notable Alerts" use hard-coded 2024-level prices (BTC $42,500 to $44,200, ETH $2,280, SOL $98), dated "5/12/18 days ago" relative to today (`smartAlertBundles.ts:250-275`). That presents stale numbers as recent history.
- **SEO issues:**
  - The title renders at 68 chars (`seo.ts:350`). The description says "Create custom alert bundles…", but nothing can be created.
  - The page is indexed and in the sitemap (`sitemap.xml:181`), linked from the STATIC_MODE header (`Header.tsx:89`), and from `EmptyState.tsx:281` ("Set up alerts").
- **GEO issues:** Any quotable facts on this page would be false: "4,123 subscribers", "72.5% success rate". It has no methodology, no sources and no dates.
- **Static + DB:**
  - The page renders with the DB off. `getAlertBundles` returns the in-file array (`:129`).
  - Fabricated: `subscriber_count` (2547/4123/1832/3456/2198) and `success_rate` (72.5/68.3/65.8/61.2) at `:34-35,55-56,75,95-96,116-117`.
  - `alerts_sent` is `Math.random()*50+10` and `avg_response_time_hours` is `2.5+Math.random()*4` (`:239,249`). The numbers change every time a bundle is clicked.
  - The same three "notable alerts" (Golden Cross, RSI, Volume Breakout) are shown for every bundle, including Crash Protection and DeFi (`:250-275`). DeFi has `success_rate: null`, yet the page shows 60% accuracy through the `|| 60` fallback (`:240`).
  - Channels include `sms` (`:49`), but no SMS provider exists in `functions/` or `src/services`.
  - No DB tables and no evaluation engine exist for any of the conditions (MA crosses, exchange inflows, whale transfers, APY, and so on). Nothing can light up.
- **Uniqueness / content gaps:** The honest static baseline is a "Crypto Price Alerts" page:
  - Browser-local alerts (symbol, above/below, price) stored in `localStorage`, checked while the tab is open against the existing CoinGecko price service, with Notification API permission (the `src/services/pushNotifications.ts:79` pattern exists).
  - A clear note: "Alerts only fire while this tab is open. Email alerts need an account — coming soon."
  - Educational content: what golden and death crosses, RSI and whale alerts mean, why most "signal" services overfit, and how to set alerts on an exchange app.
- **Bugs:**
  - `handleSelectBundle` has no try/catch or loading state (`:83-87`).
  - `BUNDLE_ICONS: Record<string, any>` (`:39`) is a type-safety issue only.
  - The "Subscribe $X/mo" link goes to /pricing, which does not list bundles. The Pricing flow ends at the static-guarded /login.
- **Recommended fixes:**
  - P0: Add `/alert-bundles` to `NOINDEX_PATHS` (`src/lib/index-pruning.ts`). Remove it from `sitemap.xml:180-185`, from the STATIC_MODE header (`Header.tsx:89`) and from `EmptyState.tsx:281`.
  - P0: Delete the fabricated metrics from `smartAlertBundles.ts` (`subscriber_count`, `success_rate`, and the entire `getBundlePerformance` random and notable data), or stop rendering them (`SmartAlertBundles.tsx:241-275,317-382`). Never show a performance number that is not computed from logged alerts.
  - P1: Replace the page with a "Price Alerts" tool as described above (new `src/hooks/useLocalPriceAlerts.ts`, reusing the `PriceAlerts.tsx` form UI). Use the correct CoinGecko IDs (see the pipeline bug below). Then re-index it with a WebApplication schema and an FAQ.
  - P2 (DB later): When `!STATIC_MODE && isSupabaseConfigured()`, offer a "Sync to account and get email alerts" option that writes to the existing `price_alerts` table, served by the existing cron. Bundles should only return if a real signal engine and accuracy log exist. NEEDS-OWNER for the product decision.

### /influencer-verification — src/pages/InfluencerVerification.tsx (+ src/services/influencerVerification.ts)
- **Purpose / target query:** "verified crypto influencers", "crypto influencer track record".
- **Verdict:** Poor. It publishes fabricated "verified" performance scores under real-looking Twitter handles. This is the highest-risk page in scope.
- **Up-to-date issues:**
  - Demo trade claims use 2024-era prices (BTC $42,000 to $48,000, `influencerVerification.ts:698-703`).
  - The claim source is `https://twitter.com/example/status/123` (`:705`).
  - The comment "Trading crypto since 2017" is fine.
- **SEO issues:**
  - The title renders at 68 chars (`seo.ts:389`). The description claims "Follow verified experts with proven track records". That is false.
  - The page is indexed and in the sitemap (`sitemap.xml:200`, changefreq weekly). No schema beyond WebPage.
  - The page is hard-coded dark (`bg-gray-900 text-white`, `:40`) and ignores the site theme.
- **GEO issues:** An LLM could quote "CryptoKing: claimed 78% win rate, verified 62%" as a real finding. The page has no methodology, no disclosure that the data is demo data, no author and no date.
- **Static + DB:**
  - The list is always `DEMO_INFLUENCERS` (`InfluencerVerification.tsx:13`). `@cryptoking`, `@defidegen` and `@altcoinalice` (`influencerVerification.ts:640,658,676`) are rendered with "@" as if they were real accounts (`:161-163`). If those handles belong to real people, the page attributes invented, unflattering "verified" results to them. That is a defamation and impersonation risk.
  - `DEMO_TRADE_CLAIMS` are shown for every influencer (`:238`).
  - `hasTransparencyAccess` runs a live `db` query (`influencerVerification.ts:466`), but only when a user exists, so it never runs in static mode. In live mode it runs without an `isSupabaseConfigured()` guard.
  - The migration tables exist (`202512220000000_create_advanced_monetization_features.sql:15-166`), yet `getVerifiedInfluencers`/`getInfluencerBySlug` still return demo data with the real queries commented out ("TODO: Enable once migration is run", `:35-90,97-110`). The page doesn't call those functions anyway. It imports the `DEMO_*` constants directly.
- **Uniqueness / content gaps:** No real verification process, wallet-linking or claim-verification pipeline exists. A defensible static alternative is an editorial guide: "How to check a crypto influencer's track record". It could cover on-chain wallet checks, paid-promotion disclosure rules, pump-and-dump red flags and a checklist, and link to the scam pages. That overlaps with other review scopes, so consider folding it into existing scam or education content instead.
- **Bugs:**
  - Tabs set `activeTab`, but it never filters or sorts (`:16,69-100`).
  - The "Subscribe Now", "Apply for Verification" and "Unlock for $2.99/month" buttons have no handlers (`:61,180,269`).
  - Cards are clickable `div`s with no role, tabIndex or keyboard handler (`:105-108`). The modal has no `role="dialog"`, focus trap or Escape handling (`:186-277`). The close button is "×" with no aria-label (`:201-206`).
  - `hover:bg-gray-750` (`:108`) is not a default Tailwind colour, so it does nothing unless it is configured.
  - `getAccuracyColor(0)` treats 0 as null (`:33`). This is minor.
- **Recommended fixes:**
  - P0: Add `/influencer-verification` to `NOINDEX_PATHS` and remove it from `sitemap.xml:199-204` immediately. Better still, wrap the route in `staticGuard` (`App.tsx:223`) so the fake data is not publicly served at all.
  - P0: Remove the realistic handles and the fabricated scores. If a demo is ever needed, use unmistakably fictional names, a "DEMO — illustrative data" banner, and no "@" handles.
  - P1: Replace it with an editorial "How to verify a crypto influencer" guide (Article + FAQ + HowTo schema, author, last-updated date), or delete the route and 301 it to the most relevant scam-education page. NEEDS-OWNER: whether the $2.99 transparency and $49 influencer products are still planned.
  - P2 (DB later): If the owner keeps the product, uncomment the real queries in `influencerVerification.ts`, guard them with `isSupabaseConfigured()`, render from `getVerifiedInfluencers` with loading, empty and error states, and show "No verified influencers yet" when the table is empty. It also needs a documented verification methodology page. NEEDS-OWNER/legal review.

### Price-alert pipeline — src/components/PriceAlerts.tsx, functions/api/check-price-alerts.ts, workers/price-alerts-cron.ts, wrangler-cron.toml
- **Purpose:** Logged-in users create above/below price alerts. A Cloudflare cron calls the Pages Function every 5 minutes, which emails via Resend and deactivates the alert.
- **Verdict:** Needs work. The DB wiring is real and guarded, but a data-ID bug means no alert would ever trigger, and the cron is deployed while the site is static.
- **Static + DB:**
  - `PriceAlerts` is only mounted in `Profile.tsx:555`, and `/profile` is static-guarded (`App.tsx:189`), so the UI is unreachable in STATIC_MODE.
  - With the DB, `database.ts:319-379` guards correctly with `isSupabaseConfigured()`. The `price_alerts` table and RLS exist.
  - The signed-out state links to `/login` with a plain `<a href>` (`PriceAlerts.tsx:133`). That causes a full reload and lands on ComingSoon in static mode.
- **Bugs:**
  - **ID mismatch, so alerts never fire.** `PriceAlerts.tsx:81` stores `cryptocurrency_id: symbol.toLowerCase()` ("btc", "eth", "sol", "xrp", "ada", "doge"). `check-price-alerts.ts:70,206` then queries CoinGecko `simple/price?ids=btc,...`, but CoinGecko needs IDs such as `bitcoin`, `ethereum`, `solana`, `ripple`, `cardano` and `dogecoin`. `prices[alert.cryptocurrency_id]` is therefore undefined, and every alert is skipped (`:80-84`).
  - **Cron URL is probably unset.** `PAGES_URL` is only defined under `[env.production]`/`[env.staging]` (`wrangler-cron.toml:19-23`). The deploy step runs `wrangler deploy --config wrangler-cron.toml` with no `--env` (`.github/workflows/deploy.yml:66-71`). Unless `PAGES_URL` is set as a dashboard var or secret, the worker fetches `undefined/api/check-price-alerts` every 5 minutes. Verify this in the Cloudflare dashboard.
  - The worker's `fetch` handler compares the bearer token with `!==` (`price-alerts-cron.ts:48`). The Pages Function side uses a constant-time compare (`_scheduledAuth.ts`), so the worker is inconsistent with it. Minor.
  - Scaling: there is one `auth/v1/admin/users/{id}` request per alert on every run (`check-price-alerts.ts:175-194`), and CoinGecko is called with no API key or batching limit. Join emails through a `users` view or RPC and dedupe by user.
  - If a user has no email or Resend fails, the alert stays active and is re-evaluated (and re-emailed) every 5 minutes with no backoff (`:104-122`).
  - The email template links to `/dashboard` and `/profile` (`:279,301`). `/profile` is ComingSoon in static mode. That is fine only while no alerts exist.
- **Recommended fixes:**
  - P0: Store a real CoinGecko ID. Map it in `PriceAlerts.tsx` (e.g. `{BTC:'bitcoin',ETH:'ethereum',SOL:'solana',XRP:'ripple',ADA:'cardano',DOGE:'dogecoin'}`), or reuse an existing symbol-to-ID map from `src/services/coingecko`. Backfill existing rows with a migration.
  - P0: While `STATIC_MODE = true`, stop deploying or disable the cron: remove `[triggers]` or gate the workflow step. When re-enabled, pass `--env production` in `deploy.yml` or move `PAGES_URL` to the top-level `[vars]`.
  - P1: Add per-alert failure tracking (`last_error`, `attempts`) or deactivate after N failures, and batch the email lookup.
  - P2: Reuse this pipeline as the "sync" backend for the localStorage alerts page proposed under /alert-bundles, so a single alert product exists.

---

## Cross-cutting recommendations
1. **P0 (one PR):** Add `/alert-bundles`, `/influencer-verification`, `/rebalancing-alerts` and `/dca-automation` to `NOINDEX_PATHS` in `src/lib/index-pruning.ts`, and delete their four `<url>` blocks from `public/sitemap.xml`. Take `/alert-bundles` and `/rebalancing-alerts` out of the STATIC_MODE Tools menu (`Header.tsx:84-90`) until they are rebuilt. Re-add each page only after its rebuild ships.
2. **P0:** Purge fabricated metrics and track records (`smartAlertBundles.ts`, `influencerVerification.ts` DEMO data, `dcaAutomation.ts` mock schedules, `portfolioRebalancing.ts` mock alerts). Mock data may stay only behind `import.meta.env.DEV`.
3. **P1:** Every paid CTA in these pages goes to `/pricing`, and from there to ComingSoon at `/login`. In STATIC_MODE, replace them with a newsletter "notify me" CTA and a short "needs an account — coming soon" note.
4. **P1:** Titles on all four pages exceed 60 chars once "| Bitcoinvestments" is appended (76/66/68/68). Keep the base title at 40 chars or less.
5. **P2:** Only one DB-backed feature in scope is real: `price_alerts`. Rebalancing, DCA and bundles have no schema. Any "light up later" plan should start from `price_alerts` plus the cron, and add `rebalance_configs` and `dca_reminders` tables using the same Resend pattern.
