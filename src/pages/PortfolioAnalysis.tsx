import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Brain,
  Shield,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  RefreshCw,
  Lock,
  ArrowRight,
  AlertCircle,
  Info,
  Target,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasAIPortfolioAnalysis } from '../services/subscriptionLimits';
import {
  generatePortfolioAnalysis,
  type PortfolioAnalysisInput,
  type PortfolioAnalysisResult,
} from '../services/ai';
import { cn } from '../lib/utils';

// Demo portfolio data
const demoPortfolio: PortfolioAnalysisInput = {
  holdings: [
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.5, currentValue: 49000, costBasis: 35000, allocationPercentage: 55 },
    { symbol: 'ETH', name: 'Ethereum', amount: 5, currentValue: 19500, costBasis: 12000, allocationPercentage: 22 },
    { symbol: 'SOL', name: 'Solana', amount: 50, currentValue: 11000, costBasis: 8000, allocationPercentage: 12 },
    { symbol: 'LINK', name: 'Chainlink', amount: 200, currentValue: 5000, costBasis: 4500, allocationPercentage: 6 },
    { symbol: 'UNI', name: 'Uniswap', amount: 150, currentValue: 4500, costBasis: 5000, allocationPercentage: 5 },
  ],
  totalValue: 89000,
  totalCostBasis: 64500,
  riskTolerance: 'medium',
  investmentGoal: 'Long-term growth',
  timeHorizon: 'long',
};

export function PortfolioAnalysis() {
  const { profile } = useAuth();
  const isPremium = profile ? hasAIPortfolioAnalysis(
    profile.subscription_status,
    profile.subscription_expires_at
  ) : false;

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PortfolioAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [investmentGoal, setInvestmentGoal] = useState('Long-term growth');
  const [timeHorizon, setTimeHorizon] = useState<'short' | 'medium' | 'long'>('long');

  // In production, this would come from the user's actual portfolio
  const portfolioData = demoPortfolio;

  const runAnalysis = async () => {
    if (!isPremium) return;

    setLoading(true);
    setError(null);

    try {
      const input: PortfolioAnalysisInput = {
        ...portfolioData,
        riskTolerance,
        investmentGoal,
        timeHorizon,
      };

      const response = await generatePortfolioAnalysis(input);

      if (response.success && response.analysis) {
        setAnalysis(response.analysis);
      } else {
        setError(response.error || 'Failed to generate analysis. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for display
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'very_high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDiversificationColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/20 text-brand-primary text-sm font-medium mb-4">
          <Brain className="w-4 h-4" />
          AI-Powered Analysis
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Portfolio <span className="text-gradient">Analysis</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Get AI-powered insights into your portfolio's health, risk exposure, diversification, and personalized suggestions.
        </p>
      </div>

      {/* Premium Gate */}
      {!isPremium && (
        <div className="max-w-xl mx-auto mb-8">
          <div className="glass-card p-8 text-center">
            <Lock className="w-16 h-16 text-brand-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-3">Premium Feature</h2>
            <p className="text-gray-400 mb-6">
              AI Portfolio Analysis is available to Premium subscribers. Get personalized insights, risk assessments, and rebalancing suggestions powered by Claude AI.
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors"
            >
              Upgrade to Premium <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}

      {isPremium && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio Summary & Controls */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Your Portfolio</h2>

              {/* Holdings List */}
              <div className="space-y-3 mb-6">
                {portfolioData.holdings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-primary">
                        {holding.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{holding.symbol}</p>
                        <p className="text-xs text-gray-500">{holding.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{holding.allocationPercentage}%</p>
                      <p className="text-xs text-gray-500">${holding.currentValue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Portfolio Total */}
              <div className="p-4 rounded-lg bg-white/5 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Total Value</span>
                  <span className="text-white font-bold">${portfolioData.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total P/L</span>
                  <span className={cn(
                    "font-bold",
                    portfolioData.totalValue > portfolioData.totalCostBasis ? "text-green-500" : "text-red-500"
                  )}>
                    {portfolioData.totalValue > portfolioData.totalCostBasis ? '+' : ''}
                    {(((portfolioData.totalValue - portfolioData.totalCostBasis) / portfolioData.totalCostBasis) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Analysis Settings */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Risk Tolerance</label>
                  <select
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(e.target.value as typeof riskTolerance)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="low">Conservative (Low Risk)</option>
                    <option value="medium">Balanced (Medium Risk)</option>
                    <option value="high">Aggressive (High Risk)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Investment Goal</label>
                  <input
                    type="text"
                    value={investmentGoal}
                    onChange={(e) => setInvestmentGoal(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                    placeholder="e.g., Long-term growth, Income generation"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time Horizon</label>
                  <select
                    value={timeHorizon}
                    onChange={(e) => setTimeHorizon(e.target.value as typeof timeHorizon)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="short">Short-term (less than 1 year)</option>
                    <option value="medium">Medium-term (1-3 years)</option>
                    <option value="long">Long-term (3+ years)</option>
                  </select>
                </div>
              </div>

              {/* Run Analysis Button */}
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Run AI Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {!analysis && !loading && (
              <div className="glass-card p-12 text-center">
                <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
                <p className="text-gray-400">
                  Configure your preferences and click "Run AI Analysis" to get personalized insights about your portfolio.
                </p>
              </div>
            )}

            {loading && (
              <div className="glass-card p-12 text-center">
                <RefreshCw className="w-16 h-16 text-brand-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-white mb-2">Analyzing Portfolio...</h3>
                <p className="text-gray-400">
                  Our AI is reviewing your holdings and generating personalized insights.
                </p>
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-6">
                {/* Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card p-4 text-center">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400 text-sm mb-1">Risk Score</p>
                    <p className={cn("text-2xl font-bold", getRiskColor(analysis.riskLevel))}>
                      {analysis.riskScore}/10
                    </p>
                    <p className={cn("text-xs capitalize", getRiskColor(analysis.riskLevel))}>
                      {analysis.riskLevel.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="glass-card p-4 text-center">
                    <PieChart className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400 text-sm mb-1">Diversification</p>
                    <p className="text-2xl font-bold text-white">{analysis.diversificationScore}%</p>
                    <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", getDiversificationColor(analysis.diversificationScore))}
                        style={{ width: `${analysis.diversificationScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="glass-card p-4 text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400 text-sm mb-1">Overall Health</p>
                    <p className={cn("text-2xl font-bold capitalize", getHealthColor(analysis.overallHealth))}>
                      {analysis.overallHealth}
                    </p>
                  </div>

                  <div className="glass-card p-4 text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400 text-sm mb-1">Goal Alignment</p>
                    <p className="text-2xl font-bold text-white">
                      {analysis.riskLevel === riskTolerance ? 'Good' : 'Review'}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-brand-primary" />
                    AI Summary
                  </h3>
                  <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Strengths & Concerns */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Strengths
                    </h3>
                    <ul className="space-y-3">
                      {analysis.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                          <span className="text-gray-300">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      Concerns
                    </h3>
                    <ul className="space-y-3">
                      {analysis.concerns.map((concern, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                          <span className="text-gray-300">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Rebalancing Suggestions */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Rebalancing Suggestions
                  </h3>
                  <ul className="space-y-3">
                    {analysis.rebalancingSuggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-medium flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-gray-300">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Educational Insights */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Educational Insights
                  </h3>
                  <ul className="space-y-3">
                    {analysis.educationalInsights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                        <span className="text-gray-300">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disclaimer */}
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-300 mb-1">Important Disclaimer</p>
                      <p className="text-sm text-yellow-300/80">{analysis.disclaimer}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
