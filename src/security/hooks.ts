/**
 * Security Hooks - Client-side Permission Checks
 *
 * React hooks for checking permissions, roles, and access in components.
 * These are client-side convenience methods - always enforce security on the backend!
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/admin-database';
import {
  type Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasResourceAccess,
  isRoleAtLeast,
  ROLE_LEVELS,
  getRolePermissions,
} from './permissions';

// ============================================
// PERMISSION HOOKS
// ============================================

/**
 * Check if current user has a specific permission
 *
 * @example
 * const canViewAllPortfolios = usePermission('portfolio.view_all');
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user, permission]);
}

/**
 * Check if current user has ALL of the specified permissions
 *
 * @example
 * const canManageUsers = useAllPermissions(['admin.users.view', 'admin.users.edit']);
 */
export function useAllPermissions(permissions: Permission[]): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return hasAllPermissions(user.role, permissions);
  }, [user, permissions]);
}

/**
 * Check if current user has ANY of the specified permissions
 *
 * @example
 * const canAccessAdmin = useAnyPermission(['admin.access', 'super_admin.access']);
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return hasAnyPermission(user.role, permissions);
  }, [user, permissions]);
}

/**
 * Get all permissions for the current user
 *
 * @example
 * const permissions = useUserPermissions();
 * if (permissions.has('admin.access')) { ... }
 */
export function useUserPermissions(): Set<Permission> {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return new Set<Permission>();
    return getRolePermissions(user.role);
  }, [user]);
}

// ============================================
// ROLE HOOKS
// ============================================

/**
 * Check if current user has at least the specified role
 *
 * @example
 * const isAdminOrHigher = useRoleAtLeast('admin');
 */
export function useRoleAtLeast(minimumRole: UserRole): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return isRoleAtLeast(user.role, minimumRole);
  }, [user, minimumRole]);
}

/**
 * Check if current user has at least the specified role level
 *
 * @example
 * const isLevel2OrHigher = useRoleLevelAtLeast(2);
 */
export function useRoleLevelAtLeast(minimumLevel: number): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    const userLevel = ROLE_LEVELS[user.role];
    return userLevel >= minimumLevel;
  }, [user, minimumLevel]);
}

/**
 * Get the current user's role level
 *
 * @example
 * const roleLevel = useRoleLevel(); // 0 = user, 1 = admin, 2 = super_admin
 */
export function useRoleLevel(): number {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return -1;
    return ROLE_LEVELS[user.role];
  }, [user]);
}

// ============================================
// RESOURCE ACCESS HOOKS
// ============================================

/**
 * Check if user can access a resource with given action
 *
 * @example
 * const canEditPortfolio = useResourceAccess('portfolio', 'edit', isOwner);
 */
export function useResourceAccess(
  resource: string,
  action: string,
  isOwner: boolean
): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return hasResourceAccess(user.role, resource, action, isOwner);
  }, [user, resource, action, isOwner]);
}

/**
 * Get a function to check resource access dynamically
 *
 * @example
 * const checkAccess = useResourceAccessChecker('portfolio');
 * const canEdit = checkAccess('edit', isOwner);
 * const canDelete = checkAccess('delete', isOwner);
 */
export function useResourceAccessChecker(resource: string) {
  const { user } = useAuth();

  return useCallback(
    (action: string, isOwner: boolean): boolean => {
      if (!user) return false;
      return hasResourceAccess(user.role, resource, action, isOwner);
    },
    [user, resource]
  );
}

// ============================================
// OWNERSHIP HOOKS
// ============================================

/**
 * Check if current user owns a resource
 *
 * @example
 * const isOwner = useIsOwner(portfolio.user_id);
 */
export function useIsOwner(ownerId: string | null | undefined): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user || !ownerId) return false;
    return user.id === ownerId;
  }, [user, ownerId]);
}

/**
 * Check if current user can access based on ownership or permission
 *
 * @example
 * const canAccess = useCanAccessResource(
 *   portfolio.user_id,
 *   'portfolio.view_all'
 * );
 */
export function useCanAccessResource(
  ownerId: string | null | undefined,
  overridePermission: Permission
): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;

    // Check override permission (admin access)
    if (hasPermission(user.role, overridePermission)) {
      return true;
    }

    // Check ownership
    return ownerId === user.id;
  }, [user, ownerId, overridePermission]);
}

// ============================================
// COMBINED CHECK HOOKS
// ============================================

interface SecurityCheck {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSuspended: boolean;
  role: UserRole | null;
  roleLevel: number;
  userId: string | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessResource: (resource: string, action: string, isOwner: boolean) => boolean;
  isOwner: (ownerId: string | null | undefined) => boolean;
}

/**
 * Comprehensive security check hook
 * Returns all security-related information and check functions
 *
 * @example
 * const security = useSecurity();
 * if (security.isAuthenticated && security.hasPermission('admin.access')) {
 *   // Show admin panel
 * }
 */
export function useSecurity(): SecurityCheck {
  const { user } = useAuth();

  return useMemo(() => {
    const isAuthenticated = !!user;
    const role = user?.role ?? null;
    const roleLevel = role ? ROLE_LEVELS[role] : -1;
    const userId = user?.id ?? null;

    return {
      isAuthenticated,
      isAdmin: role === 'admin' || role === 'super_admin',
      isSuperAdmin: role === 'super_admin',
      isSuspended: user?.is_suspended ?? false,
      role,
      roleLevel,
      userId,

      hasPermission: (permission: Permission) => {
        if (!role) return false;
        return hasPermission(role, permission);
      },

      hasAnyPermission: (permissions: Permission[]) => {
        if (!role) return false;
        return hasAnyPermission(role, permissions);
      },

      hasAllPermissions: (permissions: Permission[]) => {
        if (!role) return false;
        return hasAllPermissions(role, permissions);
      },

      canAccessResource: (resource: string, action: string, isOwner: boolean) => {
        if (!role) return false;
        return hasResourceAccess(role, resource, action, isOwner);
      },

      isOwner: (ownerId: string | null | undefined) => {
        if (!userId || !ownerId) return false;
        return userId === ownerId;
      },
    };
  }, [user]);
}

// ============================================
// GUARD HOOKS (for conditional rendering)
// ============================================

interface GuardResult {
  allowed: boolean;
  reason: string | null;
}

/**
 * Permission guard with reason
 *
 * @example
 * const { allowed, reason } = usePermissionGuard('admin.access');
 * if (!allowed) return <AccessDenied reason={reason} />;
 */
export function usePermissionGuard(permission: Permission): GuardResult {
  const { user, loading } = useAuth();

  return useMemo(() => {
    if (loading) {
      return { allowed: false, reason: 'Loading...' };
    }

    if (!user) {
      return { allowed: false, reason: 'Authentication required' };
    }

    if (user.is_suspended) {
      return { allowed: false, reason: 'Account is suspended' };
    }

    if (!hasPermission(user.role, permission)) {
      return { allowed: false, reason: `Missing permission: ${permission}` };
    }

    return { allowed: true, reason: null };
  }, [user, loading, permission]);
}

/**
 * Role guard with reason
 *
 * @example
 * const { allowed, reason } = useRoleGuard('admin');
 * if (!allowed) return <AccessDenied reason={reason} />;
 */
export function useRoleGuard(minimumRole: UserRole): GuardResult {
  const { user, loading } = useAuth();

  return useMemo(() => {
    if (loading) {
      return { allowed: false, reason: 'Loading...' };
    }

    if (!user) {
      return { allowed: false, reason: 'Authentication required' };
    }

    if (user.is_suspended) {
      return { allowed: false, reason: 'Account is suspended' };
    }

    if (!isRoleAtLeast(user.role, minimumRole)) {
      return { allowed: false, reason: `Requires ${minimumRole} role or higher` };
    }

    return { allowed: true, reason: null };
  }, [user, loading, minimumRole]);
}

/**
 * Ownership guard with reason
 *
 * @example
 * const { allowed, reason } = useOwnershipGuard(resource.user_id, 'portfolio.view_all');
 */
export function useOwnershipGuard(
  ownerId: string | null | undefined,
  overridePermission?: Permission
): GuardResult {
  const { user, loading } = useAuth();

  return useMemo(() => {
    if (loading) {
      return { allowed: false, reason: 'Loading...' };
    }

    if (!user) {
      return { allowed: false, reason: 'Authentication required' };
    }

    if (user.is_suspended) {
      return { allowed: false, reason: 'Account is suspended' };
    }

    // Check override permission
    if (overridePermission && hasPermission(user.role, overridePermission)) {
      return { allowed: true, reason: null };
    }

    // Check ownership
    if (ownerId !== user.id) {
      return { allowed: false, reason: 'You do not own this resource' };
    }

    return { allowed: true, reason: null };
  }, [user, loading, ownerId, overridePermission]);
}
