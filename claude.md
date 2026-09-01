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
- `src/services/cryptoScamDbSync.ts` has no consumers (dead code)
- `@sentry/react` is a dependency but `Sentry.init` is never called, so error
  monitoring is not actually running
- Several dashboards render hardcoded sample data behind a simulated delay
  (`AdminSubscriptions`, `AdminNewsletters`, `AdvisorDashboard`,
  `InfluencerDashboard`). They show a `DemoDataBanner`; delete the banner in
  the same change that connects the real data source.
- `STATIC_MODE` (`src/config/staticMode.ts`) is `true`, so auth and all
  database-backed features are disabled and protected routes render ComingSoon
- `Claude.md` and `claude.md` are byte-identical and differ only in case, which
  collides on case-insensitive filesystems — worth consolidating to one
- API docs (OpenAPI), i18n
