/**
 * AdminBlogList Page
 * Admin page for managing blog posts
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Eye,
  Archive,
  Check,
  Sparkles,
  RefreshCw,
  FileText,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { getAdminBlogPosts, getBlogStats, bulkUpdateStatus, deleteBlogPost } from '../../services/blog';
import type { BlogPost, BlogFilters, BlogStats } from '../../types/blog';

type TabFilter = 'all' | 'draft' | 'published' | 'archived' | 'ai';

export function AdminBlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);

    const filters: BlogFilters = {
      page,
      limit: 20,
      search: searchQuery || undefined,
    };

    if (activeTab === 'ai') {
      filters.ai_generated = true;
    } else if (activeTab !== 'all') {
      filters.status = activeTab;
    }

    const [postsResult, statsResult] = await Promise.all([
      getAdminBlogPosts(filters),
      getBlogStats(),
    ]);

    if (postsResult.data) {
      setPosts(postsResult.data.posts);
      setTotalPages(postsResult.data.totalPages);
    }

    if (statsResult.data) {
      setStats(statsResult.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab, page, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map((p) => p.id));
    }
  };

  const handleSelectPost = (id: string) => {
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'publish' | 'archive' | 'draft') => {
    if (selectedPosts.length === 0) return;

    setIsProcessing(true);
    const status = action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'draft';
    const result = await bulkUpdateStatus(selectedPosts, status);

    if (result.success) {
      setSelectedPosts([]);
      await loadData();
    }
    setIsProcessing(false);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to archive this post?')) return;

    setIsProcessing(true);
    const result = await deleteBlogPost(id);

    if (result.success) {
      await loadData();
    }
    setIsProcessing(false);
    setShowActionsMenu(null);
  };

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All Posts', count: stats?.totalPosts || 0 },
    { id: 'published', label: 'Published', count: stats?.publishedPosts || 0 },
    { id: 'draft', label: 'Drafts', count: stats?.draftPosts || 0 },
    { id: 'ai', label: 'AI Generated', count: stats?.aiGeneratedPosts || 0 },
    { id: 'archived', label: 'Archived', count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog</h1>
          <p className="text-slate-400 text-sm">Manage your blog posts and content</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/blog/categories"
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Categories
          </Link>
          <Link
            to="/admin/blog/new"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalPosts}</p>
                <p className="text-sm text-slate-400">Total Posts</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.publishedPosts}</p>
                <p className="text-sm text-slate-400">Published</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Total Views</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.postsThisMonth}</p>
                <p className="text-sm text-slate-400">This Month</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="bg-slate-800/50 rounded-xl border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${activeTab === tab.id
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {tab.label}
                <span className="ml-1 text-xs opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 w-64"
              />
            </div>
          </form>
        </div>

        {/* Bulk Actions */}
        {selectedPosts.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-orange-500/10 border-b border-white/10">
            <span className="text-sm text-orange-400">
              {selectedPosts.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('publish')}
              disabled={isProcessing}
              className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkAction('draft')}
              disabled={isProcessing}
              className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
            >
              Unpublish
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              disabled={isProcessing}
              className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              Archive
            </button>
            <button
              onClick={() => setSelectedPosts([])}
              className="px-3 py-1 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === posts.length && posts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-600"
                  />
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Views</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading posts...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No posts found
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => handleSelectPost(post.id)}
                        className="rounded border-slate-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <Link
                            to={`/admin/blog/edit/${post.id}`}
                            className="font-medium text-white hover:text-orange-400 transition-colors"
                          >
                            {post.title}
                          </Link>
                          {post.ai_generated && (
                            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded">
                              <Sparkles className="w-3 h-3" />
                              AI
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                        {post.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`
                          px-2 py-0.5 text-xs rounded
                          ${post.status === 'published' ? 'bg-green-500/20 text-green-400' : ''}
                          ${post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                          ${post.status === 'archived' ? 'bg-slate-500/20 text-slate-400' : ''}
                        `}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {post.view_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowActionsMenu(showActionsMenu === post.id ? null : post.id)
                          }
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {showActionsMenu === post.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-10">
                            <Link
                              to={`/admin/blog/edit/${post.id}`}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Link>
                            {post.status === 'published' && (
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </a>
                            )}
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                            >
                              <Archive className="w-4 h-4" />
                              Archive
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBlogList;
