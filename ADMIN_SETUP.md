# Admin Infrastructure & Scam Database Setup Guide

This guide covers the setup and usage of the new admin infrastructure and crypto scam database features.

## 🎯 Features Implemented

### 1. Full Admin Dashboard (P0-Critical)
**Description:** Comprehensive admin panel for managing all site aspects

**Features:**
- Real-time statistics dashboard
- User management overview
- Scam database statistics
- System health monitoring
- Quick action links

**Access:** `/admin`

### 2. User Management System (P0-Critical)
**Description:** Admin interface to view, edit, suspend, and manage user accounts

**Features:**
- View all users with pagination
- Search users by email
- Filter by role (user/admin/super_admin)
- Filter by status (active/suspended)
- Update user roles
- Suspend/activate user accounts
- View user subscription status
- Track last login times

**Access:** `/admin/users`

### 3. Crypto Scam Database (P2-Medium)
**Description:** Searchable database of known scams and red flags

**Features:**
- Full-text search across scam reports
- Search by wallet address, contract address, or website URL
- Category-based browsing
- Verified scam reports
- Detailed scam information with red flags
- Public reporting functionality
- Admin verification workflow

**Public Access:** `/scam-database`
**Admin Access:** `/admin/scam-database`

## 📦 Database Schema

### New Tables Created

#### 1. Admin Infrastructure Tables

**`users` table (extended):**
```sql
ALTER TABLE users ADD COLUMN:
- role TEXT DEFAULT 'user'  -- 'user' | 'admin' | 'super_admin'
- is_suspended BOOLEAN DEFAULT FALSE
- suspended_at TIMESTAMP
- suspended_reason TEXT
- last_login_at TIMESTAMP
```

**`admin_audit_logs`:**
```sql
- id UUID PRIMARY KEY
- admin_id UUID REFERENCES users(id)
- action TEXT  -- 'user.suspend', 'user.role_update', etc.
- target_type TEXT  -- 'user', 'scam', etc.
- target_id TEXT
- details JSONB
- ip_address TEXT
- user_agent TEXT
- created_at TIMESTAMP
```

**`admin_settings`:**
```sql
- id UUID PRIMARY KEY
- key TEXT UNIQUE
- value JSONB
- category TEXT
- description TEXT
- updated_by UUID REFERENCES users(id)
- updated_at TIMESTAMP
```

#### 2. Scam Database Tables

**`scam_reports`:**
```sql
- id UUID PRIMARY KEY
- title TEXT
- description TEXT
- scam_type TEXT  -- 'phishing', 'ponzi', 'rug_pull', etc.
- severity TEXT  -- 'low', 'medium', 'high', 'critical'
- status TEXT  -- 'pending', 'verified', 'rejected'
- website_url TEXT
- social_media_links JSONB
- wallet_addresses TEXT[]
- email_addresses TEXT[]
- token_name, token_symbol TEXT
- blockchain TEXT
- contract_address TEXT
- red_flags TEXT[]
- victims_count INTEGER
- estimated_loss_usd DECIMAL
- reported_by, verified_by UUID
- evidence_links TEXT[]
- search_vector TSVECTOR  -- Full-text search
- created_at, updated_at TIMESTAMP
```

**`scam_report_comments`:**
```sql
- id UUID PRIMARY KEY
- scam_report_id UUID REFERENCES scam_reports(id)
- user_id UUID REFERENCES users(id)
- comment TEXT
- is_admin BOOLEAN
- created_at, updated_at TIMESTAMP
```

**`scam_categories`:**
```sql
- id UUID PRIMARY KEY
- name TEXT
- slug TEXT UNIQUE
- description TEXT
- icon TEXT
- color TEXT
- reports_count INTEGER
```

### Database Functions

**`is_admin(user_id UUID)`:**
Returns boolean indicating if user is admin or super_admin

**`log_admin_action(...)`:**
Logs admin actions to audit trail

**`get_user_stats()`:**
Returns comprehensive user statistics for dashboard

**`get_scam_stats()`:**
Returns scam database statistics

## 🔐 Security Features

### Role-Based Access Control (RBAC)

**Role Hierarchy:**
```
user < admin < super_admin
```

**Permissions:**
- **user**: Standard user access
- **admin**: Access to admin dashboard, user management, scam database moderation
- **super_admin**: Full access including system settings (future)

**Implementation:**
- `AdminRoute` component for protecting admin pages
- `useIsAdmin()` hook for checking admin status
- `useUserRole()` hook for getting current user role

### Row Level Security (RLS)

All tables have RLS policies:
- Users can only view/edit their own data
- Admins can view/edit all data
- Audit logs are admin-only
- Scam reports: public read (verified only), authenticated write, admin moderate

### Audit Logging

All admin actions are logged:
- User suspensions/activations
- Role changes
- Scam report verification/rejection
- Includes timestamp, IP address, and details

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
# Open Supabase SQL Editor
# Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

# Run the migration file:
supabase/migrations/20251204_add_admin_and_scam_database.sql
```

This will create:
- ✅ All new tables
- ✅ RLS policies
- ✅ Database functions
- ✅ Indexes for performance
- ✅ Full-text search configuration

### 2. Create Your First Admin User

After migration, manually promote your user to admin:

```sql
-- In Supabase SQL Editor
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Or promote to super admin:
```sql
UPDATE users
SET role = 'super_admin'
WHERE email = 'your-email@example.com';
```

### 3. Test Admin Access

1. Log in with your promoted account
2. Navigate to `/admin`
3. You should see the Admin Dashboard

### 4. Seed Scam Categories (Optional)

The migration automatically creates 8 default scam categories:
- Phishing
- Ponzi Scheme
- Rug Pull
- Fake ICO/IDO
- Impersonation
- Fake Exchange
- Pump and Dump
- Other

## 📖 Usage Guide

### Admin Dashboard

**URL:** `/admin`

**Features:**
- Overview cards showing:
  - Total users, active users, premium users
  - Scam reports statistics
  - Total estimated losses
- Quick action links
- System health indicators

### User Management

**URL:** `/admin/users`

**Operations:**

1. **Search Users:**
   - Enter email in search box
   - Results update automatically

2. **Filter Users:**
   - By role: user/admin/super_admin
   - By status: all/active/suspended

3. **Update User Role:**
   - Click role dropdown in table
   - Select new role
   - Changes apply immediately

4. **Suspend User:**
   - Click Ban icon (🚫) next to user
   - Enter suspension reason
   - Confirm suspension
   - User will be logged out and cannot log back in

5. **Activate User:**
   - Click Activate icon (✓) next to suspended user
   - User can log in again

### Scam Database (Public)

**URL:** `/scam-database`

**Features:**

1. **Search Types:**
   - General: Full-text search across all fields
   - Wallet Address: Check if address is in scam reports
   - Contract Address: Check if contract is reported
   - Website URL: Check if website is known scam

2. **Browse by Category:**
   - Click category card to filter
   - View statistics per category

3. **View Details:**
   - Click on any scam report
   - See full details, red flags, wallet addresses

4. **Report a Scam:**
   - Click "Report a Scam" button
   - Fill in scam details
   - Submit for admin review

### Scam Database (Admin)

**URL:** `/admin/scam-database`

**Admin Features:**
- View pending reports
- Verify or reject reports
- Edit report details
- Delete spam reports
- View all reports regardless of status

## 🎨 UI Components

### Created Components

**`src/components/AdminRoute.tsx`:**
- Protected route for admin pages
- Checks user role
- Redirects unauthorized users

**Hooks:**
- `useIsAdmin()` - Check if user is admin
- `useIsSuperAdmin()` - Check if user is super admin
- `useUserRole()` - Get current user's role

### Created Pages

1. **`src/pages/AdminDashboard.tsx`**
   - Main admin overview
   - Statistics and quick actions

2. **`src/pages/UserManagement.tsx`**
   - Comprehensive user management
   - Search, filter, CRUD operations

3. **`src/pages/ScamDatabase.tsx`**
   - Public scam search interface
   - Category browsing
   - Detailed scam reports

### Created Services

1. **`src/services/admin.ts`**
   - User management functions
   - Audit logging
   - Statistics fetching

2. **`src/services/scamDatabase.ts`**
   - Scam report CRUD
   - Search and filter
   - Verification workflow

## 🔍 API Reference

### Admin Service

```typescript
// User Management
getAllUsers(params?: { page, limit, search, role, suspended })
getUserById(userId: string)
updateUserRole(userId: string, role: UserRole, adminId: string)
suspendUser(userId: string, reason: string, adminId: string)
activateUser(userId: string, adminId: string)

// Audit Logging
logAdminAction(log: InsertAdminAuditLog)
getAuditLogs(params?: { page, limit, action, adminId })

// Statistics
getUserStats(): Promise<UserStats>
getScamDatabaseStats(): Promise<ScamStats>
```

### Scam Database Service

```typescript
// Search & Filter
searchScamReports(filters: ScamSearchFilters, params?: { page, limit })
checkWalletAddress(address: string)
checkContractAddress(address: string)
checkWebsiteUrl(url: string)

// CRUD Operations
getScamReport(id: string)
createScamReport(report: InsertScamReport, userId: string)
updateScamReport(id: string, updates: UpdateScamReport)
verifyScamReport(id: string, adminId: string, status: 'verified' | 'rejected')
deleteScamReport(id: string)

// Comments
getScamReportComments(scamReportId: string)
addScamReportComment(comment: InsertScamReportComment)

// Utilities
getScamCategories()
getTrendingScams(limit?: number)
getRecentScams(limit?: number)
```

## 📊 Database Performance

### Indexes Created

- `idx_users_role` - Fast role lookups
- `idx_users_suspended` - Filter suspended users
- `idx_scam_reports_search` - Full-text search (GIN index)
- `idx_scam_reports_wallet_addresses` - Array search (GIN index)
- `idx_audit_logs_created` - Chronological audit log queries

### Full-Text Search

The `scam_reports` table uses PostgreSQL's full-text search:
- Automatically updated via trigger
- Weighted fields: title (A), description (B), URL (C)
- Supports advanced queries

## 🛡️ Security Best Practices

1. **Always use RLS policies** - Never bypass Row Level Security
2. **Log all admin actions** - Use `logAdminAction()` for audit trail
3. **Validate user roles server-side** - Don't trust client-side checks
4. **Sanitize user input** - Especially in scam reports
5. **Rate limit searches** - Prevent abuse of search functionality
6. **Regular audits** - Review admin audit logs periodically

## 🐛 Troubleshooting

### Cannot Access Admin Pages

**Problem:** Getting redirected when accessing `/admin`

**Solutions:**
1. Check your user role:
   ```sql
   SELECT id, email, role FROM users WHERE email = 'your@email.com';
   ```
2. Ensure role is 'admin' or 'super_admin'
3. Clear browser cache and re-login
4. Check browser console for errors

### Scam Search Not Working

**Problem:** Full-text search returns no results

**Solutions:**
1. Check `search_vector` is populated:
   ```sql
   SELECT title, search_vector FROM scam_reports LIMIT 5;
   ```
2. Manually trigger update:
   ```sql
   UPDATE scam_reports SET updated_at = NOW();
   ```
3. Rebuild search index if needed

### Audit Logs Not Appearing

**Problem:** Admin actions not being logged

**Solutions:**
1. Check RLS policies are enabled
2. Verify `logAdminAction()` is being called
3. Check for errors in browser console
4. Verify admin_id is correct

## 📈 Future Enhancements

### Planned Features

1. **Admin Settings Page**
   - Configure site-wide settings
   - Feature flags
   - Email templates

2. **Enhanced Analytics**
   - User growth charts
   - Scam trends over time
   - Geographic distribution

3. **Bulk Operations**
   - Bulk user imports
   - Mass suspensions
   - Batch scam verifications

4. **Email Notifications**
   - Notify users of suspension
   - Alert admins of new scam reports
   - Weekly admin digest

5. **Advanced Scam Detection**
   - API integration with scam databases
   - Machine learning for red flag detection
   - Automatic wallet blacklisting

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review audit logs for errors
3. Check Supabase logs
4. Contact development team

## 🎉 Summary

You now have:
- ✅ Full admin dashboard
- ✅ Comprehensive user management
- ✅ Crypto scam database with search
- ✅ Role-based access control
- ✅ Audit logging
- ✅ Security policies

All features are production-ready and fully integrated!
