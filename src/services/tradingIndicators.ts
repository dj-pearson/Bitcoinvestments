/**
 * Technical indicator library (the only one in the codebase) plus the
 * CoinGecko OHLC fetch used by /trading-indicators.
 *
 * Every calculation is length-guarded: when a series is too short for an
 * indicator it returns [] instead of reading past the end of the array. Short
 * series are normal here because CoinGecko fixes the candle size per window
 * (a 90-day request returns roughly 23 four-day candles), so the page can ask
 * for any indicator on any timeframe without crashing.
 */

import { getOHLCData } from './coingecko';
import type { ChartData, IndicatorValue } from '../types/premiumFeatures';

/**
 * Chart timeframes offered by the UI, mapped to the CoinGecko OHLC window that
 * backs them. The candle interval is fixed by the API per window (30 minutes up
 * to 2 days, 4 hours up to 30 days, 4 days beyond that) rather than chosen by us,
 * so it is recorded here and surfaced in the UI - a "3M" chart made of 4-day
 * candles is a different thing from a 3M chart of daily candles, and indicator
 * periods are counted in candles, not days.
 */
export const CHART_TIMEFRAMES = {
  '1D': { days: 1 as const, candleLabel: '30-minute candles' },
  '1W': { days: 7 as const, candleLabel: '4-hour candles' },
  '1M': { days: 30 as const, candleLabel: '4-hour candles' },
  '3M': { days: 90 as const, candleLabel: '4-day candles' },
  '1Y': { days: 365 as const, candleLabel: '4-day candles' },
};

export type ChartTimeframe = keyof typeof CHART_TIMEFRAMES;

/**
 * Fetch real OHLC candles for an asset.
 *
 * Throws on failure rather than returning placeholder data: the page turns the
 * candles into indicator readings, so a silent fallback to synthetic prices
 * would present invented analysis as real. A visible error is the only safe
 * failure mode.
 *
 * The CoinGecko OHLC endpoint carries no volume, so `volume` is 0 and
 * volume-based indicators (OBV, VWAP) are not offered.
 */
export async function fetchChartData(coinId: string, timeframe: ChartTimeframe): Promise<ChartData[]> {
  const { days } = CHART_TIMEFRAMES[timeframe];
  const raw = await getOHLCData(coinId, days);

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`No price data returned for ${coinId}.`);
  }

  return raw
    .map(([timestamp, open, high, low, close]) => ({ timestamp, open, high, low, close, volume: 0 }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

/** Indicators the page offers, with their standard default settings. */
export type ChartIndicator = 'sma' | 'ema' | 'bollinger_bands' | 'rsi' | 'macd' | 'stochastic';

export const INDICATOR_SETTINGS = {
  sma: { period: 50 },
  ema: { period: 20 },
  bollinger_bands: { period: 20, stdDev: 2 },
  rsi: { period: 14 },
  macd: { fast: 12, slow: 26, signal: 9 },
  stochastic: { kPeriod: 14, dPeriod: 3, smooth: 3 },
} as const;

/**
 * Minimum candles each indicator (at the default settings above) needs before
 * it produces its first value.
 */
export const INDICATOR_MIN_CANDLES: Record<ChartIndicator, number> = {
  sma: 50,
  ema: 20,
  bollinger_bands: 20,
  rsi: 15, // period + 1 closes to get `period` changes
  macd: 34, // slow EMA (26) + signal EMA (9) - 1
  stochastic: 18, // kPeriod (14) + smooth (3) + dPeriod (3) - 2
};

/** Simple Moving Average of closes. */
export function calculateSMA(data: ChartData[], period: number): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  if (period < 1 || data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    if (i >= period) sum -= data[i - period].close;
    if (i >= period - 1) {
      result.push({ timestamp: data[i].timestamp, values: { sma: sum / period } });
    }
  }
  return result;
}

/** Exponential Moving Average of closes, seeded with the SMA of the first `period` closes. */
export function calculateEMA(data: ChartData[], period: number): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  if (period < 1 || data.length < period) return result;

  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
  result.push({ timestamp: data[period - 1].timestamp, values: { ema } });

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({ timestamp: data[i].timestamp, values: { ema } });
  }
  return result;
}

/** Relative Strength Index using Wilder's smoothing. */
export function calculateRSI(data: ChartData[], period: number = 14): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  if (period < 1 || data.length < period + 1) return result;

  const gains: number[] = [];
  const losses: number[] = [];
  // changes[i] is the move into candle i + 1.
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  const toRSI = (avgGain: number, avgLoss: number): number => {
    // No losses is RSI 100 by definition; no movement at all is 50.
    if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
    return 100 - 100 / (1 + avgGain / avgLoss);
  };

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push({ timestamp: data[period].timestamp, values: { rsi: toRSI(avgGain, avgLoss) } });

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    result.push({ timestamp: data[i + 1].timestamp, values: { rsi: toRSI(avgGain, avgLoss) } });
  }
  return result;
}

/** MACD line (fast EMA - slow EMA), signal line (EMA of MACD) and histogram. */
export function calculateMACD(
  data: ChartData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  if (fastPeriod >= slowPeriod || data.length < slowPeriod + signalPeriod - 1) return result;

  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  const offset = slowPeriod - fastPeriod;

  // macdValues[i] lines up with data[slowPeriod - 1 + i].
  const macdValues = slowEMA.map((s, i) => fastEMA[i + offset].values.ema - s.values.ema);

  const signalMultiplier = 2 / (signalPeriod + 1);
  let signal = macdValues.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;

  for (let i = signalPeriod - 1; i < macdValues.length; i++) {
    if (i >= signalPeriod) signal = (macdValues[i] - signal) * signalMultiplier + signal;
    result.push({
      timestamp: data[slowPeriod - 1 + i].timestamp,
      values: { macd: macdValues[i], signal, histogram: macdValues[i] - signal },
    });
  }
  return result;
}

/** Bollinger Bands: SMA middle band plus/minus `stdDev` population standard deviations. */
export function calculateBollingerBands(
  data: ChartData[],
  period: number = 20,
  stdDev: number = 2
): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  if (period < 1 || data.length < period) return result;

  for (let i = period - 1; i < data.length; i++) {
    const closes = data.slice(i - period + 1, i + 1).map((d) => d.close);
    const middle = closes.reduce((a, b) => a + b, 0) / period;
    const variance = closes.reduce((a, c) => a + (c - middle) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    const upper = middle + std * stdDev;
    const lower = middle - std * stdDev;
    result.push({
      timestamp: data[i].timestamp,
      values: { upper, middle, lower, bandwidth: middle ? ((upper - lower) / middle) * 100 : 0 },
    });
  }
  return result;
}

/** Slow stochastic oscillator: %K smoothed over `smooth` candles, %D = SMA of %K. */
export function calculateStochastic(
  data: ChartData[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smooth: number = 3
): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  if (data.length < kPeriod + smooth + dPeriod - 2) return result;

  // rawK[i] lines up with data[kPeriod - 1 + i].
  const rawK: number[] = [];
  for (let i = kPeriod - 1; i < data.length; i++) {
    const window = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...window.map((d) => d.high));
    const low = Math.min(...window.map((d) => d.low));
    rawK.push(high === low ? 50 : ((data[i].close - low) / (high - low)) * 100);
  }

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  // slowK[j] lines up with rawK[smooth - 1 + j].
  const slowK: number[] = [];
  for (let i = smooth - 1; i < rawK.length; i++) slowK.push(avg(rawK.slice(i - smooth + 1, i + 1)));

  for (let j = dPeriod - 1; j < slowK.length; j++) {
    const d = avg(slowK.slice(j - dPeriod + 1, j + 1));
    result.push({
      timestamp: data[kPeriod - 1 + smooth - 1 + j].timestamp,
      values: { k: slowK[j], d },
    });
  }
  return result;
}

/** Compute one of the page's indicators at its default settings. */
export function calculateIndicator(data: ChartData[], indicator: ChartIndicator): IndicatorValue[] {
  switch (indicator) {
    case 'sma':
      return calculateSMA(data, INDICATOR_SETTINGS.sma.period);
    case 'ema':
      return calculateEMA(data, INDICATOR_SETTINGS.ema.period);
    case 'bollinger_bands':
      return calculateBollingerBands(data, INDICATOR_SETTINGS.bollinger_bands.period, INDICATOR_SETTINGS.bollinger_bands.stdDev);
    case 'rsi':
      return calculateRSI(data, INDICATOR_SETTINGS.rsi.period);
    case 'macd': {
      const { fast, slow, signal } = INDICATOR_SETTINGS.macd;
      return calculateMACD(data, fast, slow, signal);
    }
    case 'stochastic': {
      const { kPeriod, dPeriod, smooth } = INDICATOR_SETTINGS.stochastic;
      return calculateStochastic(data, kPeriod, dPeriod, smooth);
    }
  }
}
