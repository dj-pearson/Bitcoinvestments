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

/**
 * AI Portfolio Analysis Types
 */
export interface PortfolioAnalysisInput {
  holdings: Array<{
    symbol: string;
    name: string;
    amount: number;
    currentValue: number;
    costBasis: number;
    allocationPercentage: number;
  }>;
  totalValue: number;
  totalCostBasis: number;
  riskTolerance?: 'low' | 'medium' | 'high';
  investmentGoal?: string;
  timeHorizon?: 'short' | 'medium' | 'long';
}

export interface PortfolioAnalysisResult {
  riskScore: number; // 1-10
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  diversificationScore: number; // 1-100
  overallHealth: 'poor' | 'fair' | 'good' | 'excellent';
  summary: string;
  strengths: string[];
  concerns: string[];
  rebalancingSuggestions: string[];
  educationalInsights: string[];
  disclaimer: string;
}

/**
 * Generate comprehensive AI portfolio analysis
 * Premium feature: Risk assessment, diversification score, rebalancing suggestions
 */
export async function generatePortfolioAnalysis(
  input: PortfolioAnalysisInput
): Promise<AIResponse & { analysis?: PortfolioAnalysisResult }> {
  const system = `You are an expert cryptocurrency portfolio analyst providing educational insights.
CRITICAL GUIDELINES:
- This is NOT financial advice - always include appropriate disclaimers
- Focus on educational explanations and general principles
- Be objective and data-driven in your analysis
- Explain the reasoning behind each assessment
- Consider both technical factors and risk management principles
- Be helpful but cautious - never make specific buy/sell recommendations

You must respond in a specific JSON format for programmatic parsing.`;

  const holdingsSummary = input.holdings
    .map(h => `${h.symbol} (${h.name}): ${h.amount.toFixed(6)} units, Value: $${h.currentValue.toLocaleString()}, Allocation: ${h.allocationPercentage.toFixed(1)}%, P/L: ${(((h.currentValue - h.costBasis) / h.costBasis) * 100).toFixed(1)}%`)
    .join('\n');

  const prompt = `Analyze this cryptocurrency portfolio and provide a comprehensive assessment:

PORTFOLIO SUMMARY:
Total Value: $${input.totalValue.toLocaleString()}
Total Cost Basis: $${input.totalCostBasis.toLocaleString()}
Overall P/L: ${(((input.totalValue - input.totalCostBasis) / input.totalCostBasis) * 100).toFixed(1)}%

HOLDINGS:
${holdingsSummary}

USER PROFILE:
Risk Tolerance: ${input.riskTolerance || 'Not specified'}
Investment Goal: ${input.investmentGoal || 'Not specified'}
Time Horizon: ${input.timeHorizon || 'Not specified'}

Please provide your analysis in the following JSON format:
{
  "riskScore": <1-10 number>,
  "riskLevel": "<low|medium|high|very_high>",
  "diversificationScore": <1-100 number>,
  "overallHealth": "<poor|fair|good|excellent>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "concerns": ["<concern 1>", "<concern 2>", ...],
  "rebalancingSuggestions": ["<suggestion 1>", "<suggestion 2>", ...],
  "educationalInsights": ["<insight 1>", "<insight 2>", ...],
  "disclaimer": "<appropriate disclaimer about this not being financial advice>"
}

Consider these factors in your analysis:
1. Asset concentration risk (% in single assets)
2. Correlation between holdings (BTC often influences other cryptos)
3. Market cap diversity (large cap vs small cap exposure)
4. Sector diversity (DeFi, Layer 1, Layer 2, etc.)
5. Volatility profile based on asset mix
6. Current profit/loss positions and tax implications
7. Alignment with stated risk tolerance and goals`;

  const response = await sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'default',
    system,
    feature: 'portfolio_analysis',
    maxTokens: 2048,
    temperature: 0.5, // Lower temperature for more consistent analysis
  });

  // Try to parse the JSON response
  if (response.success && response.content) {
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      let jsonContent = response.content;
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      } else {
        // Try to find JSON object directly
        const jsonStart = response.content.indexOf('{');
        const jsonEnd = response.content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonContent = response.content.slice(jsonStart, jsonEnd + 1);
        }
      }

      const analysis = JSON.parse(jsonContent) as PortfolioAnalysisResult;
      return {
        ...response,
        analysis,
      };
    } catch (parseError) {
      // Return response without parsed analysis if JSON parsing fails
      console.error('Failed to parse portfolio analysis JSON:', parseError);
    }
  }

  return response;
}

/**
 * Generate quick portfolio health check
 * Lighter-weight analysis for frequent checks
 */
export async function generateQuickPortfolioCheck(
  holdings: Array<{ symbol: string; allocationPercentage: number }>
): Promise<AIResponse> {
  const system = `You are a cryptocurrency portfolio advisor providing quick health checks.
Keep responses brief and actionable. This is educational content, not financial advice.`;

  const holdingsList = holdings
    .map(h => `${h.symbol}: ${h.allocationPercentage.toFixed(1)}%`)
    .join(', ');

  const prompt = `Quick portfolio health check for: ${holdingsList}

In 2-3 sentences:
1. Note any obvious concentration risks
2. Comment on diversification
3. One actionable insight

Be brief and practical.`;

  return sendAIMessage([{ role: 'user', content: prompt }], {
    model: 'lightweight',
    system,
    feature: 'portfolio_quick_check',
    maxTokens: 256,
    temperature: 0.5,
  });
}
