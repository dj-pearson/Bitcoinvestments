// Research Reports Service
// Premium weekly crypto analysis and research reports

import { supabase, db } from '../lib/supabase';

export type ReportType = 'weekly_market' | 'token_analysis' | 'defi_deep_dive' | 'macro_outlook' | 'sector_report' | 'special_report';
export type ReportStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface ResearchReport {
  id: string;
  title: string;
  slug: string;
  type: ReportType;
  summary: string;
  content: string;
  thumbnailUrl: string;
  authorId: string;
  author?: Author;
  isPremium: boolean;
  publishedAt: string;
  readTime: number; // minutes
  views: number;
  likes: number;
  downloads: number;
  tags: string[];
  assets: ReportAsset[];
  keyTakeaways: string[];
  pdfUrl?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  bio: string;
  expertise: string[];
}

export interface ReportAsset {
  type: 'chart' | 'table' | 'image' | 'pdf';
  title: string;
  url: string;
  description?: string;
}

export interface ReportFilters {
  type?: ReportType;
  isPremium?: boolean;
  search?: string;
  authorId?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ReportComment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  likes: number;
}

// Demo data
const DEMO_AUTHORS: Author[] = [
  {
    id: 'author-1',
    name: 'Michael Roberts',
    title: 'Chief Research Analyst',
    avatarUrl: '/authors/michael-roberts.jpg',
    bio: 'Former Goldman Sachs analyst with 15 years of experience in traditional and digital asset markets.',
    expertise: ['Market Analysis', 'Macro Economics', 'Bitcoin', 'Institutional Investing']
  },
  {
    id: 'author-2',
    name: 'Dr. Sarah Kim',
    title: 'DeFi Research Lead',
    avatarUrl: '/authors/sarah-kim.jpg',
    bio: 'PhD in Computer Science from MIT. 5 years researching blockchain protocols and DeFi systems.',
    expertise: ['DeFi Protocols', 'Smart Contracts', 'Tokenomics', 'Security Analysis']
  }
];

const DEMO_REPORTS: ResearchReport[] = [
  {
    id: 'report-1',
    title: 'Weekly Market Analysis: Bitcoin Tests New Highs',
    slug: 'weekly-market-analysis-dec-22-2024',
    type: 'weekly_market',
    summary: 'Bitcoin breaks through key resistance levels as institutional demand surges. Our analysis of on-chain metrics, derivatives markets, and macro factors.',
    content: `
# Weekly Market Analysis: December 22, 2024

## Executive Summary

This week marked a significant milestone for Bitcoin as it tested new all-time highs amid surging institutional demand. Our comprehensive analysis reveals several key trends that investors should monitor.

## Market Overview

### Price Action
Bitcoin's price action this week demonstrated remarkable strength:
- Weekly high: $108,500
- Weekly low: $98,200
- Current price: $105,800
- Weekly change: +7.3%

### Volume Analysis
Trading volumes across major exchanges increased by 45% week-over-week, indicating strong conviction behind the price move.

## On-Chain Metrics

### Exchange Flows
- Net outflows from exchanges continue, with 25,000 BTC leaving centralized exchanges
- This represents the highest weekly outflow since March 2024
- Cold storage accumulation suggests long-term holder conviction

### Mining Metrics
- Hash rate reached new ATH at 750 EH/s
- Miner revenue up 12% week-over-week
- Difficulty adjustment expected to increase by 4.2%

## Institutional Activity

### ETF Flows
- Spot Bitcoin ETFs saw $2.8B in net inflows
- BlackRock's IBIT leads with $1.2B in weekly inflows
- Total AUM across spot ETFs: $65.3B

### Futures Markets
- CME open interest at record $18.5B
- Funding rates remain positive but healthy (0.01-0.02%)
- Basis trade showing 12% annualized returns

## Technical Analysis

### Key Levels
- Support: $98,000, $92,000, $85,000
- Resistance: $110,000, $115,000
- RSI: 68 (approaching overbought)
- MACD: Bullish crossover confirmed

## Risk Factors

1. **Regulatory Uncertainty**: Pending SEC decisions on additional ETF applications
2. **Macro Risks**: Fed policy decisions in January
3. **Leverage Levels**: Elevated funding rates warrant caution

## Outlook

Our base case remains bullish with a price target of $125,000 by Q1 2025. However, we recommend maintaining strict risk management given elevated leverage in the system.

---
*This report is for informational purposes only and does not constitute financial advice.*
    `,
    thumbnailUrl: '/reports/weekly-market-dec-22.jpg',
    authorId: 'author-1',
    author: DEMO_AUTHORS[0],
    isPremium: true,
    publishedAt: '2024-12-22T08:00:00Z',
    readTime: 12,
    views: 4521,
    likes: 328,
    downloads: 156,
    tags: ['bitcoin', 'market-analysis', 'weekly-report', 'institutional'],
    assets: [
      { type: 'chart', title: 'BTC Price vs Exchange Flows', url: '/charts/btc-flows.png' },
      { type: 'table', title: 'ETF Flow Summary', url: '/tables/etf-flows.csv' }
    ],
    keyTakeaways: [
      'Bitcoin testing new highs with strong volume confirmation',
      'Institutional inflows remain robust via spot ETFs',
      'On-chain metrics support continued bullish momentum',
      'Monitor leverage levels and funding rates for signs of overheating'
    ],
    pdfUrl: '/reports/weekly-market-dec-22-2024.pdf',
    status: 'published',
    createdAt: '2024-12-21T18:00:00Z',
    updatedAt: '2024-12-22T08:00:00Z'
  },
  {
    id: 'report-2',
    title: 'Deep Dive: Ethereum Layer 2 Ecosystem Analysis',
    slug: 'ethereum-l2-ecosystem-analysis-q4-2024',
    type: 'defi_deep_dive',
    summary: 'Comprehensive analysis of Ethereum Layer 2 solutions including Arbitrum, Optimism, Base, and zkSync. TVL trends, adoption metrics, and investment outlook.',
    content: `# Ethereum Layer 2 Ecosystem Analysis Q4 2024...`,
    thumbnailUrl: '/reports/l2-analysis.jpg',
    authorId: 'author-2',
    author: DEMO_AUTHORS[1],
    isPremium: true,
    publishedAt: '2024-12-18T08:00:00Z',
    readTime: 25,
    views: 3892,
    likes: 456,
    downloads: 234,
    tags: ['ethereum', 'layer-2', 'defi', 'arbitrum', 'optimism'],
    assets: [],
    keyTakeaways: [
      'Layer 2 TVL reached $45B, up 180% YoY',
      'Base showing fastest adoption with 150% quarterly growth',
      'zkSync and Starknet gaining ground with ZK-rollup advantages',
      'Interoperability solutions becoming critical differentiator'
    ],
    status: 'published',
    createdAt: '2024-12-17T18:00:00Z',
    updatedAt: '2024-12-18T08:00:00Z'
  },
  {
    id: 'report-3',
    title: 'Token Analysis: Solana (SOL) - Fundamental Deep Dive',
    slug: 'solana-token-analysis-dec-2024',
    type: 'token_analysis',
    summary: 'In-depth analysis of Solana ecosystem health, network metrics, DeFi growth, and valuation framework.',
    content: `# Solana Token Analysis...`,
    thumbnailUrl: '/reports/sol-analysis.jpg',
    authorId: 'author-1',
    author: DEMO_AUTHORS[0],
    isPremium: true,
    publishedAt: '2024-12-15T08:00:00Z',
    readTime: 18,
    views: 5234,
    likes: 612,
    downloads: 289,
    tags: ['solana', 'token-analysis', 'defi', 'nft'],
    assets: [],
    keyTakeaways: [
      'Network activity recovered to pre-FTX levels',
      'DEX volumes competitive with Ethereum',
      'Strong NFT and gaming ecosystem development',
      'Fair value estimate: $180-220 range'
    ],
    status: 'published',
    createdAt: '2024-12-14T18:00:00Z',
    updatedAt: '2024-12-15T08:00:00Z'
  },
  {
    id: 'report-4',
    title: '2025 Crypto Market Outlook: Institutional Era',
    slug: '2025-crypto-market-outlook',
    type: 'macro_outlook',
    summary: 'Our annual market outlook exploring key themes for 2025 including institutional adoption, regulatory clarity, and emerging narratives.',
    content: `# 2025 Crypto Market Outlook...`,
    thumbnailUrl: '/reports/2025-outlook.jpg',
    authorId: 'author-1',
    author: DEMO_AUTHORS[0],
    isPremium: false, // Free preview
    publishedAt: '2024-12-10T08:00:00Z',
    readTime: 30,
    views: 12456,
    likes: 1823,
    downloads: 892,
    tags: ['outlook', 'bitcoin', 'ethereum', 'institutional', '2025'],
    assets: [],
    keyTakeaways: [
      'Institutional adoption to accelerate with ETF expansion',
      'Regulatory clarity expected in major jurisdictions',
      'DeFi 2.0 protocols emerging as key theme',
      'Bitcoin price target: $150,000-200,000'
    ],
    status: 'published',
    createdAt: '2024-12-09T18:00:00Z',
    updatedAt: '2024-12-10T08:00:00Z'
  }
];

// Type labels
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  weekly_market: 'Weekly Market Analysis',
  token_analysis: 'Token Analysis',
  defi_deep_dive: 'DeFi Deep Dive',
  macro_outlook: 'Macro Outlook',
  sector_report: 'Sector Report',
  special_report: 'Special Report'
};

export const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  weekly_market: 'bg-blue-100 text-blue-700',
  token_analysis: 'bg-purple-100 text-purple-700',
  defi_deep_dive: 'bg-green-100 text-green-700',
  macro_outlook: 'bg-orange-100 text-orange-700',
  sector_report: 'bg-pink-100 text-pink-700',
  special_report: 'bg-red-100 text-red-700'
};

// Get reports with filters
export async function getReports(filters: ReportFilters = {}): Promise<{
  reports: ResearchReport[];
  total: number;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Return demo reports for non-authenticated
      let filtered = [...DEMO_REPORTS];

      if (filters.type) {
        filtered = filtered.filter(r => r.type === filters.type);
      }
      if (filters.isPremium !== undefined) {
        filtered = filtered.filter(r => r.isPremium === filters.isPremium);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(r =>
          r.title.toLowerCase().includes(search) ||
          r.summary.toLowerCase().includes(search) ||
          r.tags.some(t => t.includes(search))
        );
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const start = (page - 1) * limit;

      return {
        reports: filtered.slice(start, start + limit),
        total: filtered.length,
        error: null
      };
    }

    let query = supabase
      .from('research_reports')
      .select('*, author:authors(*)', { count: 'exact' })
      .eq('status', 'published');

    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.isPremium !== undefined) {
      query = query.eq('is_premium', filters.isPremium);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
    }
    if (filters.authorId) {
      query = query.eq('author_id', filters.authorId);
    }
    if (filters.startDate) {
      query = query.gte('published_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('published_at', filters.endDate);
    }

    query = query.order('published_at', { ascending: false });

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      reports: data || [],
      total: count || 0,
      error: null
    };
  } catch (err) {
    console.error('Error fetching reports:', err);
    return { reports: DEMO_REPORTS, total: DEMO_REPORTS.length, error: null };
  }
}

// Get single report
export async function getReport(idOrSlug: string): Promise<{
  report: ResearchReport | null;
  error: string | null;
}> {
  try {
    // Check demo reports
    const demoReport = DEMO_REPORTS.find(r => r.id === idOrSlug || r.slug === idOrSlug);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session || demoReport) {
      return {
        report: demoReport || null,
        error: demoReport ? null : 'Report not found'
      };
    }

    const { data, error } = await supabase
      .from('research_reports')
      .select('*, author:authors(*)')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase.rpc('increment_report_views', { report_id: data.id });

    return { report: data, error: null };
  } catch (err) {
    console.error('Error fetching report:', err);
    const demoReport = DEMO_REPORTS.find(r => r.id === idOrSlug || r.slug === idOrSlug);
    return {
      report: demoReport || null,
      error: demoReport ? null : 'Report not found'
    };
  }
}

// Like a report
export async function likeReport(userId: string, reportId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('report_likes')
      .upsert({ user_id: userId, report_id: reportId });

    if (error) throw error;

    // Increment like count
    await supabase.rpc('update_report_likes', { report_id: reportId });

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error liking report:', err);
    return { success: false, error: err.message };
  }
}

// Download report
export async function downloadReport(userId: string, reportId: string): Promise<{
  url: string | null;
  error: string | null;
}> {
  try {
    const report = DEMO_REPORTS.find(r => r.id === reportId);

    if (report) {
      return { url: report.pdfUrl || null, error: null };
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { url: null, error: 'Authentication required' };
    }

    // Log download
    await supabase
      .from('report_downloads')
      .insert({ user_id: userId, report_id: reportId });

    // Increment download count
    await supabase.rpc('increment_report_downloads', { report_id: reportId });

    const { data } = await supabase
      .from('research_reports')
      .select('pdf_url')
      .eq('id', reportId)
      .single();

    return { url: data?.pdf_url || null, error: null };
  } catch (err: any) {
    console.error('Error downloading report:', err);
    return { url: null, error: err.message };
  }
}

// Get report comments
export async function getReportComments(reportId: string): Promise<{
  comments: ReportComment[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { comments: [], error: null };
    }

    const { data, error } = await supabase
      .from('report_comments')
      .select('*, user:users(raw_user_meta_data)')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { comments: data || [], error: null };
  } catch (err) {
    console.error('Error fetching comments:', err);
    return { comments: [], error: null };
  }
}

// Add comment
export async function addReportComment(
  userId: string,
  reportId: string,
  content: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('report_comments')
      .insert({
        user_id: userId,
        report_id: reportId,
        content
      });

    if (error) throw error;

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error adding comment:', err);
    return { success: false, error: err.message };
  }
}

// Get featured/latest reports for homepage
export async function getFeaturedReports(): Promise<ResearchReport[]> {
  return DEMO_REPORTS.slice(0, 3);
}

// Subscribe to research updates
export async function subscribeToResearch(email: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('research_subscribers')
      .upsert({ email, subscribed_at: new Date().toISOString() });

    if (error) throw error;

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error subscribing:', err);
    return { success: false, error: err.message };
  }
}
