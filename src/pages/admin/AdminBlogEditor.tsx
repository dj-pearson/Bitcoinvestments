/**
 * AdminBlogEditor Page
 * Create and edit blog posts with TipTap editor and AI assistance
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Eye,
  Send,
  ArrowLeft,
  RefreshCw,
  History,
  X,
  Image as ImageIcon,
  Tag,
  FolderOpen,
} from 'lucide-react';
import { BlogEditor, BlogSEOPanel, BlogAIPanel, BlogPreview } from '../../components/blog';
import {
  createBlogPost,
  updateBlogPost,
  getBlogPostById,
  unpublishBlogPost,
  getCategories,
  createRevision,
  getRevisions,
  restoreRevision,
  generateSlug,
  isSlugUnique,
} from '../../services/blog';
import type { BlogCategory, BlogRevision, GeneratedBlogContent } from '../../types/blog';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export function AdminBlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditing = Boolean(id);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [contentJson, setContentJson] = useState<object | null>(null);
  const [featuredImage, setFeaturedImage] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState<string[]>([]);
  const [ogImage, setOgImage] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiSourceUrls, setAiSourceUrls] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<BlogRevision[]>([]);
  const [newTag, setNewTag] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAIPanel] = useState(true);

  // Load post data if editing
  useEffect(() => {
    const loadData = async () => {
      const [categoriesResult] = await Promise.all([getCategories()]);
      setCategories(categoriesResult.data);

      if (id) {
        const result = await getBlogPostById(id);
        if (result.data) {
          const post = result.data;
          setTitle(post.title);
          setSlug(post.slug);
          setExcerpt(post.excerpt);
          setContent(post.content);
          setContentJson(post.content_json);
          setFeaturedImage(post.featured_image || '');
          setCategory(post.category);
          setTags(post.tags || []);
          setSeoTitle(post.seo_title || '');
          setSeoDescription(post.seo_description || '');
          setMetaKeywords(post.meta_keywords || []);
          setOgImage(post.og_image || '');
          setStatus(post.status);
          setAiGenerated(post.ai_generated);
          setAiSourceUrls(post.ai_source_urls || []);

          // Load revisions
          const revisionsResult = await getRevisions(id);
          setRevisions(revisionsResult.data);
        }
        setLoading(false);
      } else {
        // Set default category
        if (categoriesResult.data.length > 0) {
          setCategory(categoriesResult.data[0].name);
        }
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title && !slug) {
      setSlug(generateSlug(title));
    }
  }, [title, isEditing, slug]);

  // Track unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleContentChange = useCallback((html: string, json: object) => {
    setContent(html);
    setContentJson(json);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async (publish = false) => {
    if (!title.trim()) {
      toastError('Please enter a title');
      return;
    }
    if (!content.trim()) {
      toastError('Please add some content');
      return;
    }
    if (!category) {
      toastError('Please select a category');
      return;
    }

    setSaving(true);

    try {
      // Check slug uniqueness
      const slugToUse = slug || generateSlug(title);
      const isUnique = await isSlugUnique(slugToUse, id);
      if (!isUnique) {
        toastError('This slug is already in use. Please choose a different one.');
        setSaving(false);
        return;
      }

      const postData = {
        title: title.trim(),
        slug: slugToUse,
        excerpt: excerpt.trim() || content.replace(/<[^>]*>/g, '').substring(0, 200),
        content,
        content_json: contentJson,
        featured_image: featuredImage || null,
        og_image: ogImage || null,
        category,
        tags,
        meta_keywords: metaKeywords,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        status: publish ? 'published' : status,
        ai_generated: aiGenerated,
        ai_source_urls: aiSourceUrls.length > 0 ? aiSourceUrls : null,
      };

      let result;
      if (isEditing && id) {
        // Create revision before saving
        await createRevision(id, title, content, contentJson, user?.id || '');

        result = await updateBlogPost(id, postData, user?.id || '');
      } else {
        result = await createBlogPost(postData as any, user?.id || '');
      }

      if (result.error) {
        toastError(result.error);
      } else {
        setHasUnsavedChanges(false);
        toastSuccess(publish ? 'Post published!' : 'Post saved!');

        if (!isEditing && result.data) {
          navigate(`/admin/blog/edit/${result.data.id}`, { replace: true });
        }
      }
    } catch (err) {
      toastError('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => handleSave(true);

  const handleUnpublish = async () => {
    if (!id) return;

    setSaving(true);
    const result = await unpublishBlogPost(id, user?.id || '');
    if (result.error) {
      toastError(result.error);
    } else {
      setStatus('draft');
      toastSuccess('Post unpublished');
    }
    setSaving(false);
  };

  const handleRestoreRevision = async (revisionId: string) => {
    if (!id) return;

    const result = await restoreRevision(id, revisionId, user?.id || '');
    if (result.error) {
      toastError(result.error);
    } else {
      toastSuccess('Revision restored!');
      setShowRevisions(false);
      // Reload post data
      const postResult = await getBlogPostById(id);
      if (postResult.data) {
        setTitle(postResult.data.title);
        setContent(postResult.data.content);
        setContentJson(postResult.data.content_json);
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    setHasUnsavedChanges(true);
  };

  const handleInsertAIContent = (generated: GeneratedBlogContent) => {
    setTitle(generated.title);
    setContent(generated.content);
    setExcerpt(generated.excerpt);
    setSeoDescription(generated.meta_description);
    setMetaKeywords(generated.meta_keywords);
    setTags(generated.suggested_tags);
    setCategory(generated.suggested_category);
    setAiGenerated(true);
    setHasUnsavedChanges(true);
    toastSuccess('AI content inserted! Review and edit as needed.');
  };

  const handleSEOChange = (field: string, value: string | string[]) => {
    switch (field) {
      case 'seo_title':
        setSeoTitle(value as string);
        break;
      case 'seo_description':
        setSeoDescription(value as string);
        break;
      case 'meta_keywords':
        setMetaKeywords(value as string[]);
        break;
      case 'og_image':
        setOgImage(value as string);
        break;
    }
    setHasUnsavedChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0F1118]/95 backdrop-blur-xl border-b border-white/10 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/blog')}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {isEditing ? 'Edit Post' : 'New Post'}
              </h1>
              {hasUnsavedChanges && (
                <p className="text-xs text-yellow-400">Unsaved changes</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && revisions.length > 0 && (
              <button
                onClick={() => setShowRevisions(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <History className="w-4 h-4" />
                Revisions ({revisions.length})
              </button>
            )}
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Draft
            </button>
            {status === 'published' ? (
              <button
                onClick={handleUnpublish}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                Unpublish
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Publish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6">
        {/* Left Sidebar - Post Settings */}
        <div className="lg:col-span-3 space-y-4">
          {/* Category */}
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <FolderOpen className="w-4 h-4 text-orange-400" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <Tag className="w-4 h-4 text-orange-400" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-700 text-sm text-white rounded-lg hover:bg-slate-600"
              >
                Add
              </button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <ImageIcon className="w-4 h-4 text-orange-400" />
              Featured Image
            </label>
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => {
                setFeaturedImage(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
            {featuredImage && (
              <div className="mt-2 aspect-video rounded-lg overflow-hidden border border-white/10">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
            <label className="text-sm font-medium text-white mb-2 block">Status</label>
            <div
              className={`
                px-3 py-2 rounded-lg text-sm font-medium
                ${status === 'published' ? 'bg-green-500/20 text-green-400' : ''}
                ${status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                ${status === 'archived' ? 'bg-slate-500/20 text-slate-400' : ''}
              `}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>
        </div>

        {/* Center - Editor */}
        <div className="lg:col-span-6 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="Post title..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-xl font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/30 rounded-lg">
            <span className="text-sm text-slate-500">/blog/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(generateSlug(e.target.value));
                setHasUnsavedChanges(true);
              }}
              placeholder="post-slug"
              className="flex-1 bg-transparent text-sm text-slate-300 focus:outline-none"
            />
          </div>

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="Write a brief excerpt (optional - will be auto-generated from content)..."
            rows={2}
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 resize-none"
          />

          {/* Editor */}
          <BlogEditor
            content={content}
            contentJson={contentJson}
            onChange={handleContentChange}
            placeholder="Start writing your blog post..."
            autoFocus={!isEditing}
          />
        </div>

        {/* Right Sidebar - SEO & AI */}
        <div className="lg:col-span-3 space-y-4">
          {/* SEO Panel */}
          <BlogSEOPanel
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            metaKeywords={metaKeywords}
            ogImage={ogImage}
            postTitle={title}
            postContent={content}
            onChange={handleSEOChange}
          />

          {/* AI Panel */}
          {showAIPanel && (
            <BlogAIPanel onInsertContent={handleInsertAIContent} />
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <BlogPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        post={{
          title,
          content,
          excerpt,
          featuredImage,
          category,
          readTime: Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
          author: user?.email || undefined,
        }}
      />

      {/* Revisions Modal */}
      {showRevisions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-white/10 shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Revision History</h3>
              <button
                onClick={() => setShowRevisions(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {revisions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No revisions yet</p>
              ) : (
                <div className="space-y-2">
                  {revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="flex items-center justify-between p-3 bg-slate-900 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          Revision #{rev.revision_number}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(rev.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestoreRevision(rev.id)}
                        className="px-3 py-1 text-sm bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBlogEditor;
