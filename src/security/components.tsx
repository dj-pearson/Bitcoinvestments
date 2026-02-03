/**
 * Security Components - Protected Wrappers
 *
 * React components for protecting routes and UI elements based on
 * authentication, permissions, and resource ownership.
 */

import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/admin-database';
import type { Permission } from './permissions';
import {
  usePermission,
  useAllPermissions,
  useAnyPermission,
  useRoleAtLeast,
  useIsOwner,
  useCanAccessResource,
  usePermissionGuard,
  useRoleGuard,
  useOwnershipGuard,
} from './hooks';

// ============================================
// LOADING & FALLBACK COMPONENTS
// ============================================

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className={`${sizeClasses[size]} border-orange-500 border-t-transparent rounded-full animate-spin`}
        />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}

interface AccessDeniedProps {
  reason?: string | null;
  showLogin?: boolean;
  redirectTo?: string;
}

function AccessDenied({ reason, showLogin = false, redirectTo }: AccessDeniedProps) {
  const location = useLocation();

  if (redirectTo) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-6">
          {reason || "You don't have permission to access this resource."}
        </p>
        {showLogin && (
          <Navigate to="/login" state={{ from: location.pathname }} replace />
        )}
      </div>
    </div>
  );
}

// ============================================
// ROUTE PROTECTION COMPONENTS
// ============================================

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Protect a route - requires authentication
 *
 * @example
 * <Route path="/dashboard" element={
 *   <RequireAuth>
 *     <Dashboard />
 *   </RequireAuth>
 * } />
 */
export function RequireAuth({
  children,
  fallback,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <>{fallback || <LoadingSpinner />}</>;
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (user.is_suspended) {
    return <AccessDenied reason="Your account has been suspended" />;
  }

  return <>{children}</>;
}

interface RequirePermissionProps extends ProtectedRouteProps {
  permission: Permission;
}

/**
 * Protect a route - requires specific permission
 *
 * @example
 * <Route path="/admin" element={
 *   <RequirePermission permission="admin.access">
 *     <AdminPanel />
 *   </RequirePermission>
 * } />
 */
export function RequirePermission({
  children,
  permission,
  fallback,
  redirectTo,
}: RequirePermissionProps) {
  const { loading } = useAuth();
  const { allowed, reason } = usePermissionGuard(permission);

  if (loading) {
    return <>{fallback || <LoadingSpinner />}</>;
  }

  if (!allowed) {
    return <AccessDenied reason={reason} redirectTo={redirectTo} />;
  }

  return <>{children}</>;
}

interface RequireAnyPermissionProps extends ProtectedRouteProps {
  permissions: Permission[];
}

/**
 * Protect a route - requires any of the specified permissions
 *
 * @example
 * <RequireAnyPermission permissions={['admin.access', 'super_admin.access']}>
 *   <AdminPanel />
 * </RequireAnyPermission>
 */
export function RequireAnyPermission({
  children,
  permissions,
  fallback,
  redirectTo,
}: RequireAnyPermissionProps) {
  const { user, loading } = useAuth();
  const hasAny = useAnyPermission(permissions);

  if (loading) {
    return <>{fallback || <LoadingSpinner />}</>;
  }

  if (!user) {
    return <AccessDenied reason="Authentication required" redirectTo={redirectTo || '/login'} />;
  }

  if (!hasAny) {
    return <AccessDenied reason={`Requires one of: ${permissions.join(', ')}`} redirectTo={redirectTo} />;
  }

  return <>{children}</>;
}

interface RequireAllPermissionsProps extends ProtectedRouteProps {
  permissions: Permission[];
}

/**
 * Protect a route - requires all specified permissions
 */
export function RequireAllPermissions({
  children,
  permissions,
  fallback,
  redirectTo,
}: RequireAllPermissionsProps) {
  const { user, loading } = useAuth();
  const hasAll = useAllPermissions(permissions);

  if (loading) {
    return <>{fallback || <LoadingSpinner />}</>;
  }

  if (!user) {
    return <AccessDenied reason="Authentication required" redirectTo={redirectTo || '/login'} />;
  }

  if (!hasAll) {
    return <AccessDenied reason={`Requires all: ${permissions.join(', ')}`} redirectTo={redirectTo} />;
  }

  return <>{children}</>;
}

interface RequireRoleProps extends ProtectedRouteProps {
  role: UserRole;
}

/**
 * Protect a route - requires minimum role level
 *
 * @example
 * <RequireRole role="admin">
 *   <AdminPanel />
 * </RequireRole>
 */
export function RequireRole({
  children,
  role,
  fallback,
  redirectTo,
}: RequireRoleProps) {
  const { loading } = useAuth();
  const { allowed, reason } = useRoleGuard(role);

  if (loading) {
    return <>{fallback || <LoadingSpinner />}</>;
  }

  if (!allowed) {
    return <AccessDenied reason={reason} redirectTo={redirectTo} />;
  }

  return <>{children}</>;
}

interface RequireOwnershipProps extends ProtectedRouteProps {
  ownerId: string | null | undefined;
  overridePermission?: Permission;
}

/**
 * Protect a route - requires resource ownership or override permission
 *
 * @example
 * <RequireOwnership ownerId={portfolio.user_id} overridePermission="portfolio.view_all">
 *   <PortfolioDetails />
 * </RequireOwnership>
 */
export function RequireOwnership({
  children,
  ownerId,
  overridePermission,
  fallback,
  redirectTo,
}: RequireOwnershipProps) {
  const { loading } = useAuth();
  const { allowed, reason } = useOwnershipGuard(ownerId, overridePermission);

  if (loading) {
    return <>{fallback || <LoadingSpinner />}</>;
  }

  if (!allowed) {
    return <AccessDenied reason={reason} redirectTo={redirectTo} />;
  }

  return <>{children}</>;
}

// ============================================
// CONDITIONAL RENDER COMPONENTS
// ============================================

interface ShowIfProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ShowIfPermissionProps extends ShowIfProps {
  permission: Permission;
}

/**
 * Conditionally render content based on permission
 *
 * @example
 * <ShowIfPermission permission="admin.users.edit">
 *   <EditUserButton />
 * </ShowIfPermission>
 */
export function ShowIfPermission({
  children,
  permission,
  fallback = null,
}: ShowIfPermissionProps) {
  const hasPermission = usePermission(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

interface ShowIfAnyPermissionProps extends ShowIfProps {
  permissions: Permission[];
}

/**
 * Conditionally render content based on any permission
 */
export function ShowIfAnyPermission({
  children,
  permissions,
  fallback = null,
}: ShowIfAnyPermissionProps) {
  const hasAny = useAnyPermission(permissions);
  return hasAny ? <>{children}</> : <>{fallback}</>;
}

interface ShowIfRoleProps extends ShowIfProps {
  role: UserRole;
}

/**
 * Conditionally render content based on role
 *
 * @example
 * <ShowIfRole role="admin">
 *   <AdminBadge />
 * </ShowIfRole>
 */
export function ShowIfRole({ children, role, fallback = null }: ShowIfRoleProps) {
  const hasRole = useRoleAtLeast(role);
  return hasRole ? <>{children}</> : <>{fallback}</>;
}

interface ShowIfOwnerProps extends ShowIfProps {
  ownerId: string | null | undefined;
}

/**
 * Conditionally render content based on ownership
 *
 * @example
 * <ShowIfOwner ownerId={post.author_id}>
 *   <EditPostButton />
 * </ShowIfOwner>
 */
export function ShowIfOwner({ children, ownerId, fallback = null }: ShowIfOwnerProps) {
  const isOwner = useIsOwner(ownerId);
  return isOwner ? <>{children}</> : <>{fallback}</>;
}

interface ShowIfOwnerOrPermissionProps extends ShowIfProps {
  ownerId: string | null | undefined;
  permission: Permission;
}

/**
 * Conditionally render content based on ownership OR permission
 *
 * @example
 * <ShowIfOwnerOrPermission ownerId={post.author_id} permission="article.edit_all">
 *   <EditButton />
 * </ShowIfOwnerOrPermission>
 */
export function ShowIfOwnerOrPermission({
  children,
  ownerId,
  permission,
  fallback = null,
}: ShowIfOwnerOrPermissionProps) {
  const canAccess = useCanAccessResource(ownerId, permission);
  return canAccess ? <>{children}</> : <>{fallback}</>;
}

interface ShowIfAuthenticatedProps extends ShowIfProps {}

/**
 * Conditionally render content for authenticated users
 *
 * @example
 * <ShowIfAuthenticated>
 *   <UserMenu />
 * </ShowIfAuthenticated>
 */
export function ShowIfAuthenticated({
  children,
  fallback = null,
}: ShowIfAuthenticatedProps) {
  const { user } = useAuth();
  return user ? <>{children}</> : <>{fallback}</>;
}

/**
 * Conditionally render content for guests (not authenticated)
 *
 * @example
 * <ShowIfGuest>
 *   <LoginButton />
 * </ShowIfGuest>
 */
export function ShowIfGuest({ children, fallback = null }: ShowIfProps) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? <>{children}</> : <>{fallback}</>;
}

// ============================================
// HIDE VARIANTS (inverse of Show)
// ============================================

/**
 * Hide content if user has permission
 */
export function HideIfPermission({
  children,
  permission,
}: ShowIfPermissionProps) {
  const hasPermission = usePermission(permission);
  return hasPermission ? null : <>{children}</>;
}

/**
 * Hide content if user has role
 */
export function HideIfRole({ children, role }: ShowIfRoleProps) {
  const hasRole = useRoleAtLeast(role);
  return hasRole ? null : <>{children}</>;
}

/**
 * Hide content if user is owner
 */
export function HideIfOwner({ children, ownerId }: ShowIfOwnerProps) {
  const isOwner = useIsOwner(ownerId);
  return isOwner ? null : <>{children}</>;
}

// ============================================
// UTILITY COMPONENTS
// ============================================

interface SecureActionProps {
  permission: Permission;
  onUnauthorized?: () => void;
  children: (authorized: boolean) => ReactNode;
}

/**
 * Render prop component for secure actions
 *
 * @example
 * <SecureAction permission="admin.users.delete">
 *   {(authorized) => (
 *     <Button disabled={!authorized} onClick={handleDelete}>
 *       Delete User
 *     </Button>
 *   )}
 * </SecureAction>
 */
export function SecureAction({
  permission,
  children,
}: SecureActionProps) {
  const authorized = usePermission(permission);
  return <>{children(authorized)}</>;
}

interface PermissionBadgeProps {
  permission: Permission;
  grantedLabel?: string;
  deniedLabel?: string;
}

/**
 * Display a badge showing permission status
 */
export function PermissionBadge({
  permission,
  grantedLabel = 'Granted',
  deniedLabel = 'Denied',
}: PermissionBadgeProps) {
  const hasPermission = usePermission(permission);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        hasPermission
          ? 'bg-green-500/10 text-green-400'
          : 'bg-red-500/10 text-red-400'
      }`}
    >
      {hasPermission ? grantedLabel : deniedLabel}
    </span>
  );
}
