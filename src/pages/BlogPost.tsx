/**
 * BlogPost Page
 * Individual blog post view with SEO and related posts
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Eye,
  ArrowLeft,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
  Tag,
  ChevronRight,
  User,
  Sparkles,
} from 'lucide-react';
import { getBlogPostBySlug, getRelatedPosts } from '../services/blog';
import { BlogPostCard } from '../components/blog';
import type { BlogPost as BlogPostType } from '../types/blog';

export function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        setError('Post not found');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const result = await getBlogPostBySlug(slug);

      if (result.error || !result.data) {
        setError(result.error || 'Post not found');
        setLoading(false);
        return;
      }

      setPost(result.data);

      // Load related posts
      const relatedResult = await getRelatedPosts(
        result.data.id,
        result.data.category,
        result.data.tags,
        3
      );
      setRelatedPosts(relatedResult.data);

      setLoading(false);
    };

    loadPost();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || 'Blog Post';

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-800 rounded w-3/4" />
            <div className="h-4 bg-slate-800 rounded w-1/4" />
            <div className="aspect-video bg-slate-800 rounded-xl" />
            <div className="space-y-4">
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-slate-400 mb-6">{error || 'The post you are looking for does not exist.'}</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  // Generate table of contents from headings
  const headings = post.content.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const toc = headings.map((h, i) => ({
    id: `heading-${i}`,
    text: h.replace(/<[^>]*>/g, ''),
  }));

  // Update document title and meta tags
  useEffect(() => {
    if (post) {
      document.title = `${post.seo_title || post.title} | Bitcoinvestments Blog`;

      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.seo_description || post.excerpt);
      }
    }

    return () => {
      document.title = 'Bitcoinvestments';
    };
  }, [post]);

  return (
    <>

      <article className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Header */}
          <motion.header
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Category & Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Link
                to={`/blog/category/${post.category.toLowerCase()}`}
                className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-medium rounded-full hover:bg-orange-500/30 transition-colors"
              >
                {post.category}
              </Link>
              {post.ai_generated && (
                <span className="flex items-center gap-1 px-3 py-1 bg-violet-500/20 text-violet-400 text-sm font-medium rounded-full">
                  <Sparkles className="w-3 h-3" />
                  AI Generated
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author?.email || 'Bitcoinvestments'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.published_at || ''}>{formattedDate}</time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.read_time_minutes} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{post.view_count.toLocaleString()} views</span>
              </div>
            </div>

            {/* Share */}
            <div className="relative flex items-center gap-3">
              <span className="text-sm text-slate-500">Share:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <button
                onClick={handleCopyLink}
                className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <LinkIcon className="w-4 h-4" />}
              </button>
            </div>
          </motion.header>

          {/* Featured Image */}
          {post.featured_image && (
            <motion.div
              className="mb-8 rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full aspect-video object-cover"
              />
            </motion.div>
          )}

          {/* Table of Contents */}
          {toc.length > 2 && (
            <motion.nav
              className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-sm font-semibold text-white mb-3">Table of Contents</h2>
              <ul className="space-y-2">
                {toc.map((heading, i) => (
                  <li key={i}>
                    <a
                      href={`#${heading.id}`}
                      className="flex items-center gap-2 text-sm text-slate-400 hover:text-orange-400 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3" />
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}

          {/* Content */}
          <motion.div
            className="prose prose-lg prose-invert max-w-none
              prose-headings:text-white prose-headings:font-bold prose-headings:scroll-mt-24
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-code:text-orange-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10
              prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-slate-800/30 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-slate-300
              prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-300
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-slate-300
              prose-li:mb-2
              prose-img:rounded-xl prose-img:mx-auto
              prose-hr:border-white/10
            "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            dangerouslySetInnerHTML={{
              __html: post.content.replace(
                /<h2([^>]*)>/g,
                (_, attrs, i) => `<h2${attrs} id="heading-${i}">`
              ),
            }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <motion.div
              className="mt-12 pt-8 border-t border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-slate-500" />
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-slate-800 text-sm text-slate-300 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Author Bio */}
          <motion.div
            className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {(post.author?.email || 'B').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {post.author?.email || 'Bitcoinvestments Team'}
                </h3>
                <p className="text-sm text-slate-400">
                  Passionate about cryptocurrency education and helping investors make informed decisions.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <motion.section
              className="mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <BlogPostCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </article>
    </>
  );
}

export default BlogPost;
