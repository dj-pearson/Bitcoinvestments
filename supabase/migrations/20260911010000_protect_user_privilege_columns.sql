-- Fix: a user could grant themselves a subscription, or lift their own suspension
--
-- users_update_own let a user write any column on their own row except `role`:
--
--   WITH CHECK (auth.uid() = id AND role IS NOT DISTINCT FROM public.current_user_role())
--
-- Everything else on public.users was writable from the browser with the user's
-- own credentials. A single call from the console was enough:
--
--   supabase.from('users').update({ subscription_status: 'premium',
--                                   subscription_expires_at: '2099-01-01' })
--                         .eq('id', <own id>)
--
-- which unlocks every paid feature on the platform, since the gates in
-- src/services/subscriptionLimits.ts read exactly those two columns. The same
-- applied to is_suspended, so a suspended account could lift its own
-- suspension; to stripe_customer_id, which the Stripe webhook matches on when
-- it applies subscription events, so pointing it at a paying customer's id
-- would divert their subscription onto the attacker's row; and to referred_by
-- and referral_code, which drive affiliate attribution.
--
-- The guard is an allowlist rather than a list of protected columns. Anything
-- not named as user-editable has to stay as it is, so a privileged column added
-- to this table later is protected by default instead of being exposed until
-- somebody remembers to add it here.
--
-- Admins are unaffected: admins_update_all_users is a separate policy and RLS
-- ORs them, so an administrator changing another user's suspension or tier still
-- passes. Column-level GRANTs were rejected for this reason - they apply to the
-- `authenticated` role as a whole and would have blocked the admin path too.

CREATE OR REPLACE FUNCTION public.self_update_keeps_privileges(candidate jsonb)
RETURNS BOOLEAN AS $$
DECLARE
  -- Columns a user may change on their own row.
  -- search_vector is here because a BEFORE UPDATE trigger rewrites it, so it
  -- differs by the time this check runs on any legitimate update.
  editable TEXT[] := ARRAY[
    'email',
    'full_name',
    'avatar_url',
    'username',
    'wallet_address',
    'preferences',
    'updated_at',
    'last_login_at',
    'search_vector',
    'two_factor_enabled',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'two_factor_enabled_at'
  ];
  stored jsonb;
BEGIN
  SELECT to_jsonb(u) INTO stored FROM public.users u WHERE u.id = (candidate->>'id')::uuid;

  -- No stored row means this is not an update to an existing row; deny rather
  -- than treat the absence as permission.
  IF stored IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN (stored - editable) = (candidate - editable);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.self_update_keeps_privileges(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.self_update_keeps_privileges(jsonb) TO authenticated;

DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND public.self_update_keeps_privileges(to_jsonb(users.*))
  );

COMMENT ON FUNCTION public.self_update_keeps_privileges(jsonb) IS
  'Allowlist guard for users_update_own: every column outside the editable list must keep its stored value, so a user cannot grant themselves a subscription, clear their own suspension, or retarget their Stripe customer id.';
