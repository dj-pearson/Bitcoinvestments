import { useState } from 'react';
import { Star, ThumbsUp, Check, Shield, Clock } from 'lucide-react';
import { markReviewHelpful, type ReviewWithUser } from '../../services/reviews';
import { cn } from '../../lib/utils';

interface ReviewCardProps {
  review: ReviewWithUser;
  showPlatformInfo?: boolean;
}

export function ReviewCard({ review, showPlatformInfo = false }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false);

  const handleMarkHelpful = async () => {
    if (hasMarkedHelpful) return;

    await markReviewHelpful(review.id);
    setHelpfulCount(prev => prev + 1);
    setHasMarkedHelpful(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAnonymousName = (email?: string) => {
    if (!email) return 'Anonymous User';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1, 3) + '***';
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold">
            {(review.user_email?.charAt(0) || 'A').toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {getAnonymousName(review.user_email)}
              </span>
              {review.verified_user && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs">
                  <Shield className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-3 h-3" />
              {formatDate(review.created_at)}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'w-4 h-4',
                star <= review.rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-600'
              )}
            />
          ))}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-lg font-semibold text-white mb-2">{review.title}</h4>

      {/* Content */}
      <p className="text-gray-300 mb-4 whitespace-pre-wrap">{review.content}</p>

      {/* Pros & Cons */}
      {(review.pros?.length || review.cons?.length) && (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {review.pros && review.pros.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-green-400 mb-2">Pros</h5>
              <ul className="space-y-1">
                {review.pros.map((pro, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.cons && review.cons.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-red-400 mb-2">Cons</h5>
              <ul className="space-y-1">
                {review.cons.map((con, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-red-400 flex-shrink-0">-</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
        <button
          onClick={handleMarkHelpful}
          disabled={hasMarkedHelpful}
          className={cn(
            'flex items-center gap-2 text-sm transition-colors',
            hasMarkedHelpful
              ? 'text-orange-400 cursor-default'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <ThumbsUp className={cn('w-4 h-4', hasMarkedHelpful && 'fill-current')} />
          Helpful ({helpfulCount})
        </button>

        {review.status === 'pending' && (
          <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
            Pending Review
          </span>
        )}
      </div>
    </div>
  );
}
