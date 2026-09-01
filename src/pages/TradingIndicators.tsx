/**
 * Custom Trading Indicators Page
 *
 * Premium charting with RSI, MACD, Bollinger Bands, and custom indicator creation.
 * Free users: basic candlestick charts only
 * Premium: all indicators, custom formulas, signals
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  LineChart,
  Check,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  hasTradingIndicatorsPremium,
  TRADING_INDICATORS_PRICING,
} from '../services/subscriptionLimits';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  generateTradingSignals,
  generateMockChartData,
  getAvailableIndicators,
} from '../services/tradingIndicators';
import type {
  IndicatorType,
  ChartData,
  IndicatorValue,
  TradingSignal,
} from '../types/premiumFeatures';

import { PageSEO } from '../components/PageSEO';
const INDICATOR_PRESETS_DATA = [
  { id: 'rsi-14', name: 'RSI (14)', description: 'Relative Strength Index', is_premium: true },
  { id: 'macd-12-26-9', name: 'MACD', description: 'Moving Average Convergence Divergence', is_premium: true },
  { id: 'bb-20-2', name: 'Bollinger Bands', description: '20-period with 2 std dev', is_premium: true },
  { id: 'sma-50', name: 'SMA (50)', description: 'Simple Moving Average', is_premium: false },
  { id: 'ema-20', name: 'EMA (20)', description: 'Exponential Moving Average', is_premium: true },
  { id: 'stoch-14', name: 'Stochastic', description: 'Stochastic Oscillator', is_premium: true },
];

export default function TradingIndicatorsPage() {
  const { profile } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorType[]>(['sma']);
  const [rsiValues, setRsiValues] = useState<IndicatorValue[]>([]);
  const [_macdValues, setMacdValues] = useState<IndicatorValue[]>([]);
  const [_bbValues, setBbValues] = useState<IndicatorValue[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasAccess = hasTradingIndicatorsPremium(undefined, profile?.subscription_status);
  const availableIndicators = getAvailableIndicators(hasAccess);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = generateMockChartData(100);
      setChartData(data);

      // Calculate indicators
      setRsiValues(calculateRSI(data));
      setMacdValues(calculateMACD(data));
      setBbValues(calculateBollingerBands(data));

      // Generate signals
      if (hasAccess) {
        const tradingSignals = generateTradingSignals(data, ['rsi', 'macd', 'bollinger_bands']);
        setSignals(tradingSignals);
      }
    } catch (err) {
      console.error('Failed to load chart data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleIndicator(indicator: IndicatorType) {
    if (!availableIndicators.includes(indicator)) return;
    setSelectedIndicators(prev =>
      prev.includes(indicator)
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  }

  const latestPrice = chartData[chartData.length - 1]?.close || 0;
  const prevPrice = chartData[chartData.length - 2]?.close || 0;
  const priceChange = ((latestPrice - prevPrice) / prevPrice) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="tradingIndicators" urlPath="/trading-indicators" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Trading Indicators
            </h1>
            {hasAccess && (
              <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full">
                PREMIUM
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced technical analysis with RSI, MACD, Bollinger Bands, and more.
          </p>
        </div>

        {/* Price Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bitcoin (BTC)</p>
              <div className="flex items-center gap-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${latestPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <span className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                  priceChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {['1D', '1W', '1M', '3M', '1Y'].map(tf => (
                <button
                  key={tf}
                  className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Indicator Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Indicators</h2>
              <div className="space-y-2">
                {INDICATOR_PRESETS_DATA.map(indicator => {
                  const isAvailable = !indicator.is_premium || hasAccess;
                  const isSelected = selectedIndicators.includes(indicator.id.split('-')[0] as IndicatorType);

                  return (
                    <button
                      key={indicator.id}
                      onClick={() => isAvailable && toggleIndicator(indicator.id.split('-')[0] as IndicatorType)}
                      disabled={!isAvailable}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-green-500 text-white'
                          : isAvailable
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{indicator.name}</p>
                          <p className="text-xs opacity-75">{indicator.description}</p>
                        </div>
                        {!isAvailable && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">PRO</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!hasAccess && (
                <div className="mt-6 p-4 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg text-white">
                  <p className="font-semibold mb-2">Unlock All Indicators</p>
                  <p className="text-sm text-green-100 mb-3">
                    Get access to RSI, MACD, Bollinger Bands, and more.
                  </p>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-1 text-sm font-medium bg-white text-green-600 px-3 py-1.5 rounded hover:bg-green-50"
                  >
                    Upgrade
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Chart Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Main Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Price Chart</h3>
                <button className="p-2 text-gray-500 hover:text-gray-700">
                  <Settings className="h-5 w-5" />
                </button>
              </div>

              {/* Candlestick Chart Visualization */}
              <div className="h-80 flex items-end gap-0.5 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                {chartData.slice(-50).map((candle, i) => {
                  const isGreen = candle.close >= candle.open;
                  const bodyHeight = Math.abs(candle.close - candle.open) / 1000;
                  const wickTop = (candle.high - Math.max(candle.open, candle.close)) / 1000;
                  const wickBottom = (Math.min(candle.open, candle.close) - candle.low) / 1000;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-px ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ height: `${wickTop * 5}px` }}
                      />
                      <div
                        className={`w-full max-w-[8px] ${isGreen ? 'bg-green-500' : 'bg-red-500'} rounded-sm`}
                        style={{ height: `${Math.max(2, bodyHeight * 5)}px` }}
                      />
                      <div
                        className={`w-px ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ height: `${wickBottom * 5}px` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RSI Indicator */}
            {hasAccess && selectedIndicators.includes('rsi') && rsiValues.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">RSI (14)</h3>
                <div className="h-32 relative">
                  <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400">
                    <span>70</span>
                    <span>50</span>
                    <span>30</span>
                  </div>
                  <div className="ml-8 h-full flex items-end gap-0.5 bg-gray-50 dark:bg-gray-900 rounded">
                    {rsiValues.slice(-50).map((val, i) => {
                      const rsi = val.values.rsi;
                      const color = rsi > 70 ? 'bg-red-500' : rsi < 30 ? 'bg-green-500' : 'bg-blue-500';
                      return (
                        <div
                          key={i}
                          className={`flex-1 ${color} rounded-t`}
                          style={{ height: `${rsi}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
                <p className="text-right text-sm text-gray-500 mt-2">
                  Current: {rsiValues[rsiValues.length - 1]?.values.rsi.toFixed(1)}
                </p>
              </div>
            )}

            {/* Trading Signals */}
            {hasAccess && signals.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Trading Signals
                </h3>
                <div className="space-y-3">
                  {signals.map((signal, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border-l-4 ${
                        signal.signal_type === 'buy' || signal.signal_type === 'oversold'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : signal.signal_type === 'sell' || signal.signal_type === 'overbought'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{signal.indicator}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{signal.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-sm font-medium capitalize ${
                            signal.signal_type === 'buy' || signal.signal_type === 'oversold'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {signal.signal_type}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Strength: {signal.strength}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Premium Upsell */}
            {!hasAccess && (
              <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-xl p-8 text-white">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Unlock Advanced Indicators</h3>
                    <ul className="space-y-3 mb-6">
                      {TRADING_INDICATORS_PRICING.features.premium.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-300" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold">${TRADING_INDICATORS_PRICING.price_monthly}</span>
                      <span className="text-green-200">/month</span>
                    </div>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50"
                    >
                      Start Pro Trial
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                  <div className="hidden md:flex items-center justify-center">
                    <LineChart className="h-32 w-32 text-white/30" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
