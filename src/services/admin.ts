/**
 * Admin Services
 * Handles admin operations including user management, audit logging, and stats
 */

import { supabase } from '../lib/supabase';
import type {
  AdminUser,
  UserStats,
  ScamStats,
  InsertAdminAuditLog,
  AdminAuditLog,
  UserRole,
} from '../types/admin-database';

/**
 * Get all users with pagination
 */
export async function getAllUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  suspended?: boolean;
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply filters
  if (params?.search) {
    query = query.ilike('email', `%${params.search}%`);
  }

  if (params?.role) {
    query = query.eq('role', params.role);
  }

  if (params?.suspended !== undefined) {
    query = query.eq('is_suspended', params.suspended);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return {
      users: [],
      total: 0,
      page,
      totalPages: 0,
      error: error.message,
    };
  }

  return {
    users: data as AdminUser[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    error: null,
  };
}

/**
 * Get single user by ID
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data as AdminUser, error: null };
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: UserRole,
  adminId: string
) {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log the action
  await logAdminAction({
    admin_id: adminId,
    action: 'user.role_update',
    target_type: 'user',
    target_id: userId,
    details: { new_role: role },
  });

  return { success: true, error: null };
}

/**
 * Suspend user account
 */
export async function suspendUser(
  userId: string,
  reason: string,
  adminId: string
) {
  const { error } = await supabase
    .from('users')
    .update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspended_reason: reason,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log the action
  await logAdminAction({
    admin_id: adminId,
    action: 'user.suspend',
    target_type: 'user',
    target_id: userId,
    details: { reason },
  });

  return { success: true, error: null };
}

/**
 * Activate suspended user account
 */
export async function activateUser(userId: string, adminId: string) {
  const { error } = await supabase
    .from('users')
    .update({
      is_suspended: false,
      suspended_at: null,
      suspended_reason: null,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log the action
  await logAdminAction({
    admin_id: adminId,
    action: 'user.activate',
    target_type: 'user',
    target_id: userId,
  });

  return { success: true, error: null };
}

/**
 * Delete user account (soft delete by suspending)
 */
export async function deleteUser(userId: string, adminId: string) {
  // Instead of actually deleting, we suspend the account
  return suspendUser(userId, 'Account deleted by admin', adminId);
}

/**
 * Log admin action to audit trail
 */
export async function logAdminAction(log: InsertAdminAuditLog) {
  const { error } = await supabase.from('admin_audit_logs').insert(log);

  if (error) {
    console.error('Error logging admin action:', error);
  }
}

/**
 * Get admin audit logs with pagination
 */
export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  adminId?: string;
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('admin_audit_logs')
    .select('*, admin:users!admin_id(email)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params?.action) {
    query = query.eq('action', params.action);
  }

  if (params?.adminId) {
    query = query.eq('admin_id', params.adminId);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return {
      logs: [],
      total: 0,
      page,
      totalPages: 0,
      error: error.message,
    };
  }

  return {
    logs: data as (AdminAuditLog & { admin: { email: string } })[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    error: null,
  };
}

/**
 * Get user statistics for dashboard
 */
export async function getUserStats(): Promise<UserStats> {
  const { data, error } = await supabase.rpc('get_user_stats');

  if (error) {
    console.error('Error fetching user stats:', error);
    return {
      total_users: 0,
      active_users: 0,
      premium_users: 0,
      suspended_users: 0,
      new_users_7d: 0,
      new_users_30d: 0,
    };
  }

  return data[0] as UserStats;
}

/**
 * Get scam database statistics
 */
export async function getScamDatabaseStats(): Promise<ScamStats> {
  const { data, error } = await supabase.rpc('get_scam_stats');

  if (error) {
    console.error('Error fetching scam stats:', error);
    return {
      total_reports: 0,
      verified_reports: 0,
      pending_reports: 0,
      total_victims: 0,
      total_loss_usd: 0,
    };
  }

  return data[0] as ScamStats;
}

/**
 * Get recent user activity
 */
export async function getRecentActivity(limit: number = 10) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, created_at, last_login_at, subscription_status')
    .order('last_login_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    return { activities: [], error: error.message };
  }

  return { activities: data, error: null };
}
