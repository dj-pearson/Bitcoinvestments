/**
 * Gas Fee Optimizer Service
 *
 * Predict optimal times for Ethereum transactions to minimize gas fees.
 * Free: Basic current prices, 3 alerts
 * Premium: Real-time predictions, unlimited alerts, historical data
 */

import type {
  GasPriceData,
  GasPricePrediction,
  GasPriceHistory,
  GasAlert,
  GasPriceTier,
} from '../types/premiumFeatures';
import { GAS_USAGE_ESTIMATES, PREMIUM_FEATURES_PRICING } from '../types/premiumFeatures';

// Supported chains for gas tracking
export const SUPPORTED_GAS_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', decimals: 9 },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', decimals: 9 },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', decimals: 9 },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH', decimals: 9 },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', decimals: 9 },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', decimals: 9 },
  { id: 'base', name: 'Base', symbol: 'ETH', decimals: 9 },
] as const;

// Gas Optimizer Pricing
export const GAS_OPTIMIZER_PRICING = {
  free: {
    id: 'gas-optimizer-free',
    name: 'Gas Optimizer Free',
    price: 0,
    features: [
      'Current gas prices for all chains',
      'Basic transaction cost estimates',
      '3 price alerts',
      '24-hour price history',
    ],
    limits: {
      maxAlerts: 3,
      hasPredictions: false,
      hasRealtime: false,
      hasHistorical: false,
    },
  },
  premium: {
    id: 'gas-optimizer-premium',
    name: 'Gas Optimizer Pro',
    price_monthly: PREMIUM_FEATURES_PRICING.gas_optimizer.premium_monthly,
    price_yearly: PREMIUM_FEATURES_PRICING.gas_optimizer.premium_yearly,
    features: [
      'Real-time gas price updates',
      'AI-powered price predictions',
      'Optimal timing recommendations',
      '50 price alerts',
      '30-day price history',
      'Email & push notifications',
      'Transaction scheduling',
    ],
    limits: {
      maxAlerts: 50,
      hasPredictions: true,
      hasRealtime: true,
      hasHistorical: true,
    },
    stripePriceId: {
      monthly: import.meta.env.VITE_STRIPE_GAS_OPTIMIZER_MONTHLY || 'price_gas_monthly',
      yearly: import.meta.env.VITE_STRIPE_GAS_OPTIMIZER_YEARLY || 'price_gas_yearly',
    },
  },
} as const;

// Demo alert storage
const userAlerts: Map<string, GasAlert[]> = new Map();

/**
 * Get current gas prices for all supported chains
 */
export async function getCurrentGasPrices(): Promise<GasPriceData[]> {
  // In production, fetch from gas price APIs (Etherscan, Blocknative, etc.)
  // For demo, return simulated data

  const ethPrice = 2500; // USD
  const maticPrice = 0.85;
  const avaxPrice = 35;
  const bnbPrice = 310;

  return SUPPORTED_GAS_CHAINS.map(chain => {
    const baseGwei = getBaseGweiForChain(chain.id);
    const nativePrice = getNativePriceForChain(chain.id, ethPrice, maticPrice, avaxPrice, bnbPrice);

    return {
      chain: chain.id,
      chain_name: chain.name,
      native_token: chain.symbol,
      base_fee: baseGwei,
      priority_fee_slow: baseGwei * 0.1,
      priority_fee_standard: baseGwei * 0.2,
      priority_fee_fast: baseGwei * 0.5,
      priority_fee_instant: baseGwei * 1.0,
      gas_price_slow: baseGwei * 1.1,
      gas_price_standard: baseGwei * 1.2,
      gas_price_fast: baseGwei * 1.5,
      gas_price_instant: baseGwei * 2.0,
      transfer_cost_usd: calculateTransactionCosts(baseGwei, nativePrice, GAS_USAGE_ESTIMATES.eth_transfer),
      swap_cost_usd: calculateTransactionCosts(baseGwei, nativePrice, GAS_USAGE_ESTIMATES.uniswap_v3_swap),
      nft_mint_cost_usd: calculateTransactionCosts(baseGwei, nativePrice, GAS_USAGE_ESTIMATES.nft_mint),
      updated_at: new Date().toISOString(),
    };
  });
}

function getBaseGweiForChain(chainId: string): number {
  // Simulated base gas prices in Gwei
  const basePrices: Record<string, number> = {
    ethereum: 25 + Math.random() * 20,
    polygon: 50 + Math.random() * 100,
    arbitrum: 0.1 + Math.random() * 0.2,
    optimism: 0.001 + Math.random() * 0.005,
    avalanche: 25 + Math.random() * 10,
    bsc: 3 + Math.random() * 2,
    base: 0.01 + Math.random() * 0.05,
  };
  return basePrices[chainId] || 20;
}

function getNativePriceForChain(
  chainId: string,
  ethPrice: number,
  maticPrice: number,
  avaxPrice: number,
  bnbPrice: number
): number {
  const prices: Record<string, number> = {
    ethereum: ethPrice,
    polygon: maticPrice,
    arbitrum: ethPrice,
    optimism: ethPrice,
    avalanche: avaxPrice,
    bsc: bnbPrice,
    base: ethPrice,
  };
  return prices[chainId] || ethPrice;
}

function calculateTransactionCosts(
  baseGwei: number,
  nativePrice: number,
  gasUsed: number
): { slow: number; standard: number; fast: number; instant: number } {
  const gweiToEth = 1e-9;

  return {
    slow: baseGwei * 1.1 * gasUsed * gweiToEth * nativePrice,
    standard: baseGwei * 1.2 * gasUsed * gweiToEth * nativePrice,
    fast: baseGwei * 1.5 * gasUsed * gweiToEth * nativePrice,
    instant: baseGwei * 2.0 * gasUsed * gweiToEth * nativePrice,
  };
}

/**
 * Get gas price predictions for optimal transaction timing
 * Premium feature
 */
export async function getGasPricePredictions(
  chain: string,
  _hoursAhead: number = 24
): Promise<GasPricePrediction> {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  // Generate optimal time windows based on historical patterns
  // Gas is typically lowest during weekends and late night/early morning hours
  const optimalWindows = generateOptimalWindows(now, chain);

  // Prediction factors based on current network state
  const baseFee = getBaseGweiForChain(chain);

  return {
    chain,
    timestamp: now.toISOString(),
    predicted_gas_price: baseFee * 0.9, // Predict slightly lower
    confidence: 0.75 + Math.random() * 0.15, // 75-90% confidence
    optimal_time_windows: optimalWindows,
    prediction_factors: {
      hour_of_day: currentHour,
      day_of_week: currentDay,
      network_congestion: 0.3 + Math.random() * 0.4,
      pending_transactions: Math.floor(100000 + Math.random() * 50000),
      block_utilization: 0.5 + Math.random() * 0.3,
    },
  };
}

function generateOptimalWindows(
  now: Date,
  chain: string
): GasPricePrediction['optimal_time_windows'] {
  const windows: GasPricePrediction['optimal_time_windows'] = [];
  const baseFee = getBaseGweiForChain(chain);

  // Find next optimal windows (typically 2-6 AM UTC and weekends)
  for (let i = 0; i < 48; i++) {
    const windowStart = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hour = windowStart.getUTCHours();
    const day = windowStart.getUTCDay();

    // Low gas hours: 2-6 AM UTC, weekends
    const isLowHour = hour >= 2 && hour <= 6;
    const isWeekend = day === 0 || day === 6;

    if (isLowHour || isWeekend) {
      const savingsMultiplier = isLowHour && isWeekend ? 0.5 : isLowHour ? 0.6 : 0.75;
      const predictedPrice = baseFee * savingsMultiplier;
      const savingsPercent = ((baseFee - predictedPrice) / baseFee) * 100;

      windows.push({
        start: windowStart.toISOString(),
        end: new Date(windowStart.getTime() + 60 * 60 * 1000).toISOString(),
        predicted_price: predictedPrice,
        savings_percent: savingsPercent,
      });

      if (windows.length >= 5) break;
    }
  }

  return windows;
}

/**
 * Get historical gas prices
 * Premium feature for 30-day history
 */
export async function getGasPriceHistory(
  chain: string,
  hours: number = 24
): Promise<GasPriceHistory[]> {
  const history: GasPriceHistory[] = [];
  const now = Date.now();

  for (let i = 0; i < hours; i++) {
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    const hour = timestamp.getUTCHours();

    // Simulate lower gas during off-peak hours
    const peakMultiplier = hour >= 14 && hour <= 22 ? 1.5 : hour >= 2 && hour <= 6 ? 0.6 : 1.0;
    const baseFee = getBaseGweiForChain(chain) * peakMultiplier;

    history.push({
      id: `history_${chain}_${i}`,
      chain,
      timestamp: timestamp.toISOString(),
      base_fee: baseFee,
      priority_fee: baseFee * 0.2,
      gas_price: baseFee * 1.2,
      block_number: 18500000 - i * 300,
      block_utilization: 0.5 + Math.random() * 0.4,
      pending_transactions: Math.floor(80000 + Math.random() * 40000),
    });
  }

  return history.reverse();
}

/**
 * Create a gas price alert
 */
export async function createGasAlert(
  userId: string,
  chain: string,
  thresholdGwei: number,
  condition: 'below' | 'above' | 'optimal_detected',
  notifyEmail: boolean = true,
  notifyPush: boolean = true
): Promise<{ alert: GasAlert | null; error: string | null }> {
  const existingAlerts = userAlerts.get(userId) || [];

  // Check limits (free: 3, premium: 50)
  const maxAlerts = GAS_OPTIMIZER_PRICING.free.limits.maxAlerts; // Would check subscription in production

  if (existingAlerts.length >= maxAlerts) {
    return {
      alert: null,
      error: `You have reached the maximum of ${maxAlerts} alerts. Upgrade to Premium for more alerts.`,
    };
  }

  const alert: GasAlert = {
    id: `gasalert_${Date.now()}`,
    user_id: userId,
    chain,
    alert_type: condition === 'optimal_detected' ? 'optimal_time' : 'price_threshold',
    condition,
    threshold_gwei: thresholdGwei,
    is_active: true,
    triggered_at: null,
    notify_email: notifyEmail,
    notify_push: notifyPush,
    cooldown_minutes: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  existingAlerts.push(alert);
  userAlerts.set(userId, existingAlerts);

  return { alert, error: null };
}

/**
 * Get user's gas alerts
 */
export function getUserGasAlerts(userId: string): GasAlert[] {
  return userAlerts.get(userId) || [];
}

/**
 * Delete a gas alert
 */
export async function deleteGasAlert(
  userId: string,
  alertId: string
): Promise<{ success: boolean; error: string | null }> {
  const alerts = userAlerts.get(userId) || [];
  const index = alerts.findIndex(a => a.id === alertId);

  if (index === -1) {
    return { success: false, error: 'Alert not found' };
  }

  alerts.splice(index, 1);
  userAlerts.set(userId, alerts);

  return { success: true, error: null };
}

/**
 * Toggle alert active status
 */
export async function toggleGasAlert(
  userId: string,
  alertId: string
): Promise<{ alert: GasAlert | null; error: string | null }> {
  const alerts = userAlerts.get(userId) || [];
  const alert = alerts.find(a => a.id === alertId);

  if (!alert) {
    return { alert: null, error: 'Alert not found' };
  }

  alert.is_active = !alert.is_active;
  alert.updated_at = new Date().toISOString();

  return { alert, error: null };
}

/**
 * Estimate transaction cost
 */
export function estimateTransactionCost(
  gasPrice: GasPriceData,
  transactionType: keyof typeof GAS_USAGE_ESTIMATES,
  tier: GasPriceTier = 'standard'
): { gasUsed: number; costGwei: number; costUsd: number } {
  const gasUsed = GAS_USAGE_ESTIMATES[transactionType];
  const priceKey = `gas_price_${tier}` as keyof GasPriceData;
  const gasPriceGwei = gasPrice[priceKey] as number;

  const costKey = `${transactionType === 'eth_transfer' ? 'transfer' : transactionType === 'uniswap_v3_swap' ? 'swap' : 'nft_mint'}_cost_usd` as keyof GasPriceData;
  const costs = gasPrice[costKey] as { slow: number; standard: number; fast: number; instant: number };

  return {
    gasUsed,
    costGwei: gasPriceGwei * gasUsed,
    costUsd: costs[tier],
  };
}

/**
 * Get gas savings by waiting
 */
export function calculatePotentialSavings(
  currentPrice: number,
  predictedLowPrice: number,
  gasUsed: number,
  nativeTokenPrice: number
): { savingsGwei: number; savingsUsd: number; savingsPercent: number } {
  const currentCostGwei = currentPrice * gasUsed;
  const lowCostGwei = predictedLowPrice * gasUsed;
  const savingsGwei = currentCostGwei - lowCostGwei;

  const gweiToEth = 1e-9;
  const savingsUsd = savingsGwei * gweiToEth * nativeTokenPrice;
  const savingsPercent = (savingsGwei / currentCostGwei) * 100;

  return { savingsGwei, savingsUsd, savingsPercent };
}

/**
 * Format gas price for display
 */
export function formatGasPrice(gwei: number): string {
  if (gwei < 0.01) return `${(gwei * 1000).toFixed(2)} mGwei`;
  if (gwei < 1) return `${gwei.toFixed(3)} Gwei`;
  if (gwei < 100) return `${gwei.toFixed(1)} Gwei`;
  return `${Math.round(gwei)} Gwei`;
}

/**
 * Get recommended tier based on urgency
 */
export function getRecommendedTier(
  urgency: 'low' | 'medium' | 'high' | 'immediate'
): { tier: GasPriceTier; waitTime: string } {
  switch (urgency) {
    case 'immediate':
      return { tier: 'instant', waitTime: '~15 seconds' };
    case 'high':
      return { tier: 'fast', waitTime: '~30 seconds' };
    case 'medium':
      return { tier: 'standard', waitTime: '~2 minutes' };
    case 'low':
    default:
      return { tier: 'slow', waitTime: '~5 minutes' };
  }
}
