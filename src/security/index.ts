/**
 * Security Module - Defense in Depth
 *
 * This module provides a comprehensive 4-layer security architecture:
 *
 * Layer 1: Authentication (WHO are you?)
 *   - requireAuth, isAuthenticated, getSecurityContext
 *
 * Layer 2: Authorization (WHAT can you do?)
 *   - requirePermission, requireRole, requireRoleLevel
 *   - Permission constants and role mappings
 *
 * Layer 3: Resource Ownership (IS this yours?)
 *   - requireOwnership, requireOwnershipOrPermission
 *   - Resource-specific helpers (portfolio, holding, transaction)
 *
 * Layer 4: Database RLS (FINAL enforcement)
 *   - Implemented in Supabase migrations
 *   - See /supabase/migrations/ for RLS policies
 *
 * @example
 * // Backend usage
 * import { secureWithPermission, secureResourceAccess } from '@/security';
 *
 * async function deletePortfolio(portfolioId: string) {
 *   const result = await secureResourceAccess('portfolio', 'delete', {
 *     table: 'portfolios',
 *     resourceId: portfolioId,
 *   });
 *
 *   if ('error' in result) {
 *     throw new Error(result.error);
 *   }
 *
 *   // Proceed with delete...
 * }
 *
 * @example
 * // Frontend usage
 * import { usePermission, RequirePermission, ShowIfOwner } from '@/security';
 *
 * function AdminButton() {
 *   const canManage = usePermission('admin.users.edit');
 *   return canManage ? <button>Manage Users</button> : null;
 * }
 *
 * function ProtectedPage() {
 *   return (
 *     <RequirePermission permission="admin.access">
 *       <AdminPanel />
 *     </RequirePermission>
 *   );
 * }
 */

// ============================================
// PERMISSIONS
// ============================================

export {
  // Constants
  PERMISSIONS,
  ROLE_LEVELS,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_DESCRIPTIONS,

  // Types
  type Permission,

  // Utilities
  getRolePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasResourceAccess,
  isRoleAtLeast,
} from './permissions';

// ============================================
// SECURITY LAYERS
// ============================================

export {
  // Types
  type SecurityContext,
  type AuthResult,
  type SecurityErrorCode,
  type OwnershipCheck,
  type SecurityCheckResult,

  // Layer 1: Authentication
  requireAuth,
  isAuthenticated,
  getSecurityContext,

  // Layer 2: Authorization
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireRole,
  requireRoleLevel,

  // Layer 3: Resource Ownership
  requireOwnership,
  requireOwnershipOrPermission,
  requireResourceAccess,
  requirePortfolioOwnership,
  requireHoldingOwnership,
  requireTransactionOwnership,

  // Combined checks
  secureWithPermission,
  secureWithRole,
  secureWithOwnership,
  secureResourceAccess,

  // Error helpers
  createSecurityError,
} from './layers';

// ============================================
// REACT HOOKS
// ============================================

export {
  // Permission hooks
  usePermission,
  useAllPermissions,
  useAnyPermission,
  useUserPermissions,

  // Role hooks
  useRoleAtLeast,
  useRoleLevelAtLeast,
  useRoleLevel,

  // Resource access hooks
  useResourceAccess,
  useResourceAccessChecker,

  // Ownership hooks
  useIsOwner,
  useCanAccessResource,

  // Combined hooks
  useSecurity,

  // Guard hooks
  usePermissionGuard,
  useRoleGuard,
  useOwnershipGuard,
} from './hooks';

// ============================================
// REACT COMPONENTS
// ============================================

export {
  // Route protection
  RequireAuth,
  RequirePermission,
  RequireAnyPermission,
  RequireAllPermissions,
  RequireRole,
  RequireOwnership,

  // Conditional rendering - Show
  ShowIfPermission,
  ShowIfAnyPermission,
  ShowIfRole,
  ShowIfOwner,
  ShowIfOwnerOrPermission,
  ShowIfAuthenticated,
  ShowIfGuest,

  // Conditional rendering - Hide
  HideIfPermission,
  HideIfRole,
  HideIfOwner,

  // Utilities
  SecureAction,
  PermissionBadge,
} from './components';
