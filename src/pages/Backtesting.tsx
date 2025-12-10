import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  BarChart3,
  Lock,
  RefreshCw,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasAdvancedBacktesting } from '../services/subscriptionLimits';
import {
  runBacktest,
  getSupportedAssets,
  formatCurrency,
  formatPercentage,
  getPresetPeriods,
  getStartDateFromPeriod,
  type BacktestInput,
  type BacktestResult,
} from '../services/backtesting';
import { cn } from '../lib/utils';

export function Backtesting() {
  const { profile } = useAuth();
  const isPremium = profile ? hasAdvancedBacktesting(
    profile.subscription_status,
    profile.subscription_expires_at
  ) : false;

  const [input, setInput] = useState<BacktestInput>({
    asset: 'bitcoin',
    initialInvestment: 1000,
    startDate: getStartDateFromPeriod(24), // 2 years ago
    dcaAmount: undefined,
    dcaFrequency: undefined,
  });

  const [enableDCA, setEnableDCA] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const assets = getSupportedAssets();
  const periods = getPresetPeriods();

  const handleRunBacktest = () => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      const backtestInput: BacktestInput = {
        ...input,
        dcaAmount: enableDCA ? input.dcaAmount : undefined,
        dcaFrequency: enableDCA ? input.dcaFrequency : undefined,
      };
      const backtestResult = runBacktest(backtestInput);
      setResult(backtestResult);
      setLoading(false);
    }, 500);
  };

  const handlePeriodSelect = (months: number) => {
    setInput({
      ...input,
      startDate: getStartDateFromPeriod(months),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Investment <span className="text-gradient">Backtesting</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          "What if I had invested $X in Bitcoin Y years ago?" Find out with our backtesting tool.
          Analyze historical performance and simulate DCA strategies.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-6">Backtest Parameters</h2>

            {/* Asset Selection */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Asset</label>
              <select
                value={input.asset}
                onChange={(e) => setInput({ ...input, asset: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Investment */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Initial Investment</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={input.initialInvestment}
                  onChange={(e) => setInput({ ...input, initialInvestment: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 pl-8 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  min={1}
                />
              </div>
            </div>

            {/* Time Period */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Time Period</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {periods.map((period) => (
                  <button
                    key={period.label}
                    onClick={() => handlePeriodSelect(period.months)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                      input.startDate === getStartDateFromPeriod(period.months)
                        ? "bg-brand-primary text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    value={input.startDate}
                    onChange={(e) => setInput({ ...input, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-primary"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* DCA Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-400">Enable DCA Simulation</label>
                {!isPremium && (
                  <span className="flex items-center gap-1 text-xs text-brand-primary">
                    <Lock className="w-3 h-3" />
                    Premium
                  </span>
                )}
              </div>
              <button
                onClick={() => isPremium && setEnableDCA(!enableDCA)}
                disabled={!isPremium}
                className={cn(
                  "w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                  enableDCA
                    ? "bg-brand-primary text-white"
                    : isPremium
                    ? "bg-white/5 text-gray-400 hover:bg-white/10"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                )}
              >
                {enableDCA ? 'DCA Enabled' : 'Enable DCA'}
                {!isPremium && <Lock className="w-4 h-4" />}
              </button>
            </div>

            {/* DCA Options (if enabled) */}
            {enableDCA && isPremium && (
              <div className="space-y-4 mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Recurring Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={input.dcaAmount || 100}
                      onChange={(e) => setInput({ ...input, dcaAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 pl-8 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Frequency</label>
                  <select
                    value={input.dcaFrequency || 'monthly'}
                    onChange={(e) => setInput({ ...input, dcaFrequency: e.target.value as BacktestInput['dcaFrequency'] })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={handleRunBacktest}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Run Backtest
                </>
              )}
            </button>

            {/* Premium Upsell */}
            {!isPremium && (
              <div className="mt-6 p-4 rounded-lg bg-brand-primary/10 border border-brand-primary/30">
                <p className="text-sm text-gray-300 mb-3">
                  Unlock advanced backtesting with DCA simulation, multi-asset comparison, and more.
                </p>
                <Link
                  to="/pricing"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30 font-medium transition-colors text-sm"
                >
                  Upgrade to Premium <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {!result ? (
            <div className="glass-card p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Run a Backtest</h3>
              <p className="text-gray-400">
                Configure your parameters and click "Run Backtest" to see what your investment would be worth today.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                  <p className="text-gray-400 text-sm mb-1">Total Invested</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(result.totalInvested)}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-gray-400 text-sm mb-1">Final Value</p>
                  <p className="text-xl font-bold text-green-500">{formatCurrency(result.finalValue)}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-gray-400 text-sm mb-1">Total Return</p>
                  <p className={cn(
                    "text-xl font-bold",
                    result.totalReturn >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatPercentage(result.totalReturnPercentage)}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-gray-400 text-sm mb-1">Annualized Return</p>
                  <p className={cn(
                    "text-xl font-bold",
                    result.annualizedReturn >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatPercentage(result.annualizedReturn)}
                  </p>
                </div>
              </div>

              {/* Main Result Card */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Investment Summary</h3>
                  <span className="text-sm text-gray-400">
                    {result.startDate} → {result.endDate}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Profit/Loss */}
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      {result.totalReturn >= 0 ? (
                        <TrendingUp className="w-8 h-8 text-green-500" />
                      ) : (
                        <TrendingDown className="w-8 h-8 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm text-gray-400">Profit/Loss</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          result.totalReturn >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {result.totalReturn >= 0 ? '+' : ''}{formatCurrency(result.totalReturn)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      Your {formatCurrency(result.totalInvested)} investment would be worth{' '}
                      <span className="text-white font-medium">{formatCurrency(result.finalValue)}</span> today.
                    </p>
                  </div>

                  {/* Risk Metrics */}
                  <div className="p-4 rounded-lg bg-white/5">
                    <h4 className="font-medium text-white mb-3">Risk Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Drawdown</span>
                        <span className="text-red-400">-{result.maxDrawdown.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">All-Time High</span>
                        <span className="text-green-400">{formatCurrency(result.allTimeHigh)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">ATH Date</span>
                        <span className="text-white">{result.allTimeHighDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DCA Comparison (if applicable) */}
              {result.dcaSummary && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">DCA vs Lump Sum Comparison</h3>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-white/5 text-center">
                      <p className="text-sm text-gray-400 mb-1">Total Investments</p>
                      <p className="text-xl font-bold text-white">{result.dcaSummary.totalInvestments}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 text-center">
                      <p className="text-sm text-gray-400 mb-1">Average Cost</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(result.dcaSummary.averageCost)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 text-center">
                      <p className="text-sm text-gray-400 mb-1">Final Holdings</p>
                      <p className="text-xl font-bold text-white">{result.dcaSummary.finalHoldings.toFixed(6)}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className={cn(
                      "p-4 rounded-lg",
                      result.dcaSummary.dcaAdvantage >= 0 ? "bg-green-500/10 border border-green-500/30" : "bg-white/5"
                    )}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-white">DCA Strategy</span>
                        {result.dcaSummary.dcaAdvantage >= 0 && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Better</span>
                        )}
                      </div>
                      <p className={cn(
                        "text-2xl font-bold",
                        result.dcaSummary.dcaReturnPercentage >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {formatPercentage(result.dcaSummary.dcaReturnPercentage)}
                      </p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-lg",
                      result.dcaSummary.dcaAdvantage < 0 ? "bg-green-500/10 border border-green-500/30" : "bg-white/5"
                    )}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-white">Lump Sum Strategy</span>
                        {result.dcaSummary.dcaAdvantage < 0 && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Better</span>
                        )}
                      </div>
                      <p className={cn(
                        "text-2xl font-bold",
                        result.dcaSummary.lumpSumReturnPercentage >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {formatPercentage(result.dcaSummary.lumpSumReturnPercentage)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-300">
                      {result.dcaSummary.dcaAdvantage >= 0
                        ? `DCA outperformed lump sum by ${formatPercentage(result.dcaSummary.dcaAdvantage)} in this period due to favorable market conditions.`
                        : `Lump sum outperformed DCA by ${formatPercentage(Math.abs(result.dcaSummary.dcaAdvantage))} in this period. In a bull market, early entry typically performs better.`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Investment Timeline */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Investment Timeline</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Date</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Invested</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Value</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {result.investmentHistory.slice(-10).map((point, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white">{point.date}</td>
                          <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(point.invested)}</td>
                          <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(point.value)}</td>
                          <td className={cn(
                            "px-4 py-3 text-right font-medium",
                            point.profit >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {point.profit >= 0 ? '+' : ''}{formatCurrency(point.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-yellow-300">
                  <strong>Disclaimer:</strong> This backtesting tool uses historical data and is for educational purposes only.
                  Past performance does not guarantee future results. This is not financial advice.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
