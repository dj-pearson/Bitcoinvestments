/**
 * BlogAIPanel Component
 * AI-powered content generation panel for blog posts
 */

import { useState } from 'react';
import { Sparkles, Newspaper, RefreshCw, Check, AlertCircle, Lightbulb } from 'lucide-react';
import {
  fetchNewsForGeneration,
  generateBlogFromNews,
  suggestHeadlines,
  generateOutline,
} from '../../services/blogAI';
import type { NewsSourceForGeneration, AIContentGenerationOptions, GeneratedBlogContent } from '../../types/blog';

interface BlogAIPanelProps {
  onInsertContent: (content: GeneratedBlogContent) => void;
}

type GenerationStep = 'topic' | 'sources' | 'options' | 'generating' | 'preview';

export function BlogAIPanel({ onInsertContent }: BlogAIPanelProps) {
  const [step, setStep] = useState<GenerationStep>('topic');
  const [topic, setTopic] = useState('');
  const [news, setNews] = useState<NewsSourceForGeneration[]>([]);
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const [style, setStyle] = useState<'educational' | 'news' | 'analysis'>('educational');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedBlogContent | null>(null);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [outline, setOutline] = useState<string[]>([]);

  const handleFetchNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newsItems = await fetchNewsForGeneration(topic, 5);
      if (newsItems.length === 0) {
        setError('No news articles found. Try a different topic.');
        return;
      }
      setNews(newsItems);
      setSelectedNews(newsItems.slice(0, 3).map((n) => n.id));
      setStep('sources');
    } catch {
      setError('Failed to fetch news. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    const selectedSources = news.filter((n) => selectedNews.includes(n.id));
    if (selectedSources.length === 0) {
      setError('Please select at least one news source.');
      return;
    }

    setStep('generating');
    setIsLoading(true);
    setError(null);

    try {
      const options: AIContentGenerationOptions = {
        style,
        length,
        topic: topic || undefined,
      };

      const result = await generateBlogFromNews(selectedSources, options);
      if (result.error) {
        setError(result.error);
        setStep('options');
        return;
      }

      if (result.data) {
        setGeneratedContent(result.data);
        setStep('preview');
      }
    } catch {
      setError('Generation failed. Please try again.');
      setStep('options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (generatedContent) {
      onInsertContent(generatedContent);
      // Reset
      setStep('topic');
      setTopic('');
      setNews([]);
      setSelectedNews([]);
      setGeneratedContent(null);
    }
  };

  const handleSuggestHeadlines = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const suggestions = await suggestHeadlines(topic, 5);
      setHeadlines(suggestions);
    } catch {
      // Ignore errors for headline suggestions
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const sections = await generateOutline(topic, style);
      setOutline(sections);
    } catch {
      // Ignore errors for outline generation
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNewsSelection = (id: string) => {
    setSelectedNews((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-orange-400" />
        AI Content Assistant
      </h3>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Topic */}
      {step === 'topic' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Topic or Theme</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Bitcoin, DeFi, Ethereum..."
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={handleFetchNews}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Fetching News...
              </>
            ) : (
              <>
                <Newspaper className="w-4 h-4" />
                Find Related News
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleSuggestHeadlines}
              disabled={!topic.trim() || isLoading}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <Lightbulb className="w-3 h-3" />
              Headlines
            </button>
            <button
              onClick={handleGenerateOutline}
              disabled={!topic.trim() || isLoading}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <Lightbulb className="w-3 h-3" />
              Outline
            </button>
          </div>

          {headlines.length > 0 && (
            <div className="p-3 bg-slate-900 rounded-lg">
              <h4 className="text-xs text-slate-400 mb-2">Headline Ideas</h4>
              <ul className="space-y-1">
                {headlines.map((h, i) => (
                  <li key={i} className="text-xs text-slate-300">{h}</li>
                ))}
              </ul>
            </div>
          )}

          {outline.length > 0 && (
            <div className="p-3 bg-slate-900 rounded-lg">
              <h4 className="text-xs text-slate-400 mb-2">Content Outline</h4>
              <ul className="space-y-1">
                {outline.map((s, i) => (
                  <li key={i} className="text-xs text-slate-300">{i + 1}. {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Sources */}
      {step === 'sources' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2">
              Select news sources ({selectedNews.length} selected)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {news.map((item) => (
                <label
                  key={item.id}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedNews.includes(item.id)
                      ? 'bg-orange-500/10 border border-orange-500/30'
                      : 'bg-slate-900 border border-white/5 hover:border-white/10'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedNews.includes(item.id)}
                    onChange={() => toggleNewsSelection(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium line-clamp-2">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.source}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('topic')}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep('options')}
              disabled={selectedNews.length === 0}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generation Options */}
      {step === 'options' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Writing Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(['educational', 'news', 'analysis'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`
                    px-3 py-2 text-xs rounded-lg capitalize transition-colors
                    ${style === s
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                    }
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Article Length</label>
            <div className="grid grid-cols-3 gap-2">
              {(['short', 'medium', 'long'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  className={`
                    px-3 py-2 text-xs rounded-lg capitalize transition-colors
                    ${length === l
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                    }
                  `}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {length === 'short' && '400-600 words'}
              {length === 'medium' && '800-1200 words'}
              {length === 'long' && '1500-2000 words'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('sources')}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleGenerateContent}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generating */}
      {step === 'generating' && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-sm text-white">Generating your blog post...</p>
          <p className="text-xs text-slate-500 mt-1">This may take a moment</p>
        </div>
      )}

      {/* Step 5: Preview */}
      {step === 'preview' && generatedContent && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-lg max-h-80 overflow-y-auto">
            <h4 className="text-lg font-bold text-white mb-2">{generatedContent.title}</h4>
            <p className="text-sm text-slate-400 mb-4">{generatedContent.excerpt}</p>
            <div
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: generatedContent.content.replace(/\n/g, '<br>') }}
            />
          </div>

          <div className="p-3 bg-slate-900/50 rounded-lg">
            <p className="text-xs text-slate-400">
              <strong>Category:</strong> {generatedContent.suggested_category}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              <strong>Tags:</strong> {generatedContent.suggested_tags.join(', ')}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStep('options');
                setGeneratedContent(null);
              }}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Regenerate
            </button>
            <button
              onClick={handleInsert}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Use This
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogAIPanel;
