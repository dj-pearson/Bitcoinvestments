/**
 * Dashboard Widgets Service
 *
 * Premium feature: Free users get standard dashboard.
 * Premium can customize layout, add widgets, create multiple dashboard views.
 */

import { supabase } from './database';
import { getTierLimits } from './subscriptionLimits';
import type { SubscriptionStatus } from '../types';

export interface DashboardWidget {
  id: string;
  type: string;
  title?: string;
  position: GridPosition;
  settings: Record<string, unknown>;
}

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardConfig {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  layout: DashboardWidget[];
  widgets: DashboardWidget[];
  theme: string;
  compact_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface WidgetType {
  id: string;
  name: string;
  description: string;
  category: 'market' | 'portfolio' | 'news' | 'tools' | 'social' | 'custom';
  default_size: { w: number; h: number };
  min_size: { w: number; h: number };
  max_size: { w: number; h: number };
  premium_only: boolean;
  settings_schema?: Record<string, unknown>;
}

/**
 * Available widget types with their configurations
 */
export const WIDGET_TYPES: Record<string, WidgetType> = {
  price_ticker: {
    id: 'price_ticker',
    name: 'Price Ticker',
    description: 'Live cryptocurrency price display',
    category: 'market',
    default_size: { w: 2, h: 1 },
    min_size: { w: 1, h: 1 },
    max_size: { w: 4, h: 2 },
    premium_only: false,
  },
  portfolio_summary: {
    id: 'portfolio_summary',
    name: 'Portfolio Summary',
    description: 'Overview of your portfolio value',
    category: 'portfolio',
    default_size: { w: 2, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 4, h: 3 },
    premium_only: false,
  },
  fear_greed: {
    id: 'fear_greed',
    name: 'Fear & Greed Index',
    description: 'Market sentiment indicator',
    category: 'market',
    default_size: { w: 1, h: 2 },
    min_size: { w: 1, h: 2 },
    max_size: { w: 2, h: 3 },
    premium_only: false,
  },
  trending_coins: {
    id: 'trending_coins',
    name: 'Trending Coins',
    description: 'Currently trending cryptocurrencies',
    category: 'market',
    default_size: { w: 2, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 3, h: 4 },
    premium_only: false,
  },
  news_feed: {
    id: 'news_feed',
    name: 'News Feed',
    description: 'Latest crypto news',
    category: 'news',
    default_size: { w: 2, h: 3 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 4, h: 4 },
    premium_only: false,
  },
  price_chart: {
    id: 'price_chart',
    name: 'Price Chart',
    description: 'Interactive price chart for any coin',
    category: 'market',
    default_size: { w: 3, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 4, h: 4 },
    premium_only: true,
  },
  portfolio_chart: {
    id: 'portfolio_chart',
    name: 'Portfolio Performance',
    description: 'Historical portfolio performance chart',
    category: 'portfolio',
    default_size: { w: 3, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 4, h: 4 },
    premium_only: true,
  },
  price_alerts: {
    id: 'price_alerts',
    name: 'Price Alerts',
    description: 'Your active price alerts',
    category: 'tools',
    default_size: { w: 2, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 3, h: 4 },
    premium_only: true,
  },
  gas_tracker: {
    id: 'gas_tracker',
    name: 'Gas Tracker',
    description: 'Ethereum gas prices',
    category: 'tools',
    default_size: { w: 1, h: 1 },
    min_size: { w: 1, h: 1 },
    max_size: { w: 2, h: 2 },
    premium_only: false,
  },
  watchlist: {
    id: 'watchlist',
    name: 'Watchlist',
    description: 'Custom coin watchlist',
    category: 'portfolio',
    default_size: { w: 2, h: 3 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 3, h: 4 },
    premium_only: true,
  },
  calculator: {
    id: 'calculator',
    name: 'Quick Calculator',
    description: 'DCA/Profit calculator widget',
    category: 'tools',
    default_size: { w: 2, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 3, h: 3 },
    premium_only: true,
  },
  heatmap: {
    id: 'heatmap',
    name: 'Market Heatmap',
    description: 'Visual market overview',
    category: 'market',
    default_size: { w: 3, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 4, h: 4 },
    premium_only: true,
  },
  dominance_chart: {
    id: 'dominance_chart',
    name: 'BTC Dominance',
    description: 'Bitcoin market dominance chart',
    category: 'market',
    default_size: { w: 2, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 3, h: 3 },
    premium_only: true,
  },
  social_sentiment: {
    id: 'social_sentiment',
    name: 'Social Sentiment',
    description: 'Twitter/Reddit sentiment analysis',
    category: 'social',
    default_size: { w: 2, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 3, h: 3 },
    premium_only: true,
  },
  upcoming_events: {
    id: 'upcoming_events',
    name: 'Upcoming Events',
    description: 'Crypto calendar events',
    category: 'news',
    default_size: { w: 2, h: 2 },
    min_size: { w: 2, h: 2 },
    max_size: { w: 3, h: 4 },
    premium_only: true,
  },
  custom_notes: {
    id: 'custom_notes',
    name: 'Notes',
    description: 'Personal notes widget',
    category: 'custom',
    default_size: { w: 2, h: 2 },
    min_size: { w: 1, h: 1 },
    max_size: { w: 4, h: 4 },
    premium_only: true,
  },
};

/**
 * Default dashboard layout for free users
 */
export const DEFAULT_FREE_LAYOUT: DashboardWidget[] = [
  { id: 'w1', type: 'portfolio_summary', position: { x: 0, y: 0, w: 2, h: 2 }, settings: {} },
  { id: 'w2', type: 'fear_greed', position: { x: 2, y: 0, w: 1, h: 2 }, settings: {} },
  { id: 'w3', type: 'gas_tracker', position: { x: 3, y: 0, w: 1, h: 1 }, settings: {} },
  { id: 'w4', type: 'trending_coins', position: { x: 0, y: 2, w: 2, h: 2 }, settings: {} },
  { id: 'w5', type: 'news_feed', position: { x: 2, y: 2, w: 2, h: 3 }, settings: {} },
];

/**
 * Default dashboard layout for premium users
 */
export const DEFAULT_PREMIUM_LAYOUT: DashboardWidget[] = [
  { id: 'w1', type: 'portfolio_summary', position: { x: 0, y: 0, w: 2, h: 2 }, settings: {} },
  { id: 'w2', type: 'portfolio_chart', position: { x: 2, y: 0, w: 2, h: 2 }, settings: {} },
  { id: 'w3', type: 'fear_greed', position: { x: 0, y: 2, w: 1, h: 2 }, settings: {} },
  { id: 'w4', type: 'price_chart', position: { x: 1, y: 2, w: 3, h: 2 }, settings: { coin: 'bitcoin' } },
  { id: 'w5', type: 'watchlist', position: { x: 0, y: 4, w: 2, h: 3 }, settings: {} },
  { id: 'w6', type: 'price_alerts', position: { x: 2, y: 4, w: 2, h: 2 }, settings: {} },
  { id: 'w7', type: 'news_feed', position: { x: 2, y: 6, w: 2, h: 3 }, settings: {} },
];

/**
 * Check if user can customize dashboard
 */
export function canCustomizeDashboard(subscriptionStatus?: SubscriptionStatus): boolean {
  const limits = getTierLimits(subscriptionStatus);
  return limits.advancedAnalytics; // Reusing advancedAnalytics permission
}

/**
 * Check if user can use a specific widget
 */
export function canUseWidget(
  widgetId: string,
  subscriptionStatus?: SubscriptionStatus
): boolean {
  const widget = WIDGET_TYPES[widgetId];
  if (!widget) return false;

  if (!widget.premium_only) return true;

  return canCustomizeDashboard(subscriptionStatus);
}

/**
 * Get available widgets for user's tier
 */
export function getAvailableWidgets(subscriptionStatus?: SubscriptionStatus): WidgetType[] {
  const isPremium = canCustomizeDashboard(subscriptionStatus);

  return Object.values(WIDGET_TYPES).filter(widget =>
    !widget.premium_only || isPremium
  );
}

/**
 * Get user's dashboard configs
 */
export async function getUserDashboards(userId: string): Promise<DashboardConfig[]> {
  const { data, error } = await supabase
    .from('user_dashboard_configs')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching dashboards:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's default dashboard (or create one)
 */
export async function getDefaultDashboard(
  userId: string,
  subscriptionStatus?: SubscriptionStatus
): Promise<DashboardConfig | null> {
  // Try to get existing default
  const { data, error } = await supabase
    .from('user_dashboard_configs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (data) return data;

  // Create default dashboard
  const isPremium = canCustomizeDashboard(subscriptionStatus);
  const defaultLayout = isPremium ? DEFAULT_PREMIUM_LAYOUT : DEFAULT_FREE_LAYOUT;

  const { data: newDashboard, error: createError } = await supabase
    .from('user_dashboard_configs')
    .insert({
      user_id: userId,
      name: 'My Dashboard',
      is_default: true,
      layout: defaultLayout,
      widgets: defaultLayout,
      theme: 'default',
      compact_mode: false,
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating default dashboard:', createError);
    return null;
  }

  return newDashboard;
}

/**
 * Create a new dashboard
 */
export async function createDashboard(
  userId: string,
  name: string,
  subscriptionStatus?: SubscriptionStatus
): Promise<{ success: boolean; dashboard?: DashboardConfig; error?: string }> {
  // Check if user can create multiple dashboards (premium feature)
  if (!canCustomizeDashboard(subscriptionStatus)) {
    return { success: false, error: 'Upgrade to Premium to create multiple dashboards' };
  }

  // Check dashboard limit (max 5 dashboards)
  const existing = await getUserDashboards(userId);
  if (existing.length >= 5) {
    return { success: false, error: 'Maximum 5 dashboards allowed' };
  }

  const { data, error } = await supabase
    .from('user_dashboard_configs')
    .insert({
      user_id: userId,
      name,
      is_default: false,
      layout: DEFAULT_PREMIUM_LAYOUT,
      widgets: DEFAULT_PREMIUM_LAYOUT,
      theme: 'default',
      compact_mode: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating dashboard:', error);
    return { success: false, error: 'Failed to create dashboard' };
  }

  return { success: true, dashboard: data };
}

/**
 * Update dashboard layout
 */
export async function updateDashboardLayout(
  userId: string,
  dashboardId: string,
  widgets: DashboardWidget[],
  subscriptionStatus?: SubscriptionStatus
): Promise<{ success: boolean; error?: string }> {
  // Verify user can customize
  if (!canCustomizeDashboard(subscriptionStatus)) {
    return { success: false, error: 'Upgrade to Premium to customize dashboard' };
  }

  // Verify all widgets are allowed
  for (const widget of widgets) {
    if (!canUseWidget(widget.type, subscriptionStatus)) {
      return { success: false, error: `Widget "${widget.type}" requires Premium` };
    }
  }

  const { error } = await supabase
    .from('user_dashboard_configs')
    .update({
      layout: widgets,
      widgets: widgets,
    })
    .eq('id', dashboardId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating dashboard:', error);
    return { success: false, error: 'Failed to update dashboard' };
  }

  return { success: true };
}

/**
 * Delete a dashboard
 */
export async function deleteDashboard(
  userId: string,
  dashboardId: string
): Promise<{ success: boolean; error?: string }> {
  // Prevent deleting default dashboard
  const { data: dashboard } = await supabase
    .from('user_dashboard_configs')
    .select('is_default')
    .eq('id', dashboardId)
    .eq('user_id', userId)
    .single();

  if (dashboard?.is_default) {
    return { success: false, error: 'Cannot delete default dashboard' };
  }

  const { error } = await supabase
    .from('user_dashboard_configs')
    .delete()
    .eq('id', dashboardId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting dashboard:', error);
    return { success: false, error: 'Failed to delete dashboard' };
  }

  return { success: true };
}

/**
 * Set a dashboard as default
 */
export async function setDefaultDashboard(
  userId: string,
  dashboardId: string
): Promise<boolean> {
  // First, unset all defaults
  await supabase
    .from('user_dashboard_configs')
    .update({ is_default: false })
    .eq('user_id', userId);

  // Set new default
  const { error } = await supabase
    .from('user_dashboard_configs')
    .update({ is_default: true })
    .eq('id', dashboardId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error setting default dashboard:', error);
    return false;
  }

  return true;
}

/**
 * Update widget settings
 */
export async function updateWidgetSettings(
  userId: string,
  dashboardId: string,
  widgetId: string,
  settings: Record<string, unknown>
): Promise<boolean> {
  // Get current dashboard
  const { data: dashboard } = await supabase
    .from('user_dashboard_configs')
    .select('widgets')
    .eq('id', dashboardId)
    .eq('user_id', userId)
    .single();

  if (!dashboard) return false;

  // Update widget settings
  const widgets = dashboard.widgets.map((w: DashboardWidget) =>
    w.id === widgetId ? { ...w, settings: { ...w.settings, ...settings } } : w
  );

  const { error } = await supabase
    .from('user_dashboard_configs')
    .update({ widgets, layout: widgets })
    .eq('id', dashboardId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating widget settings:', error);
    return false;
  }

  return true;
}
