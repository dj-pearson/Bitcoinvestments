/**
 * /trading-indicators
 *
 * Free, live technical-indicator readings (SMA, EMA, Bollinger Bands, RSI,
 * MACD, Stochastic) on real CoinGecko OHLC candles, plus a plain-English guide
 * to what each indicator measures and where it fails.
 *
 * Static baseline: the H1, summary, controls, explainers and FAQ render on the
 * first render from this file. Only the chart/readings area waits on the
 * network, and it shows an honest error (never synthetic prices) on failure.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import {
  ExternalLink,
  FaqSection,
  LastUpdated,
  NotAdviceNote,
  RelatedLinks,
  Section,
  type FaqItem,
} from '../components/analytics/PageParts';
import {
  CHART_TIMEFRAMES,
  INDICATOR_MIN_CANDLES,
  INDICATOR_SETTINGS,
  calculateIndicator,
  fetchChartData,
  type ChartIndicator,
  type ChartTimeframe,
} from '../services/tradingIndicators';
import type { ChartData, IndicatorValue } from '../types/premiumFeatures';

const LAST_UPDATED = '2026-09-23';

const ASSETS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
] as const;
type AssetId = (typeof ASSETS)[number]['id'];

const COLORS = {
  up: '#16a34a',
  down: '#dc2626',
  sma: '#f59e0b',
  ema: '#8b5cf6',
  bb: '#3b82f6',
  line1: '#3b82f6',
  line2: '#f97316',
};

const INDICATOR_META: Record<ChartIndicator, { label: string; kind: 'overlay' | 'pane' }> = {
  sma: { label: `SMA (${INDICATOR_SETTINGS.sma.period})`, kind: 'overlay' },
  ema: { label: `EMA (${INDICATOR_SETTINGS.ema.period})`, kind: 'overlay' },
  bollinger_bands: { label: 'Bollinger Bands (20, 2)', kind: 'overlay' },
  rsi: { label: `RSI (${INDICATOR_SETTINGS.rsi.period})`, kind: 'pane' },
  macd: { label: 'MACD (12, 26, 9)', kind: 'pane' },
  stochastic: { label: 'Stochastic (14, 3, 3)', kind: 'pane' },
};
const ALL_INDICATORS = Object.keys(INDICATOR_META) as ChartIndicator[];

// ---------------------------------------------------------------------------
// Static educational content (renders without network)
// ---------------------------------------------------------------------------

const INDICATOR_GUIDE: {
  id: ChartIndicator;
  name: string;
  what: string;
  settings: string;
  read: string;
  limits: string;
}[] = [
  {
    id: 'sma',
    name: 'Simple Moving Average (SMA)',
    what: 'The average closing price of the last N candles, redrawn each candle. It smooths out noise so the direction of the trend is easier to see.',
    settings: 'Common lengths are 20, 50 and 200. This page uses 50 candles. Note that a 50-candle SMA on 4-hour candles covers about 8 days, not 50 days.',
    read: 'Price above a rising SMA is usually described as an uptrend; below a falling SMA, a downtrend. When a short SMA crosses a long one, traders call it a "golden cross" (up) or "death cross" (down).',
    limits: 'It lags by design: by the time the average turns, much of the move has already happened. In sideways markets price crosses back and forth and produces a stream of false signals.',
  },
  {
    id: 'ema',
    name: 'Exponential Moving Average (EMA)',
    what: 'A moving average that gives more weight to recent closes, so it reacts faster than an SMA of the same length.',
    settings: 'This page uses 20 candles, seeded with the simple average of the first 20 closes. The 12 and 26 EMAs are also the building blocks of MACD.',
    read: 'Read it like an SMA. Because it turns sooner, short-term traders often prefer it for spotting momentum shifts.',
    limits: 'Faster also means jumpier: an EMA gets whipsawed more often than an SMA of the same length. It is still a lagging indicator.',
  },
  {
    id: 'bollinger_bands',
    name: 'Bollinger Bands',
    what: 'A 20-candle SMA (the middle band) with bands 2 standard deviations above and below it. The bands widen when price is volatile and narrow when it is calm.',
    settings: '20 candles, 2 standard deviations (the settings John Bollinger published). If prices were normally distributed about 95% of closes would sit inside the bands; crypto returns are not normal, so closes outside the bands are more common than that.',
    read: 'A close near the upper band means price is high relative to its recent range, not that it must fall. A "squeeze" (unusually narrow bands) often comes before a large move, but it does not tell you the direction.',
    limits: 'In a strong trend price can "walk the band" for weeks. Treating every touch of the upper band as a sell signal fails badly in a bull run.',
  },
  {
    id: 'rsi',
    name: 'Relative Strength Index (RSI)',
    what: 'A 0-100 momentum oscillator comparing the size of recent up-moves with recent down-moves, using Wilder\'s smoothing.',
    settings: '14 candles. The traditional thresholds are 70 (called "overbought") and 30 ("oversold"); 50 is the midline.',
    read: 'Readings above 70 mean gains have dominated recently; below 30, losses have. Some traders look for divergence: price makes a new high while RSI makes a lower high, suggesting momentum is fading.',
    limits: 'In strong crypto trends RSI can stay above 70 or below 30 for a long time. "Overbought" describes the recent past; it is not a forecast.',
  },
  {
    id: 'macd',
    name: 'MACD (Moving Average Convergence Divergence)',
    what: 'The MACD line is the 12-candle EMA minus the 26-candle EMA. The signal line is a 9-candle EMA of the MACD line, and the histogram is the gap between them.',
    settings: '12, 26, 9 (Gerald Appel\'s defaults). It needs at least 34 candles before the first value appears.',
    read: 'MACD above zero means the short-term average is above the long-term one. A MACD line crossing above its signal line is called a bullish crossover; crossing below, bearish. A shrinking histogram means momentum is slowing.',
    limits: 'It is built from two lagging averages, so crossovers arrive late and many reverse quickly in choppy markets. Its values are in price units, so they cannot be compared across assets.',
  },
  {
    id: 'stochastic',
    name: 'Stochastic Oscillator',
    what: 'Shows where the latest close sits within the high-low range of the last 14 candles, on a 0-100 scale. %K is that position (smoothed over 3 candles); %D is a 3-candle average of %K.',
    settings: '14, 3, 3 ("slow stochastic"). 80 and 20 are the usual upper and lower thresholds.',
    read: 'Above 80 the close is near the top of its recent range; below 20, near the bottom. %K crossing %D is used as a timing cue.',
    limits: 'Very sensitive; it flips often and, like RSI, can stay pinned at an extreme during a trend.',
  },
];

const FAQS: FaqItem[] = [
  {
    question: 'What are trading indicators in crypto?',
    answer:
      'Trading indicators are formulas applied to past prices (and sometimes volume) to summarise trend, momentum or volatility. Common ones are moving averages (SMA, EMA), Bollinger Bands, RSI, MACD and the Stochastic oscillator. They describe what price has done; they do not predict what it will do.',
  },
  {
    question: 'What does an RSI above 70 mean for Bitcoin?',
    answer:
      'An RSI above 70 means recent gains have been much larger than recent losses over the last 14 candles, which traders label "overbought". It is not a sell signal on its own: in strong uptrends Bitcoin\'s RSI has stayed above 70 for extended stretches while price kept rising.',
  },
  {
    question: 'What is a MACD crossover?',
    answer:
      'A MACD crossover is when the MACD line (12-period EMA minus 26-period EMA) crosses its 9-period signal line. Crossing above is called bullish and crossing below bearish. Because both lines are built from lagging averages, crossovers confirm a move after it starts and often reverse in sideways markets.',
  },
  {
    question: 'Do technical indicators actually work for crypto?',
    answer:
      'Evidence is mixed. Indicators are useful for describing trend and volatility and for setting consistent rules, but no indicator reliably predicts price, and strategies that look good on past data often fail live because of fees, slippage and overfitting. Test any rule on historical data before relying on it, and size positions for the possibility that it fails.',
  },
  {
    question: 'Why do some indicators disappear on the 3M timeframe?',
    answer:
      'CoinGecko sets the candle size by date range: 30-minute candles for 1 day, 4-hour candles up to 30 days, and 4-day candles beyond that. A 3-month request returns only about 23 four-day candles, which is too few for a 50-candle SMA or for MACD (34 candles). The page hides those indicators and tells you instead of computing them from too little data.',
  },
  {
    question: 'Where does the price data on this page come from?',
    answer:
      'Candles come from the CoinGecko OHLC API and are fetched when you load the page or change the asset or timeframe. The indicators are calculated in your browser from those candles. The most recent candle may still be forming, so its values can change until it closes.',
  },
];

// ---------------------------------------------------------------------------
// Chart helpers
// ---------------------------------------------------------------------------

type Series = Map<number, number>;

function toSeries(values: IndicatorValue[], key: string): Series {
  const m: Series = new Map();
  for (const v of values) {
    const x = v.values[key];
    if (Number.isFinite(x)) m.set(v.timestamp, x);
  }
  return m;
}

function linePath(candles: ChartData[], series: Series, x: (i: number) => number, y: (v: number) => number): string {
  let d = '';
  let pen = false;
  candles.forEach((c, i) => {
    const v = series.get(c.timestamp);
    if (v === undefined) {
      pen = false;
      return;
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)} `;
    pen = true;
  });
  return d.trim();
}

function formatPrice(n: number): string {
  const digits = n >= 1000 ? 0 : n >= 1 ? 2 : 4;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

const VB_W = 1000;

function AxisLabels({ labels }: { labels: { value: string; topPct: number }[] }) {
  return (
    <div className="absolute inset-y-0 right-0 w-16 pointer-events-none" aria-hidden="true">
      {labels.map((l) => (
        <span
          key={l.value + l.topPct}
          className="absolute right-1 -translate-y-1/2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-900/80 px-0.5 rounded"
          style={{ top: `${l.topPct}%` }}
        >
          {l.value}
        </span>
      ))}
    </div>
  );
}

function PriceChart({
  candles,
  overlays,
  assetName,
  candleLabel,
}: {
  candles: ChartData[];
  overlays: { sma?: Series; ema?: Series; bb?: { upper: Series; middle: Series; lower: Series } };
  assetName: string;
  candleLabel: string;
}) {
  const H = 300;
  const PAD = 12;
  const n = candles.length;
  const values: number[] = [];
  for (const c of candles) values.push(c.high, c.low);
  for (const s of [overlays.sma, overlays.ema, overlays.bb?.upper, overlays.bb?.lower]) {
    if (s) for (const c of candles) {
      const v = s.get(c.timestamp);
      if (v !== undefined) values.push(v);
    }
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const x = (i: number) => ((i + 0.5) / n) * VB_W;
  const y = (v: number) => PAD + ((max - v) / span) * (H - 2 * PAD);
  const pct = (v: number) => (y(v) / H) * 100;
  const bodyW = Math.max(1, (VB_W / n) * 0.6);

  const labels = [max, min + span * 0.75, min + span * 0.5, min + span * 0.25, min].map((v) => ({
    value: formatPrice(v),
    topPct: pct(v),
  }));

  return (
    <div className="relative h-72 sm:h-80 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <svg
        viewBox={`0 0 ${VB_W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-y-0 left-0 w-[calc(100%-4rem)] h-full"
        role="img"
        aria-label={`${assetName} candlestick chart: ${n} ${candleLabel}, low ${formatPrice(min)}, high ${formatPrice(max)}.`}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={VB_W}
            y1={y(min + span * f)}
            y2={y(min + span * f)}
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {overlays.bb && (
          <g fill="none" stroke={COLORS.bb} strokeWidth={1.25} vectorEffect="non-scaling-stroke">
            <path d={linePath(candles, overlays.bb.upper, x, y)} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            <path d={linePath(candles, overlays.bb.middle, x, y)} opacity={0.6} vectorEffect="non-scaling-stroke" />
            <path d={linePath(candles, overlays.bb.lower, x, y)} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          </g>
        )}
        {candles.map((c, i) => {
          const up = c.close >= c.open;
          const color = up ? COLORS.up : COLORS.down;
          const top = y(Math.max(c.open, c.close));
          const bottom = y(Math.min(c.open, c.close));
          return (
            <g key={c.timestamp}>
              <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <rect x={x(i) - bodyW / 2} y={top} width={bodyW} height={Math.max(1, bottom - top)} fill={color} />
            </g>
          );
        })}
        {overlays.sma && (
          <path d={linePath(candles, overlays.sma, x, y)} fill="none" stroke={COLORS.sma} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        )}
        {overlays.ema && (
          <path d={linePath(candles, overlays.ema, x, y)} fill="none" stroke={COLORS.ema} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      <AxisLabels labels={labels} />
    </div>
  );
}

function OscillatorPane({
  title,
  candles,
  lines,
  bars,
  domain,
  refLines,
  ariaLabel,
  formatValue = (v) => v.toFixed(0),
}: {
  title: string;
  candles: ChartData[];
  lines: { series: Series; color: string; label: string }[];
  bars?: Series;
  domain: [number, number];
  refLines: number[];
  ariaLabel: string;
  formatValue?: (v: number) => string;
}) {
  const H = 120;
  const n = candles.length;
  const [lo, hi] = domain;
  const span = hi - lo || 1;
  const x = (i: number) => ((i + 0.5) / n) * VB_W;
  const y = (v: number) => ((hi - v) / span) * H;
  const barW = Math.max(1, (VB_W / n) * 0.6);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <ul className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
          {lines.map((l) => (
            <li key={l.label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5" style={{ backgroundColor: l.color }} aria-hidden="true" />
              {l.label}
            </li>
          ))}
          {bars && (
            <li className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-gray-400" aria-hidden="true" />
              Histogram
            </li>
          )}
        </ul>
      </div>
      <div className="relative h-32 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <svg
          viewBox={`0 0 ${VB_W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-y-0 left-0 w-[calc(100%-4rem)] h-full"
          role="img"
          aria-label={ariaLabel}
        >
          {refLines.map((r) => (
            <line
              key={r}
              x1={0}
              x2={VB_W}
              y1={y(r)}
              y2={y(r)}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              strokeDasharray="4 3"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {bars &&
            candles.map((c, i) => {
              const v = bars.get(c.timestamp);
              if (v === undefined) return null;
              const top = Math.min(y(v), y(0));
              return (
                <rect
                  key={c.timestamp}
                  x={x(i) - barW / 2}
                  y={top}
                  width={barW}
                  height={Math.max(0.5, Math.abs(y(v) - y(0)))}
                  fill={v >= 0 ? COLORS.up : COLORS.down}
                  opacity={0.5}
                />
              );
            })}
          {lines.map((l) => (
            <path
              key={l.label}
              d={linePath(candles, l.series, x, y)}
              fill="none"
              stroke={l.color}
              strokeWidth={1.75}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <AxisLabels labels={refLines.map((r) => ({ value: formatValue(r), topPct: (y(r) / H) * 100 }))} />
      </div>
    </div>
  );
}

function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1];
}

/** Most recent MACD/signal crossover, counted in candles back from the latest. */
function lastMacdCross(m: IndicatorValue[]): { candlesAgo: number; bullish: boolean } | null {
  for (let i = m.length - 1; i > 0; i--) {
    const a = m[i].values.macd - m[i].values.signal;
    const b = m[i - 1].values.macd - m[i - 1].values.signal;
    if (a !== 0 && Math.sign(a) !== Math.sign(b)) return { candlesAgo: m.length - 1 - i, bullish: a > 0 };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type LoadResult =
  | { status: 'error'; message: string }
  | { status: 'ready'; candles: ChartData[] };
type LoadState = { status: 'loading' } | LoadResult;

export default function TradingIndicatorsPage() {
  const [asset, setAsset] = useState<AssetId>('bitcoin');
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('1M');
  const [selected, setSelected] = useState<ChartIndicator[]>(['sma', 'bollinger_bands', 'rsi', 'macd']);
  const [reloadKey, setReloadKey] = useState(0);
  // Each result is tagged with the request that produced it, so changing the
  // asset or timeframe shows the loading state without a synchronous setState
  // inside the effect.
  const requestKey = `${asset}|${timeframe}|${reloadKey}`;
  const [result, setResult] = useState<{ key: string; value: LoadResult } | null>(null);
  const state: LoadState = result && result.key === requestKey ? result.value : { status: 'loading' };

  const assetInfo = ASSETS.find((a) => a.id === asset) ?? ASSETS[0];
  const candleLabel = CHART_TIMEFRAMES[timeframe].candleLabel;

  useEffect(() => {
    let cancelled = false;
    const key = `${asset}|${timeframe}|${reloadKey}`;
    fetchChartData(asset, timeframe)
      .then((candles) => {
        if (!cancelled) setResult({ key, value: { status: 'ready', candles } });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Never fall back to synthetic prices: an error is the honest state.
        setResult({
          key,
          value: { status: 'error', message: err instanceof Error && err.message ? err.message : 'Unknown error' },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [asset, timeframe, reloadKey]);

  const readyCandles = state.status === 'ready' ? state.candles : null;
  const candles = useMemo(() => readyCandles ?? [], [readyCandles]);

  const computed = useMemo(() => {
    const out: Partial<Record<ChartIndicator, IndicatorValue[]>> = {};
    for (const ind of ALL_INDICATORS) {
      out[ind] = candles.length >= INDICATOR_MIN_CANDLES[ind] ? calculateIndicator(candles, ind) : [];
    }
    return out;
  }, [candles]);

  const tooShort = ALL_INDICATORS.filter((i) => candles.length > 0 && candles.length < INDICATOR_MIN_CANDLES[i]);
  const shown = (i: ChartIndicator) => selected.includes(i) && (computed[i]?.length ?? 0) > 0;

  function toggle(ind: ChartIndicator) {
    setSelected((prev) => (prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]));
  }

  // Latest readings (only from real computed values)
  const latestClose = last(candles)?.close;
  const firstOpen = candles[0]?.open;
  const changePct = latestClose !== undefined && firstOpen ? ((latestClose - firstOpen) / firstOpen) * 100 : null;
  const rsiNow = last(computed.rsi ?? [])?.values.rsi;
  const macdNow = last(computed.macd ?? [])?.values;
  const bbNow = last(computed.bollinger_bands ?? [])?.values;
  const smaNow = last(computed.sma ?? [])?.values.sma;
  const emaNow = last(computed.ema ?? [])?.values.ema;
  const stochNow = last(computed.stochastic ?? [])?.values;

  const macdCross = lastMacdCross(computed.macd ?? []);

  const readings: { label: string; value: string; meaning: string }[] = [];
  if (latestClose !== undefined) {
    if (rsiNow !== undefined) {
      readings.push({
        label: 'RSI (14)',
        value: rsiNow.toFixed(1),
        meaning:
          rsiNow >= 70
            ? 'Above 70, the zone traders call "overbought": recent gains have far outweighed losses. Trends can keep RSI here for a long time.'
            : rsiNow <= 30
              ? 'Below 30, the zone traders call "oversold": recent losses have far outweighed gains. It can stay low in a downtrend.'
              : rsiNow >= 50
                ? 'Between 50 and 70: gains have modestly outweighed losses recently. Neutral-to-positive momentum.'
                : 'Between 30 and 50: losses have modestly outweighed gains recently. Neutral-to-negative momentum.',
      });
    }
    if (macdNow) {
      const above = macdNow.macd >= macdNow.signal;
      readings.push({
        label: 'MACD (12, 26, 9)',
        value: `${above ? 'Above' : 'Below'} signal`,
        meaning: `The MACD line is ${above ? 'above' : 'below'} its signal line and ${macdNow.macd >= 0 ? 'above' : 'below'} zero.${
          macdCross
            ? ` The last ${macdCross.bullish ? 'bullish' : 'bearish'} crossover was ${macdCross.candlesAgo === 0 ? 'on the latest candle' : `${macdCross.candlesAgo} candle${macdCross.candlesAgo === 1 ? '' : 's'} ago`}.`
            : ''
        }`,
      });
    }
    if (bbNow) {
      const width = bbNow.upper - bbNow.lower;
      const pctB = width > 0 ? ((latestClose - bbNow.lower) / width) * 100 : 50;
      readings.push({
        label: 'Bollinger position',
        value: `${pctB.toFixed(0)}% of band`,
        meaning:
          pctB > 100
            ? 'The last close is above the upper band: an unusually large move relative to the last 20 candles.'
            : pctB < 0
              ? 'The last close is below the lower band: an unusually large drop relative to the last 20 candles.'
              : `The last close sits ${pctB.toFixed(0)}% of the way from the lower to the upper band (0% = lower band, 100% = upper). Band width is ${bbNow.bandwidth.toFixed(1)}% of price.`,
      });
    }
    if (smaNow !== undefined) {
      const d = ((latestClose - smaNow) / smaNow) * 100;
      readings.push({
        label: 'Price vs SMA (50)',
        value: `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`,
        meaning: `Price is ${Math.abs(d).toFixed(1)}% ${d >= 0 ? 'above' : 'below'} its 50-candle average (${formatPrice(smaNow)}).`,
      });
    }
    if (emaNow !== undefined) {
      const d = ((latestClose - emaNow) / emaNow) * 100;
      readings.push({
        label: 'Price vs EMA (20)',
        value: `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`,
        meaning: `Price is ${Math.abs(d).toFixed(1)}% ${d >= 0 ? 'above' : 'below'} its 20-candle exponential average (${formatPrice(emaNow)}).`,
      });
    }
    if (stochNow) {
      readings.push({
        label: 'Stochastic %K / %D',
        value: `${stochNow.k.toFixed(0)} / ${stochNow.d.toFixed(0)}`,
        meaning:
          stochNow.k >= 80
            ? 'The close is near the top of its 14-candle range (above 80).'
            : stochNow.k <= 20
              ? 'The close is near the bottom of its 14-candle range (below 20).'
              : 'The close is in the middle of its 14-candle range.',
      });
    }
  }

  const lastCandleTime = last(candles)?.timestamp;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="tradingIndicators" urlPath="/trading-indicators" isTool toolName="Crypto Trading Indicators" faqs={FAQS} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-8 w-8 text-green-500 flex-shrink-0" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Crypto Trading Indicators: RSI, MACD and Bollinger Bands
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Trading indicators turn past prices into readings of trend, momentum and volatility. This free tool
            draws SMA, EMA, Bollinger Bands, RSI, MACD and the Stochastic oscillator on live CoinGecko candles for
            Bitcoin, Ethereum and Solana, and explains what each reading means and where it misleads. They describe
            the past; none of them predicts price.
          </p>
          <div className="mt-3">
            <LastUpdated date={LAST_UPDATED} label="Guide last reviewed" />
          </div>
        </header>

        {/* Controls */}
        <section aria-label="Chart settings" className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div role="group" aria-label="Asset" className="flex flex-wrap gap-2">
              {ASSETS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAsset(a.id)}
                  aria-pressed={asset === a.id}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                    asset === a.id
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {a.name} ({a.symbol})
                </button>
              ))}
            </div>
            <div role="group" aria-label="Timeframe" className="flex flex-wrap gap-2">
              {(Object.keys(CHART_TIMEFRAMES) as ChartTimeframe[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  aria-pressed={tf === timeframe}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    tf === timeframe
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div role="group" aria-label="Indicators" className="flex flex-wrap gap-2">
            {ALL_INDICATORS.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => toggle(ind)}
                aria-pressed={selected.includes(ind)}
                className={`px-3 py-1.5 text-sm rounded-full border ${
                  selected.includes(ind)
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {INDICATOR_META[ind].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {timeframe} uses CoinGecko {candleLabel}. Indicator periods count candles, not days.
          </p>
        </section>

        {/* Live data area */}
        <section aria-labelledby="live-heading" aria-busy={state.status === 'loading'}>
          <h2 id="live-heading" className="sr-only">
            Live chart and readings
          </h2>

          {state.status === 'loading' && (
            <div className="space-y-6" role="status">
              <span className="sr-only">Loading price data</span>
              <div className="h-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse" />
              <div className="h-80 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse" />
            </div>
          )}

          {state.status === 'error' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3" role="alert">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  Could not load live price data from CoinGecko ({state.message}).
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  The chart and readings are hidden rather than estimated. The indicator guide below still applies.
                </p>
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {state.status === 'ready' && latestClose !== undefined && (
            <div className="space-y-6">
              {/* Price + readings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {assetInfo.name} ({assetInfo.symbol}) &middot; last close
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(latestClose)}</p>
                  </div>
                  {changePct !== null && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                        changePct >= 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      }`}
                    >
                      {changePct >= 0 ? <TrendingUp className="h-4 w-4" aria-hidden="true" /> : <TrendingDown className="h-4 w-4" aria-hidden="true" />}
                      {changePct >= 0 ? '+' : ''}
                      {changePct.toFixed(2)}% over {timeframe}
                    </span>
                  )}
                </div>
                {readings.length > 0 && (
                  <>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Current readings</h3>
                    <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {readings.map((r) => (
                        <div key={r.label} className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                          <dt className="text-xs text-gray-500 dark:text-gray-400">{r.label}</dt>
                          <dd>
                            <span className="block text-lg font-semibold text-gray-900 dark:text-white">{r.value}</span>
                            <span className="block text-sm text-gray-600 dark:text-gray-400 mt-1">{r.meaning}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  {candles.length} {candleLabel}
                  {lastCandleTime !== undefined && <> &middot; latest candle {new Date(lastCandleTime).toLocaleString()} (may still be forming)</>}
                  {' '}&middot; Source:{' '}
                  <ExternalLink href={`https://www.coingecko.com/en/coins/${asset}`}>CoinGecko</ExternalLink>. Readings describe
                  past prices and are not buy or sell signals.
                </p>
              </div>

              {tooShort.length > 0 && (
                <p className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-900 dark:text-yellow-200">
                  This timeframe returned {candles.length} {candleLabel}, which is not enough for{' '}
                  {tooShort.map((i) => INDICATOR_META[i].label).join(', ')}. Pick a timeframe that returns more candles
                  (1W, 1M or 1Y) to see {tooShort.length > 1 ? 'them' : 'it'}.
                </p>
              )}

              {/* Price chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {assetInfo.symbol} price ({timeframe})
                  </h3>
                  <ul className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                    {shown('sma') && (
                      <li className="flex items-center gap-1">
                        <span className="inline-block w-3 h-0.5" style={{ backgroundColor: COLORS.sma }} aria-hidden="true" />
                        {INDICATOR_META.sma.label}
                      </li>
                    )}
                    {shown('ema') && (
                      <li className="flex items-center gap-1">
                        <span className="inline-block w-3 h-0.5" style={{ backgroundColor: COLORS.ema }} aria-hidden="true" />
                        {INDICATOR_META.ema.label}
                      </li>
                    )}
                    {shown('bollinger_bands') && (
                      <li className="flex items-center gap-1">
                        <span className="inline-block w-3 h-0.5" style={{ backgroundColor: COLORS.bb }} aria-hidden="true" />
                        {INDICATOR_META.bollinger_bands.label}
                      </li>
                    )}
                  </ul>
                </div>
                <PriceChart
                  candles={candles}
                  assetName={assetInfo.name}
                  candleLabel={candleLabel}
                  overlays={{
                    sma: shown('sma') ? toSeries(computed.sma ?? [], 'sma') : undefined,
                    ema: shown('ema') ? toSeries(computed.ema ?? [], 'ema') : undefined,
                    bb: shown('bollinger_bands')
                      ? {
                          upper: toSeries(computed.bollinger_bands ?? [], 'upper'),
                          middle: toSeries(computed.bollinger_bands ?? [], 'middle'),
                          lower: toSeries(computed.bollinger_bands ?? [], 'lower'),
                        }
                      : undefined,
                  }}
                />
              </div>

              {shown('rsi') && (
                <OscillatorPane
                  title={INDICATOR_META.rsi.label}
                  candles={candles}
                  domain={[0, 100]}
                  refLines={[70, 50, 30]}
                  lines={[{ series: toSeries(computed.rsi ?? [], 'rsi'), color: COLORS.line1, label: 'RSI' }]}
                  ariaLabel={`RSI on a 0 to 100 scale with reference lines at 30 and 70. Latest ${rsiNow?.toFixed(1)}.`}
                />
              )}

              {shown('macd') &&
                (() => {
                  const vals = computed.macd ?? [];
                  const extent = Math.max(
                    ...vals.flatMap((v) => [Math.abs(v.values.macd), Math.abs(v.values.signal), Math.abs(v.values.histogram)])
                  ) || 1;
                  const fmt = (v: number) =>
                    Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 1 ? v.toFixed(1) : v.toFixed(3);
                  return (
                    <OscillatorPane
                      title={INDICATOR_META.macd.label}
                      candles={candles}
                      domain={[-extent * 1.05, extent * 1.05]}
                      refLines={[extent, 0, -extent]}
                      formatValue={fmt}
                      bars={toSeries(vals, 'histogram')}
                      lines={[
                        { series: toSeries(vals, 'macd'), color: COLORS.line1, label: 'MACD line' },
                        { series: toSeries(vals, 'signal'), color: COLORS.line2, label: 'Signal line' },
                      ]}
                      ariaLabel="MACD line, signal line and histogram around a zero line."
                    />
                  );
                })()}

              {shown('stochastic') && (
                <OscillatorPane
                  title={INDICATOR_META.stochastic.label}
                  candles={candles}
                  domain={[0, 100]}
                  refLines={[80, 50, 20]}
                  lines={[
                    { series: toSeries(computed.stochastic ?? [], 'k'), color: COLORS.line1, label: '%K' },
                    { series: toSeries(computed.stochastic ?? [], 'd'), color: COLORS.line2, label: '%D' },
                  ]}
                  ariaLabel="Stochastic %K and %D on a 0 to 100 scale with reference lines at 20 and 80."
                />
              )}
            </div>
          )}
        </section>

        <div className="mt-8">
          <NotAdviceNote>
            Educational tool, not financial advice. Indicator readings summarise past prices; they are not
            recommendations to buy or sell. Crypto is volatile and you can lose money.
          </NotAdviceNote>
        </div>

        <div className="max-w-3xl">
          <Section id="guide-heading" title="What each indicator measures">
            <p>
              Indicators fall into three families. <strong>Trend</strong> indicators (SMA, EMA) smooth price to show
              direction. <strong>Volatility</strong> indicators (Bollinger Bands) show how far price usually strays.
              <strong> Momentum</strong> oscillators (RSI, MACD, Stochastic) show how fast price has been moving.
              Using two from the same family mostly tells you the same thing twice.
            </p>
          </Section>
          <div className="mt-6 space-y-6">
            {INDICATOR_GUIDE.map((g) => (
              <article key={g.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{g.name}</h3>
                <dl className="space-y-3 text-gray-700 dark:text-gray-300">
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">What it is</dt>
                    <dd>{g.what}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Default settings</dt>
                    <dd>{g.settings}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">How traders read it</dt>
                    <dd>{g.read}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Limits</dt>
                    <dd>{g.limits}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <Section id="caveats-heading" title="Using indicators without fooling yourself">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>They lag.</strong> Every indicator here is calculated from closed prices, so it confirms a move
                after it starts.
              </li>
              <li>
                <strong>Settings change the answer.</strong> The same RSI on 30-minute and 4-day candles can say
                opposite things. Decide your timeframe before you look.
              </li>
              <li>
                <strong>Backtests flatter.</strong> Rules tuned on past data usually do worse live once fees, slippage
                and the 24/7 crypto market are included. Try your rule in the{' '}
                <Link to="/backtesting" className="text-blue-600 dark:text-blue-400 underline">
                  backtesting tool
                </Link>{' '}
                before trusting it.
              </li>
              <li>
                <strong>Position size matters more than entry.</strong> A good-looking signal with too much money behind
                it can still ruin you. See the{' '}
                <Link to="/learn/risk-management" className="text-blue-600 dark:text-blue-400 underline">
                  risk management guide
                </Link>
                .
              </li>
              <li>
                <strong>Most long-term investors do not need them.</strong> If you are buying to hold for years, a
                plan like dollar-cost averaging matters far more than short-term momentum readings.
              </li>
            </ul>
          </Section>

          <FaqSection faqs={FAQS} />

          <RelatedLinks
            links={[
              { to: '/backtesting', title: 'Backtesting tool', description: 'Test a strategy on historical prices.' },
              { to: '/learn/risk-management', title: 'Risk management', description: 'Position sizing and stop losses.' },
              { to: '/charts', title: 'Price charts', description: 'Longer-term price history.' },
              { to: '/onchain-analytics', title: 'Bitcoin on-chain metrics', description: 'Hashrate, fees and network activity.' },
              { to: '/learn/dca-strategies', title: 'DCA strategies', description: 'A rules-based alternative to timing the market.' },
              { to: '/glossary', title: 'Crypto glossary', description: 'Plain-English definitions.' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
