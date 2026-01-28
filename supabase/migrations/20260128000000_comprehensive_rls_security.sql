-- Comprehensive Row Level Security (RLS) Policies
-- Layer 4: Database-level security - Final enforcement
--
-- This migration implements defense-in-depth at the database layer.
-- Even if application code has bugs, the database will reject unauthorized access.
--
-- Principles:
-- 1. Default deny - no access unless explicitly granted
-- 2. Ownership check - users can only access their own data
-- 3. Admin override - admins can access all data when needed
-- 4. No data leakage - error messages don't reveal existence of data

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if current user is admin or super_admin
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user is super_admin
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user owns a portfolio
CREATE OR REPLACE FUNCTION public.owns_portfolio(portfolio_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user owns a holding (via portfolio)
CREATE OR REPLACE FUNCTION public.owns_holding(holding_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.holdings h
    JOIN public.portfolios p ON h.portfolio_id = p.id
    WHERE h.id = holding_id
    AND p.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- PORTFOLIOS TABLE RLS
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can create portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Admins can view all portfolios" ON public.portfolios;

-- SELECT: Users can view their own portfolios
CREATE POLICY "portfolios_select_own"
  ON public.portfolios FOR SELECT
  USING (user_id = auth.uid());

-- SELECT: Admins can view all portfolios
CREATE POLICY "portfolios_select_admin"
  ON public.portfolios FOR SELECT
  USING (public.is_admin());

-- INSERT: Users can create portfolios for themselves only
CREATE POLICY "portfolios_insert_own"
  ON public.portfolios FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own portfolios
CREATE POLICY "portfolios_update_own"
  ON public.portfolios FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Admins can update any portfolio
CREATE POLICY "portfolios_update_admin"
  ON public.portfolios FOR UPDATE
  USING (public.is_admin());

-- DELETE: Users can delete their own portfolios
CREATE POLICY "portfolios_delete_own"
  ON public.portfolios FOR DELETE
  USING (user_id = auth.uid());

-- DELETE: Super admins can delete any portfolio
CREATE POLICY "portfolios_delete_super_admin"
  ON public.portfolios FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- HOLDINGS TABLE RLS
-- ============================================

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can create holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can update own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can delete own holdings" ON public.holdings;

-- SELECT: Users can view holdings in their portfolios
CREATE POLICY "holdings_select_own"
  ON public.holdings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = holdings.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

-- SELECT: Admins can view all holdings
CREATE POLICY "holdings_select_admin"
  ON public.holdings FOR SELECT
  USING (public.is_admin());

-- INSERT: Users can create holdings in their own portfolios
CREATE POLICY "holdings_insert_own"
  ON public.holdings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update holdings in their portfolios
CREATE POLICY "holdings_update_own"
  ON public.holdings FOR UPDATE
  USING (public.owns_holding(id))
  WITH CHECK (public.owns_holding(id));

-- UPDATE: Admins can update any holding
CREATE POLICY "holdings_update_admin"
  ON public.holdings FOR UPDATE
  USING (public.is_admin());

-- DELETE: Users can delete holdings in their portfolios
CREATE POLICY "holdings_delete_own"
  ON public.holdings FOR DELETE
  USING (public.owns_holding(id));

-- DELETE: Super admins can delete any holding
CREATE POLICY "holdings_delete_super_admin"
  ON public.holdings FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- TRANSACTIONS TABLE RLS
-- ============================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

-- SELECT: Users can view transactions for their holdings
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.holdings h
      JOIN public.portfolios p ON h.portfolio_id = p.id
      WHERE h.id = transactions.holding_id
      AND p.user_id = auth.uid()
    )
  );

-- SELECT: Admins can view all transactions
CREATE POLICY "transactions_select_admin"
  ON public.transactions FOR SELECT
  USING (public.is_admin());

-- INSERT: Users can create transactions for their holdings
CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK (public.owns_holding(holding_id));

-- UPDATE: Users can update transactions for their holdings
CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.holdings h
      JOIN public.portfolios p ON h.portfolio_id = p.id
      WHERE h.id = transactions.holding_id
      AND p.user_id = auth.uid()
    )
  );

-- UPDATE: Admins can update any transaction
CREATE POLICY "transactions_update_admin"
  ON public.transactions FOR UPDATE
  USING (public.is_admin());

-- DELETE: Users can delete transactions for their holdings
CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.holdings h
      JOIN public.portfolios p ON h.portfolio_id = p.id
      WHERE h.id = transactions.holding_id
      AND p.user_id = auth.uid()
    )
  );

-- DELETE: Super admins can delete any transaction
CREATE POLICY "transactions_delete_super_admin"
  ON public.transactions FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- PRICE ALERTS TABLE RLS
-- ============================================

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can create alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.price_alerts;

-- SELECT: Users can view their own alerts
CREATE POLICY "price_alerts_select_own"
  ON public.price_alerts FOR SELECT
  USING (user_id = auth.uid());

-- SELECT: Admins can view all alerts
CREATE POLICY "price_alerts_select_admin"
  ON public.price_alerts FOR SELECT
  USING (public.is_admin());

-- INSERT: Users can create alerts for themselves
CREATE POLICY "price_alerts_insert_own"
  ON public.price_alerts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own alerts
CREATE POLICY "price_alerts_update_own"
  ON public.price_alerts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own alerts
CREATE POLICY "price_alerts_delete_own"
  ON public.price_alerts FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- USER WALLETS TABLE RLS
-- ============================================

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can create wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can delete own wallets" ON public.user_wallets;

-- SELECT: Users can view their own wallets
CREATE POLICY "user_wallets_select_own"
  ON public.user_wallets FOR SELECT
  USING (user_id = auth.uid());

-- SELECT: Admins can view all wallets
CREATE POLICY "user_wallets_select_admin"
  ON public.user_wallets FOR SELECT
  USING (public.is_admin());

-- INSERT: Users can add wallets for themselves
CREATE POLICY "user_wallets_insert_own"
  ON public.user_wallets FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own wallets
CREATE POLICY "user_wallets_update_own"
  ON public.user_wallets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can remove their own wallets
CREATE POLICY "user_wallets_delete_own"
  ON public.user_wallets FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TOKEN APPROVALS TABLE RLS
-- ============================================

ALTER TABLE public.token_approvals ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own token approvals
CREATE POLICY "token_approvals_select_own"
  ON public.token_approvals FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can track their own approvals
CREATE POLICY "token_approvals_insert_own"
  ON public.token_approvals FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own approvals
CREATE POLICY "token_approvals_update_own"
  ON public.token_approvals FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can delete their own approval records
CREATE POLICY "token_approvals_delete_own"
  ON public.token_approvals FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TRANSACTION SYNCS TABLE RLS
-- ============================================

ALTER TABLE public.transaction_syncs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own sync history
CREATE POLICY "transaction_syncs_select_own"
  ON public.transaction_syncs FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create sync records for themselves
CREATE POLICY "transaction_syncs_insert_own"
  ON public.transaction_syncs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own sync records
CREATE POLICY "transaction_syncs_update_own"
  ON public.transaction_syncs FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- TAX REPORT PURCHASES TABLE RLS
-- ============================================

ALTER TABLE public.tax_report_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tax purchases" ON public.tax_report_purchases;

-- SELECT: Users can view their own purchases
CREATE POLICY "tax_report_purchases_select_own"
  ON public.tax_report_purchases FOR SELECT
  USING (user_id = auth.uid());

-- SELECT: Admins can view all purchases
CREATE POLICY "tax_report_purchases_select_admin"
  ON public.tax_report_purchases FOR SELECT
  USING (public.is_admin());

-- INSERT: Users can create purchases for themselves
CREATE POLICY "tax_report_purchases_insert_own"
  ON public.tax_report_purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own purchases (download count, etc.)
CREATE POLICY "tax_report_purchases_update_own"
  ON public.tax_report_purchases FOR UPDATE
  USING (user_id = auth.uid());

-- UPDATE: Admins can update any purchase
CREATE POLICY "tax_report_purchases_update_admin"
  ON public.tax_report_purchases FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- ARTICLES TABLE RLS
-- ============================================

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Authors can view own articles" ON public.articles;
DROP POLICY IF EXISTS "Authors can create articles" ON public.articles;
DROP POLICY IF EXISTS "Authors can update own articles" ON public.articles;

-- SELECT: Anyone can view published articles
CREATE POLICY "articles_select_published"
  ON public.articles FOR SELECT
  USING (status = 'published');

-- SELECT: Authors can view their own articles (any status)
CREATE POLICY "articles_select_own"
  ON public.articles FOR SELECT
  USING (author_id = auth.uid());

-- SELECT: Admins can view all articles
CREATE POLICY "articles_select_admin"
  ON public.articles FOR SELECT
  USING (public.is_admin());

-- INSERT: Authenticated users can create articles (if they have permission)
CREATE POLICY "articles_insert_author"
  ON public.articles FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      -- Regular users can only create drafts
      status = 'draft'
      OR public.is_admin()
    )
  );

-- UPDATE: Authors can update their own articles
CREATE POLICY "articles_update_own"
  ON public.articles FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (
    author_id = auth.uid()
    AND (
      -- Authors can't publish their own articles unless admin
      status = 'draft'
      OR public.is_admin()
    )
  );

-- UPDATE: Admins can update any article (including publish)
CREATE POLICY "articles_update_admin"
  ON public.articles FOR UPDATE
  USING (public.is_admin());

-- DELETE: Super admins can delete articles
CREATE POLICY "articles_delete_super_admin"
  ON public.articles FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- SCAM REPORTS TABLE RLS
-- ============================================

ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can view verified/investigating scam reports
CREATE POLICY "scam_reports_select_public"
  ON public.scam_reports FOR SELECT
  USING (status IN ('verified', 'investigating'));

-- SELECT: Users can view their own reports (any status)
CREATE POLICY "scam_reports_select_own"
  ON public.scam_reports FOR SELECT
  USING (reported_by = auth.uid());

-- SELECT: Admins can view all reports
CREATE POLICY "scam_reports_select_admin"
  ON public.scam_reports FOR SELECT
  USING (public.is_admin());

-- INSERT: Authenticated users can create reports
CREATE POLICY "scam_reports_insert_auth"
  ON public.scam_reports FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (reported_by IS NULL OR reported_by = auth.uid())
  );

-- UPDATE: Users can update their own pending reports
CREATE POLICY "scam_reports_update_own"
  ON public.scam_reports FOR UPDATE
  USING (
    reported_by = auth.uid()
    AND status = 'pending'
  );

-- UPDATE: Admins can update any report
CREATE POLICY "scam_reports_update_admin"
  ON public.scam_reports FOR UPDATE
  USING (public.is_admin());

-- DELETE: Super admins can delete reports
CREATE POLICY "scam_reports_delete_super_admin"
  ON public.scam_reports FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- SCAM REPORT COMMENTS TABLE RLS
-- ============================================

ALTER TABLE public.scam_report_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can view comments on public reports
CREATE POLICY "scam_report_comments_select_public"
  ON public.scam_report_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scam_reports
      WHERE scam_reports.id = scam_report_comments.scam_report_id
      AND scam_reports.status IN ('verified', 'investigating')
    )
  );

-- SELECT: Users can view comments on their own reports
CREATE POLICY "scam_report_comments_select_own"
  ON public.scam_report_comments FOR SELECT
  USING (user_id = auth.uid());

-- SELECT: Admins can view all comments
CREATE POLICY "scam_report_comments_select_admin"
  ON public.scam_report_comments FOR SELECT
  USING (public.is_admin());

-- INSERT: Authenticated users can add comments
CREATE POLICY "scam_report_comments_insert_auth"
  ON public.scam_report_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own comments
CREATE POLICY "scam_report_comments_update_own"
  ON public.scam_report_comments FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can delete their own comments, admins can delete any
CREATE POLICY "scam_report_comments_delete_own"
  ON public.scam_report_comments FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================
-- PLATFORM REVIEWS TABLE RLS
-- ============================================

ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can view approved reviews
CREATE POLICY "platform_reviews_select_approved"
  ON public.platform_reviews FOR SELECT
  USING (status = 'approved');

-- SELECT: Users can view their own reviews
CREATE POLICY "platform_reviews_select_own"
  ON public.platform_reviews FOR SELECT
  USING (user_id = auth.uid());

-- SELECT: Admins can view all reviews
CREATE POLICY "platform_reviews_select_admin"
  ON public.platform_reviews FOR SELECT
  USING (public.is_admin());

-- INSERT: Authenticated users can create reviews
CREATE POLICY "platform_reviews_insert_auth"
  ON public.platform_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own pending reviews
CREATE POLICY "platform_reviews_update_own"
  ON public.platform_reviews FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

-- UPDATE: Admins can moderate reviews
CREATE POLICY "platform_reviews_update_admin"
  ON public.platform_reviews FOR UPDATE
  USING (public.is_admin());

-- DELETE: Users can delete their own reviews
CREATE POLICY "platform_reviews_delete_own"
  ON public.platform_reviews FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- USER SESSIONS TABLE RLS
-- ============================================

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own sessions
CREATE POLICY "user_sessions_select_own"
  ON public.user_sessions FOR SELECT
  USING (user_id = auth.uid());

-- SELECT: Admins can view all sessions
CREATE POLICY "user_sessions_select_admin"
  ON public.user_sessions FOR SELECT
  USING (public.is_admin());

-- INSERT: Users can create sessions for themselves
CREATE POLICY "user_sessions_insert_own"
  ON public.user_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own sessions
CREATE POLICY "user_sessions_update_own"
  ON public.user_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can delete their own sessions
CREATE POLICY "user_sessions_delete_own"
  ON public.user_sessions FOR DELETE
  USING (user_id = auth.uid());

-- DELETE: Admins can delete any session (force logout)
CREATE POLICY "user_sessions_delete_admin"
  ON public.user_sessions FOR DELETE
  USING (public.is_admin());

-- ============================================
-- ADMIN AUDIT LOGS TABLE RLS
-- ============================================

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Only admins can view audit logs
CREATE POLICY "admin_audit_logs_select_admin"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin());

-- INSERT: Only admins can create audit logs
CREATE POLICY "admin_audit_logs_insert_admin"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- No UPDATE or DELETE - audit logs are immutable

-- ============================================
-- ADMIN SETTINGS TABLE RLS
-- ============================================

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins can view settings
CREATE POLICY "admin_settings_select_admin"
  ON public.admin_settings FOR SELECT
  USING (public.is_admin());

-- INSERT: Super admins can create settings
CREATE POLICY "admin_settings_insert_super_admin"
  ON public.admin_settings FOR INSERT
  WITH CHECK (public.is_super_admin());

-- UPDATE: Super admins can update settings
CREATE POLICY "admin_settings_update_super_admin"
  ON public.admin_settings FOR UPDATE
  USING (public.is_super_admin());

-- DELETE: Super admins can delete settings
CREATE POLICY "admin_settings_delete_super_admin"
  ON public.admin_settings FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- AFFILIATE CLICKS TABLE RLS
-- ============================================

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own affiliate clicks
CREATE POLICY "affiliate_clicks_select_own"
  ON public.affiliate_clicks FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- SELECT: Admins can view all clicks
CREATE POLICY "affiliate_clicks_select_admin"
  ON public.affiliate_clicks FOR SELECT
  USING (public.is_admin());

-- INSERT: Anyone can create clicks (tracked anonymously or by user)
CREATE POLICY "affiliate_clicks_insert_any"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- UPDATE: Admins can update clicks (for conversion tracking)
CREATE POLICY "affiliate_clicks_update_admin"
  ON public.affiliate_clicks FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- ADVERTISEMENTS TABLE RLS
-- ============================================

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can view active ads
CREATE POLICY "advertisements_select_active"
  ON public.advertisements FOR SELECT
  USING (status = 'active');

-- SELECT: Admins can view all ads
CREATE POLICY "advertisements_select_admin"
  ON public.advertisements FOR SELECT
  USING (public.is_admin());

-- INSERT/UPDATE/DELETE: Only admins can manage ads
CREATE POLICY "advertisements_manage_admin"
  ON public.advertisements FOR ALL
  USING (public.is_admin());

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE RLS
-- ============================================

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins can view subscribers
CREATE POLICY "newsletter_subscribers_select_admin"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.is_admin());

-- INSERT: Anyone can subscribe
CREATE POLICY "newsletter_subscribers_insert_any"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- UPDATE: Admins can update subscribers
CREATE POLICY "newsletter_subscribers_update_admin"
  ON public.newsletter_subscribers FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- WALLET AUTH NONCES TABLE RLS (Public for wallet auth)
-- ============================================

ALTER TABLE public.wallet_auth_nonces ENABLE ROW LEVEL SECURITY;

-- Wallet auth nonces are handled by service role, no public access needed
-- Keep policies minimal for security

-- ============================================
-- SCAM CATEGORIES TABLE RLS
-- ============================================

ALTER TABLE public.scam_categories ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can view categories
CREATE POLICY "scam_categories_select_any"
  ON public.scam_categories FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "scam_categories_manage_admin"
  ON public.scam_categories FOR ALL
  USING (public.is_admin());

-- ============================================
-- GRANTS
-- ============================================

-- Ensure authenticated users have necessary table access
GRANT SELECT ON public.portfolios TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.portfolios TO authenticated;

GRANT SELECT ON public.holdings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.holdings TO authenticated;

GRANT SELECT ON public.transactions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.transactions TO authenticated;

GRANT SELECT ON public.price_alerts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.price_alerts TO authenticated;

GRANT SELECT ON public.user_wallets TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_wallets TO authenticated;

GRANT SELECT ON public.token_approvals TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.token_approvals TO authenticated;

GRANT SELECT ON public.transaction_syncs TO authenticated;
GRANT INSERT, UPDATE ON public.transaction_syncs TO authenticated;

GRANT SELECT ON public.tax_report_purchases TO authenticated;
GRANT INSERT, UPDATE ON public.tax_report_purchases TO authenticated;

GRANT SELECT ON public.articles TO authenticated;
GRANT INSERT, UPDATE ON public.articles TO authenticated;

GRANT SELECT ON public.scam_reports TO authenticated;
GRANT INSERT, UPDATE ON public.scam_reports TO authenticated;

GRANT SELECT ON public.scam_report_comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.scam_report_comments TO authenticated;

GRANT SELECT ON public.platform_reviews TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_reviews TO authenticated;

GRANT SELECT ON public.user_sessions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;

GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT INSERT ON public.affiliate_clicks TO authenticated;

GRANT SELECT ON public.advertisements TO authenticated;

GRANT INSERT ON public.newsletter_subscribers TO authenticated;

GRANT SELECT ON public.scam_categories TO authenticated;

-- Admin audit logs - SELECT only for admins (handled by RLS)
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;

-- Admin settings - all ops for admins (handled by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user is admin or super_admin';
COMMENT ON FUNCTION public.is_super_admin() IS 'Returns true if current user is super_admin';
COMMENT ON FUNCTION public.owns_portfolio(UUID) IS 'Returns true if current user owns the specified portfolio';
COMMENT ON FUNCTION public.owns_holding(UUID) IS 'Returns true if current user owns the specified holding (via portfolio)';
