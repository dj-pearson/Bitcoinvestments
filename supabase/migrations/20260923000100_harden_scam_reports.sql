-- Harden the community scam database
--
-- Problems fixed (all confirmed by reading the earlier migrations):
--
-- 1. Self-verification. 202512040000000 created permissive policies on
--    scam_reports and scam_report_comments. 20260128000000 added tighter ones
--    but never dropped the originals, and Postgres ORs permissive policies, so
--    the old ones still applied:
--      * "Authenticated users can create scam reports" -
--        WITH CHECK (auth.uid() IS NOT NULL): any user could insert a row with
--        status = 'verified' and publish it immediately.
--      * "Users can update their own reports" - no status restriction and no
--        WITH CHECK: a reporter could flip their own report to 'verified'.
--      * "Authenticated users can create comments" - any user could insert a
--        comment with is_admin = true (rendered as an Admin badge) or with
--        someone else's user_id.
--
-- 2. Vote and dispute counters never moved. update_scam_vote_counts() and
--    update_dispute_count() were SECURITY INVOKER, so a voter's UPDATE of
--    somebody else's scam_reports row was filtered out by RLS and silently
--    did nothing. calculate_trust_score() was defined but never called, so
--    every report showed the default 50.
--
-- 3. Disputes: a user could insert a dispute already marked 'upheld' or
--    'overturned', and there was no admin policy to review them.
--
-- 4. EVM addresses were stored in whatever case they were typed, so a lookup
--    of the lowercase form missed a checksummed stored address.
--
-- Approach: drop every legacy scam policy by name, recreate the intended set,
-- and add a BEFORE INSERT/UPDATE guard trigger that pins moderation and
-- counter columns for ordinary users. The guard only acts for the
-- `authenticated` and `anon` roles, so the service role, migrations and the
-- SECURITY DEFINER counter triggers below (which run as the function owner)
-- can still maintain those columns. Admins pass through via public.is_admin().
--
-- Idempotent: every object is dropped/replaced before it is created.
-- Only scam tables are touched.

-- ============================================================================
-- 1. Drop legacy permissive policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view verified scam reports" ON public.scam_reports;
DROP POLICY IF EXISTS "Authenticated users can create scam reports" ON public.scam_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.scam_reports;
DROP POLICY IF EXISTS "Admins can delete scam reports" ON public.scam_reports;

DROP POLICY IF EXISTS "Anyone can view comments on verified reports" ON public.scam_report_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.scam_report_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.scam_report_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.scam_report_comments;

DROP POLICY IF EXISTS "Authenticated users can vote" ON public.scam_report_votes;
DROP POLICY IF EXISTS "Users can update own votes" ON public.scam_report_votes;

DROP POLICY IF EXISTS "Authenticated users can create disputes" ON public.scam_report_disputes;
DROP POLICY IF EXISTS "Users can update own pending disputes" ON public.scam_report_disputes;

-- Already removed by 20260911020000; repeated so this migration is complete on its own.
DROP POLICY IF EXISTS "System manages reputation" ON public.scam_reporter_reputation;

-- ============================================================================
-- 2. scam_reports policies
-- ============================================================================

ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;

-- Public reads: verified reports only. 'investigating' rows are unreviewed
-- allegations and are no longer public.
DROP POLICY IF EXISTS "scam_reports_select_public" ON public.scam_reports;
CREATE POLICY "scam_reports_select_public"
  ON public.scam_reports FOR SELECT
  USING (status = 'verified');

DROP POLICY IF EXISTS "scam_reports_select_own" ON public.scam_reports;
CREATE POLICY "scam_reports_select_own"
  ON public.scam_reports FOR SELECT
  USING (reported_by = auth.uid());

DROP POLICY IF EXISTS "scam_reports_select_admin" ON public.scam_reports;
CREATE POLICY "scam_reports_select_admin"
  ON public.scam_reports FOR SELECT
  USING (public.is_admin());

-- New reports are always pending and always attributed to the caller.
DROP POLICY IF EXISTS "scam_reports_insert_auth" ON public.scam_reports;
CREATE POLICY "scam_reports_insert_auth"
  ON public.scam_reports FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reported_by = auth.uid()
    AND status = 'pending'
  );

-- Moderators may add reports directly (e.g. already-verified ones).
DROP POLICY IF EXISTS "scam_reports_insert_admin" ON public.scam_reports;
CREATE POLICY "scam_reports_insert_admin"
  ON public.scam_reports FOR INSERT
  WITH CHECK (public.is_admin());

-- Reporters may edit their own report only while it is pending, and the
-- result must still be their own pending report.
DROP POLICY IF EXISTS "scam_reports_update_own" ON public.scam_reports;
CREATE POLICY "scam_reports_update_own"
  ON public.scam_reports FOR UPDATE
  USING (reported_by = auth.uid() AND status = 'pending')
  WITH CHECK (reported_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "scam_reports_update_admin" ON public.scam_reports;
CREATE POLICY "scam_reports_update_admin"
  ON public.scam_reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "scam_reports_delete_super_admin" ON public.scam_reports;
CREATE POLICY "scam_reports_delete_super_admin"
  ON public.scam_reports FOR DELETE
  USING (public.is_super_admin());

REVOKE INSERT, UPDATE, DELETE ON public.scam_reports FROM anon;

-- ============================================================================
-- 3. Trust score (pure) and the scam_reports guard trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.compute_scam_trust_score(
  p_upvotes INTEGER,
  p_downvotes INTEGER,
  p_disputes INTEGER,
  p_status TEXT
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_up INTEGER := COALESCE(p_upvotes, 0);
  v_down INTEGER := COALESCE(p_downvotes, 0);
  v_score DECIMAL(5,2);
BEGIN
  IF v_up + v_down = 0 THEN
    v_score := 50.00;
  ELSE
    v_score := (v_up::DECIMAL / (v_up + v_down)::DECIMAL) * 100;
  END IF;

  v_score := v_score - (COALESCE(p_disputes, 0) * 5);

  IF p_status = 'verified' THEN
    v_score := LEAST(v_score + 20, 100);
  ELSIF p_status = 'rejected' THEN
    v_score := 0;
  END IF;

  RETURN GREATEST(LEAST(v_score, 100.00), 0.00);
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp;

-- Kept for compatibility with anything calling it by report id.
CREATE OR REPLACE FUNCTION public.calculate_trust_score(report_id UUID)
RETURNS DECIMAL(5,2) AS $$
  SELECT public.compute_scam_trust_score(upvotes, downvotes, dispute_count, status)
  FROM public.scam_reports
  WHERE id = report_id;
$$ LANGUAGE sql STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.normalize_scam_address(addr TEXT)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN addr IS NULL THEN NULL
    WHEN btrim(addr) ~ '^0x[0-9a-fA-F]{40}$' THEN lower(btrim(addr))
    ELSE btrim(addr)
  END;
$$ LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.scam_reports_before_write()
RETURNS TRIGGER AS $$
DECLARE
  -- Ordinary API callers. The service role, the migration owner and SECURITY
  -- DEFINER functions run as other roles and are not restricted here.
  v_restricted BOOLEAN := current_user IN ('authenticated', 'anon') AND NOT public.is_admin();
BEGIN
  IF v_restricted THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
      NEW.reported_by := auth.uid();
      NEW.verified_by := NULL;
      NEW.verified_at := NULL;
      NEW.upvotes := 0;
      NEW.downvotes := 0;
      NEW.dispute_count := 0;
      NEW.source := 'user_reported';
      NEW.external_id := NULL;
      NEW.created_at := NOW();
    ELSE
      NEW.status := OLD.status;
      NEW.reported_by := OLD.reported_by;
      NEW.verified_by := OLD.verified_by;
      NEW.verified_at := OLD.verified_at;
      NEW.upvotes := OLD.upvotes;
      NEW.downvotes := OLD.downvotes;
      NEW.dispute_count := OLD.dispute_count;
      NEW.source := OLD.source;
      NEW.external_id := OLD.external_id;
      NEW.created_at := OLD.created_at;
    END IF;
  END IF;

  -- EVM addresses are case-insensitive; store them lowercase so lookups match.
  IF NEW.wallet_addresses IS NOT NULL THEN
    NEW.wallet_addresses := ARRAY(
      SELECT public.normalize_scam_address(a) FROM unnest(NEW.wallet_addresses) AS a
    );
  END IF;
  NEW.contract_address := public.normalize_scam_address(NEW.contract_address);

  NEW.trust_score := public.compute_scam_trust_score(
    NEW.upvotes, NEW.downvotes, NEW.dispute_count, NEW.status
  );

  -- Edits made through the API bump updated_at; counter refreshes and
  -- backfills (other roles) leave it alone so it keeps meaning "content edited".
  IF TG_OP = 'UPDATE' AND current_user IN ('authenticated', 'anon') THEN
    NEW.updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_scam_reports_before_write ON public.scam_reports;
CREATE TRIGGER trigger_scam_reports_before_write
  BEFORE INSERT OR UPDATE ON public.scam_reports
  FOR EACH ROW EXECUTE FUNCTION public.scam_reports_before_write();

-- ============================================================================
-- 4. Vote and dispute counters (SECURITY DEFINER, recomputed from source rows)
-- ============================================================================

-- Recount rather than increment, so counts self-heal and cannot drift when a
-- vote row is moved between reports.
CREATE OR REPLACE FUNCTION public.refresh_scam_report_counts(p_report_id UUID)
RETURNS VOID AS $$
BEGIN
  IF p_report_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.scam_reports r
  SET
    upvotes = (SELECT COUNT(*) FROM public.scam_report_votes v
               WHERE v.scam_report_id = p_report_id AND v.vote_type = 'upvote'),
    downvotes = (SELECT COUNT(*) FROM public.scam_report_votes v
                 WHERE v.scam_report_id = p_report_id AND v.vote_type = 'downvote'),
    dispute_count = (SELECT COUNT(*) FROM public.scam_report_disputes d
                     WHERE d.scam_report_id = p_report_id
                     AND d.status IN ('pending', 'reviewing', 'upheld')),
    last_activity_at = NOW()
  WHERE r.id = p_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.refresh_scam_report_counts(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_scam_report_counts(UUID) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_scam_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.refresh_scam_report_counts(OLD.scam_report_id);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE')
     AND (TG_OP = 'INSERT' OR NEW.scam_report_id IS DISTINCT FROM OLD.scam_report_id
          OR NEW.vote_type IS DISTINCT FROM OLD.vote_type) THEN
    PERFORM public.refresh_scam_report_counts(NEW.scam_report_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_update_scam_vote_counts ON public.scam_report_votes;
CREATE TRIGGER trigger_update_scam_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.scam_report_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_scam_vote_counts();

CREATE OR REPLACE FUNCTION public.update_dispute_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.refresh_scam_report_counts(OLD.scam_report_id);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.refresh_scam_report_counts(NEW.scam_report_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_update_dispute_count ON public.scam_report_disputes;
CREATE TRIGGER trigger_update_dispute_count
  AFTER INSERT OR UPDATE OF status, scam_report_id OR DELETE ON public.scam_report_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_dispute_count();

-- ============================================================================
-- 5. Votes: only on verified reports, only as yourself
-- ============================================================================

ALTER TABLE public.scam_report_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scam_report_votes_insert_own" ON public.scam_report_votes;
CREATE POLICY "scam_report_votes_insert_own"
  ON public.scam_report_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.scam_reports r
      WHERE r.id = scam_report_id AND r.status = 'verified'
    )
  );

DROP POLICY IF EXISTS "scam_report_votes_update_own" ON public.scam_report_votes;
CREATE POLICY "scam_report_votes_update_own"
  ON public.scam_report_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.scam_report_votes FROM anon;

-- ============================================================================
-- 6. Disputes: created pending, reviewed by admins
-- ============================================================================

ALTER TABLE public.scam_report_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scam_report_disputes_insert_own" ON public.scam_report_disputes;
CREATE POLICY "scam_report_disputes_insert_own"
  ON public.scam_report_disputes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND admin_notes IS NULL
  );

DROP POLICY IF EXISTS "scam_report_disputes_update_own_pending" ON public.scam_report_disputes;
CREATE POLICY "scam_report_disputes_update_own_pending"
  ON public.scam_report_disputes FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND admin_notes IS NULL
  );

DROP POLICY IF EXISTS "scam_report_disputes_admin_all" ON public.scam_report_disputes;
CREATE POLICY "scam_report_disputes_admin_all"
  ON public.scam_report_disputes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.scam_report_disputes FROM anon;

-- ============================================================================
-- 7. Comments: own identity, no self-granted admin badge
-- ============================================================================

ALTER TABLE public.scam_report_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scam_report_comments_select_public" ON public.scam_report_comments;
CREATE POLICY "scam_report_comments_select_public"
  ON public.scam_report_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scam_reports r
      WHERE r.id = scam_report_comments.scam_report_id
      AND r.status = 'verified'
    )
  );

DROP POLICY IF EXISTS "scam_report_comments_insert_auth" ON public.scam_report_comments;
CREATE POLICY "scam_report_comments_insert_auth"
  ON public.scam_report_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (is_admin IS NOT TRUE OR public.is_admin())
    AND EXISTS (
      SELECT 1 FROM public.scam_reports r
      WHERE r.id = scam_report_id
      AND (r.status = 'verified' OR r.reported_by = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "scam_report_comments_update_own" ON public.scam_report_comments;
CREATE POLICY "scam_report_comments_update_own"
  ON public.scam_report_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND (is_admin IS NOT TRUE OR public.is_admin()));

DROP POLICY IF EXISTS "scam_report_comments_delete_own" ON public.scam_report_comments;
CREATE POLICY "scam_report_comments_delete_own"
  ON public.scam_report_comments FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- The admin badge reflects the author's real role at write time.
CREATE OR REPLACE FUNCTION public.scam_report_comments_before_write()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.is_admin := COALESCE(public.is_admin(), FALSE);
    IF TG_OP = 'UPDATE' THEN
      NEW.user_id := OLD.user_id;
      NEW.scam_report_id := OLD.scam_report_id;
      NEW.created_at := OLD.created_at;
      NEW.updated_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_scam_report_comments_before_write ON public.scam_report_comments;
CREATE TRIGGER trigger_scam_report_comments_before_write
  BEFORE INSERT OR UPDATE ON public.scam_report_comments
  FOR EACH ROW EXECUTE FUNCTION public.scam_report_comments_before_write();

REVOKE INSERT, UPDATE, DELETE ON public.scam_report_comments FROM anon;

-- ============================================================================
-- 8. Reputation: public read, admin/service-role writes only
-- ============================================================================

ALTER TABLE public.scam_reporter_reputation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reputation" ON public.scam_reporter_reputation;
CREATE POLICY "Anyone can view reputation"
  ON public.scam_reporter_reputation FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage reputation" ON public.scam_reporter_reputation;
CREATE POLICY "Admins manage reputation"
  ON public.scam_reporter_reputation FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.scam_reporter_reputation FROM anon;

-- ============================================================================
-- 9. Backfill: normalise stored addresses and recompute counters/trust
-- ============================================================================

-- Runs as the migration owner, so the guard trigger does not pin columns and
-- the BEFORE trigger lowercases EVM addresses and recomputes trust_score.
UPDATE public.scam_reports r
SET
  upvotes = (SELECT COUNT(*) FROM public.scam_report_votes v
             WHERE v.scam_report_id = r.id AND v.vote_type = 'upvote'),
  downvotes = (SELECT COUNT(*) FROM public.scam_report_votes v
               WHERE v.scam_report_id = r.id AND v.vote_type = 'downvote'),
  dispute_count = (SELECT COUNT(*) FROM public.scam_report_disputes d
                   WHERE d.scam_report_id = r.id
                   AND d.status IN ('pending', 'reviewing', 'upheld'));

COMMENT ON FUNCTION public.scam_reports_before_write() IS
  'Guard for scam_reports: ordinary users cannot set status, verification, counters or source; new rows are always pending. Also lowercases EVM addresses and recomputes trust_score.';
COMMENT ON FUNCTION public.refresh_scam_report_counts(UUID) IS
  'Recounts votes and open disputes for one report. SECURITY DEFINER so a voter can update counters on a report they do not own; not callable by API roles.';
