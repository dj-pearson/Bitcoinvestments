-- Fix: every admin row in public.users was readable by any signed-in user
--
-- 20251223000001_fix_users_rls_policies.sql defined the admin read policy as:
--
--   CREATE POLICY "admins_select_all_users" ON public.users
--     FOR SELECT USING (role IN ('admin', 'super_admin'));
--
-- A RLS USING clause is evaluated against each candidate row, so an unqualified
-- `role` refers to the row being scanned, not to the caller. The policy therefore
-- reads "any row whose own role is admin is visible", and because policies are
-- OR'd together it granted every holder of the `authenticated` GRANT - that is,
-- anyone who signs up - SELECT on every administrator's row.
--
-- public.users carries two_factor_secret and two_factor_recovery_codes, so the
-- exposed columns included the TOTP shared secret and the recovery codes for
-- every admin and super_admin account. Any registered user could mint valid 2FA
-- codes for an administrator, which is precisely the attack the second factor
-- exists to stop.
--
-- The remaining policies from that migration guard themselves with a subquery
-- against public.users itself. A policy on a table that reads that same table
-- re-enters RLS and raises "infinite recursion detected in policy for relation
-- users", which is the likely reason the admin read policy was flattened into
-- the broken form in the first place. The fix for both is the SECURITY DEFINER
-- helper, which runs outside the caller's RLS and so does not recurse.

-- ============================================
-- Helpers
-- ============================================

-- Recreated here so this migration is self-contained and does not depend on the
-- ordering of the file that first introduced is_admin(). SET search_path is
-- added: a SECURITY DEFINER function without a pinned search_path can be
-- redirected to an attacker-controlled schema by the caller.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
    AND is_suspended = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'super_admin'
    AND is_suspended = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- The caller's own stored role, read outside RLS so it can be referenced from a
-- policy on public.users without recursing.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- ============================================
-- public.users policies, rebuilt
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Names used by any of the earlier migrations, dropped so the final state does
-- not depend on which of them a given database has applied.
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "admins_select_all_users" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "admins_update_all_users" ON public.users;
DROP POLICY IF EXISTS "admins_insert_users" ON public.users;

-- 1. A user reads their own row.
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 2. An admin reads every row. The check is on the CALLER, via the helper -
--    this is the line that was inverted.
CREATE POLICY "admins_select_all_users"
  ON public.users
  FOR SELECT
  USING (public.is_admin());

-- 3. A user updates their own row but cannot change their own role.
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role IS NOT DISTINCT FROM public.current_user_role()
  );

-- 4. An admin updates any row.
CREATE POLICY "admins_update_all_users"
  ON public.users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. An admin inserts rows (the signup trigger runs as SECURITY DEFINER and is
--    not subject to this).
CREATE POLICY "admins_insert_users"
  ON public.users
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Anonymous callers have no business reading this table at all; the 2FA login
-- path used to depend on reading it while signed out, which is fixed in the
-- application rather than by widening this grant.
REVOKE ALL ON public.users FROM anon;
GRANT SELECT, UPDATE ON public.users TO authenticated;

COMMENT ON POLICY "admins_select_all_users" ON public.users IS
  'Checks the caller via public.is_admin(). Must not be flattened to a bare role predicate: an unqualified role column in a USING clause tests the scanned row, exposing every admin row (including two_factor_secret) to all authenticated users.';
