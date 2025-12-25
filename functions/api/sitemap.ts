/**
 * Dynamic Sitemap Generator
 *
 * Generates a sitemap.xml dynamically based on all pages and content.
 * This ensures the sitemap is always up-to-date.
 */

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const SITE_URL = 'https://bitcoinvestments.net';

// Static pages with their metadata
const STATIC_PAGES: SitemapEntry[] = [
  // Main pages
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/dashboard', changefreq: 'hourly', priority: 0.9 },
  { loc: '/charts', changefreq: 'hourly', priority: 0.8 },
  { loc: '/calculators', changefreq: 'weekly', priority: 0.9 },
  { loc: '/compare', changefreq: 'weekly', priority: 0.9 },
  { loc: '/learn', changefreq: 'weekly', priority: 0.9 },
  { loc: '/glossary', changefreq: 'monthly', priority: 0.7 },
  { loc: '/pricing', changefreq: 'weekly', priority: 0.8 },

  // Security
  { loc: '/scam-database', changefreq: 'daily', priority: 0.8 },
  { loc: '/report-scam', changefreq: 'monthly', priority: 0.5 },

  // Web3
  { loc: '/web3', changefreq: 'weekly', priority: 0.7 },

  // Tools & Calculators
  { loc: '/staking-calculator', changefreq: 'weekly', priority: 0.8 },
  { loc: '/retirement-calculator', changefreq: 'weekly', priority: 0.7 },
  { loc: '/backtesting', changefreq: 'weekly', priority: 0.7 },

  // Premium Features
  { loc: '/whale-tracking', changefreq: 'hourly', priority: 0.7 },
  { loc: '/trading-indicators', changefreq: 'daily', priority: 0.7 },
  { loc: '/onchain-analytics', changefreq: 'daily', priority: 0.7 },
  { loc: '/defi-yield', changefreq: 'daily', priority: 0.7 },
  { loc: '/gas-optimizer', changefreq: 'hourly', priority: 0.6 },
  { loc: '/hardware-wallet', changefreq: 'monthly', priority: 0.7 },
  { loc: '/multi-exchange', changefreq: 'weekly', priority: 0.6 },
  { loc: '/dca-automation', changefreq: 'weekly', priority: 0.6 },
  { loc: '/rebalancing-alerts', changefreq: 'weekly', priority: 0.6 },
  { loc: '/alert-bundles', changefreq: 'weekly', priority: 0.6 },
  { loc: '/lending', changefreq: 'weekly', priority: 0.7 },
  { loc: '/social-trading', changefreq: 'weekly', priority: 0.6 },
  { loc: '/influencer-verification', changefreq: 'weekly', priority: 0.5 },

  // Developer
  { loc: '/developers/pricing', changefreq: 'monthly', priority: 0.5 },
  { loc: '/developers/docs', changefreq: 'weekly', priority: 0.5 },

  // Legal
  { loc: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { loc: '/terms', changefreq: 'yearly', priority: 0.3 },

  // Auth (low priority - not for search ranking)
  { loc: '/login', changefreq: 'monthly', priority: 0.2 },
  { loc: '/signup', changefreq: 'monthly', priority: 0.3 },
];

// Exchange pages (programmatic SEO)
const EXCHANGES = [
  'coinbase',
  'kraken',
  'binance-us',
  'gemini',
  'crypto-com',
  'robinhood',
  'coinbase-pro',
  'uphold',
];

// Wallet pages (programmatic SEO)
const WALLETS = [
  'ledger-nano-x',
  'ledger-nano-s-plus',
  'trezor-model-t',
  'trezor-one',
  'metamask',
  'phantom',
  'trust-wallet',
  'exodus',
  'coinbase-wallet',
  'blue-wallet',
];

// Article slugs (these would come from a CMS or database in production)
const ARTICLES = [
  'what-is-bitcoin',
  'how-to-buy-crypto',
  'crypto-wallets-explained',
  'defi-basics',
  'dca-strategies',
  'common-crypto-mistakes',
  'portfolio-rebalancing',
  'yield-farming',
  'defi-risks',
  'risk-management',
];

// Guide IDs
const GUIDES = [
  'what-is-bitcoin',
  'how-to-buy-crypto',
  'crypto-wallets-explained',
  'defi-basics',
  'dca-strategies',
];

function generateSitemapXML(entries: SitemapEntry[]): string {
  const today = new Date().toISOString().split('T')[0];

  const urlEntries = entries
    .map((entry) => {
      const lastmod = entry.lastmod || today;
      return `
  <url>
    <loc>${SITE_URL}${entry.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority.toFixed(1)}</priority>` : ''}
  </url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">${urlEntries}
</urlset>`;
}

export const onRequest: PagesFunction = async () => {
  // Build complete sitemap entries
  const allEntries: SitemapEntry[] = [...STATIC_PAGES];

  // Add exchange pages
  EXCHANGES.forEach((id) => {
    allEntries.push({
      loc: `/compare/exchanges/${id}`,
      changefreq: 'weekly',
      priority: 0.8,
    });
  });

  // Add wallet pages
  WALLETS.forEach((id) => {
    allEntries.push({
      loc: `/compare/wallets/${id}`,
      changefreq: 'weekly',
      priority: 0.8,
    });
  });

  // Add article pages
  ARTICLES.forEach((slug) => {
    allEntries.push({
      loc: `/article/${slug}`,
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Add guide pages
  GUIDES.forEach((id) => {
    allEntries.push({
      loc: `/learn/${id}`,
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  const sitemapXML = generateSitemapXML(allEntries);

  return new Response(sitemapXML, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
};
