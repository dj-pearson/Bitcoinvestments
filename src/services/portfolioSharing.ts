import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getPortfolioSummary, type PortfolioSummary } from './multiPortfolio';

/**
 * Portfolio Sharing Service
 *
 * Allows users to share their portfolios via public links.
 *
 * Features:
 * - Generate shareable links
 * - Privacy controls (hide amounts, show only percentages)
 * - Share link expiration
 * - View tracking
 * - Embed widgets
 */

export interface SharedPortfolio {
  id: string;
  portfolio_id: string;
  user_id: string;
  share_code: string;
  share_url: string;

  // Privacy settings
  show_amounts: boolean;
  show_cost_basis: boolean;
  show_profit_loss: boolean;
  show_transactions: boolean;

  // Share settings
  is_active: boolean;
  expires_at?: string;
  password_hash?: string;

  // Tracking
  view_count: number;
  last_viewed_at?: string;

  // Metadata
  title?: string;
  description?: string;

  created_at: string;
  updated_at: string;
}

export interface CreateShareParams {
  portfolioId: string;
  userId: string;
  showAmounts?: boolean;
  showCostBasis?: boolean;
  showProfitLoss?: boolean;
  showTransactions?: boolean;
  expiresInDays?: number;
  password?: string;
  title?: string;
  description?: string;
}

export interface PublicPortfolioView {
  shareInfo: {
    title: string;
    description?: string;
    createdAt: string;
    viewCount: number;
  };
  summary: {
    totalValue?: number;
    totalProfitLoss?: number;
    totalProfitLossPercentage?: number;
    holdingsCount: number;
  };
  holdings: PublicHolding[];
  allocation: AllocationItem[];
}

export interface PublicHolding {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage?: string;
  percentage: number;
  quantity?: number;
  value?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}

export interface AllocationItem {
  name: string;
  symbol: string;
  percentage: number;
  color: string;
}

// Predefined colors for allocation chart
const ALLOCATION_COLORS = [
  '#f97316', // orange
  '#3b82f6', // blue
  '#22c55e', // green
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#ef4444', // red
  '#84cc16', // lime
];

/**
 * Generate a unique share code
 */
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Hash a password using Web Crypto API
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

/**
 * Create a shareable link for a portfolio
 */
export async function createPortfolioShare(
  params: CreateShareParams
): Promise<{ share: SharedPortfolio | null; error: string | null }> {
  const {
    portfolioId,
    userId,
    showAmounts = false,
    showCostBasis = false,
    showProfitLoss = true,
    showTransactions = false,
    expiresInDays,
    password,
    title,
    description,
  } = params;

  try {
    const shareCode = generateShareCode();
    const shareUrl = `/portfolio/share/${shareCode}`;

    const share: SharedPortfolio = {
      id: crypto.randomUUID(),
      portfolio_id: portfolioId,
      user_id: userId,
      share_code: shareCode,
      share_url: shareUrl,
      show_amounts: showAmounts,
      show_cost_basis: showCostBasis,
      show_profit_loss: showProfitLoss,
      show_transactions: showTransactions,
      is_active: true,
      expires_at: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      password_hash: password ? await hashPassword(password) : undefined,
      view_count: 0,
      title,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('portfolio_shares').insert(share);

      if (error && error.code !== '42P01') {
        throw error;
      }
    }

    return { share, error: null };
  } catch (error) {
    console.error('Error creating portfolio share:', error);
    return {
      share: null,
      error: error instanceof Error ? error.message : 'Failed to create share',
    };
  }
}

/**
 * Get share settings for a portfolio
 */
export async function getPortfolioShare(
  portfolioId: string
): Promise<{ share: SharedPortfolio | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { share: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('portfolio_shares')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return { share: null, error: null };
      }
      throw error;
    }

    return { share: data, error: null };
  } catch (error) {
    console.error('Error fetching portfolio share:', error);
    return {
      share: null,
      error: error instanceof Error ? error.message : 'Failed to fetch share',
    };
  }
}

/**
 * Update share settings
 */
export async function updatePortfolioShare(
  shareId: string,
  updates: Partial<CreateShareParams>
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.showAmounts !== undefined) updateData.show_amounts = updates.showAmounts;
    if (updates.showCostBasis !== undefined) updateData.show_cost_basis = updates.showCostBasis;
    if (updates.showProfitLoss !== undefined) updateData.show_profit_loss = updates.showProfitLoss;
    if (updates.showTransactions !== undefined) updateData.show_transactions = updates.showTransactions;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.password) updateData.password_hash = await hashPassword(updates.password);
    if (updates.expiresInDays) {
      updateData.expires_at = new Date(Date.now() + updates.expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error } = await supabase
      .from('portfolio_shares')
      .update(updateData)
      .eq('id', shareId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating portfolio share:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update share',
    };
  }
}

/**
 * Delete/deactivate a portfolio share
 */
export async function deletePortfolioShare(
  shareId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('portfolio_shares')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shareId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting portfolio share:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete share',
    };
  }
}

/**
 * Get public portfolio view by share code
 */
export async function getPublicPortfolio(
  shareCode: string,
  password?: string
): Promise<{ portfolio: PublicPortfolioView | null; requiresPassword: boolean; error: string | null }> {
  try {
    let share: SharedPortfolio | null = null;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('portfolio_shares')
        .select('*')
        .eq('share_code', shareCode)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { portfolio: null, requiresPassword: false, error: 'Portfolio not found' };
        }
        throw error;
      }

      share = data;
    } else {
      // Demo data for testing
      share = getDemoShare(shareCode);
    }

    if (!share) {
      return { portfolio: null, requiresPassword: false, error: 'Portfolio not found' };
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return { portfolio: null, requiresPassword: false, error: 'This share link has expired' };
    }

    // Check password
    if (share.password_hash) {
      if (!password) {
        return { portfolio: null, requiresPassword: true, error: null };
      }
      const isValid = await verifyPassword(password, share.password_hash);
      if (!isValid) {
        return { portfolio: null, requiresPassword: true, error: 'Incorrect password' };
      }
    }

    // Get portfolio data
    const { summary, error: summaryError } = await getPortfolioSummary(share.portfolio_id);

    if (summaryError || !summary) {
      return { portfolio: null, requiresPassword: false, error: summaryError || 'Portfolio not found' };
    }

    // Increment view count
    if (isSupabaseConfigured()) {
      await supabase
        .from('portfolio_shares')
        .update({
          view_count: share.view_count + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', share.id);
    }

    // Build public view based on privacy settings
    const publicView = buildPublicView(share, summary);

    return { portfolio: publicView, requiresPassword: false, error: null };
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    return {
      portfolio: null,
      requiresPassword: false,
      error: error instanceof Error ? error.message : 'Failed to fetch portfolio',
    };
  }
}

/**
 * Build public view based on privacy settings
 */
function buildPublicView(share: SharedPortfolio, summary: PortfolioSummary): PublicPortfolioView {
  const totalValue = summary.total_value;

  const holdings: PublicHolding[] = summary.top_holdings.map((holding) => ({
    coinId: holding.coin_id,
    coinName: holding.coin_name,
    coinSymbol: holding.coin_symbol,
    coinImage: holding.coin_image,
    percentage: totalValue > 0 ? ((holding.current_value || 0) / totalValue) * 100 : 0,
    quantity: share.show_amounts ? holding.quantity : undefined,
    value: share.show_amounts ? holding.current_value : undefined,
    profitLoss: share.show_profit_loss ? holding.profit_loss : undefined,
    profitLossPercentage: share.show_profit_loss ? holding.profit_loss_percentage : undefined,
  }));

  const allocation: AllocationItem[] = holdings.map((holding, index) => ({
    name: holding.coinName,
    symbol: holding.coinSymbol,
    percentage: holding.percentage,
    color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
  }));

  return {
    shareInfo: {
      title: share.title || summary.portfolio.name,
      description: share.description,
      createdAt: share.created_at,
      viewCount: share.view_count,
    },
    summary: {
      totalValue: share.show_amounts ? summary.total_value : undefined,
      totalProfitLoss: share.show_profit_loss && share.show_amounts ? summary.total_profit_loss : undefined,
      totalProfitLossPercentage: share.show_profit_loss ? summary.total_profit_loss_percentage : undefined,
      holdingsCount: summary.holdings_count,
    },
    holdings,
    allocation,
  };
}

/**
 * Generate embed code for portfolio widget
 */
export function generateEmbedCode(shareCode: string, options: {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
} = {}): string {
  const { width = 400, height = 300, theme = 'dark' } = options;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bitcoinvestments.com';

  return `<iframe
  src="${baseUrl}/embed/portfolio/${shareCode}?theme=${theme}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border-radius: 12px; overflow: hidden;"
  title="Portfolio Widget"
></iframe>`;
}

/**
 * Get share statistics
 */
export async function getShareStats(
  userId: string
): Promise<{
  stats: { totalShares: number; totalViews: number; activeShares: number } | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { stats: { totalShares: 0, totalViews: 0, activeShares: 0 }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('portfolio_shares')
      .select('is_active, view_count')
      .eq('user_id', userId);

    if (error) {
      if (error.code === '42P01') {
        return { stats: { totalShares: 0, totalViews: 0, activeShares: 0 }, error: null };
      }
      throw error;
    }

    const shares = data || [];
    const stats = {
      totalShares: shares.length,
      totalViews: shares.reduce((sum, s) => sum + (s.view_count || 0), 0),
      activeShares: shares.filter((s) => s.is_active).length,
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error fetching share stats:', error);
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}

/**
 * Demo share for testing
 */
function getDemoShare(shareCode: string): SharedPortfolio | null {
  if (shareCode === 'demo123abc') {
    return {
      id: 'demo-share',
      portfolio_id: 'demo-1',
      user_id: 'demo-user',
      share_code: shareCode,
      share_url: `/portfolio/share/${shareCode}`,
      show_amounts: false,
      show_cost_basis: false,
      show_profit_loss: true,
      show_transactions: false,
      is_active: true,
      view_count: 42,
      title: 'My Crypto Portfolio',
      description: 'Long-term hodl portfolio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return null;
}
