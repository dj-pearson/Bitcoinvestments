import { useState, useEffect } from 'react';
import {
  getAMASessions,
  getAMASession,
  registerForAMA,
  submitQuestion,
  upvoteQuestion,
} from '../services/amaSessions';
import type {
  AMASession,
  AMAQuestion,
  AMAFilters
} from '../services/amaSessions';

// Icons
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const ChatIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

type View = 'list' | 'detail';

interface AMASessionsProps {
  userId?: string;
  isPremiumUser?: boolean;
}

export default function AMASessions({ userId, isPremiumUser = false }: AMASessionsProps) {
  const [view, setView] = useState<View>('list');
  const [sessions, setSessions] = useState<AMASession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AMASession | null>(null);
  const [questions, setQuestions] = useState<AMAQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredSessions, setRegisteredSessions] = useState<Set<string>>(new Set());
  const [upvotedQuestions, setUpvotedQuestions] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<AMAFilters>({ page: 1, limit: 12 });
  const [totalSessions, setTotalSessions] = useState(0);

  // Question submission
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadSessions() {
    setLoading(true);
    const { sessions: data, total } = await getAMASessions(filters);
    setSessions(data);
    setTotalSessions(total);
    setLoading(false);
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function handleViewSession(session: AMASession) {
    const { session: fullSession, questions: sessionQuestions } = await getAMASession(session.id);
    if (fullSession) {
      setSelectedSession(fullSession);
      setQuestions(sessionQuestions);
      setView('detail');
    }
  }

  async function handleRegister(sessionId: string) {
    if (!userId) return;

    const { success } = await registerForAMA(userId, sessionId);
    if (success) {
      registeredSessions.add(sessionId);
      setRegisteredSessions(new Set(registeredSessions));
    }
  }

  async function handleSubmitQuestion() {
    if (!userId || !selectedSession || !newQuestion.trim()) return;

    setSubmitting(true);
    const { question, error } = await submitQuestion(userId, selectedSession.id, newQuestion, isAnonymous);
    setSubmitting(false);

    if (question && !error) {
      setQuestions([question, ...questions]);
      setNewQuestion('');
      setIsAnonymous(false);
      setShowQuestionModal(false);
    }
  }

  async function handleUpvote(questionId: string) {
    if (!userId) return;

    if (!upvotedQuestions.has(questionId)) {
      upvotedQuestions.add(questionId);
      setUpvotedQuestions(new Set(upvotedQuestions));
      await upvoteQuestion(userId, questionId);

      setQuestions(questions.map(q =>
        q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q
      ));
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'live':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full animate-pulse">🔴 LIVE</span>;
      case 'scheduled':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Upcoming</span>;
      case 'ended':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Ended</span>;
      default:
        return null;
    }
  }

  function getTimeUntil(dateString: string): string {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();

    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  }

  function renderSessionCard(session: AMASession) {
    const isLocked = session.isPremium && !isPremiumUser;
    const isRegistered = registeredSessions.has(session.id);

    return (
      <div
        key={session.id}
        className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group"
        onClick={() => handleViewSession(session)}
      >
        {/* Header */}
        <div className="relative p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex justify-between items-start mb-3">
            {getStatusBadge(session.status)}
            {session.isPremium && (
              <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">PREMIUM</span>
            )}
          </div>

          {session.status === 'scheduled' && (
            <div className="text-right">
              <div className="text-2xl font-bold">{getTimeUntil(session.scheduledAt)}</div>
              <div className="text-xs opacity-80">until start</div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition">
            {session.title}
          </h3>

          {/* Expert */}
          {session.expert && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                {session.expert.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-gray-900">{session.expert.name}</div>
                <div className="text-xs text-gray-500">{session.expert.title}</div>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <CalendarIcon />
              {formatDate(session.scheduledAt)}
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon />
              {session.duration} min
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <UsersIcon />
                {session.attendeeCount}
              </span>
              <span className="flex items-center gap-1">
                <ChatIcon />
                {session.questionCount} Q&A
              </span>
            </div>

            {session.status === 'scheduled' && !isLocked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRegister(session.id);
                }}
                disabled={isRegistered}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  isRegistered
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {isRegistered ? '✓ Registered' : 'Register'}
              </button>
            )}

            {session.status === 'ended' && session.recordingUrl && (
              <span className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                <PlayIcon />
                Recording Available
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderSessionDetail() {
    if (!selectedSession) return null;

    const isLocked = selectedSession.isPremium && !isPremiumUser;
    const isRegistered = registeredSessions.has(selectedSession.id);

    return (
      <div>
        <button
          onClick={() => {
            setSelectedSession(null);
            setView('list');
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon />
          Back to Sessions
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white mb-6">
              <div className="flex items-center gap-3 mb-4">
                {getStatusBadge(selectedSession.status)}
                {selectedSession.isPremium && (
                  <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">PREMIUM</span>
                )}
              </div>

              <h1 className="text-2xl font-bold mb-4">{selectedSession.title}</h1>
              <p className="opacity-90 mb-6">{selectedSession.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <CalendarIcon />
                  {formatDate(selectedSession.scheduledAt)}
                </span>
                <span className="flex items-center gap-2">
                  <ClockIcon />
                  {formatTime(selectedSession.scheduledAt)} ({selectedSession.duration} min)
                </span>
                <span className="flex items-center gap-2">
                  <UsersIcon />
                  {selectedSession.attendeeCount} registered
                </span>
              </div>
            </div>

            {/* Expert Info */}
            {selectedSession.expert && (
              <div className="bg-white border rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">About the Expert</h3>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                    {selectedSession.expert.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{selectedSession.expert.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{selectedSession.expert.title}</p>
                    <p className="text-gray-600 text-sm mb-3">{selectedSession.expert.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.expert.expertise.map(exp => (
                        <span key={exp} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Questions Section */}
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Questions ({questions.length})
                </h3>
                {userId && selectedSession.status !== 'ended' && !isLocked && (
                  <button
                    onClick={() => setShowQuestionModal(true)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600"
                  >
                    Ask a Question
                  </button>
                )}
              </div>

              {questions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No questions yet. Be the first to ask!
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map(question => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleUpvote(question.id)}
                          disabled={upvotedQuestions.has(question.id)}
                          className={`flex flex-col items-center gap-1 px-2 py-1 rounded transition ${
                            upvotedQuestions.has(question.id)
                              ? 'bg-purple-100 text-purple-600'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <ArrowUpIcon />
                          <span className="text-sm font-medium">{question.upvotes}</span>
                        </button>
                        <div className="flex-1">
                          <p className="text-gray-900 mb-2">{question.content}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{question.userName}</span>
                            {question.status === 'answered' && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                Answered
                              </span>
                            )}
                          </div>
                          {question.answer && (
                            <div className="mt-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                              <p className="text-sm text-gray-700">{question.answer}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Registration Card */}
            <div className="bg-white border rounded-xl p-6 sticky top-4">
              {selectedSession.status === 'scheduled' ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-purple-600">
                      {getTimeUntil(selectedSession.scheduledAt)}
                    </div>
                    <div className="text-gray-500">until session starts</div>
                  </div>

                  {isLocked ? (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">This is a premium AMA session</p>
                      <button className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">
                        Upgrade to Access
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRegister(selectedSession.id)}
                        disabled={isRegistered}
                        className={`w-full py-3 rounded-lg font-medium transition mb-4 ${
                          isRegistered
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                        }`}
                      >
                        {isRegistered ? (
                          <span className="flex items-center justify-center gap-2">
                            <CheckIcon />
                            Registered
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <BellIcon />
                            Register & Get Reminder
                          </span>
                        )}
                      </button>

                      {selectedSession.maxAttendees && (
                        <p className="text-sm text-gray-500 text-center">
                          {selectedSession.attendeeCount} / {selectedSession.maxAttendees} spots filled
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : selectedSession.status === 'live' ? (
                <button className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 animate-pulse">
                  Join Live Session
                </button>
              ) : (
                selectedSession.recordingUrl && (
                  <button className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 flex items-center justify-center gap-2">
                    <PlayIcon />
                    Watch Recording
                  </button>
                )
              )}

              {/* Topics */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Topics Covered</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.topics.map(topic => (
                    <span key={topic} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Ask a Question</h3>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                rows={4}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-gray-700">Ask anonymously</span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitQuestion}
                  disabled={submitting || !newQuestion.trim()}
                  className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Question'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderSessionsList() {
    const _upcomingSessions = sessions.filter(s => s.status === 'scheduled');
    const _pastSessions = sessions.filter(s => s.status === 'ended');
    // TODO: Use upcomingSessions and pastSessions in UI sections
    void _upcomingSessions;
    void _pastSessions;

    return (
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expert AMA Sessions</h1>
          <p className="text-gray-600 mt-2">
            Live Q&A sessions with leading cryptocurrency experts
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setFilters({ ...filters, upcoming: true, status: undefined })}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filters.upcoming ? 'bg-purple-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilters({ ...filters, upcoming: false, status: 'ended' })}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filters.status === 'ended' ? 'bg-purple-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Past Sessions
          </button>
          <button
            onClick={() => setFilters({ ...filters, upcoming: undefined, status: undefined })}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !filters.upcoming && !filters.status ? 'bg-purple-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {sessions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <CalendarIcon />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No sessions found</h3>
                <p className="mt-2 text-gray-600">Check back soon for upcoming AMAs!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map(session => renderSessionCard(session))}
              </div>
            )}

            {/* Pagination */}
            {totalSessions > (filters.limit || 12) && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {filters.page || 1} of {Math.ceil(totalSessions / (filters.limit || 12))}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= Math.ceil(totalSessions / (filters.limit || 12))}
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
      {view === 'list' && renderSessionsList()}
      {view === 'detail' && renderSessionDetail()}
    </div>
  );
}
