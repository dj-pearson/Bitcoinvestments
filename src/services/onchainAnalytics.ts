/**
 * On-Chain Analytics Dashboard Service
 *
 * Advanced metrics: network activity, miner flows, exchange inflows/outflows.
 * Free users get basic metrics, premium gets pro analytics: $29.99/month tier
 */

import { supabase } from '../lib/supabase';
import type {
  OnChainMetric,
  OnChainMetricType,
  OnChainAnalyticsSubscription,
  OnChainAlert,
  OnChainDashboard,
  OnChainTier,
  OnChainAlertCondition,
  AggregationPeriod,
  OnChainDashboardResponse,
  ON_CHAIN_METRIC_CATEGORIES,
} from '../types/monetization';

// ============================================
// PRICING & CONFIG
// ============================================

export const ONCHAIN_ANALYTICS_CONFIG = {
  tiers: {
    basic: {
      price: 0,
      metrics: ['active_addresses', 'transaction_count', 'transaction_volume'] as OnChainMetricType[],
      aggregation_periods: ['daily'] as AggregationPeriod[],
      max_alerts: 3,
      historical_days: 30,
      api_access: false,
      custom_dashboards: false,
      export_enabled: false,
    },
    pro: {
      price: 29.99,
      price_yearly: 299.99,
      metrics: 'all' as const,
      aggregation_periods: ['hourly', 'daily', 'weekly', 'monthly'] as AggregationPeriod[],
      max_alerts: 20,
      historical_days: 365,
      api_access: true,
      custom_dashboards: true,
      export_enabled: true,
    },
    enterprise: {
      price: 'custom' as const,
      metrics: 'all' as const,
      aggregation_periods: ['hourly', 'daily', 'weekly', 'monthly'] as AggregationPeriod[],
      max_alerts: 100,
      historical_days: 1825, // 5 years
      api_access: true,
      custom_dashboards: true,
      export_enabled: true,
      team_access: true,
      dedicated_support: true,
    },
  },
};

// Basic metrics available for free
export const FREE_METRICS: OnChainMetricType[] = [
  'active_addresses',
  'transaction_count',
  'transaction_volume',
];

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Get user's on-chain analytics subscription
 */
export async function getOnChainSubscription(
  userId: string
): Promise<OnChainAnalyticsSubscription | null> {
  const { data, error } = await supabase
    .from('onchain_analytics_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(userId: string): Promise<OnChainTier> {
  const subscription = await getOnChainSubscription(userId);
  if (!subscription) return 'basic';

  if (
    subscription.status === 'active' &&
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date())
  ) {
    return subscription.tier;
  }

  return 'basic';
}

/**
 * Check if user can access a metric
 */
export async function canAccessMetric(userId: string, metricType: OnChainMetricType): Promise<boolean> {
  // Free metrics are always accessible
  if (FREE_METRICS.includes(metricType)) return true;

  const tier = await getUserTier(userId);
  return tier === 'pro' || tier === 'enterprise';
}

/**
 * Create on-chain analytics subscription
 */
export async function createOnChainSubscription(
  userId: string,
  stripeSubscriptionId: string,
  tier: OnChainTier = 'pro',
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Promise<OnChainAnalyticsSubscription> {
  const config = ONCHAIN_ANALYTICS_CONFIG.tiers[tier];
  const price = billingPeriod === 'yearly' && 'price_yearly' in config
    ? config.price_yearly
    : config.price;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + (billingPeriod === 'yearly' ? 12 : 1));

  const { data, error } = await supabase
    .from('onchain_analytics_subscriptions')
    .upsert(
      {
        user_id: userId,
        tier,
        status: 'active',
        price_paid: typeof price === 'number' ? price : 0,
        billing_period: billingPeriod,
        max_alerts: config.max_alerts,
        api_access: config.api_access,
        historical_days: config.historical_days,
        custom_dashboards: config.custom_dashboards,
        export_enabled: config.export_enabled,
        stripe_subscription_id: stripeSubscriptionId,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cancel on-chain analytics subscription
 */
export async function cancelOnChainSubscription(userId: string): Promise<void> {
  const { error } = await supabase
    .from('onchain_analytics_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================
// METRICS DATA
// ============================================

/**
 * Get on-chain metrics
 */
export async function getMetrics(options: {
  asset: string;
  metric_types: OnChainMetricType[];
  chain?: string;
  start_date?: string;
  end_date?: string;
  aggregation?: AggregationPeriod;
  limit?: number;
}): Promise<OnChainMetric[]> {
  const {
    asset,
    metric_types,
    chain = 'bitcoin',
    start_date,
    end_date,
    aggregation = 'daily',
    limit = 100,
  } = options;

  let query = supabase
    .from('onchain_metrics')
    .select('*')
    .eq('asset_symbol', asset.toUpperCase())
    .eq('chain', chain)
    .in('metric_type', metric_types)
    .eq('aggregation_period', aggregation)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (start_date) {
    query = query.gte('timestamp', start_date);
  }

  if (end_date) {
    query = query.lte('timestamp', end_date);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get latest value for a metric
 */
export async function getLatestMetric(
  asset: string,
  metricType: OnChainMetricType,
  chain: string = 'bitcoin'
): Promise<OnChainMetric | null> {
  const { data, error } = await supabase
    .from('onchain_metrics')
    .select('*')
    .eq('asset_symbol', asset.toUpperCase())
    .eq('chain', chain)
    .eq('metric_type', metricType)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get metrics summary for an asset
 */
export async function getMetricsSummary(
  asset: string,
  chain: string = 'bitcoin'
): Promise<Record<OnChainMetricType, { value: number; change_24h: number; change_7d: number } | null>> {
  const metricTypes: OnChainMetricType[] = [
    'active_addresses',
    'transaction_count',
    'transaction_volume',
    'exchange_inflow',
    'exchange_outflow',
    'exchange_netflow',
    'hash_rate',
    'nvt_ratio',
    'mvrv_ratio',
  ];

  const summary: Record<string, { value: number; change_24h: number; change_7d: number } | null> = {};

  for (const metricType of metricTypes) {
    const metric = await getLatestMetric(asset, metricType, chain);
    if (metric) {
      summary[metricType] = {
        value: metric.value,
        change_24h: metric.change_24h || 0,
        change_7d: metric.change_7d || 0,
      };
    } else {
      summary[metricType] = null;
    }
  }

  return summary as Record<OnChainMetricType, { value: number; change_24h: number; change_7d: number } | null>;
}

// ============================================
// ALERTS
// ============================================

/**
 * Get user's on-chain alerts
 */
export async function getOnChainAlerts(userId: string): Promise<OnChainAlert[]> {
  const { data, error } = await supabase
    .from('onchain_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create on-chain alert
 */
export async function createOnChainAlert(
  userId: string,
  alert: {
    name: string;
    description?: string;
    asset_symbol: string;
    chain?: string;
    metric_type: OnChainMetricType;
    condition: OnChainAlertCondition;
    threshold_value?: number;
    percent_change?: number;
    lookback_period?: string;
    notify_email?: boolean;
    notify_push?: boolean;
    cooldown_minutes?: number;
  }
): Promise<OnChainAlert> {
  // Check user's tier and alert limits
  const subscription = await getOnChainSubscription(userId);
  const maxAlerts = subscription?.max_alerts || ONCHAIN_ANALYTICS_CONFIG.tiers.basic.max_alerts;

  const { count } = await supabase
    .from('onchain_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if ((count || 0) >= maxAlerts) {
    throw new Error(`You've reached your maximum of ${maxAlerts} alerts. Upgrade for more.`);
  }

  // Check if user can access this metric
  const canAccess = await canAccessMetric(userId, alert.metric_type);
  if (!canAccess) {
    throw new Error('This metric requires a Pro subscription');
  }

  const { data, error } = await supabase
    .from('onchain_alerts')
    .insert({
      user_id: userId,
      name: alert.name,
      description: alert.description,
      asset_symbol: alert.asset_symbol.toUpperCase(),
      chain: alert.chain || 'bitcoin',
      metric_type: alert.metric_type,
      condition: alert.condition,
      threshold_value: alert.threshold_value,
      percent_change: alert.percent_change,
      lookback_period: alert.lookback_period,
      is_active: true,
      notify_email: alert.notify_email ?? true,
      notify_push: alert.notify_push ?? false,
      cooldown_minutes: alert.cooldown_minutes || 60,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update on-chain alert
 */
export async function updateOnChainAlert(
  alertId: string,
  userId: string,
  updates: Partial<OnChainAlert>
): Promise<OnChainAlert> {
  const { data, error } = await supabase
    .from('onchain_alerts')
    .update(updates)
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete on-chain alert
 */
export async function deleteOnChainAlert(alertId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('onchain_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================
// CUSTOM DASHBOARDS (Pro Feature)
// ============================================

/**
 * Get user's dashboards
 */
export async function getUserDashboards(userId: string): Promise<OnChainDashboard[]> {
  const { data, error } = await supabase
    .from('onchain_dashboards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get dashboard by ID
 */
export async function getDashboard(dashboardId: string): Promise<OnChainDashboard | null> {
  const { data, error } = await supabase
    .from('onchain_dashboards')
    .select('*')
    .eq('id', dashboardId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  // Increment views if public
  if (data?.is_public) {
    await supabase
      .from('onchain_dashboards')
      .update({ views_count: data.views_count + 1 })
      .eq('id', dashboardId);
  }

  return data;
}

/**
 * Get dashboard by share slug
 */
export async function getDashboardBySlug(slug: string): Promise<OnChainDashboard | null> {
  const { data, error } = await supabase
    .from('onchain_dashboards')
    .select('*')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Create dashboard
 */
export async function createDashboard(
  userId: string,
  dashboard: {
    name: string;
    description?: string;
    is_default?: boolean;
    is_public?: boolean;
    layout?: OnChainDashboard['layout'];
    widgets?: OnChainDashboard['widgets'];
    filters?: OnChainDashboard['filters'];
  }
): Promise<OnChainDashboard> {
  // Check if user has Pro access for custom dashboards
  const tier = await getUserTier(userId);
  if (tier === 'basic') {
    throw new Error('Custom dashboards require a Pro subscription');
  }

  const shareSlug = dashboard.is_public
    ? `${dashboard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
    : null;

  const { data, error } = await supabase
    .from('onchain_dashboards')
    .insert({
      user_id: userId,
      name: dashboard.name,
      description: dashboard.description,
      is_default: dashboard.is_default || false,
      is_public: dashboard.is_public || false,
      layout: dashboard.layout || [],
      widgets: dashboard.widgets || [],
      filters: dashboard.filters || {},
      share_slug: shareSlug,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update dashboard
 */
export async function updateDashboard(
  dashboardId: string,
  userId: string,
  updates: Partial<OnChainDashboard>
): Promise<OnChainDashboard> {
  const { data, error } = await supabase
    .from('onchain_dashboards')
    .update(updates)
    .eq('id', dashboardId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete dashboard
 */
export async function deleteDashboard(dashboardId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('onchain_dashboards')
    .delete()
    .eq('id', dashboardId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================
// FULL DASHBOARD RESPONSE
// ============================================

/**
 * Get full dashboard response with metrics
 */
export async function getOnChainDashboardData(
  userId: string,
  asset: string = 'BTC'
): Promise<OnChainDashboardResponse> {
  const [subscription, alerts] = await Promise.all([
    getOnChainSubscription(userId),
    getOnChainAlerts(userId),
  ]);

  const tier = subscription?.status === 'active' ? subscription.tier : 'basic';
  const accessibleMetrics = tier === 'basic' ? FREE_METRICS : undefined; // undefined = all metrics

  // Get metrics based on tier
  const metricTypes: OnChainMetricType[] = accessibleMetrics || [
    'active_addresses',
    'transaction_count',
    'transaction_volume',
    'exchange_inflow',
    'exchange_outflow',
    'exchange_netflow',
    'hash_rate',
    'nvt_ratio',
    'mvrv_ratio',
    'sopr',
  ];

  const metrics = await getMetrics({
    asset,
    metric_types: metricTypes,
    limit: 30,
  });

  // Import the categories from types
  const { ON_CHAIN_METRIC_CATEGORIES } = await import('../types/monetization');

  return {
    metrics,
    alerts,
    subscription,
    available_metrics: ON_CHAIN_METRIC_CATEGORIES,
  };
}

// ============================================
// DEMO DATA
// ============================================

export function generateDemoMetrics(
  asset: string = 'BTC',
  metricType: OnChainMetricType,
  days: number = 30
): OnChainMetric[] {
  const metrics: OnChainMetric[] = [];
  const now = new Date();

  const baseValues: Record<OnChainMetricType, number> = {
    active_addresses: 950000,
    transaction_count: 350000,
    transaction_volume: 25000000000,
    exchange_inflow: 15000,
    exchange_outflow: 18000,
    exchange_netflow: -3000,
    miner_revenue: 25000000,
    miner_outflow: 500,
    hash_rate: 450000000,
    difficulty: 65000000000000,
    block_size: 1500000,
    fees: 2500000,
    nvt_ratio: 65,
    mvrv_ratio: 1.8,
    sopr: 1.02,
    realized_cap: 450000000000,
    thermocap: 28000000000,
    supply_held_1y_plus: 67.5,
    whale_transactions: 1250,
    large_transactions: 8500,
    stablecoin_supply: 130000000000,
    defi_tvl: 85000000000,
  };

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const baseValue = baseValues[metricType] || 1000;
    const noise = (Math.random() - 0.5) * 0.1 * baseValue;
    const trend = Math.sin(i * 0.1) * 0.05 * baseValue;

    metrics.push({
      id: `demo-${metricType}-${i}`,
      asset_symbol: asset,
      asset_name: asset === 'BTC' ? 'Bitcoin' : asset,
      chain: 'bitcoin',
      metric_type: metricType,
      timestamp: date.toISOString(),
      value: baseValue + noise + trend,
      value_usd: null,
      change_24h: (Math.random() - 0.5) * 10,
      change_7d: (Math.random() - 0.5) * 20,
      change_30d: (Math.random() - 0.5) * 30,
      aggregation_period: 'daily',
      data_source: 'demo',
      created_at: date.toISOString(),
    });
  }

  return metrics;
}

export const DEMO_DASHBOARD_WIDGETS = [
  {
    id: 'widget-1',
    type: 'chart' as const,
    title: 'Active Addresses',
    config: {
      metric: 'active_addresses',
      chartType: 'line',
      timeframe: '30d',
    },
  },
  {
    id: 'widget-2',
    type: 'metric' as const,
    title: 'Exchange Net Flow',
    config: {
      metric: 'exchange_netflow',
      showChange: true,
    },
  },
  {
    id: 'widget-3',
    type: 'chart' as const,
    title: 'MVRV Ratio',
    config: {
      metric: 'mvrv_ratio',
      chartType: 'area',
      timeframe: '90d',
    },
  },
  {
    id: 'widget-4',
    type: 'heatmap' as const,
    title: 'Holder Distribution',
    config: {
      metric: 'supply_held_1y_plus',
    },
  },
];
