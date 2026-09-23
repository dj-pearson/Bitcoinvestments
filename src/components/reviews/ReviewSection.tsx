import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, PenSquare, ChevronDown, AlertCircle } from 'lucide-react';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import {
  getReviews,
  getReviewStats,
  type PlatformType,
  type ReviewWithUser,
  type ReviewStats,
} from '../../services/reviews';
import { isSupabaseConfigured } from '../../lib/supabase';
import { STATIC_MODE } from '../../config/staticMode';
import { cn } from '../../lib/utils';

interface ReviewSectionProps {
  platformType: PlatformType;
  platformId: string;
  platformName: string;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

const REVIEWS_PER_PAGE = 5;

/** Community reviews need a live database and accounts. */
function reviewsAvailable(): boolean {
  return !STATIC_MODE && isSupabaseConfigured();
}

/**
 * Community reviews for a platform. In static mode (no database / no
 * accounts) it renders an honest note instead of an empty state with a
 * sign-in button that cannot work.
 */
export function ReviewSection(props: ReviewSectionProps) {
  if (!reviewsAvailable()) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-6 h-6 text-gray-400 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold text-white">Community reviews are coming soon</p>
            <p className="text-gray-400 text-sm mt-1">
              Reader reviews need accounts, which are not open yet. Everything on this page is our
              own editorial research, dated above, and we do not show star ratings we have not
              collected. Spotted something out of date?{' '}
              <Link to="/terms" className="text-orange-400 hover:text-orange-300 underline">
                See how to contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }
  return <LiveReviewSection {...props} />;
}

function LiveReviewSection({ platformType, platformId, platformName }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [total, setTotal] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  // Guards against a slow response for an old sort/platform overwriting a newer one.
  const requestId = useRef(0);

  // One effect covers mount, platform change, sort change and reloads (no double fetch).
  useEffect(() => {
    const id = ++requestId.current;
    Promise.all([
      getReviews(platformType, platformId, { limit: REVIEWS_PER_PAGE, offset: 0, sortBy }),
      getReviewStats(platformType, platformId),
    ])
      .then(([reviewResult, reviewStats]) => {
        if (id !== requestId.current) return;
        setError(reviewResult.error);
        setReviews(reviewResult.reviews);
        setTotal(reviewResult.total);
        setStats(reviewStats);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : 'Could not load reviews');
        setLoading(false);
      });
  }, [platformType, platformId, sortBy, reloadToken]);

  const changeSort = (value: SortOption) => {
    setLoading(true);
    setSortBy(value);
  };

  const handleLoadMore = async () => {
    const id = requestId.current;
    setLoadingMore(true);
    // The offset is the number of reviews already shown, so there is no stale page counter.
    const result = await getReviews(platformType, platformId, {
      limit: REVIEWS_PER_PAGE,
      offset: reviews.length,
      sortBy,
    });
    if (id !== requestId.current) return;
    if (result.error) {
      setError(result.error);
    } else {
      setReviews(prev => {
        const seen = new Set(prev.map(r => r.id));
        return [...prev, ...result.reviews.filter(r => !seen.has(r.id))];
      });
      setTotal(result.total);
    }
    setLoadingMore(false);
  };

  const handleReviewSubmitted = () => {
    setShowForm(false);
    setLoading(true);
    setReloadToken(t => t + 1);
  };

  const hasMore = reviews.length < total;

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4) return 'Very good';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading reviews…</span>
        <div className="animate-pulse h-32 bg-gray-800 rounded-xl"></div>
        <div className="animate-pulse h-48 bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>Reviews could not be loaded right now ({error}). Please try again later.</span>
        </div>
      )}

      {/* Stats overview: only from real, approved reviews */}
      {stats && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-4xl font-bold text-white">{stats.average_rating}</span>
                <div className="flex items-center" role="img" aria-label={`${stats.average_rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      aria-hidden="true"
                      className={cn(
                        'w-5 h-5',
                        star <= Math.round(stats.average_rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {getRatingLabel(stats.average_rating)} · {stats.total_reviews} reader review{stats.total_reviews !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution];
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-12">{rating} star</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden" aria-hidden="true">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                aria-expanded={showForm}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                <PenSquare className="w-5 h-5" aria-hidden="true" />
                Write a review
              </button>
            </div>
          </div>
        </div>
      )}

      {!stats && !error && (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <MessageSquare className="w-8 h-8 text-gray-500 mx-auto mb-4" aria-hidden="true" />
          <p className="text-xl font-semibold text-white mb-2">No reader reviews yet</p>
          <p className="text-gray-400 mb-6">
            Have you used {platformName}? Share what it was really like.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            <PenSquare className="w-5 h-5" aria-hidden="true" />
            Write the first review
          </button>
        </div>
      )}

      {showForm && (
        <ReviewForm
          platformType={platformType}
          platformId={platformId}
          platformName={platformName}
          onSubmit={handleReviewSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}

      {reviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-lg font-semibold text-white">
              {total} review{total !== 1 ? 's' : ''}
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              Sort reviews
              <select
                value={sortBy}
                onChange={(e) => changeSort(e.target.value as SortOption)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
                <option value="helpful">Most helpful</option>
              </select>
            </label>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
                {loadingMore ? 'Loading…' : 'Load more reviews'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
