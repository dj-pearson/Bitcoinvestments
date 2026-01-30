/**
 * Blog Page
 * Public blog listing with categories and search
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Search, Tag, ChevronLeft, ChevronRight, Rss, Mail } from 'lucide-react';
import { getPublicBlogPosts, getCategories, getFeaturedPost } from '../services/blog';
import { BlogPostCard } from '../components/blog';
import type { BlogPost, BlogCategory } from '../types/blog';
import { motion } from 'framer-motion';

export function Blog() {
  const { category: categoryParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tagParam = searchParams.get('tag');
  const searchParam = searchParams.get('q');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParam || '');
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const [postsResult, categoriesResult, featuredResult] = await Promise.all([
        getPublicBlogPosts({
          category: categoryParam,
          tag: tagParam || undefined,
          search: searchParam || undefined,
          page: pageParam,
          limit: 12,
        }),
        getCategories(),
        !categoryParam && !tagParam && !searchParam && pageParam === 1
          ? getFeaturedPost()
          : Promise.resolve({ data: null }),
      ]);

      if (postsResult.data) {
        setPosts(postsResult.data.posts);
        setTotalPages(postsResult.data.totalPages);

        // Extract unique tags
        const tags = new Set<string>();
        postsResult.data.posts.forEach((post) => {
          post.tags?.forEach((tag) => tags.add(tag));
        });
        setAllTags(Array.from(tags).slice(0, 20));
      }

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (featuredResult.data) {
        setFeaturedPost(featuredResult.data);
      }

      setLoading(false);
    };

    loadData();
  }, [categoryParam, tagParam, searchParam, pageParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentCategory = categoryParam
    ? categories.find((c) => c.slug === categoryParam)
    : null;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {currentCategory ? currentCategory.name : 'Blog'}
          </motion.h1>
          <motion.p
            className="text-lg text-slate-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {currentCategory
              ? currentCategory.description
              : 'Stay informed with the latest cryptocurrency news, guides, and insights.'}
          </motion.p>

          {tagParam && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Tag className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-medium">
                Posts tagged "{tagParam}"
              </span>
              <Link
                to="/blog"
                className="text-sm text-slate-500 hover:text-white ml-2"
              >
                Clear
              </Link>
            </div>
          )}

          {searchParam && (
            <div className="mt-4 text-slate-400">
              Search results for "{searchParam}"
              <Link
                to="/blog"
                className="text-sm text-orange-400 hover:text-orange-300 ml-2"
              >
                Clear
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            {featuredPost && !categoryParam && !tagParam && !searchParam && pageParam === 1 && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <BlogPostCard post={featuredPost} variant="featured" />
              </motion.div>
            )}

            {/* Posts Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-video bg-slate-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-700 rounded w-1/4" />
                      <div className="h-5 bg-slate-700 rounded w-3/4" />
                      <div className="h-4 bg-slate-700 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No posts found.</p>
                <Link
                  to="/blog"
                  className="text-orange-400 hover:text-orange-300 mt-2 inline-block"
                >
                  View all posts
                </Link>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {posts
                  .filter((p) => !featuredPost || p.id !== featuredPost.id)
                  .map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <BlogPostCard post={post} />
                    </motion.div>
                  ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(pageParam - 1)}
                  disabled={pageParam === 1}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`
                        w-10 h-10 rounded-lg transition-colors
                        ${pageParam === i + 1
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                        }
                      `}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(pageParam + 1)}
                  disabled={pageParam === totalPages}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Search</h3>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </form>
            </div>

            {/* Categories */}
            <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Categories</h3>
              <div className="space-y-1">
                <Link
                  to="/blog"
                  className={`
                    block px-3 py-2 rounded-lg text-sm transition-colors
                    ${!categoryParam
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  All Posts
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/blog/category/${cat.slug}`}
                    className={`
                      block px-3 py-2 rounded-lg text-sm transition-colors
                      ${categoryParam === cat.slug
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?tag=${encodeURIComponent(tag)}`}
                      className={`
                        px-2 py-1 text-xs rounded transition-colors
                        ${tagParam === tag
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }
                      `}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter CTA */}
            <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-xl border border-orange-500/20 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-orange-400" />
                <h3 className="font-semibold text-white">Newsletter</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Get the latest crypto insights delivered to your inbox weekly.
              </p>
              <Link
                to="/"
                className="block w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-center text-sm rounded-lg transition-colors"
              >
                Subscribe Now
              </Link>
            </div>

            {/* RSS Feed */}
            <a
              href="/blog/rss.xml"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <Rss className="w-4 h-4" />
              RSS Feed
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Blog;
