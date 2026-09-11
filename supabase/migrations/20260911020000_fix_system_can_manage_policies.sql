-- Fix: "System can manage" policies granted everyone what they meant to reserve
--
-- Two tables carried a policy of this shape:
--
--   -- Only system/webhook can insert (via service role)
--   CREATE POLICY "System can manage tax purchases" ON public.tax_report_purchases
--       FOR ALL USING (true) WITH CHECK (true);
--
-- The comment states the intent exactly, and the policy does the opposite of it.
-- The service role bypasses row-level security altogether, so it never needed a
-- policy; the only callers a policy can affect are the ones it was meant to
-- exclude. FOR ALL with an unconditional predicate hands SELECT, INSERT, UPDATE
-- and DELETE on every row to anyone holding the table grants, and
-- 20260128000000 grants SELECT, INSERT and UPDATE on tax_report_purchases to
-- `authenticated`.
--
-- Because RLS ORs its policies, this also silently overrode the
-- "Users can view own tax purchases" policy sitting directly above it.
--
-- Confirmed against a local Postgres carrying these definitions: an ordinary
-- user could read every customer's purchase row including price_paid and
-- stripe_payment_intent_id, insert themselves a completed premium purchase for
-- 0.00, and mark a real customer's payment refunded.

-- ============================================
-- tax_report_purchases
-- ============================================

DROP POLICY IF EXISTS "System can manage tax purchases" ON public.tax_report_purchases;

-- Reads stay scoped to the owner. "Users can view own tax purchases" already
-- exists; it is recreated here so the end state does not depend on it having
-- survived, and so this migration is complete on its own.
DROP POLICY IF EXISTS "Users can view own tax purchases" ON public.tax_report_purchases;
CREATE POLICY "Users can view own tax purchases"
  ON public.tax_report_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all tax purchases" ON public.tax_report_purchases;
CREATE POLICY "Admins can view all tax purchases"
  ON public.tax_report_purchases
  FOR SELECT
  USING (public.is_admin());

-- No write policy is defined deliberately. Purchases are created and settled by
-- the Stripe webhook in functions/api/stripe-webhook.ts, which uses the service
-- role and is not subject to RLS. The application only ever reads this table
-- (getUserTaxReportPurchases in src/services/database.ts), so the write grants
-- are withdrawn as well - a policy is not the only thing standing between a user
-- and a row they can write.
REVOKE INSERT, UPDATE, DELETE ON public.tax_report_purchases FROM authenticated;
REVOKE ALL ON public.tax_report_purchases FROM anon;
GRANT SELECT ON public.tax_report_purchases TO authenticated;

-- ============================================
-- scam_reporter_reputation
-- ============================================

-- Same shape, same effect: anyone could rewrite any reporter's reputation score
-- and badge, which is what weights trust on the scam database.
DROP POLICY IF EXISTS "System manages reputation" ON public.scam_reporter_reputation;

-- The leaderboard is public by design, so public reads stay.
DROP POLICY IF EXISTS "Anyone can view reputation" ON public.scam_reporter_reputation;
CREATE POLICY "Anyone can view reputation"
  ON public.scam_reporter_reputation
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage reputation" ON public.scam_reporter_reputation;
CREATE POLICY "Admins manage reputation"
  ON public.scam_reporter_reputation
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Writes stay granted to `authenticated` and are restricted by the policy above
-- rather than by the grant. Administrators authenticate as `authenticated` like
-- everyone else, so revoking the privilege outright would block the admin path
-- as well - the grant cannot tell an admin from anyone else, and only the policy
-- can.
REVOKE ALL ON public.scam_reporter_reputation FROM anon;
GRANT SELECT ON public.scam_reporter_reputation TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scam_reporter_reputation TO authenticated;

COMMENT ON TABLE public.tax_report_purchases IS
  'Written only by the Stripe webhook under the service role. Do not add a write policy for authenticated: a "system can manage" policy cannot restrict the service role, which bypasses RLS, and only ever widens access for everyone else.';
