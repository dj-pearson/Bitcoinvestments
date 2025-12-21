import { useState, useEffect } from 'react';
import { Star, MessageSquare, PenSquare, ChevronDown } from 'lucide-react';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import {
  getReviews,
  getReviewStats,
  type PlatformType,
  type ReviewWithUser,
  type ReviewStats,
} from '../../services/reviews';
import { cn } from '../../lib/utils';

interface ReviewSectionProps {
  platformType: PlatformType;
  platformId: string;
  platformName: string;
}

export function ReviewSection({ platformType, platformId, platformName }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const REVIEWS_PER_PAGE = 5;

  useEffect(() => {
    loadData();
  }, [platformType, platformId]);

  useEffect(() => {
    loadReviews(true);
  }, [sortBy]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadReviews(true), loadStats()]);
    setLoading(false);
  };

  const loadReviews = async (reset = false) => {
    const offset = reset ? 0 : page * REVIEWS_PER_PAGE;
    const { reviews: newReviews, total } = await getReviews(platformType, platformId, {
      limit: REVIEWS_PER_PAGE,
      offset,
      sortBy,
    });

    if (reset) {
      setReviews(newReviews);
      setPage(0);
    } else {
      setReviews(prev => [...prev, ...newReviews]);
    }

    setHasMore((reset ? 0 : page * REVIEWS_PER_PAGE) + newReviews.length < total);
  };

  const loadStats = async () => {
    const reviewStats = await getReviewStats(platformType, platformId);
    setStats(reviewStats);
  };

  const handleLoadMore = async () => {
    setPage(prev => prev + 1);
    await loadReviews(false);
  };

  const handleReviewSubmitted = () => {
    setShowForm(false);
    loadData();
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4) return 'Very Good';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-gray-800 rounded-xl"></div>
        <div className="animate-pulse h-48 bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Average Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-4xl font-bold text-white">{stats.average_rating}</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
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
                {getRatingLabel(stats.average_rating)} - {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution];
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-8">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Write Review Button */}
            <div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                <PenSquare className="w-5 h-5" />
                Write a Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Reviews State */}
      {!stats && (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Reviews Yet</h3>
          <p className="text-gray-400 mb-6">
            Be the first to share your experience with {platformName}!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            <PenSquare className="w-5 h-5" />
            Write the First Review
          </button>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          platformType={platformType}
          platformId={platformId}
          platformName={platformName}
          onSubmit={handleReviewSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {/* Sort Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {stats?.total_reviews || reviews.length} Review{(stats?.total_reviews || reviews.length) !== 1 ? 's' : ''}
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>

          {/* Review Cards */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
