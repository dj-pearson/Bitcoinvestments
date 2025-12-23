/**
 * Smart Alert Bundles Service
 *
 * Pre-configured alert packages for different trading strategies.
 * Individual bundles: $4.99-9.99/month per bundle
 * Free users: 1 free bundle preview
 */

import type {
  AlertBundle,
  UserAlertBundleSubscription,
  BundlePerformance,
  AlertBundleCategory,
} from '../types/premiumFeatures';

// Complete alert bundles with templates
const alertBundles: AlertBundle[] = [
  {
    id: 'bull-run-signals',
    name: 'Bull Run Signals',
    slug: 'bull-run-signals',
    description: 'Get alerted to potential bull market signals including golden crosses, volume breakouts, and accumulation patterns.',
    category: 'bull_run',
    icon: 'TrendingUp',
    price_monthly: 9.99,
    price_yearly: 99.99,
    alerts_included: [
      { id: 'bull-1', bundle_id: 'bull-run-signals', name: 'Golden Cross Alert', description: '50-day MA crosses above 200-day MA', alert_type: 'technical', conditions: [{ metric: 'ma_crossover', operator: 'crosses_above', value: 'golden', timeframe: '1d' }], assets: ['BTC', 'ETH'], notification_channels: ['email', 'push'], cooldown_minutes: 1440, is_configurable: false },
      { id: 'bull-2', bundle_id: 'bull-run-signals', name: 'Volume Breakout', description: 'Volume exceeds 3x 20-day average', alert_type: 'volume', conditions: [{ metric: 'volume_ratio', operator: 'gt', value: 3, timeframe: '1d' }], assets: 'all', notification_channels: ['email', 'push'], cooldown_minutes: 360, is_configurable: true },
      { id: 'bull-3', bundle_id: 'bull-run-signals', name: 'RSI Oversold Recovery', description: 'RSI crosses above 30 after being oversold', alert_type: 'technical', conditions: [{ metric: 'rsi', operator: 'crosses_above', value: 30, timeframe: '4h' }], assets: ['BTC', 'ETH', 'SOL'], notification_channels: ['push'], cooldown_minutes: 240, is_configurable: true },
      { id: 'bull-4', bundle_id: 'bull-run-signals', name: 'MACD Bullish Crossover', description: 'MACD line crosses above signal line', alert_type: 'technical', conditions: [{ metric: 'macd_crossover', operator: 'crosses_above', value: 'signal', timeframe: '1d' }], assets: ['BTC', 'ETH'], notification_channels: ['email'], cooldown_minutes: 1440, is_configurable: false },
    ],
    is_featured: true,
    subscriber_count: 2547,
    success_rate: 72.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'crash-protection',
    name: 'Crash Protection',
    slug: 'crash-protection',
    description: 'Early warning system for market downturns. Tracks death crosses, exchange inflows, and panic selling indicators.',
    category: 'crash_protection',
    icon: 'Shield',
    price_monthly: 7.99,
    price_yearly: 79.99,
    alerts_included: [
      { id: 'crash-1', bundle_id: 'crash-protection', name: 'Death Cross Warning', description: '50-day MA crosses below 200-day MA', alert_type: 'technical', conditions: [{ metric: 'ma_crossover', operator: 'crosses_below', value: 'death', timeframe: '1d' }], assets: ['BTC', 'ETH'], notification_channels: ['email', 'push', 'sms'], cooldown_minutes: 1440, is_configurable: false },
      { id: 'crash-2', bundle_id: 'crash-protection', name: 'Large Exchange Inflow', description: 'Significant BTC/ETH flowing into exchanges', alert_type: 'on_chain', conditions: [{ metric: 'exchange_inflow', operator: 'gt', value: 10000, timeframe: '1h' }], assets: ['BTC', 'ETH'], notification_channels: ['email', 'push'], cooldown_minutes: 60, is_configurable: true },
      { id: 'crash-3', bundle_id: 'crash-protection', name: 'RSI Overbought Alert', description: 'RSI exceeds 80, potential reversal', alert_type: 'technical', conditions: [{ metric: 'rsi', operator: 'gt', value: 80, timeframe: '4h' }], assets: ['BTC', 'ETH'], notification_channels: ['push'], cooldown_minutes: 240, is_configurable: true },
      { id: 'crash-4', bundle_id: 'crash-protection', name: 'High Fear & Greed', description: 'Market enters extreme greed zone', alert_type: 'on_chain', conditions: [{ metric: 'fear_greed', operator: 'gt', value: 80 }], assets: 'all', notification_channels: ['email'], cooldown_minutes: 1440, is_configurable: false },
    ],
    is_featured: true,
    subscriber_count: 4123,
    success_rate: 68.3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'defi-opportunities',
    name: 'DeFi Opportunities',
    slug: 'defi-opportunities',
    description: 'Discover high-yield DeFi opportunities. Alerts for new pools, APY spikes, and liquidity mining rewards.',
    category: 'defi_opportunities',
    icon: 'Layers',
    price_monthly: 4.99,
    price_yearly: 49.99,
    alerts_included: [
      { id: 'defi-1', bundle_id: 'defi-opportunities', name: 'High APY Pool', description: 'New pool with APY above 50%', alert_type: 'on_chain', conditions: [{ metric: 'pool_apy', operator: 'gt', value: 50 }], assets: 'all', notification_channels: ['email', 'push'], cooldown_minutes: 60, is_configurable: true },
      { id: 'defi-2', bundle_id: 'defi-opportunities', name: 'TVL Surge', description: 'Protocol TVL increases by 20%+ in 24h', alert_type: 'on_chain', conditions: [{ metric: 'tvl_change_24h', operator: 'gt', value: 20 }], assets: 'all', notification_channels: ['email'], cooldown_minutes: 720, is_configurable: true },
      { id: 'defi-3', bundle_id: 'defi-opportunities', name: 'New Farming Opportunity', description: 'New liquidity mining program launched', alert_type: 'news', conditions: [{ metric: 'news_category', operator: 'eq', value: 'farming_launch' }], assets: 'all', notification_channels: ['push'], cooldown_minutes: 120, is_configurable: false },
    ],
    is_featured: false,
    subscriber_count: 1832,
    success_rate: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'whale-tracker',
    name: 'Whale Activity Tracker',
    slug: 'whale-tracker',
    description: 'Follow the smart money. Real-time alerts when whales move significant amounts on major chains.',
    category: 'whale_activity',
    icon: 'Fish',
    price_monthly: 6.99,
    price_yearly: 69.99,
    alerts_included: [
      { id: 'whale-1', bundle_id: 'whale-tracker', name: 'Large BTC Transfer', description: 'BTC transfer over $10M', alert_type: 'whale', conditions: [{ metric: 'transfer_amount_usd', operator: 'gt', value: 10000000 }], assets: ['BTC'], notification_channels: ['push'], cooldown_minutes: 15, is_configurable: true },
      { id: 'whale-2', bundle_id: 'whale-tracker', name: 'Exchange Whale Deposit', description: 'Whale deposits to exchange', alert_type: 'whale', conditions: [{ metric: 'whale_exchange_deposit', operator: 'gt', value: 5000000 }], assets: ['BTC', 'ETH'], notification_channels: ['email', 'push'], cooldown_minutes: 30, is_configurable: true },
      { id: 'whale-3', bundle_id: 'whale-tracker', name: 'Accumulation Pattern', description: 'Whale wallet accumulating', alert_type: 'whale', conditions: [{ metric: 'accumulation_score', operator: 'gt', value: 80 }], assets: 'all', notification_channels: ['email'], cooldown_minutes: 1440, is_configurable: false },
    ],
    is_featured: true,
    subscriber_count: 3456,
    success_rate: 65.8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'technical-signals',
    name: 'Technical Signals Pro',
    slug: 'technical-signals',
    description: 'Automated technical analysis alerts. RSI extremes, MACD crossovers, and Bollinger Band breakouts.',
    category: 'technical_signals',
    icon: 'Activity',
    price_monthly: 8.99,
    price_yearly: 89.99,
    alerts_included: [
      { id: 'tech-1', bundle_id: 'technical-signals', name: 'Bollinger Squeeze', description: 'Bollinger Bands narrowing significantly', alert_type: 'technical', conditions: [{ metric: 'bb_width', operator: 'lt', value: 5, timeframe: '1d' }], assets: ['BTC', 'ETH', 'SOL'], notification_channels: ['push'], cooldown_minutes: 360, is_configurable: true },
      { id: 'tech-2', bundle_id: 'technical-signals', name: 'RSI Divergence', description: 'Price and RSI showing divergence', alert_type: 'technical', conditions: [{ metric: 'rsi_divergence', operator: 'eq', value: 'bullish', timeframe: '4h' }], assets: ['BTC', 'ETH'], notification_channels: ['email', 'push'], cooldown_minutes: 480, is_configurable: false },
      { id: 'tech-3', bundle_id: 'technical-signals', name: 'Support/Resistance Break', description: 'Key level broken', alert_type: 'technical', conditions: [{ metric: 'level_break', operator: 'eq', value: 'significant' }], assets: ['BTC', 'ETH'], notification_channels: ['push'], cooldown_minutes: 60, is_configurable: true },
      { id: 'tech-4', bundle_id: 'technical-signals', name: 'Trend Reversal Signal', description: 'Multiple indicators suggest reversal', alert_type: 'technical', conditions: [{ metric: 'reversal_score', operator: 'gt', value: 75 }], assets: 'all', notification_channels: ['email', 'push'], cooldown_minutes: 720, is_configurable: false },
    ],
    is_featured: false,
    subscriber_count: 2198,
    success_rate: 61.2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock user subscriptions
const mockUserSubscriptions: UserAlertBundleSubscription[] = [];

/**
 * Get all available alert bundles
 */
export async function getAlertBundles(): Promise<AlertBundle[]> {
  return alertBundles;
}

/**
 * Get bundle by ID
 */
export async function getBundleById(bundleId: string): Promise<AlertBundle | null> {
  return alertBundles.find(b => b.id === bundleId) || null;
}

/**
 * Get bundles by category
 */
export async function getBundlesByCategory(category: AlertBundleCategory): Promise<AlertBundle[]> {
  return alertBundles.filter(b => b.category === category);
}

/**
 * Get featured bundles
 */
export async function getFeaturedBundles(): Promise<AlertBundle[]> {
  return alertBundles.filter(b => b.is_featured);
}

/**
 * Subscribe to a bundle
 */
export async function subscribeToBundle(
  userId: string,
  bundleId: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<UserAlertBundleSubscription> {
  const bundle = alertBundles.find(b => b.id === bundleId);
  if (!bundle) throw new Error('Bundle not found');

  const price = billingCycle === 'monthly' ? bundle.price_monthly : bundle.price_yearly;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

  const subscription: UserAlertBundleSubscription = {
    id: `sub-${Date.now()}`,
    user_id: userId,
    bundle_id: bundleId,
    bundle_name: bundle.name,
    status: 'active',
    billing_cycle: billingCycle,
    price_paid: price,
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    cancelled_at: null,
    customizations: bundle.alerts_included.map(a => ({
      alert_id: a.id,
      is_enabled: true,
    })),
    alerts_triggered_count: 0,
    last_alert_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockUserSubscriptions.push(subscription);
  return subscription;
}

/**
 * Get user's bundle subscriptions
 */
export async function getUserBundleSubscriptions(userId: string): Promise<UserAlertBundleSubscription[]> {
  return mockUserSubscriptions.filter(s => s.user_id === userId && s.status === 'active');
}

/**
 * Cancel bundle subscription
 */
export async function cancelBundleSubscription(subscriptionId: string): Promise<void> {
  const sub = mockUserSubscriptions.find(s => s.id === subscriptionId);
  if (sub) {
    sub.status = 'cancelled';
    sub.cancelled_at = new Date().toISOString();
  }
}

/**
 * Customize bundle alerts
 */
export async function customizeBundleAlerts(
  subscriptionId: string,
  customizations: { alert_id: string; is_enabled: boolean; custom_value?: number | string }[]
): Promise<UserAlertBundleSubscription> {
  const sub = mockUserSubscriptions.find(s => s.id === subscriptionId);
  if (!sub) throw new Error('Subscription not found');

  sub.customizations = customizations;
  sub.updated_at = new Date().toISOString();

  return sub;
}

/**
 * Get bundle performance metrics
 */
export async function getBundlePerformance(
  bundleId: string,
  period: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<BundlePerformance> {
  const bundle = alertBundles.find(b => b.id === bundleId);
  if (!bundle) throw new Error('Bundle not found');

  // Mock performance data
  const alertsSent = Math.floor(Math.random() * 50) + 10;
  const accuracyRate = bundle.success_rate || 60;
  const alertsAccurate = Math.floor(alertsSent * accuracyRate / 100);

  return {
    bundle_id: bundleId,
    period,
    alerts_sent: alertsSent,
    alerts_accurate: alertsAccurate,
    accuracy_rate: accuracyRate,
    avg_response_time_hours: 2.5 + Math.random() * 4,
    notable_alerts: [
      {
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        alert_name: 'Golden Cross Alert',
        asset: 'BTC',
        price_at_alert: 42500,
        price_after_24h: 44200,
        was_accurate: true,
      },
      {
        date: new Date(Date.now() - 86400000 * 12).toISOString(),
        alert_name: 'RSI Oversold Recovery',
        asset: 'ETH',
        price_at_alert: 2280,
        price_after_24h: 2410,
        was_accurate: true,
      },
      {
        date: new Date(Date.now() - 86400000 * 18).toISOString(),
        alert_name: 'Volume Breakout',
        asset: 'SOL',
        price_at_alert: 98,
        price_after_24h: 95,
        was_accurate: false,
      },
    ],
  };
}

/**
 * Get total active subscribers for a bundle
 */
export async function getBundleSubscriberCount(bundleId: string): Promise<number> {
  const bundle = alertBundles.find(b => b.id === bundleId);
  return bundle?.subscriber_count || 0;
}
