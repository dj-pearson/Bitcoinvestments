/**
 * Technical Indicators Service
 *
 * Provides calculation of common technical analysis indicators for cryptocurrency price data.
 *
 * Supported Indicators:
 * - RSI (Relative Strength Index)
 * - MACD (Moving Average Convergence Divergence)
 * - Bollinger Bands
 * - SMA (Simple Moving Average)
 * - EMA (Exponential Moving Average)
 * - Stochastic Oscillator
 * - ATR (Average True Range)
 */

export interface PricePoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorResult {
  timestamp: number;
  value: number;
}

export interface MACDResult {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandResult {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
}

export interface StochasticResult {
  timestamp: number;
  k: number;
  d: number;
}

export interface TechnicalAnalysis {
  rsi: IndicatorResult[];
  macd: MACDResult[];
  bollingerBands: BollingerBandResult[];
  sma20: IndicatorResult[];
  sma50: IndicatorResult[];
  sma200: IndicatorResult[];
  ema12: IndicatorResult[];
  ema26: IndicatorResult[];
  stochastic: StochasticResult[];
  atr: IndicatorResult[];
}

export interface SignalStrength {
  indicator: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  reason: string;
}

export interface TechnicalSummary {
  overallSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  signals: SignalStrength[];
  score: number; // -100 to 100
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(prices: PricePoint[], period: number): IndicatorResult[] {
  const results: IndicatorResult[] = [];

  if (prices.length < period) return results;

  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j].close;
    }
    results.push({
      timestamp: prices[i].timestamp,
      value: sum / period,
    });
  }

  return results;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: PricePoint[], period: number): IndicatorResult[] {
  const results: IndicatorResult[] = [];

  if (prices.length < period) return results;

  // Calculate initial SMA for first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i].close;
  }
  let ema = sum / period;
  results.push({
    timestamp: prices[period - 1].timestamp,
    value: ema,
  });

  // Calculate multiplier
  const multiplier = 2 / (period + 1);

  // Calculate EMA for remaining points
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i].close - ema) * multiplier + ema;
    results.push({
      timestamp: prices[i].timestamp,
      value: ema,
    });
  }

  return results;
}

/**
 * Calculate Relative Strength Index (RSI)
 * Standard period: 14
 */
export function calculateRSI(prices: PricePoint[], period: number = 14): IndicatorResult[] {
  const results: IndicatorResult[] = [];

  if (prices.length < period + 1) return results;

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i].close - prices[i - 1].close);
  }

  // Calculate initial average gains and losses
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate first RSI
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  results.push({
    timestamp: prices[period].timestamp,
    value: rsi,
  });

  // Calculate subsequent RSI values using smoothed averages
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    results.push({
      timestamp: prices[i + 1].timestamp,
      value: rsi,
    });
  }

  return results;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * Standard periods: 12, 26, 9 (signal)
 */
export function calculateMACD(
  prices: PricePoint[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult[] {
  const results: MACDResult[] = [];

  if (prices.length < slowPeriod + signalPeriod) return results;

  // Calculate fast and slow EMAs
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);

  // Align EMAs by timestamp
  const alignedData: { timestamp: number; macd: number }[] = [];
  let slowIndex = 0;

  for (const fast of emaFast) {
    while (slowIndex < emaSlow.length && emaSlow[slowIndex].timestamp < fast.timestamp) {
      slowIndex++;
    }
    if (slowIndex < emaSlow.length && emaSlow[slowIndex].timestamp === fast.timestamp) {
      alignedData.push({
        timestamp: fast.timestamp,
        macd: fast.value - emaSlow[slowIndex].value,
      });
    }
  }

  if (alignedData.length < signalPeriod) return results;

  // Calculate signal line (EMA of MACD)
  const macdPrices: PricePoint[] = alignedData.map((d) => ({
    timestamp: d.timestamp,
    open: d.macd,
    high: d.macd,
    low: d.macd,
    close: d.macd,
  }));

  const signalLine = calculateEMA(macdPrices, signalPeriod);

  // Combine MACD and signal
  let signalIndex = 0;
  for (const data of alignedData) {
    while (signalIndex < signalLine.length && signalLine[signalIndex].timestamp < data.timestamp) {
      signalIndex++;
    }
    if (signalIndex < signalLine.length && signalLine[signalIndex].timestamp === data.timestamp) {
      const signal = signalLine[signalIndex].value;
      results.push({
        timestamp: data.timestamp,
        macd: data.macd,
        signal,
        histogram: data.macd - signal,
      });
    }
  }

  return results;
}

/**
 * Calculate Bollinger Bands
 * Standard period: 20, Standard deviations: 2
 */
export function calculateBollingerBands(
  prices: PricePoint[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandResult[] {
  const results: BollingerBandResult[] = [];

  if (prices.length < period) return results;

  for (let i = period - 1; i < prices.length; i++) {
    // Calculate SMA (middle band)
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j].close;
    }
    const middle = sum / period;

    // Calculate standard deviation
    let squaredSum = 0;
    for (let j = 0; j < period; j++) {
      squaredSum += Math.pow(prices[i - j].close - middle, 2);
    }
    const standardDeviation = Math.sqrt(squaredSum / period);

    const upper = middle + stdDev * standardDeviation;
    const lower = middle - stdDev * standardDeviation;
    const currentPrice = prices[i].close;

    // Bandwidth = (Upper - Lower) / Middle
    const bandwidth = ((upper - lower) / middle) * 100;

    // %B = (Price - Lower) / (Upper - Lower)
    const percentB = upper !== lower ? ((currentPrice - lower) / (upper - lower)) * 100 : 50;

    results.push({
      timestamp: prices[i].timestamp,
      upper,
      middle,
      lower,
      bandwidth,
      percentB,
    });
  }

  return results;
}

/**
 * Calculate Stochastic Oscillator
 * Standard periods: 14 (lookback), 3 (smoothing)
 */
export function calculateStochastic(
  prices: PricePoint[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): StochasticResult[] {
  const results: StochasticResult[] = [];

  if (prices.length < period + smoothK + smoothD - 2) return results;

  // Calculate raw %K values
  const rawK: { timestamp: number; value: number }[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    let highest = -Infinity;
    let lowest = Infinity;

    for (let j = 0; j < period; j++) {
      highest = Math.max(highest, prices[i - j].high);
      lowest = Math.min(lowest, prices[i - j].low);
    }

    const k = highest !== lowest
      ? ((prices[i].close - lowest) / (highest - lowest)) * 100
      : 50;

    rawK.push({
      timestamp: prices[i].timestamp,
      value: k,
    });
  }

  // Smooth %K with SMA
  const smoothedK: { timestamp: number; value: number }[] = [];
  for (let i = smoothK - 1; i < rawK.length; i++) {
    let sum = 0;
    for (let j = 0; j < smoothK; j++) {
      sum += rawK[i - j].value;
    }
    smoothedK.push({
      timestamp: rawK[i].timestamp,
      value: sum / smoothK,
    });
  }

  // Calculate %D (SMA of smoothed %K)
  for (let i = smoothD - 1; i < smoothedK.length; i++) {
    let sum = 0;
    for (let j = 0; j < smoothD; j++) {
      sum += smoothedK[i - j].value;
    }
    results.push({
      timestamp: smoothedK[i].timestamp,
      k: smoothedK[i].value,
      d: sum / smoothD,
    });
  }

  return results;
}

/**
 * Calculate Average True Range (ATR)
 * Standard period: 14
 */
export function calculateATR(prices: PricePoint[], period: number = 14): IndicatorResult[] {
  const results: IndicatorResult[] = [];

  if (prices.length < period + 1) return results;

  // Calculate True Range
  const trueRanges: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const high = prices[i].high;
    const low = prices[i].low;
    const prevClose = prices[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate initial ATR (simple average)
  let atr = 0;
  for (let i = 0; i < period; i++) {
    atr += trueRanges[i];
  }
  atr /= period;

  results.push({
    timestamp: prices[period].timestamp,
    value: atr,
  });

  // Calculate subsequent ATR using smoothed average
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    results.push({
      timestamp: prices[i + 1].timestamp,
      value: atr,
    });
  }

  return results;
}

/**
 * Calculate all technical indicators at once
 */
export function calculateAllIndicators(prices: PricePoint[]): TechnicalAnalysis {
  return {
    rsi: calculateRSI(prices, 14),
    macd: calculateMACD(prices, 12, 26, 9),
    bollingerBands: calculateBollingerBands(prices, 20, 2),
    sma20: calculateSMA(prices, 20),
    sma50: calculateSMA(prices, 50),
    sma200: calculateSMA(prices, 200),
    ema12: calculateEMA(prices, 12),
    ema26: calculateEMA(prices, 26),
    stochastic: calculateStochastic(prices, 14, 3, 3),
    atr: calculateATR(prices, 14),
  };
}

/**
 * Generate trading signals based on technical indicators
 */
export function generateTechnicalSignals(
  prices: PricePoint[],
  indicators: TechnicalAnalysis
): TechnicalSummary {
  const signals: SignalStrength[] = [];
  const currentPrice = prices[prices.length - 1]?.close || 0;

  // RSI Signal
  if (indicators.rsi.length > 0) {
    const currentRSI = indicators.rsi[indicators.rsi.length - 1].value;
    let rsiSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let rsiStrength = 50;
    let rsiReason = 'RSI is neutral';

    if (currentRSI < 30) {
      rsiSignal = 'buy';
      rsiStrength = Math.min(100, (30 - currentRSI) * 5);
      rsiReason = `RSI at ${currentRSI.toFixed(1)} indicates oversold conditions`;
    } else if (currentRSI > 70) {
      rsiSignal = 'sell';
      rsiStrength = Math.min(100, (currentRSI - 70) * 5);
      rsiReason = `RSI at ${currentRSI.toFixed(1)} indicates overbought conditions`;
    } else if (currentRSI < 50) {
      rsiSignal = 'buy';
      rsiStrength = (50 - currentRSI) * 2;
      rsiReason = `RSI at ${currentRSI.toFixed(1)} is below midline`;
    } else {
      rsiSignal = 'sell';
      rsiStrength = (currentRSI - 50) * 2;
      rsiReason = `RSI at ${currentRSI.toFixed(1)} is above midline`;
    }

    signals.push({
      indicator: 'RSI (14)',
      signal: rsiSignal,
      strength: rsiStrength,
      reason: rsiReason,
    });
  }

  // MACD Signal
  if (indicators.macd.length > 1) {
    const current = indicators.macd[indicators.macd.length - 1];
    const previous = indicators.macd[indicators.macd.length - 2];
    let macdSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let macdStrength = 50;
    let macdReason = 'MACD is neutral';

    if (current.histogram > 0 && previous.histogram <= 0) {
      macdSignal = 'buy';
      macdStrength = 80;
      macdReason = 'MACD crossed above signal line (bullish crossover)';
    } else if (current.histogram < 0 && previous.histogram >= 0) {
      macdSignal = 'sell';
      macdStrength = 80;
      macdReason = 'MACD crossed below signal line (bearish crossover)';
    } else if (current.histogram > 0) {
      macdSignal = 'buy';
      macdStrength = 60;
      macdReason = 'MACD is above signal line';
    } else if (current.histogram < 0) {
      macdSignal = 'sell';
      macdStrength = 60;
      macdReason = 'MACD is below signal line';
    }

    signals.push({
      indicator: 'MACD (12,26,9)',
      signal: macdSignal,
      strength: macdStrength,
      reason: macdReason,
    });
  }

  // Bollinger Bands Signal
  if (indicators.bollingerBands.length > 0) {
    const current = indicators.bollingerBands[indicators.bollingerBands.length - 1];
    let bbSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let bbStrength = 50;
    let bbReason = 'Price is within Bollinger Bands';

    if (currentPrice <= current.lower) {
      bbSignal = 'buy';
      bbStrength = 75;
      bbReason = 'Price touched lower Bollinger Band (potential reversal)';
    } else if (currentPrice >= current.upper) {
      bbSignal = 'sell';
      bbStrength = 75;
      bbReason = 'Price touched upper Bollinger Band (potential reversal)';
    } else if (current.percentB < 20) {
      bbSignal = 'buy';
      bbStrength = 60;
      bbReason = `Price is in lower 20% of bands (%B: ${current.percentB.toFixed(1)})`;
    } else if (current.percentB > 80) {
      bbSignal = 'sell';
      bbStrength = 60;
      bbReason = `Price is in upper 20% of bands (%B: ${current.percentB.toFixed(1)})`;
    }

    signals.push({
      indicator: 'Bollinger Bands (20,2)',
      signal: bbSignal,
      strength: bbStrength,
      reason: bbReason,
    });
  }

  // Moving Average Signal (SMA 50/200 Golden/Death Cross)
  if (indicators.sma50.length > 1 && indicators.sma200.length > 1) {
    const currentSMA50 = indicators.sma50[indicators.sma50.length - 1].value;
    const currentSMA200 = indicators.sma200[indicators.sma200.length - 1].value;
    const prevSMA50 = indicators.sma50[indicators.sma50.length - 2].value;
    const prevSMA200 = indicators.sma200[indicators.sma200.length - 2].value;

    let maSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let maStrength = 50;
    let maReason = 'Moving averages are converging';

    if (currentSMA50 > currentSMA200 && prevSMA50 <= prevSMA200) {
      maSignal = 'buy';
      maStrength = 90;
      maReason = 'Golden Cross: SMA 50 crossed above SMA 200';
    } else if (currentSMA50 < currentSMA200 && prevSMA50 >= prevSMA200) {
      maSignal = 'sell';
      maStrength = 90;
      maReason = 'Death Cross: SMA 50 crossed below SMA 200';
    } else if (currentSMA50 > currentSMA200) {
      maSignal = 'buy';
      maStrength = 65;
      maReason = 'SMA 50 is above SMA 200 (bullish trend)';
    } else if (currentSMA50 < currentSMA200) {
      maSignal = 'sell';
      maStrength = 65;
      maReason = 'SMA 50 is below SMA 200 (bearish trend)';
    }

    signals.push({
      indicator: 'Moving Averages (50/200)',
      signal: maSignal,
      strength: maStrength,
      reason: maReason,
    });
  }

  // Stochastic Signal
  if (indicators.stochastic.length > 0) {
    const current = indicators.stochastic[indicators.stochastic.length - 1];
    let stochSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let stochStrength = 50;
    let stochReason = 'Stochastic is neutral';

    if (current.k < 20 && current.d < 20) {
      stochSignal = 'buy';
      stochStrength = 75;
      stochReason = `Stochastic is oversold (%K: ${current.k.toFixed(1)}, %D: ${current.d.toFixed(1)})`;
    } else if (current.k > 80 && current.d > 80) {
      stochSignal = 'sell';
      stochStrength = 75;
      stochReason = `Stochastic is overbought (%K: ${current.k.toFixed(1)}, %D: ${current.d.toFixed(1)})`;
    } else if (current.k > current.d && current.k < 50) {
      stochSignal = 'buy';
      stochStrength = 55;
      stochReason = '%K crossed above %D in lower half';
    } else if (current.k < current.d && current.k > 50) {
      stochSignal = 'sell';
      stochStrength = 55;
      stochReason = '%K crossed below %D in upper half';
    }

    signals.push({
      indicator: 'Stochastic (14,3,3)',
      signal: stochSignal,
      strength: stochStrength,
      reason: stochReason,
    });
  }

  // Calculate overall score (-100 to 100)
  let score = 0;
  for (const signal of signals) {
    const signalValue = signal.signal === 'buy' ? 1 : signal.signal === 'sell' ? -1 : 0;
    score += signalValue * signal.strength;
  }
  score = Math.round(score / Math.max(signals.length, 1));

  // Determine overall signal
  let overallSignal: TechnicalSummary['overallSignal'];
  if (score >= 60) {
    overallSignal = 'strong_buy';
  } else if (score >= 20) {
    overallSignal = 'buy';
  } else if (score <= -60) {
    overallSignal = 'strong_sell';
  } else if (score <= -20) {
    overallSignal = 'sell';
  } else {
    overallSignal = 'neutral';
  }

  return {
    overallSignal,
    signals,
    score,
  };
}

/**
 * Get signal color for display
 */
export function getSignalColor(signal: 'buy' | 'sell' | 'neutral' | 'strong_buy' | 'strong_sell'): string {
  switch (signal) {
    case 'strong_buy':
      return '#22c55e';
    case 'buy':
      return '#4ade80';
    case 'strong_sell':
      return '#ef4444';
    case 'sell':
      return '#f87171';
    default:
      return '#94a3b8';
  }
}

/**
 * Get signal label for display
 */
export function getSignalLabel(signal: TechnicalSummary['overallSignal']): string {
  switch (signal) {
    case 'strong_buy':
      return 'Strong Buy';
    case 'buy':
      return 'Buy';
    case 'strong_sell':
      return 'Strong Sell';
    case 'sell':
      return 'Sell';
    default:
      return 'Neutral';
  }
}
