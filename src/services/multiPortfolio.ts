import { isSupabaseConfigured, db } from '../lib/supabase';

/**
 * Multi-Portfolio Support Service
 *
 * Allows users to manage multiple portfolios for different strategies or accounts.
 *
 * Features:
 * - Create, update, delete portfolios
 * - Set active/default portfolio
 * - Portfolio-specific holdings and transactions
 * - Portfolio performance comparison
 */

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_default: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioHolding {
  id: string;
  portfolio_id: string;
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  coin_image?: string;
  quantity: number;
  average_cost: number;
  current_price?: number;
  current_value?: number;
  profit_loss?: number;
  profit_loss_percentage?: number;
  last_updated: string;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  total_value: number;
  total_cost: number;
  total_profit_loss: number;
  total_profit_loss_percentage: number;
  holdings_count: number;
  top_holdings: PortfolioHolding[];
}

export interface CreatePortfolioParams {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_default?: boolean;
}

// Default portfolio colors
export const PORTFOLIO_COLORS = [
  '#f97316', // orange
  '#3b82f6', // blue
  '#22c55e', // green
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#6366f1', // indigo
];

// Default portfolio icons
export const PORTFOLIO_ICONS = [
  'wallet',
  'briefcase',
  'piggy-bank',
  'trending-up',
  'target',
  'shield',
  'star',
  'zap',
];

/**
 * Get all portfolios for a user
 */
export async function getUserPortfolios(
  userId: string
): Promise<{ portfolios: Portfolio[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    // Return demo portfolios
    return { portfolios: getDemoPortfolios(userId), error: null };
  }

  try {
    const { data, error } = await db
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return { portfolios: getDemoPortfolios(userId), error: null };
      }
      throw error;
    }

    return { portfolios: data || [], error: null };
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return {
      portfolios: [],
      error: error instanceof Error ? error.message : 'Failed to fetch portfolios',
    };
  }
}

/**
 * Get a single portfolio by ID
 */
export async function getPortfolio(
  portfolioId: string
): Promise<{ portfolio: Portfolio | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { portfolio: null, error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (error) throw error;

    return { portfolio: data, error: null };
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return {
      portfolio: null,
      error: error instanceof Error ? error.message : 'Failed to fetch portfolio',
    };
  }
}

/**
 * Create a new portfolio
 */
export async function createPortfolio(
  userId: string,
  params: CreatePortfolioParams
): Promise<{ portfolio: Portfolio | null; error: string | null }> {
  const { name, description, color, icon, is_default } = params;

  try {
    const portfolio: Omit<Portfolio, 'created_at' | 'updated_at'> = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: name.trim(),
      description: description?.trim(),
      color: color || PORTFOLIO_COLORS[Math.floor(Math.random() * PORTFOLIO_COLORS.length)],
      icon: icon || 'wallet',
      is_default: is_default || false,
      is_public: false,
    };

    if (isSupabaseConfigured()) {
      // If setting as default, unset other defaults first
      if (is_default) {
        await db
          .from('portfolios')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await db
        .from('portfolios')
        .insert({
          ...portfolio,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { portfolio: data, error: null };
    }

    return {
      portfolio: {
        ...portfolio,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return {
      portfolio: null,
      error: error instanceof Error ? error.message : 'Failed to create portfolio',
    };
  }
}

/**
 * Update a portfolio
 */
export async function updatePortfolio(
  portfolioId: string,
  updates: Partial<CreatePortfolioParams>
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    const { error } = await db
      .from('portfolios')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', portfolioId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update portfolio',
    };
  }
}

/**
 * Delete a portfolio
 */
export async function deletePortfolio(
  portfolioId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    // Check if this is the default portfolio
    const { data: portfolio } = await db
      .from('portfolios')
      .select('is_default, user_id')
      .eq('id', portfolioId)
      .single();

    if (portfolio?.is_default) {
      return {
        success: false,
        error: 'Cannot delete the default portfolio. Set another portfolio as default first.',
      };
    }

    const { error } = await db.from('portfolios').delete().eq('id', portfolioId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete portfolio',
    };
  }
}

/**
 * Set a portfolio as the default
 */
export async function setDefaultPortfolio(
  userId: string,
  portfolioId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    // Unset current default
    await db
      .from('portfolios')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Set new default
    const { error } = await db
      .from('portfolios')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', portfolioId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error setting default portfolio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set default portfolio',
    };
  }
}

/**
 * Get portfolio holdings
 */
export async function getPortfolioHoldings(
  portfolioId: string
): Promise<{ holdings: PortfolioHolding[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { holdings: getDemoHoldings(portfolioId), error: null };
  }

  try {
    const { data, error } = await db
      .from('portfolio_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('current_value', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return { holdings: getDemoHoldings(portfolioId), error: null };
      }
      throw error;
    }

    return { holdings: (data as PortfolioHolding[]) || [], error: null };
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return {
      holdings: [],
      error: error instanceof Error ? error.message : 'Failed to fetch holdings',
    };
  }
}

/**
 * Get portfolio summary with holdings
 */
export async function getPortfolioSummary(
  portfolioId: string
): Promise<{ summary: PortfolioSummary | null; error: string | null }> {
  try {
    const [portfolioResult, holdingsResult] = await Promise.all([
      getPortfolio(portfolioId),
      getPortfolioHoldings(portfolioId),
    ]);

    if (portfolioResult.error || !portfolioResult.portfolio) {
      return { summary: null, error: portfolioResult.error || 'Portfolio not found' };
    }

    if (holdingsResult.error) {
      return { summary: null, error: holdingsResult.error };
    }

    const holdings = holdingsResult.holdings;
    const total_value = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    const total_cost = holdings.reduce((sum, h) => sum + h.quantity * h.average_cost, 0);
    const total_profit_loss = total_value - total_cost;
    const total_profit_loss_percentage = total_cost > 0 ? (total_profit_loss / total_cost) * 100 : 0;

    return {
      summary: {
        portfolio: portfolioResult.portfolio,
        total_value,
        total_cost,
        total_profit_loss,
        total_profit_loss_percentage,
        holdings_count: holdings.length,
        top_holdings: holdings.slice(0, 5),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return {
      summary: null,
      error: error instanceof Error ? error.message : 'Failed to fetch summary',
    };
  }
}

/**
 * Compare multiple portfolios
 */
export async function comparePortfolios(
  portfolioIds: string[]
): Promise<{ summaries: PortfolioSummary[]; error: string | null }> {
  try {
    const results = await Promise.all(portfolioIds.map((id) => getPortfolioSummary(id)));

    const summaries: PortfolioSummary[] = [];
    for (const result of results) {
      if (result.summary) {
        summaries.push(result.summary);
      }
    }

    return { summaries, error: null };
  } catch (error) {
    console.error('Error comparing portfolios:', error);
    return {
      summaries: [],
      error: error instanceof Error ? error.message : 'Failed to compare portfolios',
    };
  }
}

/**
 * Demo portfolios for testing
 */
function getDemoPortfolios(userId: string): Portfolio[] {
  return [
    {
      id: 'demo-1',
      user_id: userId,
      name: 'Main Portfolio',
      description: 'My primary long-term holdings',
      color: '#f97316',
      icon: 'wallet',
      is_default: true,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      user_id: userId,
      name: 'Trading',
      description: 'Active trading positions',
      color: '#3b82f6',
      icon: 'trending-up',
      is_default: false,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      user_id: userId,
      name: 'DeFi',
      description: 'DeFi positions and yield farming',
      color: '#8b5cf6',
      icon: 'zap',
      is_default: false,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

/**
 * Demo holdings for testing
 */
function getDemoHoldings(portfolioId: string): PortfolioHolding[] {
  if (portfolioId === 'demo-1') {
    return [
      {
        id: 'h1',
        portfolio_id: portfolioId,
        coin_id: 'bitcoin',
        coin_name: 'Bitcoin',
        coin_symbol: 'BTC',
        quantity: 0.5,
        average_cost: 35000,
        current_price: 42000,
        current_value: 21000,
        profit_loss: 3500,
        profit_loss_percentage: 20,
        last_updated: new Date().toISOString(),
      },
      {
        id: 'h2',
        portfolio_id: portfolioId,
        coin_id: 'ethereum',
        coin_name: 'Ethereum',
        coin_symbol: 'ETH',
        quantity: 5,
        average_cost: 2000,
        current_price: 2200,
        current_value: 11000,
        profit_loss: 1000,
        profit_loss_percentage: 10,
        last_updated: new Date().toISOString(),
      },
    ];
  }
  return [];
}
