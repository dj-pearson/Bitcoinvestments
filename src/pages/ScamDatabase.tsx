import { useState, useEffect } from 'react';
import { Search, AlertTriangle, Shield, ExternalLink, Filter } from 'lucide-react';
import {
  searchScamReports,
  checkWalletAddress,
  checkContractAddress,
  checkWebsiteUrl,
  getScamCategories,
} from '../services/scamDatabase';
import type { ScamReport, ScamCategory, ScamSearchFilters } from '../types/admin-database';

export function ScamDatabase() {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [categories, setCategories] = useState<ScamCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'general' | 'wallet' | 'contract' | 'website'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ScamSearchFilters>({});
  const [selectedReport, setSelectedReport] = useState<ScamReport | null>(null);

  useEffect(() => {
    loadCategories();
    loadReports();
  }, []);

  async function loadCategories() {
    const { categories: cats } = await getScamCategories();
    setCategories(cats);
  }

  async function loadReports() {
    setLoading(true);
    const { reports: reps } = await searchScamReports(filters);
    setReports(reps);
    setLoading(false);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadReports();
      return;
    }

    setLoading(true);

    let result;
    switch (searchType) {
      case 'wallet':
        result = await checkWalletAddress(searchQuery);
        setReports(result.scams);
        break;
      case 'contract':
        result = await checkContractAddress(searchQuery);
        setReports(result.scams);
        break;
      case 'website':
        result = await checkWebsiteUrl(searchQuery);
        setReports(result.scams);
        break;
      default:
        result = await searchScamReports({ query: searchQuery, status: 'verified' });
        setReports(result.reports);
    }

    setLoading(false);
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Crypto Scam Database
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Search for known scams, fraudulent projects, and red flags in the crypto space
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'general', label: 'General Search' },
                { value: 'wallet', label: 'Wallet Address' },
                { value: 'contract', label: 'Contract Address' },
                { value: 'website', label: 'Website URL' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSearchType(type.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    searchType === type.value
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder={`Enter ${searchType === 'general' ? 'search query' : searchType + ' to check'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>

          {searchQuery && reports.length === 0 && !loading && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Shield className="w-5 h-5" />
                <p className="font-medium">No scams found matching your search!</p>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                This {searchType} is not in our database of known scams. However, always exercise caution.
              </p>
            </div>
          )}

          {searchQuery && reports.length > 0 && !loading && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-medium">WARNING: Potential Scam Detected!</p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Found {reports.length} scam report(s) matching your search. Review details below.
              </p>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Scam Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setFilters({ scam_type: category.slug as any });
                  loadReports();
                }}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-2xl mb-2">{category.icon || '🚨'}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {category.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {category.reports_count} reports
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {searchQuery ? 'Search Results' : 'Recent Scam Reports'}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Searching database...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {report.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(report.severity)}`}>
                          {report.severity.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {report.scam_type.replace('_', ' ').toUpperCase()}
                        </span>
                        {report.blockchain && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {report.blockchain}
                          </span>
                        )}
                      </div>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {report.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {report.victims_count > 0 && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Victims:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {report.victims_count.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {report.estimated_loss_usd && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Est. Loss:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          ${report.estimated_loss_usd.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {report.website_url && (
                      <div className="col-span-2">
                        <a
                          href={report.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                        >
                          {report.website_url.slice(0, 40)}...
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Scam CTA */}
        <div className="mt-8 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Encountered a Scam?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Help protect others by reporting suspicious projects and scams
          </p>
          <button className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium">
            Report a Scam
          </button>
        </div>

        {/* Detail Modal */}
        {selectedReport && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedReport(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedReport.title}
                </h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedReport.description}
                </p>

                {selectedReport.red_flags && selectedReport.red_flags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Red Flags:
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedReport.red_flags.map((flag, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-400">
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.wallet_addresses && selectedReport.wallet_addresses.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Known Scam Addresses:
                    </h3>
                    <div className="space-y-1">
                      {selectedReport.wallet_addresses.map((addr, index) => (
                        <code key={index} className="block text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          {addr}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
