# Bitcoin Investments

A comprehensive cryptocurrency education and investment platform built with React, TypeScript, and Vite. Features real-time market data, portfolio tracking, educational content, premium memberships, and self-hosted advertising.

## 🚀 Features

### Core Functionality
- ✅ **Real-time Market Data** - Live prices, market cap, Fear & Greed Index
- ✅ **Portfolio Tracker** - Track holdings with P/L calculations, cloud sync for premium users
- ✅ **Investment Calculators** - DCA, Tax Impact, Fee Comparison, Staking Rewards
- ✅ **Platform Comparison** - Compare exchanges, wallets, and tax software
- ✅ **Educational Hub** - Comprehensive guides, glossary with 40+ crypto terms
- ✅ **News Aggregator** - Latest crypto news from CryptoCompare API

### Monetization
- ✅ **Premium Memberships** - Stripe integration with 3 tiers (Free, Monthly $9.99, Annual $99.99)
- ✅ **Self-hosted Ad Platform** - Smart ad rotation with performance tracking
- ✅ **Affiliate System** - Track clicks, conversions, and revenue

### User Features
- ✅ **Authentication** - Supabase Auth with email/password
- ✅ **User Profiles** - Preferences, subscription management, price alerts
- ✅ **Newsletter** - Email automation with Resend integration
- ✅ **Cookie Consent** - GDPR-compliant consent management

## 📚 Documentation

- **[Stripe Setup](docs/STRIPE_SETUP.md)** - Complete payment integration guide
- **[Backend Setup](docs/BACKEND_SETUP.md)** - Deploy API functions to Cloudflare Workers
- **[Email Setup](docs/EMAIL_SETUP.md)** - Configure Resend for newsletter automation
- **[Ad System](docs/AD_SYSTEM.md)** - Self-hosted advertising platform guide
- **[Development Progress](progress.md)** - Track feature completion and roadmap

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Cloudflare Workers (Serverless Functions)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Payments**: Stripe (Checkout + Customer Portal)
- **Email**: Resend API
- **APIs**: CoinGecko, CryptoCompare
- **Deployment**: Cloudflare Pages

## 🏃 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([sign up free](https://supabase.com))
- (Optional) Stripe account for payments
- (Optional) Resend account for emails

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Bitcoinvestments
   ```

2. **Install dependencies**

   This project uses **pnpm** (see `packageManager` in `package.json`). The
   `pnpm.overrides` block there pins patched versions of several transitive
   dependencies, and `npm install` would ignore it — reintroducing a set of
   high-severity advisories and writing a competing `package-lock.json`.

   ```bash
   corepack enable
   pnpm install
   ```

3. **Configure environment variables**

   Copy `.env` and fill in your values:
   ```bash
   # Supabase (Required)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

   # APIs (Optional - work without keys)
   VITE_COINGECKO_API_KEY=your-api-key
   VITE_CRYPTOCOMPARE_API_KEY=your-api-key

   # Stripe (Optional - for premium features)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   VITE_STRIPE_PRICE_MONTHLY=price_xxxxx
   VITE_STRIPE_PRICE_ANNUAL=price_xxxxx

   # Resend (Optional - for newsletters)
   VITE_RESEND_API_KEY=re_xxxxx
   VITE_FROM_EMAIL=hello@yourdomain.com
   ```

4. **Set up Supabase database**

   Run the SQL schema in `supabase/schema.sql` in your Supabase SQL Editor:
   ```bash
   # Or use Supabase CLI
   supabase db push
   ```

5. **Start development server**
   ```bash
   pnpm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Building for Production

### Build the project

```bash
pnpm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview production build locally

```bash
pnpm run preview
```

## 🌐 Deployment

### Deploy to Cloudflare Pages

1. **Build your project**
   ```bash
   pnpm run build
   ```

2. **Deploy using Wrangler**
   ```bash
   pnpm run deploy
   ```

   Or connect via GitHub:
   - Go to [Cloudflare Dashboard > Pages](https://dash.cloudflare.com)
   - Click **Create a project**
   - Connect your GitHub repository
   - Build settings:
     - Build command: `pnpm run build`
     - Build output directory: `dist`

3. **Configure environment variables**

   In Cloudflare Dashboard > Settings > Environment variables, add:
   - All `VITE_*` variables from `.env`
   - Backend secrets (see [Backend Setup](docs/BACKEND_SETUP.md))

4. **Set up custom domain** (optional)

   In Cloudflare Dashboard > Custom domains, add your domain.

### Backend API Setup

The Stripe payment system requires backend API functions. See [Backend Setup Guide](docs/BACKEND_SETUP.md) for detailed instructions.

Quick summary:
1. Set backend environment variables in Cloudflare
2. Deploy functions in `functions/api/` directory
3. Configure Stripe webhooks

## 🧪 Testing

### Test Stripe Integration (Test Mode)

1. Visit `/pricing` page
2. Click "Subscribe Monthly"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date (e.g., 12/34)
5. Any 3-digit CVC (e.g., 123)

### Test Portfolio Tracker

1. Sign up or log in
2. Go to Dashboard
3. Click "Add Holding"
4. Add Bitcoin with test amounts
5. Check P/L calculations update

## 📊 Project Structure

```
Bitcoinvestments/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React Context (Auth, etc.)
│   ├── pages/          # Page components (routes)
│   ├── services/       # API clients and business logic
│   ├── types/          # TypeScript type definitions
│   └── data/           # Static data (guides, comparisons)
├── functions/
│   └── api/            # Cloudflare Workers API endpoints
├── docs/               # Documentation
├── supabase/           # Database schema and migrations
├── public/             # Static assets
└── dist/               # Production build (generated)
```

## 🔧 Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint
- `pnpm run deploy` - Build and deploy to Cloudflare Pages
- `pnpm run dev:wrangler` - Test with Cloudflare Workers locally
- `npm run cf:tail` - View Cloudflare Workers logs

## 💰 Monetization Setup

### 1. Premium Memberships (Stripe)

See [Stripe Setup Guide](docs/STRIPE_SETUP.md) for complete instructions.

Revenue potential:
- 1,000 users: ~$1,900/month
- 10,000 users: ~$19,000/month
- 100,000 users: ~$190,000/month

### 2. Self-hosted Advertising

See [Ad System Guide](docs/AD_SYSTEM.md) for complete instructions.

Revenue potential:
- 10,000 monthly visitors: $500-2,000/month
- 100,000 monthly visitors: $3,500-10,000/month

### 3. Affiliate Partnerships

Track affiliate revenue in the Affiliate Stats dashboard (`/affiliate-stats`).

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting pull requests.

## 📄 License

[MIT License](LICENSE)

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: See `docs/` folder
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Cloudflare Dashboard**: https://dash.cloudflare.com

## 🆘 Support

- **Documentation**: Check the `docs/` folder
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🎯 Roadmap

See [progress.md](progress.md) for detailed feature tracking.

### Completed (~85%)
- ✅ Core UI/UX and design system
- ✅ Authentication and user profiles
- ✅ Real-time market data dashboard
- ✅ Portfolio tracker with cloud sync
- ✅ All 4 investment calculators
- ✅ Platform comparison engine
- ✅ Educational content and guides
- ✅ Stripe payment integration
- ✅ Self-hosted ad platform
- ✅ Affiliate tracking system
- ✅ Newsletter automation

### In Progress (~5%)
- 🔨 Backend API deployment
- 🔨 Automated weekly newsletters
- 🔨 Additional educational content

### Planned (~10%)
- 📋 Community features (Forum, Q&A)
- 📋 Premium content (research reports, webinars)
- 📋 Video tutorial library
- 📋 Advanced analytics integration
- 📋 Mobile app
- 📋 AI-powered features

## 🙏 Acknowledgments

- **APIs**: CoinGecko, CryptoCompare
- **UI Icons**: Lucide React
- **Animations**: GSAP
- **Markdown**: react-markdown

---

**Built with ❤️ for the crypto community**
