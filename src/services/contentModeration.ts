/**
 * Content Moderation Service
 * 
 * Handles flagged content review, moderation actions, and content policies
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface FlaggedContent {
  id: string;
  type: 'review' | 'comment' | 'report';
  content: string;
  author_id: string;
  author_email?: string;
  status: 'pending' | 'approved' | 'rejected';
  flagged: boolean;
  flag_reason?: string;
  flagged_by?: string;
  moderated_by?: string;
  moderated_at?: string;
  created_at: string;
  updated_at: string;
}

interface GetFlaggedContentParams {
  type?: 'review' | 'comment' | 'report';
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}

/**
 * Get flagged content for moderation
 */
export async function getFlaggedContent(params?: GetFlaggedContentParams): Promise<{
  content: FlaggedContent[];
  total: number;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    // Return mock data for development
    const mockContent: FlaggedContent[] = [
      {
        id: '1',
        type: 'review',
        content: 'This exchange platform has been incredibly reliable for my trading needs. Highly recommended!',
        author_id: 'user_1',
        author_email: 'john@example.com',
        status: 'pending',
        flagged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'comment',
        content: 'Great article! I learned a lot about DCA strategies.',
        author_id: 'user_2',
        author_email: 'sarah@example.com',
        status: 'pending',
        flagged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        type: 'review',
        content: 'This content contains inappropriate language and should be reviewed.',
        author_id: 'user_3',
        author_email: 'flagged@example.com',
        status: 'pending',
        flagged: true,
        flag_reason: 'Inappropriate language',
        flagged_by: 'auto_moderation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '4',
        type: 'report',
        content: 'User reported suspicious activity from another account.',
        author_id: 'user_4',
        author_email: 'reporter@example.com',
        status: 'pending',
        flagged: true,
        flag_reason: 'User report',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filtered = mockContent;

    if (params?.type) {
      filtered = filtered.filter((c) => c.type === params.type);
    }
    if (params?.status) {
      filtered = filtered.filter((c) => c.status === params.status);
    }

    return {
      content: filtered,
      total: filtered.length,
      error: null,
    };
  }

  try {
    // Use any to bypass type checking for untyped table
    const client = supabase as any;
    let query = client
      .from('moderation_queue')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.type) {
      query = query.eq('type', params.type);
    }
    if (params?.status) {
      query = query.eq('status', params.status);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      content: (data as FlaggedContent[]) || [],
      total: count || 0,
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching flagged content:', error);
    return {
      content: [],
      total: 0,
      error: error.message || 'Failed to fetch content',
    };
  }
}

/**
 * Moderate content (approve or reject)
 */
export async function moderateContent(
  contentId: string,
  action: 'approve' | 'reject',
  moderatorId?: string,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    // Mock success for development
    return { success: true, error: null };
  }

  try {
    // Use any to bypass type checking for untyped table
    const client = supabase as any;
    const { error } = await client
      .from('moderation_queue')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        moderated_by: moderatorId,
        moderated_at: new Date().toISOString(),
        rejection_reason: action === 'reject' ? reason : null,
      })
      .eq('id', contentId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error moderating content:', error);
    return {
      success: false,
      error: error.message || 'Failed to moderate content',
    };
  }
}

/**
 * Flag content for review
 */
export async function flagContent(
  contentId: string,
  reason: string,
  flaggedBy: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    // Use any to bypass type checking for untyped table
    const client = supabase as any;
    const { error } = await client
      .from('moderation_queue')
      .update({
        flagged: true,
        flag_reason: reason,
        flagged_by: flaggedBy,
        status: 'pending',
      })
      .eq('id', contentId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error flagging content:', error);
    return {
      success: false,
      error: error.message || 'Failed to flag content',
    };
  }
}

/**
 * Get moderation statistics
 */
export async function getModerationStats(): Promise<{
  stats: {
    pending: number;
    approved_today: number;
    rejected_today: number;
    flagged: number;
  };
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return {
      stats: {
        pending: 12,
        approved_today: 24,
        rejected_today: 3,
        flagged: 5,
      },
      error: null,
    };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use any to bypass type checking for untyped table
    const client = supabase as any;
    const [pending, approvedToday, rejectedToday, flagged] = await Promise.all([
      client
        .from('moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      client
        .from('moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('moderated_at', today.toISOString()),
      client
        .from('moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('moderated_at', today.toISOString()),
      client
        .from('moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('flagged', true)
        .eq('status', 'pending'),
    ]);

    return {
      stats: {
        pending: pending.count || 0,
        approved_today: approvedToday.count || 0,
        rejected_today: rejectedToday.count || 0,
        flagged: flagged.count || 0,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching moderation stats:', error);
    return {
      stats: { pending: 0, approved_today: 0, rejected_today: 0, flagged: 0 },
      error: error.message || 'Failed to fetch stats',
    };
  }
}
