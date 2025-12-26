import { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  Calendar,
  Lock,
  RefreshCw,
  PieChart,
  AlertCircle,
} from 'lucide-react';
import {
  getPublicPortfolio,
  type PublicPortfolioView as PublicPortfolioData,
} from '../services/portfolioSharing';

interface PublicPortfolioViewProps {
  shareCode: string;
}

export function PublicPortfolioView({ shareCode }: PublicPortfolioViewProps) {
  const [portfolio, setPortfolio] = useState<PublicPortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loadPortfolio = async (pwd?: string) => {
    setIsLoading(true);
    setError(null);
    setPasswordError(null);

    const result = await getPublicPortfolio(shareCode, pwd);

    if (result.requiresPassword) {
      setRequiresPassword(true);
      if (result.error) {
        setPasswordError(result.error);
      }
    } else if (result.error) {
      setError(result.error);
    } else if (result.portfolio) {
      setPortfolio(result.portfolio);
      setRequiresPassword(false);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareCode]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPortfolio(password);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Portfolio Not Found</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-orange-500/20 rounded-xl mb-4">
              <Lock className="h-8 w-8 text-orange-400" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Password Protected</h1>
            <p className="text-slate-400">This portfolio requires a password to view.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                autoFocus
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-400">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              View Portfolio
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {portfolio.shareInfo.title}
              </h1>
              {portfolio.shareInfo.description && (
                <p className="text-slate-400">{portfolio.shareInfo.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {portfolio.shareInfo.viewCount} views
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(portfolio.shareInfo.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Holdings"
              value={portfolio.summary.holdingsCount.toString()}
              icon={<Wallet className="h-5 w-5" />}
            />
            {portfolio.summary.totalValue !== undefined && (
              <StatCard
                label="Total Value"
                value={`$${portfolio.summary.totalValue.toLocaleString()}`}
                icon={<PieChart className="h-5 w-5" />}
              />
            )}
            {portfolio.summary.totalProfitLoss !== undefined && (
              <StatCard
                label="Total P/L"
                value={`${portfolio.summary.totalProfitLoss >= 0 ? '+' : ''}$${portfolio.summary.totalProfitLoss.toLocaleString()}`}
                icon={
                  portfolio.summary.totalProfitLoss >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )
                }
                highlight={portfolio.summary.totalProfitLoss >= 0 ? 'success' : 'danger'}
              />
            )}
            {portfolio.summary.totalProfitLossPercentage !== undefined && (
              <StatCard
                label="Return"
                value={`${portfolio.summary.totalProfitLossPercentage >= 0 ? '+' : ''}${portfolio.summary.totalProfitLossPercentage.toFixed(2)}%`}
                icon={
                  portfolio.summary.totalProfitLossPercentage >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )
                }
                highlight={portfolio.summary.totalProfitLossPercentage >= 0 ? 'success' : 'danger'}
              />
            )}
          </div>
        </div>

        {/* Allocation Chart */}
        {portfolio.allocation.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Allocation</h2>
            <div className="flex items-center gap-6">
              {/* Donut Chart Visualization */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 100 100\" className="transform -rotate-90">
                  {portfolio.allocation.reduce(
                    (acc, item, index) => {
                      const circumference = 2 * Math.PI * 40;
                      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -acc.offset;

                      acc.elements.push(
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );

                      acc.offset += (item.percentage / 100) * circumference;
                      return acc;
                    },
                    { elements: [] as React.ReactNode[], offset: 0 }
                  ).elements}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                {portfolio.allocation.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-300 truncate">{item.symbol}</span>
                    <span className="text-sm text-slate-500 ml-auto">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Holdings List */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Holdings</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {portfolio.holdings.map((holding, index) => (
              <div
                key={index}
                className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors"
              >
                {/* Coin Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {holding.coinImage ? (
                    <img
                      src={holding.coinImage}
                      alt={holding.coinName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-400">
                        {holding.coinSymbol.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">{holding.coinName}</div>
                    <div className="text-sm text-slate-500">{holding.coinSymbol.toUpperCase()}</div>
                  </div>
                </div>

                {/* Allocation */}
                <div className="text-right">
                  <div className="text-white font-medium">
                    {holding.percentage.toFixed(2)}%
                  </div>
                  {holding.quantity !== undefined && (
                    <div className="text-sm text-slate-500">
                      {holding.quantity.toLocaleString()} {holding.coinSymbol.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Value */}
                {holding.value !== undefined && (
                  <div className="text-right min-w-[100px]">
                    <div className="text-white font-medium">
                      ${holding.value.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* P/L */}
                {holding.profitLossPercentage !== undefined && (
                  <div className="text-right min-w-[100px]">
                    <div
                      className={`font-medium ${
                        holding.profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {holding.profitLossPercentage >= 0 ? '+' : ''}
                      {holding.profitLossPercentage.toFixed(2)}%
                    </div>
                    {holding.profitLoss !== undefined && (
                      <div
                        className={`text-sm ${
                          holding.profitLoss >= 0 ? 'text-green-500/70' : 'text-red-500/70'
                        }`}
                      >
                        {holding.profitLoss >= 0 ? '+' : ''}
                        ${Math.abs(holding.profitLoss).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>
            Shared via{' '}
            <a href="/" className="text-orange-400 hover:text-orange-300">
              Bitcoinvestments
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: 'success' | 'danger';
}) {
  const colors = {
    success: 'text-green-400',
    danger: 'text-red-400',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className={`text-xl font-bold ${highlight ? colors[highlight] : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
