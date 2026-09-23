/**
 * Database Service
 *
 * Provides Supabase database operations for persistent storage.
 * Falls back to local storage when Supabase is not configured or user is not authenticated.
 */

import { supabase, db, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../types/database';

type Portfolio = Database['public']['Tables']['portfolios']['Row'];
type Holding = Database['public']['Tables']['holdings']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type AffiliateClick = Database['public']['Tables']['affiliate_clicks']['Row'];
type PriceAlert = Database['public']['Tables']['price_alerts']['Row'];
type TaxReportPurchase = Database['public']['Tables']['tax_report_purchases']['Row'];

// ==================== Portfolio Operations ====================

/**
 * Get all portfolios for a user
 */
export async function getUserPortfolios(userId: string): Promise<Portfolio[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new portfolio
 */
export async function createDbPortfolio(
  userId: string,
  name: string,
  isDefault: boolean = false
): Promise<Portfolio | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('portfolios')
    .insert({
      user_id: userId,
      name,
      is_default: isDefault,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating portfolio:', error);
    return null;
  }

  return data;
}

/**
 * Delete a portfolio
 */
export async function deleteDbPortfolio(portfolioId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('portfolios')
    .delete()
    .eq('id', portfolioId);

  if (error) {
    console.error('Error deleting portfolio:', error);
    return false;
  }

  return true;
}

// ==================== Holdings Operations ====================

/**
 * Get holdings for a portfolio
 */
export async function getPortfolioHoldings(portfolioId: string): Promise<Holding[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching holdings:', error);
    return [];
  }

  return data || [];
}

/**
 * Add or update a holding
 */
export async function upsertHolding(
  holding: Omit<Holding, 'id' | 'created_at' | 'updated_at'>
): Promise<Holding | null> {
  if (!isSupabaseConfigured()) return null;

  // Check if holding exists
  const { data: existing } = await supabase
    .from('holdings')
    .select('id')
    .eq('portfolio_id', holding.portfolio_id)
    .eq('cryptocurrency_id', holding.cryptocurrency_id)
    .maybeSingle(); // Use maybeSingle() to avoid 406 errors

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('holdings')
      .update({
        amount: holding.amount,
        average_buy_price: holding.average_buy_price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating holding:', error);
      return null;
    }

    return data;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('holdings')
      .insert(holding)
      .select()
      .single();

    if (error) {
      console.error('Error creating holding:', error);
      return null;
    }

    return data;
  }
}

/**
 * Delete a holding
 */
export async function deleteHolding(holdingId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', holdingId);

  if (error) {
    console.error('Error deleting holding:', error);
    return false;
  }

  return true;
}

// ==================== Transaction Operations ====================

/**
 * Get transactions for a holding
 */
export async function getHoldingTransactions(holdingId: string): Promise<Transaction[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('holding_id', holdingId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a transaction
 */
export async function addTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at'>
): Promise<Transaction | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }

  return data;
}

// ==================== Affiliate Click Operations ====================

/**
 * Track an affiliate click
 */
export async function trackAffiliateClickDb(
  click: Omit<AffiliateClick, 'id' | 'clicked_at' | 'converted' | 'conversion_value'>
): Promise<AffiliateClick | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('affiliate_clicks')
    .insert({
      ...click,
      converted: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error tracking affiliate click:', error);
    return null;
  }

  return data;
}

/**
 * Mark a click as converted
 */
export async function markClickConvertedDb(
  clickId: string,
  conversionValue?: number
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('affiliate_clicks')
    .update({
      converted: true,
      conversion_value: conversionValue,
    })
    .eq('id', clickId);

  if (error) {
    console.error('Error marking click as converted:', error);
    return false;
  }

  return true;
}

/**
 * Get affiliate statistics
 */
export async function getAffiliateStatsDb(startDate?: string, endDate?: string) {
  if (!isSupabaseConfigured()) return null;

  let query = supabase
    .from('affiliate_clicks')
    .select('*');

  if (startDate) {
    query = query.gte('clicked_at', startDate);
  }
  if (endDate) {
    query = query.lte('clicked_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching affiliate stats:', error);
    return null;
  }

  const clicks = data || [];
  const totalClicks = clicks.length;
  const conversions = clicks.filter(c => c.converted);
  const totalConversions = conversions.length;
  const totalRevenue = conversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0);

  return {
    totalClicks,
    totalConversions,
    conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    totalRevenue,
  };
}

// ==================== Price Alert Operations ====================

/**
 * Get user's price alerts
 */
export async function getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching price alerts:', error);
    return [];
  }

  return data || [];
}

/**
 * Count user's active price alerts
 */
export async function countActiveAlerts(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const { count, error } = await supabase
    .from('price_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error counting active alerts:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Create a price alert
 */
export async function createPriceAlert(
  alert: Omit<PriceAlert, 'id' | 'created_at' | 'is_active' | 'triggered_at'>
): Promise<PriceAlert | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('price_alerts')
    .insert({
      ...alert,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating price alert:', error);
    return null;
  }

  return data;
}

/**
 * Delete a price alert
 */
export async function deletePriceAlert(alertId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId);

  if (error) {
    console.error('Error deleting price alert:', error);
    return false;
  }

  return true;
}

// ==================== Newsletter Operations ====================

export type NewsletterSubscribeResult =
  | { success: true }
  | {
      success: false;
      /**
       * already_subscribed - the address is already on the list (or unsubscribed earlier)
       * unavailable        - Supabase is not configured in this build
       * invalid_email      - the address failed basic validation
       * failed             - anything else; details are logged, not shown
       */
      code: 'already_subscribed' | 'unavailable' | 'invalid_email' | 'failed';
      error: string;
    };

/** True when this build can store newsletter sign-ups at all. */
export function isNewsletterAvailable(): boolean {
  return isSupabaseConfigured();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Subscribe to newsletter.
 *
 * Anonymous visitors may INSERT into newsletter_subscribers but not SELECT from
 * it (RLS, 20260128000000_comprehensive_rls_security.sql), so there is no
 * "already subscribed?" pre-check: we insert once and treat the unique-email
 * violation (Postgres 23505) as "already on the list". That also means an
 * address that unsubscribed earlier is not silently re-subscribed by whoever
 * types it in; the message tells them how to rejoin.
 */
export async function subscribeToNewsletter(
  rawEmail: string,
  source?: string
): Promise<NewsletterSubscribeResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      code: 'unavailable',
      error: 'Newsletter sign-up is temporarily unavailable.',
    };
  }

  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { success: false, code: 'invalid_email', error: 'Please enter a valid email address.' };
  }

  const { error } = await supabase.from('newsletter_subscribers').insert({
    email,
    source,
    is_active: true,
  });

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        code: 'already_subscribed',
        error: "You're already on the list with that address.",
      };
    }
    console.error('Newsletter subscribe failed:', error);
    return {
      success: false,
      code: 'failed',
      error: "We couldn't sign you up just now. Please try again later.",
    };
  }

  // Welcome email: fixed template, server-side (see functions/api/newsletter-welcome.ts).
  // Fire and forget - a failed welcome mail doesn't undo the subscription.
  import('./email').then(({ sendNewsletterWelcomeEmail }) => {
    sendNewsletterWelcomeEmail(email).catch(err =>
      console.error('Failed to send welcome email:', err)
    );
  });

  return { success: true };
}

/**
 * Unsubscribe from newsletter using the per-subscriber token from the email
 * footer link. Calls the SECURITY DEFINER function added in
 * supabase/migrations/20260923000400_newsletter_unsubscribe.sql, which only
 * matches when both the email and the token agree, and is idempotent.
 *
 * `code: 'not_deployed'` means the database function does not exist yet, so the
 * caller can fall back to "reply to any email" instructions.
 */
export async function unsubscribeFromNewsletter(
  rawEmail: string,
  token: string
): Promise<{ success: boolean; code?: 'unavailable' | 'invalid_link' | 'not_deployed' | 'failed' }> {
  if (!isSupabaseConfigured()) {
    return { success: false, code: 'unavailable' };
  }

  const email = rawEmail.trim().toLowerCase();
  const tokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!email || !tokenPattern.test(token.trim())) {
    return { success: false, code: 'invalid_link' };
  }

  const { data, error } = await db.rpc('unsubscribe_newsletter', {
    p_email: email,
    p_token: token.trim(),
  });

  if (error) {
    // PGRST202: function not found in the schema cache (migration not applied).
    if (error.code === 'PGRST202' || error.code === '42883') {
      return { success: false, code: 'not_deployed' };
    }
    console.error('Newsletter unsubscribe failed:', error);
    return { success: false, code: 'failed' };
  }

  return data === true ? { success: true } : { success: false, code: 'invalid_link' };
}

// ==================== Article Operations ====================

/**
 * Get published articles
 */
export async function getPublishedArticles(
  category?: string,
  limit: number = 10,
  offset: number = 0
) {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return data || [];
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching article:', error);
    return null;
  }

  // Increment view count
  if (data) {
    await supabase
      .from('articles')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);
  }

  return data;
}

// ==================== Advertisement Operations ====================

/**
 * Get active advertisements for a zone
 */
export async function getActiveAds(zone: 'banner' | 'sidebar' | 'native' | 'popup') {
  if (!isSupabaseConfigured()) return [];

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('ad_zone', zone)
    .eq('status', 'active')
    .lte('start_date', now)
    .gte('end_date', now);

  if (error) {
    console.error('Error fetching ads:', error);
    return [];
  }

  return data || [];
}

/**
 * Track ad impression
 */
export async function trackAdImpression(adId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await supabase.rpc('increment_ad_impressions', { ad_id: adId });
}

/**
 * Track ad click
 */
export async function trackAdClick(adId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await supabase.rpc('increment_ad_clicks', { ad_id: adId });
}

// ==================== Tax Report Purchase Operations ====================

/**
 * Check if user has purchased tax report for a given year
 */
export async function hasTaxReportPurchase(
  userId: string,
  taxYear: number
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { data, error } = await supabase.rpc('has_tax_report_purchase', {
    p_user_id: userId,
    p_tax_year: taxYear,
  });

  if (error) {
    console.error('Error checking tax report purchase:', error);
    return false;
  }

  return data || false;
}

/**
 * Get user's tax report package type for a year
 */
export async function getTaxReportPackageType(
  userId: string,
  taxYear: number
): Promise<'basic' | 'premium' | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase.rpc('get_tax_report_package_type', {
    p_user_id: userId,
    p_tax_year: taxYear,
  });

  if (error) {
    console.error('Error getting tax report package type:', error);
    return null;
  }

  return data as 'basic' | 'premium' | null;
}

/**
 * Get user's tax report purchases
 */
export async function getUserTaxReportPurchases(
  userId: string
): Promise<TaxReportPurchase[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('tax_report_purchases')
    .select('*')
    .eq('user_id', userId)
    .order('tax_year', { ascending: false });

  if (error) {
    console.error('Error fetching tax report purchases:', error);
    return [];
  }

  return data || [];
}

/**
 * Increment tax report download count
 */
export async function incrementTaxReportDownload(
  purchaseId: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await supabase.rpc('increment_tax_report_download', {
    p_purchase_id: purchaseId,
  });
}
