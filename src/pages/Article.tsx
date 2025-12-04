import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, Calendar, Share2, Twitter, Facebook, Linkedin } from 'lucide-react';
import { getArticleBySlug } from '../services/database';
import { Newsletter } from '../components/Newsletter';
import type { Article as ArticleType } from '../types/database';

export function Article() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      if (slug) {
        const data = await getArticleBySlug(slug);
        setArticle(data);
      }
      setLoading(false);
    }
    loadArticle();
  }, [slug]);

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    const url = window.location.href;
    const title = article?.title || '';

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
    setShowShareMenu(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold text-white mb-4">Article Not Found</h1>
          <p className="text-gray-400 mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learning Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        to="/learn"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Learning Center
      </Link>

      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-orange-500 uppercase tracking-wide">
            {article.category}
          </span>
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {article.published_at
                ? new Date(article.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Draft'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{article.read_time_minutes} min read</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{article.view_count.toLocaleString()} views</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {article.featured_image && (
        <div className="mb-8">
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-auto rounded-xl"
          />
        </div>
      )}

      {/* Excerpt */}
      <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border-l-4 border-orange-500">
        <p className="text-lg text-gray-300 leading-relaxed">{article.excerpt}</p>
      </div>

      {/* Article Content */}
      <div
        className="prose prose-lg prose-invert max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Share Section */}
      <div className="border-t border-gray-700 pt-8 mb-12">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Share this article</h3>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            {showShareMenu && (
              <div className="absolute right-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 shadow-lg z-10">
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors border-t border-gray-700"
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="mb-12">
        <Newsletter source={`article-${article.slug}`} variant="card" />
      </div>

      {/* Related Content */}
      <div className="border-t border-gray-700 pt-8">
        <h3 className="text-xl font-bold text-white mb-6">Continue Learning</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            to="/learn"
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors"
          >
            <h4 className="font-semibold text-white mb-2">Explore More Guides</h4>
            <p className="text-gray-400 text-sm">
              Browse our complete library of beginner-friendly crypto guides.
            </p>
          </Link>
          <Link
            to="/glossary"
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors"
          >
            <h4 className="font-semibold text-white mb-2">Crypto Glossary</h4>
            <p className="text-gray-400 text-sm">
              Learn the essential terms and concepts in cryptocurrency.
            </p>
          </Link>
        </div>
      </div>
    </article>
  );
}
