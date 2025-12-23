/**
 * Scam Community Service
 * Handles community voting, disputes, reputation, and watchlist features
 */

import { supabase } from '../lib/supabase';
import type {
  ScamReportVote,
  InsertScamReportVote,
  ScamReportDispute,
  InsertScamReportDispute,
  ScamReporterReputation,
  ScamWatchlistItem,
  InsertScamWatchlistItem,
  VoteType,
  DisputeStatus,
} from '../types/admin-database';

// ==================== VOTING ====================

/**
 * Get user's vote on a scam report
 */
export async function getUserVote(scamReportId: string, userId: string) {
  const { data, error } = await supabase
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
  // Check if user already voted
  const { vote: existingVote } = await getUserVote(scamReportId, userId);

  if (existingVote) {
    // Update existing vote
    if (existingVote.vote_type === voteType) {
      // Same vote - remove it
      const { error } = await supabase
        .from('scam_report_votes')
        .delete()
        .eq('id', existingVote.id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, action: 'removed', error: null };
    } else {
      // Different vote - update it
      const { error } = await supabase
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
  const { error } = await supabase
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
 */
export async function getVoteCounts(scamReportId: string) {
  const { data, error } = await supabase
    .from('scam_reports')
    .select('upvotes, downvotes, trust_score')
    .eq('id', scamReportId)
    .single();

  if (error) {
    return { upvotes: 0, downvotes: 0, trustScore: 50, error: error.message };
  }

  return {
    upvotes: data.upvotes || 0,
    downvotes: data.downvotes || 0,
    trustScore: data.trust_score || 50,
    error: null,
  };
}

// ==================== DISPUTES ====================

/**
 * Create a dispute for a scam report
 */
export async function createDispute(dispute: InsertScamReportDispute) {
  // Check if user already has a pending dispute for this report
  const { data: existing } = await supabase
    .from('scam_report_disputes')
    .select('id')
    .eq('scam_report_id', dispute.scam_report_id)
    .eq('user_id', dispute.user_id)
    .eq('status', 'pending')
    .single();

  if (existing) {
    return { dispute: null, error: 'You already have a pending dispute for this report' };
  }

  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
    await supabase
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
  const { data, error } = await supabase
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

/**
 * Update user reputation after report verification
 */
export async function updateReputationOnVerification(
  userId: string,
  wasVerified: boolean
) {
  const { reputation } = await getUserReputation(userId);

  if (!reputation) return;

  const newTotalReports = reputation.total_reports + 1;
  const newVerifiedReports = reputation.verified_reports + (wasVerified ? 1 : 0);
  const newRejectedReports = reputation.rejected_reports + (wasVerified ? 0 : 1);

  // Calculate new score
  let newScore = reputation.reputation_score;
  if (wasVerified) {
    newScore = Math.min(100, newScore + 5);
  } else {
    newScore = Math.max(0, newScore - 10);
  }

  // Determine badge
  let badge = 'newcomer';
  if (newVerifiedReports >= 50 && newScore >= 90) {
    badge = 'guardian';
  } else if (newVerifiedReports >= 25 && newScore >= 80) {
    badge = 'expert';
  } else if (newVerifiedReports >= 10 && newScore >= 70) {
    badge = 'trusted';
  } else if (newVerifiedReports >= 5 && newScore >= 60) {
    badge = 'contributor';
  }

  const { error } = await supabase
    .from('scam_reporter_reputation')
    .upsert({
      user_id: userId,
      total_reports: newTotalReports,
      verified_reports: newVerifiedReports,
      rejected_reports: newRejectedReports,
      helpful_votes: reputation.helpful_votes,
      reputation_score: newScore,
      badge,
      updated_at: new Date().toISOString(),
    });

  return { error };
}

/**
 * Get top reporters (leaderboard)
 */
export async function getTopReporters(limit: number = 10) {
  const { data, error } = await supabase
    .from('scam_reporter_reputation')
    .select('*')
    .order('reputation_score', { ascending: false })
    .order('verified_reports', { ascending: false })
    .limit(limit);

  if (error) {
    return { reporters: [], error: error.message };
  }

  return { reporters: data as ScamReporterReputation[], error: null };
}

// ==================== WATCHLIST ====================

/**
 * Add to watchlist
 */
export async function addToWatchlist(item: InsertScamWatchlistItem) {
  const { data, error } = await supabase
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
  const { error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
 * Get community statistics
 */
export async function getCommunityStats() {
  const [
    { count: totalReports },
    { count: verifiedReports },
    { count: totalDisputes },
    { data: totalVotes },
  ] = await Promise.all([
    supabase.from('scam_reports').select('*', { count: 'exact', head: true }),
    supabase.from('scam_reports').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
    supabase.from('scam_report_disputes').select('*', { count: 'exact', head: true }),
    supabase.from('scam_report_votes').select('id'),
  ]);

  // Get unique contributors
  const { data: contributors } = await supabase
    .from('scam_reporter_reputation')
    .select('id')
    .gt('total_reports', 0);

  return {
    totalReports: totalReports || 0,
    verifiedReports: verifiedReports || 0,
    totalDisputes: totalDisputes || 0,
    totalVotes: totalVotes?.length || 0,
    totalContributors: contributors?.length || 0,
  };
}
