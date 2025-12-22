import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Audit Logging Service
 *
 * Tracks administrative actions for compliance and security:
 * - User management actions
 * - Content moderation
 * - Configuration changes
 * - Security events
 */

export type AuditAction =
  // User management
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.suspended'
  | 'user.unsuspended'
  | 'user.role_changed'
  | 'user.password_reset'
  // Session management
  | 'session.terminated'
  | 'session.all_terminated'
  // Content moderation
  | 'content.approved'
  | 'content.rejected'
  | 'content.flagged'
  | 'content.deleted'
  // Subscription management
  | 'subscription.created'
  | 'subscription.cancelled'
  | 'subscription.refunded'
  | 'subscription.upgraded'
  // Scam reports
  | 'scam_report.verified'
  | 'scam_report.rejected'
  | 'scam_report.investigating'
  // Admin settings
  | 'settings.updated'
  | 'settings.ai_model_changed'
  // Security
  | 'security.2fa_enabled'
  | 'security.2fa_disabled'
  | 'security.suspicious_activity'
  // Other
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid';

export type AuditTargetType =
  | 'user'
  | 'subscription'
  | 'review'
  | 'scam_report'
  | 'article'
  | 'settings'
  | 'invoice'
  | 'session';

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email?: string;
  action: AuditAction;
  target_type: AuditTargetType | null;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogFilters {
  admin_id?: string;
  action?: AuditAction;
  target_type?: AuditTargetType;
  target_id?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Log an administrative action
 */
export async function logAuditEvent(params: {
  adminId: string;
  action: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    console.log('[Audit] Would log:', params);
    return { success: true, error: null };
  }

  try {
    const entry: Partial<AuditLogEntry> = {
      id: crypto.randomUUID(),
      admin_id: params.adminId,
      action: params.action,
      target_type: params.targetType || null,
      target_id: params.targetId || null,
      details: params.details || {},
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('admin_audit_logs').insert(entry);

    if (error) {
      // If table doesn't exist, log to console instead
      if (error.code === '42P01') {
        console.log('[Audit]', entry);
        return { success: true, error: null };
      }
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error logging audit event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log audit event',
    };
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<{ logs: AuditLogEntry[]; total: number; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { logs: [], total: 0, error: 'Database not configured' };
  }

  try {
    const { limit = 50, offset = 0 } = filters;

    let query = supabase
      .from('admin_audit_logs')
      .select('*, users!admin_audit_logs_admin_id_fkey(email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.admin_id) {
      query = query.eq('admin_id', filters.admin_id);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.target_type) {
      query = query.eq('target_type', filters.target_type);
    }

    if (filters.target_id) {
      query = query.eq('target_id', filters.target_id);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date.toISOString());
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date.toISOString());
    }

    const { data, count, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return { logs: [], total: 0, error: null };
      }
      throw error;
    }

    const logs: AuditLogEntry[] = (data || []).map((entry: Record<string, unknown>) => ({
      id: entry.id as string,
      admin_id: entry.admin_id as string,
      admin_email: (entry.users as { email?: string })?.email,
      action: entry.action as AuditAction,
      target_type: entry.target_type as AuditTargetType | null,
      target_id: entry.target_id as string | null,
      details: (entry.details || {}) as Record<string, unknown>,
      ip_address: entry.ip_address as string | undefined,
      user_agent: entry.user_agent as string | undefined,
      created_at: entry.created_at as string,
    }));

    return { logs, total: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return {
      logs: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch logs',
    };
  }
}

/**
 * Get audit logs for a specific target
 */
export async function getAuditLogsForTarget(
  targetType: AuditTargetType,
  targetId: string
): Promise<{ logs: AuditLogEntry[]; error: string | null }> {
  return getAuditLogs({
    target_type: targetType,
    target_id: targetId,
    limit: 100,
  }).then(({ logs, error }) => ({ logs, error }));
}

/**
 * Get recent admin activity
 */
export async function getRecentAdminActivity(
  adminId: string,
  limit = 10
): Promise<{ logs: AuditLogEntry[]; error: string | null }> {
  return getAuditLogs({
    admin_id: adminId,
    limit,
  }).then(({ logs, error }) => ({ logs, error }));
}

/**
 * Get audit summary for dashboard
 */
export async function getAuditSummary(): Promise<{
  summary: {
    total_actions_today: number;
    user_actions: number;
    content_actions: number;
    security_events: number;
    top_admins: Array<{ admin_id: string; count: number }>;
  } | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { summary: null, error: 'Database not configured' };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total actions today
    const { count: totalToday } = await supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Get user actions today
    const { count: userActions } = await supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact', head: true })
      .like('action', 'user.%')
      .gte('created_at', today.toISOString());

    // Get content actions today
    const { count: contentActions } = await supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact', head: true })
      .like('action', 'content.%')
      .gte('created_at', today.toISOString());

    // Get security events today
    const { count: securityEvents } = await supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact', head: true })
      .like('action', 'security.%')
      .gte('created_at', today.toISOString());

    // Get top admins (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: topAdminsData } = await supabase
      .from('admin_audit_logs')
      .select('admin_id')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Count actions per admin
    const adminCounts: Record<string, number> = {};
    for (const entry of topAdminsData || []) {
      adminCounts[entry.admin_id] = (adminCounts[entry.admin_id] || 0) + 1;
    }

    const topAdmins = Object.entries(adminCounts)
      .map(([admin_id, count]) => ({ admin_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      summary: {
        total_actions_today: totalToday || 0,
        user_actions: userActions || 0,
        content_actions: contentActions || 0,
        security_events: securityEvents || 0,
        top_admins: topAdmins,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching audit summary:', error);
    return {
      summary: null,
      error: error instanceof Error ? error.message : 'Failed to fetch summary',
    };
  }
}

/**
 * Format audit action for display
 */
export function formatAuditAction(action: AuditAction): string {
  const actionLabels: Record<AuditAction, string> = {
    'user.created': 'Created user',
    'user.updated': 'Updated user',
    'user.deleted': 'Deleted user',
    'user.suspended': 'Suspended user',
    'user.unsuspended': 'Unsuspended user',
    'user.role_changed': 'Changed user role',
    'user.password_reset': 'Reset password',
    'session.terminated': 'Terminated session',
    'session.all_terminated': 'Terminated all sessions',
    'content.approved': 'Approved content',
    'content.rejected': 'Rejected content',
    'content.flagged': 'Flagged content',
    'content.deleted': 'Deleted content',
    'subscription.created': 'Created subscription',
    'subscription.cancelled': 'Cancelled subscription',
    'subscription.refunded': 'Refunded subscription',
    'subscription.upgraded': 'Upgraded subscription',
    'scam_report.verified': 'Verified scam report',
    'scam_report.rejected': 'Rejected scam report',
    'scam_report.investigating': 'Started investigation',
    'settings.updated': 'Updated settings',
    'settings.ai_model_changed': 'Changed AI model',
    'security.2fa_enabled': 'Enabled 2FA',
    'security.2fa_disabled': 'Disabled 2FA',
    'security.suspicious_activity': 'Flagged suspicious activity',
    'invoice.created': 'Created invoice',
    'invoice.sent': 'Sent invoice',
    'invoice.paid': 'Marked invoice paid',
  };

  return actionLabels[action] || action;
}

/**
 * Get action icon and color for display
 */
export function getAuditActionStyle(action: AuditAction): {
  color: string;
  bgColor: string;
  icon: string;
} {
  if (action.startsWith('user.suspended') || action.startsWith('security.')) {
    return { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: 'alert-triangle' };
  }
  if (action.startsWith('content.rejected') || action.startsWith('scam_report.rejected')) {
    return { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: 'x-circle' };
  }
  if (action.startsWith('content.approved') || action.startsWith('scam_report.verified')) {
    return { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: 'check-circle' };
  }
  if (action.startsWith('settings.')) {
    return { color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: 'settings' };
  }
  if (action.startsWith('invoice.')) {
    return { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: 'file-text' };
  }
  return { color: 'text-slate-400', bgColor: 'bg-slate-500/20', icon: 'activity' };
}
