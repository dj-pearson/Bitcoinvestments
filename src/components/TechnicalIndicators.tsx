import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Minus,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  calculateAllIndicators,
  generateTechnicalSignals,
  getSignalColor,
  getSignalLabel,
  type PricePoint,
  type TechnicalAnalysis,
  type TechnicalSummary,
} from '../services/technicalIndicators';

interface TechnicalIndicatorsProps {
  prices: PricePoint[];
  coinSymbol: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function TechnicalIndicators({
  prices,
  coinSymbol,
  isLoading = false,
  onRefresh,
}: TechnicalIndicatorsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');

  // Calculate indicators
  const indicators = useMemo(() => {
    if (prices.length < 30) return null;
    return calculateAllIndicators(prices);
  }, [prices]);

  // Generate signals
  const summary = useMemo(() => {
    if (!indicators) return null;
    return generateTechnicalSignals(prices, indicators);
  }, [prices, indicators]);

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!indicators || !summary) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Insufficient Data</h3>
          <p className="text-slate-400">
            At least 30 data points are needed to calculate technical indicators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Technical Analysis</h2>
              <p className="text-sm text-slate-400">{coinSymbol.toUpperCase()}</p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Overall Signal */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 mb-1">Overall Signal</div>
            <div
              className="text-2xl font-bold"
              style={{ color: getSignalColor(summary.overallSignal) }}
            >
              {getSignalLabel(summary.overallSignal)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Score</div>
            <div className="flex items-center gap-2">
              <SignalMeter score={summary.score} />
              <span
                className="text-xl font-bold"
                style={{ color: getSignalColor(summary.overallSignal) }}
              >
                {summary.score > 0 ? '+' : ''}{summary.score}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-slate-700">
        {/* Summary Section */}
        <IndicatorSection
          title="Signal Summary"
          icon={<BarChart3 className="h-5 w-5" />}
          isExpanded={expandedSection === 'summary'}
          onToggle={() => setExpandedSection(expandedSection === 'summary' ? null : 'summary')}
        >
          <div className="space-y-3">
            {summary.signals.map((signal, index) => (
              <SignalRow key={index} signal={signal} />
            ))}
          </div>
        </IndicatorSection>

        {/* RSI Section */}
        <IndicatorSection
          title="RSI (14)"
          icon={<Activity className="h-5 w-5" />}
          isExpanded={expandedSection === 'rsi'}
          onToggle={() => setExpandedSection(expandedSection === 'rsi' ? null : 'rsi')}
          badge={
            indicators.rsi.length > 0
              ? indicators.rsi[indicators.rsi.length - 1].value.toFixed(1)
              : undefined
          }
        >
          <RSIDisplay indicators={indicators} />
        </IndicatorSection>

        {/* MACD Section */}
        <IndicatorSection
          title="MACD (12,26,9)"
          icon={<TrendingUp className="h-5 w-5" />}
          isExpanded={expandedSection === 'macd'}
          onToggle={() => setExpandedSection(expandedSection === 'macd' ? null : 'macd')}
        >
          <MACDDisplay indicators={indicators} />
        </IndicatorSection>

        {/* Bollinger Bands Section */}
        <IndicatorSection
          title="Bollinger Bands (20,2)"
          icon={<BarChart3 className="h-5 w-5" />}
          isExpanded={expandedSection === 'bb'}
          onToggle={() => setExpandedSection(expandedSection === 'bb' ? null : 'bb')}
        >
          <BollingerDisplay indicators={indicators} currentPrice={prices[prices.length - 1]?.close} />
        </IndicatorSection>

        {/* Moving Averages Section */}
        <IndicatorSection
          title="Moving Averages"
          icon={<TrendingDown className="h-5 w-5" />}
          isExpanded={expandedSection === 'ma'}
          onToggle={() => setExpandedSection(expandedSection === 'ma' ? null : 'ma')}
        >
          <MovingAveragesDisplay indicators={indicators} currentPrice={prices[prices.length - 1]?.close} />
        </IndicatorSection>

        {/* Stochastic Section */}
        <IndicatorSection
          title="Stochastic (14,3,3)"
          icon={<Activity className="h-5 w-5" />}
          isExpanded={expandedSection === 'stoch'}
          onToggle={() => setExpandedSection(expandedSection === 'stoch' ? null : 'stoch')}
        >
          <StochasticDisplay indicators={indicators} />
        </IndicatorSection>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-slate-800/50 flex items-start gap-3">
        <Info className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          Technical indicators are for informational purposes only and should not be considered
          financial advice. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}

// Signal Meter Component
function SignalMeter({ score }: { score: number }) {
  // Score ranges from -100 to 100
  const normalizedScore = (score + 100) / 200; // 0 to 1
  const rotation = normalizedScore * 180 - 90; // -90 to 90 degrees

  return (
    <div className="relative w-16 h-8 overflow-hidden">
      {/* Background arc */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 100 50" className="w-full">
          <defs>
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="75%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="url(#meterGradient)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {/* Needle */}
      <div
        className="absolute bottom-0 left-1/2 w-0.5 h-6 bg-white origin-bottom"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      />
    </div>
  );
}

// Indicator Section Component
function IndicatorSection({
  title,
  icon,
  isExpanded,
  onToggle,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-slate-400">{icon}</div>
          <span className="font-medium text-white">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-slate-700 rounded text-sm text-slate-300">
              {badge}
            </span>
          )}
        </div>
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>
      {isExpanded && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// Signal Row Component
function SignalRow({ signal }: { signal: TechnicalSummary['signals'][0] }) {
  const getSignalIcon = () => {
    switch (signal.signal) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
      <div className="flex-shrink-0">{getSignalIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white">{signal.indicator}</div>
        <div className="text-sm text-slate-400 truncate">{signal.reason}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div
          className={`text-sm font-medium ${
            signal.signal === 'buy'
              ? 'text-green-400'
              : signal.signal === 'sell'
              ? 'text-red-400'
              : 'text-slate-400'
          }`}
        >
          {signal.signal.toUpperCase()}
        </div>
        <div className="text-xs text-slate-500">{signal.strength}%</div>
      </div>
    </div>
  );
}

// RSI Display Component
function RSIDisplay({ indicators }: { indicators: TechnicalAnalysis }) {
  const currentRSI = indicators.rsi[indicators.rsi.length - 1]?.value || 0;

  const getZoneColor = (rsi: number) => {
    if (rsi < 30) return 'text-green-400';
    if (rsi > 70) return 'text-red-400';
    return 'text-slate-300';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-slate-400">Current RSI</span>
        <span className={`text-xl font-bold ${getZoneColor(currentRSI)}`}>
          {currentRSI.toFixed(2)}
        </span>
      </div>

      {/* RSI Gauge */}
      <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-[30%] bg-green-500/30" />
        <div className="absolute inset-y-0 left-[30%] right-[30%] bg-slate-700/30" />
        <div className="absolute inset-y-0 right-0 w-[30%] bg-red-500/30" />
        <div
          className="absolute top-0 bottom-0 w-1 bg-white rounded"
          style={{ left: `${currentRSI}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-slate-500">
        <span>0 (Oversold)</span>
        <span>50</span>
        <span>100 (Overbought)</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 mb-1">Oversold Zone</div>
          <div className="text-green-400">Below 30</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 mb-1">Overbought Zone</div>
          <div className="text-red-400">Above 70</div>
        </div>
      </div>
    </div>
  );
}

// MACD Display Component
function MACDDisplay({ indicators }: { indicators: TechnicalAnalysis }) {
  const current = indicators.macd[indicators.macd.length - 1];

  if (!current) {
    return <div className="text-slate-400">Insufficient data for MACD</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">MACD Line</div>
          <div className={`font-bold ${current.macd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {current.macd.toFixed(4)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">Signal Line</div>
          <div className="font-bold text-blue-400">{current.signal.toFixed(4)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">Histogram</div>
          <div className={`font-bold ${current.histogram >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {current.histogram >= 0 ? '+' : ''}{current.histogram.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Histogram visualization */}
      <div className="h-16 flex items-end justify-center gap-1">
        {indicators.macd.slice(-20).map((data, index) => (
          <div
            key={index}
            className={`w-2 rounded-t ${data.histogram >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{
              height: `${Math.min(100, Math.abs(data.histogram) * 1000)}%`,
              opacity: 0.3 + (index / 20) * 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Bollinger Bands Display
function BollingerDisplay({
  indicators,
  currentPrice,
}: {
  indicators: TechnicalAnalysis;
  currentPrice?: number;
}) {
  const current = indicators.bollingerBands[indicators.bollingerBands.length - 1];

  if (!current) {
    return <div className="text-slate-400">Insufficient data for Bollinger Bands</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">Upper Band</div>
          <div className="font-bold text-red-400">${current.upper.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">Middle (SMA)</div>
          <div className="font-bold text-blue-400">${current.middle.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">Lower Band</div>
          <div className="font-bold text-green-400">${current.lower.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">Bandwidth</div>
          <div className="font-bold text-white">{current.bandwidth.toFixed(2)}%</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">%B</div>
          <div
            className={`font-bold ${
              current.percentB < 20
                ? 'text-green-400'
                : current.percentB > 80
                ? 'text-red-400'
                : 'text-white'
            }`}
          >
            {current.percentB.toFixed(2)}%
          </div>
        </div>
      </div>

      {currentPrice && (
        <div className="text-center text-sm text-slate-400">
          Current price ${currentPrice.toLocaleString()} is{' '}
          {currentPrice < current.middle ? 'below' : 'above'} the middle band
        </div>
      )}
    </div>
  );
}

// Moving Averages Display
function MovingAveragesDisplay({
  indicators,
  currentPrice,
}: {
  indicators: TechnicalAnalysis;
  currentPrice?: number;
}) {
  const sma20 = indicators.sma20[indicators.sma20.length - 1]?.value;
  const sma50 = indicators.sma50[indicators.sma50.length - 1]?.value;
  const sma200 = indicators.sma200[indicators.sma200.length - 1]?.value;
  const ema12 = indicators.ema12[indicators.ema12.length - 1]?.value;
  const ema26 = indicators.ema26[indicators.ema26.length - 1]?.value;

  const maData = [
    { label: 'SMA 20', value: sma20 },
    { label: 'SMA 50', value: sma50 },
    { label: 'SMA 200', value: sma200 },
    { label: 'EMA 12', value: ema12 },
    { label: 'EMA 26', value: ema26 },
  ].filter((ma) => ma.value !== undefined);

  return (
    <div className="space-y-3">
      {maData.map((ma) => (
        <div
          key={ma.label}
          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
        >
          <span className="text-slate-300">{ma.label}</span>
          <div className="text-right">
            <div className="font-bold text-white">${ma.value!.toLocaleString()}</div>
            {currentPrice && (
              <div
                className={`text-xs ${
                  currentPrice > ma.value! ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {currentPrice > ma.value! ? 'Price above' : 'Price below'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Stochastic Display
function StochasticDisplay({ indicators }: { indicators: TechnicalAnalysis }) {
  const current = indicators.stochastic[indicators.stochastic.length - 1];

  if (!current) {
    return <div className="text-slate-400">Insufficient data for Stochastic</div>;
  }

  const getZone = () => {
    if (current.k < 20 && current.d < 20) return { label: 'Oversold', color: 'text-green-400' };
    if (current.k > 80 && current.d > 80) return { label: 'Overbought', color: 'text-red-400' };
    return { label: 'Neutral', color: 'text-slate-400' };
  };

  const zone = getZone();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">%K</div>
          <div className="font-bold text-blue-400">{current.k.toFixed(2)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-500 text-sm mb-1">%D</div>
          <div className="font-bold text-orange-400">{current.d.toFixed(2)}</div>
        </div>
      </div>

      {/* Gauge */}
      <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-[20%] bg-green-500/30" />
        <div className="absolute inset-y-0 left-[20%] right-[20%] bg-slate-700/30" />
        <div className="absolute inset-y-0 right-0 w-[20%] bg-red-500/30" />
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-400 rounded"
          style={{ left: `${current.k}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-1 bg-orange-400 rounded"
          style={{ left: `${current.d}%` }}
        />
      </div>

      <div className="text-center">
        <span className={`font-medium ${zone.color}`}>{zone.label}</span>
      </div>
    </div>
  );
}
