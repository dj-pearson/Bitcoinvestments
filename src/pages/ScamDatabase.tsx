import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  Shield,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Flag,
  TrendingUp,
  Clock,
  Database,
  Users,
  X,
} from 'lucide-react';
import {
  SEO,
  generateScamDatabaseSchema,
  generateScamFAQSchema,
  generateScamSearchActionSchema,
} from '../components/SEO';
import {
  searchScamReports,
  checkWalletAddress,
  checkContractAddress,
  checkWebsiteUrl,
  getScamCategories,
  getSearchSuggestions,
  SUPPORTED_BLOCKCHAINS,
} from '../services/scamDatabase';
import { getCommunityStats } from '../services/scamCommunity';
import type {
  ScamReportWithCommunity,
  ScamCategory,
  ScamSearchFilters,
  ScamType,
  ScamSeverity,
  ScamSearchSuggestion,
} from '../types/admin-database';

const SCAM_TYPES: { value: ScamType; label: string; icon: string }[] = [
  { value: 'phishing', label: 'Phishing', icon: '🎣' },
  { value: 'ponzi', label: 'Ponzi Scheme', icon: '🔺' },
  { value: 'rug_pull', label: 'Rug Pull', icon: '🧹' },
  { value: 'fake_ico', label: 'Fake ICO', icon: '🪙' },
  { value: 'impersonation', label: 'Impersonation', icon: '🎭' },
  { value: 'fake_exchange', label: 'Fake Exchange', icon: '🏦' },
  { value: 'pump_dump', label: 'Pump & Dump', icon: '📈' },
  { value: 'other', label: 'Other', icon: '⚠️' },
];

const SEVERITY_OPTIONS: { value: ScamSeverity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-green-500' },
];

export function ScamDatabase() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState<ScamReportWithCommunity[]>([]);
  const [_categories, setCategories] = useState<ScamCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'general' | 'wallet' | 'contract' | 'website'>('general');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<ScamSearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ScamSearchFilters>({
    scam_type: searchParams.get('type') as ScamType | undefined,
    blockchain: searchParams.get('chain') || undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [communityStats, setCommunityStats] = useState({
    totalReports: 0,
    verifiedReports: 0,
    totalContributors: 0,
    totalVotes: 0,
  });

  useEffect(() => {
    loadCategories();
    loadCommunityStats();
    loadReports();
  }, []);

  useEffect(() => {
    loadReports();
  }, [page, filters]);

  async function loadCategories() {
    const { categories: cats } = await getScamCategories();
    setCategories(cats);
  }

  async function loadCommunityStats() {
    const stats = await getCommunityStats();
    setCommunityStats(stats);
  }

  async function loadReports() {
    setLoading(true);
    const { reports: reps, totalPages: tp, total: t } = await searchScamReports(filters, { page, limit: 12 });
    setReports(reps);
    setTotalPages(tp);
    setTotal(t);
    setLoading(false);
  }

  const handleSearchInput = useCallback(async (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      const sugg = await getSearchSuggestions(value);
      setSuggestions(sugg);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setFilters({ ...filters, query: undefined });
      loadReports();
      return;
    }

    setLoading(true);
    setShowSuggestions(false);
    setPage(1);

    let result;
    switch (searchType) {
      case 'wallet':
        result = await checkWalletAddress(searchQuery);
        setReports(result.scams as ScamReportWithCommunity[]);
        setTotal(result.scams.length);
        setTotalPages(1);
        break;
      case 'contract':
        result = await checkContractAddress(searchQuery);
        setReports(result.scams as ScamReportWithCommunity[]);
        setTotal(result.scams.length);
        setTotalPages(1);
        break;
      case 'website':
        result = await checkWebsiteUrl(searchQuery);
        setReports(result.scams as ScamReportWithCommunity[]);
        setTotal(result.scams.length);
        setTotalPages(1);
        break;
      default:
        setFilters({ ...filters, query: searchQuery });
    }

    setLoading(false);
    setSearchParams({ q: searchQuery, type: searchType });
  }

  function handleSuggestionClick(suggestion: ScamSearchSuggestion) {
    setShowSuggestions(false);
    if (suggestion.type === 'scam_type') {
      setFilters({ ...filters, scam_type: suggestion.value as ScamType });
      setSearchQuery('');
    } else if (suggestion.type === 'blockchain') {
      setFilters({ ...filters, blockchain: suggestion.value });
      setSearchQuery('');
    } else if (suggestion.type === 'address') {
      setSearchType('wallet');
      setSearchQuery(suggestion.value);
      handleSearch();
    } else {
      setSearchQuery(suggestion.value);
      handleSearch();
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  function getTrustScoreColor(score: number) {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }

  function clearFilters() {
    setFilters({ sort_by: 'created_at', sort_order: 'desc' });
    setSearchQuery('');
    setSearchType('general');
    setPage(1);
  }

  const activeFilterCount = [
    filters.scam_type,
    filters.severity,
    filters.blockchain,
    filters.min_trust_score,
    filters.min_loss,
  ].filter(Boolean).length;

  // Combine all SEO schemas for rich search results
  const combinedSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      generateScamDatabaseSchema({
        totalReports: communityStats.totalReports,
        verifiedReports: communityStats.verifiedReports,
      }),
      generateScamFAQSchema(),
      generateScamSearchActionSchema(),
    ],
  }), [communityStats.totalReports, communityStats.verifiedReports]);

  return (
    <>
      <SEO
        title="Crypto Scam Database - Check Wallets, Websites & Report Fraud"
        description="Free community-powered database of cryptocurrency scams. Search wallet addresses, verify websites, report fraud, and protect yourself from phishing, rug pulls, ponzi schemes, and pig butchering scams."
        keywords={[
          'crypto scam database',
          'cryptocurrency scam check',
          'wallet address scam',
          'bitcoin scam list',
          'ethereum scam check',
          'rug pull checker',
          'crypto fraud report',
          'pig butchering scam',
          'phishing crypto',
          'fake crypto exchange',
          'scam wallet address',
          'report crypto scam',
          'crypto security',
          'blockchain scam tracker',
        ]}
        schema={combinedSchema}
      />
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
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Community-powered database of known cryptocurrency scams. Search, report, and help protect others.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <Database className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {communityStats.totalReports.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Reports</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {communityStats.verifiedReports.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Verified Scams</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {communityStats.totalContributors.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Contributors</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <ThumbsUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {communityStats.totalVotes.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Community Votes</div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          {/* Search Type Tabs */}
          <div className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'general', label: 'General Search', icon: Search },
                { value: 'wallet', label: 'Wallet Address', icon: Database },
                { value: 'contract', label: 'Contract', icon: Shield },
                { value: 'website', label: 'Website URL', icon: ExternalLink },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSearchType(type.value as typeof searchType)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    searchType === type.value
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={
                    searchType === 'wallet'
                      ? 'Enter wallet address (0x... or bc1...)'
                      : searchType === 'contract'
                      ? 'Enter smart contract address'
                      : searchType === 'website'
                      ? 'Enter website URL to check'
                      : 'Search scams by name, description, or token...'
                  }
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {suggestion.type}
                        </span>
                        <span className="text-gray-900 dark:text-white">{suggestion.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Scam Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scam Type
                  </label>
                  <select
                    value={filters.scam_type || ''}
                    onChange={(e) => setFilters({ ...filters, scam_type: e.target.value as ScamType || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    {SCAM_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Severity
                  </label>
                  <select
                    value={filters.severity || ''}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value as ScamSeverity || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Severities</option>
                    {SEVERITY_OPTIONS.map((sev) => (
                      <option key={sev.value} value={sev.value}>
                        {sev.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blockchain Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Blockchain
                  </label>
                  <select
                    value={filters.blockchain || ''}
                    onChange={(e) => setFilters({ ...filters, blockchain: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Chains</option>
                    {SUPPORTED_BLOCKCHAINS.map((chain) => (
                      <option key={chain} value={chain}>
                        {chain}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={`${filters.sort_by}-${filters.sort_order}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setFilters({
                        ...filters,
                        sort_by: sortBy as ScamSearchFilters['sort_by'],
                        sort_order: sortOrder as 'asc' | 'desc',
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="trust_score-desc">Highest Trust Score</option>
                    <option value="trust_score-asc">Lowest Trust Score</option>
                    <option value="upvotes-desc">Most Upvoted</option>
                    <option value="victims_count-desc">Most Victims</option>
                    <option value="estimated_loss_usd-desc">Highest Losses</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search Results Feedback */}
          {searchQuery && !loading && (
            <div className={`mt-4 p-4 rounded-lg ${
              reports.length === 0
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {reports.length === 0 ? (
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Shield className="w-5 h-5" />
                  <p className="font-medium">No scams found matching your search!</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="font-medium">
                    WARNING: Found {reports.length} potential scam{reports.length !== 1 ? 's' : ''}!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {SCAM_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setFilters({ ...filters, scam_type: type.value });
                  setPage(1);
                }}
                className={`p-4 rounded-lg shadow transition-all text-center hover:shadow-lg ${
                  filters.scam_type === type.value
                    ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {type.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            {filters.query ? 'Search Results' : 'Recent Scam Reports'}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({total} total)
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/report-scam')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Flag className="w-4 h-4" />
              Report Scam
            </button>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Searching database...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => navigate(`/scam/${report.id}`)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl transition-all cursor-pointer group"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                        {report.title}
                      </h3>
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(report.severity)}`}>
                        {report.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {report.scam_type.replace('_', ' ').toUpperCase()}
                      </span>
                      {report.blockchain && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                          {report.blockchain}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                      {report.description}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{report.upvotes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <ThumbsDown className="w-4 h-4" />
                          <span>{report.downvotes || 0}</span>
                        </div>
                      </div>
                      <div className={`font-medium ${getTrustScoreColor(report.trust_score || 50)}`}>
                        {Math.round(report.trust_score || 50)}% Trust
                      </div>
                    </div>

                    {/* Victims/Loss */}
                    {(report.victims_count > 0 || report.estimated_loss_usd) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        {report.victims_count > 0 && (
                          <span>{report.victims_count.toLocaleString()} victims</span>
                        )}
                        {report.estimated_loss_usd && (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            ${report.estimated_loss_usd.toLocaleString()} lost
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {reports.length === 0 && !loading && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No scams found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={clearFilters}
                  className="text-orange-600 dark:text-orange-400 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + Math.max(1, page - 2);
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg ${
                          page === pageNum
                            ? 'bg-orange-600 text-white'
                            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Report CTA */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Encountered a Scam?</h3>
          <p className="text-orange-100 mb-6 max-w-xl mx-auto">
            Help protect the crypto community by reporting suspicious projects and scams.
            Your report could save someone from losing their funds.
          </p>
          <button
            onClick={() => navigate('/report-scam')}
            className="px-8 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors inline-flex items-center gap-2"
          >
            <Flag className="w-5 h-5" />
            Report a Scam
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
