# Database Rebuild Guide

When you're ready to restore full platform functionality, follow this guide.

---

## Quick Start

1. Set up a Supabase instance (self-hosted or cloud)
2. Run the migrations in order
3. Set environment variables
4. Flip the static mode flag
5. Deploy

---

## Step 1: Supabase Setup

### Option A: Supabase Cloud (Easiest)
- Go to https://supabase.com and create a new project
- Note your project URL and anon key

### Option B: Self-Hosted Supabase (Cheapest Long-Term)
- Minimum VPS: 2GB RAM, 2 vCPU, 25GB disk ($5-12/month)
- Follow: https://supabase.com/docs/guides/self-hosting/docker
- Recommended providers: Hetzner, DigitalOcean, Vultr

```bash
# Quick self-hosted setup
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# Edit .env with your secrets
docker compose up -d
```

---

## Step 2: Run Database Migrations

Run these SQL files **in order** against your new Supabase instance.
Use the Supabase SQL Editor or `psql` directly.

### Migration Order

```
supabase/schema.sql                                          # Base schema
supabase/migrations/20241217_create_common_functions.sql     # Utility functions
supabase/migrations/20241218_create_users_table.sql          # Users + RLS
supabase/migrations/20241219_cleanup_existing_policies.sql   # Policy cleanup
supabase/migrations/20241220_fix_quiz_attempts_schema.sql    # Schema fixes
supabase/migrations/202412220000000_create_ai_learning.sql   # AI conversations
supabase/migrations/202412220000500_create_ama_sessions.sql  # AMA sessions
supabase/migrations/202412220001000_create_api_access.sql    # API keys/webhooks
supabase/migrations/202412220001500_create_certifications.sql # Certifications
supabase/migrations/202412220002000_create_dashboard_layouts.sql # Dashboard customization
supabase/migrations/202412220002500_create_early_access.sql  # Beta features
supabase/migrations/202412220003000_create_exchange_connections.sql # Exchange APIs
supabase/migrations/202412220003500_create_interactive_courses.sql # Courses
supabase/migrations/202412220004000_create_invoices.sql      # Invoicing
supabase/migrations/202412220005000_create_portfolios.sql    # Portfolios + holdings
supabase/migrations/202412220005100_create_portfolio_shares.sql # Sharing
supabase/migrations/202412220005500_create_qa_forum.sql      # Forum/Q&A
supabase/migrations/202412220010000_create_research_reports.sql # Research
supabase/migrations/202412220010500_create_success_stories.sql # Success stories
supabase/migrations/202412220011000_create_support_tickets.sql # Support
supabase/migrations/202412220011500_create_user_reputation.sql # Gamification
supabase/migrations/202412220012000_create_user_sessions.sql # Session management
supabase/migrations/202412220012500_create_video_tutorials.sql # Videos
supabase/migrations/202412220013000_create_webinars.sql      # Webinars
supabase/migrations/202412220013500_optimize_database_indexes.sql # Indexes
supabase/migrations/202512040000000_add_admin_and_scam_database.sql # Admin + scam DB
supabase/migrations/202512040000500_add_web3_tables.sql      # Web3 tables
supabase/migrations/20251205_add_tax_report_purchases.sql    # Tax reports
supabase/migrations/202512220000000_create_advanced_monetization_features.sql
supabase/migrations/202512220000500_create_sponsored_content.sql
supabase/migrations/202512230000000_add_community_scam_voting.sql
supabase/migrations/20251223000001_fix_users_rls_policies.sql
supabase/migrations/20251223000002_fix_users_search_trigger.sql
supabase/migrations/20251223000003_set_admin_user.sql        # Set your admin user
supabase/migrations/20251223161809_remote_schema.sql
supabase/migrations/20260119_add_wallet_auth.sql             # Wallet auth
supabase/migrations/20260128000000_comprehensive_rls_security.sql # RLS hardening
supabase/migrations/20260130_enhance_blog_system.sql         # Blog system
```

---

## Step 3: Environment Variables

### Frontend (.env or wrangler.toml)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Cloudflare Workers (Dashboard → Settings → Environment Variables → Secrets)
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@bitcoinvestments.net
```

---

## Step 4: Disable Static Mode

In `src/config/staticMode.ts`, change:

```typescript
export const STATIC_MODE = false;
```

This single flag re-enables:
- Authentication (login/signup)
- Protected routes (profile, portfolio, tax reports, etc.)
- Admin panel
- Auth UI in the header (Sign In / Get Started buttons)
- Session management
- Database-dependent features

---

## Step 5: Deploy

```bash
npm run build
npm run deploy
```

---

## Key Source Files Reference

| File | Purpose |
|------|---------|
| `src/config/staticMode.ts` | Master on/off switch |
| `src/contexts/AuthContext.tsx` | Auth state (checks STATIC_MODE) |
| `src/components/Layout/Header.tsx` | Nav buttons (checks STATIC_MODE) |
| `src/App.tsx` | Route definitions (checks STATIC_MODE) |
| `src/lib/supabase.ts` | Supabase client initialization |
| `src/services/auth.ts` | Auth functions (signIn, signUp, etc.) |
| `src/services/database.ts` | All database operations |
| `src/types/database.ts` | TypeScript types for all tables |

---

## Database Tables Overview

### Core (Required First)
- `users` — User accounts and profiles
- `portfolios` — Portfolio metadata
- `holdings` — Crypto holdings per portfolio
- `transactions` — Buy/sell transaction history
- `price_alerts` — Price alert targets

### Auth & Security
- `user_sessions` — Session tracking per device
- `user_wallets` — Web3 wallet addresses
- `wallet_auth_nonces` — SIWE nonce tracking
- `audit_logs` — Admin action logging

### Content
- `articles` — Blog posts
- `blog_categories` — Blog organization
- `blog_revisions` — Version history
- `video_tutorials` — Video library
- `interactive_courses` — Course content
- `quiz_attempts` — Quiz progress
- `certifications` — Earned certificates
- `research_reports` — Premium research

### Community
- `qa_forum_questions` — Forum posts
- `qa_forum_answers` — Answers
- `qa_forum_comments` — Comments
- `scam_reports` / `scam_database` — Scam submissions
- `scam_database_votes` — Community voting
- `success_stories` — User stories
- `user_reputation` — Reputation/gamification

### Business
- `advertisements` — Ad campaigns
- `affiliate_clicks` — Referral tracking
- `newsletter_subscribers` — Email list
- `support_tickets` — Customer support
- `invoices` — Billing records
- `tax_report_purchases` — Tax package purchases
- `api_keys` — Developer API keys
- `api_webhooks` — Developer webhooks
- `api_usage_logs` — API usage tracking

### Monetization
- `exchange_connections` — Exchange API integrations
- `portfolio_shares` — Shared portfolios
- `dashboard_layouts` — User dashboard customization
- `webinars` — Webinar management
- `ama_sessions` — AMA events
- `early_access_features` — Beta feature tracking
- `sponsored_content` — Sponsored posts

---

## API Endpoints to Re-enable

These Cloudflare Worker functions are in `functions/api/`:

| Endpoint | File | Needs DB |
|----------|------|:--------:|
| POST `/api/create-checkout-session` | `create-checkout-session.ts` | Yes |
| POST `/api/create-portal-session` | `create-portal-session.ts` | Yes |
| POST `/api/create-api-checkout-session` | `create-api-checkout-session.ts` | Yes |
| POST `/api/create-tax-package-checkout` | `create-tax-package-checkout.ts` | Yes |
| POST `/api/stripe-webhook` | `stripe-webhook.ts` | Yes |
| POST `/api/send-email` | `send-email.ts` | No |
| POST `/api/send-newsletter` | `send-newsletter.ts` | Yes |
| GET `/api/check-price-alerts` | `check-price-alerts.ts` | Yes |
| GET `/api/sitemap` | `sitemap.ts` | No |
| POST `/api/claude` | `claude.ts` | No |
| POST `/api/log-error` | `log-error.ts` | No |
| GET `/api/coingecko/*` | `coingecko/[[path]].ts` | No |
| GET `/api/v1/market/prices` | `v1/market/prices.ts` | Yes (API key auth) |
| GET `/api/v1/market/historical` | `v1/market/historical.ts` | Yes (API key auth) |
| GET/POST `/api/v1/portfolio` | `v1/portfolio/index.ts` | Yes |

### Cron Workers (in `workers/`)
- `price-alerts-cron.ts` — Every 5 minutes, checks price alerts
- `weekly-newsletter-cron.ts` — Monday 2 PM UTC, sends newsletter

---

## Stripe Configuration

Stripe works independently of Supabase for checkout. The webhook handler (`stripe-webhook.ts`) writes subscription status to the database, so that's the critical reconnection point.

### Webhook Events Handled
- `checkout.session.completed` — New subscription/purchase
- `customer.subscription.updated` — Plan changes
- `customer.subscription.deleted` — Cancellations
- `invoice.payment_succeeded` — Successful payments
- `invoice.payment_failed` — Failed payments

### Price IDs (Already Configured)
```
Monthly:    price_1SjCs0ACjrOpqtS7WmysOAji
Annual:     price_1SjCs1ACjrOpqtS73AJP6L2q
Lifetime:   price_1SjCs2ACjrOpqtS7qRVoOMuA
Advisor:    price_1SjCs3ACjrOpqtS7wphKBoBq
Enterprise: price_1SjCs4ACjrOpqtS7EWj32lhT
Tax Basic:  price_1SjCs6ACjrOpqtS73YfC7eJ1
Tax Premium: price_1SjCs7ACjrOpqtS7OldA1ims
```

---

## Routes to Restore

When disabling static mode, these routes become accessible again:

### Auth Routes
- `/login`, `/signup`, `/forgot-password`, `/reset-password`

### Protected Routes (Require Login)
- `/profile` — User settings
- `/report-scam` — Submit scam reports
- `/affiliate-stats` — Affiliate dashboard
- `/affiliate` — Influencer dashboard
- `/advertiser` — Advertiser dashboard
- `/ad-manager` — Ad management
- `/tax-reports` — Tax report generation
- `/advisor` — Advisor tools
- `/portfolio-analysis` — Portfolio deep dive
- `/dca-automation` — DCA automation
- `/rebalancing-alerts` — Rebalancing
- `/alert-bundles` — Smart alerts
- `/developers/portal` — API key management

### Admin Routes (Require Admin Role)
- `/admin` — Dashboard
- `/admin/users` — User management
- `/admin/subscriptions` — Subscription management
- `/admin/scam-database` — Scam moderation
- `/admin/content` — Content moderation
- `/admin/support` — Support tickets
- `/admin/ai-settings` — AI configuration
- `/admin/audit-logs` — Audit logs
- `/admin/newsletters` — Newsletter management
- `/admin/analytics` — Analytics
- `/admin/settings` — System settings (super_admin only)
- `/admin/blog/*` — Blog CMS
