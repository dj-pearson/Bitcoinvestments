import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Star,
  Download,
  Lock,
  TrendingUp,
  Clock,
  Eye,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getPublishedReports,
  getFeaturedReports,
  getReportBySlug,
  hasReportAccess,
  createReportCheckoutSession,
  REPORT_PRICING,
  type ResearchReport,
} from '../services/researchReports';

export function ResearchReports() {
  const { user } = useAuth();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [featuredReports, setFeaturedReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadReports();
  }, [selectedType]);

  useEffect(() => {
    if (slug) {
      loadSingleReport(slug);
    }
  }, [slug, user?.id]);

  async function loadReports() {
    setLoading(true);
    try {
      const [published, featured] = await Promise.all([
        getPublishedReports(20, 0, {
          report_type: selectedType !== 'all' ? selectedType : undefined,
        }),
        getFeaturedReports(4),
      ]);
      setReports(published);
      setFeaturedReports(featured);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSingleReport(reportSlug: string) {
    setLoading(true);
    try {
      const { report, hasPurchased: purchased } = await getReportBySlug(
        reportSlug,
        user?.id
      );
      setSelectedReport(report);
      setHasPurchased(purchased);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(report: ResearchReport) {
    if (!user) {
      window.location.href = `/login?redirect=/research/${report.slug}`;
      return;
    }

    setPurchasing(true);
    try {
      const { url, error } = await createReportCheckoutSession(
        report.id,
        user.id,
        user.email || ''
      );

      if (error) {
        alert(error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } finally {
      setPurchasing(false);
    }
  }

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.cryptocurrency_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const reportTypes = [
    { id: 'all', name: 'All Reports' },
    { id: 'deep_dive', name: 'Deep Dive', price: REPORT_PRICING.deep_dive.price },
    { id: 'technical_analysis', name: 'Technical Analysis', price: REPORT_PRICING.technical_analysis.price },
    { id: 'fundamental', name: 'Fundamental', price: REPORT_PRICING.fundamental.price },
    { id: 'market_outlook', name: 'Market Outlook', price: REPORT_PRICING.market_outlook.price },
    { id: 'sector_report', name: 'Sector Report', price: REPORT_PRICING.sector_report.price },
  ];

  // Single report view
  if (selectedReport) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/research"
          className="text-orange-500 hover:text-orange-400 mb-6 inline-flex items-center gap-2"
        >
          Back to Reports
        </Link>

        <div className="glass-card p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-500 text-xs font-medium rounded-full">
                {selectedReport.report_type.replace('_', ' ').toUpperCase()}
              </span>
              <h1 className="text-3xl font-bold text-white mt-4 mb-2">
                {selectedReport.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {selectedReport.pages_count} pages
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {selectedReport.view_count} views
                </span>
                {selectedReport.average_rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {selectedReport.average_rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <img
                src={`https://assets.coingecko.com/coins/images/1/small/${selectedReport.cryptocurrency_id}.png`}
                alt={selectedReport.cryptocurrency_name}
                className="w-10 h-10 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/crypto-placeholder.png';
                }}
              />
              <div>
                <p className="font-semibold text-white">{selectedReport.cryptocurrency_name}</p>
                <p className="text-sm text-gray-400 uppercase">{selectedReport.cryptocurrency_symbol}</p>
              </div>
            </div>
          </div>

          {/* Summary (always visible) */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Summary</h2>
            <p className="text-gray-300 leading-relaxed">{selectedReport.summary}</p>
          </div>

          {/* Key Findings */}
          {selectedReport.key_findings && selectedReport.key_findings.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Key Findings</h2>
              <ul className="space-y-2">
                {selectedReport.key_findings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300">
                    <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Content or Purchase CTA */}
          {hasPurchased && selectedReport.full_content ? (
            <div className="prose prose-invert max-w-none">
              <h2 className="text-xl font-semibold text-white mb-4">Full Report</h2>
              <div
                className="text-gray-300"
                dangerouslySetInnerHTML={{ __html: selectedReport.full_content }}
              />
              <button className="mt-6 btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-8 border border-orange-500/30 text-center">
              <Lock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Unlock Full Report
              </h3>
              <p className="text-gray-400 mb-6">
                Get access to the complete {selectedReport.pages_count}-page analysis,
                including detailed charts, projections, and actionable insights.
              </p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl font-bold text-white">
                  ${selectedReport.price}
                </span>
                <button
                  onClick={() => handlePurchase(selectedReport)}
                  disabled={purchasing}
                  className="btn-primary flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {purchasing ? 'Processing...' : 'Purchase Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Reports listing
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Crypto Research Reports
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          In-depth analysis and insights from our research team.
          Individual reports from $7.99 - no subscription required.
        </p>
      </div>

      {/* Featured Reports */}
      {featuredReports.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-500" />
            Featured Reports
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredReports.map((report) => (
              <Link
                key={report.id}
                to={`/research/${report.slug}`}
                className="glass-card p-6 hover:border-orange-500/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-500 text-xs font-medium rounded">
                    {report.report_type.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-bold text-white">${report.price}</span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-orange-500 transition-colors mb-2 line-clamp-2">
                  {report.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">{report.summary}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{report.cryptocurrency_symbol.toUpperCase()}</span>
                  <span>{report.purchase_count} purchased</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === type.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {type.name}
              {type.price && (
                <span className="ml-1 text-xs opacity-75">${type.price}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No reports found</h3>
          <p className="text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Link
              key={report.id}
              to={`/research/${report.slug}`}
              className="glass-card p-6 hover:border-orange-500/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded">
                  {report.report_type.replace('_', ' ')}
                </span>
                <span className="text-lg font-bold text-green-400">${report.price}</span>
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors mb-2 line-clamp-2">
                {report.title}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-3 mb-4">{report.summary}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {report.pages_count}p
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {report.view_count}
                  </span>
                </div>
                <span className="uppercase font-medium text-orange-500">
                  {report.cryptocurrency_symbol}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA Section */}
      <div className="mt-16 text-center glass-card p-12">
        <h2 className="text-3xl font-bold text-white mb-4">
          Want Unlimited Research Access?
        </h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Premium subscribers get access to all research reports, plus real-time alerts,
          advanced analytics, and more.
        </p>
        <Link to="/pricing" className="btn-primary">
          View Premium Plans
        </Link>
      </div>
    </div>
  );
}
