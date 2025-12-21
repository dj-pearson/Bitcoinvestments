import { useState } from 'react';
import { Star, Plus, X, Send, AlertCircle } from 'lucide-react';
import { submitReview, type PlatformType, type ReviewInput } from '../../services/reviews';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface ReviewFormProps {
  platformType: PlatformType;
  platformId: string;
  platformName: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  platformType,
  platformId,
  platformName,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddPro = () => {
    if (pros.length < 5) {
      setPros([...pros, '']);
    }
  };

  const handleAddCon = () => {
    if (cons.length < 5) {
      setCons([...cons, '']);
    }
  };

  const handleRemovePro = (index: number) => {
    setPros(pros.filter((_, i) => i !== index));
  };

  const handleRemoveCon = (index: number) => {
    setCons(cons.filter((_, i) => i !== index));
  };

  const handleProChange = (index: number, value: string) => {
    const newPros = [...pros];
    newPros[index] = value;
    setPros(newPros);
  };

  const handleConChange = (index: number, value: string) => {
    const newCons = [...cons];
    newCons[index] = value;
    setCons(newCons);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Please sign in to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (content.trim().length < 20) {
      setError('Review must be at least 20 characters');
      return;
    }

    setLoading(true);

    const reviewData: ReviewInput = {
      platform_type: platformType,
      platform_id: platformId,
      rating,
      title: title.trim(),
      content: content.trim(),
      pros: pros.filter(p => p.trim()),
      cons: cons.filter(c => c.trim()),
    };

    const { error: submitError } = await submitReview(user.id, reviewData);

    if (submitError) {
      setError(submitError);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    onSubmit?.();
  };

  if (!user) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
        <p className="text-gray-400 mb-4">Sign in to write a review</p>
        <Link
          to="/login"
          className="inline-block px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-green-500/30 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Thank You!</h3>
        <p className="text-gray-400">
          Your review has been submitted and is pending moderation.
          It will appear once approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          Write a Review for {platformName}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Your Rating *
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'w-8 h-8 transition-colors',
                  (hoverRating || rating) >= star
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600'
                )}
              />
            </button>
          ))}
          <span className="ml-3 text-gray-400">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        <label htmlFor="review-title" className="block text-sm font-medium text-gray-300 mb-2">
          Review Title *
        </label>
        <input
          type="text"
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Content */}
      <div className="mb-6">
        <label htmlFor="review-content" className="block text-sm font-medium text-gray-300 mb-2">
          Your Review *
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this platform..."
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{content.length}/2000 characters</p>
      </div>

      {/* Pros */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Pros (optional)
        </label>
        <div className="space-y-2">
          {pros.map((pro, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={pro}
                onChange={(e) => handleProChange(index, e.target.value)}
                placeholder="What did you like?"
                maxLength={100}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {pros.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePro(index)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {pros.length < 5 && (
            <button
              type="button"
              onClick={handleAddPro}
              className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add another pro
            </button>
          )}
        </div>
      </div>

      {/* Cons */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cons (optional)
        </label>
        <div className="space-y-2">
          {cons.map((con, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={con}
                onChange={(e) => handleConChange(index, e.target.value)}
                placeholder="What could be improved?"
                maxLength={100}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {cons.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCon(index)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {cons.length < 5 && (
            <button
              type="button"
              onClick={handleAddCon}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add another con
            </button>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Reviews are moderated before appearing publicly.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {loading ? (
            'Submitting...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Review
            </>
          )}
        </button>
      </div>
    </form>
  );
}
