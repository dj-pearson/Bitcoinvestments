# Turning accounts and the database back on

The site ships as a static content site. Everything that needs an account
(sign-in, profile, tax reports, developer portal, the admin panel, …) sits
behind one build variable, `VITE_ACCOUNTS_ENABLED`, and a runtime check that the
database has the schema this build expects. This guide takes you from "static"
to "accounts on" without shipping broken sign-up or billing.

Last reviewed: 2026-09-23.

---

## 0. Decide: reconnect or rebuild

The last production project was Supabase `mkdckqrukmukbmgxabyk` (see
`wrangler.toml` and `supabase/.temp/pooler-url`).

- **If it still exists** (paused or active), reconnect to it: resume it in the
  Supabase dashboard, then apply only the migrations it is missing (step 2B).
  This keeps existing users, portfolios and purchases.
- **If it is gone**, create a new project and apply every migration (step 2A).

> NEEDS-OWNER: confirm which of the two applies, and which migrations the old
> project already has (`supabase migration list` shows it once linked).

---

## 1. How the switch works

| Piece | File | What it does |
|---|---|---|
| Master switch | `src/config/staticMode.ts` | `ACCOUNTS_ENABLED = VITE_ACCOUNTS_ENABLED === 'true'`. `STATIC_MODE` is its inverse and is what Header/App/AuthContext read. Unset means off. |
| Route gate | `src/components/FeatureGate.tsx` | Wraps every account route. Renders the page only when the switch is on, Supabase is configured, the feature has a real backend (`ready` in `src/config/features.ts`), and the database passes the schema check. Otherwise renders that feature's "coming soon" page (noindex, with a newsletter waitlist). |
| Schema check | `src/hooks/useBackendStatus.ts` | Reads `app_meta.schema_version` (3 s timeout, cached 5 minutes, only when a gated route mounts). Below `REQUIRED_SCHEMA_VERSION` = "outdated", error/timeout = "down"; both show "temporarily unavailable" instead of a broken page. |
| Auth provider | `src/contexts/AuthContext.tsx` | Mounts the live provider whenever the switch is on. It does not react to the schema check, so a database blip never signs anyone out. |

Features currently marked `ready: false` (stay dark in production even with
accounts on, because they have no real data source yet): **`/advisor`**.

The switch does **not** control public pages: pages that read Supabase for
extra data (blog, scam database, …) already check `isSupabaseConfigured()` on
their own and fall back to their static content.

---

## 2. Apply the database migrations

**Do not run `supabase/schema.sql`.** It is a legacy snapshot; running it
before the migrations makes `20251223161809_remote_schema.sql` fail on
`create type … ad_status` (the types already exist). The migrations alone build
the whole schema.

The order is simply **every file in `supabase/migrations/`, sorted by file
name** — that is what the Supabase CLI does. As of this guide:

```
20241217_create_common_functions.sql
20241218_create_users_table.sql
20241219_cleanup_existing_policies.sql
20241220_fix_quiz_attempts_schema.sql
202412220000000_create_ai_learning.sql
202412220000500_create_ama_sessions.sql
202412220001000_create_api_access.sql
202412220001500_create_certifications.sql
202412220002000_create_dashboard_layouts.sql
202412220002500_create_early_access.sql
202412220003000_create_exchange_connections.sql
202412220003500_create_interactive_courses.sql
202412220004000_create_invoices.sql
202412220005000_create_portfolios.sql
202412220005100_create_portfolio_shares.sql
202412220005500_create_qa_forum.sql
202412220010000_create_research_reports.sql
202412220010500_create_success_stories.sql
202412220011000_create_support_tickets.sql
202412220011500_create_user_reputation.sql
202412220012000_create_user_sessions.sql
202412220012500_create_video_tutorials.sql
202412220013000_create_webinars.sql
202412220013500_optimize_database_indexes.sql
202512040000000_add_admin_and_scam_database.sql
202512040000500_add_web3_tables.sql
20251205_add_tax_report_purchases.sql
202512220000000_create_advanced_monetization_features.sql
202512220000500_create_sponsored_content.sql
202512230000000_add_community_scam_voting.sql
20251223000001_fix_users_rls_policies.sql
20251223000002_fix_users_search_trigger.sql
20251223000003_set_admin_user.sql          # no-op unless that email exists; see step 5
20251223161809_remote_schema.sql
20260119_add_wallet_auth.sql               # its two policies are dropped again by 20260923000300
20260128000000_comprehensive_rls_security.sql
20260130_enhance_blog_system.sql
20260911000000_fix_users_rls_admin_row_exposure.sql
20260911010000_protect_user_privilege_columns.sql
20260911020000_fix_system_can_manage_policies.sql
20260923000000_price_alerts_coingecko_ids_and_backoff.sql
20260923000100_harden_scam_reports.sql      # if present (scam database workstream)
20260923000200_public_authors.sql           # if present (blog workstream)
20260923000300_reconcile_schema.sql         # REQUIRED before accounts go on
20260923000400_newsletter_unsubscribe.sql   # if present (newsletter workstream)
```

The version prefixes have mixed lengths (8, 14 and 15 digits), but sorted as
text they still come out in date order, as listed. Re-list with
`ls supabase/migrations | sort` if files have been added since.

Two older files were edited on 2026-09-23 **only** so a fresh database can
replay them; neither edit changes the end state, and a database that already
recorded those versions does not run them again:

- `20251223161809_remote_schema.sql` drops the `on_auth_user_created` trigger
  before the function it depends on (it used to fail with "other objects depend
  on it").
- `20260128000000_comprehensive_rls_security.sql` skips its `platform_reviews`
  statements when that table does not exist yet (no migration created it; the
  reconcile migration now does, with the same policies).

The full sequence was replayed on an empty Postgres 16 (PGlite) with a
Supabase `auth`/roles stub, and `20260923000300_reconcile_schema.sql` was run a
second time to confirm it is idempotent.

### 2A. New project (fresh database)

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <new-project-ref>
pnpm dlx supabase db push
```

To rehearse locally first (needs Docker): `pnpm dlx supabase start && pnpm dlx supabase db reset`.

### 2B. Existing project (reconnect)

```bash
pnpm dlx supabase link --project-ref mkdckqrukmukbmgxabyk
pnpm dlx supabase migration list      # what is applied remotely vs locally
pnpm dlx supabase db push             # add --include-all if it refuses older local files
```

If the project has no usable migration history (it was changed by hand in the
SQL editor), run the missing files from the list above in the SQL editor, in
order. The 2026-09-11 files, `20260923000000` and `20260923000300` were each
re-run on an already-migrated test database without errors; check any newer
file's header before re-running it.

**Apply `20260911000000…` and `20260923000300…` in the same session.** The
2026-09-11 users-RLS migration removes the browser's ability to insert profile
rows; `20260923000300` restores the database trigger that creates them. With
only the first applied, new sign-ups get no profile row.

### What `20260923000300_reconcile_schema.sql` does

- **Sign-up:** `handle_new_user()` (SECURITY DEFINER, pinned `search_path`) and
  the `on_auth_user_created` trigger create the `public.users` row; failures are
  logged as warnings and never block the sign-up. Existing auth users without a
  profile are backfilled. Email changes in Supabase Auth are copied to the
  profile. `create_user_reputation()` gets a pinned `search_path` (without it,
  Auth's own search path can make that trigger abort every sign-up).
- **users columns** the code and webhook use: `username`, `subscription_tier`,
  `stripe_customer_id`, `stripe_subscription_id`, `lifetime_purchase_date`,
  `lifetime_purchase_amount`, `payment_failed_at`, `two_factor_enabled`,
  `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_enabled_at`.
  None is on the self-update allowlist from `20260911010000`, so users still
  cannot edit their own plan, Stripe ids or suspension.
- **Enum:** `subscription_status` gains `advisor`, `enterprise`, `api`,
  `lifetime`.
- **New tables (all with RLS):** `platform_reviews` (+ one-vote-per-user
  `platform_review_helpful_votes` and `increment_review_helpful()`),
  `moderation_queue` (reviews are queued automatically; approving/rejecting in
  `/admin/content` updates the review), `push_subscriptions`,
  `notification_preferences`, `influencer_referrals`, `affiliate_applications`.
- **`app_meta`** with `schema_version = 20260923000300`, readable by anyone,
  writable only by migrations/service role.
- **Holes closed:** the wallet-login INSERT policy on `users` (a signed-in user
  without a profile could insert one with `role = 'super_admin'`) and its
  header-matched SELECT policy; API-key owners setting their own tier and rate
  limits; review authors approving their own reviews or setting vote counts;
  any signed-in user reading anonymous affiliate clicks; world-readable
  `admin_settings`.

---

## 3. Configure Supabase Auth

In the Supabase dashboard → **Authentication**:

1. **URL Configuration:** Site URL `https://bitcoinvestments.net`; add
   `https://bitcoinvestments.net/reset-password` and
   `https://bitcoinvestments.net/login` to the redirect allow-list (password
   reset uses `…/reset-password`).
2. **Email:** keep "Confirm email" on (`/signup` tells users to check their
   inbox).
3. **SMTP:** set a custom SMTP sender. Supabase's built-in sender is heavily
   rate-limited and not meant for production. Use the same provider as the
   site's own mail (Resend: it offers SMTP credentials alongside the API key).
4. **Sessions:** JWT expiry and refresh settings live here, not in the app.

---

## 4. Environment variables

### 4.1 Build variables (Cloudflare Pages → Settings → Variables and Secrets, **Production**)

Vite inlines `import.meta.env.VITE_*` **at build time**. `wrangler.toml [vars]`
are runtime bindings for Pages Functions; they are not guaranteed to reach the
Vite build. Set these in the Pages dashboard so the build sees them, then
redeploy (a variable change alone does not rebuild).

| Variable | Needed for |
|---|---|
| `VITE_ACCOUNTS_ENABLED` | `true` turns accounts on. Leave unset until the checklist in step 7 passes. |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key — safe in the browser; RLS protects the data |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Checkout |
| `VITE_STRIPE_PRICE_MONTHLY`, `…_ANNUAL`, `…_LIFETIME`, `…_ADVISOR`, `…_ENTERPRISE` | Plan price ids (also read by the Functions below) |
| `VITE_STRIPE_TAX_PACKAGE_BASIC`, `…_PREMIUM` | Tax package price ids |
| `VITE_STRIPE_API_STARTER_MONTHLY`, `…_STARTER_YEARLY`, `…_PROFESSIONAL_MONTHLY`, `…_PROFESSIONAL_YEARLY` | API plan price ids |
| `VITE_VAPID_PUBLIC_KEY` | Optional: browser push notifications |

Never put a secret in a `VITE_` variable: it ships to every visitor. The
`VITE_RESEND_API_KEY` entry in `wrangler.toml` should be deleted for that reason
(it is empty today).

### 4.2 Server secrets (same screen, type **Secret**; read by Pages Functions)

| Secret | Used by |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Stripe webhook, price-alert and newsletter jobs, `/api/v1/*`, the scheduled-job auth |
| `SUPABASE_URL` | `check-price-alerts` and `/api/v1/*` read this name (the webhook accepts either); set it to the same URL as `VITE_SUPABASE_URL` |
| `STRIPE_SECRET_KEY` | Checkout, billing portal, webhook |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature check |
| `RESEND_API_KEY` | All outgoing email (`functions/lib/mailer.ts`: Resend first; MailChannels only with `MAILCHANNELS_API_KEY`, since its free Workers tier ended in 2024) |
| `FROM_EMAIL` | Sender, e.g. `Bitcoinvestments <noreply@bitcoinvestments.net>` (the domain must be verified in Resend) |
| `CLAUDE_API_KEY` | `/api/claude` (AI features) |
| `COINGECKO_API_KEY` | Optional, price proxy |

The cron workers (`wrangler-cron.toml`, `wrangler-newsletter.toml`) need their
own `SUPABASE_SERVICE_ROLE_KEY` secret:
`pnpm dlx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler-cron.toml`
(and the same with `wrangler-newsletter.toml`).

> NEEDS-OWNER: a Resend account with the sending domain verified, and the
> production values of every secret above.

---

## 5. Bootstrap an administrator

1. Sign up on the site with the owner's email (after step 6) and confirm it.
2. In the SQL editor:

   ```sql
   update public.users set role = 'super_admin' where lower(email) = lower('owner@example.com');
   ```

   `super_admin` is needed for `/admin/settings`; `admin` for the rest of
   `/admin`, `/affiliate-stats` and `/ad-manager`.

`20251223000003_set_admin_user.sql` hard-codes one address and only works if
that user already exists; prefer the statement above.

---

## 6. Stripe

- Webhook endpoint: `https://bitcoinvestments.net/api/stripe-webhook`, events
  `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_succeeded`,
  `invoice.payment_failed`. Copy its signing secret to `STRIPE_WEBHOOK_SECRET`.
- The webhook decides what was bought **from the price id** of the line item
  or subscription (the env vars in 4.1). Metadata is only used for the tax year
  of a tax package, which the tax checkout endpoint validates. A price that is
  not configured is logged and ignored, so every price you sell must be in the
  env vars.
- Plans write `users.subscription_status` (`premium`, `advisor`, `enterprise`,
  `lifetime`); API plans write `api_subscriptions` and the tier of the user's
  active API keys.

> NEEDS-OWNER: whether the Advisor/Enterprise plans, the API product and the
> tax package are actually for sale. Until they are, keep their price ids unset.

---

## 7. Go-live checklist

Do these in order on the production project. Keep `VITE_ACCOUNTS_ENABLED`
unset until step 7.4.

**7.1 Schema**

```sql
select value from public.app_meta where key = 'schema_version';        -- 20260923000300 or higher
select enum_range(null::public.subscription_status);                    -- includes lifetime
select count(*) from auth.users au
  where not exists (select 1 from public.users pu where pu.id = au.id); -- 0
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;   -- on_auth_user_created present
select policyname from pg_policies where tablename = 'users';           -- no "wallet" policies
```

**7.2 Configuration:** build variables and secrets from step 4 set; Auth URLs
and SMTP from step 3 set; Stripe webhook from step 6 created.

**7.3 Deploy a preview build with `VITE_ACCOUNTS_ENABLED=true`** (Pages
preview environment) and check:

- [ ] Sign up with a new address → confirmation email arrives → a
      `public.users` row exists for it with `role = 'user'`, `subscription_status = 'free'`.
- [ ] Sign in; `/login?redirect=/pricing` returns to `/pricing`.
- [ ] Forgot password → email arrives → `/reset-password` sets a new password.
- [ ] Profile → Security: enable 2FA, sign out, sign in with a code.
- [ ] Stripe test mode: buy the monthly plan → `subscription_status = 'premium'`,
      `subscription_tier = 'monthly'`, `stripe_customer_id` set; cancel in the
      billing portal → returns to `free` when the period ends.
- [ ] Tax package test purchase → a `tax_report_purchases` row for the chosen
      year; `/tax-reports` unlocks that year only.
- [ ] Newsletter form on a "coming soon" page stores a row with
      `source = 'waitlist-<feature>'`; the welcome email arrives.
- [ ] Admin account (step 5): `/admin`, `/admin/users`, `/admin/settings`
      (shows "Connected"), `/affiliate-stats`, `/ad-manager` load; a normal
      account is sent away from all of them.
- [ ] Stop the database (or point the preview at a wrong URL): gated routes show
      "Temporarily unavailable", public pages still work.

**7.4 Production:** set `VITE_ACCOUNTS_ENABLED=true` for Production and
redeploy. Watch the Functions logs for `stripe-webhook` and Supabase's Postgres
logs for `handle_new_user` warnings during the first day.

**Rolling back** is the same switch: unset `VITE_ACCOUNTS_ENABLED` and redeploy.
No data is lost; account pages show "coming soon" again.

Free-tier Supabase projects are paused after a period of inactivity. When that
happens the schema check fails and gated pages show "temporarily unavailable"
until the project is resumed.

---

## 8. Routes behind the gate

`FeatureGate` + login (`ProtectedRoute`): `/profile`, `/report-scam`,
`/tax-reports`, `/advisor` (not ready), `/affiliate`, `/portfolio-analysis`,
`/developers/portal`, `/advertiser`.

`FeatureGate` + admin (`AdminRoute`): `/affiliate-stats`, `/ad-manager`.

`FeatureGate` only: `/login`, `/signup`, `/forgot-password`, `/reset-password`.

Admin panel (`AdminRoute`, redirects home while accounts are off): `/admin`,
`/admin/users`, `/admin/subscriptions`, `/admin/scam-database`,
`/admin/content`, `/admin/support`, `/admin/ai-settings`, `/admin/audit-logs`,
`/admin/newsletters`, `/admin/analytics`, `/admin/settings` (super_admin),
`/admin/blog`, `/admin/blog/new`, `/admin/blog/edit/:id`,
`/admin/blog/categories`.

`/dca-automation`, `/rebalancing-alerts` and `/alert-bundles` are public pages
that work without an account.

---

## 9. Main tables

| Area | Tables |
|---|---|
| Accounts | `users`, `user_sessions`, `notification_preferences`, `push_subscriptions`, `user_reputation`, `reputation_history` |
| Portfolio | `portfolios`, `holdings`, `transactions`, `price_alerts`, `portfolio_shares` |
| Billing | `tax_report_purchases`, `invoices`, `api_subscriptions`, `api_keys`, `api_usage_logs` |
| Content | `articles`, `blog_categories`, `blog_revisions`, `courses`, `course_modules`, `course_lessons`, `lesson_progress`, `video_tutorials`, `research_reports` |
| Community | `forum_questions`, `forum_answers`, `forum_comments`, `forum_votes`, `scam_reports`, `scam_report_comments`, `scam_report_votes`, `scam_reporter_reputation`, `platform_reviews`, `success_stories` |
| Business | `advertisements`, `affiliate_clicks`, `influencer_referrals`, `affiliate_applications`, `newsletter_subscribers`, `sponsors`, `sponsored_campaigns`, `sponsored_articles`, `support_tickets`, `ticket_messages` |
| Admin | `admin_settings`, `admin_audit_logs`, `moderation_queue`, `app_meta` |

`src/types/database.ts` is hand-maintained for the tables the typed client
uses. Once the project is live, regenerate it:
`pnpm dlx supabase gen types typescript --project-id <ref> > src/types/database.ts`
(then re-check that `pnpm run build` passes; see the note in that file about
`subscription_status`).

---

## 10. Functions and jobs

| Endpoint | File | Needs |
|---|---|---|
| POST `/api/create-checkout-session` | `create-checkout-session.ts` | Stripe; price whitelist from env |
| POST `/api/create-portal-session` | `create-portal-session.ts` | Stripe, Supabase |
| POST `/api/create-api-checkout-session` | `create-api-checkout-session.ts` | Stripe |
| POST `/api/create-tax-package-checkout` | `create-tax-package-checkout.ts` | Stripe |
| POST `/api/stripe-webhook` | `stripe-webhook.ts` | Stripe, Supabase service role |
| POST `/api/send-email` | `send-email.ts` | Resend; caller must be the scheduled job or a signed-in user |
| POST `/api/newsletter-welcome` | `newsletter-welcome.ts` | Resend, Supabase |
| POST `/api/send-newsletter` | `send-newsletter.ts` | Scheduled-job auth, Resend, Supabase |
| `/api/check-price-alerts` (any method) | `check-price-alerts.ts` | Scheduled-job auth, Resend, Supabase |
| POST `/api/claude` | `claude.ts` | `CLAUDE_API_KEY` |
| `/api/v1/*` | `v1/…` | API key (hashed lookup in `api_keys`), Supabase |

Cron workers: `workers/price-alerts-cron.ts` (every 5 minutes,
`wrangler-cron.toml`) and `workers/weekly-newsletter-cron.ts` (Mondays 14:00
UTC, `wrangler-newsletter.toml`).
