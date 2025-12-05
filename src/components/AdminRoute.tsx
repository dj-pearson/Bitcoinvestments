import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/admin-database';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

/**
 * Protected route component that requires admin role
 * @param children - Components to render if authorized
 * @param requiredRole - Minimum role required ('admin' or 'super_admin'). Defaults to 'admin'
 * @param fallbackPath - Path to redirect to if unauthorized. Defaults to '/'
 */
export function AdminRoute({
  children,
  requiredRole = 'admin',
  fallbackPath = '/'
}: AdminRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  const userRole = (user as any).role || 'user';

  const hasAccess = checkRoleAccess(userRole, requiredRole);

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

/**
 * Check if user role has access to required role level
 * Role hierarchy: user < admin < super_admin
 */
function checkRoleAccess(userRole: string, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<string, number> = {
    'user': 0,
    'admin': 1,
    'super_admin': 2,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 1;

  return userLevel >= requiredLevel;
}

/**
 * Hook to check if current user has admin access
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  if (!user) return false;

  const userRole = (user as any).role || 'user';
  return userRole === 'admin' || userRole === 'super_admin';
}

/**
 * Hook to check if current user has super admin access
 */
export function useIsSuperAdmin(): boolean {
  const { user } = useAuth();
  if (!user) return false;

  const userRole = (user as any).role || 'user';
  return userRole === 'super_admin';
}

/**
 * Hook to get current user's role
 */
export function useUserRole(): UserRole {
  const { user } = useAuth();
  return (user as any)?.role || 'user';
}
