import type { FeeCalculatorInput, FeeCalculatorResult, Exchange } from '../../types';
import { exchanges } from '../../data/exchanges';

/**
 * Calculate total fees for a trade on a specific exchange
 */
export function calculateTradeFees(input: FeeCalculatorInput): FeeCalculatorResult {
  const { exchange_id, trade_amount, trade_type, payment_method } = input;

  const exchange = exchanges.find(e => e.id === exchange_id);

  if (!exchange) {
    throw new Error(`Exchange with id ${exchange_id} not found`);
  }

  // Calculate trading fee (using taker fee for simplicity - instant orders)
  const tradingFeeRate = exchange.fees.taker_fee;
  const tradingFee = trade_amount * tradingFeeRate;

  // Calculate deposit fee (only for buying with fiat)
  let depositFee = 0;
  if (trade_type === 'buy' && payment_method !== 'crypto') {
    if (payment_method === 'card') {
      // Card deposits typically have higher fees (around 2-4%)
      depositFee = trade_amount * 0.029; // 2.9% average
    } else if (payment_method === 'bank' && exchange.fees.deposit_fee_fiat) {
      depositFee = exchange.fees.deposit_fee_fiat;
    }
  }

  // Calculate withdrawal fee (for selling and withdrawing fiat)
  let withdrawalFee = 0;
  if (trade_type === 'sell' && payment_method !== 'crypto') {
    if (exchange.fees.withdrawal_fee_fiat) {
      withdrawalFee = exchange.fees.withdrawal_fee_fiat;
    }
  }

  const totalFees = tradingFee + depositFee + withdrawalFee;
  const netAmount = trade_type === 'buy'
    ? trade_amount - totalFees
    : trade_amount - totalFees;
  const feePercentage = (totalFees / trade_amount) * 100;

  return {
    exchange_name: exchange.name,
    trade_amount,
    trading_fee: tradingFee,
    deposit_fee: depositFee,
    withdrawal_fee: withdrawalFee,
    total_fees: totalFees,
    net_amount: netAmount,
    fee_percentage: feePercentage,
  };
}

/**
 * Compare fees across all exchanges for a given trade
 */
export function compareExchangeFees(
  trade_amount: number,
  trade_type: 'buy' | 'sell',
  payment_method: 'bank' | 'card' | 'crypto'
): FeeCalculatorResult[] {
  const results: FeeCalculatorResult[] = [];

  for (const exchange of exchanges) {
    try {
      const result = calculateTradeFees({
        exchange_id: exchange.id,
        trade_amount,
        trade_type,
        payment_method,
      });
      results.push(result);
    } catch {
      // Skip exchanges that throw errors
      continue;
    }
  }

  // Sort by total fees (lowest first)
  return results.sort((a, b) => a.total_fees - b.total_fees);
}

/**
 * Calculate the total cost of a round-trip trade (buy and sell)
 */
export function calculateRoundTripFees(
  exchange: Exchange,
  amount: number,
  buyMethod: 'bank' | 'card' | 'crypto',
  sellMethod: 'bank' | 'card' | 'crypto'
): {
  buyFees: FeeCalculatorResult;
  sellFees: FeeCalculatorResult;
  totalFees: number;
  totalFeePercentage: number;
} {
  const buyFees = calculateTradeFees({
    exchange_id: exchange.id,
    trade_amount: amount,
    trade_type: 'buy',
    payment_method: buyMethod,
  });

  // Calculate sell fees on the net amount after buying
  const amountAfterBuy = buyFees.net_amount;
  const sellFees = calculateTradeFees({
    exchange_id: exchange.id,
    trade_amount: amountAfterBuy,
    trade_type: 'sell',
    payment_method: sellMethod,
  });

  const totalFees = buyFees.total_fees + sellFees.total_fees;
  const totalFeePercentage = (totalFees / amount) * 100;

  return {
    buyFees,
    sellFees,
    totalFees,
    totalFeePercentage,
  };
}

/**
 * Calculate crypto withdrawal fees for a specific amount
 */
export function calculateCryptoWithdrawalFee(
  exchange: Exchange,
  crypto: 'btc' | 'eth',
  amount: number,
  currentPrice: number
): {
  feeInCrypto: number;
  feeInUsd: number;
  feePercentage: number;
  netAmount: number;
} {
  const feeInCrypto = crypto === 'btc'
    ? (exchange.fees.withdrawal_fee_btc || 0.0005)
    : (exchange.fees.withdrawal_fee_eth || 0.005);

  const feeInUsd = feeInCrypto * currentPrice;
  const totalValueUsd = amount * currentPrice;
  const feePercentage = (feeInUsd / totalValueUsd) * 100;
  const netAmount = amount - feeInCrypto;

  return {
    feeInCrypto,
    feeInUsd,
    feePercentage,
    netAmount,
  };
}

/**
 * Find the cheapest exchange for a specific trade scenario
 */
export function findCheapestExchange(
  trade_amount: number,
  trade_type: 'buy' | 'sell',
  payment_method: 'bank' | 'card' | 'crypto'
): {
  exchange: Exchange;
  fees: FeeCalculatorResult;
  savings: number; // compared to most expensive
} | null {
  const comparisons = compareExchangeFees(trade_amount, trade_type, payment_method);

  if (comparisons.length === 0) {
    return null;
  }

  const cheapest = comparisons[0];
  const mostExpensive = comparisons[comparisons.length - 1];
  const savings = mostExpensive.total_fees - cheapest.total_fees;

  const exchange = exchanges.find(e => e.name === cheapest.exchange_name);

  if (!exchange) {
    return null;
  }

  return {
    exchange,
    fees: cheapest,
    savings,
  };
}

/**
 * Calculate maker vs taker fee difference
 */
export function compareMakerTakerFees(
  exchange: Exchange,
  trade_amount: number
): {
  makerFee: number;
  takerFee: number;
  difference: number;
  percentageSavings: number;
} {
  const makerFee = trade_amount * exchange.fees.maker_fee;
  const takerFee = trade_amount * exchange.fees.taker_fee;
  const difference = takerFee - makerFee;
  const percentageSavings = (difference / takerFee) * 100;

  return {
    makerFee,
    takerFee,
    difference,
    percentageSavings,
  };
}

/**
 * Calculate fees for volume-based tiers (if applicable)
 * Many exchanges offer reduced fees for higher trading volumes
 */
export function calculateVolumeBasedFees(
  baseRate: number,
  monthlyVolume: number,
  tradeAmount: number
): {
  effectiveRate: number;
  tradingFee: number;
  tier: string;
} {
  // Common volume tier structure
  const tiers = [
    { minVolume: 0, maxVolume: 10000, rate: baseRate, name: 'Starter' },
    { minVolume: 10000, maxVolume: 50000, rate: baseRate * 0.9, name: 'Trader' },
    { minVolume: 50000, maxVolume: 100000, rate: baseRate * 0.8, name: 'Pro' },
    { minVolume: 100000, maxVolume: 500000, rate: baseRate * 0.6, name: 'VIP' },
    { minVolume: 500000, maxVolume: Infinity, rate: baseRate * 0.4, name: 'Market Maker' },
  ];

  const tier = tiers.find(
    t => monthlyVolume >= t.minVolume && monthlyVolume < t.maxVolume
  ) || tiers[0];

  return {
    effectiveRate: tier.rate,
    tradingFee: tradeAmount * tier.rate,
    tier: tier.name,
  };
}
