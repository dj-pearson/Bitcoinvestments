# Bitcoinvestments - Claude Code Project Guide

Cryptocurrency education and investment platform for beginner-to-intermediate investors (ages 25-55). Provides portfolio tracking, educational content, calculators, and platform comparisons.

## Tech Stack

- **Frontend**: React 18 + TypeScript 5 + Vite 7, TailwindCSS, Framer Motion, Chart.js
- **Backend**: Cloudflare Workers + Pages, Supabase (Postgres with RLS)
- **Services**: Stripe (payments), Resend/MailChannels (email), Sentry (monitoring)

## Project Structure

```
src/
├── pages/         # Route components
├── components/    # Reusable UI
├── services/      # Business logic modules
├── contexts/      # AuthContext, ToastContext
├── hooks/         # Custom React hooks
├── lib/           # seo, validation, env, supabase clients
├── data/          # Static data (guides, exchanges, wallets)
└── App.tsx        # Router (100+ routes)
functions/api/     # Cloudflare Workers endpoints
workers/           # Scheduled cron workers
supabase/          # DB schema & migrations
docs/              # Setup guides
```

## Commands

This project uses **pnpm** (pinned via `packageManager` in `package.json`).
`package.json` carries a `pnpm.overrides` block pinning patched versions of
transitive dependencies; `npm install` ignores it and reintroduces several
high-severity advisories, so install with pnpm.

```bash
corepack enable
pnpm install              # Install (never `npm install`)

pnpm run dev              # Dev server
pnpm run build            # Production build (tsc -b && vite build)
pnpm run lint             # ESLint — must report 0 errors
pnpm audit --audit-level=high   # Must be clean; CI gates on this
pnpm run deploy           # Deploy to Cloudflare Pages
pnpm run deploy:cron      # Deploy price-alert cron
pnpm run deploy:newsletter# Deploy newsletter cron
pnpm run deploy:all       # Deploy everything
pnpm run cf:tail          # Tail Cloudflare logs
pnpm run cron:tail        # Tail cron worker logs
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, build and audit, and
gates on all four.

## API Endpoints (`functions/api/`)

- `create-checkout-session`, `create-portal-session`, `stripe-webhook` — Stripe
- `check-price-alerts`, `send-newsletter` — Cron-driven
- `send-email` — Generic email
- `coingecko/*` — CoinGecko proxy

## Environment Variables

**Frontend** (`VITE_*`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `COINGECKO_API_KEY` (optional), `CRYPTOCOMPARE_API_KEY` (optional)

**Workers**: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`, `PAGES_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Database Tables (Supabase, all RLS-protected)

`users`, `portfolios`, `holdings`, `transactions`, `price_alerts`, `articles`, `newsletter_subscribers`, `advertisements`, `affiliate_clicks`, `forum_posts`, `platform_reviews`, `audit_logs`, `support_tickets`

## Feature Areas

- **Auth**: Email/password (Supabase)
- **Portfolio**: Cloud-synced tracker, performance charts, multi-chain wallet integration
- **Education**: Guides, glossary, courses, video library, platform comparisons
- **Calculators**: DCA, fees, tax, staking, retirement, backtesting
- **Monetization**: Stripe subscriptions, self-hosted ads, affiliate tracking, newsletter
- **Community**: Q&A forum, scam database, success stories, AMAs
- **Admin**: Analytics, user management, moderation, support tickets, audit logs

## Key Docs

- `README.md` — Quick start
- `PRD.md` / `PROGRESS.md` — Requirements & status
- `docs/STRIPE_SETUP.md`, `docs/EMAIL_SETUP.md`, `docs/BACKEND_SETUP.md`, `docs/CLOUDFLARE_SETUP.md`, `docs/AD_SYSTEM.md`

## Static baseline + database

Every public page renders its complete content from repo data (`src/data`,
`src/content`) on the first render, and live sources (CoinGecko via
`/api/coingecko`, Supabase) load on top with loading, error and stale states.
Nothing fabricated is ever shown as real data: no `Math.random()` figures, no
invented ratings, counts or testimonials. Volatile facts carry a visible
`lastVerified` date.

- **Accounts switch**: `STATIC_MODE` is derived from `VITE_ACCOUNTS_ENABLED`
  (unset = accounts off). Gated routes use `FeatureGate`, which also checks
  `isSupabaseConfigured()`, `src/config/features.ts` and the database schema
  version (`app_meta`) before showing an account feature; otherwise the
  feature's `ComingSoon` page (noindexed, with a waitlist) renders.
  `rebuild/REBUILD_GUIDE.md` is the go-live checklist.
- **Blog**: `scripts/export-blog.mjs` (runs as `prebuild`) snapshots published
  posts from Supabase into `src/content/blog/snapshot.json`; pages render the
  snapshot first and merge live rows. It never fails a build.

## Prerendering (SEO/GEO)

`pnpm run build` = typecheck, browser bundle, SSR bundle
(`src/entry-server.tsx`), then `scripts/prerender.mjs`, which writes real HTML
for every public route (guides, course modules, compare pages, curated coins,
snapshot blog posts) plus `404.html`, `_shell.html` and `sitemap.xml`. The
browser hydrates prerendered pages (`main.tsx`).

Rules for page code, enforced in CI with `PRERENDER_STRICT=1`:
- Exactly one `<h1>`, a `<PageSEO>`/`<SEO>`, and titles <= 60 characters
  including the " | Bitcoinvestments" suffix (base title <= 41), descriptions
  <= 160.
- Render the H1, summary and content on the first render; show skeletons only
  inside data sections, never an early-return spinner.
- No `window`, `document`, `localStorage` or `matchMedia` during render or at
  module scope - only in effects and handlers.
- Unknown ids render `<NotFound />`, never `<Navigate>` to a parent.
- Noindex rules live in `src/lib/index-pruning.ts` and `public/_headers`;
  `RouteHead` applies route defaults for pages without `<SEO>`.
- `functions/{blog,coin,scam,sponsored,admin}/[[path]].ts` serve routes that
  are not prerendered (a real `404.html` disables the SPA fallback).
- `public/llms.txt` and `ai.txt` are checked by `pnpm run audit:routes`.

## No Web3

Wallet connection was removed: the site runs as static content (`STATIC_MODE`),
and the wagmi / RainbowKit / viem / siwe / alchemy / solana stack was entirely
unreachable — never mounted, shipping zero bytes. Removed with it were the Node
polyfills in `vite.config.ts` (they existed only for those libraries) and the
wallet RPC hosts in the `_headers` CSP. Do not reintroduce a wallet dependency
without a mounted entry point and the CSP and polyfill config to match.

## Lint Policy

`eslint.config.js` splits findings deliberately: **errors** are defects and gate
CI; **warnings** are tracked tech debt. There are currently 0 errors and ~230
warnings, dominated by `no-explicit-any` and the React Compiler rules. Each
demoted rule carries a comment saying what it takes to promote it back.

## Known Gaps

- Test coverage — Playwright is wired up but there are no unit tests
- ~230 lint warnings to burn down (see Lint Policy above)
- `@sentry/react` is a dependency but `Sentry.init` is never called, so error
  monitoring is not actually running
- `AdvisorDashboard` still has no data model and is kept dark via
  `src/config/features.ts`
- Accounts are off until the owner applies the 2026-09 migrations and sets
  `VITE_ACCOUNTS_ENABLED` (see `rebuild/REBUILD_GUIDE.md`)
- Owner-only facts are marked `NEEDS-OWNER` in code (author bylines, affiliate
  IDs, sponsorships, legal entity); see `docs/page-review/ACTION_PLAN.md`
- `Claude.md` and `claude.md` are byte-identical and differ only in case, which
  collides on case-insensitive filesystems — worth consolidating to one
- API docs (OpenAPI), i18n
