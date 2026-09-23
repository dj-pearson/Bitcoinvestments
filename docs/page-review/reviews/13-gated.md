# Review 13: gated routes, auth/admin, and the plan to turn the database back on

Scope: the routes wrapped in `staticGuard`/`ProtectedRoute` in `src/App.tsx:185-220`, the `/admin` tree (`src/App.tsx:155-173`), `src/config/staticMode.ts`, `src/contexts/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`, `src/components/AdminRoute.tsx`, `rebuild/REBUILD_GUIDE.md`, and `supabase/migrations/*`. I reviewed the code only. I did not connect to Supabase or run any SQL. No Postgres server is available here, so I checked migration replay by reading the SQL.

---

## Summary

**Turning `STATIC_MODE` off today is not safe.** The flag itself is fine. The problem is the database behind it, which is in a state where signup, billing and several dashboards would break. The main blockers:

1. **New accounts would get no profile row (P0).** Nothing in the migrations creates a `public.users` row when someone signs up. `20251223161809_remote_schema.sql:21,667` drops `handle_new_user()` and the `on_auth_user_created` trigger. The app then inserts the profile row from the browser (`src/services/auth.ts:185`). That insert fails for two reasons:
   - `20260911000000_fix_users_rls_admin_row_exposure.sql:124-133` runs `REVOKE ALL ... FROM anon` and `GRANT SELECT, UPDATE` only to `authenticated`. The only INSERT policy left is `admins_insert_users`.
   - Signup requires email confirmation (`Signup.tsx:63,87`), so there is no session when the insert runs.

   The result is no profile row, so `role`, subscription gates, 2FA and preferences all read `null`. The comment at `20260911000000…:124` ("the signup trigger runs as SECURITY DEFINER") describes a trigger that the migrations no longer have. **Applying the three 2026-09-11 security migrations to the live DB without first adding a trigger will break signup there too.**
2. **The migrations cannot be replayed from scratch in either order:**
   - **Following REBUILD_GUIDE** (`schema.sql` first, then migrations): `remote_schema.sql:3-15` runs `create type "public"."ad_status"…` with no `IF NOT EXISTS`, and those types already exist from `schema.sql:9-15`. The run stops there.
   - **Using the CLI** (`supabase db reset`, migrations only): `remote_schema.sql:21` runs `drop function if exists handle_new_user()` while trigger `on_auth_user_created` still depends on it. That trigger is created at `20241218_create_users_table.sql:64` and only dropped at `remote_schema.sql:667`, so this fails with "other objects depend on it".
   - **Further on:** `20260128000000_comprehensive_rls_security.sql:552` runs `ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY`, but `platform_reviews` is never created anywhere. The `optimize_database_indexes` migration guards against its absence; this one does not.
3. **Columns the code depends on are missing from the migrations.** `users.stripe_customer_id`, `stripe_subscription_id`, `subscription_tier`, `username` and `two_factor_enabled/secret/recovery_codes/enabled_at` appear in `src/types/database.ts:30-45` and are used by:
   - the Stripe webhook (`functions/api/stripe-webhook.ts:264-266,301-303,407,411`)
   - admin analytics (`src/services/subscriptionAnalytics.ts:78,224`)
   - 2FA (`src/services/auth.ts:265,357`)
   - the privilege guard (`20260911010000…:38-51`)

   No migration or `schema.sql` adds them. Only `wallet_address` is added (`20260119_add_wallet_auth.sql:7`).
4. **The `subscription_status` enum is too narrow.** It is `('free','premium')` (`remote_schema.sql:13`, `schema.sql:9`). The webhook writes `'advisor'`, `'enterprise'`, `'api'` and `'lifetime'` (`stripe-webhook.ts:60-77,300`), and the gates compare against those values (`subscriptionLimits.ts:325-352,1208`). No `ALTER TYPE … ADD VALUE` exists. Paid Advisor, Enterprise and Lifetime purchases would fail to record, and `/advisor` is unreachable.
5. **Tables used by the code are never created:** `influencer_referrals`, `moderation_queue`, `notification_preferences`, `push_subscriptions` and `platform_reviews`.
6. **Several gated pages show fabricated or hard-coded data, or pretend to save:**
   - `PortfolioAnalysis` always analyses a hard-coded demo portfolio (`PortfolioAnalysis.tsx:31-62`) and never says so.
   - `SystemSettings` fakes both load and save (`admin/SystemSettings.tsx:47-76`).
   - The influencer application is only logged with `console.log` (`InfluencerDashboard.tsx:89-91`).
   - `AdminAISettings` saves a model config that `/api/claude` never reads (`functions/api/claude.ts:41-56`).

**Recommended path:**
- **(a)** Find out whether the old project `mkdckqrukmukbmgxabyk` (`wrangler.toml:11`, `supabase/.temp/pooler-url`) still exists. NEEDS-OWNER. If it does, reconnecting to it is far cheaper than a rebuild.
- **(b)** Write one idempotent "reconcile" migration covering items 1, 3, 4 and 5.
- **(c)** Replace the single flag with an env-driven flag plus a runtime capability check (details below).
- **(d)** Fix noindex on every gated route. **Right now most gated routes, and every ComingSoon screen, send no `noindex` at all.**

---

## (1) Readiness to flip `STATIC_MODE=false`

### What the flag actually controls
`STATIC_MODE` is referenced in only 4 files:
- `src/config/staticMode.ts:15`
- `src/App.tsx:47-49,151-152,155`
- `src/contexts/AuthContext.tsx:268-275`
- `src/components/Layout/Header.tsx:84,149,299,560`

It does **not** switch off database reads on public pages: 22 files call `isSupabaseConfigured()` on their own. REBUILD_GUIDE's claim that the flag "re-enables … Database-dependent features" (`rebuild/REBUILD_GUIDE.md:113-120`) is wrong. It only re-enables auth, the gated routes, the admin panel and the session UI.

### Schema vs code: tables
Comparing every `.from('x')` in `src/` and `functions/` against every `CREATE TABLE` in `supabase/`:

| Table used by code | Created in migrations? | Used by (in scope) |
|---|---|---|
| `influencer_referrals` | No | `services/influencerAffiliate.ts:249` (commented-out insert) → `/affiliate` |
| `moderation_queue` | No | `services/contentModeration.ts` → `/admin/content` |
| `platform_reviews` | No (only ALTERed at `20260128…:552` → migration error) | `services/reviews.ts` |
| `notification_preferences`, `push_subscriptions` | No | `services/pushNotifications.ts` → Profile "alerts" tab |

`src/types/database.ts` types only 29 tables. About 90 tables in use are untyped and reached through the `db` any-client (`src/lib/supabase.ts:35`), so `tsc` will not catch drift. Running `supabase gen types typescript` against the real DB should replace the hand-written file.

### Schema vs code: `users` columns (the most important table)
- **Final migrated shape:** `id, email, role, is_suspended, suspended_at, suspended_reason, last_login_at, created_at, updated_at, preferences, referral_code, referred_by, subscription_status(enum free|premium), subscription_expires_at, wallet_address, search_vector`.
- **Dropped by `remote_schema.sql:173-175`:** `full_name` and `avatar_url`. Yet they sit on the editable allowlist at `20260911010000…:40-41`, which is harmless.
- **Missing but used:** `stripe_customer_id`, `stripe_subscription_id`, `subscription_tier`, `two_factor_*`, `username`. With these missing:
  - the Stripe webhook update fails (PostgREST 42703), so paid users are never upgraded;
  - `AdminOverview` and `AdminAnalytics` return an error (`subscriptionAnalytics.ts:78,224`);
  - 2FA setup in Profile fails.

### Column spot-checks that do line up
- `api_keys` vs `services/apiAccess.ts:433-442`
- `sponsors`/`sponsored_campaigns` vs `services/sponsoredContent.ts:373-430`
- `advertisements` vs `AdManager.tsx`
- `articles`/`blog_*` vs `services/blog.ts`
- `support_tickets`/`ticket_messages`
- `user_sessions`
- `tax_report_purchases` and its RPCs
- `admin_audit_logs`/`admin_settings`
- RPCs `get_user_stats`, `get_scam_stats`, `get_api_usage_stats`, `get_campaign_analytics`, `increment_ad_*`, `has_tax_report_purchase`: all defined.

### RLS mismatches that affect gated pages
- **`/affiliate-stats` and `/ad-manager` are owner/admin tools but sit behind `ProtectedRoute`, which only requires a login** (`App.tsx:190-191`).
  - Under RLS, a normal user of `/affiliate-stats` sees every anonymous click row, including `session_id` (`20260128…:676-678`, `user_id IS NULL`). That leaks cross-user data.
  - On `/ad-manager` a normal user sees active ads, and every write fails silently (`AdManager.tsx:79-99` ignores `error`).
- **Newsletter:** `subscribeToNewsletter` does an anonymous `SELECT` first (`services/database.ts:414-418`), but only admins may SELECT (`20260128…:723-725`). The "already subscribed / reactivate" branch never runs. A repeat email hits the unique index (`remote_schema.sql:247,295`), and the raw Postgres "duplicate key value…" message is shown to the user (`Newsletter.tsx:26-27`).

### REBUILD_GUIDE.md problems
- It lists `supabase/schema.sql` first (`:47`). That guarantees the `create type` failure in `remote_schema.sql`.
- It omits the three `20260911*` security migrations (the list ends at `:84`).
- It lists `/dca-automation`, `/rebalancing-alerts` and `/alert-bundles` as protected (`:245-247`). In `App.tsx:238-241` they are public and unguarded.
- It names `RESEND_API_KEY` (`:96`). `functions/api/send-email.ts` sends via MailChannels, and `wrangler.toml` documents Amazon SES secrets. MailChannels ended its free Cloudflare-Workers sending in 2024. Unless an account/API key is configured, welcome and ticket emails will fail; they are fire-and-forget (`services/database.ts:440-444,464-468`), so they fail silently.
- **Security:** `/api/send-email` takes any `to` and `html` and has no auth check (`functions/api/send-email.ts:33-47`). Once a working provider is attached, it is an open relay on the site's domain. Require a Supabase JWT, or restrict it to server-side callers, before enabling it.
- Table names in its "overview" don't exist: `qa_forum_questions` (the code uses `forum_questions`), `scam_database_votes`, `interactive_courses`, `sponsored_content` (`:162-200`). It will mislead whoever runs the rebuild.

---

## (2) One global flag, or something finer-grained?

**Yes, move to a finer-grained model. But don't let features "light up" only because the database responds.** A database that responds but has the wrong schema is the realistic failure here (see the P0s above). "It answered, so switch on login" would ship broken signup to everyone.

Recommended design:

1. **An env-driven master switch.** Replace the constant with
   `export const ACCOUNTS_ENABLED = import.meta.env.VITE_ACCOUNTS_ENABLED === 'true' && isSupabaseConfigured();`
   The owner can then flip it in the Cloudflare Pages build settings without a code change. Keep `STATIC_MODE` as `!ACCOUNTS_ENABLED` so the 4 call sites keep working.
2. **A runtime capability check, gated on schema version.** Add a migration that creates `public.app_meta(key text primary key, value text)` with a public-read policy, seeded with `schema_version = '2026-09-reconcile'`.
   - Add `src/hooks/useBackendStatus.ts`. It uses react-query with `staleTime: 5 min` and a 3 s `AbortSignal` timeout, runs `supabase.from('app_meta').select('value').eq('key','schema_version').single()`, and returns `'checking' | 'up' | 'down' | 'outdated'`.
   - Run the check lazily, only when a gated route or the header auth button mounts, so indexable public pages pay nothing.
3. **A `<FeatureGate feature="accounts" fallback={<ComingSoon feature="tax-reports" />}>` component** that replaces `staticGuard` in `App.tsx:47-49`:
   - master switch off → fallback;
   - `checking` → the existing `PageLoader`;
   - `down`/`outdated` → fallback plus a "temporarily unavailable" line;
   - `up` → children.

   For `/admin`, keep the `Navigate` fallback.
4. **Mount `LiveAuthProvider` whenever the master switch is on**, even while the check is pending. Its hooks are unconditional (`AuthContext.tsx:69-261`), and `getCurrentUser()` already degrades when Supabase isn't configured. Session and auth state must not flip mid-session on a health blip. Only the route gates react to health.
5. **Per-feature granularity comes later:**
   - `features` rows in `admin_settings` (table exists: `202512040000000…:42`) for `tax_reports`, `advisor`, `developer_portal` and `advertiser`, read by the same hook. This lets the owner turn on `/profile` and `/login` before the unfinished dashboards (Advisor, Influencer, PortfolioAnalysis) that still use mock data.
   - A useful side effect: a paused free-tier Supabase project returns errors, so the site falls back to ComingSoon automatically instead of showing broken dashboards.

---

## (3) SEO: noindex and the sitemap

**Sitemap:** OK. None of the in-scope routes appear in `public/sitemap.xml`. The only near match is `/developers/pricing` at `:189`, which is public. `node scripts/audit-route-indexing.mjs` reports "67 routes, 60 sitemap URLs … no mismatches".

**`index-pruning.ts`:** OK as a list.
- Every in-scope path is in `NOINDEX_PATHS` (`src/lib/index-pruning.ts:15-37`).
- `/admin` is covered by `NOINDEX_PREFIXES` (`:40-45`).

**But the noindex is not actually emitted on most of these routes.** Two gaps:
1. **`shouldNoindex` only runs inside `<SEO>`** (`src/components/SEO.tsx:118`), and **`ComingSoon` does not render `<SEO>`**; it calls only `usePageTitle` (`src/pages/ComingSoon.tsx:6`). In static mode, all 13 gated URLs therefore serve `index.html`'s `<meta name="robots" content="index, follow…">` (`index.html:65`) and `canonical` = `https://bitcoinvestments.net/` (`index.html:97`). The result is 13 identical "Coming Soon" soft-404s that say "index".
2. **With static mode off, these pages still don't render `<SEO>`:** `ResetPassword`, `Profile`, `AffiliateStats`, `AdManager`, `TaxReports`, `AdvisorDashboard`, `InfluencerDashboard`, `AdvertiserDashboard`, `UserManagement`, `AdminAISettings` and every `src/pages/admin/*`. They also emit no robots tag.
   - The comment at `src/hooks/usePageTitle.ts:16-17` ("every page reached by this hook is already path-noindexed") is false.
   - `SEO`'s effect doesn't restore robots or canonical on unmount (`SEO.tsx:257-261` resets only the title). After client-side navigation these pages inherit the previous page's `index` and canonical.
   - The audit script checks only the lists, so it gives false confidence.
   - Only Login, Signup, ForgotPassword, PortfolioAnalysis and DeveloperPortal render `<SEO>`/`<PageSEO>`.

**`robots.txt` inconsistencies (`public/robots.txt`):**
- `Disallow: /profile`, `/affiliate-stats`, `/ad-manager`, `/tax-reports`: blocking the crawl means Google can never see a noindex. URLs linked from Pricing can still be indexed as bare URLs.
- `Allow: /report-scam` contradicts its noindex.
- `Allow: /developer-portal` is a route that doesn't exist.

**Fixes:**
- **P0: send the directive in the HTTP header.** Add path rules to `public/_headers` so the directive arrives without JS rendering (the SPA serves empty HTML to non-JS crawlers):
  ```
  /login
    X-Robots-Tag: noindex, follow
  ```
  Repeat for `/signup`, `/forgot-password`, `/reset-password`, `/profile`, `/affiliate-stats`, `/ad-manager`, `/tax-reports`, `/advisor`, `/affiliate`, `/portfolio-analysis`, `/advertiser`, `/developers/portal`, `/report-scam` and `/admin/*`. Cloudflare Pages matches `_headers` rules on the request path, so SPA-fallback responses get the header too.
- **P0: set robots globally.** Add a small `RouteRobots` component inside `Layout` and `AdminLayout` that always writes `<meta name="robots">` from `getIndexDirective(location.pathname)` (`index-pruning.ts:95`) on every navigation, whether or not the page renders `<SEO>`. Also render `<SEO title="Coming Soon" description=… noindex />` in `ComingSoon`.
- **P1:** in `robots.txt`, remove `Allow: /report-scam` and `Allow: /developer-portal`. Swap the `Disallow` lines for `/profile`, `/affiliate-stats`, `/ad-manager` and `/tax-reports` to rely on `X-Robots-Tag`. Keep `/admin/` and `/api/` disallowed.
- **P2:** extend `scripts/audit-route-indexing.mjs` to fail if a component on a `NOINDEX_PATHS` route renders neither `<SEO>` nor sits under `RouteRobots`. Fix the `usePageTitle` comment.

---

## (4) The ComingSoon experience

`src/pages/ComingSoon.tsx`:
- **There is no email capture on the page.** It shows a generic "We're building something great" message and 4 links (`:19-60`). The only capture is the footer `Newsletter` in the Layout (`Footer.tsx:65`).
  - `staticMode.ts:6` says "Header shows newsletter signup instead of auth buttons". In fact the header shows **"View Plans" → `/pricing`** (`Header.tsx:299-305`).
  - Pricing's CTAs call `navigate('/login?redirect=/pricing')` (`Pricing.tsx:35,65,91`), which lands back on ComingSoon. That is a dead-end conversion funnel.
- **It says nothing about the feature.** `/tax-reports`, `/advisor`, `/developers/portal` and `/login` all show identical copy and the same title, "Coming Soon | …".
- **Does email capture work without auth?**
  - It works only if `VITE_SUPABASE_*` are present at **build** time. `wrangler.toml [vars]` (`:10-12`) are runtime Function bindings for Pages. Confirm they are also set as Pages build variables (NEEDS-OWNER). Otherwise the form shows "Newsletter subscription is not configured" (`services/database.ts:409-411`).
  - If the DB is reachable: anonymous insert is allowed (`20260128…:728-730`; `remote_schema.sql:543` grants insert to `anon`). First-time signups work.
  - Duplicates surface a raw Postgres error (see (1)). The welcome email probably fails silently (MailChannels, see (1)).
  - The newsletter unsubscribe link points at `/unsubscribe` (`functions/api/send-newsletter.ts:200`), and **no such route exists in `App.tsx`**. That is a CAN-SPAM/GDPR problem once sends resume.
- **Login ignores `?redirect=`.** It reads only `location.state.from` (`Login.tsx:35-40`). Every `navigate('/login?redirect=…')` (Pricing, ApiPricing:32, ScamReportDetail:107,125, EnrollmentPrompt:162) loses its return path.

**Fixes (P1):**
- Make it `ComingSoon({ feature })`, with a `FEATURES` map (title, one-paragraph BLUF on what the feature will do, nearest static alternative).
- Add an inline waitlist form that calls `subscribeToNewsletter(email, 'waitlist-' + feature)`.
- Render `<SEO noindex>`.
- Change the static-mode header CTA to "Get updates" (scroll to the newsletter), or have Pricing's CTAs open the waitlist instead of `/login` while accounts are off.
- In `subscribeToNewsletter`, drop the anonymous pre-SELECT. Do the insert and map error code `23505` to "You're already subscribed".
- Add an `/unsubscribe` route: a token-signed Pages Function that sets `is_active=false`.

---

## Per-route findings

### /login — src/pages/Login.tsx
- **Purpose / target query:** account sign-in; not a search target.
- **Verdict:** Needs work. The form logic is sound; redirect handling and the backend are not.
- **Up-to-date issues:** none found.
- **SEO issues:** `PageSEO pageKey="login"` at `:285`, so it gets noindex once live. In static mode it is ComingSoon with `index, follow` (see (3)). The 2FA screen (`:200-280`) returns before `PageSEO`.
- **GEO issues:** N/A (noindex).
- **Static + DB:** static → ComingSoon. Live → `signIn` works (`services/auth.ts:222-310`), but a user created after the 2026-09-11 migrations has no `public.users` row (P0 #1), so `role` defaults to `'user'` and admins can't be bootstrapped except via `20251223000003_set_admin_user.sql`.
- **Bugs:** ignores `?redirect=` (`:35-40`), which Pricing, ApiPricing, ScamReportDetail and EnrollmentPrompt all use.
- **Recommended fixes:**
  - P0: the reconcile migration (signup trigger).
  - P1: read `new URLSearchParams(location.search).get('redirect')` as a fallback in `getRedirectPath`. Allow only same-origin paths starting with `/`.

### /signup — src/pages/Signup.tsx
- **Purpose / target query:** registration.
- **Verdict:** Poor against the current schema.
- **SEO issues:** `PageSEO` at `:106`. OK once live.
- **Static + DB:** `signUp` inserts the profile client-side (`services/auth.ts:185`) without checking the error. With email confirmation on (`Signup.tsx:63,87`) there's no session. Even with a session, `authenticated` has no INSERT grant or policy (`20260911000000…:124-133`). The profile row is never created.
- **Bugs:** a silent profile-creation failure. The Supabase default SMTP is heavily rate-limited, so custom SMTP is needed (NEEDS-OWNER).
- **Recommended fixes:**
  - P0: add `CREATE OR REPLACE FUNCTION public.handle_new_user() … SECURITY DEFINER SET search_path=public` that inserts `(id, email)` with `ON CONFLICT DO NOTHING`, plus `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users`. Remove the client insert from `auth.ts:185-200`, or make it an upsert of `preferences` only after the session exists.
  - P1: surface insert errors.

### /forgot-password — src/pages/ForgotPassword.tsx
- **Verdict:** Good (once live).
- **SEO:** `PageSEO` at `:58`.
- **Static + DB:** `resetPasswordForEmail` with `redirectTo: origin + '/reset-password'` (`auth.ts:478-480`). NEEDS-OWNER: add that URL to the Supabase Auth redirect allow-list and configure SMTP.
- **Fixes:** P0 is the `_headers` noindex only.

### /reset-password — src/pages/ResetPassword.tsx
- **Verdict:** Needs work (SEO only).
- **SEO issues:** no `<SEO>`, only `usePageTitle`, so no noindex is ever emitted.
- **Static + DB:** uses the Supabase recovery session (`detectSessionInUrl: true`, `src/lib/supabase.ts:18`). Fine.
- **Fixes:** P0 is `RouteRobots` / `_headers`.

### /profile — src/pages/Profile.tsx
- **Purpose:** account settings, subscription, 2FA, sessions, alerts, preferences.
- **Verdict:** Poor against the current schema.
- **Up-to-date issues:** Web3 leftovers. `Profile.tsx:527-532` refers to "wallet-only accounts … link an email address to your wallet"; Web3 was removed (commit `2c08ef0`). `users.wallet_address` and `users_auth_method_check` (`20260119_add_wallet_auth.sql:6-20`) are also leftovers.
- **SEO issues:** no `<SEO>`, so no noindex.
- **Static + DB:**
  - 2FA writes `two_factor_*`, which is not in the migrations.
  - The billing portal needs `stripe_customer_id`, which is not in the migrations.
  - The alerts tab uses the missing `push_subscriptions` and `notification_preferences` tables.
  - Sessions (`user_sessions`) are aligned.
- **Recommended fixes:**
  - P0: the reconcile migration adds the `users` columns and the push tables.
  - P1: delete the wallet-only branch (`:527-533`), and drop `wallet_address` and the auth-method constraint in a migration.

### /affiliate-stats — src/pages/AffiliateStats.tsx
- **Purpose:** site-owner affiliate click and conversion stats.
- **Verdict:** Poor as routed.
- **SEO:** no `<SEO>`.
- **Static + DB:** reads `affiliate_clicks` (`:72-78`). The columns match `remote_schema.sql:50-61`. Any logged-in non-admin sees all anonymous clicks (RLS `20260128…:676-678`), which is a data leak. There is no `isSupabaseConfigured()` guard.
- **Recommended fixes:**
  - P0: move it to `/admin/affiliates` under `AdminRoute`, and redirect `/affiliate-stats`.
  - P1: tighten `affiliate_clicks_select_own` to `user_id = auth.uid()` only.

### /ad-manager — src/pages/AdManager.tsx
- **Purpose:** self-hosted ad CRUD (owner tool).
- **Verdict:** Poor as routed.
- **SEO:** no `<SEO>`.
- **Static + DB:** columns match `advertisements`. Writes need `is_admin()` (`20260128…:712-714`), but the route is plain `ProtectedRoute`. Errors are swallowed (`:79-99,154-158`), so a non-admin's "save" silently does nothing.
- **Recommended fixes:**
  - P0: move it under `/admin/ads` with `AdminRoute`.
  - P1: show a toast when `error` is set.

### /tax-reports — src/pages/TaxReports.tsx
- **Purpose:** Form 8949/TXF export from the user's portfolio.
- **Verdict:** Needs work.
- **Up-to-date issues:** `TAX_PACKAGE.taxYear: 2024` and "for the 2024 tax year" (`src/services/subscriptionLimits.ts:533-540`). Today (Sep 2026) the relevant year is 2025, and the purchase check uses this constant (`TaxReports.tsx:142-143`), while the page's year selector defaults to `getFullYear()-1` = 2025 (`:113`). A 2025 purchaser is told they haven't bought. "CPA review" in the premium tier (`subscriptionLimits.ts:537`) is NEEDS-OWNER: is it real?
- **SEO:** no `<SEO>`.
- **Static + DB:**
  - The portfolio comes from `services/portfolio.ts:60` (Supabase when logged in, else localStorage). So report generation could work without the DB; only the purchase gate needs it.
  - `tax_report_purchases` and its RPCs are aligned.
- **Uniqueness:** a local-only "free preview" (summary without export) would be a strong static-mode offering for "crypto tax report generator".
- **Recommended fixes:**
  - P0: derive `taxYear` as `new Date().getFullYear() - 1` instead of the hard-coded 2024, and check the purchase against the **selected** `taxYear`.
  - P1: let static mode run the localStorage-based report preview instead of ComingSoon.

### /advisor — src/pages/AdvisorDashboard.tsx
- **Verdict:** Poor.
- **Up-to-date issues:** mock clients dated 2024 (`:25-60`).
- **SEO:** no `<SEO>`.
- **Static + DB:** there is no DB code at all; it uses `mockClients` and `mockPortfolioValues` with a `DemoDataBanner` (`:119`). The gate `hasAdvisorAccess` needs `subscription_status IN ('advisor','enterprise')` (`subscriptionLimits.ts:352`), which the enum can't hold. The page is unreachable for paying users.
- **Recommended fixes:**
  - P0: extend the enum, or convert `subscription_status` to `text` with a CHECK constraint.
  - P1: add `advisor_clients(advisor_id, client_user_id, name, email, notes, status)` with RLS `advisor_id = auth.uid()`, and replace `mockClients`.
  - Keep the page behind a per-feature flag until then. NEEDS-OWNER: is the Advisor tier still sold?

### /affiliate — src/pages/InfluencerDashboard.tsx
- **Verdict:** Poor.
- **SEO:** no `<SEO>`.
- **Static + DB:**
  - The application submit is `console.log` followed by a "submitted" screen (`:88-91`). Nothing is stored, so applicants are misled.
  - Click tracking is also `console.log` (`services/influencerAffiliate.ts:246-250`), and the table doesn't exist.
  - `demoInfluencer` (`:54-78`) is dead code (`influencer` is always `null`).
  - "Earn up to 30% Revenue Share" (`:103`) is NEEDS-OWNER.
- **Recommended fixes:**
  - P0: either store applications (reuse `influencer_verification_requests` from the monetization migration, or add `affiliate_applications`) or replace the form with a `mailto:` or waitlist capture.
  - P2: delete `demoInfluencer`.

### /portfolio-analysis — src/pages/PortfolioAnalysis.tsx
- **Verdict:** Poor.
- **SEO:** has `<SEO>` (`:141`), so noindex is applied while live.
- **Static + DB:** `const portfolioData = demoPortfolio` (`:62`, data at `:31-60`). Premium users pay for an AI analysis of **someone else's made-up holdings**, and there is no demo disclosure. This is a trust and YMYL problem.
- **Recommended fixes:** P0: use `getPortfolio()` from `services/portfolio.ts:60`. Show an empty state with a link to `/dashboard` when there are no holdings. If you keep a demo, label it with `DemoDataBanner`.

### /developers/portal — src/pages/DeveloperPortal.tsx
- **Verdict:** Needs work (mostly backend).
- **SEO:** `PageSEO` at `:156`. OK.
- **Static + DB:** the `api_keys` insert, select and revoke match `202412220001000_create_api_access.sql:5-24`. Paid API tiers are written by the webhook to `api_subscriptions`, but the `users.subscription_status='api'` write fails on the enum.
- **Recommended fixes:** P0 is the enum reconcile. P1: gate it behind a per-feature flag.

### /advertiser — src/pages/AdvertiserDashboard.tsx
- **Verdict:** Needs work.
- **SEO:** no `<SEO>`.
- **Static + DB:** `getSponsorByUserId`, then campaigns and articles (`services/sponsoredContent.ts:373-430`). Aligned with `202512220000500…`. With no sponsor row it shows "Become an Advertiser" with `mailto:sales@…` (`:137-207`), which is a sensible fallback. There is no way to create a sponsor row except via admin/SQL.
- **Fixes:** P1: add a sponsor-application insert (`status='pending'`), or keep the mailto. NEEDS-OWNER: sales contact.

### /admin (tree) — src/pages/admin/*, UserManagement, AdminAISettings
- **Verdict:** Needs work.
- **SEO:** none render `<SEO>`. In static mode `/admin` does a client-side `Navigate` to `/` (`App.tsx:155`). Add `X-Robots-Tag` via `_headers` for `/admin/*`.

Per page:
- **AdminOverview:** calls `get_user_stats`/`get_scam_stats` (defined) and `subscriptionAnalytics` (selects `subscription_tier`, which is missing, so it errors).
- **UserManagement:** `admin.ts:32` selects `*` from `users`, which ships `two_factor_secret` and recovery codes to the admin browser. Select explicit columns instead (P1).
- **AdminSubscriptions** (`:64-122`) and **AdminNewsletters** (`:64-102`): mock rows dated 2024, flagged with `DemoDataBanner`. Wire them to `users where subscription_status <> 'free'` and to `newsletter_subscribers` counts plus `/api/send-newsletter` (P1).
- **SystemSettings:** load and save are both fake `setTimeout`s that report "Settings saved successfully!" (`:47-76`). P0: remove the Save button, or persist to `admin_settings`.
- **AdminAISettings:** saves `ai_model_config` into `admin_settings` (`services/adminSettings.ts:60-95`). `functions/api/claude.ts:41-56` hard-codes `claude-sonnet-4-5-20250929`/`claude-haiku-4-5-20251001` and never reads it. The model list (`src/types/admin-database.ts:37-62`) includes `claude-opus-4-20250514`/`claude-sonnet-4-20250514`, which may be deprecated by now (NEEDS-OWNER to confirm the current model lineup). P1: have `claude.ts` read `admin_settings` with the service role (whitelist the IDs), or turn the page into read-only documentation of the env-configured models.
- **ContentModeration:** the `moderation_queue` table doesn't exist. It returns mock data when unconfigured and errors when configured. P0 in the reconcile: create it, or point it at `scam_report_comments`/`scam_reports` `status='pending'`.
- **SupportTickets:** aligned. Emails go via the broken MailChannels path.
- **AuditLogs:** aligned.
- **Blog admin:** aligned, with guards (`services/blog.ts`, 21 `isSupabaseConfigured` checks).
- **AdminRoute** (`src/components/AdminRoute.tsx:61-70`): fine. The client-side role comes from `public.users.role`, which is null for trigger-less signups, so bootstrapping admins needs `20251223000003_set_admin_user.sql` (NEEDS-OWNER: which email).

---

## Consolidated recommendations (in order)

**P0: before any flip**
1. **NEEDS-OWNER:** confirm whether Supabase project `mkdckqrukmukbmgxabyk` still exists (paused vs deleted), and whether `20260911*` have been applied to it. If it exists, **reconnect to it** rather than rebuilding.
2. Write `supabase/migrations/20260923000000_reconcile_schema.sql`, fully idempotent (`IF NOT EXISTS`, `DO $$ … $$` guards), containing:
   - the `handle_new_user()` SECURITY DEFINER function plus the `on_auth_user_created` trigger (`ON CONFLICT (id) DO NOTHING`), and a backfill `INSERT INTO public.users(id,email) SELECT id,email FROM auth.users ON CONFLICT DO NOTHING`;
   - `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text, stripe_subscription_id text, subscription_tier text, username text, two_factor_enabled boolean default false not null, two_factor_secret text, two_factor_recovery_codes text[], two_factor_enabled_at timestamptz`;
   - `ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'advisor'`, then the same for `'enterprise'`, `'api'` and `'lifetime'`;
   - `CREATE TABLE IF NOT EXISTS platform_reviews, moderation_queue, push_subscriptions, notification_preferences` (shapes from `services/reviews.ts`, `contentModeration.ts`, `pushNotifications.ts`), with RLS;
   - `app_meta(schema_version)` for the capability check.
3. Fix replay:
   - Guard `20260128000000…:552-590` with `IF to_regclass('public.platform_reviews') IS NOT NULL`, or create the table before it.
   - In `remote_schema.sql`, move `drop trigger … on_auth_user_created` (`:667`) above `drop function … handle_new_user` (`:21`), and make the `create type`/`create table` statements `IF NOT EXISTS`.
   - Remove `schema.sql` from REBUILD_GUIDE.
   - Verify with `supabase db reset` locally.
4. Add path-based noindex: `X-Robots-Tag: noindex, follow` in `public/_headers` for every gated route and `/admin/*`, plus a global `RouteRobots` in `Layout`/`AdminLayout`, plus `<SEO noindex>` in `ComingSoon`.
5. Move `/affiliate-stats` and `/ad-manager` under `/admin` with `AdminRoute`.
6. Stop fabricating: PortfolioAnalysis uses the real portfolio; the SystemSettings fake save is removed; the influencer application is persisted or turned into a waitlist.
7. Put auth on `/api/send-email` and configure a working mail provider (NEEDS-OWNER: SES vs Resend vs MailChannels paid).
8. `TAX_PACKAGE.taxYear` is computed, and the purchase check uses the selected year.

**P1**
- Add the `VITE_ACCOUNTS_ENABLED` env switch, `useBackendStatus` (schema-version check) and a `FeatureGate` with per-feature flags. Enable Login, Signup, Profile, Developer Portal and Tax Reports first; keep Advisor and Influencer dark.
- Build the feature-aware ComingSoon with a waitlist form. Fix the static-mode header/Pricing dead-end. Add the `/unsubscribe` route. Map newsletter error `23505` to a friendly message.
- Make Login honour `?redirect=`.
- Regenerate `src/types/database.ts` from the live DB. Remove the `db` any-client usages over time.
- Rewrite REBUILD_GUIDE:
  - the correct migration list, including `20260911*`;
  - the correct protected-route list;
  - the correct email provider;
  - real table names;
  - a "verify" checklist: sign up, confirm the `users` row exists, a Stripe test purchase flips the tier, and 2FA enable works.
- UserManagement: select explicit columns. Show `AdManager` errors.

**P2**
- Remove the Web3 leftovers (Profile `:527-533`, `users.wallet_address`, `users_auth_method_check`). Remove the dead `demoInfluencer`.
- Extend `audit-route-indexing.mjs` to verify that the noindex is actually emitted. Fix the `usePageTitle` comment.
- Remove `Allow: /developer-portal` and `Allow: /report-scam` from `robots.txt`.
