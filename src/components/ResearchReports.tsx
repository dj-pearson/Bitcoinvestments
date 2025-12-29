import { useState, useEffect } from 'react';
import {
  getReports,
  getReport,
  likeReport,
  REPORT_TYPE_LABELS,
  REPORT_TYPE_COLORS
} from '../services/researchReports';
import type {
  ResearchReport,
  ReportFilters,
  ReportType
} from '../services/researchReports';
import { sanitizeHtml } from '../lib/validation';

// Icons
const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg className={`w-5 h-5 ${filled ? 'fill-current text-red-500' : ''}`} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

type View = 'list' | 'detail';

interface ResearchReportsProps {
  userId?: string;
  isPremiumUser?: boolean;
}

export default function ResearchReports({ userId, isPremiumUser = false }: ResearchReportsProps) {
  const [view, setView] = useState<View>('list');
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedReports, setLikedReports] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ReportFilters>({
    page: 1,
    limit: 12
  });
  const [totalReports, setTotalReports] = useState(0);

  async function loadReports() {
    setLoading(true);
    const { reports: data, total } = await getReports(filters);
    setReports(data);
    setTotalReports(total);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function handleViewReport(report: ResearchReport) {
    const { report: fullReport } = await getReport(report.id);
    if (fullReport) {
      setSelectedReport(fullReport);
      setView('detail');
    }
  }

  async function handleLike(reportId: string) {
    if (!userId) return;

    if (likedReports.has(reportId)) {
      likedReports.delete(reportId);
    } else {
      likedReports.add(reportId);
      await likeReport(userId, reportId);
    }
    setLikedReports(new Set(likedReports));
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function renderReportCard(report: ResearchReport) {
    const isLocked = report.isPremium && !isPremiumUser;

    return (
      <div
        key={report.id}
        className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group"
        onClick={() => handleViewReport(report)}
      >
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-gray-700 to-gray-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <DocumentIcon />
          </div>
          {report.isPremium && (
            <span className="absolute top-3 right-3 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
              PREMIUM
            </span>
          )}
          <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded ${REPORT_TYPE_COLORS[report.type]}`}>
            {REPORT_TYPE_LABELS[report.type]}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>{formatDate(report.publishedAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ClockIcon />
              {report.readTime} min read
            </span>
          </div>

          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition line-clamp-2">
            {report.title}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{report.summary}</p>

          <div className="flex items-center justify-between">
            {report.author && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                  {report.author.name.charAt(0)}
                </div>
                <span className="text-sm text-gray-600">{report.author.name}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <EyeIcon />
                {report.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <HeartIcon />
                {report.likes}
              </span>
            </div>
          </div>

          {isLocked && (
            <div className="mt-3 pt-3 border-t flex items-center justify-center gap-2 text-orange-600">
              <LockIcon />
              <span className="text-sm font-medium">Unlock with Premium</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderReportDetail() {
    if (!selectedReport) return null;

    const isLocked = selectedReport.isPremium && !isPremiumUser;

    return (
      <div>
        <button
          onClick={() => {
            setSelectedReport(null);
            setView('list');
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon />
          Back to Reports
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 text-sm font-medium rounded ${REPORT_TYPE_COLORS[selectedReport.type]}`}>
              {REPORT_TYPE_LABELS[selectedReport.type]}
            </span>
            {selectedReport.isPremium && (
              <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-bold rounded">
                PREMIUM
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedReport.title}</h1>

          <p className="text-lg text-gray-600 mb-6">{selectedReport.summary}</p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            {selectedReport.author && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-medium">
                  {selectedReport.author.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedReport.author.name}</div>
                  <div className="text-xs">{selectedReport.author.title}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              <ClockIcon />
              {selectedReport.readTime} min read
            </div>

            <div>{formatDate(selectedReport.publishedAt)}</div>

            <div className="flex items-center gap-1">
              <EyeIcon />
              {selectedReport.views.toLocaleString()} views
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {isLocked ? (
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LockIcon />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Content</h3>
                <p className="text-gray-600 mb-6">
                  Upgrade to Premium to unlock this report and get access to all our research.
                </p>
                <button className="px-8 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">
                  Upgrade to Premium
                </button>
              </div>
            ) : (
              <>
                {/* Key Takeaways */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Key Takeaways</h3>
                  <ul className="space-y-2">
                    {selectedReport.keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckIcon />
                        <span className="text-gray-700">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Report Content */}
                <div className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedReport.content) }} />
                </div>
              </>
            )}

            {/* Actions */}
            {!isLocked && (
              <div className="flex items-center gap-4 mt-8 pt-8 border-t">
                <button
                  onClick={() => handleLike(selectedReport.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                    likedReports.has(selectedReport.id)
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <HeartIcon filled={likedReports.has(selectedReport.id)} />
                  {selectedReport.likes + (likedReports.has(selectedReport.id) ? 1 : 0)} Likes
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
                  <ShareIcon />
                  Share
                </button>
                {selectedReport.pdfUrl && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                    <DownloadIcon />
                    Download PDF
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Tags */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedReport.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white border rounded-full text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Author Bio */}
            {selectedReport.author && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">About the Author</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center font-medium">
                    {selectedReport.author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{selectedReport.author.name}</div>
                    <div className="text-sm text-gray-600">{selectedReport.author.title}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{selectedReport.author.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderReportsList() {
    return (
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Research Reports</h1>
          <p className="text-gray-600 mt-2">
            In-depth analysis and insights from our research team
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select
              value={filters.type || ''}
              onChange={e => setFilters({ ...filters, type: e.target.value as ReportType || undefined, page: 1 })}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">All Types</option>
              {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Access</label>
            <select
              value={filters.isPremium === undefined ? '' : filters.isPremium ? 'premium' : 'free'}
              onChange={e => {
                const val = e.target.value;
                setFilters({
                  ...filters,
                  isPremium: val === '' ? undefined : val === 'premium',
                  page: 1
                });
              }}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">All Reports</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search reports..."
              value={filters.search || ''}
              onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map(report => renderReportCard(report))}
            </div>

            {reports.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <DocumentIcon />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No reports found</h3>
                <p className="mt-2 text-gray-600">Try adjusting your filters</p>
              </div>
            )}

            {/* Pagination */}
            {totalReports > (filters.limit || 12) && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {filters.page || 1} of {Math.ceil(totalReports / (filters.limit || 12))}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= Math.ceil(totalReports / (filters.limit || 12))}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Premium CTA */}
        {!isPremiumUser && (
          <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Unlock All Research Reports</h3>
            <p className="mb-6 opacity-90">
              Get unlimited access to all premium reports, weekly analysis, and exclusive insights
            </p>
            <button className="px-8 py-3 bg-white text-orange-600 rounded-lg font-medium hover:bg-gray-100">
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {view === 'list' && renderReportsList()}
      {view === 'detail' && renderReportDetail()}
    </div>
  );
}
