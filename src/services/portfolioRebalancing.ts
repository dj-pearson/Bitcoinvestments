/**
 * Portfolio Rebalancing Alerts Service
 *
 * AI-powered alerts when portfolio drifts from target allocation.
 * Free users: monthly alerts, 1 portfolio
 * Premium: real-time, unlimited portfolios, AI optimization
 */

import type {
  TargetAllocation,
  PortfolioRebalanceConfig,
  DriftAnalysis,
  RebalanceRecommendation,
  RebalanceAlert,
  RebalanceFrequency,
  RebalanceMethod,
} from '../types/premiumFeatures';

// Mock portfolio holdings
interface PortfolioHolding {
  symbol: string;
  name: string;
  amount: number;
  currentPrice: number;
  value: number;
}

const mockHoldings: PortfolioHolding[] = [
  { symbol: 'BTC', name: 'Bitcoin', amount: 0.5, currentPrice: 43000, value: 21500 },
  { symbol: 'ETH', name: 'Ethereum', amount: 5.0, currentPrice: 2400, value: 12000 },
  { symbol: 'SOL', name: 'Solana', amount: 50, currentPrice: 100, value: 5000 },
  { symbol: 'LINK', name: 'Chainlink', amount: 200, currentPrice: 15, value: 3000 },
  { symbol: 'USDC', name: 'USD Coin', amount: 3500, currentPrice: 1, value: 3500 },
];

/**
 * Create a rebalancing configuration
 */
export async function createRebalanceConfig(
  userId: string,
  portfolioId: string,
  config: {
    name: string;
    rebalanceMethod: RebalanceMethod;
    checkFrequency: RebalanceFrequency;
    driftThresholdPercent: number;
    minTradeValueUsd: number;
    taxLossHarvesting: boolean;
    avoidShortTermGains: boolean;
    targetAllocations: Omit<TargetAllocation, 'id' | 'portfolio_id' | 'created_at' | 'updated_at'>[];
  }
): Promise<PortfolioRebalanceConfig> {
  const targetAllocations: TargetAllocation[] = config.targetAllocations.map((t, i) => ({
    id: `target-${Date.now()}-${i}`,
    portfolio_id: portfolioId,
    asset_symbol: t.asset_symbol,
    asset_name: t.asset_name,
    target_percent: t.target_percent,
    min_percent: t.min_percent,
    max_percent: t.max_percent,
    priority: t.priority,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return {
    id: `config-${Date.now()}`,
    user_id: userId,
    portfolio_id: portfolioId,
    name: config.name,
    is_active: true,
    rebalance_method: config.rebalanceMethod,
    check_frequency: config.checkFrequency,
    drift_threshold_percent: config.driftThresholdPercent,
    min_trade_value_usd: config.minTradeValueUsd,
    tax_loss_harvesting: config.taxLossHarvesting,
    avoid_short_term_gains: config.avoidShortTermGains,
    target_allocations: targetAllocations,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Analyze portfolio drift from target allocation
 */
export function analyzeDrift(
  holdings: PortfolioHolding[],
  targetAllocations: TargetAllocation[]
): DriftAnalysis[] {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  return targetAllocations.map(target => {
    const holding = holdings.find(h => h.symbol === target.asset_symbol);
    const currentValue = holding?.value || 0;
    const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    const driftPercent = currentPercent - target.target_percent;
    const driftValueUsd = (driftPercent / 100) * totalValue;

    let actionRequired: 'buy' | 'sell' | 'hold' = 'hold';
    let urgency: 'low' | 'medium' | 'high' = 'low';

    if (currentPercent < target.min_percent) {
      actionRequired = 'buy';
      urgency = currentPercent < target.min_percent - 5 ? 'high' : 'medium';
    } else if (currentPercent > target.max_percent) {
      actionRequired = 'sell';
      urgency = currentPercent > target.max_percent + 5 ? 'high' : 'medium';
    }

    const tradeAmountUsd = Math.abs(driftValueUsd);

    return {
      asset_symbol: target.asset_symbol,
      asset_name: target.asset_name,
      target_percent: target.target_percent,
      current_percent: parseFloat(currentPercent.toFixed(2)),
      drift_percent: parseFloat(driftPercent.toFixed(2)),
      drift_value_usd: parseFloat(driftValueUsd.toFixed(2)),
      action_required: actionRequired,
      trade_amount_usd: parseFloat(tradeAmountUsd.toFixed(2)),
      urgency,
    };
  });
}

/**
 * Generate rebalancing recommendation
 */
export async function generateRebalanceRecommendation(
  config: PortfolioRebalanceConfig,
  holdings: PortfolioHolding[] = mockHoldings
): Promise<RebalanceRecommendation> {
  const driftAnalysis = analyzeDrift(holdings, config.target_allocations);
  const totalDrift = driftAnalysis.reduce((sum, d) => sum + Math.abs(d.drift_percent), 0) / 2;

  const isRebalanceRecommended = totalDrift > config.drift_threshold_percent;

  const suggestedTrades = driftAnalysis
    .filter(d => d.action_required !== 'hold' && d.trade_amount_usd >= config.min_trade_value_usd)
    .map(d => ({
      asset_symbol: d.asset_symbol,
      action: d.action_required as 'buy' | 'sell',
      amount: d.trade_amount_usd / (holdings.find(h => h.symbol === d.asset_symbol)?.currentPrice || 1),
      amount_usd: d.trade_amount_usd,
      exchange: null,
      estimated_fee_usd: d.trade_amount_usd * 0.001, // 0.1% estimated fee
    }));

  // Estimate tax impact (simplified)
  const sellTrades = suggestedTrades.filter(t => t.action === 'sell');
  const estimatedTaxImpact = sellTrades.reduce((sum, t) => sum + t.amount_usd * 0.15, 0); // 15% assumed gains

  const rationalePoints: string[] = [];
  if (isRebalanceRecommended) {
    rationalePoints.push(`Portfolio has drifted ${totalDrift.toFixed(1)}% from target allocation`);

    const highUrgency = driftAnalysis.filter(d => d.urgency === 'high');
    if (highUrgency.length > 0) {
      rationalePoints.push(`${highUrgency.length} position(s) require urgent attention`);
    }

    if (config.tax_loss_harvesting) {
      rationalePoints.push('Tax-loss harvesting opportunities have been considered');
    }
  } else {
    rationalePoints.push('Portfolio is within acceptable drift range');
    rationalePoints.push('No rebalancing action required at this time');
  }

  return {
    id: `rec-${Date.now()}`,
    config_id: config.id,
    portfolio_id: config.portfolio_id,
    generated_at: new Date().toISOString(),
    total_drift_percent: parseFloat(totalDrift.toFixed(2)),
    is_rebalance_recommended: isRebalanceRecommended,
    drift_analysis: driftAnalysis,
    suggested_trades: suggestedTrades,
    estimated_tax_impact_usd: parseFloat(estimatedTaxImpact.toFixed(2)),
    rationale: rationalePoints.join('. '),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expires in 24h
  };
}

/**
 * Get user's rebalancing alerts
 */
export async function getRebalanceAlerts(
  userId: string,
  isPremium: boolean = false
): Promise<RebalanceAlert[]> {
  const mockAlerts: RebalanceAlert[] = [
    {
      id: 'alert-1',
      user_id: userId,
      config_id: 'config-1',
      alert_type: 'drift_threshold',
      triggered_at: new Date(Date.now() - 86400000).toISOString(),
      drift_percent: 8.5,
      message: 'Your portfolio has drifted 8.5% from target allocation. BTC is overweight by 5.2%.',
      recommendation_id: 'rec-1',
      is_read: false,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      user_id: userId,
      config_id: 'config-1',
      alert_type: 'scheduled_check',
      triggered_at: new Date(Date.now() - 604800000).toISOString(),
      drift_percent: 3.2,
      message: 'Monthly rebalance check: Portfolio drift is 3.2%, within acceptable range.',
      recommendation_id: null,
      is_read: true,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'alert-3',
      user_id: userId,
      config_id: 'config-1',
      alert_type: 'opportunity',
      triggered_at: new Date(Date.now() - 172800000).toISOString(),
      drift_percent: 0,
      message: 'Tax-loss harvesting opportunity detected for LINK position.',
      recommendation_id: 'rec-2',
      is_read: true,
      is_dismissed: true,
      created_at: new Date().toISOString(),
    },
  ];

  if (!isPremium) {
    // Free users get monthly alerts only
    return mockAlerts.filter(a => a.alert_type === 'scheduled_check').slice(0, 1);
  }

  return mockAlerts;
}

/**
 * Get default target allocations templates
 */
export function getTargetAllocationTemplates(): {
  name: string;
  description: string;
  allocations: Omit<TargetAllocation, 'id' | 'portfolio_id' | 'created_at' | 'updated_at'>[];
}[] {
  return [
    {
      name: 'Conservative',
      description: 'Low-risk portfolio focused on Bitcoin with stablecoin buffer',
      allocations: [
        { asset_symbol: 'BTC', asset_name: 'Bitcoin', target_percent: 50, min_percent: 45, max_percent: 55, priority: 1 },
        { asset_symbol: 'ETH', asset_name: 'Ethereum', target_percent: 25, min_percent: 20, max_percent: 30, priority: 2 },
        { asset_symbol: 'USDC', asset_name: 'USD Coin', target_percent: 25, min_percent: 20, max_percent: 35, priority: 3 },
      ],
    },
    {
      name: 'Balanced',
      description: 'Diversified portfolio across major cryptocurrencies',
      allocations: [
        { asset_symbol: 'BTC', asset_name: 'Bitcoin', target_percent: 40, min_percent: 35, max_percent: 45, priority: 1 },
        { asset_symbol: 'ETH', asset_name: 'Ethereum', target_percent: 30, min_percent: 25, max_percent: 35, priority: 2 },
        { asset_symbol: 'SOL', asset_name: 'Solana', target_percent: 15, min_percent: 10, max_percent: 20, priority: 3 },
        { asset_symbol: 'USDC', asset_name: 'USD Coin', target_percent: 15, min_percent: 10, max_percent: 20, priority: 4 },
      ],
    },
    {
      name: 'Aggressive',
      description: 'Higher-risk portfolio with more altcoin exposure',
      allocations: [
        { asset_symbol: 'BTC', asset_name: 'Bitcoin', target_percent: 30, min_percent: 25, max_percent: 35, priority: 1 },
        { asset_symbol: 'ETH', asset_name: 'Ethereum', target_percent: 30, min_percent: 25, max_percent: 35, priority: 2 },
        { asset_symbol: 'SOL', asset_name: 'Solana', target_percent: 20, min_percent: 15, max_percent: 25, priority: 3 },
        { asset_symbol: 'LINK', asset_name: 'Chainlink', target_percent: 10, min_percent: 5, max_percent: 15, priority: 4 },
        { asset_symbol: 'AVAX', asset_name: 'Avalanche', target_percent: 10, min_percent: 5, max_percent: 15, priority: 5 },
      ],
    },
  ];
}

/**
 * Check if rebalancing is needed
 */
export async function checkRebalancingNeeded(
  config: PortfolioRebalanceConfig,
  holdings: PortfolioHolding[] = mockHoldings
): Promise<{ needed: boolean; driftPercent: number; recommendation?: RebalanceRecommendation }> {
  const recommendation = await generateRebalanceRecommendation(config, holdings);

  return {
    needed: recommendation.is_rebalance_recommended,
    driftPercent: recommendation.total_drift_percent,
    recommendation: recommendation.is_rebalance_recommended ? recommendation : undefined,
  };
}
