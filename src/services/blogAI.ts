/**
 * Blog AI Service
 * AI-powered content generation for blog posts using Claude AI and CryptoCompare news
 */

import { sendAIMessage, type AIResponse } from './ai';
import { getLatestNews, getNewsByCategory, type NewsItem } from './news';
import type {
  AIGenerationSettings,
  AIContentGenerationOptions,
  GeneratedBlogContent,
  NewsSourceForGeneration,
} from '../types/blog';

/**
 * Fetch news articles for content generation
 */
export async function fetchNewsForGeneration(
  topic?: string,
  limit: number = 5
): Promise<NewsSourceForGeneration[]> {
  try {
    let news: NewsItem[];

    if (topic) {
      // Map common topics to CryptoCompare categories
      const categoryMap: Record<string, string> = {
        bitcoin: 'BTC',
        ethereum: 'ETH',
        defi: 'Trading',
        trading: 'Trading',
        regulation: 'Regulation',
        technology: 'Blockchain',
        nft: 'NFT',
        altcoins: 'Altcoin',
      };

      const category = categoryMap[topic.toLowerCase()] || topic;
      news = await getNewsByCategory(category, limit);
    } else {
      news = await getLatestNews(limit);
    }

    return news.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      source: item.source,
      url: item.url,
      publishedAt: item.publishedAt,
      categories: item.categories,
      selected: false,
    }));
  } catch (error) {
    console.error('Error fetching news for generation:', error);
    return [];
  }
}

/**
 * Generate a blog post from selected news articles
 */
export async function generateBlogFromNews(
  news: NewsSourceForGeneration[],
  options: AIContentGenerationOptions
): Promise<{ data: GeneratedBlogContent | null; error: string | null; settings: AIGenerationSettings }> {
  const settings: AIGenerationSettings = {
    model: 'default',
    temperature: 0.7,
    style: options.style,
    length: options.length,
    prompt_used: '',
    source_count: news.length,
  };

  if (news.length === 0) {
    return { data: null, error: 'No news articles selected', settings };
  }

  const wordCounts = {
    short: '400-600',
    medium: '800-1200',
    long: '1500-2000',
  };

  const styleInstructions = {
    educational:
      'Write in an educational, beginner-friendly tone that explains concepts clearly. Use analogies and real-world examples to make complex topics accessible.',
    news:
      'Write in a journalistic news style with facts, quotes, and current developments. Be objective and informative.',
    analysis:
      'Write an analytical piece with data-driven insights, expert perspective, and market implications. Provide balanced viewpoints.',
  };

  // Summarize news sources
  const sourcesSummary = news
    .map(
      (n, i) =>
        `Source ${i + 1}: "${n.title}"\n${n.body.substring(0, 500)}...`
    )
    .join('\n\n');

  const systemPrompt = `You are a professional cryptocurrency content writer for Bitcoinvestments, a trusted crypto education platform.

${styleInstructions[options.style]}

Guidelines:
- Write original content inspired by the provided news sources
- Do NOT copy text directly from sources
- Add educational value and context
- Include practical takeaways for readers
- Use proper markdown formatting
- Be accurate and factual
- Avoid speculation and financial advice
- Include relevant keywords naturally for SEO`;

  const userPrompt = `Based on the following recent cryptocurrency news articles, write an original blog post.

NEWS SOURCES:
${sourcesSummary}

${options.topic ? `FOCUS TOPIC: ${options.topic}` : ''}
${options.additionalContext ? `ADDITIONAL CONTEXT: ${options.additionalContext}` : ''}

REQUIREMENTS:
- Word count: ${wordCounts[options.length]} words
- Create a compelling, SEO-friendly headline
- Write an engaging introduction that hooks the reader
- Structure with clear sections using H2 headers
- Include key takeaways or conclusion
- Be original - synthesize and add value, don't just summarize

Respond in this JSON format:
{
  "title": "Your compelling headline here",
  "content": "Full blog post content in markdown format with ## headers",
  "excerpt": "A 150-200 character compelling excerpt for previews",
  "meta_description": "SEO meta description (150-160 characters)",
  "meta_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "suggested_category": "One of: Bitcoin, Altcoins, DeFi, Trading, Security, Regulation, Technology, Education",
  "suggested_tags": ["tag1", "tag2", "tag3"]
}`;

  settings.prompt_used = userPrompt.substring(0, 500) + '...';

  try {
    const response = await sendAIMessage([{ role: 'user', content: userPrompt }], {
      model: 'default',
      system: systemPrompt,
      feature: 'blog_generator',
      maxTokens: options.length === 'long' ? 4096 : 2048,
      temperature: 0.7,
    });

    if (!response.success) {
      return { data: null, error: response.error || 'AI generation failed', settings };
    }

    // Parse the JSON response
    const content = parseAIResponse(response.content);
    if (!content) {
      return { data: null, error: 'Failed to parse AI response', settings };
    }

    return { data: content, error: null, settings };
  } catch (error) {
    console.error('Error generating blog from news:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Generation failed',
      settings,
    };
  }
}

/**
 * Generate SEO metadata for existing content
 */
export async function generateSEOMetadata(
  content: string,
  title: string
): Promise<{
  meta_description: string;
  meta_keywords: string[];
  suggested_tags: string[];
} | null> {
  const prompt = `Analyze this blog post and generate SEO metadata.

TITLE: ${title}

CONTENT:
${content.substring(0, 2000)}...

Respond in JSON format:
{
  "meta_description": "Compelling SEO meta description, 150-160 characters",
  "meta_keywords": ["5-7 relevant SEO keywords"],
  "suggested_tags": ["3-5 content tags"]
}`;

  try {
    const response = await sendAIMessage([{ role: 'user', content: prompt }], {
      model: 'lightweight',
      system:
        'You are an SEO expert. Generate optimized metadata for cryptocurrency content. Be concise and keyword-focused.',
      feature: 'blog_seo',
      maxTokens: 512,
    });

    if (!response.success) {
      return null;
    }

    const result = parseJSONFromResponse(response.content);
    if (!result) {
      return null;
    }

    return {
      meta_description: (result.meta_description as string) || '',
      meta_keywords: (result.meta_keywords as string[]) || [],
      suggested_tags: (result.suggested_tags as string[]) || [],
    };
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    return null;
  }
}

/**
 * Suggest headlines for a topic
 */
export async function suggestHeadlines(
  topic: string,
  count: number = 5
): Promise<string[]> {
  const prompt = `Generate ${count} compelling blog post headlines about: "${topic}"

Requirements:
- Headlines should be 50-70 characters
- Use power words and create curiosity
- Be specific and actionable
- Suitable for cryptocurrency/Bitcoin content
- SEO-friendly with relevant keywords

Respond with just the headlines, one per line, no numbers or bullets.`;

  try {
    const response = await sendAIMessage([{ role: 'user', content: prompt }], {
      model: 'lightweight',
      system: 'You are a headline writing expert for cryptocurrency content.',
      feature: 'blog_headlines',
      maxTokens: 512,
    });

    if (!response.success) {
      return [];
    }

    return response.content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.length < 100);
  } catch (error) {
    console.error('Error suggesting headlines:', error);
    return [];
  }
}

/**
 * Improve existing content
 */
export async function improveContent(
  content: string,
  instructions: string
): Promise<AIResponse> {
  const prompt = `Improve this blog post content according to the following instructions:

INSTRUCTIONS: ${instructions}

CURRENT CONTENT:
${content}

Provide the improved content in markdown format. Only return the improved content, no explanations.`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'default',
    system:
      'You are a professional editor improving cryptocurrency content. Maintain the original voice while enhancing clarity, engagement, and SEO value.',
    feature: 'blog_improve',
    maxTokens: 4096,
  });
}

/**
 * Generate an excerpt from content
 */
export async function summarizeForExcerpt(
  content: string,
  maxLength: number = 200
): Promise<string> {
  const prompt = `Create a compelling excerpt (max ${maxLength} characters) from this blog post that will make readers want to read more:

${content.substring(0, 1500)}

Just respond with the excerpt text, nothing else.`;

  try {
    const response = await sendAIMessage([{ role: 'user', content: prompt }], {
      model: 'lightweight',
      system: 'You are a content writer creating engaging excerpts.',
      feature: 'blog_excerpt',
      maxTokens: 256,
    });

    if (!response.success) {
      // Fallback: extract first paragraph
      const firstPara = content.replace(/<[^>]*>/g, '').split('\n')[0];
      return firstPara.substring(0, maxLength);
    }

    return response.content.trim().substring(0, maxLength);
  } catch (error) {
    // Fallback
    const firstPara = content.replace(/<[^>]*>/g, '').split('\n')[0];
    return firstPara.substring(0, maxLength);
  }
}

/**
 * Generate content outline
 */
export async function generateOutline(
  topic: string,
  style: 'educational' | 'news' | 'analysis'
): Promise<string[]> {
  const styleContext = {
    educational: 'educational guide with clear explanations',
    news: 'news article with facts and developments',
    analysis: 'analytical piece with insights and data',
  };

  const prompt = `Create an outline for a ${styleContext[style]} about: "${topic}"

Provide 5-7 main sections as H2 headers.
Just list the section titles, one per line.`;

  try {
    const response = await sendAIMessage([{ role: 'user', content: prompt }], {
      model: 'lightweight',
      system: 'You are a content strategist for cryptocurrency content.',
      feature: 'blog_outline',
      maxTokens: 256,
    });

    if (!response.success) {
      return [];
    }

    return response.content
      .split('\n')
      .map((line) => line.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0);
  } catch (error) {
    console.error('Error generating outline:', error);
    return [];
  }
}

/**
 * Expand a section of content
 */
export async function expandSection(
  sectionTitle: string,
  context: string,
  targetLength: number = 200
): Promise<string> {
  const prompt = `Expand this section for a cryptocurrency blog post:

SECTION: ${sectionTitle}
ARTICLE CONTEXT: ${context.substring(0, 500)}

Write approximately ${targetLength} words that fit naturally in the article.
Use markdown formatting. Just provide the content, no section header.`;

  try {
    const response = await sendAIMessage([{ role: 'user', content: prompt }], {
      model: 'default',
      system: 'You are a cryptocurrency content writer expanding blog sections.',
      feature: 'blog_expand',
      maxTokens: 1024,
    });

    if (!response.success) {
      return '';
    }

    return response.content.trim();
  } catch (error) {
    console.error('Error expanding section:', error);
    return '';
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse AI response into structured content
 */
function parseAIResponse(content: string): GeneratedBlogContent | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      title: parsed.title || '',
      content: parsed.content || '',
      excerpt: parsed.excerpt || '',
      meta_description: parsed.meta_description || '',
      meta_keywords: parsed.meta_keywords || [],
      suggested_category: parsed.suggested_category || 'Education',
      suggested_tags: parsed.suggested_tags || [],
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return null;
  }
}

/**
 * Parse JSON from response content
 */
function parseJSONFromResponse(content: string): Record<string, unknown> | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
