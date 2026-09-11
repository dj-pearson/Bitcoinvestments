/**
 * Custom Trading Indicators Service
 *
 * Premium charting with RSI, MACD, Bollinger Bands, and custom indicator creation.
 * Free users: basic candlestick charts only
 * Premium: all indicators, custom formulas, signals
 */

import { getOHLCData } from './coingecko';
import type {
  IndicatorType,
  ChartData,
  IndicatorValue,
  TradingSignal,
} from '../types/premiumFeatures';

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
 * Throws on failure rather than returning placeholder data: every consumer of
 * this module turns the candles into overbought/oversold readings and buy/sell
 * signals, so a silent fallback to synthetic prices would present invented
 * trading advice as analysis. A visible error is the only safe failure mode.
 *
 * Note that the CoinGecko OHLC endpoint carries no volume, so `volume` is 0 and
 * volume-derived indicators (OBV, VWAP) cannot be computed from this data.
 */
export async function fetchChartData(
  coinId: string,
  timeframe: ChartTimeframe
): Promise<ChartData[]> {
  const { days } = CHART_TIMEFRAMES[timeframe];
  const raw = await getOHLCData(coinId, days);

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`No price data returned for ${coinId}.`);
  }

  return raw.map(([timestamp, open, high, low, close]) => ({
    timestamp,
    open,
    high,
    low,
    close,
    volume: 0,
  }));
}

/**
 * Minimum candles each indicator needs before it produces a value.
 */
export const INDICATOR_MIN_CANDLES: Record<string, number> = {
  rsi: 15,
  macd: 35,
  bollinger_bands: 20,
  sma: 50,
  ema: 20,
  stochastic: 17,
  atr: 15,
  obv: 2,
};

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: ChartData[], period: number): IndicatorValue[] {
  const result: IndicatorValue[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, d) => sum + d.close, 0) / period;
    result.push({
      timestamp: data[i].timestamp,
      values: { sma: avg },
    });
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: ChartData[], period: number): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;

  result.push({
    timestamp: data[period - 1].timestamp,
    values: { ema },
  });

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({
      timestamp: data[i].timestamp,
      values: { ema },
    });
  }

  return result;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(
  data: ChartData[],
  period: number = 14
): IndicatorValue[] {
  const result: IndicatorValue[] = [];

  if (data.length < period + 1) return result;

  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes. changes[i] is the move into candle i + 1.
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  const toRSI = (avgGain: number, avgLoss: number): number => {
    // A window with no losses is RSI 100 by definition, and a window with no
    // movement at all is 50 - neither is "rs = 100", which lands on 99.01 and
    // reads as overbought.
    if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
    return 100 - 100 / (1 + avgGain / avgLoss);
  };

  // Wilder's seed: a simple average of the first `period` changes. This is the
  // first published value; smoothing starts from the change *after* it, rather
  // than folding the last seeded change in a second time.
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  result.push({
    timestamp: data[period].timestamp,
    values: { rsi: toRSI(avgGain, avgLoss) },
  });

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    result.push({
      timestamp: data[i + 1].timestamp,
      values: { rsi: toRSI(avgGain, avgLoss) },
    });
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data: ChartData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): IndicatorValue[] {
  const result: IndicatorValue[] = [];

  // Calculate EMAs
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Calculate MACD line
  const macdValues: number[] = [];
  const startIndex = slowPeriod - 1;

  for (let i = 0; i < slowEMA.length; i++) {
    const fastValue = fastEMA[i + (slowPeriod - fastPeriod)]?.values.ema || 0;
    const slowValue = slowEMA[i].values.ema;
    macdValues.push(fastValue - slowValue);
  }

  // Calculate signal line (EMA of MACD)
  const signalMultiplier = 2 / (signalPeriod + 1);
  let signal = macdValues.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;

  for (let i = signalPeriod - 1; i < macdValues.length; i++) {
    if (i >= signalPeriod) {
      signal = (macdValues[i] - signal) * signalMultiplier + signal;
    }

    const histogram = macdValues[i] - signal;

    result.push({
      timestamp: data[startIndex + i].timestamp,
      values: {
        macd: macdValues[i],
        signal,
        histogram,
      },
    });
  }

  return result;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  data: ChartData[],
  period: number = 20,
  stdDev: number = 2
): IndicatorValue[] {
  const result: IndicatorValue[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const closes = slice.map(d => d.close);

    // Calculate SMA (middle band)
    const sma = closes.reduce((a, b) => a + b, 0) / period;

    // Calculate standard deviation
    const squaredDiffs = closes.map(c => Math.pow(c - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(variance);

    result.push({
      timestamp: data[i].timestamp,
      values: {
        upper: sma + std * stdDev,
        middle: sma,
        lower: sma - std * stdDev,
        bandwidth: ((sma + std * stdDev) - (sma - std * stdDev)) / sma * 100,
      },
    });
  }

  return result;
}

/**
 * Calculate Stochastic Oscillator
 */
export function calculateStochastic(
  data: ChartData[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smooth: number = 3
): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  const kValues: number[] = [];

  // Calculate raw %K
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    const close = data[i].close;

    const rawK = high === low ? 50 : ((close - low) / (high - low)) * 100;
    kValues.push(rawK);
  }

  // Smooth %K
  for (let i = smooth - 1; i < kValues.length; i++) {
    const smoothedK = kValues.slice(i - smooth + 1, i + 1).reduce((a, b) => a + b, 0) / smooth;

    // Calculate %D (SMA of %K)
    if (i >= smooth + dPeriod - 2) {
      const dSlice = [];
      for (let j = i - dPeriod + 1; j <= i; j++) {
        const k = kValues.slice(j - smooth + 1, j + 1).reduce((a, b) => a + b, 0) / smooth;
        dSlice.push(k);
      }
      const d = dSlice.reduce((a, b) => a + b, 0) / dPeriod;

      result.push({
        timestamp: data[kPeriod - 1 + i].timestamp,
        values: { k: smoothedK, d },
      });
    }
  }

  return result;
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(data: ChartData[], period: number = 14): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  const trueRanges: number[] = [];

  // Calculate True Range
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate initial ATR
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

  result.push({
    timestamp: data[period].timestamp,
    values: { atr },
  });

  // Calculate smoothed ATR
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push({
      timestamp: data[i + 1].timestamp,
      values: { atr },
    });
  }

  return result;
}

/**
 * Calculate On-Balance Volume (OBV)
 */
export function calculateOBV(data: ChartData[]): IndicatorValue[] {
  const result: IndicatorValue[] = [];
  let obv = 0;

  result.push({
    timestamp: data[0].timestamp,
    values: { obv: data[0].volume },
  });

  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      obv += data[i].volume;
    } else if (data[i].close < data[i - 1].close) {
      obv -= data[i].volume;
    }

    result.push({
      timestamp: data[i].timestamp,
      values: { obv },
    });
  }

  return result;
}

/**
 * Generate trading signals based on indicators
 */
export function generateTradingSignals(
  data: ChartData[],
  indicators: IndicatorType[]
): TradingSignal[] {
  const signals: TradingSignal[] = [];
  const latestPrice = data[data.length - 1].close;
  const latestTimestamp = data[data.length - 1].timestamp;

  if (indicators.includes('rsi')) {
    const rsi = calculateRSI(data);
    const latestRSI = rsi[rsi.length - 1]?.values.rsi;

    if (latestRSI !== undefined) {
      if (latestRSI > 70) {
        signals.push({
          indicator: 'RSI',
          signal_type: 'overbought',
          strength: Math.min(100, (latestRSI - 70) * 3),
          timestamp: latestTimestamp,
          price: latestPrice,
          description: `RSI at ${latestRSI.toFixed(1)} indicates overbought conditions`,
        });
      } else if (latestRSI < 30) {
        signals.push({
          indicator: 'RSI',
          signal_type: 'oversold',
          strength: Math.min(100, (30 - latestRSI) * 3),
          timestamp: latestTimestamp,
          price: latestPrice,
          description: `RSI at ${latestRSI.toFixed(1)} indicates oversold conditions`,
        });
      }
    }
  }

  if (indicators.includes('macd')) {
    const macd = calculateMACD(data);
    const latest = macd[macd.length - 1]?.values;
    const previous = macd[macd.length - 2]?.values;

    if (latest && previous) {
      // Bullish crossover
      if (previous.macd < previous.signal && latest.macd > latest.signal) {
        signals.push({
          indicator: 'MACD',
          signal_type: 'buy',
          strength: 75,
          timestamp: latestTimestamp,
          price: latestPrice,
          description: 'MACD bullish crossover detected',
        });
      }
      // Bearish crossover
      else if (previous.macd > previous.signal && latest.macd < latest.signal) {
        signals.push({
          indicator: 'MACD',
          signal_type: 'sell',
          strength: 75,
          timestamp: latestTimestamp,
          price: latestPrice,
          description: 'MACD bearish crossover detected',
        });
      }
    }
  }

  if (indicators.includes('bollinger_bands')) {
    const bb = calculateBollingerBands(data);
    const latest = bb[bb.length - 1]?.values;

    if (latest) {
      if (latestPrice > latest.upper) {
        signals.push({
          indicator: 'Bollinger Bands',
          signal_type: 'overbought',
          strength: 60,
          timestamp: latestTimestamp,
          price: latestPrice,
          description: 'Price above upper Bollinger Band',
        });
      } else if (latestPrice < latest.lower) {
        signals.push({
          indicator: 'Bollinger Bands',
          signal_type: 'oversold',
          strength: 60,
          timestamp: latestTimestamp,
          price: latestPrice,
          description: 'Price below lower Bollinger Band',
        });
      }
    }
  }

  return signals;
}

/**
 * Calculate indicator based on type
 */
export function calculateIndicator(
  data: ChartData[],
  type: IndicatorType,
  parameters: Record<string, number | string | boolean>
): IndicatorValue[] {
  switch (type) {
    case 'sma':
      return calculateSMA(data, (parameters.period as number) || 20);
    case 'ema':
      return calculateEMA(data, (parameters.period as number) || 20);
    case 'rsi':
      return calculateRSI(data, (parameters.period as number) || 14);
    case 'macd':
      return calculateMACD(
        data,
        (parameters.fast as number) || 12,
        (parameters.slow as number) || 26,
        (parameters.signal as number) || 9
      );
    case 'bollinger_bands':
      return calculateBollingerBands(
        data,
        (parameters.period as number) || 20,
        (parameters.stdDev as number) || 2
      );
    case 'stochastic':
      return calculateStochastic(
        data,
        (parameters.kPeriod as number) || 14,
        (parameters.dPeriod as number) || 3,
        (parameters.smooth as number) || 3
      );
    case 'atr':
      return calculateATR(data, (parameters.period as number) || 14);
    case 'obv':
      return calculateOBV(data);
    default:
      return [];
  }
}

/**
 * Get available indicators for user tier
 */
export function getAvailableIndicators(isPremium: boolean): IndicatorType[] {
  if (isPremium) {
    return ['rsi', 'macd', 'bollinger_bands', 'ema', 'sma', 'stochastic', 'atr', 'obv', 'vwap', 'ichimoku'];
  }
  return ['sma']; // Free users only get SMA
}

/**
 * Generate synthetic chart data.
 *
 * TEST FIXTURE ONLY. This is a random walk, not a market: indicators computed
 * from it are noise, and any signal derived from it is meaningless. Never render
 * it to users or use it as a fallback when a real fetch fails.
 */
export function generateMockChartData(days: number = 100): ChartData[] {
  const data: ChartData[] = [];
  let price = 40000; // Starting BTC price
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const change = (Math.random() - 0.5) * 1000;
    const open = price;
    price += change;
    const close = price;
    const high = Math.max(open, close) + Math.random() * 500;
    const low = Math.min(open, close) - Math.random() * 500;
    const volume = 1000000000 + Math.random() * 500000000;

    data.push({ timestamp, open, high, low, close, volume });
  }

  return data;
}
