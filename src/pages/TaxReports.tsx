/**
 * Tax Reports Page
 *
 * Complete tax reporting interface for cryptocurrency transactions.
 * Allows users to generate, view, and export tax reports.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, getUserProfile } from '../services/auth';
import { getPortfolio } from '../services/portfolio';
import { hasTaxReportPurchase, getTaxReportPackageType } from '../services/database';
import { hasPremiumAccess } from '../services/stripe';
import {
  generateTaxReport,
  exportForm8949CSV,
  exportTransactionHistoryCSV,
  exportIncomeCSV,
  exportTaxSummaryCSV,
  exportTXF,
  exportTaxReportPDF,
  type TaxReport,
  type CostBasisMethod,
} from '../services/taxReportService';
import { TAX_PACKAGE, isTaxSeasonActive } from '../services/subscriptionLimits';
import { TaxSeasonPackage } from '../components/TaxSeasonPackage';
import { TransactionImport } from '../components/TransactionImport';
import { addTransaction, getOrCreateHolding } from '../services/portfolio';
import { convertToTransaction, type ImportedTransaction } from '../services/transactionImport';
import type { Portfolio } from '../types';

// State tax options
const US_STATES = [
  { code: '', name: 'Select State (Optional)' },
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

const TAX_BRACKETS = [
  { rate: 10, label: '10% ($0 - $11,600)' },
  { rate: 12, label: '12% ($11,600 - $47,150)' },
  { rate: 22, label: '22% ($47,150 - $100,525)' },
  { rate: 24, label: '24% ($100,525 - $191,950)' },
  { rate: 32, label: '32% ($191,950 - $243,725)' },
  { rate: 35, label: '35% ($243,725 - $609,350)' },
  { rate: 37, label: '37% ($609,350+)' },
];

export default function TaxReports() {
  // Auth state
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [packageType, setPackageType] = useState<'basic' | 'premium' | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // Portfolio state
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  // Report generation state
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<TaxReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [costBasisMethod, setCostBasisMethod] = useState<CostBasisMethod>('fifo');
  const [state, setState] = useState('');
  const [taxBracket, setTaxBracket] = useState(22);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Available years (current year and 5 previous)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Check if user has access (premium subscription OR tax package purchase)
        const profile = await getUserProfile(user.id);
        const isPremium = hasPremiumAccess(
          profile?.subscription_status,
          profile?.subscription_expires_at
        );
        setIsPremiumUser(isPremium);

        // Check for tax package purchase
        const hasPurchase = await hasTaxReportPurchase(user.id, TAX_PACKAGE.taxYear);
        const pkgType = hasPurchase ? await getTaxReportPackageType(user.id, TAX_PACKAGE.taxYear) : null;
        setPackageType(pkgType);

        // User has access if premium OR has purchased tax package
        setHasAccess(isPremium || hasPurchase);

        // Load portfolio
        const userPortfolio = await getPortfolio();
        setPortfolio(userPortfolio);
      } catch (err) {
        console.error('Error loading tax reports data:', err);
        setError('Failed to load your data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleGenerateReport = async () => {
    if (!portfolio) {
      setError('No portfolio data found. Please add some transactions first.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const generatedReport = await generateTaxReport(portfolio, taxYear, {
        costBasisMethod,
        state: state || undefined,
        taxBracket,
      });

      setReport(generatedReport);
    } catch (err) {
      console.error('Error generating tax report:', err);
      setError('Failed to generate tax report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (type: 'form8949' | 'transactions' | 'income' | 'summary' | 'txf' | 'pdf') => {
    if (!report) return;

    let blob: Blob;
    let filename: string;

    if (type === 'pdf') {
      // PDF export
      blob = await exportTaxReportPDF(report);
      filename = `crypto-tax-report-${taxYear}.pdf`;
    } else {
      // CSV/TXF exports
      let content: string;
      let mimeType = 'text/csv';

      switch (type) {
        case 'form8949':
          content = exportForm8949CSV(report);
          filename = `form-8949-${taxYear}.csv`;
          break;
        case 'transactions':
          content = exportTransactionHistoryCSV(report);
          filename = `transactions-${taxYear}.csv`;
          break;
        case 'income':
          content = exportIncomeCSV(report);
          filename = `crypto-income-${taxYear}.csv`;
          break;
        case 'summary':
          content = exportTaxSummaryCSV(report);
          filename = `tax-summary-${taxYear}.csv`;
          break;
        case 'txf':
          content = exportTXF(report);
          filename = `crypto-taxes-${taxYear}.txf`;
          mimeType = 'text/plain';
          break;
        default:
          return;
      }

      blob = new Blob([content], { type: mimeType });
    }

    // Download file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTransactions = async (transactions: ImportedTransaction[]) => {
    if (!userId) return;

    // Group transactions by asset
    const transactionsByAsset = new Map<string, ImportedTransaction[]>();
    for (const tx of transactions) {
      const key = tx.symbol.toUpperCase();
      if (!transactionsByAsset.has(key)) {
        transactionsByAsset.set(key, []);
      }
      transactionsByAsset.get(key)!.push(tx);
    }

    // Import each group
    for (const [symbol, txs] of transactionsByAsset) {
      // Get or create holding for this asset
      const holding = await getOrCreateHolding(userId, symbol, txs[0].asset);

      // Add each transaction
      for (const tx of txs) {
        const transaction = convertToTransaction(tx, holding.id);
        await addTransaction(holding.id, transaction);
      }
    }

    // Reload portfolio
    const updatedPortfolio = await getPortfolio();
    setPortfolio(updatedPortfolio);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-800 rounded w-1/3"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
            <div className="h-96 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Tax Reports</h1>
            <p className="text-gray-400 mb-6">
              Sign in to generate your cryptocurrency tax reports.
            </p>
            <Link
              to="/login?redirect=/tax-reports"
              className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No access - show purchase option
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white mb-2">Tax Reports</h1>
          <p className="text-gray-400 mb-8">
            Generate comprehensive tax reports for your cryptocurrency transactions.
          </p>

          {isTaxSeasonActive() ? (
            <TaxSeasonPackage variant="card" className="max-w-xl mx-auto" />
          ) : (
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Tax Season Coming Soon</h2>
              <p className="text-gray-400 mb-6">
                Tax report packages will be available January through April.
                Upgrade to Premium for year-round access to tax reports.
              </p>
              <Link
                to="/pricing"
                className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
              >
                View Premium Plans
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tax Reports</h1>
            <p className="text-gray-400">
              Generate IRS-compatible tax reports for your cryptocurrency transactions.
            </p>
            {packageType && (
              <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                packageType === 'premium' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {packageType === 'premium' ? 'Premium' : 'Basic'} Tax Package
              </span>
            )}
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Transactions
          </button>
        </div>

        {/* Report Configuration */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Report Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Tax Year */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tax Year</label>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Cost Basis Method */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cost Basis Method</label>
              <select
                value={costBasisMethod}
                onChange={(e) => setCostBasisMethod(e.target.value as CostBasisMethod)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="fifo">FIFO (First In, First Out)</option>
                <option value="lifo">LIFO (Last In, First Out)</option>
                <option value="hifo">HIFO (Highest In, First Out)</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {US_STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Tax Bracket */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tax Bracket</label>
              <select
                value={taxBracket}
                onChange={(e) => setTaxBracket(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {TAX_BRACKETS.map(b => (
                  <option key={b.rate} value={b.rate}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating || !portfolio}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Report
              </>
            )}
          </button>

          {!portfolio && (
            <p className="mt-3 text-yellow-500 text-sm">
              No portfolio data found. <Link to="/dashboard" className="underline">Add transactions</Link> to generate a tax report.
            </p>
          )}

          {error && (
            <p className="mt-3 text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Report Results */}
        {report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard
                title="Total Proceeds"
                value={formatCurrency(report.summary.totalProceeds)}
                subtitle="From all sales"
                color="blue"
              />
              <SummaryCard
                title="Total Cost Basis"
                value={formatCurrency(report.summary.totalCostBasis)}
                subtitle={`${report.summary.costBasisMethod.toUpperCase()} method`}
                color="gray"
              />
              <SummaryCard
                title="Net Capital Gain/Loss"
                value={formatCurrency(report.summary.netCapitalGainLoss)}
                subtitle={report.summary.netCapitalGainLoss >= 0 ? 'Net Gain' : 'Net Loss'}
                color={report.summary.netCapitalGainLoss >= 0 ? 'green' : 'red'}
              />
              <SummaryCard
                title="Estimated Tax"
                value={formatCurrency(report.summary.estimatedTotalTax)}
                subtitle="Federal + State"
                color="orange"
              />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Short-Term */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  Short-Term (1 year or less)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gains</span>
                    <span className="text-green-400">{formatCurrency(report.summary.shortTermGains)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Losses</span>
                    <span className="text-red-400">({formatCurrency(report.summary.shortTermLosses)})</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 flex justify-between font-semibold">
                    <span className="text-white">Net Short-Term</span>
                    <span className={report.summary.netShortTerm >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {formatCurrency(report.summary.netShortTerm)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Long-Term */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  Long-Term (more than 1 year)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gains</span>
                    <span className="text-green-400">{formatCurrency(report.summary.longTermGains)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Losses</span>
                    <span className="text-red-400">({formatCurrency(report.summary.longTermLosses)})</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 flex justify-between font-semibold">
                    <span className="text-white">Net Long-Term</span>
                    <span className={report.summary.netLongTerm >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {formatCurrency(report.summary.netLongTerm)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Section */}
            {report.summary.totalOrdinaryIncome > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  Ordinary Income (taxed at regular rates)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Staking Rewards</p>
                    <p className="text-white text-xl font-semibold">{formatCurrency(report.summary.stakingIncome)}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Other Income</p>
                    <p className="text-white text-xl font-semibold">{formatCurrency(report.summary.otherIncome)}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Total Ordinary Income</p>
                    <p className="text-purple-400 text-xl font-semibold">{formatCurrency(report.summary.totalOrdinaryIncome)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Export Options */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Export Reports</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <ExportButton
                  label="PDF Report"
                  description="Full report"
                  onClick={() => handleExport('pdf')}
                  icon="pdf"
                />
                <ExportButton
                  label="Form 8949"
                  description="IRS format"
                  onClick={() => handleExport('form8949')}
                  icon="document"
                />
                <ExportButton
                  label="All Transactions"
                  description="Detailed CSV"
                  onClick={() => handleExport('transactions')}
                  icon="list"
                />
                <ExportButton
                  label="Income Report"
                  description="Staking & rewards"
                  onClick={() => handleExport('income')}
                  icon="currency"
                />
                <ExportButton
                  label="Tax Summary"
                  description="Overview CSV"
                  onClick={() => handleExport('summary')}
                  icon="chart"
                />
                <ExportButton
                  label="TurboTax (TXF)"
                  description="Tax software"
                  onClick={() => handleExport('txf')}
                  icon="download"
                />
              </div>
            </div>

            {/* Transaction Table */}
            {report.taxableEvents.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white">
                    Taxable Events ({report.taxableEvents.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">Date</th>
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">Asset</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Amount</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Proceeds</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Cost Basis</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Gain/Loss</th>
                        <th className="px-4 py-3 text-center text-gray-400 font-medium">Term</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {report.taxableEvents.slice(0, 50).map((event) => (
                        <tr key={event.id} className="hover:bg-gray-700/30">
                          <td className="px-4 py-3 text-white">{formatDate(event.date)}</td>
                          <td className="px-4 py-3">
                            <span className="text-white font-medium">{event.symbol}</span>
                            <span className="text-gray-400 ml-1 text-xs">{event.asset}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-white">{event.amount.toFixed(6)}</td>
                          <td className="px-4 py-3 text-right text-white">{formatCurrency(event.proceedsUSD)}</td>
                          <td className="px-4 py-3 text-right text-white">{formatCurrency(event.costBasisUSD)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${event.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(event.gainLoss)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              event.holdingPeriod === 'short_term'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {event.holdingPeriod === 'short_term' ? 'Short' : 'Long'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {report.taxableEvents.length > 50 && (
                    <div className="px-4 py-3 bg-gray-700/30 text-center text-gray-400 text-sm">
                      Showing first 50 of {report.taxableEvents.length} transactions. Export for full list.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Import Modal */}
        <TransactionImport
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportTransactions}
        />
      </div>
    </div>
  );
}

// ==================== Helper Components ====================

function SummaryCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'gray';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
    gray: 'bg-gray-700 text-gray-300',
  };

  return (
    <div className={`rounded-xl p-5 ${colorClasses[color]}`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs opacity-60 mt-1">{subtitle}</p>
    </div>
  );
}

function ExportButton({
  label,
  description,
  onClick,
  icon,
}: {
  label: string;
  description: string;
  onClick: () => void;
  icon: 'document' | 'list' | 'currency' | 'chart' | 'download' | 'pdf';
}) {
  const icons = {
    pdf: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
    document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    currency: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
    >
      <svg className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[icon]}
      </svg>
      <div className="text-center">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-400 text-xs">{description}</p>
      </div>
    </button>
  );
}

// ==================== Utility Functions ====================

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return amount < 0 ? `(${formatted})` : formatted;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
