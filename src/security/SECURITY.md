# Security Architecture - Defense in Depth

This document describes the 4-layer security architecture implemented in Bitcoinvestments.

## Security Layer Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Authentication (WHO are you?)                     │
│  - requireAuth, isAuthenticated, getSecurityContext         │
│  - Validates JWT/session is valid                           │
│  - Ensures user exists and is not suspended                 │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Authorization (WHAT can you do?)                  │
│  - requirePermission('portfolio.view_own')                  │
│  - requireRole('admin')                                     │
│  - Role-based permission inheritance                        │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Resource Ownership (IS this yours?)               │
│  - requireOwnership, requireResourceAccess                  │
│  - Verifies user owns the specific resource                 │
│  - Admin override for '_all' permissions                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Database RLS (FINAL enforcement)                  │
│  - Row-level security policies in PostgreSQL                │
│  - Even if code has bugs, DB rejects unauthorized           │
│  - See: supabase/migrations/20260128000000_*.sql            │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Backend Usage (Services/API)

```typescript
import {
  secureWithPermission,
  secureResourceAccess,
  requireAuth,
  createSecurityError,
} from '@/security';

// Example 1: Simple permission check
async function getAdminDashboard() {
  const result = await secureWithPermission('admin.access');

  if ('error' in result) {
    throw new Error(result.error);
  }

  const { context } = result;
  // context.userId, context.role available
  return fetchDashboardData(context.userId);
}

// Example 2: Resource-based access (ownership check)
async function updatePortfolio(portfolioId: string, data: any) {
  const result = await secureResourceAccess('portfolio', 'edit', {
    table: 'portfolios',
    resourceId: portfolioId,
  });

  if ('error' in result) {
    return {
      success: false,
      ...createSecurityError(result.errorCode, result.error)
    };
  }

  // User is authorized - proceed with update
  return await supabase
    .from('portfolios')
    .update(data)
    .eq('id', portfolioId);
}

// Example 3: Manual layer checks
async function deleteHolding(holdingId: string) {
  // Layer 1: Authentication
  const auth = await requireAuth();
  if (!auth.success) {
    return { error: auth.error };
  }

  // Layer 2: Check permission
  const permCheck = requirePermission(auth.context!, 'holdings.delete_own');
  if (!permCheck.allowed) {
    return { error: permCheck.reason };
  }

  // Layer 3: Verify ownership
  const ownerCheck = await requireHoldingOwnership(auth.context!, holdingId);
  if (!ownerCheck.allowed) {
    return { error: ownerCheck.reason };
  }

  // All checks passed - proceed with delete
  // Layer 4 (RLS) will also enforce this at DB level
  return await supabase
    .from('holdings')
    .delete()
    .eq('id', holdingId);
}
```

### Frontend Usage (React Components)

```tsx
import {
  // Route protection
  RequireAuth,
  RequirePermission,
  RequireRole,
  RequireOwnership,

  // Conditional rendering
  ShowIfPermission,
  ShowIfRole,
  ShowIfOwner,
  ShowIfOwnerOrPermission,

  // Hooks
  usePermission,
  useSecurity,
  useIsOwner,
} from '@/security';

// Example 1: Protect a route
function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      } />

      <Route path="/admin" element={
        <RequirePermission permission="admin.access">
          <AdminPanel />
        </RequirePermission>
      } />

      <Route path="/portfolio/:id" element={
        <RequireOwnership
          ownerId={portfolio?.user_id}
          overridePermission="portfolio.view_all"
        >
          <PortfolioDetails />
        </RequireOwnership>
      } />
    </Routes>
  );
}

// Example 2: Conditional UI elements
function PortfolioActions({ portfolio }) {
  return (
    <div>
      {/* Only show if user owns the portfolio */}
      <ShowIfOwner ownerId={portfolio.user_id}>
        <EditButton />
        <DeleteButton />
      </ShowIfOwner>

      {/* Show for owner OR admin */}
      <ShowIfOwnerOrPermission
        ownerId={portfolio.user_id}
        permission="portfolio.edit_all"
      >
        <SettingsButton />
      </ShowIfOwnerOrPermission>

      {/* Admin-only actions */}
      <ShowIfPermission permission="admin.users.suspend">
        <SuspendUserButton />
      </ShowIfPermission>
    </div>
  );
}

// Example 3: Using hooks for logic
function UserProfile({ userId }) {
  const security = useSecurity();
  const isOwner = useIsOwner(userId);
  const canEdit = usePermission('profile.edit_all');

  const handleEdit = async () => {
    if (!isOwner && !canEdit) {
      alert('You cannot edit this profile');
      return;
    }

    // Proceed with edit
  };

  return (
    <div>
      <h1>Profile</h1>
      {(isOwner || canEdit) && (
        <button onClick={handleEdit}>Edit</button>
      )}
    </div>
  );
}
```

## Permission System

### Permission Naming Convention

Permissions follow the pattern: `resource.action` or `resource.action_scope`

- `_own` suffix: Can only access resources they own
- `_all` suffix: Can access any resource (admin privilege)
- No suffix: Standard access (context determines scope)

### Available Permissions

```typescript
// Portfolio Management
'portfolio.view_own'      // View own portfolios
'portfolio.view_all'      // View all portfolios (admin)
'portfolio.create'        // Create new portfolios
'portfolio.edit_own'      // Edit own portfolios
'portfolio.edit_all'      // Edit any portfolio (admin)
'portfolio.delete_own'    // Delete own portfolios
'portfolio.delete_all'    // Delete any portfolio (super_admin)

// Holdings Management
'holdings.view_own'
'holdings.view_all'
'holdings.create'
'holdings.edit_own'
'holdings.edit_all'
'holdings.delete_own'
'holdings.delete_all'

// Admin Access
'admin.access'            // Access admin panel
'admin.users.view'        // View user list
'admin.users.edit'        // Edit user details
'admin.users.suspend'     // Suspend users
'admin.users.role_change' // Change user roles
'admin.settings.view'     // View settings
'admin.settings.edit'     // Edit settings

// Super Admin
'super_admin.access'
'super_admin.system.configure'
'super_admin.database.access'
'super_admin.users.delete'
```

### Role Hierarchy

```
user (level 0)
  └── admin (level 1)
        └── super_admin (level 2)
```

Higher roles inherit all permissions from lower roles.

## Database RLS Policies

Every table has Row Level Security policies that enforce access at the database level:

```sql
-- Example: Portfolios table
-- Users can only select their own portfolios
CREATE POLICY "portfolios_select_own"
  ON public.portfolios FOR SELECT
  USING (user_id = auth.uid());

-- Admins can select all portfolios
CREATE POLICY "portfolios_select_admin"
  ON public.portfolios FOR SELECT
  USING (public.is_admin());
```

## Security Best Practices

1. **Always validate on backend** - Client-side checks are for UX, not security
2. **Use combined checks** - `secureResourceAccess()` handles all layers
3. **Never trust client data** - Always verify ownership server-side
4. **Log security events** - Use audit logs for sensitive operations
5. **Fail closed** - If a check fails, deny access by default

## Error Handling

```typescript
import { createSecurityError, type SecurityErrorCode } from '@/security';

// Error codes and their HTTP status
const errors: Record<SecurityErrorCode, number> = {
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

// Create standardized error response
const error = createSecurityError('PERMISSION_DENIED', 'Custom message');
// { error: 'Custom message', errorCode: 'PERMISSION_DENIED', status: 403 }
```

## Files Reference

```
src/security/
├── index.ts          # Main exports
├── permissions.ts    # Permission definitions & utilities
├── layers.ts         # Security layer implementations
├── hooks.ts          # React hooks
├── components.tsx    # React components
└── SECURITY.md       # This documentation

supabase/migrations/
└── 20260128000000_comprehensive_rls_security.sql  # RLS policies
```
