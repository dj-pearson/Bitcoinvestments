/**
 * Permissions System - Layer 2 Authorization
 *
 * Defines fine-grained permissions for all protected resources.
 * Follows the pattern: resource.action or resource.action_scope
 *
 * Scopes:
 * - _own: Can only access resources they own
 * - _all: Can access any resource (admin privilege)
 * - (no suffix): Standard access with ownership implied
 */

import type { UserRole } from '../types/admin-database';

// ============================================
// PERMISSION DEFINITIONS
// ============================================

/**
 * All available permissions in the system.
 * Format: 'resource.action' or 'resource.action_scope'
 */
export const PERMISSIONS = {
  // Portfolio permissions
  'portfolio.view_own': 'portfolio.view_own',
  'portfolio.view_all': 'portfolio.view_all',
  'portfolio.create': 'portfolio.create',
  'portfolio.edit_own': 'portfolio.edit_own',
  'portfolio.edit_all': 'portfolio.edit_all',
  'portfolio.delete_own': 'portfolio.delete_own',
  'portfolio.delete_all': 'portfolio.delete_all',

  // Holdings permissions
  'holdings.view_own': 'holdings.view_own',
  'holdings.view_all': 'holdings.view_all',
  'holdings.create': 'holdings.create',
  'holdings.edit_own': 'holdings.edit_own',
  'holdings.edit_all': 'holdings.edit_all',
  'holdings.delete_own': 'holdings.delete_own',
  'holdings.delete_all': 'holdings.delete_all',

  // Transaction permissions
  'transaction.view_own': 'transaction.view_own',
  'transaction.view_all': 'transaction.view_all',
  'transaction.create': 'transaction.create',
  'transaction.edit_own': 'transaction.edit_own',
  'transaction.edit_all': 'transaction.edit_all',
  'transaction.delete_own': 'transaction.delete_own',
  'transaction.delete_all': 'transaction.delete_all',

  // Price alerts permissions
  'alert.view_own': 'alert.view_own',
  'alert.view_all': 'alert.view_all',
  'alert.create': 'alert.create',
  'alert.edit_own': 'alert.edit_own',
  'alert.edit_all': 'alert.edit_all',
  'alert.delete_own': 'alert.delete_own',
  'alert.delete_all': 'alert.delete_all',

  // User profile permissions
  'profile.view_own': 'profile.view_own',
  'profile.view_all': 'profile.view_all',
  'profile.edit_own': 'profile.edit_own',
  'profile.edit_all': 'profile.edit_all',

  // Wallet permissions
  'wallet.view_own': 'wallet.view_own',
  'wallet.view_all': 'wallet.view_all',
  'wallet.create': 'wallet.create',
  'wallet.edit_own': 'wallet.edit_own',
  'wallet.delete_own': 'wallet.delete_own',

  // Tax report permissions
  'tax_report.view_own': 'tax_report.view_own',
  'tax_report.view_all': 'tax_report.view_all',
  'tax_report.purchase': 'tax_report.purchase',
  'tax_report.download_own': 'tax_report.download_own',

  // Scam report permissions
  'scam_report.view': 'scam_report.view',
  'scam_report.create': 'scam_report.create',
  'scam_report.edit_own': 'scam_report.edit_own',
  'scam_report.edit_all': 'scam_report.edit_all',
  'scam_report.verify': 'scam_report.verify',
  'scam_report.delete': 'scam_report.delete',

  // Article/content permissions
  'article.view_published': 'article.view_published',
  'article.view_all': 'article.view_all',
  'article.create': 'article.create',
  'article.edit_own': 'article.edit_own',
  'article.edit_all': 'article.edit_all',
  'article.publish': 'article.publish',
  'article.delete': 'article.delete',

  // Review permissions
  'review.view': 'review.view',
  'review.create': 'review.create',
  'review.edit_own': 'review.edit_own',
  'review.moderate': 'review.moderate',

  // Admin permissions
  'admin.access': 'admin.access',
  'admin.users.view': 'admin.users.view',
  'admin.users.edit': 'admin.users.edit',
  'admin.users.suspend': 'admin.users.suspend',
  'admin.users.role_change': 'admin.users.role_change',
  'admin.settings.view': 'admin.settings.view',
  'admin.settings.edit': 'admin.settings.edit',
  'admin.audit_logs.view': 'admin.audit_logs.view',
  'admin.analytics.view': 'admin.analytics.view',
  'admin.content.moderate': 'admin.content.moderate',
  'admin.subscriptions.view': 'admin.subscriptions.view',
  'admin.subscriptions.edit': 'admin.subscriptions.edit',

  // Super admin permissions
  'super_admin.access': 'super_admin.access',
  'super_admin.system.configure': 'super_admin.system.configure',
  'super_admin.database.access': 'super_admin.database.access',
  'super_admin.users.delete': 'super_admin.users.delete',

  // API permissions (for external API access)
  'api.portfolio.read': 'api.portfolio.read',
  'api.portfolio.write': 'api.portfolio.write',
  'api.market.read': 'api.market.read',
  'api.market.write': 'api.market.write',
  'api.analytics.read': 'api.analytics.read',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ============================================
// ROLE-PERMISSION MAPPINGS
// ============================================

/**
 * Role hierarchy levels for quick comparison
 */
export const ROLE_LEVELS: Record<UserRole, number> = {
  'user': 0,
  'admin': 1,
  'super_admin': 2,
};

/**
 * Permissions granted to each role.
 * Higher roles inherit all permissions from lower roles.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    // Portfolio - own only
    'portfolio.view_own',
    'portfolio.create',
    'portfolio.edit_own',
    'portfolio.delete_own',

    // Holdings - own only
    'holdings.view_own',
    'holdings.create',
    'holdings.edit_own',
    'holdings.delete_own',

    // Transactions - own only
    'transaction.view_own',
    'transaction.create',
    'transaction.edit_own',
    'transaction.delete_own',

    // Alerts - own only
    'alert.view_own',
    'alert.create',
    'alert.edit_own',
    'alert.delete_own',

    // Profile - own only
    'profile.view_own',
    'profile.edit_own',

    // Wallets - own only
    'wallet.view_own',
    'wallet.create',
    'wallet.edit_own',
    'wallet.delete_own',

    // Tax reports - own only
    'tax_report.view_own',
    'tax_report.purchase',
    'tax_report.download_own',

    // Scam reports - view and create
    'scam_report.view',
    'scam_report.create',
    'scam_report.edit_own',

    // Articles - view published
    'article.view_published',

    // Reviews
    'review.view',
    'review.create',
    'review.edit_own',
  ],

  admin: [
    // Inherits all user permissions (handled in hasPermission)

    // Admin access
    'admin.access',
    'admin.users.view',
    'admin.users.edit',
    'admin.users.suspend',
    'admin.settings.view',
    'admin.audit_logs.view',
    'admin.analytics.view',
    'admin.content.moderate',
    'admin.subscriptions.view',

    // View all resources
    'portfolio.view_all',
    'holdings.view_all',
    'transaction.view_all',
    'alert.view_all',
    'profile.view_all',
    'wallet.view_all',
    'tax_report.view_all',
    'article.view_all',

    // Content management
    'article.create',
    'article.edit_own',
    'article.publish',

    // Scam reports
    'scam_report.edit_all',
    'scam_report.verify',

    // Reviews
    'review.moderate',

    // API permissions
    'api.portfolio.read',
    'api.market.read',
    'api.analytics.read',
  ],

  super_admin: [
    // Inherits all admin permissions (handled in hasPermission)

    // Super admin access
    'super_admin.access',
    'super_admin.system.configure',
    'super_admin.database.access',
    'super_admin.users.delete',

    // User management
    'admin.users.role_change',
    'admin.settings.edit',
    'admin.subscriptions.edit',

    // Edit all resources
    'portfolio.edit_all',
    'portfolio.delete_all',
    'holdings.edit_all',
    'holdings.delete_all',
    'transaction.edit_all',
    'transaction.delete_all',
    'alert.edit_all',
    'alert.delete_all',
    'profile.edit_all',

    // Content management
    'article.edit_all',
    'article.delete',
    'scam_report.delete',

    // API permissions
    'api.portfolio.write',
    'api.market.write',
  ],
};

// ============================================
// PERMISSION CHECK UTILITIES
// ============================================

/**
 * Get all permissions for a role, including inherited permissions
 */
export function getRolePermissions(role: UserRole): Set<Permission> {
  const permissions = new Set<Permission>();

  // Get role level
  const roleLevel = ROLE_LEVELS[role];

  // Add permissions from current role and all lower roles
  for (const [r, perms] of Object.entries(ROLE_PERMISSIONS)) {
    if (ROLE_LEVELS[r as UserRole] <= roleLevel) {
      for (const perm of perms) {
        permissions.add(perm);
      }
    }
  }

  return permissions;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.has(permission);
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const rolePermissions = getRolePermissions(role);
  return permissions.every(p => rolePermissions.has(p));
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const rolePermissions = getRolePermissions(role);
  return permissions.some(p => rolePermissions.has(p));
}

/**
 * Check if user has access to a resource based on ownership
 * Returns true if:
 * - User has '_all' permission for the action
 * - User has '_own' permission AND owns the resource
 */
export function hasResourceAccess(
  role: UserRole,
  resource: string,
  action: string,
  isOwner: boolean
): boolean {
  const allPermission = `${resource}.${action}_all` as Permission;
  const ownPermission = `${resource}.${action}_own` as Permission;

  const rolePermissions = getRolePermissions(role);

  // Check if has 'all' permission
  if (rolePermissions.has(allPermission)) {
    return true;
  }

  // Check if has 'own' permission and is owner
  if (rolePermissions.has(ownPermission) && isOwner) {
    return true;
  }

  return false;
}

/**
 * Compare role levels
 */
export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

// ============================================
// PERMISSION GROUPS (for UI display)
// ============================================

export const PERMISSION_GROUPS = {
  portfolio: {
    label: 'Portfolio Management',
    permissions: [
      'portfolio.view_own',
      'portfolio.view_all',
      'portfolio.create',
      'portfolio.edit_own',
      'portfolio.edit_all',
      'portfolio.delete_own',
      'portfolio.delete_all',
    ] as Permission[],
  },
  holdings: {
    label: 'Holdings Management',
    permissions: [
      'holdings.view_own',
      'holdings.view_all',
      'holdings.create',
      'holdings.edit_own',
      'holdings.edit_all',
      'holdings.delete_own',
      'holdings.delete_all',
    ] as Permission[],
  },
  transactions: {
    label: 'Transaction Management',
    permissions: [
      'transaction.view_own',
      'transaction.view_all',
      'transaction.create',
      'transaction.edit_own',
      'transaction.edit_all',
      'transaction.delete_own',
      'transaction.delete_all',
    ] as Permission[],
  },
  admin: {
    label: 'Admin Access',
    permissions: [
      'admin.access',
      'admin.users.view',
      'admin.users.edit',
      'admin.users.suspend',
      'admin.users.role_change',
      'admin.settings.view',
      'admin.settings.edit',
      'admin.audit_logs.view',
      'admin.analytics.view',
      'admin.content.moderate',
      'admin.subscriptions.view',
      'admin.subscriptions.edit',
    ] as Permission[],
  },
  super_admin: {
    label: 'Super Admin',
    permissions: [
      'super_admin.access',
      'super_admin.system.configure',
      'super_admin.database.access',
      'super_admin.users.delete',
    ] as Permission[],
  },
} as const;

// ============================================
// PERMISSION DESCRIPTIONS (for tooltips)
// ============================================

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'portfolio.view_own': 'View your own portfolios',
  'portfolio.view_all': 'View all user portfolios',
  'portfolio.create': 'Create new portfolios',
  'portfolio.edit_own': 'Edit your own portfolios',
  'portfolio.edit_all': 'Edit any portfolio',
  'portfolio.delete_own': 'Delete your own portfolios',
  'portfolio.delete_all': 'Delete any portfolio',

  'holdings.view_own': 'View your own holdings',
  'holdings.view_all': 'View all user holdings',
  'holdings.create': 'Add new holdings',
  'holdings.edit_own': 'Edit your own holdings',
  'holdings.edit_all': 'Edit any holding',
  'holdings.delete_own': 'Delete your own holdings',
  'holdings.delete_all': 'Delete any holding',

  'transaction.view_own': 'View your own transactions',
  'transaction.view_all': 'View all transactions',
  'transaction.create': 'Record new transactions',
  'transaction.edit_own': 'Edit your own transactions',
  'transaction.edit_all': 'Edit any transaction',
  'transaction.delete_own': 'Delete your own transactions',
  'transaction.delete_all': 'Delete any transaction',

  'alert.view_own': 'View your price alerts',
  'alert.view_all': 'View all price alerts',
  'alert.create': 'Create price alerts',
  'alert.edit_own': 'Edit your alerts',
  'alert.edit_all': 'Edit any alert',
  'alert.delete_own': 'Delete your alerts',
  'alert.delete_all': 'Delete any alert',

  'profile.view_own': 'View your profile',
  'profile.view_all': 'View all user profiles',
  'profile.edit_own': 'Edit your profile',
  'profile.edit_all': 'Edit any user profile',

  'wallet.view_own': 'View your wallets',
  'wallet.view_all': 'View all wallets',
  'wallet.create': 'Add wallets',
  'wallet.edit_own': 'Edit your wallets',
  'wallet.delete_own': 'Remove your wallets',

  'tax_report.view_own': 'View your tax reports',
  'tax_report.view_all': 'View all tax reports',
  'tax_report.purchase': 'Purchase tax reports',
  'tax_report.download_own': 'Download your tax reports',

  'scam_report.view': 'View scam reports',
  'scam_report.create': 'Submit scam reports',
  'scam_report.edit_own': 'Edit your scam reports',
  'scam_report.edit_all': 'Edit any scam report',
  'scam_report.verify': 'Verify scam reports',
  'scam_report.delete': 'Delete scam reports',

  'article.view_published': 'View published articles',
  'article.view_all': 'View all articles including drafts',
  'article.create': 'Create articles',
  'article.edit_own': 'Edit your articles',
  'article.edit_all': 'Edit any article',
  'article.publish': 'Publish articles',
  'article.delete': 'Delete articles',

  'review.view': 'View platform reviews',
  'review.create': 'Write reviews',
  'review.edit_own': 'Edit your reviews',
  'review.moderate': 'Moderate reviews',

  'admin.access': 'Access admin panel',
  'admin.users.view': 'View user list',
  'admin.users.edit': 'Edit user details',
  'admin.users.suspend': 'Suspend users',
  'admin.users.role_change': 'Change user roles',
  'admin.settings.view': 'View system settings',
  'admin.settings.edit': 'Edit system settings',
  'admin.audit_logs.view': 'View audit logs',
  'admin.analytics.view': 'View analytics',
  'admin.content.moderate': 'Moderate content',
  'admin.subscriptions.view': 'View subscriptions',
  'admin.subscriptions.edit': 'Edit subscriptions',

  'super_admin.access': 'Full super admin access',
  'super_admin.system.configure': 'Configure system',
  'super_admin.database.access': 'Direct database access',
  'super_admin.users.delete': 'Delete users permanently',

  'api.portfolio.read': 'API read portfolio data',
  'api.portfolio.write': 'API write portfolio data',
  'api.market.read': 'API read market data',
  'api.market.write': 'API write market data',
  'api.analytics.read': 'API read analytics',
};
