/**
 * BlogPostCard Component
 * Card component for displaying blog post previews
 */

import { Link } from 'react-router-dom';
import { Clock, Eye, Sparkles, Calendar } from 'lucide-react';
import type { BlogPost } from '../../types/blog';

interface BlogPostCardProps {
  post: BlogPost;
  variant?: 'default' | 'featured' | 'compact';
  showStatus?: boolean;
}

export function BlogPostCard({ post, variant = 'default', showStatus = false }: BlogPostCardProps) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date(post.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  if (variant === 'featured') {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className="group block relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/10 hover:border-orange-500/30 transition-all"
      >
        {/* Image */}
        <div className="aspect-[21/9] relative">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-amber-500/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded">
              {post.category}
            </span>
            {post.ai_generated && (
              <span className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-medium rounded">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
            {post.title}
          </h2>

          <p className="text-slate-400 text-sm md:text-base line-clamp-2 mb-4">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.read_time_minutes} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.view_count.toLocaleString()}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className="group flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
      >
        {/* Thumbnail */}
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-amber-500/10" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white group-hover:text-orange-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>{formattedDate}</span>
            <span>{post.read_time_minutes} min</span>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      to={showStatus ? `/admin/blog/edit/${post.id}` : `/blog/${post.slug}`}
      className="group block bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden hover:border-orange-500/30 transition-all"
    >
      {/* Image */}
      <div className="aspect-video relative">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center">
            <span className="text-4xl text-orange-500/30">B</span>
          </div>
        )}

        {/* Status badge */}
        {showStatus && (
          <div className="absolute top-3 right-3">
            <span
              className={`
                px-2 py-1 text-xs font-medium rounded
                ${post.status === 'published' ? 'bg-green-500/20 text-green-400' : ''}
                ${post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                ${post.status === 'archived' ? 'bg-slate-500/20 text-slate-400' : ''}
              `}
            >
              {post.status}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs font-medium rounded">
            {post.category}
          </span>
          {post.ai_generated && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/10 text-violet-400 text-xs font-medium rounded">
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-2 mb-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.read_time_minutes} min
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {post.view_count.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default BlogPostCard;
