import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0D14]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login with admin return path
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname, isAdmin: true }} replace />;
  }

  // Check if user has required role (role is now properly typed in AuthUser)
  const userRole = user.role;

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

  return user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Hook to check if current user has super admin access
 */
export function useIsSuperAdmin(): boolean {
  const { user } = useAuth();
  if (!user) return false;

  return user.role === 'super_admin';
}

/**
 * Hook to get current user's role
 */
export function useUserRole(): UserRole {
  const { user } = useAuth();
  return user?.role || 'user';
}
