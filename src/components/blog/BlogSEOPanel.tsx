/**
 * BlogSEOPanel Component
 * SEO settings panel for blog posts
 */

import { useState } from 'react';
import { Search, Image, Tag, RefreshCw, X } from 'lucide-react';
import { generateSEOMetadata } from '../../services/blogAI';

interface BlogSEOPanelProps {
  seoTitle: string;
  seoDescription: string;
  metaKeywords: string[];
  ogImage: string;
  postTitle: string;
  postContent: string;
  onChange: (field: string, value: string | string[]) => void;
}

export function BlogSEOPanel({
  seoTitle,
  seoDescription,
  metaKeywords,
  ogImage,
  postTitle,
  postContent,
  onChange,
}: BlogSEOPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const handleGenerateSEO = async () => {
    if (!postContent.trim()) {
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateSEOMetadata(postContent, postTitle);
      if (result) {
        onChange('seo_description', result.meta_description);
        onChange('meta_keywords', result.meta_keywords);
      }
    } catch (error) {
      console.error('Error generating SEO:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !metaKeywords.includes(newKeyword.trim())) {
      onChange('meta_keywords', [...metaKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    onChange('meta_keywords', metaKeywords.filter((k) => k !== keyword));
  };

  const displayTitle = seoTitle || postTitle;
  const displayDescription = seoDescription || 'Enter a meta description...';

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-orange-400" />
          SEO Settings
        </h3>
        <button
          onClick={handleGenerateSEO}
          disabled={isGenerating || !postContent.trim()}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
          Generate
        </button>
      </div>

      {/* SEO Title */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          SEO Title <span className="text-slate-500">({displayTitle.length}/60)</span>
        </label>
        <input
          type="text"
          value={seoTitle}
          onChange={(e) => onChange('seo_title', e.target.value)}
          placeholder={postTitle || 'Enter SEO title...'}
          maxLength={60}
          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Meta Description */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Meta Description <span className="text-slate-500">({seoDescription.length}/160)</span>
        </label>
        <textarea
          value={seoDescription}
          onChange={(e) => onChange('seo_description', e.target.value)}
          placeholder="Enter meta description..."
          maxLength={160}
          rows={3}
          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
          <Tag className="w-3 h-3" />
          Keywords
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {metaKeywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded"
            >
              {keyword}
              <button
                onClick={() => handleRemoveKeyword(keyword)}
                className="hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
            placeholder="Add keyword..."
            className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleAddKeyword}
            className="px-3 py-1.5 bg-slate-700 text-sm text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* OG Image */}
      <div>
        <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
          <Image className="w-3 h-3" />
          Social Image URL
        </label>
        <input
          type="url"
          value={ogImage}
          onChange={(e) => onChange('og_image', e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
        />
        {ogImage && (
          <div className="mt-2 relative aspect-video max-w-full overflow-hidden rounded-lg border border-white/10">
            <img
              src={ogImage}
              alt="OG Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Google Preview */}
      <div className="pt-4 border-t border-white/10">
        <h4 className="text-xs text-slate-400 mb-2">Google Preview</h4>
        <div className="p-3 bg-white rounded-lg">
          <div className="text-sm text-[#1a0dab] font-medium truncate">
            {displayTitle || 'Page Title'}
          </div>
          <div className="text-xs text-[#006621] truncate">
            bitcoinvestments.net/blog/...
          </div>
          <div className="text-xs text-[#545454] mt-1 line-clamp-2">
            {displayDescription}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogSEOPanel;
