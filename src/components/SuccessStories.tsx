import { useState, useEffect } from 'react';
import {
  getStories,
  getStory,
  likeStory,
  submitStory,
  STORY_CATEGORY_LABELS,
  STORY_CATEGORY_COLORS
} from '../services/successStories';
import type {
  SuccessStory,
  StoryFilters,
  StoryCategory
} from '../services/successStories';
import { sanitizeHtml } from '../lib/validation';

// Icons
const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg className={`w-5 h-5 ${filled ? 'fill-current text-red-500' : ''}`} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

type View = 'list' | 'detail' | 'submit';

interface SuccessStoriesProps {
  userId?: string;
}

export default function SuccessStories({ userId }: SuccessStoriesProps) {
  const [view, setView] = useState<View>('list');
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<StoryFilters>({
    sortBy: 'newest',
    page: 1,
    limit: 12
  });
  const [totalStories, setTotalStories] = useState(0);

  // Submit form state
  const [submitForm, setSubmitForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'first_investment' as StoryCategory,
    isAnonymous: false,
    authorName: '',
    authorLocation: '',
    startDate: '',
    investmentAmount: '',
    returns: '',
    timeframe: '',
    keyLessons: [''],
    tags: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function loadStories() {
    setLoading(true);
    const { stories: data, total } = await getStories(filters);
    setStories(data);
    setTotalStories(total);
    setLoading(false);
  }

  useEffect(() => {
    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function handleViewStory(story: SuccessStory) {
    const { story: fullStory } = await getStory(story.id);
    if (fullStory) {
      setSelectedStory(fullStory);
      setView('detail');
    }
  }

  async function handleLike(storyId: string) {
    if (!userId) return;

    if (likedStories.has(storyId)) {
      likedStories.delete(storyId);
    } else {
      likedStories.add(storyId);
      await likeStory(userId, storyId);
    }
    setLikedStories(new Set(likedStories));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    const { error } = await submitStory(userId, {
      title: submitForm.title,
      summary: submitForm.summary,
      content: submitForm.content,
      category: submitForm.category,
      isAnonymous: submitForm.isAnonymous,
      authorName: submitForm.authorName,
      authorLocation: submitForm.authorLocation,
      startDate: submitForm.startDate,
      investmentAmount: submitForm.investmentAmount,
      returns: submitForm.returns,
      timeframe: submitForm.timeframe,
      keyLessons: submitForm.keyLessons.filter(l => l.trim()),
      tags: submitForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    });

    setSubmitting(false);
    if (!error) {
      setSubmitSuccess(true);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function renderStoryCard(story: SuccessStory) {
    return (
      <div
        key={story.id}
        className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group"
        onClick={() => handleViewStory(story)}
      >
        {/* Header with category */}
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${STORY_CATEGORY_COLORS[story.category]}`}>
              {STORY_CATEGORY_LABELS[story.category]}
            </span>
            {story.isFeatured && (
              <span className="flex items-center gap-1 text-yellow-600">
                <StarIcon />
                <span className="text-xs font-medium">Featured</span>
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition line-clamp-2">
            {story.title}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-3 mb-4">{story.summary}</p>

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
            {story.timeframe && (
              <span className="px-2 py-1 bg-gray-100 rounded">{story.timeframe}</span>
            )}
            {story.returns && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{story.returns}</span>
            )}
          </div>

          {/* Author */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {story.authorName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{story.authorName}</div>
                {story.authorLocation && (
                  <div className="text-xs text-gray-500">{story.authorLocation}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <EyeIcon />
                {story.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <HeartIcon />
                {story.likes}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStoryDetail() {
    if (!selectedStory) return null;

    return (
      <div>
        <button
          onClick={() => {
            setSelectedStory(null);
            setView('list');
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon />
          Back to Stories
        </button>

        <article className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded ${STORY_CATEGORY_COLORS[selectedStory.category]}`}>
                {STORY_CATEGORY_LABELS[selectedStory.category]}
              </span>
              {selectedStory.isFeatured && (
                <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded">
                  <StarIcon />
                  Featured Story
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedStory.title}</h1>

            <div className="flex items-center gap-4 text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-medium">
                  {selectedStory.authorName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedStory.authorName}</div>
                  {selectedStory.authorLocation && (
                    <div className="text-sm">{selectedStory.authorLocation}</div>
                  )}
                </div>
              </div>
              <span>•</span>
              <span>{formatDate(selectedStory.publishedAt || selectedStory.createdAt)}</span>
            </div>

            {/* Story stats */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
              {selectedStory.timeframe && (
                <div>
                  <div className="text-sm text-gray-500">Timeframe</div>
                  <div className="font-medium">{selectedStory.timeframe}</div>
                </div>
              )}
              {selectedStory.investmentAmount && (
                <div>
                  <div className="text-sm text-gray-500">Investment</div>
                  <div className="font-medium">{selectedStory.investmentAmount}</div>
                </div>
              )}
              {selectedStory.returns && (
                <div>
                  <div className="text-sm text-gray-500">Returns</div>
                  <div className="font-medium text-green-600">{selectedStory.returns}</div>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-8">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedStory.content) }} />
          </div>

          {/* Key Lessons */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Key Lessons</h3>
            <ul className="space-y-2">
              {selectedStory.keyLessons.map((lesson, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckIcon />
                  <span>{lesson}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {selectedStory.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                #{tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <button
              onClick={() => handleLike(selectedStory.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                likedStories.has(selectedStory.id)
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <HeartIcon filled={likedStories.has(selectedStory.id)} />
              {selectedStory.likes + (likedStories.has(selectedStory.id) ? 1 : 0)} Likes
            </button>
            <span className="flex items-center gap-2 text-gray-500">
              <ChatIcon />
              {selectedStory.commentsCount} Comments
            </span>
            <span className="flex items-center gap-2 text-gray-500 ml-auto">
              <EyeIcon />
              {selectedStory.views.toLocaleString()} views
            </span>
          </div>
        </article>
      </div>
    );
  }

  function renderSubmitForm() {
    if (submitSuccess) {
      return (
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Story Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for sharing your story. Our team will review it and publish it soon.
          </p>
          <button
            onClick={() => {
              setSubmitSuccess(false);
              setView('list');
            }}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
          >
            Back to Stories
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon />
          Back to Stories
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Story</h2>
        <p className="text-gray-600 mb-8">
          Inspire others by sharing your crypto journey. Your story might help someone else succeed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={submitForm.title}
              onChange={e => setSubmitForm({ ...submitForm, title: e.target.value })}
              placeholder="e.g., How I Started My Bitcoin Journey"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              required
              value={submitForm.category}
              onChange={e => setSubmitForm({ ...submitForm, category: e.target.value as StoryCategory })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {Object.entries(STORY_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary *</label>
            <textarea
              required
              rows={2}
              value={submitForm.summary}
              onChange={e => setSubmitForm({ ...submitForm, summary: e.target.value })}
              placeholder="A brief summary of your story (1-2 sentences)"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Story *</label>
            <textarea
              required
              rows={10}
              value={submitForm.content}
              onChange={e => setSubmitForm({ ...submitForm, content: e.target.value })}
              placeholder="Share your complete journey. What got you started? What challenges did you face? What did you learn?"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">When did you start?</label>
              <input
                type="date"
                value={submitForm.startDate}
                onChange={e => setSubmitForm({ ...submitForm, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
              <input
                type="text"
                value={submitForm.timeframe}
                onChange={e => setSubmitForm({ ...submitForm, timeframe: e.target.value })}
                placeholder="e.g., 2 years"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment Range</label>
              <input
                type="text"
                value={submitForm.investmentAmount}
                onChange={e => setSubmitForm({ ...submitForm, investmentAmount: e.target.value })}
                placeholder="e.g., $1k-$5k"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Returns (optional)</label>
              <input
                type="text"
                value={submitForm.returns}
                onChange={e => setSubmitForm({ ...submitForm, returns: e.target.value })}
                placeholder="e.g., 100-200%"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Lessons *</label>
            {submitForm.keyLessons.map((lesson, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={lesson}
                  onChange={e => {
                    const newLessons = [...submitForm.keyLessons];
                    newLessons[i] = e.target.value;
                    setSubmitForm({ ...submitForm, keyLessons: newLessons });
                  }}
                  placeholder={`Lesson ${i + 1}`}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newLessons = submitForm.keyLessons.filter((_, idx) => idx !== i);
                      setSubmitForm({ ...submitForm, keyLessons: newLessons });
                    }}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSubmitForm({ ...submitForm, keyLessons: [...submitForm.keyLessons, ''] })}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              + Add another lesson
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={submitForm.tags}
              onChange={e => setSubmitForm({ ...submitForm, tags: e.target.value })}
              placeholder="bitcoin, hodl, dca (comma separated)"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="border-t pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={submitForm.isAnonymous}
                onChange={e => setSubmitForm({ ...submitForm, isAnonymous: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-gray-700">Post anonymously</span>
            </label>

            {!submitForm.isAnonymous && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={submitForm.authorName}
                    onChange={e => setSubmitForm({ ...submitForm, authorName: e.target.value })}
                    placeholder="e.g., John D."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                  <input
                    type="text"
                    value={submitForm.authorLocation}
                    onChange={e => setSubmitForm({ ...submitForm, authorLocation: e.target.value })}
                    placeholder="e.g., New York, USA"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Your Story'}
          </button>
        </form>
      </div>
    );
  }

  function renderStoriesList() {
    return (
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Success Stories</h1>
            <p className="text-gray-600 mt-2">
              Real stories from real investors sharing their crypto journey
            </p>
          </div>
          {userId && (
            <button
              onClick={() => setView('submit')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
            >
              <PlusIcon />
              Share Your Story
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              value={filters.category || ''}
              onChange={e => setFilters({ ...filters, category: e.target.value as StoryCategory || undefined, page: 1 })}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">All Categories</option>
              {Object.entries(STORY_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Sort By</label>
            <select
              value={filters.sortBy || 'newest'}
              onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Viewed</option>
              <option value="most_liked">Most Liked</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search stories..."
              value={filters.search || ''}
              onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map(story => renderStoryCard(story))}
            </div>

            {stories.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-medium text-gray-900">No stories found</h3>
                <p className="mt-2 text-gray-600">Be the first to share your story!</p>
              </div>
            )}

            {/* Pagination */}
            {totalStories > (filters.limit || 12) && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {filters.page || 1} of {Math.ceil(totalStories / (filters.limit || 12))}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= Math.ceil(totalStories / (filters.limit || 12))}
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
      {view === 'list' && renderStoriesList()}
      {view === 'detail' && renderStoryDetail()}
      {view === 'submit' && renderSubmitForm()}
    </div>
  );
}
