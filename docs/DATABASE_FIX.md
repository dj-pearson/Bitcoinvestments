# Database Fix: Missing User Profiles

## Problem

You're seeing these errors:
```
Error fetching user profile: Cannot coerce the result to a single JSON object
Error creating portfolio: Key is not present in table "users"
```

**Root Cause**: When you signed up, Supabase Auth created your account, but a corresponding row wasn't created in the `public.users` table. This is a foreign key constraint issue.

## Solution

### Step 1: Run the Updated Schema

1. Open your Supabase project dashboard: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Click **"New Query"**
4. Copy and paste the **entire contents** of `supabase/schema.sql`
5. Click **"Run"**

This will:
- Add the missing trigger to auto-create user profiles on signup
- Set up all tables correctly

### Step 2: Fix Your Existing Account

1. In the same **SQL Editor**, create a new query
2. Copy and paste this SQL:

```sql
-- Fix Existing Users Migration
-- Creates user profiles for existing Supabase Auth users

INSERT INTO public.users (id, email, referral_code, created_at)
SELECT 
    au.id,
    au.email,
    upper(substr(md5(random()::text), 1, 8)),
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Verify it worked
SELECT 
    u.id,
    u.email,
    u.referral_code,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC;
```

3. Click **"Run"**
4. You should see your user profile in the results

### Step 3: Verify the Fix

1. **Refresh your browser** (hard refresh: `Ctrl + Shift + R`)
2. Go to http://localhost:5173/
3. The errors should be gone!
4. Try creating a portfolio - it should work now

## Prevention

The updated schema includes a trigger (`on_auth_user_created`) that will automatically create a user profile whenever someone signs up. This prevents the issue from happening again.

## What Changed

### Before (Broken)
```
User Signs Up → Supabase Auth creates account
                ❌ No profile in public.users
                ❌ Portfolio creation fails
```

### After (Fixed)
```
User Signs Up → Supabase Auth creates account
              → Trigger fires automatically
              → Creates profile in public.users ✅
              → Portfolio creation works ✅
```

## Troubleshooting

### Error: "relation auth.users does not exist"

**Solution**: You need to run this in the **SQL Editor** in your Supabase dashboard, not locally.

### Error: "permission denied"

**Solution**: Make sure you're logged into the correct Supabase project and have admin access.

### Still seeing errors after running the fix?

1. Clear browser cache and cookies
2. Log out and log back in
3. Check the browser console for any remaining errors
4. Verify your user was created:

```sql
SELECT * FROM public.users WHERE email = 'your-email@example.com';
```

## Technical Details

### The Trigger Function

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, referral_code)
    VALUES (
        new.id,
        new.email,
        public.generate_referral_code()
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### The Trigger

```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

This trigger runs automatically whenever a new user is inserted into `auth.users` (during signup).

## Need Help?

If you're still having issues:
1. Check the Supabase logs in the dashboard
2. Verify all tables were created correctly
3. Check that Row Level Security (RLS) policies are set up
4. Ensure your user ID matches between `auth.users` and `public.users`

