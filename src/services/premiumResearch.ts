/**
 * Premium Research Reports Service
 *
 * Provides exclusive in-depth crypto research for premium subscribers:
 * - Market analysis reports
 * - Cryptocurrency deep dives
 * - Sector analysis (DeFi, NFT, L2, etc.)
 * - Trading insights
 * - Macro economic analysis
 *
 * Reports are curated and updated regularly for paying subscribers.
 */

import { hasPremiumResearchReports } from './subscriptionLimits';

// ==================== Types ====================

export type ReportCategory =
  | 'market_analysis'
  | 'crypto_deep_dive'
  | 'sector_analysis'
  | 'trading_insights'
  | 'macro_economics'
  | 'regulatory_updates'
  | 'technical_analysis';

export type ReportTier = 'free' | 'premium' | 'exclusive';

export interface ResearchReport {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: ReportCategory;
  tier: ReportTier;
  publishedAt: string;
  updatedAt?: string;
  author: ReportAuthor;
  readTimeMinutes: number;
  tags: string[];
  imageUrl?: string;
  content?: ReportContent;
  relatedReports?: string[]; // IDs
  metrics?: ReportMetrics;
  keyTakeaways?: string[]; // Quick summary points
}

export interface ReportAuthor {
  name: string;
  title: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ReportContent {
  sections: ReportSection[];
  keyTakeaways: string[];
  methodology?: string;
  disclaimer?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string; // HTML or Markdown
  type: 'text' | 'chart' | 'table' | 'quote' | 'callout';
  data?: Record<string, unknown>; // For charts/tables
}

export interface ReportMetrics {
  views: number;
  bookmarks: number;
  shares: number;
  rating?: number; // 1-5
  ratingCount?: number;
}

export interface ReportFilter {
  category?: ReportCategory;
  tier?: ReportTier;
  tags?: string[];
  searchQuery?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ==================== Sample Research Reports ====================

/**
 * Sample research reports for demonstration
 * In production, these would come from a CMS or database
 */
export const SAMPLE_REPORTS: ResearchReport[] = [
  {
    id: 'report-001',
    title: 'Bitcoin 2024 Halving Analysis: What Investors Need to Know',
    slug: 'bitcoin-2024-halving-analysis',
    summary: 'A comprehensive analysis of the 2024 Bitcoin halving, its historical impact on price, and projections for the next cycle.',
    category: 'crypto_deep_dive',
    tier: 'premium',
    publishedAt: '2024-12-15T00:00:00Z',
    author: {
      name: 'Alex Chen',
      title: 'Senior Crypto Analyst',
    },
    readTimeMinutes: 15,
    tags: ['bitcoin', 'halving', 'price-analysis', 'investing'],
    keyTakeaways: [
      'Historical halvings have preceded significant bull runs',
      'Supply shock effects typically manifest 6-12 months post-halving',
      'Institutional adoption may amplify this cycle\'s impact',
    ],
  },
  {
    id: 'report-002',
    title: 'DeFi Sector Report Q4 2024: Trends and Opportunities',
    slug: 'defi-sector-report-q4-2024',
    summary: 'Deep dive into the decentralized finance ecosystem, covering TVL trends, emerging protocols, and investment opportunities.',
    category: 'sector_analysis',
    tier: 'premium',
    publishedAt: '2024-12-10T00:00:00Z',
    author: {
      name: 'Sarah Kim',
      title: 'DeFi Research Lead',
    },
    readTimeMinutes: 20,
    tags: ['defi', 'ethereum', 'yield-farming', 'protocols'],
    keyTakeaways: [
      'Total Value Locked continues to grow despite market volatility',
      'Real Yield protocols gaining market share over inflationary models',
      'Layer 2 DeFi adoption accelerating',
    ],
  },
  {
    id: 'report-003',
    title: 'Layer 2 Scaling Solutions Comparison',
    slug: 'layer-2-comparison-2024',
    summary: 'Technical and investment analysis of leading Layer 2 solutions including Arbitrum, Optimism, zkSync, and StarkNet.',
    category: 'technical_analysis',
    tier: 'premium',
    publishedAt: '2024-12-05T00:00:00Z',
    author: {
      name: 'Mike Rodriguez',
      title: 'Technical Analyst',
    },
    readTimeMinutes: 25,
    tags: ['layer-2', 'ethereum', 'scaling', 'technology'],
    keyTakeaways: [
      'ZK-rollups offer superior security guarantees',
      'Optimistic rollups currently lead in TVL and ecosystem',
      'Each solution has distinct trade-offs for different use cases',
    ],
  },
  {
    id: 'report-004',
    title: 'Crypto Regulatory Landscape 2025',
    slug: 'crypto-regulatory-landscape-2025',
    summary: 'Overview of global cryptocurrency regulations, pending legislation, and how investors should prepare.',
    category: 'regulatory_updates',
    tier: 'exclusive',
    publishedAt: '2024-12-01T00:00:00Z',
    author: {
      name: 'Jennifer Walsh',
      title: 'Legal & Compliance Analyst',
    },
    readTimeMinutes: 18,
    tags: ['regulation', 'compliance', 'legal', 'usa', 'europe'],
    keyTakeaways: [
      'MiCA implementation reshaping European crypto landscape',
      'US regulatory clarity expected with new administration',
      'Asia-Pacific becoming more crypto-friendly',
    ],
  },
  {
    id: 'report-005',
    title: 'Weekly Market Analysis - December 2024',
    slug: 'weekly-market-analysis-dec-2024',
    summary: 'Free weekly market analysis covering Bitcoin, Ethereum, and major altcoins with price levels and trends.',
    category: 'market_analysis',
    tier: 'free',
    publishedAt: '2024-12-20T00:00:00Z',
    author: {
      name: 'Trading Desk',
      title: 'Market Analysis Team',
    },
    readTimeMinutes: 8,
    tags: ['market-analysis', 'bitcoin', 'ethereum', 'altcoins'],
    keyTakeaways: [
      'Bitcoin testing key resistance levels',
      'Altcoin season indicators strengthening',
      'Institutional flows remain positive',
    ],
  },
  {
    id: 'report-006',
    title: 'NFT Market Recovery Analysis',
    slug: 'nft-market-recovery-2024',
    summary: 'Analysis of NFT market trends, blue-chip collections, and emerging opportunities in the digital art space.',
    category: 'sector_analysis',
    tier: 'premium',
    publishedAt: '2024-11-28T00:00:00Z',
    author: {
      name: 'Diana Park',
      title: 'NFT Research Analyst',
    },
    readTimeMinutes: 14,
    tags: ['nft', 'digital-art', 'collectibles', 'ethereum'],
    keyTakeaways: [
      'Blue-chip NFTs showing signs of floor recovery',
      'Utility-focused NFTs outperforming pure art collections',
      'Bitcoin Ordinals gaining significant market share',
    ],
  },
  {
    id: 'report-007',
    title: 'Macro Economics & Crypto Correlation Study',
    slug: 'macro-crypto-correlation-2024',
    summary: 'Deep analysis of how macroeconomic factors influence cryptocurrency markets, including Fed policy and inflation data.',
    category: 'macro_economics',
    tier: 'premium',
    publishedAt: '2024-11-25T00:00:00Z',
    author: {
      name: 'David Thompson',
      title: 'Macro Strategist',
    },
    readTimeMinutes: 22,
    tags: ['macro', 'fed', 'inflation', 'correlation', 'investing'],
    keyTakeaways: [
      'Bitcoin correlation with traditional markets decreasing',
      'Rate cut expectations positively impacting crypto sentiment',
      'Dollar strength remains key variable for crypto performance',
    ],
  },
  {
    id: 'report-008',
    title: 'Ethereum Roadmap Update: Post-Dencun Analysis',
    slug: 'ethereum-roadmap-dencun-2024',
    summary: 'Technical deep dive into Ethereum\'s roadmap progress following the Dencun upgrade and what\'s next.',
    category: 'crypto_deep_dive',
    tier: 'premium',
    publishedAt: '2024-11-20T00:00:00Z',
    author: {
      name: 'Mike Rodriguez',
      title: 'Technical Analyst',
    },
    readTimeMinutes: 18,
    tags: ['ethereum', 'dencun', 'technology', 'roadmap'],
    keyTakeaways: [
      'Proto-danksharding significantly reduced L2 fees',
      'Next major upgrade focusing on proposer-builder separation',
      'Full danksharding remains 2-3 years out',
    ],
  },
];

// ==================== Service Functions ====================

/**
 * Get all available research reports for a user based on their subscription
 */
export function getAvailableReports(
  subscriptionStatus?: string,
  subscriptionExpiresAt?: string | null,
  filter?: ReportFilter
): ResearchReport[] {
  const hasPremiumAccess = hasPremiumResearchReports(
    subscriptionStatus as any,
    subscriptionExpiresAt
  );

  let reports = [...SAMPLE_REPORTS];

  // Filter by access level
  if (!hasPremiumAccess) {
    reports = reports.filter(r => r.tier === 'free');
  }

  // Apply filters
  if (filter) {
    if (filter.category) {
      reports = reports.filter(r => r.category === filter.category);
    }
    if (filter.tier) {
      reports = reports.filter(r => r.tier === filter.tier);
    }
    if (filter.tags && filter.tags.length > 0) {
      reports = reports.filter(r =>
        filter.tags!.some(tag => r.tags.includes(tag))
      );
    }
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      reports = reports.filter(
        r =>
          r.title.toLowerCase().includes(query) ||
          r.summary.toLowerCase().includes(query) ||
          r.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    if (filter.dateRange) {
      reports = reports.filter(r => {
        const pubDate = new Date(r.publishedAt);
        return pubDate >= filter.dateRange!.start && pubDate <= filter.dateRange!.end;
      });
    }
  }

  // Sort by date (newest first)
  return reports.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * Get a specific report by ID
 */
export function getReportById(
  reportId: string,
  subscriptionStatus?: string,
  subscriptionExpiresAt?: string | null
): ResearchReport | null {
  const report = SAMPLE_REPORTS.find(r => r.id === reportId);

  if (!report) return null;

  // Check access
  if (report.tier !== 'free') {
    const hasPremiumAccess = hasPremiumResearchReports(
      subscriptionStatus as any,
      subscriptionExpiresAt
    );
    if (!hasPremiumAccess) {
      // Return report with limited content for upsell
      return {
        ...report,
        content: undefined,
      };
    }
  }

  return report;
}

/**
 * Get a specific report by slug
 */
export function getReportBySlug(
  slug: string,
  subscriptionStatus?: string,
  subscriptionExpiresAt?: string | null
): ResearchReport | null {
  const report = SAMPLE_REPORTS.find(r => r.slug === slug);

  if (!report) return null;

  return getReportById(report.id, subscriptionStatus, subscriptionExpiresAt);
}

/**
 * Get featured reports (latest premium reports)
 */
export function getFeaturedReports(limit: number = 3): ResearchReport[] {
  return SAMPLE_REPORTS
    .filter(r => r.tier === 'premium')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

/**
 * Get reports by category
 */
export function getReportsByCategory(
  category: ReportCategory,
  subscriptionStatus?: string,
  subscriptionExpiresAt?: string | null
): ResearchReport[] {
  return getAvailableReports(subscriptionStatus, subscriptionExpiresAt, { category });
}

/**
 * Get related reports based on tags
 */
export function getRelatedReports(
  report: ResearchReport,
  subscriptionStatus?: string,
  subscriptionExpiresAt?: string | null,
  limit: number = 3
): ResearchReport[] {
  return getAvailableReports(subscriptionStatus, subscriptionExpiresAt)
    .filter(r => r.id !== report.id)
    .filter(r => r.tags.some(tag => report.tags.includes(tag)))
    .slice(0, limit);
}

/**
 * Get all available categories
 */
export function getReportCategories(): { category: ReportCategory; label: string; count: number }[] {
  const categoryLabels: Record<ReportCategory, string> = {
    market_analysis: 'Market Analysis',
    crypto_deep_dive: 'Crypto Deep Dives',
    sector_analysis: 'Sector Analysis',
    trading_insights: 'Trading Insights',
    macro_economics: 'Macro Economics',
    regulatory_updates: 'Regulatory Updates',
    technical_analysis: 'Technical Analysis',
  };

  const categories: ReportCategory[] = [
    'market_analysis',
    'crypto_deep_dive',
    'sector_analysis',
    'trading_insights',
    'macro_economics',
    'regulatory_updates',
    'technical_analysis',
  ];

  return categories.map(category => ({
    category,
    label: categoryLabels[category],
    count: SAMPLE_REPORTS.filter(r => r.category === category).length,
  }));
}

/**
 * Check if user can access a specific report
 */
export function canAccessReport(
  report: ResearchReport,
  subscriptionStatus?: string,
  subscriptionExpiresAt?: string | null
): boolean {
  if (report.tier === 'free') return true;

  return hasPremiumResearchReports(
    subscriptionStatus as any,
    subscriptionExpiresAt
  );
}

/**
 * Get premium teaser for free users
 */
export function getPremiumTeaser(): {
  title: string;
  description: string;
  benefits: string[];
  sampleReports: ResearchReport[];
} {
  return {
    title: 'Unlock Premium Research',
    description: 'Get access to exclusive in-depth cryptocurrency research reports from our expert analysts.',
    benefits: [
      'Weekly market analysis reports',
      'Deep-dive cryptocurrency research',
      'Sector analysis (DeFi, NFT, L2)',
      'Trading insights and strategies',
      'Regulatory update summaries',
      'Early access to new reports',
    ],
    sampleReports: getFeaturedReports(3),
  };
}

/**
 * Format category for display
 */
export function formatCategory(category: ReportCategory): string {
  const labels: Record<ReportCategory, string> = {
    market_analysis: 'Market Analysis',
    crypto_deep_dive: 'Crypto Deep Dive',
    sector_analysis: 'Sector Analysis',
    trading_insights: 'Trading Insights',
    macro_economics: 'Macro Economics',
    regulatory_updates: 'Regulatory Updates',
    technical_analysis: 'Technical Analysis',
  };
  return labels[category];
}

/**
 * Get tier badge properties
 */
export function getTierBadge(tier: ReportTier): { label: string; color: string } {
  switch (tier) {
    case 'free':
      return { label: 'Free', color: '#10b981' }; // Green
    case 'premium':
      return { label: 'Premium', color: '#f97316' }; // Orange
    case 'exclusive':
      return { label: 'Exclusive', color: '#8b5cf6' }; // Purple
    default:
      return { label: 'Free', color: '#10b981' };
  }
}
