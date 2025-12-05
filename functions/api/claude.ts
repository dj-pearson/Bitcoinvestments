// Cloudflare Pages Function: Claude AI API
// Central endpoint for all Claude API interactions
// Uses X-Api-Key header for authentication as required by Anthropic API

interface Env {
  CLAUDE_API_KEY?: string;
}

interface ClaudeRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  model?: 'default' | 'lightweight' | string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
  feature?: string; // For tracking which feature is making the request
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Default models - these can be overridden via admin settings stored in database
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
const LIGHTWEIGHT_MODEL = 'claude-haiku-4-5-20251001';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    // Check for API key
    const apiKey = env.CLAUDE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CLAUDE_API_KEY is not configured',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Parse request body
    const body: ClaudeRequest = await request.json();
    const {
      messages,
      model = 'default',
      maxTokens = 4096,
      temperature = 0.7,
      system,
      feature,
    } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Messages are required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Resolve model ID
    let modelId: string;
    if (model === 'default') {
      modelId = DEFAULT_MODEL;
    } else if (model === 'lightweight') {
      modelId = LIGHTWEIGHT_MODEL;
    } else {
      modelId = model;
    }

    // Build request payload
    const payload: Record<string, unknown> = {
      model: modelId,
      max_tokens: maxTokens,
      temperature,
      messages,
    };

    if (system) {
      payload.system = system;
    }

    // Make request to Claude API using X-Api-Key header
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Claude API error (feature: ${feature}):`, errorData);

      let errorMessage = 'Claude API request failed';
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = errorData || errorMessage;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const data: ClaudeResponse = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        content: data.content[0]?.text || '',
        model: data.model,
        usage: data.usage,
        stopReason: data.stop_reason,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Claude API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to call Claude API',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
