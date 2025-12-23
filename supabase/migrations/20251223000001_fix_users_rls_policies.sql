-- Fix Users Table RLS Policies
-- This migration adds proper RLS policies for the users table
-- including admin access and proper user self-access

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create comprehensive policies for users table

-- 1. Users can view their own profile
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Admins can view all users
CREATE POLICY "admins_select_all_users"
  ON public.users
  FOR SELECT
  USING (
    role IN ('admin', 'super_admin')
  );

-- 3. Users can update their own profile (except role and admin fields)
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent users from elevating their own role or modifying admin fields
    AND (
      role = (SELECT role FROM public.users WHERE id = auth.uid())
      OR role IS NULL
    )
  );

-- 4. Admins can update any user
CREATE POLICY "admins_update_all_users"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- 5. Admins can insert users (for manual user creation)
CREATE POLICY "admins_insert_users"
  ON public.users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;

-- Add comment
COMMENT ON TABLE public.users IS 'Users table with RLS policies for self-access and admin access';

