/**
 * Database Service
 *
 * Provides Supabase database operations for persistent storage.
 * Falls back to local storage when Supabase is not configured or user is not authenticated.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../types/database';

type Portfolio = Database['public']['Tables']['portfolios']['Row'];
type Holding = Database['public']['Tables']['holdings']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type AffiliateClick = Database['public']['Tables']['affiliate_clicks']['Row'];
type PriceAlert = Database['public']['Tables']['price_alerts']['Row'];

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
    .single();

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

/**
 * Subscribe to newsletter
 */
export async function subscribeToNewsletter(
  email: string,
  source?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Newsletter subscription is not configured' };
  }

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, is_active')
    .eq('email', email)
    .single();

  if (existing) {
    if (existing.is_active) {
      return { success: false, error: 'Email is already subscribed' };
    }

    // Reactivate subscription
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        is_active: true,
        unsubscribed_at: null,
      })
      .eq('id', existing.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Send welcome email for reactivated subscriber
    // Import dynamically to avoid circular dependencies
    import('./email').then(({ sendNewsletterWelcomeEmail }) => {
      sendNewsletterWelcomeEmail(email).catch(err =>
        console.error('Failed to send welcome email:', err)
      );
    });

    return { success: true };
  }

  // Create new subscription
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email,
      source,
      is_active: true,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  // Send welcome email (don't await - fire and forget)
  // Import dynamically to avoid circular dependencies
  import('./email').then(({ sendNewsletterWelcomeEmail }) => {
    sendNewsletterWelcomeEmail(email).catch(err =>
      console.error('Failed to send welcome email:', err)
    );
  });

  return { success: true };
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Newsletter subscription is not configured' };
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      is_active: false,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('email', email);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
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
