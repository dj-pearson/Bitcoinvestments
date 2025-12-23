/**
 * Scam Database Service
 * Handles scam report operations including search, create, update, and verification
 */

import { supabase } from '../lib/supabase';
import type {
  ScamReport,
  InsertScamReport,
  UpdateScamReport,
  ScamSearchFilters,
  ScamCategory,
  ScamReportComment,
  InsertScamReportComment,
  ScamReportWithCommunity,
  ScamSearchSuggestion,
} from '../types/admin-database';

// Available blockchains for filtering
export const SUPPORTED_BLOCKCHAINS = [
  'Ethereum',
  'Bitcoin',
  'Solana',
  'Polygon',
  'BNB Chain',
  'Avalanche',
  'Arbitrum',
  'Optimism',
  'Fantom',
  'Base',
];

/**
 * Search scam reports with advanced filters
 */
export async function searchScamReports(
  filters: ScamSearchFilters = {},
  params?: { page?: number; limit?: number }
) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  // Determine sort column and order
  const sortBy = filters.sort_by || 'created_at';
  const sortOrder = filters.sort_order === 'asc';

  let query = supabase
    .from('scam_reports')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder });

  // Full-text search with OR for partial matches
  if (filters.query) {
    // Try textSearch first, fall back to ilike for partial matches
    const searchQuery = filters.query.trim();
    if (searchQuery.length >= 3) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,website_url.ilike.%${searchQuery}%,token_name.ilike.%${searchQuery}%`
      );
    }
  }

  // Filter by scam type
  if (filters.scam_type) {
    if (Array.isArray(filters.scam_type)) {
      query = query.in('scam_type', filters.scam_type);
    } else {
      query = query.eq('scam_type', filters.scam_type);
    }
  }

  // Filter by severity
  if (filters.severity) {
    if (Array.isArray(filters.severity)) {
      query = query.in('severity', filters.severity);
    } else {
      query = query.eq('severity', filters.severity);
    }
  }

  // Filter by status
  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    // Default to only showing verified reports for non-admins
    query = query.eq('status', 'verified');
  }

  // Filter by blockchain
  if (filters.blockchain) {
    query = query.eq('blockchain', filters.blockchain);
  }

  // Filter by source
  if (filters.source) {
    if (Array.isArray(filters.source)) {
      query = query.in('source', filters.source);
    } else {
      query = query.eq('source', filters.source);
    }
  }

  // Filter by trust score
  if (filters.min_trust_score !== undefined) {
    query = query.gte('trust_score', filters.min_trust_score);
  }

  // Filter by loss amount
  if (filters.min_loss) {
    query = query.gte('estimated_loss_usd', filters.min_loss);
  }
  if (filters.max_loss) {
    query = query.lte('estimated_loss_usd', filters.max_loss);
  }

  // Filter by date
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return {
      reports: [],
      total: 0,
      page,
      totalPages: 0,
      error: error.message,
    };
  }

  return {
    reports: data as ScamReportWithCommunity[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    error: null,
  };
}

/**
 * Get search suggestions based on partial input
 */
export async function getSearchSuggestions(query: string): Promise<ScamSearchSuggestion[]> {
  if (!query || query.length < 2) return [];

  const suggestions: ScamSearchSuggestion[] = [];
  const lowerQuery = query.toLowerCase();

  // Check if it looks like an address
  if (query.startsWith('0x') || query.startsWith('bc1') || query.length > 30) {
    suggestions.push({
      type: 'address',
      value: query,
      label: `Search for address: ${query.slice(0, 20)}...`,
    });
  }

  // Search in recent reports for matching titles
  const { data: titleMatches } = await supabase
    .from('scam_reports')
    .select('title, scam_type')
    .ilike('title', `%${query}%`)
    .eq('status', 'verified')
    .limit(5);

  if (titleMatches) {
    titleMatches.forEach((match) => {
      suggestions.push({
        type: 'keyword',
        value: match.title,
        label: match.title,
      });
    });
  }

  // Add scam type suggestions
  const scamTypes = ['phishing', 'ponzi', 'rug_pull', 'fake_ico', 'impersonation', 'fake_exchange', 'pump_dump'];
  scamTypes.forEach((type) => {
    if (type.includes(lowerQuery) || type.replace('_', ' ').includes(lowerQuery)) {
      suggestions.push({
        type: 'scam_type',
        value: type,
        label: `Type: ${type.replace('_', ' ').toUpperCase()}`,
      });
    }
  });

  // Add blockchain suggestions
  SUPPORTED_BLOCKCHAINS.forEach((chain) => {
    if (chain.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        type: 'blockchain',
        value: chain,
        label: `Blockchain: ${chain}`,
      });
    }
  });

  return suggestions.slice(0, 8);
}

/**
 * Get scam statistics by type
 */
export async function getScamStatsByType() {
  const { data, error } = await supabase
    .from('scam_reports')
    .select('scam_type')
    .eq('status', 'verified');

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  data.forEach((report) => {
    counts[report.scam_type] = (counts[report.scam_type] || 0) + 1;
  });

  return Object.entries(counts).map(([type, count]) => ({
    type,
    count,
    label: type.replace('_', ' ').toUpperCase(),
  }));
}

/**
 * Get scam statistics by blockchain
 */
export async function getScamStatsByBlockchain() {
  const { data, error } = await supabase
    .from('scam_reports')
    .select('blockchain')
    .eq('status', 'verified')
    .not('blockchain', 'is', null);

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  data.forEach((report) => {
    if (report.blockchain) {
      counts[report.blockchain] = (counts[report.blockchain] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([blockchain, count]) => ({ blockchain, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get single scam report by ID
 */
export async function getScamReport(id: string) {
  const { data, error} = await supabase
    .from('scam_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { report: null, error: error.message };
  }

  return { report: data as ScamReport, error: null };
}

/**
 * Create new scam report
 */
export async function createScamReport(
  report: InsertScamReport,
  userId: string
) {
  const { data, error } = await supabase
    .from('scam_reports')
    .insert({
      ...report,
      reported_by: userId,
      status: 'pending', // All new reports start as pending
    })
    .select()
    .single();

  if (error) {
    return { report: null, error: error.message };
  }

  return { report: data as ScamReport, error: null };
}

/**
 * Update scam report
 */
export async function updateScamReport(
  id: string,
  updates: UpdateScamReport
) {
  const { data, error } = await supabase
    .from('scam_reports')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { report: null, error: error.message };
  }

  return { report: data as ScamReport, error: null };
}

/**
 * Verify scam report (admin only)
 */
export async function verifyScamReport(
  id: string,
  adminId: string,
  status: 'verified' | 'rejected'
) {
  const { data, error } = await supabase
    .from('scam_reports')
    .update({
      status,
      verified_by: adminId,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, report: data as ScamReport, error: null };
}

/**
 * Delete scam report (admin only)
 */
export async function deleteScamReport(id: string) {
  const { error } = await supabase
    .from('scam_reports')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get scam categories
 */
export async function getScamCategories() {
  const { data, error } = await supabase
    .from('scam_categories')
    .select('*')
    .order('name');

  if (error) {
    return { categories: [], error: error.message };
  }

  return { categories: data as ScamCategory[], error: null };
}

/**
 * Get comments for a scam report
 */
export async function getScamReportComments(scamReportId: string) {
  const { data, error } = await supabase
    .from('scam_report_comments')
    .select('*, user:users!user_id(email)')
    .eq('scam_report_id', scamReportId)
    .order('created_at', { ascending: true });

  if (error) {
    return { comments: [], error: error.message };
  }

  return { comments: data as (ScamReportComment & { user: { email: string } })[], error: null };
}

/**
 * Add comment to scam report
 */
export async function addScamReportComment(
  comment: InsertScamReportComment
) {
  const { data, error } = await supabase
    .from('scam_report_comments')
    .insert(comment)
    .select()
    .single();

  if (error) {
    return { comment: null, error: error.message };
  }

  return { comment: data as ScamReportComment, error: null };
}

/**
 * Search for specific wallet address in scam database
 */
export async function checkWalletAddress(address: string) {
  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .contains('wallet_addresses', [address])
    .eq('status', 'verified');

  if (error) {
    return { scams: [], error: error.message };
  }

  return { scams: data as ScamReport[], error: null };
}

/**
 * Search for specific contract address in scam database
 */
export async function checkContractAddress(address: string) {
  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .eq('contract_address', address)
    .eq('status', 'verified');

  if (error) {
    return { scams: [], error: error.message };
  }

  return { scams: data as ScamReport[], error: null };
}

/**
 * Search for website URL in scam database
 */
export async function checkWebsiteUrl(url: string) {
  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .ilike('website_url', `%${url}%`)
    .eq('status', 'verified');

  if (error) {
    return { scams: [], error: error.message };
  }

  return { scams: data as ScamReport[], error: null };
}

/**
 * Get trending scams (most victims or highest loss)
 */
export async function getTrendingScams(limit: number = 10) {
  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .eq('status', 'verified')
    .order('victims_count', { ascending: false })
    .limit(limit);

  if (error) {
    return { scams: [], error: error.message };
  }

  return { scams: data as ScamReport[], error: null };
}

/**
 * Get recent scam reports
 */
export async function getRecentScams(limit: number = 10) {
  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .eq('status', 'verified')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { scams: [], error: error.message };
  }

  return { scams: data as ScamReport[], error: null };
}
