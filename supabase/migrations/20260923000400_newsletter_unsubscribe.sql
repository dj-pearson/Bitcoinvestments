-- Newsletter unsubscribe links that actually work.
--
-- Before this migration the newsletter footer linked to /unsubscribe?email=...
-- but nothing could act on it: anonymous visitors may only INSERT into
-- newsletter_subscribers (UPDATE is admin-only), and an email address alone is
-- not proof that the person clicking owns it.
--
-- Design:
--   * Every subscriber gets a random, unguessable unsubscribe_token (UUID v4,
--     122 random bits). The token is set by the database on INSERT, so a caller
--     cannot choose it (and later use it to unsubscribe someone they signed up).
--   * unsubscribe_newsletter(email, token) is SECURITY DEFINER and only touches
--     the one row where BOTH the email and the token match. It never returns
--     subscriber data - only whether a matching row exists.
--   * It is idempotent: calling it again for an already-unsubscribed row still
--     returns true and keeps the original unsubscribed_at.
--
-- Safe to re-run.

-- 1. Token column. A volatile default is evaluated per row while existing rows
--    are rewritten, so current subscribers each get their own token.
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_key
  ON public.newsletter_subscribers (unsubscribe_token);

-- 2. The database, not the client, chooses the token.
CREATE OR REPLACE FUNCTION public.newsletter_subscribers_set_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.unsubscribe_token := gen_random_uuid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS newsletter_subscribers_set_token ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_set_token
  BEFORE INSERT ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.newsletter_subscribers_set_token();

-- 3. Unsubscribe by email + token.
CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(p_email text, p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rows integer;
BEGIN
  IF p_email IS NULL OR p_token IS NULL OR length(p_email) > 320 THEN
    RETURN false;
  END IF;

  UPDATE public.newsletter_subscribers
     SET is_active = false,
         unsubscribed_at = COALESCE(unsubscribed_at, now())
   WHERE unsubscribe_token = p_token
     AND lower(email) = lower(btrim(p_email));

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_newsletter(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(text, uuid) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.newsletter_subscribers_set_token() FROM PUBLIC;

COMMENT ON FUNCTION public.unsubscribe_newsletter(text, uuid) IS
  'Marks a newsletter subscriber inactive when email and unsubscribe_token both match. Idempotent. Used by /unsubscribe.';
COMMENT ON COLUMN public.newsletter_subscribers.unsubscribe_token IS
  'Random per-subscriber token for one-click unsubscribe links. Set by trigger on insert.';
