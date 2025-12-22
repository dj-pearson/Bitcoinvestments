# Fix Login Error: Missing user_sessions Table

## Problem

When you try to log in, the application attempts to log you in but immediately returns to the login page. The console shows these errors:

```
Failed to load resource: the server responded with a status of 404 ()
Error checking sessions: Object
Error creating session: Object
```

**Root Cause**: The `user_sessions` table doesn't exist in your Supabase database, so the session management system can't track your login.

## Solution

### Step 1: Apply the Migration to Create user_sessions Table

1. Open your Supabase project dashboard: https://supabase.com/dashboard
2. Select your **bitcoinvestments** project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy and paste the SQL below:

```sql
-- Create user_sessions table for session management
-- This table tracks active user sessions across devices

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_info TEXT NOT NULL DEFAULT 'Unknown Device',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT valid_session CHECK (expires_at > created_at)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at);

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own sessions"
    ON user_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create their own sessions"
    ON user_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
    ON user_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions"
    ON user_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to cleanup expired sessions periodically
-- This runs whenever a new session is created
CREATE OR REPLACE TRIGGER trigger_cleanup_expired_sessions
    AFTER INSERT ON user_sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_expired_sessions();

-- Add comment for documentation
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions for session management, timeout enforcement, and concurrent session limits';
```

6. Click **"Run"** or press `Ctrl + Enter`
7. You should see "Success. No rows returned"

### Step 2: Verify the Table Was Created

1. In the same SQL Editor, create a new query
2. Run this SQL to verify:

```sql
-- Check if user_sessions table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;
```

3. You should see all the columns listed: `id`, `user_id`, `device_info`, etc.

### Step 3: Test the Login

1. Go to your application: https://bitcoinvestments.net/login
2. Clear your browser cache and cookies (or open an incognito window)
3. Try logging in with your credentials
4. You should now successfully log in and be redirected to the dashboard

## What This Fixes

The `user_sessions` table:
- **Tracks active sessions** across multiple devices
- **Enforces session timeouts** (default: 7 days)
- **Limits concurrent sessions** (max 5 devices per user)
- **Auto-cleans expired sessions** via the trigger

## How the Session System Works

```
User Logs In → Supabase Auth validates credentials
            → Creates session record in user_sessions table ✅
            → Stores session ID in browser localStorage
            → User accesses dashboard successfully ✅
```

### Without the Table (Current Issue)
```
User Logs In → Supabase Auth validates credentials ✅
            → Tries to create session in user_sessions table ❌ 404 Error
            → Login fails, returns to login page ❌
```

## Additional Verification

After applying the migration, you can verify sessions are being created:

```sql
-- View all active sessions for your user
SELECT 
    id,
    device_info,
    created_at,
    last_activity_at,
    expires_at
FROM user_sessions
WHERE user_id = auth.uid()
ORDER BY last_activity_at DESC;
```

## Troubleshooting

### Error: "permission denied for table user_sessions"

**Solution**: Make sure you're running the SQL in the Supabase dashboard SQL Editor (not locally) and that you're logged in as the project owner.

### Error: "policy with name already exists"

**Solution**: The policies might already exist. Run this to drop them first:

```sql
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;
```

Then run the main migration SQL again.

### Still Can't Log In?

1. **Clear all site data**:
   - Open DevTools (F12)
   - Go to Application tab
   - Click "Clear site data"
   - Refresh the page

2. **Check the Console**:
   - Open DevTools (F12)
   - Go to Console tab
   - Try logging in
   - Look for any new errors (the 404 errors should be gone)

3. **Verify your user exists**:
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

## Other Console Errors

You may still see these errors in the console (they're not critical):

- **CSP errors for external APIs**: These are Content Security Policy warnings for external crypto data APIs. They won't affect login.
- **Service Worker errors**: These are related to caching and won't affect login.
- **Bitwarden extension errors**: These are from your password manager extension, not your app.

The only errors that prevented login were the `user_sessions` 404 errors, which this fix resolves.

## Need More Help?

If you're still having issues after applying this fix:
1. Check the Supabase logs in the dashboard
2. Verify the table was created: `SELECT * FROM user_sessions LIMIT 1;`
3. Ensure RLS policies are active: `SELECT * FROM pg_policies WHERE tablename = 'user_sessions';`
4. Try creating a test session manually to ensure permissions work


