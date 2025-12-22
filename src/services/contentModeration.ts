import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Content Moderation Service
 *
 * Provides moderation tools for user-generated content:
 * - Review queue for pending content
 * - Approval/rejection workflow
 * - Moderation history
 * - Content flagging
 */

export type ContentType = 'review' | 'comment' | 'scam_report' | 'article';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ModerationAction = 'approve' | 'reject' | 'flag' | 'unflag' | 'delete';

export interface ModerationItem {
  id: string;
  content_type: ContentType;
  content_id: string;
  content_preview: string;
  author_id: string;
  author_email?: string;
  status: ModerationStatus;
  flagged_reason?: string;
  moderated_by?: string;
  moderated_at?: string;
  created_at: string;
}

export interface ModerationLog {
  id: string;
  content_type: ContentType;
  content_id: string;
  action: ModerationAction;
  performed_by: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ModerationStats {
  pending_count: number;
  approved_today: number;
  rejected_today: number;
  flagged_count: number;
  by_type: Record<ContentType, number>;
}

/**
 * Get moderation queue
 */
export async function getModerationQueue(
  options: {
    contentType?: ContentType;
    status?: ModerationStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ items: ModerationItem[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { items: [], error: 'Database not configured' };
  }

  const { contentType, status = 'pending', limit = 50, offset = 0 } = options;

  try {
    // For now, we'll query platform_reviews as the main moderation target
    let query = supabase
      .from('platform_reviews')
      .select('id, user_id, platform_type, platform_id, title, content, status, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reviews, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return { items: [], error: null };
      }
      throw error;
    }

    const items: ModerationItem[] = (reviews || []).map((review) => ({
      id: `review-${review.id}`,
      content_type: 'review' as ContentType,
      content_id: review.id,
      content_preview: `${review.title}: ${review.content.substring(0, 200)}...`,
      author_id: review.user_id,
      status: review.status as ModerationStatus,
      created_at: review.created_at,
    }));

    return { items, error: null };
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch queue',
    };
  }
}

/**
 * Get moderation statistics
 */
export async function getModerationStats(): Promise<{
  stats: ModerationStats | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { stats: null, error: 'Database not configured' };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get pending reviews count
    const { count: pendingCount } = await supabase
      .from('platform_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get approved today
    const { count: approvedToday } = await supabase
      .from('platform_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('updated_at', today.toISOString());

    // Get rejected today
    const { count: rejectedToday } = await supabase
      .from('platform_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')
      .gte('updated_at', today.toISOString());

    // Get pending scam reports
    const { count: pendingScams } = await supabase
      .from('scam_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const stats: ModerationStats = {
      pending_count: (pendingCount || 0) + (pendingScams || 0),
      approved_today: approvedToday || 0,
      rejected_today: rejectedToday || 0,
      flagged_count: 0, // Would need separate flagged column
      by_type: {
        review: pendingCount || 0,
        comment: 0,
        scam_report: pendingScams || 0,
        article: 0,
      },
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}

/**
 * Moderate content (approve, reject, flag)
 */
export async function moderateContent(
  contentType: ContentType,
  contentId: string,
  action: ModerationAction,
  moderatorId: string,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    let table = '';
    let newStatus = '';

    switch (contentType) {
      case 'review':
        table = 'platform_reviews';
        break;
      case 'scam_report':
        table = 'scam_reports';
        break;
      default:
        return { success: false, error: `Unknown content type: ${contentType}` };
    }

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'flag':
        newStatus = 'flagged';
        break;
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }

    // Update content status
    const { error: updateError } = await supabase
      .from(table)
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentId);

    if (updateError) {
      throw updateError;
    }

    // Log the moderation action
    await logModerationAction({
      content_type: contentType,
      content_id: contentId,
      action,
      performed_by: moderatorId,
      reason,
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error moderating content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to moderate content',
    };
  }
}

/**
 * Log moderation action
 */
async function logModerationAction(log: Omit<ModerationLog, 'id' | 'created_at'>): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('moderation_logs').insert({
      id: crypto.randomUUID(),
      ...log,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log but don't fail - moderation logs are non-critical
    console.warn('Failed to log moderation action:', error);
  }
}

/**
 * Get moderation history for a content item
 */
export async function getModerationHistory(
  contentType: ContentType,
  contentId: string
): Promise<{ logs: ModerationLog[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { logs: [], error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('moderation_logs')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return { logs: [], error: null };
      }
      throw error;
    }

    return { logs: data || [], error: null };
  } catch (error) {
    console.error('Error fetching moderation history:', error);
    return {
      logs: [],
      error: error instanceof Error ? error.message : 'Failed to fetch history',
    };
  }
}

/**
 * Bulk moderate content
 */
export async function bulkModerate(
  items: Array<{ contentType: ContentType; contentId: string }>,
  action: ModerationAction,
  moderatorId: string,
  reason?: string
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const item of items) {
    const result = await moderateContent(
      item.contentType,
      item.contentId,
      action,
      moderatorId,
      reason
    );

    if (!result.success && result.error) {
      errors.push(`${item.contentId}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Check content for prohibited patterns
 */
export function checkContentForViolations(content: string): {
  hasViolations: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check for common spam patterns
  const spamPatterns = [
    /buy\s+now\s+cheap/i,
    /click\s+here\s+to\s+win/i,
    /free\s+money/i,
    /guaranteed\s+returns/i,
    /double\s+your\s+(money|bitcoin|crypto)/i,
    /send\s+\d+\s+(btc|eth|crypto)/i,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      violations.push('Potential spam detected');
      break;
    }
  }

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    violations.push('Excessive use of capital letters');
  }

  // Check for repeated characters
  if (/(.)\1{5,}/.test(content)) {
    violations.push('Repeated character spam detected');
  }

  // Check for too many links
  const linkCount = (content.match(/https?:\/\//gi) || []).length;
  if (linkCount > 3) {
    violations.push('Too many links');
  }

  return {
    hasViolations: violations.length > 0,
    violations,
  };
}
