-- Tax Report Purchases Migration
-- Tracks one-time tax season package purchases

-- Create tax_report_purchases table
CREATE TABLE IF NOT EXISTS public.tax_report_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Package details
    package_type TEXT NOT NULL CHECK (package_type IN ('basic', 'premium')),
    tax_year INTEGER NOT NULL,
    price_paid DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',

    -- Stripe payment info
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_checkout_session_id TEXT,

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    purchased_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,

    -- Report generation tracking
    report_generated_at TIMESTAMPTZ,
    report_download_count INTEGER DEFAULT 0,
    last_download_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_tax_report_purchases_user_id ON public.tax_report_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_report_purchases_tax_year ON public.tax_report_purchases(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_report_purchases_status ON public.tax_report_purchases(status);
CREATE INDEX IF NOT EXISTS idx_tax_report_purchases_stripe_payment ON public.tax_report_purchases(stripe_payment_intent_id);

-- Update trigger for updated_at
CREATE TRIGGER update_tax_report_purchases_updated_at
    BEFORE UPDATE ON public.tax_report_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.tax_report_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own tax purchases" ON public.tax_report_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Only system/webhook can insert (via service role)
CREATE POLICY "System can manage tax purchases" ON public.tax_report_purchases
    FOR ALL USING (true)
    WITH CHECK (true);

-- Function to check if user has purchased tax report for a given year
CREATE OR REPLACE FUNCTION has_tax_report_purchase(p_user_id UUID, p_tax_year INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tax_report_purchases
        WHERE user_id = p_user_id
        AND tax_year = p_tax_year
        AND status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's tax report package type for a year
CREATE OR REPLACE FUNCTION get_tax_report_package_type(p_user_id UUID, p_tax_year INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_package_type TEXT;
BEGIN
    SELECT package_type INTO v_package_type
    FROM public.tax_report_purchases
    WHERE user_id = p_user_id
    AND tax_year = p_tax_year
    AND status = 'completed'
    ORDER BY purchased_at DESC
    LIMIT 1;

    RETURN v_package_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_tax_report_download(p_purchase_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.tax_report_purchases
    SET
        report_download_count = report_download_count + 1,
        last_download_at = NOW()
    WHERE id = p_purchase_id;
END;
$$ LANGUAGE plpgsql;
