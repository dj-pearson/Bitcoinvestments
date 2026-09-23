/**
 * Scam Database Service
 *
 * Community scam reports stored in Supabase. Every call is guarded with
 * isSupabaseConfigured(): when the database is not configured the functions
 * return an explicit `unavailable` error instead of firing a request at the
 * placeholder host and reporting an empty (falsely "clean") result.
 *
 * Callers must treat `error !== null` as "we could not check", never as
 * "nothing found".
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  ScamReport,
  InsertScamReport,
  ScamSearchFilters,
  ScamReportComment,
  InsertScamReportComment,
  ScamReportWithCommunity,
  ScamSearchSuggestion,
} from '../types/admin-database';
import { pgrestContains } from '../lib/postgrestFilter';
import {
  escapeLike,
  isEvmAddress,
  isHttpUrl,
  normalizeAddress,
  normalizeWebsiteQuery,
} from '../lib/scamSafety';

export const SCAM_DB_UNAVAILABLE = 'unavailable';

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

const SORTABLE_COLUMNS = new Set([
  'created_at',
  'upvotes',
  'victims_count',
  'estimated_loss_usd',
]);

export interface ScamSearchResult {
  reports: ScamReportWithCommunity[];
  total: number;
  page: number;
  totalPages: number;
  error: string | null;
}

/**
 * Search verified scam reports with filters and pagination.
 */
export async function searchScamReports(
  filters: ScamSearchFilters = {},
  params?: { page?: number; limit?: number }
): Promise<ScamSearchResult> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  if (!isSupabaseConfigured()) {
    return { reports: [], total: 0, page, totalPages: 0, error: SCAM_DB_UNAVAILABLE };
  }

  const sortBy = filters.sort_by && SORTABLE_COLUMNS.has(filters.sort_by) ? filters.sort_by : 'created_at';
  const ascending = filters.sort_order === 'asc';

  let query = supabase
    .from('scam_reports')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending });

  if (filters.query) {
    const searchQuery = filters.query.trim();
    if (searchQuery.length >= 3) {
      const pattern = pgrestContains(searchQuery);
      query = query.or(
        `title.ilike.${pattern},description.ilike.${pattern},website_url.ilike.${pattern},token_name.ilike.${pattern}`
      );
    }
  }

  if (filters.scam_type) {
    query = Array.isArray(filters.scam_type)
      ? query.in('scam_type', filters.scam_type)
      : query.eq('scam_type', filters.scam_type);
  }

  if (filters.severity) {
    query = Array.isArray(filters.severity)
      ? query.in('severity', filters.severity)
      : query.eq('severity', filters.severity);
  }

  // Public views only ever list verified reports. An explicit status is used by
  // the admin moderation path; RLS still decides what the caller may read.
  query = query.eq('status', filters.status || 'verified');

  if (filters.blockchain) {
    query = query.eq('blockchain', filters.blockchain);
  }

  if (filters.source) {
    query = Array.isArray(filters.source)
      ? query.in('source', filters.source)
      : query.eq('source', filters.source);
  }

  if (filters.min_loss) {
    query = query.gte('estimated_loss_usd', filters.min_loss);
  }
  if (filters.max_loss) {
    query = query.lte('estimated_loss_usd', filters.max_loss);
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { reports: [], total: 0, page, totalPages: 0, error: error.message };
  }

  return {
    reports: (data || []) as ScamReportWithCommunity[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    error: null,
  };
}

/**
 * Search suggestions for partial input. Title matches need the database; the
 * scam-type and blockchain suggestions are local.
 */
export async function getSearchSuggestions(query: string): Promise<ScamSearchSuggestion[]> {
  if (!query || query.length < 2) return [];

  const suggestions: ScamSearchSuggestion[] = [];
  const lowerQuery = query.toLowerCase();

  if (isEvmAddress(query) || query.startsWith('bc1') || query.length > 30) {
    suggestions.push({
      type: 'address',
      value: query,
      label: `Check address: ${query.slice(0, 20)}…`,
    });
  }

  if (isSupabaseConfigured()) {
    const { data: titleMatches } = await supabase
      .from('scam_reports')
      .select('title, scam_type')
      .ilike('title', `%${escapeLike(query)}%`)
      .eq('status', 'verified')
      .limit(5);

    (titleMatches || []).forEach((match) => {
      suggestions.push({ type: 'keyword', value: match.title, label: match.title });
    });
  }

  const scamTypes = ['phishing', 'ponzi', 'rug_pull', 'fake_ico', 'impersonation', 'fake_exchange', 'pump_dump'];
  scamTypes.forEach((type) => {
    if (type.includes(lowerQuery) || type.replace(/_/g, ' ').includes(lowerQuery)) {
      suggestions.push({
        type: 'scam_type',
        value: type,
        label: `Type: ${type.replace(/_/g, ' ')}`,
      });
    }
  });

  SUPPORTED_BLOCKCHAINS.forEach((chain) => {
    if (chain.toLowerCase().includes(lowerQuery)) {
      suggestions.push({ type: 'blockchain', value: chain, label: `Blockchain: ${chain}` });
    }
  });

  return suggestions.slice(0, 8);
}

/**
 * Get a single scam report by ID. `notFound` distinguishes a missing row from
 * a failed request.
 */
export async function getScamReport(id: string): Promise<{
  report: ScamReport | null;
  error: string | null;
  notFound: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { report: null, error: SCAM_DB_UNAVAILABLE, notFound: false };
  }

  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    // Malformed UUIDs come back as invalid-input errors: treat as not found.
    const notFound = error.code === '22P02' || error.code === 'PGRST116';
    return { report: null, error: error.message, notFound };
  }

  if (!data) {
    return { report: null, error: null, notFound: true };
  }

  return { report: data as ScamReport, error: null, notFound: false };
}

/**
 * Validate and normalise a report before it is written.
 * Returns a list of human-readable problems (empty when valid).
 */
export function validateScamReport(report: InsertScamReport): string[] {
  const problems: string[] = [];
  if (!report.title || report.title.trim().length < 10) problems.push('Title must be at least 10 characters.');
  if (report.title && report.title.length > 200) problems.push('Title must be 200 characters or fewer.');
  if (!report.description || report.description.trim().length < 50) {
    problems.push('Description must be at least 50 characters.');
  }
  if (report.description && report.description.length > 10000) {
    problems.push('Description must be 10,000 characters or fewer.');
  }
  if (report.website_url && !isHttpUrl(report.website_url)) {
    problems.push('Website must be a full http:// or https:// address.');
  }
  (report.evidence_links || []).forEach((link) => {
    if (!isHttpUrl(link)) problems.push(`Evidence link is not an http(s) URL: ${link.slice(0, 60)}`);
  });
  if (report.victims_count !== undefined && (report.victims_count < 0 || report.victims_count > 10_000_000)) {
    problems.push('Number of victims looks out of range.');
  }
  if (
    report.estimated_loss_usd !== undefined &&
    report.estimated_loss_usd !== null &&
    (report.estimated_loss_usd < 0 || report.estimated_loss_usd > 100_000_000_000)
  ) {
    problems.push('Estimated loss looks out of range.');
  }
  return problems;
}

/**
 * Create a new scam report. Always pending; the database enforces this too
 * (migration 20260923000100_harden_scam_reports.sql).
 */
export async function createScamReport(report: InsertScamReport, userId: string) {
  if (!isSupabaseConfigured()) {
    return { report: null, error: 'Reporting is not available right now.' };
  }

  const problems = validateScamReport(report);
  if (problems.length > 0) {
    return { report: null, error: problems.join(' ') };
  }

  const { data, error } = await supabase
    .from('scam_reports')
    .insert({
      title: report.title.trim(),
      description: report.description.trim(),
      scam_type: report.scam_type,
      severity: report.severity,
      website_url: report.website_url?.trim() || null,
      wallet_addresses: report.wallet_addresses?.map(normalizeAddress) || null,
      email_addresses: report.email_addresses?.length ? report.email_addresses : null,
      token_name: report.token_name || null,
      token_symbol: report.token_symbol || null,
      blockchain: report.blockchain || null,
      contract_address: report.contract_address ? normalizeAddress(report.contract_address) : null,
      red_flags: report.red_flags?.length ? report.red_flags : null,
      victims_count: report.victims_count || 0,
      estimated_loss_usd: report.estimated_loss_usd ?? null,
      evidence_links: report.evidence_links?.length ? report.evidence_links.map((l) => l.trim()) : null,
      reported_by: userId,
      status: 'pending',
      source: 'user_reported',
    })
    .select()
    .single();

  if (error) {
    return { report: null, error: error.message };
  }

  return { report: data as ScamReport, error: null };
}

/**
 * Verify or reject a scam report (admin only; enforced by RLS).
 */
export async function verifyScamReport(
  id: string,
  adminId: string,
  status: 'verified' | 'rejected'
) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: SCAM_DB_UNAVAILABLE };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('scam_reports')
    .update({ status, verified_by: adminId, verified_at: now, updated_at: now })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, report: data as ScamReport, error: null };
}

/**
 * Comments for a scam report. Only the comment row is selected: commenter
 * emails are never fetched or displayed.
 */
export async function getScamReportComments(scamReportId: string) {
  if (!isSupabaseConfigured()) {
    return { comments: [] as ScamReportComment[], error: SCAM_DB_UNAVAILABLE };
  }

  const { data, error } = await supabase
    .from('scam_report_comments')
    .select('id, scam_report_id, user_id, comment, is_admin, created_at, updated_at')
    .eq('scam_report_id', scamReportId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    return { comments: [] as ScamReportComment[], error: error.message };
  }

  return { comments: (data || []) as ScamReportComment[], error: null };
}

export async function addScamReportComment(comment: InsertScamReportComment) {
  if (!isSupabaseConfigured()) {
    return { comment: null, error: SCAM_DB_UNAVAILABLE };
  }

  const text = comment.comment.trim();
  if (text.length < 2 || text.length > 5000) {
    return { comment: null, error: 'Comments must be between 2 and 5,000 characters.' };
  }

  const { data, error } = await supabase
    .from('scam_report_comments')
    .insert({ scam_report_id: comment.scam_report_id, user_id: comment.user_id, comment: text })
    .select()
    .single();

  if (error) {
    return { comment: null, error: error.message };
  }

  return { comment: data as ScamReportComment, error: null };
}

export interface ScamLookupResult {
  scams: ScamReport[];
  error: string | null;
}

/**
 * Look up a wallet address among verified reports. EVM addresses match
 * case-insensitively (both the typed and lowercased forms are tried, so rows
 * written before normalisation still match).
 */
export async function checkWalletAddress(address: string): Promise<ScamLookupResult> {
  if (!isSupabaseConfigured()) {
    return { scams: [], error: SCAM_DB_UNAVAILABLE };
  }

  const trimmed = address.trim();
  const candidates = Array.from(new Set([trimmed, normalizeAddress(trimmed)]));

  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .overlaps('wallet_addresses', candidates)
    .eq('status', 'verified')
    .limit(50);

  if (error) {
    return { scams: [], error: error.message };
  }

  return { scams: (data || []) as ScamReport[], error: null };
}

/**
 * Look up a contract address among verified reports (case-insensitive for EVM).
 */
export async function checkContractAddress(address: string): Promise<ScamLookupResult> {
  if (!isSupabaseConfigured()) {
    return { scams: [], error: SCAM_DB_UNAVAILABLE };
  }

  const trimmed = address.trim();
  let query = supabase.from('scam_reports').select('*').eq('status', 'verified');
  // EVM addresses are hex only, so ilike without wildcards is a
  // case-insensitive equality check.
  query = isEvmAddress(trimmed) ? query.ilike('contract_address', trimmed) : query.eq('contract_address', trimmed);

  const { data, error } = await query.limit(50);

  if (error) {
    return { scams: [], error: error.message };
  }

  return { scams: (data || []) as ScamReport[], error: null };
}

/**
 * Look up a website among verified reports. Scheme, "www." and trailing
 * slashes are ignored; LIKE wildcards in the input are matched literally.
 */
export async function checkWebsiteUrl(url: string): Promise<ScamLookupResult> {
  if (!isSupabaseConfigured()) {
    return { scams: [], error: SCAM_DB_UNAVAILABLE };
  }

  const needle = normalizeWebsiteQuery(url);
  if (needle.length < 3) {
    return { scams: [], error: 'Enter at least 3 characters of the website address.' };
  }

  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .ilike('website_url', `%${escapeLike(needle)}%`)
    .eq('status', 'verified')
    .limit(50);

  if (error) {
    return { scams: [], error: error.message };
  }

  return { scams: (data || []) as ScamReport[], error: null };
}

/**
 * Count of verified reports, for the community section header.
 */
export async function getVerifiedReportCount(): Promise<{ count: number | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { count: null, error: SCAM_DB_UNAVAILABLE };
  }
  const { count, error } = await supabase
    .from('scam_reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'verified');
  if (error) return { count: null, error: error.message };
  return { count: count ?? 0, error: null };
}
