/**
 * Social Trading / Copy Portfolio Service
 *
 * Users can publish their portfolios, others can copy allocation for $9.99/month.
 * Original users earn 20% of subscription. Creates content and retention.
 */

import { supabase } from '../lib/supabase';
import type {
  PublishedPortfolio,
  PortfolioFollower,
  CopyTradingSubscription,
  CopyTradeExecution,
  PublishedPortfolioHistory,
  CreatorEarnings,
  SocialTradingLeaderboard,
  TradingStyle,
  RiskLevel,
  CopyMode,
} from '../types/monetization';

// ============================================
// PRICING & CONFIG
// ============================================

export const SOCIAL_TRADING_CONFIG = {
  default_subscription_price: 9.99,
  creator_share_percent: 20,
  platform_share_percent: 80,
  min_copy_amount: 100,
  default_delay_hours: 24,
  max_copiers_free: 0, // Free portfolios can't be copied (only followed)
};

// ============================================
// PUBLISHED PORTFOLIO MANAGEMENT
// ============================================

/**
 * Get all active published portfolios
 */
export async function getPublishedPortfolios(options?: {
  trading_style?: TradingStyle;
  risk_level?: RiskLevel;
  min_return?: number;
  sort_by?: 'copiers' | 'returns' | 'followers' | 'newest';
  limit?: number;
  offset?: number;
}): Promise<PublishedPortfolio[]> {
  let query = supabase
    .from('published_portfolios')
    .select('*')
    .eq('is_active', true);

  if (options?.trading_style) {
    query = query.eq('trading_style', options.trading_style);
  }

  if (options?.risk_level) {
    query = query.eq('risk_level', options.risk_level);
  }

  if (options?.min_return) {
    query = query.gte('total_return_percent', options.min_return);
  }

  // Sorting
  switch (options?.sort_by) {
    case 'copiers':
      query = query.order('copiers_count', { ascending: false });
      break;
    case 'returns':
      query = query.order('total_return_percent', { ascending: false, nullsFirst: false });
      break;
    case 'followers':
      query = query.order('followers_count', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('copiers_count', { ascending: false });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get published portfolio by slug
 */
export async function getPublishedPortfolioBySlug(slug: string): Promise<PublishedPortfolio | null> {
  const { data, error } = await supabase
    .from('published_portfolios')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  // Increment view count
  if (data) {
    await supabase
      .from('published_portfolios')
      .update({ views_count: data.views_count + 1 })
      .eq('id', data.id);
  }

  return data;
}

/**
 * Get user's published portfolios
 */
export async function getUserPublishedPortfolios(userId: string): Promise<PublishedPortfolio[]> {
  const { data, error } = await supabase
    .from('published_portfolios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Publish a portfolio for copying
 */
export async function publishPortfolio(
  userId: string,
  portfolioId: string,
  settings: {
    name: string;
    description?: string;
    trading_style?: TradingStyle;
    risk_level?: RiskLevel;
    specialization?: string;
    is_free?: boolean;
    subscription_price?: number;
    show_holdings?: boolean;
    show_transactions?: boolean;
    delay_transactions_hours?: number;
    min_copy_amount?: number;
  }
): Promise<PublishedPortfolio> {
  // Generate slug from name
  const baseSlug = settings.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from('published_portfolios')
    .insert({
      user_id: userId,
      portfolio_id: portfolioId,
      name: settings.name,
      slug,
      description: settings.description,
      trading_style: settings.trading_style,
      risk_level: settings.risk_level,
      specialization: settings.specialization,
      is_free: settings.is_free || false,
      subscription_price: settings.subscription_price || SOCIAL_TRADING_CONFIG.default_subscription_price,
      creator_revenue_share: SOCIAL_TRADING_CONFIG.creator_share_percent,
      show_holdings: settings.show_holdings ?? true,
      show_transactions: settings.show_transactions ?? true,
      delay_transactions_hours: settings.delay_transactions_hours || SOCIAL_TRADING_CONFIG.default_delay_hours,
      min_copy_amount: settings.min_copy_amount || SOCIAL_TRADING_CONFIG.min_copy_amount,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update published portfolio settings
 */
export async function updatePublishedPortfolio(
  portfolioId: string,
  userId: string,
  updates: Partial<PublishedPortfolio>
): Promise<PublishedPortfolio> {
  const { data, error } = await supabase
    .from('published_portfolios')
    .update(updates)
    .eq('id', portfolioId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Unpublish a portfolio
 */
export async function unpublishPortfolio(portfolioId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('published_portfolios')
    .update({ is_active: false })
    .eq('id', portfolioId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================
// FOLLOWING (Free)
// ============================================

/**
 * Follow a published portfolio
 */
export async function followPortfolio(
  userId: string,
  publishedPortfolioId: string
): Promise<PortfolioFollower> {
  const { data, error } = await supabase
    .from('portfolio_followers')
    .insert({
      follower_user_id: userId,
      published_portfolio_id: publishedPortfolioId,
      notifications_enabled: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Unfollow a published portfolio
 */
export async function unfollowPortfolio(userId: string, publishedPortfolioId: string): Promise<void> {
  const { error } = await supabase
    .from('portfolio_followers')
    .delete()
    .eq('follower_user_id', userId)
    .eq('published_portfolio_id', publishedPortfolioId);

  if (error) throw error;
}

/**
 * Check if user follows a portfolio
 */
export async function isFollowing(userId: string, publishedPortfolioId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('portfolio_followers')
    .select('id')
    .eq('follower_user_id', userId)
    .eq('published_portfolio_id', publishedPortfolioId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/**
 * Get portfolios a user follows
 */
export async function getFollowedPortfolios(userId: string): Promise<PublishedPortfolio[]> {
  const { data, error } = await supabase
    .from('portfolio_followers')
    .select(`
      published_portfolio:published_portfolios(*)
    `)
    .eq('follower_user_id', userId);

  if (error) throw error;
  return (data || []).map((d) => d.published_portfolio).filter(Boolean) as PublishedPortfolio[];
}

// ============================================
// COPY TRADING SUBSCRIPTIONS ($9.99/month)
// ============================================

/**
 * Subscribe to copy a portfolio
 */
export async function subscribeToCopyPortfolio(
  subscriberUserId: string,
  publishedPortfolioId: string,
  stripeSubscriptionId: string,
  settings: {
    copy_mode?: CopyMode;
    allocated_amount?: number;
    max_position_size?: number;
    copy_new_trades?: boolean;
    auto_rebalance?: boolean;
  } = {}
): Promise<CopyTradingSubscription> {
  // Get portfolio details
  const { data: portfolio, error: portfolioError } = await supabase
    .from('published_portfolios')
    .select('user_id, subscription_price')
    .eq('id', publishedPortfolioId)
    .single();

  if (portfolioError) throw portfolioError;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { data, error } = await supabase
    .from('copy_trading_subscriptions')
    .insert({
      subscriber_user_id: subscriberUserId,
      published_portfolio_id: publishedPortfolioId,
      creator_user_id: portfolio.user_id,
      status: 'active',
      subscription_type: 'monthly',
      price_paid: portfolio.subscription_price,
      copy_mode: settings.copy_mode || 'proportional',
      allocated_amount: settings.allocated_amount,
      max_position_size: settings.max_position_size,
      copy_new_trades: settings.copy_new_trades ?? true,
      auto_rebalance: settings.auto_rebalance ?? false,
      stripe_subscription_id: stripeSubscriptionId,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's copy trading subscriptions
 */
export async function getUserCopySubscriptions(userId: string): Promise<CopyTradingSubscription[]> {
  const { data, error } = await supabase
    .from('copy_trading_subscriptions')
    .select(`
      *,
      published_portfolio:published_portfolios(name, slug, total_return_percent)
    `)
    .eq('subscriber_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get active copiers for a portfolio
 */
export async function getPortfolioCopiers(publishedPortfolioId: string): Promise<number> {
  const { count, error } = await supabase
    .from('copy_trading_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('published_portfolio_id', publishedPortfolioId)
    .eq('status', 'active');

  if (error) throw error;
  return count || 0;
}

/**
 * Cancel copy subscription
 */
export async function cancelCopySubscription(subscriptionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('copy_trading_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId)
    .eq('subscriber_user_id', userId);

  if (error) throw error;
}

/**
 * Pause/resume copy subscription
 */
export async function toggleCopySubscription(
  subscriptionId: string,
  userId: string,
  pause: boolean
): Promise<void> {
  const { error } = await supabase
    .from('copy_trading_subscriptions')
    .update({ status: pause ? 'paused' : 'active' })
    .eq('id', subscriptionId)
    .eq('subscriber_user_id', userId);

  if (error) throw error;
}

// ============================================
// COPY TRADE EXECUTIONS
// ============================================

/**
 * Get copy trade executions for a subscription
 */
export async function getCopyTradeExecutions(
  subscriptionId: string,
  limit: number = 50
): Promise<CopyTradeExecution[]> {
  const { data, error } = await supabase
    .from('copy_trade_executions')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get user's recent copy trades
 */
export async function getUserCopyTrades(userId: string, limit: number = 20): Promise<CopyTradeExecution[]> {
  const { data, error } = await supabase
    .from('copy_trade_executions')
    .select('*')
    .eq('copier_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================
// PORTFOLIO PERFORMANCE HISTORY
// ============================================

/**
 * Get portfolio performance history
 */
export async function getPortfolioHistory(
  publishedPortfolioId: string,
  days: number = 30
): Promise<PublishedPortfolioHistory[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('published_portfolio_history')
    .select('*')
    .eq('published_portfolio_id', publishedPortfolioId)
    .gte('snapshot_date', startDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// CREATOR EARNINGS
// ============================================

/**
 * Get creator's earnings summary
 */
export async function getCreatorEarnings(
  userId: string
): Promise<{
  total_earnings: number;
  pending_payout: number;
  total_subscribers: number;
  active_subscribers: number;
  monthly_earnings: { month: string; earnings: number }[];
}> {
  // Get all copy subscriptions where user is creator
  const { data: subscriptions, error: subError } = await supabase
    .from('copy_trading_subscriptions')
    .select('status, price_paid, creator_earnings')
    .eq('creator_user_id', userId);

  if (subError) throw subError;

  const activeSubscriptions = subscriptions?.filter((s) => s.status === 'active') || [];
  const total_earnings = subscriptions?.reduce((sum, s) => sum + (s.creator_earnings || 0), 0) || 0;

  // Get earnings history
  const { data: earnings, error: earnError } = await supabase
    .from('creator_earnings')
    .select('*')
    .eq('creator_user_id', userId)
    .order('period_start', { ascending: false })
    .limit(12);

  if (earnError) throw earnError;

  const pending_payout =
    earnings?.filter((e) => e.payout_status === 'pending').reduce((sum, e) => sum + e.creator_earnings, 0) || 0;

  return {
    total_earnings,
    pending_payout,
    total_subscribers: subscriptions?.length || 0,
    active_subscribers: activeSubscriptions.length,
    monthly_earnings:
      earnings?.map((e) => ({
        month: e.period_start,
        earnings: e.creator_earnings,
      })) || [],
  };
}

/**
 * Get detailed earnings records
 */
export async function getCreatorEarningsRecords(userId: string): Promise<CreatorEarnings[]> {
  const { data, error } = await supabase
    .from('creator_earnings')
    .select('*')
    .eq('creator_user_id', userId)
    .order('period_start', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// LEADERBOARD
// ============================================

/**
 * Get social trading leaderboard
 */
export async function getLeaderboard(): Promise<SocialTradingLeaderboard> {
  const [topPerformers, mostCopied, trending, newCreators] = await Promise.all([
    // Top performers by returns
    supabase
      .from('published_portfolios')
      .select('*')
      .eq('is_active', true)
      .not('total_return_percent', 'is', null)
      .order('total_return_percent', { ascending: false })
      .limit(10),
    // Most copied
    supabase
      .from('published_portfolios')
      .select('*')
      .eq('is_active', true)
      .order('copiers_count', { ascending: false })
      .limit(10),
    // Trending (most new followers in last 7 days - approximated by total followers for now)
    supabase
      .from('published_portfolios')
      .select('*')
      .eq('is_active', true)
      .order('followers_count', { ascending: false })
      .limit(10),
    // New creators (recently published)
    supabase
      .from('published_portfolios')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return {
    top_performers: topPerformers.data || [],
    most_copied: mostCopied.data || [],
    trending: trending.data || [],
    new_creators: newCreators.data || [],
  };
}

// ============================================
// DEMO DATA
// ============================================

export const DEMO_PUBLISHED_PORTFOLIOS: Partial<PublishedPortfolio>[] = [
  {
    id: 'demo-1',
    name: 'BTC Maximalist',
    slug: 'btc-maximalist',
    description: 'Long-term Bitcoin accumulation strategy with DCA approach.',
    trading_style: 'hodl',
    risk_level: 'moderate',
    specialization: 'Bitcoin',
    total_return_percent: 145.5,
    monthly_return_percent: 8.2,
    yearly_return_percent: 145.5,
    max_drawdown_percent: -25.3,
    sharpe_ratio: 1.85,
    win_rate: 72,
    followers_count: 1250,
    copiers_count: 320,
    views_count: 8500,
    is_free: false,
    subscription_price: 9.99,
    is_verified: true,
    is_active: true,
  },
  {
    id: 'demo-2',
    name: 'DeFi Alpha Hunter',
    slug: 'defi-alpha-hunter',
    description: 'Active DeFi trading focused on yield opportunities and emerging protocols.',
    trading_style: 'yield_farming',
    risk_level: 'aggressive',
    specialization: 'DeFi',
    total_return_percent: 285.2,
    monthly_return_percent: 18.5,
    yearly_return_percent: 285.2,
    max_drawdown_percent: -42.1,
    sharpe_ratio: 1.45,
    win_rate: 65,
    followers_count: 890,
    copiers_count: 185,
    views_count: 5200,
    is_free: false,
    subscription_price: 14.99,
    is_verified: true,
    is_active: true,
  },
  {
    id: 'demo-3',
    name: 'Balanced Crypto Index',
    slug: 'balanced-crypto-index',
    description: 'Diversified portfolio tracking top 20 cryptocurrencies by market cap.',
    trading_style: 'dca',
    risk_level: 'conservative',
    specialization: 'Index',
    total_return_percent: 85.3,
    monthly_return_percent: 5.2,
    yearly_return_percent: 85.3,
    max_drawdown_percent: -18.5,
    sharpe_ratio: 2.1,
    win_rate: 78,
    followers_count: 2100,
    copiers_count: 520,
    views_count: 12500,
    is_free: false,
    subscription_price: 9.99,
    is_verified: true,
    is_active: true,
  },
  {
    id: 'demo-4',
    name: 'Altcoin Season Trader',
    slug: 'altcoin-season-trader',
    description: 'Swing trading altcoins during market cycles.',
    trading_style: 'swing_trading',
    risk_level: 'degen',
    specialization: 'Altcoins',
    total_return_percent: 450.8,
    monthly_return_percent: 32.1,
    yearly_return_percent: 450.8,
    max_drawdown_percent: -65.2,
    sharpe_ratio: 0.95,
    win_rate: 55,
    followers_count: 650,
    copiers_count: 95,
    views_count: 3800,
    is_free: false,
    subscription_price: 19.99,
    is_verified: false,
    is_active: true,
  },
];

/**
 * Get demo leaderboard data
 */
export function getDemoLeaderboard(): SocialTradingLeaderboard {
  const portfolios = DEMO_PUBLISHED_PORTFOLIOS as PublishedPortfolio[];
  return {
    top_performers: [...portfolios].sort(
      (a, b) => (b.total_return_percent || 0) - (a.total_return_percent || 0)
    ),
    most_copied: [...portfolios].sort((a, b) => b.copiers_count - a.copiers_count),
    trending: [...portfolios].sort((a, b) => b.followers_count - a.followers_count),
    new_creators: [...portfolios].slice(0, 3),
  };
}
