import { useState, useEffect } from 'react';
import {
  getEarlyAccessFeatures,
  getFeature,
  enrollInBeta,
  leaveBeta,
  submitFeedback,
  FEATURE_CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  isFeatureAvailable
} from '../services/earlyAccess';
import type {
  EarlyAccessFeature,
  FeatureCategory
} from '../services/earlyAccess';

// Icons
const BeakerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

type View = 'list' | 'detail';

interface EarlyAccessProps {
  userId?: string;
  isPremiumUser?: boolean;
}

export default function EarlyAccess({ userId, isPremiumUser = false }: EarlyAccessProps) {
  const [view, setView] = useState<View>('list');
  const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<EarlyAccessFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolledFeatures, setEnrolledFeatures] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<FeatureCategory | ''>('');

  // Feedback form
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggestion' | 'praise' | 'other'>('suggestion');
  const [submitting, setSubmitting] = useState(false);

  async function loadFeatures() {
    setLoading(true);
    const { features: data } = await getEarlyAccessFeatures(categoryFilter || undefined);
    setFeatures(data);
    setLoading(false);
  }

  useEffect(() => {
    loadFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  async function handleViewFeature(feature: EarlyAccessFeature) {
    const { feature: fullFeature } = await getFeature(feature.id);
    if (fullFeature) {
      setSelectedFeature(fullFeature);
      setView('detail');
    }
  }

  async function handleEnroll(featureId: string) {
    if (!userId) return;

    const { success } = await enrollInBeta(userId, featureId);
    if (success) {
      enrolledFeatures.add(featureId);
      setEnrolledFeatures(new Set(enrolledFeatures));
    }
  }

  async function handleLeave(featureId: string) {
    if (!userId) return;

    const { success } = await leaveBeta(userId, featureId);
    if (success) {
      enrolledFeatures.delete(featureId);
      setEnrolledFeatures(new Set(enrolledFeatures));
    }
  }

  async function handleSubmitFeedback() {
    if (!userId || !selectedFeature) return;

    setSubmitting(true);
    const { success } = await submitFeedback(
      userId,
      selectedFeature.id,
      feedbackRating,
      feedbackText,
      feedbackCategory
    );
    setSubmitting(false);

    if (success) {
      setShowFeedbackModal(false);
      setFeedbackText('');
      setFeedbackRating(5);
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <StarIcon key={star} filled={star <= rating} />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  }

  function renderFeatureCard(feature: EarlyAccessFeature) {
    const isEnrolled = enrolledFeatures.has(feature.id);
    const isAvailable = isFeatureAvailable(feature, isPremiumUser);
    const isFull = feature.maxBetaUsers && feature.currentBetaUsers >= feature.maxBetaUsers;

    return (
      <div
        key={feature.id}
        className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group"
        onClick={() => handleViewFeature(feature)}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[feature.status]}`}>
              {STATUS_LABELS[feature.status]}
            </span>
            <span className="text-xs text-gray-500">v{feature.version}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-white rounded">{FEATURE_CATEGORY_LABELS[feature.category]}</span>
            {feature.isPremiumOnly && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">Premium</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition">
            {feature.name}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{feature.description}</p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-gray-500">
              {feature.status !== 'stable' && (
                <span className="flex items-center gap-1">
                  <UsersIcon />
                  {feature.currentBetaUsers}
                  {feature.maxBetaUsers && `/${feature.maxBetaUsers}`}
                </span>
              )}
              {renderStars(feature.averageRating)}
            </div>
          </div>

          {feature.status !== 'stable' && (
            <div className="mt-4">
              {!isAvailable ? (
                <div className="flex items-center justify-center gap-2 py-2 text-gray-500">
                  <LockIcon />
                  <span className="text-sm">{isFull ? 'Beta Full' : 'Premium Only'}</span>
                </div>
              ) : isEnrolled ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeave(feature.id);
                  }}
                  className="w-full py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
                >
                  ✓ Enrolled in Beta
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnroll(feature.id);
                  }}
                  className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                >
                  Join Beta
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderFeatureDetail() {
    if (!selectedFeature) return null;

    const isEnrolled = enrolledFeatures.has(selectedFeature.id);
    const isAvailable = isFeatureAvailable(selectedFeature, isPremiumUser);

    return (
      <div>
        <button
          onClick={() => {
            setSelectedFeature(null);
            setView('list');
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon />
          Back to Features
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded ${STATUS_COLORS[selectedFeature.status]}`}>
                  {STATUS_LABELS[selectedFeature.status]}
                </span>
                <span className="text-gray-500">v{selectedFeature.version}</span>
                {selectedFeature.isPremiumOnly && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded">Premium</span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedFeature.name}</h1>
              <p className="text-gray-600 mb-6">{selectedFeature.longDescription || selectedFeature.description}</p>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <UsersIcon />
                  {selectedFeature.currentBetaUsers} beta users
                </span>
                <span>{selectedFeature.feedbackCount} feedback items</span>
                {renderStars(selectedFeature.averageRating)}
              </div>
            </div>

            {/* Changelog */}
            <div className="bg-white border rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Changelog</h3>
              <div className="space-y-4">
                {selectedFeature.changelog.map((entry, i) => (
                  <div key={i} className="border-l-2 border-purple-200 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">v{entry.version}</span>
                      <span className="text-sm text-gray-500">{entry.date}</span>
                    </div>
                    <ul className="space-y-1">
                      {entry.changes.map((change, j) => (
                        <li key={j} className="text-sm text-gray-600">• {change}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Known Issues */}
            {selectedFeature.knownIssues && selectedFeature.knownIssues.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-800 mb-3">Known Issues</h3>
                <ul className="space-y-2">
                  {selectedFeature.knownIssues.map((issue, i) => (
                    <li key={i} className="text-sm text-yellow-700">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white border rounded-xl p-6 sticky top-4">
              {selectedFeature.status === 'stable' ? (
                <div className="text-center">
                  <CheckIcon />
                  <p className="text-green-600 font-medium mt-2">This feature is now stable!</p>
                  <p className="text-sm text-gray-500 mt-1">Available to all users</p>
                </div>
              ) : !isAvailable ? (
                <div className="text-center">
                  <LockIcon />
                  <p className="text-gray-600 mt-2">
                    {selectedFeature.isPremiumOnly ? 'Premium feature' : 'Beta is full'}
                  </p>
                  {selectedFeature.isPremiumOnly && (
                    <button className="mt-4 w-full py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">
                      Upgrade to Premium
                    </button>
                  )}
                </div>
              ) : isEnrolled ? (
                <>
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckIcon />
                    </div>
                    <p className="font-medium text-gray-900">You're in the beta!</p>
                  </div>

                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="w-full py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 mb-3"
                  >
                    Send Feedback
                  </button>

                  <button
                    onClick={() => handleLeave(selectedFeature.id)}
                    className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Leave Beta
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <BeakerIcon />
                    </div>
                    <p className="font-medium text-gray-900">Join the Beta</p>
                    <p className="text-sm text-gray-500">
                      {selectedFeature.maxBetaUsers
                        ? `${selectedFeature.maxBetaUsers - selectedFeature.currentBetaUsers} spots left`
                        : 'Open beta'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleEnroll(selectedFeature.id)}
                    className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
                  >
                    Join Beta
                  </button>
                </>
              )}

              {/* Requirements */}
              {selectedFeature.requirements && selectedFeature.requirements.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Requirements</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {selectedFeature.requirements.map((req, i) => (
                      <li key={i}>• {req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeline */}
              {selectedFeature.expectedStableDate && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Expected Stable Release</h4>
                  <p className="text-gray-600">
                    {new Date(selectedFeature.expectedStableDate).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Send Feedback</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="p-1"
                    >
                      <StarIcon filled={star <= feedbackRating} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={feedbackCategory}
                  onChange={e => setFeedbackCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="suggestion">Suggestion</option>
                  <option value="bug">Bug Report</option>
                  <option value="praise">Praise</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Feedback</label>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="Share your thoughts..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={submitting || !feedbackText.trim()}
                  className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderFeaturesList() {
    const betaFeatures = features.filter(f => f.status === 'alpha' || f.status === 'beta');
    const stableFeatures = features.filter(f => f.status === 'stable');

    return (
      <div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Early Access Features</h1>
          <p className="text-gray-600 mt-2">
            Be the first to try new features and help shape the future of BitcoinVestments
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              categoryFilter === '' ? 'bg-purple-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.entries(FEATURE_CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCategoryFilter(value as FeatureCategory)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                categoryFilter === value ? 'bg-purple-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* Beta Features */}
            {betaFeatures.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Beta Features ({betaFeatures.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {betaFeatures.map(feature => renderFeatureCard(feature))}
                </div>
              </div>
            )}

            {/* Recently Graduated */}
            {stableFeatures.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Recently Graduated to Stable ({stableFeatures.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stableFeatures.map(feature => renderFeatureCard(feature))}
                </div>
              </div>
            )}

            {features.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <BeakerIcon />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No features in this category</h3>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {view === 'list' && renderFeaturesList()}
      {view === 'detail' && renderFeatureDetail()}
    </div>
  );
}
