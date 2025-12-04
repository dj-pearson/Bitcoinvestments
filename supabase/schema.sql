-- Bitcoin Investments Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENUMS ====================

CREATE TYPE subscription_status AS ENUM ('free', 'premium');
CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'transfer_in', 'transfer_out', 'staking_reward');
CREATE TYPE alert_condition AS ENUM ('above', 'below');
CREATE TYPE platform_type AS ENUM ('exchange', 'wallet', 'tax_software', 'course');
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE ad_zone AS ENUM ('banner', 'sidebar', 'native', 'popup');
CREATE TYPE ad_status AS ENUM ('active', 'paused', 'ended');

-- ==================== TABLES ====================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_status subscription_status DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}'::jsonb,
    referral_code TEXT UNIQUE,
    referred_by TEXT REFERENCES public.users(referral_code)
);

-- Portfolios
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_default BOOLEAN DEFAULT false
);

-- Holdings
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    cryptocurrency_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(20, 10) NOT NULL DEFAULT 0,
    average_buy_price DECIMAL(20, 10) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, cryptocurrency_id)
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holding_id UUID NOT NULL REFERENCES public.holdings(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(20, 10) NOT NULL,
    price_per_unit DECIMAL(20, 10) NOT NULL,
    total_value DECIMAL(20, 10) NOT NULL,
    fee DECIMAL(20, 10),
    date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    exchange TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price Alerts
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cryptocurrency_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    target_price DECIMAL(20, 10) NOT NULL,
    condition alert_condition NOT NULL,
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Clicks
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    affiliate_id TEXT NOT NULL,
    platform_type platform_type NOT NULL,
    platform_name TEXT NOT NULL,
    source_page TEXT NOT NULL,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10, 2)
);

-- Articles
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    featured_image TEXT,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status article_status DEFAULT 'draft',
    seo_title TEXT,
    seo_description TEXT,
    read_time_minutes INTEGER DEFAULT 5,
    view_count INTEGER DEFAULT 0
);

-- Advertisements
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name TEXT NOT NULL,
    advertiser_id TEXT NOT NULL,
    ad_zone ad_zone NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    cta_text TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    status ad_status DEFAULT 'active',
    targeting JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    source TEXT
);

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_holding_id ON public.transactions(holding_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON public.price_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_advertisements_zone ON public.advertisements(ad_zone);
CREATE INDEX IF NOT EXISTS idx_advertisements_status ON public.advertisements(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);

-- ==================== FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment ad impressions
CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.advertisements
    SET impressions = impressions + 1
    WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment ad clicks
CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.advertisements
    SET clicks = clicks + 1
    WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        code := upper(substr(md5(random()::text), 1, 8));
        SELECT COUNT(*) INTO exists_count FROM public.users WHERE referral_code = code;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS ====================

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at
    BEFORE UPDATE ON public.holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Portfolios policies
CREATE POLICY "Users can view own portfolios" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolios" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Holdings policies
CREATE POLICY "Users can view own holdings" ON public.holdings
    FOR SELECT USING (
        portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage own holdings" ON public.holdings
    FOR ALL USING (
        portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid())
    );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (
        holding_id IN (
            SELECT h.id FROM public.holdings h
            JOIN public.portfolios p ON h.portfolio_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (
        holding_id IN (
            SELECT h.id FROM public.holdings h
            JOIN public.portfolios p ON h.portfolio_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- Price alerts policies
CREATE POLICY "Users can view own alerts" ON public.price_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts" ON public.price_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Affiliate clicks - anyone can insert, only admins can view all
CREATE POLICY "Anyone can track clicks" ON public.affiliate_clicks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own clicks" ON public.affiliate_clicks
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Articles - public can view published
CREATE POLICY "Anyone can view published articles" ON public.articles
    FOR SELECT USING (status = 'published');

-- Advertisements - public can view active ads
CREATE POLICY "Anyone can view active ads" ON public.advertisements
    FOR SELECT USING (status = 'active');

-- Newsletter - anyone can subscribe
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own subscription" ON public.newsletter_subscribers
    FOR ALL USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ==================== INITIAL DATA ====================

-- Add any seed data here if needed
