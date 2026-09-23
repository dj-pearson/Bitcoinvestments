/**
 * Scam Community Service
 * Handles community voting, disputes, reputation, and watchlist features
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  ScamReportVote,
  ScamReportDispute,
  InsertScamReportDispute,
  ScamReporterReputation,
  ScamWatchlistItem,
  InsertScamWatchlistItem,
  VoteType,
  DisputeStatus,
} from '../types/admin-database';

// Untyped client for tables not in the generated schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** Returned by every function when Supabase is not configured. */
const UNAVAILABLE = 'unavailable';

// ==================== VOTING ====================

/**
 * Get user's vote on a scam report
 */
export async function getUserVote(scamReportId: string, userId: string) {
  if (!isSupabaseConfigured()) return { vote: null, error: UNAVAILABLE };

  const { data, error } = await db
    .from('scam_report_votes')
    .select('*')
    .eq('scam_report_id', scamReportId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    return { vote: null, error: error.message };
  }

  return { vote: data as ScamReportVote | null, error: null };
}

/**
 * Vote on a scam report
 */
export async function voteOnScamReport(
  scamReportId: string,
  userId: string,
  voteType: VoteType
) {
  if (!isSupabaseConfigured()) return { success: false, action: null, error: UNAVAILABLE };

  // Check if user already voted
  const { vote: existingVote } = await getUserVote(scamReportId, userId);

  if (existingVote) {
    // Update existing vote
    if (existingVote.vote_type === voteType) {
      // Same vote - remove it
      const { error } = await db
        .from('scam_report_votes')
        .delete()
        .eq('id', existingVote.id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, action: 'removed', error: null };
    } else {
      // Different vote - update it
      const { error } = await db
        .from('scam_report_votes')
        .update({ vote_type: voteType, updated_at: new Date().toISOString() })
        .eq('id', existingVote.id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, action: 'changed', error: null };
    }
  }

  // Create new vote
  const { error } = await db
    .from('scam_report_votes')
    .insert({
      scam_report_id: scamReportId,
      user_id: userId,
      vote_type: voteType,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, action: 'added', error: null };
}

/**
 * Get vote counts for a scam report
 * Note: upvotes, downvotes, trust_score columns are added by migration
 */
export async function getVoteCounts(scamReportId: string) {
  if (!isSupabaseConfigured()) {
    return { upvotes: 0, downvotes: 0, error: UNAVAILABLE };
  }

  const { data, error } = await db
    .from('scam_reports')
    .select('upvotes, downvotes')
    .eq('id', scamReportId)
    .single();

  if (error) {
    return { upvotes: 0, downvotes: 0, error: error.message };
  }

  return {
    upvotes: data?.upvotes || 0,
    downvotes: data?.downvotes || 0,
    error: null,
  };
}

// ==================== DISPUTES ====================

/**
 * Create a dispute for a scam report
 */
export async function createDispute(dispute: InsertScamReportDispute) {
  if (!isSupabaseConfigured()) return { dispute: null, error: UNAVAILABLE };

  // Check if user already has a pending dispute for this report
  const { data: existing } = await db
    .from('scam_report_disputes')
    .select('id')
    .eq('scam_report_id', dispute.scam_report_id)
    .eq('user_id', dispute.user_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return { dispute: null, error: 'You already have a pending dispute for this report' };
  }

  const { data, error } = await db
    .from('scam_report_disputes')
    .insert(dispute)
    .select()
    .single();

  if (error) {
    return { dispute: null, error: error.message };
  }

  return { dispute: data as ScamReportDispute, error: null };
}

/**
 * Get disputes for a scam report
 */
export async function getDisputesForReport(scamReportId: string) {
  if (!isSupabaseConfigured()) return { disputes: [], error: UNAVAILABLE };

  const { data, error } = await db
    .from('scam_report_disputes')
    .select('*')
    .eq('scam_report_id', scamReportId)
    .order('created_at', { ascending: false });

  if (error) {
    return { disputes: [], error: error.message };
  }

  return { disputes: data as ScamReportDispute[], error: null };
}

/**
 * Get user's disputes
 */
export async function getUserDisputes(userId: string) {
  if (!isSupabaseConfigured()) return { disputes: [], error: UNAVAILABLE };

  const { data, error } = await db
    .from('scam_report_disputes')
    .select('*, scam_report:scam_reports(id, title, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { disputes: [], error: error.message };
  }

  return { disputes: data, error: null };
}

/**
 * Update dispute status (admin only)
 */
export async function updateDisputeStatus(
  disputeId: string,
  status: DisputeStatus,
  adminId: string,
  adminNotes?: string
) {
  if (!isSupabaseConfigured()) return { dispute: null, error: UNAVAILABLE };

  const { data, error } = await db
    .from('scam_report_disputes')
    .update({
      status,
      admin_notes: adminNotes,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) {
    return { dispute: null, error: error.message };
  }

  // If dispute was overturned, update the scam report status
  if (status === 'overturned') {
    const dispute = data as ScamReportDispute;
    await db
      .from('scam_reports')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', dispute.scam_report_id);
  }

  return { dispute: data as ScamReportDispute, error: null };
}

// ==================== REPUTATION ====================

/**
 * Get user's reputation
 */
export async function getUserReputation(userId: string) {
  if (!isSupabaseConfigured()) return { reputation: null, error: UNAVAILABLE };

  const { data, error } = await db
    .from('scam_reporter_reputation')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { reputation: null, error: error.message };
  }

  // Return default reputation if not found
  if (!data) {
    return {
      reputation: {
        user_id: userId,
        total_reports: 0,
        verified_reports: 0,
        rejected_reports: 0,
        helpful_votes: 0,
        reputation_score: 50,
        badge: 'newcomer',
      } as ScamReporterReputation,
      error: null,
    };
  }

  return { reputation: data as ScamReporterReputation, error: null };
}

// ==================== WATCHLIST ====================

/**
 * Add to watchlist
 */
export async function addToWatchlist(item: InsertScamWatchlistItem) {
  if (!isSupabaseConfigured()) return { item: null, error: UNAVAILABLE };

  const { data, error } = await db
    .from('scam_watchlist')
    .insert(item)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { item: null, error: 'Already in your watchlist' };
    }
    return { item: null, error: error.message };
  }

  return { item: data as ScamWatchlistItem, error: null };
}

/**
 * Remove from watchlist
 */
export async function removeFromWatchlist(userId: string, scamReportId: string) {
  if (!isSupabaseConfigured()) return { success: false, error: UNAVAILABLE };

  const { error } = await db
    .from('scam_watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('scam_report_id', scamReportId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get user's watchlist
 */
export async function getUserWatchlist(userId: string) {
  if (!isSupabaseConfigured()) return { watchlist: [], error: UNAVAILABLE };

  const { data, error } = await db
    .from('scam_watchlist')
    .select('*, scam_report:scam_reports(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { watchlist: [], error: error.message };
  }

  return { watchlist: data, error: null };
}

/**
 * Check if item is in watchlist
 */
export async function isInWatchlist(userId: string, scamReportId: string) {
  if (!isSupabaseConfigured()) return { inWatchlist: false, error: UNAVAILABLE };

  const { data, error } = await db
    .from('scam_watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('scam_report_id', scamReportId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { inWatchlist: false, error: error.message };
  }

  return { inWatchlist: !!data, error: null };
}

// ==================== COMMUNITY STATS ====================

/**
 * Counts for the community section. Uses head-only count queries, so nothing
 * is downloaded row by row. Returns an error rather than zeros when the
 * database cannot be reached.
 */
export async function getCommunityStats(): Promise<{
  verifiedReports: number;
  totalVotes: number;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { verifiedReports: 0, totalVotes: 0, error: UNAVAILABLE };
  }

  const [verified, votes] = await Promise.all([
    db.from('scam_reports').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
    db.from('scam_report_votes').select('id', { count: 'exact', head: true }),
  ]);

  const error = verified.error?.message || votes.error?.message || null;
  return {
    verifiedReports: verified.count || 0,
    totalVotes: votes.count || 0,
    error,
  };
}
