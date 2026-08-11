# Bitcoinvestments - Claude Code Project Guide

Cryptocurrency education and investment platform for beginner-to-intermediate investors (ages 25-55). Provides portfolio tracking, educational content, calculators, and platform comparisons.

## Tech Stack

- **Frontend**: React 18 + TypeScript 5 + Vite 7, TailwindCSS, Framer Motion, Chart.js
- **Web3**: RainbowKit + Wagmi + Viem + ethers.js (Ethereum, Polygon, Arbitrum, Optimism)
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
├── lib/           # seo, validation, wagmi, supabase clients
├── data/          # Static data (guides, exchanges, wallets)
└── App.tsx        # Router (100+ routes)
functions/api/     # Cloudflare Workers endpoints
workers/           # Scheduled cron workers
supabase/          # DB schema & migrations
docs/              # Setup guides
```

## Commands

```bash
npm run dev               # Dev server
npm run build             # Production build
npm run lint              # ESLint
npm run deploy            # Deploy to Cloudflare Pages
npm run deploy:cron       # Deploy price-alert cron
npm run deploy:newsletter # Deploy newsletter cron
npm run deploy:all        # Deploy everything
npm run cf:tail           # Tail Cloudflare logs
npm run cron:tail         # Tail cron worker logs
```

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

- **Auth**: Email/password + Web3 (SIWE)
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

## Known Gaps

- Test coverage (only Playwright wired up; no unit tests)
- React error boundaries
- Bundle size / code splitting
- SEO structured data, WCAG accessibility
- API docs (OpenAPI), i18n
