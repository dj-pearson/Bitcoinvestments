import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Check,
  Eye,
  Clock,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  Send,
  Pin,
  Lock,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  getQuestions,
  getQuestion,
  createQuestion,
  createAnswer,
  vote,
  acceptAnswer,
  getForumStats,
  CATEGORY_INFO,
  POPULAR_TAGS,
  type Question,
  type Answer,
  type QuestionCategory,
  type SearchFilters,
  type ForumStats,
} from '../services/qaForum';

interface QAForumProps {
  userId?: string;
}

export function QAForum({ userId }: QAForumProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'newest',
    page: 1,
    limit: 10,
  });
  const [total, setTotal] = useState(0);

  const loadQuestions = async () => {
    setIsLoading(true);
    const result = await getQuestions(filters);
    if (!result.error) {
      setQuestions(result.questions);
      setTotal(result.total);
    }
    setIsLoading(false);
  };

  const loadStats = async () => {
    const result = await getForumStats();
    setStats(result);
  };

  useEffect(() => {
    loadQuestions();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, query, page: 1 }));
  };

  const handleCategoryFilter = (category?: QuestionCategory) => {
    setFilters((prev) => ({ ...prev, category, page: 1 }));
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    setFilters((prev) => ({ ...prev, sortBy, page: 1 }));
  };

  if (selectedQuestion) {
    return (
      <QuestionDetail
        questionId={selectedQuestion}
        userId={userId}
        onBack={() => setSelectedQuestion(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-blue-400" />
              Community Q&A
            </h1>
            <p className="text-slate-400 mt-1">
              Ask questions, share knowledge, help others learn
            </p>
          </div>
          {userId && (
            <button
              onClick={() => setShowAskModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Ask Question
            </button>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBadge label="Questions" value={stats.totalQuestions} />
            <StatBadge label="Answers" value={stats.totalAnswers} />
            <StatBadge label="Unanswered" value={stats.unansweredCount} highlight />
            <StatBadge label="Active Users" value={stats.activeUsers} />
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filters.category || ''}
              onChange={(e) =>
                handleCategoryFilter(e.target.value as QuestionCategory || undefined)
              }
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.icon} {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as SearchFilters['sortBy'])}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="newest">Newest</option>
            <option value="votes">Most Votes</option>
            <option value="views">Most Views</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>

        {/* Category Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() =>
                handleCategoryFilter(
                  filters.category === key ? undefined : (key as QuestionCategory)
                )
              }
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filters.category === key
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={{
                backgroundColor:
                  filters.category === key ? info.color : undefined,
              }}
            >
              {info.icon} {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
          <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Questions Found</h3>
          <p className="text-slate-400">
            {filters.query || filters.category
              ? 'Try adjusting your filters'
              : 'Be the first to ask a question!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onClick={() => setSelectedQuestion(question.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > filters.limit && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={filters.page === 1}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-slate-400">
            Page {filters.page} of {Math.ceil(total / filters.limit)}
          </span>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={filters.page >= Math.ceil(total / filters.limit)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Ask Question Modal */}
      {showAskModal && userId && (
        <AskQuestionModal
          userId={userId}
          onClose={() => setShowAskModal(false)}
          onSuccess={() => {
            setShowAskModal(false);
            loadQuestions();
          }}
        />
      )}
    </div>
  );
}

// Stat Badge
function StatBadge({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3">
      <div className="text-sm text-slate-400">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-orange-400' : 'text-white'}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// Question Card
function QuestionCard({
  question,
  onClick,
}: {
  question: Question;
  onClick: () => void;
}) {
  const categoryInfo = CATEGORY_INFO[question.category];

  return (
    <div
      onClick={onClick}
      className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 cursor-pointer transition-colors"
    >
      <div className="flex gap-4">
        {/* Vote/Answer Count */}
        <div className="flex flex-col items-center gap-2 text-center min-w-[60px]">
          <div
            className={`px-3 py-1 rounded-lg text-sm ${
              question.upvotes > 10
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {question.upvotes} votes
          </div>
          <div
            className={`px-3 py-1 rounded-lg text-sm ${
              question.acceptedAnswerId
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : question.answerCount > 0
                ? 'bg-slate-800 text-slate-400'
                : 'bg-orange-500/20 text-orange-400'
            }`}
          >
            {question.answerCount} {question.answerCount === 1 ? 'answer' : 'answers'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {question.isPinned && <Pin className="h-4 w-4 text-blue-400" />}
            {question.isClosed && <Lock className="h-4 w-4 text-red-400" />}
            <h3 className="font-medium text-white hover:text-blue-400 transition-colors line-clamp-1">
              {question.title}
            </h3>
          </div>

          <p className="text-sm text-slate-400 line-clamp-2 mb-3">{question.body}</p>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category */}
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `${categoryInfo.color}20`,
                color: categoryInfo.color,
              }}
            >
              {categoryInfo.icon} {categoryInfo.label}
            </span>

            {/* Tags */}
            {question.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {question.tags.length > 3 && (
              <span className="text-xs text-slate-500">+{question.tags.length - 3}</span>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 ml-auto text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {question.views}
              </span>
              <span>asked by {question.authorName}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(question.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Question Detail View
function QuestionDetail({
  questionId,
  userId,
  onBack,
}: {
  questionId: string;
  userId?: string;
  onBack: () => void;
}) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQuestion = async () => {
    setIsLoading(true);
    const result = await getQuestion(questionId);
    if (!result.error && result.question) {
      setQuestion(result.question);
      setAnswers(result.answers);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const handleVote = async (
    targetId: string,
    targetType: 'question' | 'answer',
    voteType: 'up' | 'down'
  ) => {
    if (!userId) return;
    await vote(userId, targetId, targetType, voteType);
    loadQuestion();
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!userId || !question) return;
    await acceptAnswer(userId, question.id, answerId);
    loadQuestion();
  };

  const handleSubmitAnswer = async () => {
    if (!userId || !newAnswer.trim()) return;
    setIsSubmitting(true);
    const result = await createAnswer(userId, questionId, newAnswer);
    if (!result.error) {
      setNewAnswer('');
      loadQuestion();
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Question not found</p>
        <button onClick={onBack} className="mt-4 text-blue-400 hover:text-blue-300">
          Go back
        </button>
      </div>
    );
  }

  const categoryInfo = CATEGORY_INFO[question.category];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        ← Back to questions
      </button>

      {/* Question */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex gap-4">
            {/* Voting */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleVote(question.id, 'question', 'up')}
                className={`p-2 rounded-lg transition-colors ${
                  question.userVote === 'up'
                    ? 'text-green-400 bg-green-500/20'
                    : 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
                }`}
                disabled={!userId}
              >
                <ChevronUp className="h-6 w-6" />
              </button>
              <span className="text-xl font-bold text-white">
                {question.upvotes - question.downvotes}
              </span>
              <button
                onClick={() => handleVote(question.id, 'question', 'down')}
                className={`p-2 rounded-lg transition-colors ${
                  question.userVote === 'down'
                    ? 'text-red-400 bg-red-500/20'
                    : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                }`}
                disabled={!userId}
              >
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{question.title}</h1>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="px-2 py-0.5 rounded text-sm"
                  style={{
                    backgroundColor: `${categoryInfo.color}20`,
                    color: categoryInfo.color,
                  }}
                >
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 whitespace-pre-wrap">{question.body}</p>
              </div>

              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-700 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {question.views} views
                </span>
                <span>asked by {question.authorName}</span>
                <span>{formatTimeAgo(question.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        {answers.map((answer) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            isQuestionAuthor={userId === question.userId}
            onVote={(type) => handleVote(answer.id, 'answer', type)}
            onAccept={() => handleAcceptAnswer(answer.id)}
            userId={userId}
          />
        ))}
      </div>

      {/* Add Answer */}
      {userId && !question.isClosed && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Answer</h3>
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Write your answer here..."
            rows={6}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 resize-none"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSubmitAnswer}
              disabled={!newAnswer.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Answer Card
function AnswerCard({
  answer,
  isQuestionAuthor,
  onVote,
  onAccept,
  userId,
}: {
  answer: Answer;
  isQuestionAuthor: boolean;
  onVote: (type: 'up' | 'down') => void;
  onAccept: () => void;
  userId?: string;
}) {
  return (
    <div
      className={`bg-slate-900 border rounded-xl p-6 ${
        answer.isAccepted ? 'border-green-500/50' : 'border-slate-700'
      }`}
    >
      <div className="flex gap-4">
        {/* Voting */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onVote('up')}
            className={`p-2 rounded-lg transition-colors ${
              answer.userVote === 'up'
                ? 'text-green-400 bg-green-500/20'
                : 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
            }`}
            disabled={!userId}
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold text-white">
            {answer.upvotes - answer.downvotes}
          </span>
          <button
            onClick={() => onVote('down')}
            className={`p-2 rounded-lg transition-colors ${
              answer.userVote === 'down'
                ? 'text-red-400 bg-red-500/20'
                : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
            }`}
            disabled={!userId}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          {answer.isAccepted && (
            <div className="mt-2 p-2 bg-green-500/20 rounded-lg">
              <Check className="h-5 w-5 text-green-400" />
            </div>
          )}
          {isQuestionAuthor && !answer.isAccepted && (
            <button
              onClick={onAccept}
              className="mt-2 p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
              title="Accept this answer"
            >
              <Check className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-slate-300 whitespace-pre-wrap">{answer.body}</p>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700 text-sm text-slate-500">
            <span>answered by {answer.authorName}</span>
            <span>{formatTimeAgo(answer.createdAt)}</span>
          </div>

          {/* Comments */}
          {answer.comments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
              {answer.comments.map((comment) => (
                <div key={comment.id} className="text-sm">
                  <span className="text-slate-400">{comment.body}</span>
                  <span className="text-slate-600 ml-2">
                    – {comment.authorName}, {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ask Question Modal
function AskQuestionModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<QuestionCategory>('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;

    setIsSubmitting(true);
    const result = await createQuestion(userId, {
      title: title.trim(),
      body: body.trim(),
      category,
      tags,
    });

    if (!result.error) {
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Ask a Question</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question?"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key as QuestionCategory)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    category === key
                      ? 'text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: category === key ? info.color : undefined,
                  }}
                >
                  {info.icon} {info.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Details
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Provide more context about your question..."
              rows={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags (up to 5)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm"
                >
                  {tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm"
              />
              <button
                onClick={handleAddTag}
                disabled={tags.length >= 5}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {POPULAR_TAGS.filter((t) => !tags.includes(t))
                .slice(0, 8)
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => tags.length < 5 && setTags([...tags, tag])}
                    className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded text-xs hover:text-white"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
