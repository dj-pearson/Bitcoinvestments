# Bitcoinvestments - Claude Code Project Guide

## Project Overview

**Bitcoinvestments** is a comprehensive cryptocurrency education and investment platform designed to help beginners and intermediate investors learn about crypto, track portfolios, access educational content, and discover the best tools in the ecosystem.

**Target Users**: Crypto-curious individuals aged 25-55 seeking trustworthy entry points into cryptocurrency.

## Current Status: ~93% Complete

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18.3.1 + TypeScript 5.9.3 + Vite 7.2.4 |
| **Styling** | TailwindCSS 3.4.18 + Custom CSS utilities |
| **Animations** | Framer Motion + GSAP |
| **Charts** | Chart.js + react-chartjs-2 |
| **Web3** | RainbowKit + Wagmi + Viem + ethers.js |
| **Database** | Supabase (PostgreSQL with RLS) |
| **Backend** | Cloudflare Workers (serverless) |
| **Hosting** | Cloudflare Pages |
| **Payments** | Stripe |
| **Email** | Resend + MailChannels API |
| **Monitoring** | Sentry |

## Project Structure

```
/home/user/Bitcoinvestments/
├── src/
│   ├── pages/           # 60+ page components
│   ├── components/      # 60+ reusable components
│   ├── services/        # 95+ business logic modules
│   ├── contexts/        # AuthContext, ToastContext
│   ├── hooks/           # 12+ custom React hooks
│   ├── lib/             # Utilities (seo, validation, wagmi, supabase)
│   ├── types/           # TypeScript definitions
│   ├── data/            # Static data (guides, exchanges, wallets)
│   ├── App.tsx          # Main router (100+ routes)
│   └── main.tsx         # Entry point
├── functions/api/       # Cloudflare Workers API endpoints
├── workers/             # Scheduled cron workers
├── docs/                # 8+ comprehensive guides
├── supabase/            # Database schema & migrations
└── dist/                # Production build
```

## Completed Features

### Core Platform
- Authentication (email/password + Web3 wallet via SIWE)
- Live dashboard with real-time crypto prices
- Portfolio tracker with cloud sync and performance charts
- Web3 wallet integration (MetaMask, WalletConnect, Coinbase Wallet)
- Multi-chain support (Ethereum, Polygon, Arbitrum, Optimism)

### Educational Content
- 10+ beginner guides with markdown rendering
- Crypto glossary (40+ terms, searchable)
- Interactive courses and video library
- Platform comparisons (exchanges, wallets, tax software)

### Investment Tools
- DCA Calculator with historical simulation
- Fee Comparison Calculator
- Tax Impact Estimator
- Staking Rewards Calculator
- Retirement Calculator
- Backtesting tools
- Technical indicators

### Monetization
- Stripe subscriptions (Free, Monthly $9.99, Annual $99.99)
- Self-hosted ad platform with smart rotation and analytics
- Affiliate tracking system with dashboard
- Newsletter system with automated weekly digest

### Community Features
- Q&A Forum with moderation
- Scam database with community reporting
- Success stories section
- AMA sessions

### Admin Features
- Admin dashboard with analytics
- User management
- Content moderation
- Support ticket system
- Audit logs

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/create-checkout-session` | Stripe payment session |
| `/api/create-portal-session` | Customer portal |
| `/api/stripe-webhook` | Stripe event handling |
| `/api/check-price-alerts` | Price alert checker (cron) |
| `/api/send-newsletter` | Weekly newsletter (cron) |
| `/api/send-email` | Generic email sending |
| `/api/coingecko/*` | CoinGecko API proxy |

## Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Run ESLint

# Deployment
npm run deploy           # Deploy to Cloudflare Pages
npm run deploy:cron      # Deploy price alert cron
npm run deploy:newsletter # Deploy newsletter cron
npm run deploy:all       # Deploy everything

# Monitoring
npm run cf:tail          # View Cloudflare logs
npm run cron:tail        # View cron worker logs
```

## Environment Variables

### Frontend (VITE_*)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_COINGECKO_API_KEY` (optional)
- `VITE_CRYPTOCOMPARE_API_KEY` (optional)
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_MONTHLY`
- `VITE_STRIPE_PRICE_ANNUAL`

### Backend (Cloudflare Workers)
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `PAGES_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Recent Improvements (January 2026)

### Performance Optimizations
- **Extended Lazy Loading** - Dashboard, Learn, Compare, and Calculators pages now lazy-loaded
- **Web Vitals Monitoring** - Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
- **Route Prefetching** - PrefetchLink component for faster navigation on hover/focus
- **Smart Preloading** - Common routes prefetched during idle time

### Security Enhancements
- CORS configuration with strict origin validation
- Content Security Policy (CSP) headers
- Hardened API endpoints

### Mobile Optimization
- Responsive design improvements
- Touch-friendly interactions
- Mobile-first navigation

### Build & Deployment
- TypeScript build errors resolved
- Bundle size optimized with code splitting
- Build time: ~77 seconds

## Key Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview and quick start |
| `PRD.md` | Product requirements document |
| `PROGRESS.md` | Feature completion status |
| `docs/STRIPE_SETUP.md` | Payment integration guide |
| `docs/EMAIL_SETUP.md` | Email configuration |
| `docs/BACKEND_SETUP.md` | Cloudflare Workers setup |
| `docs/CLOUDFLARE_SETUP.md` | Deployment guide |
| `docs/AD_SYSTEM.md` | Ad platform documentation |

## Areas for Improvement

### High Priority
1. **Test Coverage** - Only Playwright configured, needs unit tests
2. **Performance Optimization** - Large bundle size, needs code splitting
3. **Error Handling** - Needs React Error Boundaries and better UX

### Medium Priority
4. **SEO Improvements** - Structured data, meta tags, sitemap
5. **Accessibility** - WCAG compliance, ARIA labels
6. **Code Organization** - Services directory could use subdirectories

### Lower Priority
7. **API Documentation** - OpenAPI/Swagger specs
8. **Internationalization** - i18n framework for global expansion
9. **Advanced Analytics** - A/B testing framework

## Performance Metrics

- **Build Time**: ~83 seconds
- **Bundle Size**: 3.8MB (991KB gzipped)
- **API Response**: <500ms (Cloudflare cached)
- **Database Queries**: <100ms (with RLS)

## Database Tables (with RLS)

- `users` - User accounts and profiles
- `portfolios` - Portfolio metadata
- `holdings` - Cryptocurrency holdings
- `transactions` - Buy/sell transactions
- `price_alerts` - Price alert targets
- `articles` - Educational content
- `newsletter_subscribers` - Email subscribers
- `advertisements` - Ad campaigns
- `affiliate_clicks` - Referral tracking
- `forum_posts` - Q&A discussions
- `platform_reviews` - User reviews
- `audit_logs` - System activity
- `support_tickets` - Customer support

---

**Last Updated**: January 2026
**Completion**: ~93%
**Status**: Production Ready
