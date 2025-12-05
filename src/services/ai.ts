/**
 * AI Service
 * Frontend service for interacting with Claude AI via Cloudflare Functions
 * Used by: Blog Generator, Market Analysis, Portfolio Recommendations,
 * News Summarizer, Chatbot, Content Calendar, Price Predictions,
 * Newsletter Generation, Glossary Expansion
 */

export type AIModelType = 'default' | 'lightweight';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  model?: AIModelType | string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
  feature?: string;
}

export interface AIResponse {
  success: boolean;
  content: string;
  model?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  stopReason?: string;
  error?: string;
}

/**
 * Send a message to Claude AI
 */
export async function sendAIMessage(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: options.model || 'default',
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        system: options.system,
        feature: options.feature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        content: '',
        error: data.error || 'AI request failed',
      };
    }

    return {
      success: true,
      content: data.content,
      model: data.model,
      usage: data.usage,
      stopReason: data.stopReason,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Generate a blog post using AI
 */
export async function generateBlogPost(
  topic: string,
  style: 'educational' | 'news' | 'analysis' = 'educational',
  length: 'short' | 'medium' | 'long' = 'medium'
): Promise<AIResponse> {
  const wordCounts = {
    short: '300-500',
    medium: '700-1000',
    long: '1500-2000',
  };

  const stylePrompts = {
    educational: 'Write in an educational, beginner-friendly tone that explains concepts clearly.',
    news: 'Write in a journalistic news style with facts and current developments.',
    analysis: 'Write an analytical piece with data-driven insights and expert perspective.',
  };

  const system = `You are a professional cryptocurrency and Bitcoin content writer.
${stylePrompts[style]}
Focus on accurate, informative content about Bitcoin and cryptocurrency.
Always include practical takeaways for readers.`;

  const prompt = `Write a blog post about: "${topic}"

Requirements:
- Length: ${wordCounts[length]} words
- Include a compelling headline
- Use markdown formatting with headers, bullet points where appropriate
- Make it SEO-friendly with relevant keywords
- End with a conclusion or call-to-action

Format the response as:
# [Headline]

[Content with proper markdown formatting]`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'default',
    system,
    feature: 'blog_generator',
    maxTokens: length === 'long' ? 4096 : 2048,
  });
}

/**
 * Generate market analysis report
 */
export async function generateMarketAnalysis(
  data: {
    currentPrice?: number;
    priceChange24h?: number;
    priceChange7d?: number;
    marketCap?: number;
    volume24h?: number;
    dominance?: number;
  }
): Promise<AIResponse> {
  const system = `You are a professional cryptocurrency market analyst providing weekly analysis reports.
Be objective, data-driven, and provide balanced perspectives on market conditions.
Never provide financial advice or make promises about future prices.
Include both bullish and bearish perspectives.`;

  const prompt = `Generate a weekly Bitcoin market analysis report based on the following data:

Current Price: $${data.currentPrice?.toLocaleString() || 'N/A'}
24h Change: ${data.priceChange24h?.toFixed(2) || 'N/A'}%
7d Change: ${data.priceChange7d?.toFixed(2) || 'N/A'}%
Market Cap: $${data.marketCap?.toLocaleString() || 'N/A'}
24h Volume: $${data.volume24h?.toLocaleString() || 'N/A'}
BTC Dominance: ${data.dominance?.toFixed(2) || 'N/A'}%

Include:
1. Market Overview (current state summary)
2. Key Price Levels (support/resistance)
3. Trend Analysis (short and medium term)
4. Volume & Sentiment Analysis
5. Key Factors to Watch
6. Risk Considerations

Format in markdown with clear sections.`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'default',
    system,
    feature: 'market_analysis',
  });
}

/**
 * Generate portfolio recommendations
 */
export async function generatePortfolioRecommendations(
  portfolio: {
    holdings?: Array<{ asset: string; amount: number; value: number }>;
    riskTolerance?: 'low' | 'medium' | 'high';
    investmentGoal?: string;
    timeHorizon?: string;
  }
): Promise<AIResponse> {
  const system = `You are a cryptocurrency portfolio advisor providing educational insights.
IMPORTANT: Always include a disclaimer that this is not financial advice.
Focus on general principles and educational content rather than specific buy/sell recommendations.
Consider risk management, diversification, and the user's stated goals.`;

  const holdingsSummary = portfolio.holdings
    ?.map((h) => `${h.asset}: ${h.amount} (≈$${h.value.toLocaleString()})`)
    .join('\n') || 'No holdings data available';

  const prompt = `Analyze this cryptocurrency portfolio and provide educational insights:

Portfolio Holdings:
${holdingsSummary}

Risk Tolerance: ${portfolio.riskTolerance || 'Not specified'}
Investment Goal: ${portfolio.investmentGoal || 'Not specified'}
Time Horizon: ${portfolio.timeHorizon || 'Not specified'}

Provide:
1. Portfolio Balance Assessment
2. Diversification Analysis
3. Risk Considerations based on stated tolerance
4. General Educational Suggestions (NOT financial advice)
5. Things to Research Further

Remember to include appropriate disclaimers.`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'default',
    system,
    feature: 'portfolio_recommendations',
  });
}

/**
 * Summarize crypto news article
 */
export async function summarizeNews(
  article: string,
  title?: string
): Promise<AIResponse> {
  const system = `You are a cryptocurrency news summarizer.
Provide clear, concise summaries of news articles.
Highlight key points, implications for the market, and main takeaways.
Be objective and factual.`;

  const prompt = `Summarize this cryptocurrency news article:

${title ? `Title: ${title}\n\n` : ''}${article}

Provide:
1. One-sentence summary (TL;DR)
2. Key Points (3-5 bullet points)
3. Market Implications (if any)
4. Main Takeaway`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'lightweight', // Use lightweight model for quick summaries
    system,
    feature: 'news_summarizer',
    maxTokens: 1024,
  });
}

/**
 * Chatbot response for crypto education and platform help
 */
export async function getChatbotResponse(
  messages: AIMessage[],
  context?: {
    userType?: 'free' | 'premium';
    currentPage?: string;
  }
): Promise<AIResponse> {
  const system = `You are a helpful cryptocurrency education assistant for Bitcoin Investments platform.
Your role is to:
1. Answer questions about Bitcoin and cryptocurrency
2. Explain concepts in simple terms
3. Help users navigate the platform
4. Provide educational content (not financial advice)

Be friendly, concise, and helpful.
For complex topics, break them down into digestible pieces.
Always clarify that you don't provide financial advice.

${context?.userType === 'premium' ? 'This is a premium user with access to advanced features.' : ''}
${context?.currentPage ? `User is currently on the ${context.currentPage} page.` : ''}`;

  return sendAIMessage(messages, {
    model: 'lightweight', // Use lightweight for fast responses
    system,
    feature: 'chatbot',
    maxTokens: 1024,
    temperature: 0.8,
  });
}

/**
 * Generate content calendar suggestions
 */
export async function generateContentCalendar(
  options: {
    weeks?: number;
    focus?: string[];
    existingTopics?: string[];
  }
): Promise<AIResponse> {
  const system = `You are a content strategist specializing in cryptocurrency and Bitcoin education.
Create engaging, SEO-friendly content calendars with a mix of educational, news, and analysis content.
Consider seasonal trends, market cycles, and audience engagement patterns.`;

  const prompt = `Generate a ${options.weeks || 4}-week content calendar for a Bitcoin/cryptocurrency education platform.

${options.focus?.length ? `Focus Areas: ${options.focus.join(', ')}` : ''}
${options.existingTopics?.length ? `Avoid these already-covered topics: ${options.existingTopics.join(', ')}` : ''}

For each content piece, include:
- Suggested title
- Content type (blog, guide, analysis, news)
- Target keywords (2-3)
- Best posting day/time
- Brief description (1 sentence)

Format as a structured markdown table or list by week.`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'default',
    system,
    feature: 'content_calendar',
  });
}

/**
 * Generate price trend analysis (educational, not predictions)
 */
export async function generatePriceTrendAnalysis(
  historicalData: {
    prices: Array<{ date: string; price: number }>;
    period: string;
  }
): Promise<AIResponse> {
  const system = `You are a technical analyst providing educational analysis of price trends.
IMPORTANT: Never predict exact prices or guarantee outcomes.
Focus on pattern recognition, historical context, and educational insights.
Always include risk disclaimers.`;

  const priceData = historicalData.prices
    .slice(-10)
    .map((p) => `${p.date}: $${p.price.toLocaleString()}`)
    .join('\n');

  const prompt = `Analyze this Bitcoin price data for educational purposes:

Period: ${historicalData.period}
Recent Prices:
${priceData}

Provide:
1. Trend Direction (based on data)
2. Key Observations
3. Historical Context (similar patterns in history)
4. Technical Indicators Explanation
5. Risk Factors to Consider

IMPORTANT: Include disclaimer that this is for educational purposes only, not financial advice.`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'default',
    system,
    feature: 'price_analysis',
  });
}

/**
 * Generate newsletter content
 */
export async function generateNewsletter(
  options: {
    segment?: 'general' | 'beginner' | 'advanced' | 'premium';
    topics?: string[];
    marketHighlights?: string;
  }
): Promise<AIResponse> {
  const segmentTones = {
    general: 'accessible to all readers',
    beginner: 'educational and simple, avoiding jargon',
    advanced: 'detailed and technical',
    premium: 'exclusive insights and advanced analysis',
  };

  const system = `You are a cryptocurrency newsletter writer.
Write engaging, valuable content that readers want to open.
Include actionable insights and educational content.
Tone: ${segmentTones[options.segment || 'general']}`;

  const prompt = `Write a weekly cryptocurrency newsletter:

${options.topics?.length ? `Featured Topics: ${options.topics.join(', ')}` : ''}
${options.marketHighlights || ''}

Include:
1. Catchy subject line
2. Brief intro/greeting
3. This Week's Highlights (2-3 points)
4. Market Update section
5. Educational Spotlight (one concept explained)
6. Upcoming to Watch
7. Call-to-action/Sign-off

Format in clean HTML-compatible markdown (can be converted to email).`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'default',
    system,
    feature: 'newsletter',
  });
}

/**
 * Generate or improve glossary definitions
 */
export async function generateGlossaryDefinition(
  term: string,
  existingDefinition?: string
): Promise<AIResponse> {
  const system = `You are a cryptocurrency educator writing glossary definitions.
Definitions should be:
- Clear and concise (2-3 sentences max)
- Beginner-friendly without being patronizing
- Accurate and up-to-date
- Include a simple example when helpful`;

  const prompt = existingDefinition
    ? `Improve this glossary definition for "${term}":

Current definition: ${existingDefinition}

Provide an improved version that is clearer, more accurate, or more helpful for beginners.`
    : `Write a glossary definition for the cryptocurrency term: "${term}"

Include:
1. Clear, concise definition (2-3 sentences)
2. Simple example or analogy if helpful
3. Related terms (1-2) they might want to look up`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'lightweight',
    system,
    feature: 'glossary',
    maxTokens: 512,
  });
}
