import React, { useState, useEffect } from 'react';
import {
  getWebinars,
  getWebinar,
  registerForWebinar,
  Webinar,
  WebinarFilters,
  WebinarCategory,
  WEBINAR_CATEGORY_LABELS,
  WEBINAR_CATEGORY_COLORS
} from '../services/webinars';

// Icons
const VideoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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

type View = 'list' | 'detail';

interface WebinarsProps {
  userId?: string;
  isPremiumUser?: boolean;
}

export default function Webinars({ userId, isPremiumUser = false }: WebinarsProps) {
  const [view, setView] = useState<View>('list');
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredWebinars, setRegisteredWebinars] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<WebinarFilters>({ page: 1, limit: 12 });
  const [totalWebinars, setTotalWebinars] = useState(0);

  useEffect(() => {
    loadWebinars();
  }, [filters]);

  async function loadWebinars() {
    setLoading(true);
    const { webinars: data, total } = await getWebinars(filters);
    setWebinars(data);
    setTotalWebinars(total);
    setLoading(false);
  }

  async function handleViewWebinar(webinar: Webinar) {
    const { webinar: fullWebinar } = await getWebinar(webinar.id);
    if (fullWebinar) {
      setSelectedWebinar(fullWebinar);
      setView('detail');
    }
  }

  async function handleRegister(webinarId: string) {
    if (!userId) return;

    const { success } = await registerForWebinar(userId, webinarId);
    if (success) {
      registeredWebinars.add(webinarId);
      setRegisteredWebinars(new Set(registeredWebinars));
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  function getTimeUntil(dateString: string): string {
    const diff = new Date(dateString).getTime() - Date.now();
    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  }

  function renderWebinarCard(webinar: Webinar) {
    const isLocked = webinar.isPremium && !isPremiumUser;
    const isRegistered = registeredWebinars.has(webinar.id);

    return (
      <div
        key={webinar.id}
        className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group"
        onClick={() => handleViewWebinar(webinar)}
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
          <div className="flex justify-between">
            <span className={`px-2 py-1 text-xs font-medium rounded ${WEBINAR_CATEGORY_COLORS[webinar.category]}`}>
              {WEBINAR_CATEGORY_LABELS[webinar.category]}
            </span>
            {webinar.isPremium && (
              <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                ${webinar.price}
              </span>
            )}
          </div>

          {webinar.status === 'upcoming' && (
            <div className="absolute bottom-4 right-4 text-white text-right">
              <div className="text-xl font-bold">{getTimeUntil(webinar.scheduledAt)}</div>
              <div className="text-xs opacity-80">until start</div>
            </div>
          )}

          {webinar.status === 'ended' && webinar.recordingUrl && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white">
              <PlayIcon />
              <span className="text-sm font-medium">Recording Available</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition">
            {webinar.title}
          </h3>

          {webinar.host && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium text-sm">
                {webinar.host.name.charAt(0)}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{webinar.host.name}</div>
                <div className="text-gray-500 text-xs">{webinar.host.title}</div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <CalendarIcon />
              {formatDate(webinar.scheduledAt)}
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon />
              {webinar.duration} min
            </span>
            <span className="flex items-center gap-1">
              <UsersIcon />
              {webinar.attendeeCount}
            </span>
          </div>

          {webinar.status === 'upcoming' && !isLocked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRegister(webinar.id);
              }}
              disabled={isRegistered}
              className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                isRegistered
                  ? 'bg-green-100 text-green-700'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              {isRegistered ? '✓ Registered' : 'Register Free'}
            </button>
          )}

          {isLocked && (
            <div className="flex items-center justify-center gap-2 py-2 text-indigo-600">
              <LockIcon />
              <span className="text-sm font-medium">Premium Webinar</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderWebinarDetail() {
    if (!selectedWebinar) return null;

    const isLocked = selectedWebinar.isPremium && !isPremiumUser;
    const isRegistered = registeredWebinars.has(selectedWebinar.id);

    return (
      <div>
        <button
          onClick={() => {
            setSelectedWebinar(null);
            setView('list');
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon />
          Back to Webinars
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 text-white mb-6">
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded mb-4 ${WEBINAR_CATEGORY_COLORS[selectedWebinar.category]}`}>
                {WEBINAR_CATEGORY_LABELS[selectedWebinar.category]}
              </span>

              <h1 className="text-2xl font-bold mb-4">{selectedWebinar.title}</h1>
              <p className="opacity-90 mb-6">{selectedWebinar.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <CalendarIcon />
                  {formatDate(selectedWebinar.scheduledAt)}
                </span>
                <span className="flex items-center gap-2">
                  <ClockIcon />
                  {formatTime(selectedWebinar.scheduledAt)}
                </span>
                <span className="flex items-center gap-2">
                  <VideoIcon />
                  {selectedWebinar.duration} minutes
                </span>
              </div>
            </div>

            {/* Learning Outcomes */}
            <div className="bg-white border rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">What You'll Learn</h3>
              <ul className="space-y-3">
                {selectedWebinar.learningOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-gray-700">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Host */}
            {selectedWebinar.host && (
              <div className="bg-white border rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Your Host</h3>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xl font-medium">
                    {selectedWebinar.host.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedWebinar.host.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{selectedWebinar.host.title}</p>
                    <p className="text-gray-600 text-sm">{selectedWebinar.host.bio}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Materials */}
            {selectedWebinar.materials && selectedWebinar.materials.length > 0 && (
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Materials Included</h3>
                <div className="space-y-3">
                  {selectedWebinar.materials.map(material => (
                    <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DownloadIcon />
                        <span className="text-gray-900">{material.title}</span>
                        {material.isPremium && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                            Premium
                          </span>
                        )}
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white border rounded-xl p-6 sticky top-4">
              {selectedWebinar.status === 'upcoming' ? (
                <>
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-indigo-600">
                      {getTimeUntil(selectedWebinar.scheduledAt)}
                    </div>
                    <div className="text-gray-500">until webinar starts</div>
                  </div>

                  {isLocked ? (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        ${selectedWebinar.price}
                      </div>
                      <button className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 mb-4">
                        Purchase Access
                      </button>
                      <p className="text-sm text-gray-500">
                        Includes recording and all materials
                      </p>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRegister(selectedWebinar.id)}
                        disabled={isRegistered}
                        className={`w-full py-3 rounded-lg font-medium transition mb-4 ${
                          isRegistered
                            ? 'bg-green-100 text-green-700'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        }`}
                      >
                        {isRegistered ? (
                          <span className="flex items-center justify-center gap-2">
                            <CheckIcon />
                            Registered
                          </span>
                        ) : (
                          'Register Free'
                        )}
                      </button>

                      {selectedWebinar.maxAttendees && (
                        <p className="text-sm text-gray-500 text-center">
                          {selectedWebinar.attendeeCount} / {selectedWebinar.maxAttendees} spots
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : selectedWebinar.status === 'live' ? (
                <button className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 animate-pulse">
                  Join Live Now
                </button>
              ) : selectedWebinar.recordingUrl ? (
                <button className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 flex items-center justify-center gap-2">
                  <PlayIcon />
                  Watch Recording
                </button>
              ) : (
                <p className="text-center text-gray-500">Webinar has ended</p>
              )}

              {selectedWebinar.prerequisites && selectedWebinar.prerequisites.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Prerequisites</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {selectedWebinar.prerequisites.map((prereq, i) => (
                      <li key={i}>• {prereq}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderWebinarsList() {
    return (
      <div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expert Webinars</h1>
          <p className="text-gray-600 mt-2">
            Live educational sessions from cryptocurrency experts
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={filters.category || ''}
            onChange={e => setFilters({ ...filters, category: e.target.value as WebinarCategory || undefined, page: 1 })}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">All Categories</option>
            {Object.entries(WEBINAR_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filters.status || ''}
            onChange={e => setFilters({ ...filters, status: e.target.value as any || undefined, page: 1 })}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">All Webinars</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Past (Recordings)</option>
          </select>

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
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">Free & Premium</option>
            <option value="free">Free Only</option>
            <option value="premium">Premium Only</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webinars.map(webinar => renderWebinarCard(webinar))}
            </div>

            {webinars.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <VideoIcon />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No webinars found</h3>
                <p className="mt-2 text-gray-600">Check back soon for upcoming sessions!</p>
              </div>
            )}

            {totalWebinars > (filters.limit || 12) && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {filters.page || 1}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= Math.ceil(totalWebinars / (filters.limit || 12))}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {view === 'list' && renderWebinarsList()}
      {view === 'detail' && renderWebinarDetail()}
    </div>
  );
}
