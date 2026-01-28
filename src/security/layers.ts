/**
 * Security Layers - Defense in Depth Implementation
 *
 * This module implements a 4-layer security model:
 *
 * Layer 1: Authentication (WHO are you?)
 *   - Validates JWT/session is valid
 *   - Ensures user is not suspended
 *
 * Layer 2: Authorization (WHAT can you do?)
 *   - Role-based access control
 *   - Permission checks (e.g., 'portfolio.view_own')
 *
 * Layer 3: Resource Ownership (IS this yours?)
 *   - Tenant filtering (if multi-tenant)
 *   - Owner checks for "own" access patterns
 *
 * Layer 4: Database RLS (FINAL enforcement)
 *   - Row-level security policies in PostgreSQL
 *   - Even if code has bugs, DB rejects unauthorized
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserRole } from '../types/admin-database';
import type { Database } from '../types/database';
import {
  type Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasResourceAccess,
  isRoleAtLeast,
  ROLE_LEVELS,
} from './permissions';

// ============================================
// TYPES
// ============================================

export interface SecurityContext {
  userId: string;
  email: string | null;
  role: UserRole;
  isSuspended: boolean;
  sessionId?: string;
  ipAddress?: string;
}

export interface AuthResult {
  success: boolean;
  context?: SecurityContext;
  error?: string;
  errorCode?: SecurityErrorCode;
}

export type SecurityErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'USER_SUSPENDED'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_NOT_FOUND'
  | 'OWNERSHIP_REQUIRED'
  | 'ROLE_INSUFFICIENT'
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST';

export interface OwnershipCheck {
  table: keyof Database['public']['Tables'];
  resourceId: string;
  ownerField?: string; // defaults to 'user_id'
}

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  errorCode?: SecurityErrorCode;
}

// ============================================
// LAYER 1: AUTHENTICATION
// ============================================

/**
 * Layer 1: Verify user is authenticated
 * Checks: Valid session, user exists, not suspended
 */
export async function requireAuth(): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Authentication system not configured',
      errorCode: 'NOT_AUTHENTICATED',
    };
  }

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Not authenticated',
        errorCode: 'NOT_AUTHENTICATED',
      };
    }

    // Verify user still exists and get profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, is_suspended, suspended_reason')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'User profile not found',
        errorCode: 'NOT_AUTHENTICATED',
      };
    }

    // Check if suspended
    if (profile.is_suspended) {
      return {
        success: false,
        error: profile.suspended_reason || 'Account is suspended',
        errorCode: 'USER_SUSPENDED',
      };
    }

    return {
      success: true,
      context: {
        userId: profile.id,
        email: profile.email,
        role: profile.role as UserRole,
        isSuspended: profile.is_suspended,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      errorCode: 'NOT_AUTHENTICATED',
    };
  }
}

/**
 * Check if user is currently authenticated (lightweight check)
 */
export async function isAuthenticated(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Get current security context without throwing
 */
export async function getSecurityContext(): Promise<SecurityContext | null> {
  const result = await requireAuth();
  return result.success ? result.context! : null;
}

// ============================================
// LAYER 2: AUTHORIZATION
// ============================================

/**
 * Layer 2: Check if user has required permission
 */
export function requirePermission(
  context: SecurityContext,
  permission: Permission
): SecurityCheckResult {
  if (!hasPermission(context.role, permission)) {
    return {
      allowed: false,
      reason: `Missing permission: ${permission}`,
      errorCode: 'PERMISSION_DENIED',
    };
  }

  return { allowed: true };
}

/**
 * Layer 2: Check if user has ALL required permissions
 */
export function requireAllPermissions(
  context: SecurityContext,
  permissions: Permission[]
): SecurityCheckResult {
  if (!hasAllPermissions(context.role, permissions)) {
    const missing = permissions.filter(p => !hasPermission(context.role, p));
    return {
      allowed: false,
      reason: `Missing permissions: ${missing.join(', ')}`,
      errorCode: 'PERMISSION_DENIED',
    };
  }

  return { allowed: true };
}

/**
 * Layer 2: Check if user has ANY of the required permissions
 */
export function requireAnyPermission(
  context: SecurityContext,
  permissions: Permission[]
): SecurityCheckResult {
  if (!hasAnyPermission(context.role, permissions)) {
    return {
      allowed: false,
      reason: `Requires one of: ${permissions.join(', ')}`,
      errorCode: 'PERMISSION_DENIED',
    };
  }

  return { allowed: true };
}

/**
 * Layer 2: Check if user has minimum role level
 */
export function requireRole(
  context: SecurityContext,
  minimumRole: UserRole
): SecurityCheckResult {
  if (!isRoleAtLeast(context.role, minimumRole)) {
    return {
      allowed: false,
      reason: `Requires ${minimumRole} role or higher`,
      errorCode: 'ROLE_INSUFFICIENT',
    };
  }

  return { allowed: true };
}

/**
 * Layer 2: Check role level numerically
 */
export function requireRoleLevel(
  context: SecurityContext,
  minimumLevel: number
): SecurityCheckResult {
  const userLevel = ROLE_LEVELS[context.role];
  if (userLevel < minimumLevel) {
    return {
      allowed: false,
      reason: `Insufficient role level (${userLevel} < ${minimumLevel})`,
      errorCode: 'ROLE_INSUFFICIENT',
    };
  }

  return { allowed: true };
}

// ============================================
// LAYER 3: RESOURCE OWNERSHIP
// ============================================

/**
 * Layer 3: Verify user owns the resource
 */
export async function requireOwnership(
  context: SecurityContext,
  check: OwnershipCheck
): Promise<SecurityCheckResult> {
  const ownerField = check.ownerField || 'user_id';

  try {
    const { data, error } = await supabase
      .from(check.table)
      .select(ownerField)
      .eq('id', check.resourceId)
      .single();

    if (error || !data) {
      return {
        allowed: false,
        reason: 'Resource not found',
        errorCode: 'RESOURCE_NOT_FOUND',
      };
    }

    const ownerId = (data as Record<string, string>)[ownerField];
    if (ownerId !== context.userId) {
      return {
        allowed: false,
        reason: 'You do not own this resource',
        errorCode: 'OWNERSHIP_REQUIRED',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Ownership check error:', error);
    return {
      allowed: false,
      reason: 'Failed to verify ownership',
      errorCode: 'INVALID_REQUEST',
    };
  }
}

/**
 * Layer 3: Check ownership or admin override
 * Allows access if user owns resource OR has admin permission
 */
export async function requireOwnershipOrPermission(
  context: SecurityContext,
  check: OwnershipCheck,
  overridePermission: Permission
): Promise<SecurityCheckResult> {
  // First check if user has override permission (admin access)
  if (hasPermission(context.role, overridePermission)) {
    return { allowed: true };
  }

  // Otherwise, require ownership
  return requireOwnership(context, check);
}

/**
 * Layer 3: Check resource-based access
 * Combines permission check with ownership verification
 */
export async function requireResourceAccess(
  context: SecurityContext,
  resource: string,
  action: string,
  check: OwnershipCheck
): Promise<SecurityCheckResult> {
  // Check if user has '_all' permission (skip ownership check)
  const allPermission = `${resource}.${action}_all` as Permission;
  if (hasPermission(context.role, allPermission)) {
    return { allowed: true };
  }

  // Check if user has '_own' permission
  const ownPermission = `${resource}.${action}_own` as Permission;
  if (!hasPermission(context.role, ownPermission)) {
    return {
      allowed: false,
      reason: `Missing permission: ${ownPermission}`,
      errorCode: 'PERMISSION_DENIED',
    };
  }

  // Verify ownership
  return requireOwnership(context, check);
}

/**
 * Layer 3: Verify portfolio ownership
 * Specific helper for portfolio-related resources
 */
export async function requirePortfolioOwnership(
  context: SecurityContext,
  portfolioId: string
): Promise<SecurityCheckResult> {
  return requireOwnership(context, {
    table: 'portfolios',
    resourceId: portfolioId,
    ownerField: 'user_id',
  });
}

/**
 * Layer 3: Verify holding ownership (via portfolio)
 */
export async function requireHoldingOwnership(
  context: SecurityContext,
  holdingId: string
): Promise<SecurityCheckResult> {
  try {
    // First get the holding to find portfolio_id
    const { data: holding, error: holdingError } = await supabase
      .from('holdings')
      .select('portfolio_id')
      .eq('id', holdingId)
      .single();

    if (holdingError || !holding) {
      return {
        allowed: false,
        reason: 'Holding not found',
        errorCode: 'RESOURCE_NOT_FOUND',
      };
    }

    // Then verify portfolio ownership
    return requirePortfolioOwnership(context, holding.portfolio_id);
  } catch (error) {
    console.error('Holding ownership check error:', error);
    return {
      allowed: false,
      reason: 'Failed to verify holding ownership',
      errorCode: 'INVALID_REQUEST',
    };
  }
}

/**
 * Layer 3: Verify transaction ownership (via holding -> portfolio)
 */
export async function requireTransactionOwnership(
  context: SecurityContext,
  transactionId: string
): Promise<SecurityCheckResult> {
  try {
    // Get transaction -> holding -> portfolio chain
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select(`
        id,
        holding_id,
        holdings!inner (
          portfolio_id,
          portfolios!inner (
            user_id
          )
        )
      `)
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return {
        allowed: false,
        reason: 'Transaction not found',
        errorCode: 'RESOURCE_NOT_FOUND',
      };
    }

    // Extract user_id from nested structure
    const holding = transaction.holdings as unknown as {
      portfolio_id: string;
      portfolios: { user_id: string };
    };
    const ownerId = holding.portfolios.user_id;

    if (ownerId !== context.userId) {
      return {
        allowed: false,
        reason: 'You do not own this transaction',
        errorCode: 'OWNERSHIP_REQUIRED',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Transaction ownership check error:', error);
    return {
      allowed: false,
      reason: 'Failed to verify transaction ownership',
      errorCode: 'INVALID_REQUEST',
    };
  }
}

// ============================================
// COMBINED SECURITY CHECKS
// ============================================

/**
 * Combined check: Auth + Permission
 * Returns security context if successful
 */
export async function secureWithPermission(
  permission: Permission
): Promise<{ context: SecurityContext } | { error: string; errorCode: SecurityErrorCode }> {
  // Layer 1: Authentication
  const authResult = await requireAuth();
  if (!authResult.success) {
    return { error: authResult.error!, errorCode: authResult.errorCode! };
  }

  // Layer 2: Authorization
  const permResult = requirePermission(authResult.context!, permission);
  if (!permResult.allowed) {
    return { error: permResult.reason!, errorCode: permResult.errorCode! };
  }

  return { context: authResult.context! };
}

/**
 * Combined check: Auth + Role
 */
export async function secureWithRole(
  minimumRole: UserRole
): Promise<{ context: SecurityContext } | { error: string; errorCode: SecurityErrorCode }> {
  // Layer 1: Authentication
  const authResult = await requireAuth();
  if (!authResult.success) {
    return { error: authResult.error!, errorCode: authResult.errorCode! };
  }

  // Layer 2: Role check
  const roleResult = requireRole(authResult.context!, minimumRole);
  if (!roleResult.allowed) {
    return { error: roleResult.reason!, errorCode: roleResult.errorCode! };
  }

  return { context: authResult.context! };
}

/**
 * Combined check: Auth + Permission + Ownership
 */
export async function secureWithOwnership(
  permission: Permission,
  check: OwnershipCheck
): Promise<{ context: SecurityContext } | { error: string; errorCode: SecurityErrorCode }> {
  // Layer 1: Authentication
  const authResult = await requireAuth();
  if (!authResult.success) {
    return { error: authResult.error!, errorCode: authResult.errorCode! };
  }

  // Layer 2: Permission (for '_own' variant)
  const permResult = requirePermission(authResult.context!, permission);
  if (!permResult.allowed) {
    return { error: permResult.reason!, errorCode: permResult.errorCode! };
  }

  // Layer 3: Ownership
  const ownerResult = await requireOwnership(authResult.context!, check);
  if (!ownerResult.allowed) {
    return { error: ownerResult.reason!, errorCode: ownerResult.errorCode! };
  }

  return { context: authResult.context! };
}

/**
 * Combined check: Auth + Resource Access (with ownership or admin override)
 */
export async function secureResourceAccess(
  resource: string,
  action: string,
  check: OwnershipCheck
): Promise<{ context: SecurityContext } | { error: string; errorCode: SecurityErrorCode }> {
  // Layer 1: Authentication
  const authResult = await requireAuth();
  if (!authResult.success) {
    return { error: authResult.error!, errorCode: authResult.errorCode! };
  }

  // Layers 2+3: Permission + Ownership (combined)
  const accessResult = await requireResourceAccess(
    authResult.context!,
    resource,
    action,
    check
  );
  if (!accessResult.allowed) {
    return { error: accessResult.reason!, errorCode: accessResult.errorCode! };
  }

  return { context: authResult.context! };
}

// ============================================
// ERROR RESPONSE HELPERS
// ============================================

/**
 * Create a standardized security error response
 */
export function createSecurityError(
  errorCode: SecurityErrorCode,
  message?: string
): { error: string; errorCode: SecurityErrorCode; status: number } {
  const statusMap: Record<SecurityErrorCode, number> = {
    'NOT_AUTHENTICATED': 401,
    'SESSION_EXPIRED': 401,
    'USER_SUSPENDED': 403,
    'PERMISSION_DENIED': 403,
    'ROLE_INSUFFICIENT': 403,
    'OWNERSHIP_REQUIRED': 403,
    'RESOURCE_NOT_FOUND': 404,
    'RATE_LIMITED': 429,
    'INVALID_REQUEST': 400,
  };

  const defaultMessages: Record<SecurityErrorCode, string> = {
    'NOT_AUTHENTICATED': 'Authentication required',
    'SESSION_EXPIRED': 'Session has expired',
    'USER_SUSPENDED': 'Account is suspended',
    'PERMISSION_DENIED': 'Permission denied',
    'ROLE_INSUFFICIENT': 'Insufficient privileges',
    'OWNERSHIP_REQUIRED': 'Resource access denied',
    'RESOURCE_NOT_FOUND': 'Resource not found',
    'RATE_LIMITED': 'Too many requests',
    'INVALID_REQUEST': 'Invalid request',
  };

  return {
    error: message || defaultMessages[errorCode],
    errorCode,
    status: statusMap[errorCode],
  };
}

// ============================================
// RE-EXPORTS
// ============================================

export {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasResourceAccess,
  isRoleAtLeast,
  getRolePermissions,
} from './permissions';

export type { Permission } from './permissions';
