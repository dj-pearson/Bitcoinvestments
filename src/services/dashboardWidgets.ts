/**
 * Dashboard Widgets Service
 *
 * Manages customizable dashboard widgets with drag-and-drop support.
 *
 * Features:
 * - Widget configuration persistence
 * - Layout management (grid positions, sizes)
 * - Widget type registry
 * - Default layouts for new users
 */

import { supabase, isSupabaseConfigured, db } from '../lib/supabase';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  settings: Record<string, unknown>;
  isVisible: boolean;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  widgets: WidgetConfig[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WidgetType =
  | 'price_ticker'
  | 'portfolio_summary'
  | 'market_overview'
  | 'fear_greed_index'
  | 'top_movers'
  | 'watchlist'
  | 'recent_transactions'
  | 'news_feed'
  | 'price_alerts'
  | 'portfolio_chart'
  | 'allocation_pie'
  | 'quick_actions';

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize: { w: number; h: number };
  defaultSettings: Record<string, unknown>;
  category: 'portfolio' | 'market' | 'tools' | 'news';
}

// Widget definitions registry
export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  price_ticker: {
    type: 'price_ticker',
    name: 'Price Ticker',
    description: 'Live cryptocurrency prices with 24h change',
    icon: 'TrendingUp',
    defaultSize: { w: 4, h: 1 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 12, h: 2 },
    defaultSettings: { coins: ['bitcoin', 'ethereum', 'solana'] },
    category: 'market',
  },
  portfolio_summary: {
    type: 'portfolio_summary',
    name: 'Portfolio Summary',
    description: 'Total value and daily change overview',
    icon: 'Wallet',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    defaultSettings: { showPercentages: true },
    category: 'portfolio',
  },
  market_overview: {
    type: 'market_overview',
    name: 'Market Overview',
    description: 'Total market cap and BTC dominance',
    icon: 'Globe',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    defaultSettings: {},
    category: 'market',
  },
  fear_greed_index: {
    type: 'fear_greed_index',
    name: 'Fear & Greed Index',
    description: 'Market sentiment indicator',
    icon: 'Activity',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
    defaultSettings: { showHistory: true },
    category: 'market',
  },
  top_movers: {
    type: 'top_movers',
    name: 'Top Movers',
    description: 'Biggest gainers and losers',
    icon: 'BarChart3',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 4 },
    defaultSettings: { count: 5, timeframe: '24h' },
    category: 'market',
  },
  watchlist: {
    type: 'watchlist',
    name: 'Watchlist',
    description: 'Your tracked cryptocurrencies',
    icon: 'Star',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 5 },
    defaultSettings: { showSparkline: true },
    category: 'portfolio',
  },
  recent_transactions: {
    type: 'recent_transactions',
    name: 'Recent Transactions',
    description: 'Your latest portfolio activity',
    icon: 'History',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 5 },
    defaultSettings: { limit: 10 },
    category: 'portfolio',
  },
  news_feed: {
    type: 'news_feed',
    name: 'News Feed',
    description: 'Latest crypto news and updates',
    icon: 'Newspaper',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 8, h: 6 },
    defaultSettings: { sources: ['all'], limit: 10 },
    category: 'news',
  },
  price_alerts: {
    type: 'price_alerts',
    name: 'Price Alerts',
    description: 'Your active price alerts',
    icon: 'Bell',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 5, h: 4 },
    defaultSettings: {},
    category: 'tools',
  },
  portfolio_chart: {
    type: 'portfolio_chart',
    name: 'Portfolio Chart',
    description: 'Portfolio value over time',
    icon: 'LineChart',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    maxSize: { w: 12, h: 5 },
    defaultSettings: { timeframe: '30d' },
    category: 'portfolio',
  },
  allocation_pie: {
    type: 'allocation_pie',
    name: 'Allocation',
    description: 'Portfolio allocation breakdown',
    icon: 'PieChart',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 5, h: 4 },
    defaultSettings: { showLabels: true },
    category: 'portfolio',
  },
  quick_actions: {
    type: 'quick_actions',
    name: 'Quick Actions',
    description: 'Shortcuts to common tasks',
    icon: 'Zap',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 4, h: 3 },
    defaultSettings: {},
    category: 'tools',
  },
};

// Default layout for new users
export const DEFAULT_LAYOUT: Omit<WidgetConfig, 'id'>[] = [
  {
    type: 'portfolio_summary',
    title: 'Portfolio',
    position: { x: 0, y: 0, w: 3, h: 2 },
    settings: { showPercentages: true },
    isVisible: true,
  },
  {
    type: 'price_ticker',
    title: 'Prices',
    position: { x: 3, y: 0, w: 6, h: 1 },
    settings: { coins: ['bitcoin', 'ethereum', 'solana', 'cardano'] },
    isVisible: true,
  },
  {
    type: 'fear_greed_index',
    title: 'Market Sentiment',
    position: { x: 9, y: 0, w: 3, h: 2 },
    settings: { showHistory: true },
    isVisible: true,
  },
  {
    type: 'portfolio_chart',
    title: 'Performance',
    position: { x: 0, y: 2, w: 6, h: 3 },
    settings: { timeframe: '30d' },
    isVisible: true,
  },
  {
    type: 'allocation_pie',
    title: 'Allocation',
    position: { x: 6, y: 1, w: 3, h: 3 },
    settings: { showLabels: true },
    isVisible: true,
  },
  {
    type: 'top_movers',
    title: 'Top Movers',
    position: { x: 9, y: 2, w: 3, h: 3 },
    settings: { count: 5, timeframe: '24h' },
    isVisible: true,
  },
  {
    type: 'news_feed',
    title: 'News',
    position: { x: 0, y: 5, w: 4, h: 4 },
    settings: { sources: ['all'], limit: 5 },
    isVisible: true,
  },
  {
    type: 'watchlist',
    title: 'Watchlist',
    position: { x: 4, y: 5, w: 4, h: 4 },
    settings: { showSparkline: true },
    isVisible: true,
  },
  {
    type: 'quick_actions',
    title: 'Quick Actions',
    position: { x: 8, y: 5, w: 4, h: 2 },
    settings: {},
    isVisible: true,
  },
];

/**
 * Generate unique widget ID
 */
function generateWidgetId(): string {
  return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get user's dashboard layout
 */
export async function getDashboardLayout(
  userId: string
): Promise<{ layout: DashboardLayout | null; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return {
          layout: {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            widgets: data.widgets || [],
            isDefault: data.is_default,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          },
          error: null,
        };
      }
    }

    // Return default layout for new users
    return {
      layout: createDefaultLayout(userId),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching dashboard layout:', error);
    return {
      layout: null,
      error: error instanceof Error ? error.message : 'Failed to load dashboard',
    };
  }
}

/**
 * Save dashboard layout
 */
export async function saveDashboardLayout(
  layout: DashboardLayout
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      // Store in localStorage as fallback
      localStorage.setItem(`dashboard_layout_${layout.userId}`, JSON.stringify(layout));
      return { success: true, error: null };
    }

    const { error } = await db.from('dashboard_layouts').upsert(
      {
        id: layout.id,
        user_id: layout.userId,
        name: layout.name,
        widgets: layout.widgets,
        is_default: layout.isDefault,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving dashboard layout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save layout',
    };
  }
}

/**
 * Create default layout for user
 */
export function createDefaultLayout(userId: string): DashboardLayout {
  const widgets: WidgetConfig[] = DEFAULT_LAYOUT.map((widget) => ({
    ...widget,
    id: generateWidgetId(),
  }));

  return {
    id: `layout_${userId}_default`,
    userId,
    name: 'Default Dashboard',
    widgets,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add widget to layout
 */
export function addWidget(
  layout: DashboardLayout,
  type: WidgetType,
  position?: Partial<WidgetPosition>
): DashboardLayout {
  const definition = WIDGET_DEFINITIONS[type];
  const newPosition = findAvailablePosition(layout.widgets, definition.defaultSize);

  const newWidget: WidgetConfig = {
    id: generateWidgetId(),
    type,
    title: definition.name,
    position: { ...newPosition, ...position },
    settings: { ...definition.defaultSettings },
    isVisible: true,
  };

  return {
    ...layout,
    widgets: [...layout.widgets, newWidget],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Remove widget from layout
 */
export function removeWidget(layout: DashboardLayout, widgetId: string): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.filter((w) => w.id !== widgetId),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update widget configuration
 */
export function updateWidget(
  layout: DashboardLayout,
  widgetId: string,
  updates: Partial<Omit<WidgetConfig, 'id' | 'type'>>
): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    ),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update widget position
 */
export function updateWidgetPosition(
  layout: DashboardLayout,
  widgetId: string,
  position: WidgetPosition
): DashboardLayout {
  return updateWidget(layout, widgetId, { position });
}

/**
 * Toggle widget visibility
 */
export function toggleWidgetVisibility(
  layout: DashboardLayout,
  widgetId: string
): DashboardLayout {
  const widget = layout.widgets.find((w) => w.id === widgetId);
  if (!widget) return layout;

  return updateWidget(layout, widgetId, { isVisible: !widget.isVisible });
}

/**
 * Find available position for new widget
 */
function findAvailablePosition(
  widgets: WidgetConfig[],
  size: { w: number; h: number }
): WidgetPosition {
  const gridCols = 12;
  const occupiedCells = new Set<string>();

  // Mark occupied cells
  for (const widget of widgets) {
    if (!widget.isVisible) continue;
    for (let x = widget.position.x; x < widget.position.x + widget.position.w; x++) {
      for (let y = widget.position.y; y < widget.position.y + widget.position.h; y++) {
        occupiedCells.add(`${x},${y}`);
      }
    }
  }

  // Find first available position
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= gridCols - size.w; x++) {
      let fits = true;

      for (let dx = 0; dx < size.w && fits; dx++) {
        for (let dy = 0; dy < size.h && fits; dy++) {
          if (occupiedCells.has(`${x + dx},${y + dy}`)) {
            fits = false;
          }
        }
      }

      if (fits) {
        return { x, y, w: size.w, h: size.h };
      }
    }
  }

  // Fallback: place at bottom
  const maxY = Math.max(0, ...widgets.map((w) => w.position.y + w.position.h));
  return { x: 0, y: maxY, w: size.w, h: size.h };
}

/**
 * Reset layout to default
 */
export function resetToDefaultLayout(userId: string): DashboardLayout {
  return createDefaultLayout(userId);
}

/**
 * Get widget categories for the widget picker
 */
export function getWidgetsByCategory(): Record<string, WidgetDefinition[]> {
  const categories: Record<string, WidgetDefinition[]> = {
    portfolio: [],
    market: [],
    tools: [],
    news: [],
  };

  for (const definition of Object.values(WIDGET_DEFINITIONS)) {
    categories[definition.category].push(definition);
  }

  return categories;
}

/**
 * Validate layout (check for overlaps, out of bounds, etc.)
 */
export function validateLayout(layout: DashboardLayout): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const gridCols = 12;

  for (const widget of layout.widgets) {
    // Check bounds
    if (widget.position.x < 0 || widget.position.x + widget.position.w > gridCols) {
      errors.push(`Widget "${widget.title}" is out of horizontal bounds`);
    }
    if (widget.position.y < 0) {
      errors.push(`Widget "${widget.title}" has negative vertical position`);
    }

    // Check size constraints
    const def = WIDGET_DEFINITIONS[widget.type];
    if (widget.position.w < def.minSize.w || widget.position.h < def.minSize.h) {
      errors.push(`Widget "${widget.title}" is smaller than minimum size`);
    }
    if (widget.position.w > def.maxSize.w || widget.position.h > def.maxSize.h) {
      errors.push(`Widget "${widget.title}" is larger than maximum size`);
    }
  }

  return { valid: errors.length === 0, errors };
}
