import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Target,
  TrendingUp,
  Wallet,
  BookOpen,
  Clock,
  CheckCircle,
  ArrowRight,
  PieChart,
  Shield,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  QUIZ_QUESTIONS,
  calculateQuizResults,
  getProfileColor,
  type QuizAnswers,
  type QuizResult,
} from '../services/riskAssessment';

interface RiskAssessmentQuizProps {
  onComplete?: (result: QuizResult) => void;
  onSkip?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  experience: <Clock className="h-5 w-5" />,
  goals: <Target className="h-5 w-5" />,
  risk_tolerance: <TrendingUp className="h-5 w-5" />,
  financial: <Wallet className="h-5 w-5" />,
  knowledge: <BookOpen className="h-5 w-5" />,
};

export function RiskAssessmentQuiz({ onComplete, onSkip }: RiskAssessmentQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState(false);

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestion === QUIZ_QUESTIONS.length - 1;
  const canGoNext = answers[question?.id] !== undefined;

  const results = useMemo(() => {
    if (!showResults) return null;
    return calculateQuizResults(answers);
  }, [showResults, answers]);

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
      const result = calculateQuizResults(answers);
      onComplete?.(result);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
  };

  if (showResults && results) {
    return <ResultsView result={results} onRestart={handleRestart} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Risk Assessment Quiz</h2>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
        <p className="text-slate-400">
          Answer these questions to discover your investment risk profile and get personalized recommendations.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
        {/* Category Badge */}
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
          {CATEGORY_ICONS[question.category]}
          <span className="capitalize">{question.category.replace('_', ' ')}</span>
        </div>

        {/* Question */}
        <h3 className="text-xl font-semibold text-white mb-6">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = answers[question.id] === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-orange-500/20 border-orange-500 text-white'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span>{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLastQuestion ? 'See Results' : 'Next'}
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// Results View Component
function ResultsView({ result, onRestart }: { result: QuizResult; onRestart: () => void }) {
  const profileColor = getProfileColor(result.profile.type);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile Header */}
      <div
        className="rounded-xl p-8 mb-8 text-center"
        style={{ backgroundColor: `${profileColor}20`, borderColor: profileColor, borderWidth: 1 }}
      >
        <div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${profileColor}30` }}
        >
          <PieChart className="h-10 w-10" style={{ color: profileColor }} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{result.profile.title}</h2>
        <p className="text-slate-300 max-w-xl mx-auto">{result.profile.description}</p>

        {/* Score */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color: profileColor }}>
              {result.percentage}%
            </div>
            <div className="text-sm text-slate-400">Risk Score</div>
          </div>
        </div>
      </div>

      {/* Traits */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          Your Investment Traits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.profile.traits.map((trait, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-slate-300 bg-slate-800/50 rounded-lg p-3"
            >
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span>{trait}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Allocation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-400" />
          Suggested Portfolio Allocation
        </h3>
        <div className="space-y-3">
          {Object.entries(result.profile.suggestedAllocation).map(([asset, percentage]) => {
            if (percentage === 0) return null;
            const colors: Record<string, string> = {
              bitcoin: '#f7931a',
              ethereum: '#627eea',
              stablecoins: '#26a17b',
              altcoins: '#8b5cf6',
              cash: '#6b7280',
            };
            const labels: Record<string, string> = {
              bitcoin: 'Bitcoin (BTC)',
              ethereum: 'Ethereum (ETH)',
              stablecoins: 'Stablecoins (USDC/USDT)',
              altcoins: 'Altcoins',
              cash: 'Cash/Fiat',
            };
            return (
              <div key={asset}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{labels[asset]}</span>
                  <span className="text-white font-medium">{percentage}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percentage}%`, backgroundColor: colors[asset] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-4">
          * This is a suggested allocation based on your risk profile. Always do your own research and consider consulting a financial advisor.
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-400" />
          Score Breakdown
        </h3>
        <div className="space-y-4">
          {result.categoryBreakdown.map((cat) => (
            <div key={cat.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300 flex items-center gap-2">
                  {CATEGORY_ICONS[cat.category]}
                  {cat.label}
                </span>
                <span className="text-white font-medium">{Math.round(cat.percentage)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-400" />
          Personalized Recommendations
        </h3>
        <div className="space-y-4">
          {result.recommendations.map((rec, index) => {
            const priorityColors = {
              high: 'border-red-500/50 bg-red-500/10',
              medium: 'border-orange-500/50 bg-orange-500/10',
              low: 'border-blue-500/50 bg-blue-500/10',
            };
            const priorityIcons = {
              high: <AlertTriangle className="h-4 w-4 text-red-400" />,
              medium: <Info className="h-4 w-4 text-orange-400" />,
              low: <CheckCircle className="h-4 w-4 text-blue-400" />,
            };
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${priorityColors[rec.priority]}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{priorityIcons[rec.priority]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 uppercase">{rec.category}</span>
                    </div>
                    <h4 className="text-white font-medium mb-1">{rec.title}</h4>
                    <p className="text-slate-400 text-sm">{rec.description}</p>
                    {rec.link && (
                      <a
                        href={rec.link}
                        className="inline-flex items-center gap-1 text-orange-400 text-sm mt-2 hover:text-orange-300 transition-colors"
                      >
                        Learn more <ArrowRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Retake Quiz
        </button>
        <a
          href="/dashboard"
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
