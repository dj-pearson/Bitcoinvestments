-- Reconcile the schema with the application code (2026-09-23)
--
-- Every statement here is idempotent, so this file is safe to run on:
--   * a fresh database built from the migrations in this folder, and
--   * the long-lived production database, whatever subset of the earlier
--     migrations it happens to have.
--
-- What it fixes (see docs/page-review/reviews/13-gated.md):
--   1. New sign-ups got no public.users row. 20251223161809_remote_schema.sql
--      dropped handle_new_user() and its trigger, and the browser-side insert
--      the app fell back on is refused by RLS (and has no session while email
--      confirmation is pending). The trigger is restored and missing rows are
--      backfilled.
--   2. users columns the code reads and the Stripe webhook writes did not exist.
--   3. subscription_status could only hold 'free' and 'premium'.
--   4. Tables the code uses were never created: platform_reviews,
--      moderation_queue, push_subscriptions, notification_preferences,
--      influencer_referrals, plus affiliate_applications for the affiliate
--      programme form.
--   5. app_meta.schema_version, which the front end checks before it lights up
--      account features (src/hooks/useBackendStatus.ts).
--   6. Leftovers from the removed wallet login that widened access to
--      public.users, and a few other places where a signed-in user could write
--      values that only the server should set.
--
-- It does not loosen anything the 2026-09-11 security migrations tightened:
-- public.users stays unreadable to anon, users_update_own keeps its allowlist
-- guard (the new Stripe/subscription columns are NOT on that allowlist, so they
-- are protected by default), and payment tables stay service-role-write-only.
--
-- ALTER TYPE ... ADD VALUE may run inside a transaction on Postgres 12+, but the
-- new values cannot be used in the same transaction, so nothing below refers to
-- them.

-- ============================================================================
-- 1. users: missing columns
-- ============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_tier TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS lifetime_purchase_date TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS lifetime_purchase_amount NUMERIC(10, 2);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_recovery_codes TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ;

-- The webhook looks users up by these ids on every subscription event.
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
  ON public.users (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id
  ON public.users (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- ============================================================================
-- 2. subscription_status: values the webhook writes and the gates compare to
-- ============================================================================

ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'advisor';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'enterprise';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'api';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'lifetime';

-- ============================================================================
-- 3. Wallet-login leftovers on public.users (Web3 login was removed)
-- ============================================================================

-- 20260119_add_wallet_auth.sql added an INSERT policy for anon and
-- authenticated whose only condition was "wallet_address is set and email is
-- null". It does not tie the row to the caller or restrict any other column, so
-- a signed-in user without a profile row - which, before this migration, was
-- every account created since the signup trigger was dropped - could insert
-- their own profile with role = 'super_admin'.
DROP POLICY IF EXISTS "Allow wallet user creation" ON public.users;

-- Its companion SELECT policy matched rows on a request header the caller
-- chooses (x-wallet-address), so any signed-in user could read any profile row
-- that had a wallet address, 2FA secret included. users_select_own already
-- covers the auth.uid() = id half.
DROP POLICY IF EXISTS "Users can read own profile via wallet" ON public.users;

-- ============================================================================
-- 4. Profile row on sign-up
-- ============================================================================

-- Default preferences, previously written by the browser in
-- src/services/auth.ts signUp(). risk_tolerance uses the values the Profile
-- page offers (conservative / moderate / aggressive).
CREATE OR REPLACE FUNCTION public.default_user_preferences()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'experience_level', 'beginner',
    'risk_tolerance', 'moderate',
    'favorite_cryptocurrencies', '[]'::jsonb,
    'notification_settings', jsonb_build_object(
      'price_alerts', true,
      'news_alerts', true,
      'weekly_summary', true,
      'marketing_emails', false
    ),
    'theme', 'dark'
  );
$$;

-- Runs as the table owner (SECURITY DEFINER) so it is not subject to the
-- users RLS policies, with a pinned search_path so a caller cannot redirect it.
-- A failure here must never block the sign-up itself: auth.users is the source
-- of truth, the backfill below repairs a missed row, and the warning lands in
-- the Postgres log.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (id, email, role, subscription_status, preferences)
    VALUES (NEW.id, NEW.email, 'user', 'free', public.default_user_preferences())
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: could not create profile for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep the email on the profile in step when a user changes it through
-- Supabase Auth (the profile copy is what admin screens and emails use).
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
    BEGIN
      UPDATE public.users SET email = NEW.email, updated_at = NOW() WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_user_email_change: could not sync email for %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_user_email_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_user_email_change() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_change();

-- The other trigger on auth.users (202412220011500) is SECURITY DEFINER with
-- an unqualified table name and no search_path. Supabase Auth inserts with a
-- search_path of its own, where "user_reputation" does not resolve, and an
-- error in any AFTER INSERT trigger aborts the sign-up. Pin it.
DO $$
BEGIN
  IF to_regprocedure('public.create_user_reputation()') IS NOT NULL THEN
    ALTER FUNCTION public.create_user_reputation() SET search_path = public, pg_temp;
  END IF;
END
$$;

-- Backfill: every existing auth user gets a profile row.
INSERT INTO public.users (id, email, role, subscription_status, preferences)
SELECT au.id, au.email, 'user', 'free', public.default_user_preferences()
FROM auth.users au
WHERE au.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. Shared helper: is this statement coming straight from a browser client?
-- ============================================================================

-- PostgREST runs browser requests as the `anon` or `authenticated` role and
-- service-role requests as `service_role`. Inside a SECURITY DEFINER function
-- current_user is the function owner instead. The guard triggers below are
-- SECURITY INVOKER and use this to clamp columns that only the server may set,
-- while leaving the Stripe webhook, SECURITY DEFINER helpers and admins alone.
CREATE OR REPLACE FUNCTION public.is_client_write()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT current_user IN ('anon', 'authenticated') AND NOT public.is_admin();
$$;

-- ============================================================================
-- 6. api_subscriptions / api_keys: what the webhook writes, and who sets tier
-- ============================================================================

ALTER TABLE public.api_subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.api_subscriptions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_subscriptions_status_check'
  ) THEN
    ALTER TABLE public.api_subscriptions
      ADD CONSTRAINT api_subscriptions_status_check
      CHECK (status IN ('active', 'past_due', 'inactive', 'canceled'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_api_subscriptions_stripe_sub
  ON public.api_subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- api_keys lets the owner insert and update their own rows, and the tier column
-- drives the rate limits (trigger_update_api_key_limits). Without a guard a
-- free user could create or edit a key as 'enterprise'. The tier now comes from
-- the user's paid API subscription, and a client update may only rename a key,
-- revoke it, or change its origin/IP allowlists. Named so it fires before
-- trigger_update_api_key_limits (triggers fire in name order).
CREATE OR REPLACE FUNCTION public.api_keys_enforce_server_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  paid_tier TEXT;
BEGIN
  -- Deliberately SECURITY INVOKER: current_user is then the caller's role, so
  -- the webhook (service_role) and admins pass through untouched.
  IF NOT public.is_client_write() THEN
    RETURN NEW;
  END IF;

  SELECT s.tier INTO paid_tier
  FROM public.api_subscriptions s
  WHERE s.user_id = NEW.user_id
    AND s.status = 'active'
    AND (s.current_period_end IS NULL OR s.current_period_end > NOW());

  IF TG_OP = 'INSERT' THEN
    NEW.tier := coalesce(paid_tier, 'free');
    NEW.status := 'active';
    NEW.requests_today := 0;
    NEW.requests_this_month := 0;
    NEW.last_used_at := NULL;
    NEW.expires_at := NULL;
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.key_hash := OLD.key_hash;
    NEW.key_prefix := OLD.key_prefix;
    NEW.tier := OLD.tier;
    NEW.permissions := OLD.permissions;
    NEW.rate_limit_per_minute := OLD.rate_limit_per_minute;
    NEW.rate_limit_per_day := OLD.rate_limit_per_day;
    NEW.requests_today := OLD.requests_today;
    NEW.requests_this_month := OLD.requests_this_month;
    NEW.last_used_at := OLD.last_used_at;
    NEW.expires_at := OLD.expires_at;
    NEW.created_at := OLD.created_at;
    -- The only status change a key owner may make is revoking it.
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'revoked' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS a_api_keys_enforce_server_fields ON public.api_keys;
CREATE TRIGGER a_api_keys_enforce_server_fields
  BEFORE INSERT OR UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.api_keys_enforce_server_fields();

-- ============================================================================
-- 7. platform_reviews (+ increment_review_helpful)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform_type TEXT NOT NULL CHECK (platform_type IN ('exchange', 'wallet', 'tax_software')),
  platform_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  pros TEXT[],
  cons TEXT[],
  verified_user BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_reviews_one_per_platform UNIQUE (user_id, platform_type, platform_id)
);

-- The FK name the front end joins through (services/reviews.ts selects
-- users!platform_reviews_user_id_fkey). A table created by hand may lack it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_reviews_user_id_fkey') THEN
    ALTER TABLE public.platform_reviews
      ADD CONSTRAINT platform_reviews_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE NOT VALID;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_platform_reviews_user_id ON public.platform_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_platform_reviews_platform ON public.platform_reviews (platform_type, platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_reviews_status ON public.platform_reviews (status);
CREATE INDEX IF NOT EXISTS idx_platform_reviews_approved
  ON public.platform_reviews (platform_type, platform_id, created_at DESC)
  WHERE status = 'approved';

-- The insert policy only checks user_id, and the browser sends status,
-- helpful_count and verified_user itself (services/reviews.ts). Clamp them: a
-- review always starts pending with no votes, "verified" is derived from the
-- author's plan, and an edit goes back to moderation.
CREATE OR REPLACE FUNCTION public.platform_reviews_enforce_server_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- SECURITY INVOKER on purpose (see is_client_write): the service role, admins
  -- and the SECURITY DEFINER helpers below (vote counting, moderation
  -- decisions) are not clamped.
  IF NOT public.is_client_write() THEN
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.helpful_count := 0;
    NEW.created_at := NOW();
    SELECT coalesce(u.subscription_status::text, 'free') <> 'free'
      INTO NEW.verified_user
      FROM public.users u WHERE u.id = NEW.user_id;
    NEW.verified_user := coalesce(NEW.verified_user, FALSE);
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.platform_type := OLD.platform_type;
    NEW.platform_id := OLD.platform_id;
    NEW.helpful_count := OLD.helpful_count;
    NEW.verified_user := OLD.verified_user;
    NEW.created_at := OLD.created_at;
    NEW.status := 'pending';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_reviews_enforce_server_fields ON public.platform_reviews;
CREATE TRIGGER platform_reviews_enforce_server_fields
  BEFORE INSERT OR UPDATE ON public.platform_reviews
  FOR EACH ROW EXECUTE FUNCTION public.platform_reviews_enforce_server_fields();

ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;

-- Same policies as 20260128000000_comprehensive_rls_security.sql, which only
-- applies them when the table already existed.
DROP POLICY IF EXISTS "platform_reviews_select_approved" ON public.platform_reviews;
CREATE POLICY "platform_reviews_select_approved"
  ON public.platform_reviews FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "platform_reviews_select_own" ON public.platform_reviews;
CREATE POLICY "platform_reviews_select_own"
  ON public.platform_reviews FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "platform_reviews_select_admin" ON public.platform_reviews;
CREATE POLICY "platform_reviews_select_admin"
  ON public.platform_reviews FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "platform_reviews_insert_auth" ON public.platform_reviews;
CREATE POLICY "platform_reviews_insert_auth"
  ON public.platform_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "platform_reviews_update_own" ON public.platform_reviews;
CREATE POLICY "platform_reviews_update_own"
  ON public.platform_reviews FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "platform_reviews_update_admin" ON public.platform_reviews;
CREATE POLICY "platform_reviews_update_admin"
  ON public.platform_reviews FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "platform_reviews_delete_own" ON public.platform_reviews;
CREATE POLICY "platform_reviews_delete_own"
  ON public.platform_reviews FOR DELETE
  USING (user_id = auth.uid());

REVOKE ALL ON public.platform_reviews FROM anon;
GRANT SELECT ON public.platform_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_reviews TO authenticated;

-- One helpful vote per user per review.
CREATE TABLE IF NOT EXISTS public.platform_review_helpful_votes (
  review_id UUID NOT NULL REFERENCES public.platform_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id, user_id)
);

ALTER TABLE public.platform_review_helpful_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_helpful_votes_select_own" ON public.platform_review_helpful_votes;
CREATE POLICY "review_helpful_votes_select_own"
  ON public.platform_review_helpful_votes FOR SELECT
  USING (user_id = auth.uid());

-- Writes go through increment_review_helpful() only.
REVOKE ALL ON public.platform_review_helpful_votes FROM anon, authenticated;
GRANT SELECT ON public.platform_review_helpful_votes TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_review_helpful(review_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  voter UUID := auth.uid();
  inserted INTEGER;
BEGIN
  IF voter IS NULL THEN
    RAISE EXCEPTION 'Sign in to mark a review as helpful' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.platform_reviews r
    WHERE r.id = increment_review_helpful.review_id
      AND r.status = 'approved'
      AND r.user_id <> voter
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.platform_review_helpful_votes (review_id, user_id)
  VALUES (increment_review_helpful.review_id, voter)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;

  IF inserted > 0 THEN
    UPDATE public.platform_reviews
      SET helpful_count = helpful_count + 1
      WHERE id = increment_review_helpful.review_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_review_helpful(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_review_helpful(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_review_helpful(UUID) TO authenticated;

-- ============================================================================
-- 8. moderation_queue (/admin/content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('review', 'comment', 'report')),
  -- Row in the source table (platform_reviews, scam_report_comments, ...).
  source_id UUID,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason TEXT,
  flagged_by TEXT,
  moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_moderation_queue_source
  ON public.moderation_queue (type, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status
  ON public.moderation_queue (status, created_at DESC);

DROP TRIGGER IF EXISTS update_moderation_queue_updated_at ON public.moderation_queue;
CREATE TRIGGER update_moderation_queue_updated_at
  BEFORE UPDATE ON public.moderation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moderation_queue_admin_all" ON public.moderation_queue;
CREATE POLICY "moderation_queue_admin_all"
  ON public.moderation_queue FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.moderation_queue FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moderation_queue TO authenticated;

-- New or edited reviews are queued for moderation automatically ...
CREATE OR REPLACE FUNCTION public.queue_review_for_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.moderation_queue (type, source_id, content, author_id, author_email, status)
    SELECT 'review', NEW.id, NEW.title || E'\n\n' || NEW.content, NEW.user_id, u.email, 'pending'
    FROM (SELECT 1) AS one
    LEFT JOIN public.users u ON u.id = NEW.user_id
    ON CONFLICT (type, source_id) WHERE source_id IS NOT NULL
    DO UPDATE SET content = EXCLUDED.content, status = 'pending',
                  moderated_by = NULL, moderated_at = NULL, rejection_reason = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_reviews_queue_moderation ON public.platform_reviews;
CREATE TRIGGER platform_reviews_queue_moderation
  AFTER INSERT OR UPDATE OF title, content, status ON public.platform_reviews
  FOR EACH ROW EXECUTE FUNCTION public.queue_review_for_moderation();

-- ... and a moderator's decision is applied to the review itself.
CREATE OR REPLACE FUNCTION public.apply_moderation_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.type = 'review' AND NEW.source_id IS NOT NULL
     AND NEW.status IN ('approved', 'rejected')
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.platform_reviews SET status = NEW.status WHERE id = NEW.source_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS moderation_queue_apply_decision ON public.moderation_queue;
CREATE TRIGGER moderation_queue_apply_decision
  AFTER UPDATE OF status ON public.moderation_queue
  FOR EACH ROW EXECUTE FUNCTION public.apply_moderation_decision();

REVOKE EXECUTE ON FUNCTION public.queue_review_for_moderation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_moderation_decision() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 9. push_subscriptions and notification_preferences (Profile > Alerts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_own"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE ALL ON public.push_subscriptions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  price_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  portfolio_updates BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  promotional BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences_own" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own"
  ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE ALL ON public.notification_preferences FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;

-- ============================================================================
-- 10. influencer_referrals and affiliate_applications (/affiliate)
-- ============================================================================

-- Click log for creator affiliate links (?ref=CODE). Anyone may record a click,
-- exactly like affiliate_clicks; only admins read the log.
CREATE TABLE IF NOT EXISTS public.influencer_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code TEXT NOT NULL CHECK (char_length(affiliate_code) BETWEEN 1 AND 64),
  session_id TEXT CHECK (session_id IS NULL OR char_length(session_id) <= 128),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  landing_page TEXT CHECK (landing_page IS NULL OR char_length(landing_page) <= 2048),
  source_url TEXT CHECK (source_url IS NULL OR char_length(source_url) <= 2048),
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencer_referrals_code ON public.influencer_referrals (affiliate_code, clicked_at DESC);

ALTER TABLE public.influencer_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "influencer_referrals_insert_any" ON public.influencer_referrals;
CREATE POLICY "influencer_referrals_insert_any"
  ON public.influencer_referrals FOR INSERT
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND converted = FALSE AND converted_at IS NULL);

DROP POLICY IF EXISTS "influencer_referrals_admin_all" ON public.influencer_referrals;
CREATE POLICY "influencer_referrals_admin_all"
  ON public.influencer_referrals FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.influencer_referrals FROM anon, authenticated;
GRANT INSERT ON public.influencer_referrals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.influencer_referrals TO authenticated;

-- Applications to the creator affiliate programme. One per account.
CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'twitter', 'blog', 'podcast', 'instagram', 'tiktok', 'other')),
  platform_url TEXT NOT NULL CHECK (char_length(platform_url) <= 2048),
  followers_count INTEGER CHECK (followers_count IS NULL OR followers_count >= 0),
  content_description TEXT CHECK (content_description IS NULL OR char_length(content_description) <= 5000),
  why_join TEXT CHECK (why_join IS NULL OR char_length(why_join) <= 5000),
  agreed_to_terms BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_affiliate_applications_updated_at ON public.affiliate_applications;
CREATE TRIGGER update_affiliate_applications_updated_at
  BEFORE UPDATE ON public.affiliate_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_applications_insert_own" ON public.affiliate_applications;
CREATE POLICY "affiliate_applications_insert_own"
  ON public.affiliate_applications FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND reviewer_id IS NULL
    AND reviewer_notes IS NULL
    AND reviewed_at IS NULL
  );

DROP POLICY IF EXISTS "affiliate_applications_select_own" ON public.affiliate_applications;
CREATE POLICY "affiliate_applications_select_own"
  ON public.affiliate_applications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "affiliate_applications_admin_all" ON public.affiliate_applications;
CREATE POLICY "affiliate_applications_admin_all"
  ON public.affiliate_applications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.affiliate_applications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_applications TO authenticated;

-- ============================================================================
-- 11. Tighten reads that leaked to non-admins
-- ============================================================================

-- affiliate_clicks_select_own also matched every anonymous click
-- (user_id IS NULL), so any signed-in user could read other visitors' click
-- log including session ids. Admins keep affiliate_clicks_select_admin.
DROP POLICY IF EXISTS "affiliate_clicks_select_own" ON public.affiliate_clicks;
CREATE POLICY "affiliate_clicks_select_own"
  ON public.affiliate_clicks FOR SELECT
  USING (user_id = auth.uid());

-- admin_settings was world-readable ("Anyone can view admin settings", from
-- 202512040000000). Nothing public reads it; the admin screens are covered by
-- admin_settings_select_admin.
DROP POLICY IF EXISTS "Anyone can view admin settings" ON public.admin_settings;
REVOKE ALL ON public.admin_settings FROM anon;

-- ============================================================================
-- 12. app_meta: schema version for the front end's capability check
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_meta_public_read" ON public.app_meta;
CREATE POLICY "app_meta_public_read"
  ON public.app_meta FOR SELECT
  USING (true);

-- Read-only to clients; migrations (and the service role) write it.
REVOKE ALL ON public.app_meta FROM anon, authenticated;
GRANT SELECT ON public.app_meta TO anon, authenticated;

-- The front end (REQUIRED_SCHEMA_VERSION in src/hooks/useBackendStatus.ts)
-- treats any value lower than the one it was built for as "outdated" and keeps
-- account features off. A later migration that the code depends on should bump
-- this with GREATEST so it never moves backwards.
INSERT INTO public.app_meta (key, value)
VALUES ('schema_version', '20260923000300')
ON CONFLICT (key) DO UPDATE
  SET value = GREATEST(public.app_meta.value, EXCLUDED.value),
      updated_at = NOW();

COMMENT ON TABLE public.app_meta IS
  'Public, read-only key/value facts about the database. schema_version is the newest migration the application may rely on; the front end compares it before enabling account features.';
