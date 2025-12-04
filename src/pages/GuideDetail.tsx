import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock, Share2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getGuide } from '../data/guides';
import { Newsletter } from '../components/Newsletter';

export function GuideDetail() {
  const { guideId } = useParams<{ guideId: string }>();

  if (!guideId) {
    return <Navigate to="/learn" replace />;
  }

  const guide = getGuide(guideId);

  if (!guide) {
    return <Navigate to="/learn" replace />;
  }

  const handleShare = async () => {
    const url = window.location.href;
    const title = guide.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
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
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-brand-dark border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learning Center
          </Link>

          {/* Category Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-orange-500/20 text-orange-500 text-sm font-medium rounded-full">
              {guide.category}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              {guide.readTime} min read
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {guide.title}
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-400 mb-6">
            {guide.description}
          </p>

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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
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
            {guide.content}
          </ReactMarkdown>
        </article>

        {/* Newsletter CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20">
          <div className="text-center mb-6">
            <BookOpen className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Want More Crypto Insights?
            </h3>
            <p className="text-gray-400">
              Get weekly guides, market analysis, and investment tips delivered to your inbox.
            </p>
          </div>
          <Newsletter source={`guide-${guide.id}`} variant="inline" />
        </div>

        {/* Related Guides */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-white mb-6">Continue Learning</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/learn"
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors text-center"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className="font-semibold text-white mb-2">All Guides</h4>
              <p className="text-sm text-gray-400">Browse all learning resources</p>
            </Link>

            <Link
              to="/calculators"
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors text-center"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-2">Calculators</h4>
              <p className="text-sm text-gray-400">Plan your investment strategy</p>
            </Link>

            <Link
              to="/compare"
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors text-center"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-2">Compare</h4>
              <p className="text-sm text-gray-400">Find the best platforms</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
