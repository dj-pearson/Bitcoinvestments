/**
 * Crypto Retirement Calculator Page
 *
 * Model crypto allocation in retirement portfolio with Monte Carlo projections,
 * tax implications, and withdrawal strategies.
 * Premium at $99/year or bundled with main subscription.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PiggyBank,
  Calculator,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Check,
  ChevronRight,
  Download,
  Info,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  RETIREMENT_CALCULATOR_PRICING,
  DEFAULT_RETIREMENT_INPUTS,
  calculateRetirementProjection,
  formatCurrency,
  formatPercent,
  getSuccessColor,
  exportProjectionData,
  STATE_TAX_RATES,
} from '../services/retirementCalculator';
import type { RetirementInputs, RetirementProjection, RetirementScenario } from '../types/premiumFeatures';

import { PageSEO } from '../components/PageSEO';
export default function RetirementCalculatorPage() {
  const { user } = useAuth();
  const [isPremium] = useState(false);
  const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_RETIREMENT_INPUTS);
  const [projection, setProjection] = useState<RetirementProjection | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'inputs' | 'results' | 'tax'>('inputs');
  const [_scenario] = useState<RetirementScenario>('moderate');

  const updateInput = <K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  async function handleCalculate() {
    setIsCalculating(true);
    try {
      // Simulate calculation time for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = calculateRetirementProjection(inputs, user?.id);
      setProjection(result);
      setActiveTab('results');
    } catch (err) {
      console.error('Calculation failed:', err);
    } finally {
      setIsCalculating(false);
    }
  }

  function handleExport() {
    if (!projection) return;
    const data = exportProjectionData(projection);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retirement_projection_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }

  const fundingStatus = useMemo(() => {
    if (!projection) return null;
    if (projection.funding_ratio >= 1) return { status: 'on-track', color: 'green', label: 'On Track' };
    if (projection.funding_ratio >= 0.8) return { status: 'close', color: 'yellow', label: 'Close' };
    return { status: 'behind', color: 'red', label: 'Needs Attention' };
  }, [projection]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="retirementCalculator" urlPath="/retirement-calculator" isTool toolName="Crypto Retirement Calculator" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PiggyBank className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Crypto Retirement Calculator
            </h1>
            <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
              PREMIUM
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Model your crypto allocation for retirement with Monte Carlo projections and tax optimization.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {[
            { id: 'inputs', label: 'Inputs', icon: Calculator },
            { id: 'results', label: 'Projections', icon: TrendingUp },
            { id: 'tax', label: 'Tax Analysis', icon: DollarSign },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'inputs' && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Age
                      </label>
                      <input
                        type="number"
                        value={inputs.current_age}
                        onChange={(e) => updateInput('current_age', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Retirement Age
                      </label>
                      <input
                        type="number"
                        value={inputs.retirement_age}
                        onChange={(e) => updateInput('retirement_age', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Life Expectancy
                      </label>
                      <input
                        type="number"
                        value={inputs.life_expectancy}
                        onChange={(e) => updateInput('life_expectancy', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Current Savings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Savings</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Savings ($)
                      </label>
                      <input
                        type="number"
                        value={inputs.current_savings_usd}
                        onChange={(e) => updateInput('current_savings_usd', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Crypto Holdings ($)
                      </label>
                      <input
                        type="number"
                        value={inputs.current_crypto_value_usd}
                        onChange={(e) => updateInput('current_crypto_value_usd', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Crypto Allocation: {inputs.crypto_allocation_percent}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={inputs.crypto_allocation_percent}
                        onChange={(e) => updateInput('crypto_allocation_percent', Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0% (Conservative)</span>
                        <span>50%</span>
                        <span>100% (Aggressive)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contributions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Contributions</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Contribution ($)
                      </label>
                      <input
                        type="number"
                        value={inputs.monthly_contribution}
                        onChange={(e) => updateInput('monthly_contribution', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Crypto Contribution ($)
                      </label>
                      <input
                        type="number"
                        value={inputs.monthly_crypto_contribution}
                        onChange={(e) => updateInput('monthly_crypto_contribution', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Annual Increase (%)
                      </label>
                      <input
                        type="number"
                        value={inputs.contribution_increase_rate}
                        onChange={(e) => updateInput('contribution_increase_rate', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Retirement Income */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Retirement Income Needs</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Desired Annual Income ($)
                      </label>
                      <input
                        type="number"
                        value={inputs.desired_annual_income}
                        onChange={(e) => updateInput('desired_annual_income', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Social Security ($)
                      </label>
                      <input
                        type="number"
                        value={inputs.social_security_income}
                        onChange={(e) => updateInput('social_security_income', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tax Settings</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Filing Status
                      </label>
                      <select
                        value={inputs.tax_filing_status}
                        onChange={(e) => updateInput('tax_filing_status', e.target.value as typeof inputs.tax_filing_status)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="single">Single</option>
                        <option value="married_filing_jointly">Married Filing Jointly</option>
                        <option value="married_filing_separately">Married Filing Separately</option>
                        <option value="head_of_household">Head of Household</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State
                      </label>
                      <select
                        value={inputs.state}
                        onChange={(e) => updateInput('state', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {Object.keys(STATE_TAX_RATES).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Assumptions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Assumptions</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Inflation Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.inflation_rate * 100}
                        onChange={(e) => updateInput('inflation_rate', Number(e.target.value) / 100)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stock Return (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.stock_return * 100}
                        onChange={(e) => updateInput('stock_return', Number(e.target.value) / 100)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Crypto Return (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.crypto_return * 100}
                        onChange={(e) => updateInput('crypto_return', Number(e.target.value) / 100)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Crypto Volatility (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.crypto_volatility * 100}
                        onChange={(e) => updateInput('crypto_volatility', Number(e.target.value) / 100)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculate Button */}
                <button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCalculating ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5" />
                      Calculate Retirement Projection
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'results' && projection && (
              <div className="space-y-6">
                {/* Success Probability */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Success Probability</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          strokeDasharray={`${projection.success_probability * 5.53} 553`}
                          className={getSuccessColor(projection.success_probability)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className={`text-4xl font-bold ${getSuccessColor(projection.success_probability)}`}>
                            {projection.success_probability.toFixed(0)}%
                          </p>
                          <p className="text-sm text-gray-500">Chance of Success</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
                    Based on {projection.monte_carlo_simulations.toLocaleString()} Monte Carlo simulations
                    {!isPremium && (
                      <span className="block text-sm text-blue-600">
                        Upgrade to Premium for 10,000+ simulations
                      </span>
                    )}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Needed at Retirement</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(projection.total_needed_at_retirement)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Projected Savings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(projection.projected_savings_at_retirement)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Funding Ratio</p>
                    <p className={`text-2xl font-bold ${
                      projection.funding_ratio >= 1 ? 'text-green-500' :
                      projection.funding_ratio >= 0.8 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {(projection.funding_ratio * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Funding Gap */}
                {projection.funding_gap > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Funding Gap Detected</h4>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          You are projected to be short by <strong>{formatCurrency(projection.funding_gap)}</strong> at retirement.
                          Consider increasing contributions or adjusting your retirement goals.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Year by Year Projection Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Portfolio Growth Over Time</h3>
                  <div className="h-64 flex items-end justify-between gap-1">
                    {projection.yearly_projections.filter((_, i) => i % 5 === 0).map((year, i) => {
                      const maxValue = Math.max(...projection.yearly_projections.map(y => y.portfolio_value));
                      const height = (year.portfolio_value / maxValue) * 100;
                      const cryptoHeight = (year.crypto_value / maxValue) * 100;
                      const isRetired = year.age >= inputs.retirement_age;

                      return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className="w-full relative" style={{ height: '200px' }}>
                            <div
                              className={`absolute bottom-0 w-full ${isRetired ? 'bg-purple-500' : 'bg-blue-500'} rounded-t`}
                              style={{ height: `${height}%` }}
                            >
                              <div
                                className="absolute bottom-0 w-full bg-orange-400 rounded-t"
                                style={{ height: `${(cryptoHeight / height) * 100}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">{year.age}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Accumulation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Retirement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-400 rounded" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Crypto</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {projection.recommendations.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recommendations</h3>
                    </div>
                    <div className="space-y-4">
                      {projection.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">+{rec.impact_on_success}%</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{rec.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                {isPremium && (
                  <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Download className="h-5 w-5" />
                    Export Report
                  </button>
                )}
              </div>
            )}

            {activeTab === 'tax' && projection && (
              <div className="space-y-6">
                {/* Tax Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tax Analysis</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Taxes Over Retirement</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(projection.tax_analysis.total_taxes_paid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Effective Tax Rate</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatPercent(projection.tax_analysis.effective_tax_rate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tax Optimization Opportunities */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Optimization Opportunities</h3>
                  <div className="space-y-4">
                    {projection.tax_analysis.roth_conversion_opportunity > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Roth Conversion Opportunity</p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Consider converting {formatCurrency(projection.tax_analysis.roth_conversion_opportunity)} to Roth before retirement to reduce future taxes.
                          </p>
                        </div>
                      </div>
                    )}
                    {projection.tax_analysis.tax_loss_harvesting_opportunity > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">Tax-Loss Harvesting</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Crypto volatility provides {formatCurrency(projection.tax_analysis.tax_loss_harvesting_opportunity)} in potential tax-loss harvesting opportunities annually.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optimal Withdrawal Order */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommended Withdrawal Order</h3>
                  <div className="space-y-3">
                    {projection.tax_analysis.optimal_withdrawal_order.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">{i + 1}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'results' && !projection && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                <Calculator className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Projection Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Fill in your information and click Calculate to see your retirement projection.
                </p>
                <button
                  onClick={() => setActiveTab('inputs')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Go to Inputs
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Summary */}
            {projection && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Years to Retirement</span>
                    <span className="font-medium text-gray-900 dark:text-white">{projection.years_to_retirement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Years in Retirement</span>
                    <span className="font-medium text-gray-900 dark:text-white">{projection.years_in_retirement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`font-medium ${
                      fundingStatus?.color === 'green' ? 'text-green-500' :
                      fundingStatus?.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {fundingStatus?.label}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Upsell */}
            {!isPremium && (
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-3">Unlock Full Analysis</h3>
                <ul className="space-y-2 mb-4 text-sm">
                  {RETIREMENT_CALCULATOR_PRICING.premium.features.slice(0, 5).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/pricing"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
                >
                  ${RETIREMENT_CALCULATOR_PRICING.premium.price_yearly}/year
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This calculator provides estimates for educational purposes only. It is not financial advice.
                  Cryptocurrency investments are highly volatile. Consult a financial advisor for personalized guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
