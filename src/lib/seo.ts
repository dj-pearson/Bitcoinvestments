/**
 * Centralized SEO Configuration and Utilities
 *
 * This module provides:
 * - Site-wide SEO constants
 * - Page metadata generators for programmatic SEO
 * - Schema.org generators
 * - Internal linking utilities
 */

// ============================================
// Site Configuration
// ============================================

export const SEO_CONFIG = {
  siteName: 'Bitcoinvestments',
  siteUrl: 'https://bitcoinvestments.net',
  defaultDescription:
    'Learn how to invest in Bitcoin and cryptocurrency safely. Compare exchanges, wallets, and get educational guides for beginners.',
  defaultImage: '/og-image.png',
  locale: 'en_US',
  themeColor: '#f97316',
} as const;

// ============================================
// Page Metadata Definitions (Programmatic SEO)
// ============================================

export interface PageMeta {
  title: string;
  description: string;
  keywords: string[];
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Static page metadata for all main pages
 * Used for consistent SEO across the site
 */
export const PAGE_METADATA: Record<string, PageMeta> = {
  home: {
    title: 'Learn to Invest in Bitcoin Safely',
    description:
      'Free, plain-English guides to buying, storing and investing in Bitcoin safely, plus calculators, exchange comparisons and a crypto scam checker.',
    keywords: [
      'how to invest in Bitcoin',
      'learn to invest in Bitcoin safely',
      'Bitcoin for beginners',
      'cryptocurrency for beginners',
      'crypto scam checker',
      'DCA calculator',
      'exchange comparison',
      'crypto education',
    ],
  },
  dashboard: {
    title: 'Crypto Prices Today: Top 100 Coins',
    description:
      'Live prices, 24h change and market cap for the top 100 cryptocurrencies from CoinGecko, plus a Bitcoin chart, gas fees and a private portfolio tracker.',
    keywords: [
      'crypto prices today',
      'cryptocurrency prices',
      'crypto market cap',
      'Bitcoin price',
      'Ethereum price',
      'top 100 cryptocurrencies',
      'crypto portfolio tracker',
      'bitcoin dominance',
    ],
  },
  charts: {
    title: 'Crypto Price Charts & Coin Comparison',
    description:
      'Free interactive crypto price charts from 24 hours to 1 year. Compare up to 8 coins on one chart and see each coin’s change, high, low and max drawdown.',
    keywords: [
      'crypto charts',
      'Bitcoin price chart',
      'cryptocurrency price chart',
      'compare crypto performance',
      'BTC vs ETH chart',
      'historical crypto prices',
      'max drawdown',
    ],
  },
  calculators: {
    title: 'Crypto Calculators: DCA, Tax & Fees',
    description:
      'Free crypto calculators: DCA backtest on real BTC, ETH and SOL prices, 2025/2026 capital gains tax, exchange fees, staking and a live price converter.',
    keywords: [
      'DCA calculator',
      'crypto calculator',
      'staking calculator',
      'Bitcoin calculator',
      'crypto tax calculator',
      'trading fee calculator',
      'dollar cost averaging calculator',
      'investment calculator',
      'crypto profit calculator',
    ],
  },
  compare: {
    title: 'Best Crypto Exchanges & Wallets (2026)',
    description:
      'Crypto exchanges and wallets compared: real costs of a $100 and $1,000 bitcoin buy, fees verified Sept 2026, hardware wallet specs and our scoring method.',
    keywords: [
      'crypto exchange comparison',
      'best crypto exchange',
      'wallet comparison',
      'exchange fees comparison',
      'Coinbase vs Kraken',
      'best Bitcoin wallet',
      'exchange reviews',
      'crypto platform comparison',
    ],
  },
  learn: {
    title: 'Learn Cryptocurrency - Free Guides & Courses',
    description:
      'Free cryptocurrency education from blockchain basics to advanced trading strategies. Beginner-friendly guides, courses, and tutorials for Bitcoin and crypto investing.',
    keywords: [
      'learn cryptocurrency',
      'crypto education',
      'Bitcoin guide',
      'blockchain basics',
      'crypto for beginners',
      'trading course',
      'DeFi tutorial',
      'crypto tutorials',
      'investment guide',
    ],
  },
  glossary: {
    title: 'Cryptocurrency Glossary - 300+ Crypto Terms Explained',
    description:
      'Comprehensive cryptocurrency glossary with 300+ terms explained in plain English. From HODL to DeFi, understand every crypto term and concept.',
    keywords: [
      'crypto glossary',
      'cryptocurrency terms',
      'Bitcoin glossary',
      'blockchain terminology',
      'crypto dictionary',
      'DeFi terms',
      'trading terms',
      'crypto jargon',
      'crypto vocabulary',
    ],
  },
  scamDatabase: {
    title: 'Crypto Scam Checker & Scam Types Guide',
    description:
      'Check a crypto wallet or website before you send, learn how 11 common crypto scams work, see FBI IC3 loss data, and know what to do if you are scammed.',
    keywords: [
      'crypto scam database',
      'cryptocurrency scams',
      'scam checker',
      'rug pull checker',
      'phishing scams',
      'Bitcoin scams',
      'scam report',
      'crypto fraud',
      'wallet address checker',
    ],
  },
  pricing: {
    title: 'Pricing & Plans',
    description:
      'Everything on Bitcoinvestments is free today: guides, calculators, comparisons and the scam database. See what Premium will add and join the waitlist.',
    keywords: [
      'Bitcoinvestments pricing',
      'is Bitcoinvestments free',
      'crypto education free',
      'premium crypto tools',
    ],
  },
  backtesting: {
    title: 'Bitcoin Backtest: Lump Sum vs DCA',
    description:
      'What if you had invested in Bitcoin? Backtest lump sum vs DCA for BTC and ETH since 2014 on weekly price history, with drawdowns and XIRR returns.',
    keywords: [
      'crypto backtesting',
      'trading strategy test',
      'DCA backtest',
      'Bitcoin backtest',
      'investment simulator',
      'strategy optimization',
      'historical analysis',
    ],
  },
  stakingCalculator: {
    title: 'Crypto Staking Rewards Calculator',
    description:
      'Estimate staking rewards for ETH, SOL, ADA, DOT and ATOM with dated typical APY ranges, correct compounding, lockup notes and staking tax basics.',
    keywords: [
      'staking calculator',
      'crypto staking rewards',
      'APY calculator',
      'Ethereum staking',
      'staking yields',
      'passive income crypto',
      'proof of stake rewards',
    ],
  },
  retirementCalculator: {
    title: 'Crypto Retirement Calculator',
    description:
      'Model crypto in your retirement plan: Monte Carlo success odds, today\'s-dollar projections, 2026 tax brackets, Social Security and what-if scenarios.',
    keywords: [
      'crypto retirement calculator',
      'Bitcoin retirement',
      'retirement planning crypto',
      'FIRE calculator',
      'financial independence',
      'retirement savings crypto',
    ],
  },
  whaleTracking: {
    title: 'Bitcoin Whale Tracking Explained',
    description:
      'See the largest transactions in the latest Bitcoin blocks, learn how to track whales yourself, and why big transfers rarely mean what headlines claim.',
    keywords: [
      'whale tracking',
      'bitcoin whale transactions',
      'crypto whale',
      'large bitcoin transactions',
      'whale alert',
      'block explorer',
    ],
  },
  tradingIndicators: {
    title: 'Crypto Indicators: RSI, MACD & Bollinger',
    description:
      'Free live RSI, MACD, Bollinger Bands, SMA, EMA and Stochastic readings for Bitcoin, Ethereum and Solana, with plain-English guides to each indicator.',
    keywords: [
      'crypto indicators',
      'bitcoin RSI',
      'MACD crypto',
      'Bollinger Bands',
      'moving average',
      'technical analysis',
    ],
  },
  onChainAnalytics: {
    title: 'Bitcoin On-Chain Metrics Explained',
    description:
      'Live Bitcoin hashrate, difficulty, fees, mempool, transaction and address counts from public sources, with what each metric means and its limits.',
    keywords: [
      'on-chain analytics',
      'bitcoin on-chain metrics',
      'bitcoin hashrate',
      'bitcoin fees',
      'mempool',
      'active addresses',
    ],
  },
  defiYield: {
    title: 'DeFi Yields & Impermanent Loss Calculator',
    description:
      'Current DeFi yields on Aave, Lido, Curve, Uniswap and more from DefiLlama, what drives APY, and a free impermanent loss calculator for liquidity pools.',
    keywords: [
      'DeFi yield',
      'yield farming',
      'liquidity mining',
      'APY comparison',
      'DeFi protocols',
      'passive income DeFi',
      'yield optimization',
    ],
  },
  gasOptimizer: {
    title: 'Gas Fee Tracker: Ethereum, L2s & Bitcoin',
    description:
      'Live gas prices for Ethereum, Arbitrum, Base and other chains with the dollar cost of common actions, Bitcoin fee rates, and how EIP-1559 fees work.',
    keywords: [
      'gas optimizer',
      'Ethereum gas',
      'gas fees',
      'transaction fees',
      'gas tracker',
      'save gas fees',
      'ETH gas price',
    ],
  },
  hardwareWallet: {
    title: 'Hardware Wallet Comparison (2026)',
    description:
      'Ledger vs Trezor and other hardware wallets compared: current models, list prices, secure elements, open-source firmware and connectivity, checked Sept 2026.',
    keywords: [
      'hardware wallet',
      'Ledger wallet',
      'Trezor wallet',
      'cold storage',
      'crypto security',
      'secure wallet',
      'offline wallet',
    ],
  },
  multiExchange: {
    title: 'Track Crypto Across Exchanges',
    description:
      'How to track crypto held on several exchanges safely: manual tracking, CSV exports and read-only API keys. Automatic exchange syncing is not available.',
    keywords: [
      'track crypto multiple exchanges',
      'read-only API key',
      'crypto portfolio tracker',
      'exchange CSV export',
    ],
  },
  dcaAutomation: {
    title: 'DCA Planner & Recurring Buy Guide',
    description:
      'Plan a crypto DCA schedule: total invested, number of buys, fee drag and purchase dates, plus calendar reminders and how to set up recurring buys.',
    keywords: [
      'DCA planner',
      'recurring crypto buy',
      'bitcoin DCA schedule',
      'dollar cost averaging crypto',
      'auto invest bitcoin',
      'DCA fees',
    ],
  },
  rebalancingAlerts: {
    title: 'Crypto Rebalancing Calculator',
    description:
      'Free crypto rebalancing calculator: enter holdings and target weights to see drift and exact buy/sell amounts, with threshold bands and buy-only mode.',
    keywords: [
      'crypto rebalancing calculator',
      'portfolio rebalancing',
      'rebalancing bands',
      'asset allocation',
      'portfolio drift',
      'threshold rebalancing',
    ],
  },
  alertBundles: {
    title: 'Free Crypto Price Alerts',
    description:
      'Set free crypto price alerts in your browser: get notified when a coin goes above or below a price or moves by a set percentage while the tab is open.',
    keywords: [
      'crypto price alerts',
      'bitcoin price alert',
      'price notification',
      'crypto alert app',
      'golden cross alert',
      'RSI alert',
    ],
  },
  lending: {
    title: 'Crypto Lending Rates: CeFi vs DeFi',
    description:
      'Current DeFi lending rates on Aave, Compound, Morpho and Spark, plus what the Celsius, BlockFi and Voyager collapses teach about CeFi lending risk.',
    keywords: [
      'crypto lending',
      'lending rates',
      'earn interest crypto',
      'Bitcoin lending',
      'stablecoin interest',
      'lending platforms',
    ],
  },
  socialTrading: {
    title: 'Copy Trading Crypto Explained',
    description:
      'How crypto copy trading works, where US residents can use it, what it costs, and the risks: leverage, survivorship bias and lag. Includes a vetting checklist.',
    keywords: [
      'copy trading',
      'crypto copy trading',
      'social trading',
      'copy trading risks',
      'eToro CopyTrader',
      'survivorship bias',
    ],
  },
  influencerVerification: {
    title: 'How to Vet a Crypto Influencer',
    description:
      'A checklist for judging crypto influencers: paid-promotion disclosure rules, SEC anti-touting cases, how to check a track record, and pump-and-dump red flags.',
    keywords: [
      'crypto influencer',
      'crypto influencer scams',
      'SEC touting',
      'FTC disclosure #ad',
      'pump and dump crypto',
      'influencer track record',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    description:
      'What Bitcoinvestments collects, which services see your data (Cloudflare, CoinGecko, Supabase, Google Analytics and more), browser storage and your rights.',
    keywords: [
      'privacy policy',
      'data protection',
      'GDPR',
      'CCPA',
      'cookies',
    ],
  },
  terms: {
    title: 'Terms of Service',
    description:
      'The terms for using Bitcoinvestments: educational use, no financial advice, affiliate links, planned paid plans and API, liability and how to contact us.',
    keywords: [
      'terms of service',
      'terms and conditions',
      'user agreement',
      'legal',
    ],
  },
  login: {
    title: 'Login to Your Account',
    description:
      'Login to your Bitcoinvestments account to access your portfolio, alerts, and personalized crypto tools.',
    keywords: ['login', 'sign in', 'account access', 'crypto account'],
  },
  signup: {
    title: 'Create Your Free Account',
    description:
      'Sign up for a free Bitcoinvestments account. Get access to portfolio tracking, price alerts, and crypto education.',
    keywords: ['sign up', 'create account', 'register', 'free account', 'crypto tools'],
  },
  forgotPassword: {
    title: 'Reset Your Password',
    description: 'Reset your Bitcoinvestments account password. We will send you a secure link to create a new password.',
    keywords: ['forgot password', 'reset password', 'password recovery'],
  },
  blog: {
    title: 'Crypto Blog - News, Analysis & Education',
    description:
      'Plain-English crypto news analysis for everyday investors: Bitcoin, Ethereum, DeFi, security and regulation, linked to our free guides and calculators.',
    keywords: [
      'crypto blog',
      'cryptocurrency news',
      'Bitcoin analysis',
      'crypto market update',
      'DeFi news',
      'blockchain education',
      'crypto insights',
      'market analysis',
      'crypto trends',
    ],
  },
  developerPortal: {
    title: 'Developer Portal - API Documentation & Integration',
    description:
      'Access the Bitcoinvestments API for cryptocurrency data, scam database lookups, and portfolio tools. Comprehensive documentation for developers.',
    keywords: [
      'crypto API',
      'cryptocurrency data API',
      'developer documentation',
      'API integration',
      'scam database API',
      'price data API',
      'blockchain API',
    ],
  },
  apiPricing: {
    title: 'Developer API',
    description:
      'The Bitcoinvestments developer API: the endpoints that exist today, how authentication and rate limits work, and how to join the waitlist for keys.',
    keywords: [
      'crypto price API',
      'Bitcoinvestments API',
      'cryptocurrency API',
      'developer API',
    ],
  },
  accessibility: {
    title: 'Accessibility Statement',
    description:
      'How accessible Bitcoinvestments is today: our WCAG 2.2 AA target, known issues, the display settings you can change and how to report a barrier.',
    keywords: [
      'accessibility statement',
      'WCAG 2.2',
      'screen reader',
      'high contrast',
      'reduced motion',
    ],
  },
  about: {
    title: 'About Us & Editorial Policy',
    description:
      'Who runs Bitcoinvestments, how we research and update our guides, how we make money from affiliate links and sponsorships, and how to report a mistake.',
    keywords: [
      'about Bitcoinvestments',
      'editorial policy',
      'affiliate disclosure',
      'corrections policy',
    ],
  },
  disclaimer: {
    title: 'Disclaimer & Affiliate Disclosure',
    description:
      'Bitcoinvestments is educational, not financial advice. Read the risks of crypto investing, how our affiliate links and sponsored content work, and our limits.',
    keywords: [
      'not financial advice',
      'crypto risk disclaimer',
      'affiliate disclosure',
      'sponsored content',
    ],
  },
  reportScam: {
    title: 'How to Report a Crypto Scam',
    description:
      'Step-by-step guide to reporting a crypto scam to the FBI IC3, FTC, SEC, CFTC and your exchange, what evidence to keep, and how to avoid recovery scams.',
    keywords: [
      'how to report a crypto scam',
      'report crypto scam',
      'report bitcoin scam',
      'IC3 crypto complaint',
      'crypto scam recovery',
      'crypto fraud report',
    ],
  },
};

// ============================================
// Schema.org Generators
// ============================================

/**
 * Generate Organization schema (for homepage)
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}/logo.png`,
    // See the note in src/components/SEO.tsx — only assert profiles that exist.
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@bitcoinvestments.net',
      contactType: 'customer support',
    },
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SEO_CONFIG.siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema({
  title,
  description,
  url,
  dateModified,
}: {
  title: string;
  description: string;
  url: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: url.startsWith('http') ? url : `${SEO_CONFIG.siteUrl}${url}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
    },
    ...(dateModified && { dateModified }),
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SEO_CONFIG.siteUrl}${item.url}`,
    })),
  };
}

/**
 * Generate SoftwareApplication schema (for tools/calculators)
 */
export function generateToolSchema({
  name,
  description,
  url,
  category = 'FinanceApplication',
}: {
  name: string;
  description: string;
  url: string;
  category?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url: url.startsWith('http') ? url : `${SEO_CONFIG.siteUrl}${url}`,
    applicationCategory: category,
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
    },
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Product schema for exchanges/wallets
 */
export function generateProductSchema({
  name,
  description,
  image,
  rating,
  reviewCount,
  url,
  brand,
}: {
  name: string;
  description: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  url: string;
  brand?: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url: url.startsWith('http') ? url : `${SEO_CONFIG.siteUrl}${url}`,
    ...(image && { image }),
    ...(brand && {
      brand: {
        '@type': 'Brand',
        name: brand,
      },
    }),
  };

  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: reviewCount,
    };
  }

  return schema;
}

/**
 * Generate FinancialProduct schema for exchanges
 */
export function generateExchangeSchema({
  name,
  description,
  url,
  rating,
  reviewCount,
  fees,
}: {
  name: string;
  description: string;
  url: string;
  rating?: number;
  reviewCount?: number;
  fees?: { maker: number; taker: number };
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name,
    description,
    url: url.startsWith('http') ? url : `${SEO_CONFIG.siteUrl}${url}`,
    provider: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
    },
    ...(fees && {
      feesAndCommissionsSpecification: `Maker fee: ${(fees.maker * 100).toFixed(2)}%, Taker fee: ${(fees.taker * 100).toFixed(2)}%`,
    }),
  };

  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: reviewCount,
    };
  }

  return schema;
}

/**
 * Generate ItemList schema for comparison pages
 */
export function generateItemListSchema({
  name,
  description,
  items,
}: {
  name: string;
  description: string;
  items: Array<{ name: string; url: string; position: number }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${SEO_CONFIG.siteUrl}${item.url}`,
    })),
  };
}

/**
 * Generate Course schema for educational content
 */
export function generateCourseSchema({
  name,
  description,
  url,
  provider,
}: {
  name: string;
  description: string;
  url: string;
  provider?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    url: url.startsWith('http') ? url : `${SEO_CONFIG.siteUrl}${url}`,
    provider: {
      '@type': 'Organization',
      name: provider || SEO_CONFIG.siteName,
      sameAs: SEO_CONFIG.siteUrl,
    },
  };
}

/**
 * Generate HowTo schema for guides
 */
export function generateHowToSchema({
  name,
  description,
  steps,
  totalTime,
  image,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  totalTime?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(image && { image }),
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/**
 * Generate Article schema
 */
export function generateArticleSchema({
  title,
  description,
  image,
  author,
  publishedDate,
  modifiedDate,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`,
    author: {
      '@type': 'Organization',
      name: author || SEO_CONFIG.siteName,
    },
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${SEO_CONFIG.siteUrl}/logo.png`,
      },
    },
    datePublished: publishedDate,
    dateModified: modifiedDate || publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url.startsWith('http') ? url : `${SEO_CONFIG.siteUrl}${url}`,
    },
  };
}

// ============================================
// GEO-Optimized Schema Generators
// ============================================

/**
 * Generate enhanced Organization schema with GEO signals
 * Includes founding date, description, and comprehensive contact info
 */
export function generateEnhancedOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${SEO_CONFIG.siteUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    description:
      'Bitcoinvestments is a comprehensive cryptocurrency education and investment platform for beginners, offering free DCA calculators, exchange comparisons, educational courses, and a community-powered scam database.',
    foundingDate: '2024',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'support@bitcoinvestments.net',
        contactType: 'customer support',
        availableLanguage: 'English',
      },
      {
        '@type': 'ContactPoint',
        email: 'ai@bitcoinvestments.net',
        contactType: 'technical support',
        description: 'AI and data partnership inquiries',
      },
    ],
    knowsAbout: [
      'Bitcoin',
      'Cryptocurrency',
      'Blockchain',
      'DeFi',
      'Dollar Cost Averaging',
      'Crypto Security',
      'Exchange Comparison',
      'Wallet Security',
      'Crypto Scam Prevention',
    ],
  };
}

/**
 * Generate Pricing/Offer schema for pricing pages
 */
export function generatePricingSchema({
  plans,
}: {
  plans: Array<{
    name: string;
    description: string;
    price: string;
    priceCurrency?: string;
    billingPeriod?: string;
    features: string[];
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Bitcoinvestments Pricing',
    description: 'Pricing plans for Bitcoinvestments cryptocurrency tools and premium features.',
    url: `${SEO_CONFIG.siteUrl}/pricing`,
    mainEntity: {
      '@type': 'ItemList',
      name: 'Pricing Plans',
      numberOfItems: plans.length,
      itemListElement: plans.map((plan, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: plan.name,
          description: plan.description,
          offers: {
            '@type': 'Offer',
            price: plan.price,
            priceCurrency: plan.priceCurrency || 'USD',
            ...(plan.billingPeriod && {
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: plan.price,
                priceCurrency: plan.priceCurrency || 'USD',
                billingDuration: plan.billingPeriod,
              },
            }),
          },
          ...(plan.features.length > 0 && {
            additionalProperty: plan.features.map((feature) => ({
              '@type': 'PropertyValue',
              name: 'Feature',
              value: feature,
            })),
          }),
        },
      })),
    },
  };
}

/**
 * Generate DefinedTermSet schema for glossary pages
 * Helps AI engines understand and cite glossary definitions
 */
export function generateGlossarySchema({
  terms,
}: {
  terms: Array<{ term: string; definition: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Cryptocurrency Glossary',
    description: 'Cryptocurrency and blockchain terms explained in plain English.',
    url: `${SEO_CONFIG.siteUrl}/glossary`,
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definition,
    })),
  };
}

/**
 * Generate comprehensive FAQ schema optimized for AI citation
 * Each Q&A is structured for direct extraction by LLMs
 */
export function generateGEOFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
  pageUrl?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(pageUrl && {
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': pageUrl.startsWith('http') ? pageUrl : `${SEO_CONFIG.siteUrl}${pageUrl}`,
      },
    }),
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
        author: {
          '@type': 'Organization',
          name: SEO_CONFIG.siteName,
          url: SEO_CONFIG.siteUrl,
        },
      },
    })),
  };
}

/**
 * Generate comparison/review schema for "vs" pages
 * AI engines heavily favor structured comparison data
 */
export function generateComparisonSchema({
  title,
  description,
  items,
  url,
}: {
  title: string;
  description: string;
  items: Array<{
    name: string;
    description: string;
    rating?: number;
    pros?: string[];
    cons?: string[];
  }>;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    url: url.startsWith('http') ? url : `${SEO_CONFIG.siteUrl}${url}`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        description: item.description,
        ...(item.rating && {
          review: {
            '@type': 'Review',
            reviewRating: {
              '@type': 'Rating',
              ratingValue: item.rating,
              bestRating: 5,
            },
            author: {
              '@type': 'Organization',
              name: SEO_CONFIG.siteName,
            },
            ...(item.pros && {
              positiveNotes: {
                '@type': 'ItemList',
                itemListElement: item.pros.map((pro, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: pro,
                })),
              },
            }),
            ...(item.cons && {
              negativeNotes: {
                '@type': 'ItemList',
                itemListElement: item.cons.map((con, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: con,
                })),
              },
            }),
          },
        }),
      },
    })),
  };
}

// ============================================
// Additional Schema Generators for Rich Results & AI Features
// ============================================

/**
 * Generate EducationalOrganization schema
 * Helps AI engines and Google identify the site as an authoritative educational resource
 */
export function generateEducationalOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SEO_CONFIG.siteUrl}/#educationalOrganization`,
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}/logo.png`,
    description:
      'Bitcoinvestments provides free cryptocurrency education, investment tools, and security resources for beginners learning to invest in Bitcoin and digital assets safely.',
    foundingDate: '2024',
    areaServed: 'Worldwide',
    teaches: [
      'Bitcoin investing fundamentals',
      'Cryptocurrency security best practices',
      'Dollar Cost Averaging strategy',
      'Crypto scam identification and prevention',
      'DeFi yield farming basics',
      'Blockchain technology fundamentals',
      'Exchange and wallet comparison methodology',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Cryptocurrency Education Courses',
      itemListElement: [
        {
          '@type': 'Course',
          name: 'Bitcoin Basics for Beginners',
          description: 'Learn the fundamentals of Bitcoin, blockchain, and how to make your first investment safely.',
          url: `${SEO_CONFIG.siteUrl}/learn`,
          provider: { '@type': 'Organization', name: SEO_CONFIG.siteName },
          isAccessibleForFree: true,
        },
        {
          '@type': 'Course',
          name: 'Crypto Security Masterclass',
          description: 'Learn to protect your cryptocurrency from scams, phishing, and theft.',
          url: `${SEO_CONFIG.siteUrl}/learn`,
          provider: { '@type': 'Organization', name: SEO_CONFIG.siteName },
          isAccessibleForFree: true,
        },
      ],
    },
  };
}

/**
 * Generate LocalBusiness schema (for local SEO / Knowledge Panel eligibility)
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    '@id': `${SEO_CONFIG.siteUrl}/#business`,
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}/logo.png`,
    description:
      'Online cryptocurrency education platform and investment tools provider. Free DCA calculators, exchange comparisons, scam database, and educational courses.',
    priceRange: 'Free - $29.99/mo',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Credit Card, Cryptocurrency',
    areaServed: {
      '@type': 'GeoShape',
      name: 'Worldwide',
    },
    serviceType: [
      'Cryptocurrency Education',
      'Investment Tools',
      'Exchange Comparison',
      'Scam Prevention Database',
      'DCA Calculator',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Free Crypto Tools',
            description: 'DCA calculator, price charts, scam database search, and educational guides',
          },
          price: '0',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Premium Subscription',
            description: 'Advanced portfolio tracking, whale alerts, tax reports, and DeFi analytics',
          },
          price: '9.99',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '9.99',
            priceCurrency: 'USD',
            unitText: 'MONTH',
          },
        },
      ],
    },
  };
}

/**
 * Generate VideoObject schema for video content
 */
export function generateVideoSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  embedUrl,
}: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl: thumbnailUrl.startsWith('http') ? thumbnailUrl : `${SEO_CONFIG.siteUrl}${thumbnailUrl}`,
    uploadDate,
    ...(duration && { duration }),
    ...(contentUrl && { contentUrl }),
    ...(embedUrl && { embedUrl }),
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${SEO_CONFIG.siteUrl}/logo.png`,
      },
    },
  };
}

/**
 * Generate enhanced Article schema with speakable property for voice/AI features
 * speakable tells Google and AI which parts of an article to read aloud or cite
 */
export function generateEnhancedArticleSchema({
  title,
  description,
  image,
  author,
  publishedDate,
  modifiedDate,
  url,
  wordCount,
  articleSection,
  keywords,
  speakableCssSelectors,
}: {
  title: string;
  description: string;
  image?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  url: string;
  wordCount?: number;
  articleSection?: string;
  keywords?: string[];
  speakableCssSelectors?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`,
    author: {
      '@type': 'Organization',
      name: author || SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${SEO_CONFIG.siteUrl}/logo.png`,
      },
    },
    datePublished: publishedDate,
    dateModified: modifiedDate || publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url.startsWith('http') ? url : `${SEO_CONFIG.siteUrl}${url}`,
    },
    ...(wordCount && { wordCount }),
    ...(articleSection && { articleSection }),
    ...(keywords && keywords.length > 0 && { keywords: keywords.join(', ') }),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: speakableCssSelectors || ['h1', 'h2', '.article-summary', '.answer-text'],
    },
    isAccessibleForFree: true,
    inLanguage: 'en-US',
  };
}

/**
 * Generate Dataset schema for data-rich pages (scam database, price data)
 * Helps eligibility for Google Dataset Search and AI data extraction
 */
export function generateDatasetSchema({
  name,
  description,
  url,
  dateModified,
  recordCount,
  license,
}: {
  name: string;
  description: string;
  url: string;
  dateModified?: string;
  recordCount?: number;
  license?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: url.startsWith('http') ? url : `${SEO_CONFIG.siteUrl}${url}`,
    creator: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
    },
    ...(dateModified && { dateModified }),
    ...(recordCount && {
      size: `${recordCount} records`,
    }),
    license: license || 'https://creativecommons.org/licenses/by-nc/4.0/',
    isAccessibleForFree: true,
    inLanguage: 'en-US',
  };
}

/**
 * Generate comprehensive page schema bundle for AI-optimized pages
 * Combines multiple schema types for maximum rich result eligibility
 */
export function generatePageSchemaBundle({
  pageType,
  title,
  description,
  url,
  breadcrumbs,
  faqs,
}: {
  pageType: 'tool' | 'article' | 'comparison' | 'education' | 'database';
  title: string;
  description: string;
  url: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  faqs?: Array<{ question: string; answer: string }>;
}) {
  const schemas: Record<string, unknown>[] = [];

  schemas.push(generateWebPageSchema({ title, description, url }));

  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs));
  }

  if (faqs && faqs.length > 0) {
    schemas.push(generateGEOFAQSchema(faqs, url));
  }

  if (pageType === 'tool') {
    schemas.push(generateToolSchema({ name: title, description, url }));
  }

  if (pageType === 'database') {
    schemas.push(generateDatasetSchema({ name: title, description, url }));
  }

  return schemas;
}

// ============================================
// Internal Linking Utilities
// ============================================

export interface RelatedLink {
  title: string;
  url: string;
  description?: string;
  category?: string;
}

/**
 * Get related pages based on the current page
 */
export function getRelatedPages(currentPath: string): RelatedLink[] {
  const relatedLinks: Record<string, RelatedLink[]> = {
    '/dashboard': [
      { title: 'Price Charts', url: '/charts', description: 'Detailed price charts and analysis' },
      { title: 'Calculators', url: '/calculators', description: 'DCA and investment calculators' },
      { title: 'Compare Exchanges', url: '/compare', description: 'Find the best exchange for you' },
    ],
    '/charts': [
      { title: 'Market Dashboard', url: '/dashboard', description: 'Real-time market data' },
      { title: 'Trading Indicators', url: '/trading-indicators', description: 'Technical analysis tools' },
      { title: 'Whale Tracking Guide', url: '/whale-tracking', description: 'What large Bitcoin transfers mean' },
    ],
    '/calculators': [
      { title: 'Staking Calculator', url: '/staking-calculator', description: 'Calculate staking rewards' },
      { title: 'Retirement Calculator', url: '/retirement-calculator', description: 'Plan for the future' },
      { title: 'Learn DCA', url: '/learn', description: 'Learn about dollar cost averaging' },
    ],
    '/compare': [
      { title: 'Learn Crypto', url: '/learn', description: 'Educational guides' },
      { title: 'Hardware Wallets', url: '/hardware-wallet', description: 'Secure storage options' },
      { title: 'Scam Database', url: '/scam-database', description: 'Verify before you trade' },
    ],
    '/learn': [
      { title: 'Glossary', url: '/glossary', description: 'Crypto terms explained in plain English' },
      { title: 'Compare Platforms', url: '/compare', description: 'Find the right tools' },
      { title: 'Calculators', url: '/calculators', description: 'Plan your investments' },
    ],
    '/scam-database': [
      { title: 'Learn Crypto Safety', url: '/learn', description: 'Protect yourself' },
      { title: 'Compare Exchanges', url: '/compare', description: 'Find trusted platforms' },
      { title: 'Hardware Wallets', url: '/hardware-wallet', description: 'Secure your assets' },
    ],
    '/staking-calculator': [
      { title: 'DeFi Yield', url: '/defi-yield', description: 'Compare yield farming' },
      { title: 'Calculators', url: '/calculators', description: 'More investment tools' },
      { title: 'Compare Exchanges', url: '/compare', description: 'Find staking platforms' },
    ],
    '/defi-yield': [
      { title: 'Staking Calculator', url: '/staking-calculator', description: 'Calculate rewards' },
      { title: 'Gas Optimizer', url: '/gas-optimizer', description: 'Save on fees' },
      { title: 'On-Chain Metrics', url: '/onchain-analytics', description: 'Bitcoin network metrics explained' },
    ],
  };

  // Default related pages for any page
  const defaultRelated: RelatedLink[] = [
    { title: 'Learn Crypto', url: '/learn', description: 'Start your crypto journey' },
    { title: 'Compare Platforms', url: '/compare', description: 'Find the best tools' },
    { title: 'Market Dashboard', url: '/dashboard', description: 'Track the market' },
  ];

  return relatedLinks[currentPath] || defaultRelated;
}

/**
 * Get contextual internal links for content
 */
export function getContextualLinks(topic: string): RelatedLink[] {
  const topicLinks: Record<string, RelatedLink[]> = {
    bitcoin: [
      { title: 'Bitcoin Price Chart', url: '/charts', category: 'tools' },
      { title: 'Buy Bitcoin Guide', url: '/learn', category: 'education' },
      { title: 'Bitcoin Wallets', url: '/compare', category: 'comparison' },
    ],
    ethereum: [
      { title: 'ETH Price Chart', url: '/charts', category: 'tools' },
      { title: 'Gas Optimizer', url: '/gas-optimizer', category: 'tools' },
      { title: 'DeFi Yield Farming', url: '/defi-yield', category: 'defi' },
    ],
    defi: [
      { title: 'DeFi Yield Comparison', url: '/defi-yield', category: 'defi' },
      { title: 'On-Chain Analytics', url: '/onchain-analytics', category: 'analytics' },
      { title: 'DeFi Guide', url: '/learn', category: 'education' },
    ],
    security: [
      { title: 'Scam Database', url: '/scam-database', category: 'security' },
      { title: 'Hardware Wallets', url: '/hardware-wallet', category: 'security' },
      { title: 'Wallet Comparison', url: '/compare', category: 'comparison' },
    ],
    trading: [
      { title: 'Trading Indicators', url: '/trading-indicators', category: 'tools' },
      { title: 'Backtesting Tool', url: '/backtesting', category: 'tools' },
      { title: 'Exchange Comparison', url: '/compare', category: 'comparison' },
    ],
    investing: [
      { title: 'DCA Calculator', url: '/calculators', category: 'tools' },
      { title: 'Staking Calculator', url: '/staking-calculator', category: 'tools' },
      { title: 'Retirement Calculator', url: '/retirement-calculator', category: 'tools' },
    ],
  };

  return topicLinks[topic.toLowerCase()] || [];
}

// ============================================
// URL Utilities
// ============================================

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
}

/**
 * Generate full image URL
 */
export function getFullImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  return `${SEO_CONFIG.siteUrl}${imagePath}`;
}
