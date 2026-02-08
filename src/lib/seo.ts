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
  twitterHandle: '@bitcoinvestments',
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
    title: 'Learn Crypto Investing for Beginners',
    description:
      'Learn how to invest in Bitcoin and cryptocurrency safely. Compare exchanges, wallets, and get educational guides for beginners. Free DCA calculators, portfolio tracking, and crypto scam database.',
    keywords: [
      'Bitcoin',
      'cryptocurrency',
      'crypto investment',
      'how to invest in Bitcoin',
      'cryptocurrency for beginners',
      'DCA calculator',
      'dollar cost averaging',
      'crypto education',
      'exchange comparison',
      'wallet comparison',
      'crypto scam database',
      'portfolio tracker',
    ],
  },
  dashboard: {
    title: 'Cryptocurrency Market Dashboard',
    description:
      'Real-time cryptocurrency prices, market data, and portfolio tracking. Monitor Bitcoin, Ethereum, and 10,000+ altcoins with live price updates and market sentiment analysis.',
    keywords: [
      'cryptocurrency prices',
      'crypto market data',
      'Bitcoin price',
      'Ethereum price',
      'crypto portfolio tracker',
      'market cap',
      'crypto dashboard',
      'real-time prices',
      'altcoin prices',
      'crypto market analysis',
    ],
  },
  charts: {
    title: 'Cryptocurrency Price Charts & Analysis',
    description:
      'Interactive cryptocurrency price charts with technical analysis tools. Compare Bitcoin, Ethereum, and altcoin prices with customizable timeframes and indicators.',
    keywords: [
      'crypto charts',
      'Bitcoin chart',
      'cryptocurrency price chart',
      'crypto technical analysis',
      'price comparison',
      'trading charts',
      'crypto analysis tools',
      'historical prices',
      'price trends',
    ],
  },
  calculators: {
    title: 'Cryptocurrency Calculators - DCA, Staking, Tax & More',
    description:
      'Free cryptocurrency calculators for DCA (Dollar Cost Averaging), staking rewards, trading fees, and tax estimation. Plan your crypto investments with precision.',
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
    title: 'Compare Cryptocurrency Exchanges & Wallets',
    description:
      'Side-by-side comparison of the best cryptocurrency exchanges and wallets. Compare fees, security, features, and user ratings to find the best platform for you.',
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
    title: 'Crypto Scam Database - Protect Yourself from Fraud',
    description:
      'Free community-powered cryptocurrency scam database. Search known scams, report fraud, and protect yourself from phishing, rug pulls, and ponzi schemes.',
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
    title: 'Pricing Plans - Premium Crypto Tools & Features',
    description:
      'Unlock premium cryptocurrency tools and features. Compare our free and paid plans for portfolio tracking, alerts, tax reports, and advanced analytics.',
    keywords: [
      'crypto tools pricing',
      'premium features',
      'portfolio tracker subscription',
      'crypto alerts',
      'tax reports',
      'advanced analytics',
      'premium crypto tools',
    ],
  },
  web3: {
    title: 'Web3 Features - Connect Your Wallet',
    description:
      'Connect your cryptocurrency wallet to access Web3 features. View DeFi positions, NFT portfolio, and on-chain analytics with secure wallet connection.',
    keywords: [
      'Web3',
      'connect wallet',
      'DeFi portfolio',
      'NFT portfolio',
      'on-chain analytics',
      'MetaMask',
      'wallet connect',
      'decentralized finance',
    ],
  },
  backtesting: {
    title: 'Crypto Backtesting Tool - Test Trading Strategies',
    description:
      'Backtest your cryptocurrency trading strategies with historical data. Simulate DCA, lump sum, and custom strategies to optimize your investment approach.',
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
    title: 'Crypto Staking Calculator - Calculate Staking Rewards',
    description:
      'Calculate your potential cryptocurrency staking rewards. Compare APY rates across coins and platforms to maximize your passive income.',
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
    title: 'Crypto Retirement Calculator - Plan Your Future',
    description:
      'Plan your retirement with cryptocurrency investments. Calculate how much Bitcoin or crypto you need to retire based on your goals and timeline.',
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
    title: 'Whale Tracking - Monitor Large Crypto Transactions',
    description:
      'Track large cryptocurrency transactions and whale wallet movements. Get alerts when whales move Bitcoin, Ethereum, and other major cryptocurrencies.',
    keywords: [
      'whale tracking',
      'crypto whale alerts',
      'large transactions',
      'whale wallet',
      'Bitcoin whale',
      'smart money tracking',
      'on-chain analytics',
    ],
  },
  tradingIndicators: {
    title: 'Crypto Trading Indicators & Signals',
    description:
      'Professional cryptocurrency trading indicators and market signals. RSI, MACD, moving averages, and custom indicators for informed trading decisions.',
    keywords: [
      'crypto indicators',
      'trading signals',
      'RSI indicator',
      'MACD crypto',
      'technical indicators',
      'market signals',
      'trading analysis',
    ],
  },
  onChainAnalytics: {
    title: 'On-Chain Analytics - Blockchain Data Analysis',
    description:
      'Deep dive into blockchain data with on-chain analytics. Analyze network activity, holder distribution, and smart contract interactions.',
    keywords: [
      'on-chain analytics',
      'blockchain data',
      'network analysis',
      'holder distribution',
      'smart contract analytics',
      'blockchain metrics',
    ],
  },
  defiYield: {
    title: 'DeFi Yield Farming - Compare APY Rates',
    description:
      'Compare DeFi yield farming opportunities across protocols. Find the best APY rates for lending, liquidity providing, and staking.',
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
    title: 'Ethereum Gas Optimizer - Save on Transaction Fees',
    description:
      'Optimize your Ethereum transactions and save on gas fees. Real-time gas prices, fee estimates, and optimal timing recommendations.',
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
    title: 'Hardware Wallet Guide - Secure Your Crypto',
    description:
      'Complete guide to cryptocurrency hardware wallets. Compare Ledger, Trezor, and other hardware wallets to secure your digital assets.',
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
    title: 'Multi-Exchange Portfolio - Track All Accounts',
    description:
      'Connect and track all your cryptocurrency exchange accounts in one dashboard. Unified portfolio view across Coinbase, Kraken, Binance, and more.',
    keywords: [
      'multi-exchange',
      'portfolio tracker',
      'exchange aggregator',
      'unified dashboard',
      'exchange connection',
      'portfolio management',
    ],
  },
  dcaAutomation: {
    title: 'DCA Automation - Automate Dollar Cost Averaging',
    description:
      'Set up automated Dollar Cost Averaging for your cryptocurrency investments. Schedule recurring purchases and build your portfolio automatically.',
    keywords: [
      'DCA automation',
      'auto invest crypto',
      'recurring purchases',
      'automated investing',
      'Bitcoin DCA',
      'investment automation',
    ],
  },
  rebalancingAlerts: {
    title: 'Portfolio Rebalancing Alerts - Maintain Target Allocation',
    description:
      'Get alerts when your crypto portfolio drifts from target allocation. Automatic rebalancing recommendations to maintain your investment strategy.',
    keywords: [
      'portfolio rebalancing',
      'allocation alerts',
      'portfolio management',
      'rebalancing strategy',
      'asset allocation',
      'portfolio optimization',
    ],
  },
  alertBundles: {
    title: 'Smart Alert Bundles - Custom Crypto Notifications',
    description:
      'Create custom alert bundles for cryptocurrency price movements, whale activity, and market events. Stay informed with personalized notifications.',
    keywords: [
      'crypto alerts',
      'price alerts',
      'custom notifications',
      'market alerts',
      'whale alerts',
      'trading alerts',
    ],
  },
  lending: {
    title: 'Crypto Lending Comparison - Compare Interest Rates',
    description:
      'Compare cryptocurrency lending platforms and interest rates. Find the best rates for lending your Bitcoin, Ethereum, and stablecoins.',
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
    title: 'Social Trading - Copy Top Crypto Traders',
    description:
      'Follow and copy successful cryptocurrency traders. Learn from the best and replicate winning trading strategies automatically.',
    keywords: [
      'social trading',
      'copy trading',
      'follow traders',
      'crypto signals',
      'trading community',
      'copy strategies',
    ],
  },
  influencerVerification: {
    title: 'Influencer Verification - Verified Crypto Experts',
    description:
      'Verify cryptocurrency influencers and track their performance. Follow verified experts with proven track records.',
    keywords: [
      'crypto influencer',
      'verified experts',
      'influencer tracking',
      'crypto experts',
      'trading performance',
      'influencer verification',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    description:
      'Bitcoinvestments privacy policy. Learn how we collect, use, and protect your personal information.',
    keywords: ['privacy policy', 'data protection', 'personal information', 'GDPR'],
  },
  terms: {
    title: 'Terms of Service',
    description:
      'Bitcoinvestments terms of service and user agreement. Read our terms and conditions for using our platform.',
    keywords: ['terms of service', 'user agreement', 'terms and conditions', 'legal'],
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
      'Latest cryptocurrency news, market analysis, and educational content. Stay informed about Bitcoin, Ethereum, DeFi, and the broader crypto market with expert insights.',
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
    title: 'API Pricing - Developer Plans & Access',
    description:
      'Flexible API pricing plans for cryptocurrency data access. Free tier available with rate-limited access. Premium plans for production use.',
    keywords: [
      'API pricing',
      'crypto API plans',
      'data access pricing',
      'developer plans',
      'API subscription',
    ],
  },
  accessibility: {
    title: 'Accessibility Settings',
    description:
      'Customize your Bitcoinvestments experience with accessibility settings. Adjust font size, contrast, animations, and screen reader preferences.',
    keywords: [
      'accessibility',
      'a11y settings',
      'screen reader',
      'high contrast',
      'font size',
      'WCAG compliance',
    ],
  },
  reportScam: {
    title: 'Report a Crypto Scam - Help Protect the Community',
    description:
      'Report cryptocurrency scams to our community database. Submit details about phishing sites, rug pulls, fake exchanges, and other crypto fraud to protect other investors.',
    keywords: [
      'report crypto scam',
      'report fraud',
      'crypto scam report',
      'phishing report',
      'rug pull report',
      'scam submission',
      'crypto fraud alert',
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
    sameAs: [
      'https://twitter.com/bitcoinvestments',
    ],
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
    sameAs: ['https://twitter.com/bitcoinvestments'],
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
    description: 'Comprehensive glossary of 300+ cryptocurrency and blockchain terms explained in plain English.',
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
      { title: 'Whale Tracking', url: '/whale-tracking', description: 'Monitor large transactions' },
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
      { title: 'Glossary', url: '/glossary', description: '300+ crypto terms explained' },
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
      { title: 'On-Chain Analytics', url: '/onchain-analytics', description: 'Analyze protocols' },
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
