import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Target, CheckCircle, Share2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getCourse, getCourseModule } from '../data/courses';
import { Newsletter } from '../components/Newsletter';

export function CourseModule() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();

  if (!courseId || !moduleId) {
    return <Navigate to="/learn" replace />;
  }

  const course = getCourse(courseId);
  const module = getCourseModule(courseId, moduleId);

  if (!course || !module) {
    return <Navigate to={`/course/${courseId}`} replace />;
  }

  // Find previous and next modules
  const currentIndex = course.modules.findIndex(m => m.id === moduleId);
  const prevModule = currentIndex > 0 ? course.modules[currentIndex - 1] : null;
  const nextModule = currentIndex < course.modules.length - 1 ? course.modules[currentIndex + 1] : null;
  const isLastModule = currentIndex === course.modules.length - 1;

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${course.title} - ${module.title}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / course.modules.length) * 100}%` }}
        />
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-brand-dark border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link to="/learn" className="hover:text-orange-500 transition-colors">
              Learning Center
            </Link>
            <span>/</span>
            <Link to={`/course/${courseId}`} className="hover:text-orange-500 transition-colors">
              {course.title}
            </Link>
            <span>/</span>
            <span className="text-gray-300">Module {module.moduleNumber}</span>
          </div>

          {/* Module Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center">
              <span className="text-orange-500 font-bold text-xl">{module.moduleNumber}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm text-orange-500 font-medium">
                  Module {module.moduleNumber} of {course.modules.length}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {module.duration} min read
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {module.title}
              </h1>
            </div>
          </div>

          <p className="text-lg text-gray-400 mb-6">{module.description}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            Learning Objectives
          </h2>
          <div className="grid gap-3">
            {module.objectives.map((objective, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{objective}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Module Content */}
        <article className="prose prose-invert prose-orange max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-white mb-6 mt-8">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold text-white mb-4 mt-8 border-b border-gray-800 pb-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-lg font-semibold text-gray-200 mb-2 mt-4">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-orange-500 hover:text-orange-400 underline"
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-300">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-orange-500 pl-4 my-4 italic text-gray-400">
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="px-1.5 py-0.5 bg-gray-800 text-orange-400 rounded text-sm font-mono">
                    {children}
                  </code>
                ) : (
                  <code className="block bg-gray-800 text-gray-300 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                    {children}
                  </code>
                );
              },
              table: ({ children }) => (
                <div className="overflow-x-auto my-6">
                  <table className="w-full border-collapse border border-gray-700">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-800">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border border-gray-700 px-4 py-2 text-left text-white font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-700 px-4 py-2 text-gray-300">
                  {children}
                </td>
              ),
              hr: () => (
                <hr className="border-t border-gray-800 my-8" />
              ),
              strong: ({ children }) => (
                <strong className="text-white font-semibold">{children}</strong>
              ),
            }}
          >
            {module.content}
          </ReactMarkdown>
        </article>

        {/* Module Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {prevModule ? (
              <Link
                to={`/course/${courseId}/${prevModule.id}`}
                className="flex items-center gap-3 bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500/50 transition-colors group flex-1"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-orange-500 transition-colors" />
                <div>
                  <span className="text-xs text-gray-500 block">Previous Module</span>
                  <span className="text-white group-hover:text-orange-500 transition-colors font-medium">
                    {prevModule.title}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextModule ? (
              <Link
                to={`/course/${courseId}/${nextModule.id}`}
                className="flex items-center justify-end gap-3 bg-orange-500 hover:bg-orange-600 rounded-xl p-4 transition-colors group flex-1 text-right"
              >
                <div>
                  <span className="text-xs text-orange-200 block">Next Module</span>
                  <span className="text-white font-medium">
                    {nextModule.title}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-white" />
              </Link>
            ) : (
              <Link
                to={`/course/${courseId}`}
                className="flex items-center justify-end gap-3 bg-green-500 hover:bg-green-600 rounded-xl p-4 transition-colors group flex-1 text-right"
              >
                <div>
                  <span className="text-xs text-green-200 block">Course Complete!</span>
                  <span className="text-white font-medium">
                    Back to Course Overview
                  </span>
                </div>
                <CheckCircle className="w-5 h-5 text-white" />
              </Link>
            )}
          </div>
        </div>

        {/* Course Progress */}
        <div className="mt-8 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Course Progress</h3>
          <div className="space-y-3">
            {course.modules.map((m, index) => (
              <Link
                key={m.id}
                to={`/course/${courseId}/${m.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  m.id === moduleId
                    ? 'bg-orange-500/20 border border-orange-500/50'
                    : 'hover:bg-gray-700/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  index < currentIndex
                    ? 'bg-green-500/20 text-green-500'
                    : m.id === moduleId
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {index < currentIndex ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{m.moduleNumber}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`block truncate ${
                    m.id === moduleId ? 'text-white font-medium' : 'text-gray-400'
                  }`}>
                    {m.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{m.duration} min</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter CTA */}
        {isLastModule && (
          <div className="mt-12 p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
            <div className="text-center mb-6">
              <BookOpen className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Congratulations on Completing the Course!
              </h3>
              <p className="text-gray-400">
                Subscribe to get notified about new courses and advanced content.
              </p>
            </div>
            <Newsletter source={`course-complete-${course.id}`} variant="inline" />
          </div>
        )}
      </div>
    </div>
  );
}
