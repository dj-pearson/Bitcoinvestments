/**
 * Research Reports Service
 *
 * Pay-per-report crypto research - individual deep-dive reports for $5-15 each.
 * Alternative to subscription for casual users who want specific coin analysis.
 */

import { supabase } from './database';

export interface ResearchReport {
  id: string;
  title: string;
  slug: string;
  cryptocurrency_id: string;
  cryptocurrency_name: string;
  cryptocurrency_symbol: string;
  summary: string;
  full_content?: string; // Only available after purchase
  key_findings: string[];
  price: number;
  currency: string;
  stripe_price_id?: string;
  author_name: string;
  report_type: 'deep_dive' | 'technical_analysis' | 'fundamental' | 'market_outlook' | 'sector_report';
  pages_count: number;
  ai_generated: boolean;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  view_count: number;
  purchase_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchReportPurchase {
  id: string;
  user_id: string;
  report_id: string;
  price_paid: number;
  currency: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  purchased_at?: string;
  download_count: number;
  last_accessed_at?: string;
  rating?: number;
  review?: string;
  created_at: string;
}

/**
 * Report pricing tiers based on complexity
 */
export const REPORT_PRICING = {
  deep_dive: {
    price: 14.99,
    description: 'Comprehensive analysis with 15+ pages',
    estimated_pages: 15,
  },
  technical_analysis: {
    price: 9.99,
    description: 'Technical indicators and chart patterns',
    estimated_pages: 10,
  },
  fundamental: {
    price: 12.99,
    description: 'Tokenomics, team, and project analysis',
    estimated_pages: 12,
  },
  market_outlook: {
    price: 7.99,
    description: 'Market trends and predictions',
    estimated_pages: 8,
  },
  sector_report: {
    price: 11.99,
    description: 'Industry sector deep dive',
    estimated_pages: 12,
  },
} as const;

/**
 * Get all published research reports
 */
export async function getPublishedReports(
  limit: number = 20,
  offset: number = 0,
  filters?: {
    cryptocurrency_id?: string;
    report_type?: string;
    minPrice?: number;
    maxPrice?: number;
  }
): Promise<ResearchReport[]> {
  let query = supabase
    .from('research_reports')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.cryptocurrency_id) {
    query = query.eq('cryptocurrency_id', filters.cryptocurrency_id);
  }
  if (filters?.report_type) {
    query = query.eq('report_type', filters.report_type);
  }
  if (filters?.minPrice) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }

  // Remove full_content from public listing
  return (data || []).map(report => ({
    ...report,
    full_content: undefined,
  }));
}

/**
 * Get a single report by slug (with content if purchased)
 */
export async function getReportBySlug(
  slug: string,
  userId?: string
): Promise<{ report: ResearchReport | null; hasPurchased: boolean }> {
  const { data: report, error } = await supabase
    .from('research_reports')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !report) {
    return { report: null, hasPurchased: false };
  }

  // Check if user has purchased
  let hasPurchased = false;
  if (userId) {
    const { data: purchase } = await supabase
      .from('research_report_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('report_id', report.id)
      .eq('status', 'completed')
      .single();

    hasPurchased = !!purchase;
  }

  // Increment view count
  await supabase
    .from('research_reports')
    .update({ view_count: report.view_count + 1 })
    .eq('id', report.id);

  // Only return full content if purchased
  return {
    report: {
      ...report,
      full_content: hasPurchased ? report.full_content : undefined,
    },
    hasPurchased,
  };
}

/**
 * Get user's purchased reports
 */
export async function getUserPurchasedReports(
  userId: string
): Promise<(ResearchReportPurchase & { report: ResearchReport })[]> {
  const { data, error } = await supabase
    .from('research_report_purchases')
    .select(`
      *,
      report:research_reports(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Error fetching user purchases:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if user has access to a report
 */
export async function hasReportAccess(
  userId: string,
  reportId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('research_report_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('report_id', reportId)
    .eq('status', 'completed')
    .single();

  return !!data;
}

/**
 * Create checkout session for report purchase
 */
export async function createReportCheckoutSession(
  reportId: string,
  userId: string,
  userEmail: string
): Promise<{ sessionId: string | null; url: string | null; error: string | null }> {
  try {
    const response = await fetch('/api/create-report-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportId,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/research/${reportId}?purchased=true`,
        cancelUrl: `${window.location.origin}/research/${reportId}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();
    return { sessionId, url, error: null };
  } catch (error) {
    console.error('Error creating report checkout:', error);
    return {
      sessionId: null,
      url: null,
      error: error instanceof Error ? error.message : 'Failed to start checkout',
    };
  }
}

/**
 * Rate a purchased report
 */
export async function rateReport(
  userId: string,
  reportId: string,
  rating: number,
  review?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('research_report_purchases')
    .update({
      rating,
      review,
    })
    .eq('user_id', userId)
    .eq('report_id', reportId)
    .eq('status', 'completed');

  if (error) {
    console.error('Error rating report:', error);
    return false;
  }

  // Update average rating on report
  const { data: purchases } = await supabase
    .from('research_report_purchases')
    .select('rating')
    .eq('report_id', reportId)
    .not('rating', 'is', null);

  if (purchases && purchases.length > 0) {
    const avgRating = purchases.reduce((sum, p) => sum + (p.rating || 0), 0) / purchases.length;
    await supabase
      .from('research_reports')
      .update({ average_rating: avgRating })
      .eq('id', reportId);
  }

  return true;
}

/**
 * Get featured/popular reports
 */
export async function getFeaturedReports(limit: number = 6): Promise<ResearchReport[]> {
  const { data, error } = await supabase
    .from('research_reports')
    .select('*')
    .eq('status', 'published')
    .order('purchase_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured reports:', error);
    return [];
  }

  return (data || []).map(report => ({
    ...report,
    full_content: undefined,
  }));
}

/**
 * Get reports by cryptocurrency
 */
export async function getReportsByCrypto(
  cryptocurrencyId: string,
  limit: number = 10
): Promise<ResearchReport[]> {
  const { data, error } = await supabase
    .from('research_reports')
    .select('*')
    .eq('status', 'published')
    .eq('cryptocurrency_id', cryptocurrencyId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching crypto reports:', error);
    return [];
  }

  return (data || []).map(report => ({
    ...report,
    full_content: undefined,
  }));
}

/**
 * Search reports
 */
export async function searchReports(query: string): Promise<ResearchReport[]> {
  const { data, error } = await supabase
    .from('research_reports')
    .select('*')
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,cryptocurrency_name.ilike.%${query}%,summary.ilike.%${query}%`)
    .order('purchase_count', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching reports:', error);
    return [];
  }

  return (data || []).map(report => ({
    ...report,
    full_content: undefined,
  }));
}
