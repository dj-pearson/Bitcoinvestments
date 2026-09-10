// Cloudflare Pages Function: Claude AI API
// Central endpoint for all Claude API interactions
// Uses X-Api-Key header for authentication as required by Anthropic API

import { getCorsHeaders, handleCorsPreflightRequest } from './_cors';

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

/**
 * Models this endpoint is willing to bill for, by alias.
 *
 * The request body used to be able to name any model as a raw string, which
 * went straight through to Anthropic on our API key. Callers in this repo only
 * ever send 'default' or 'lightweight', so accepting arbitrary identifiers
 * bought nothing and let a caller pick the most expensive model available.
 */
const ALLOWED_MODELS: Record<string, string> = {
  default: DEFAULT_MODEL,
  lightweight: LIGHTWEIGHT_MODEL,
};

/**
 * Request bounds.
 *
 * Every field below is caller-controlled and every one of them multiplies what
 * a single request costs us. The ceilings are set above the largest values any
 * caller in this repo sends (maxTokens tops out at 4096) so legitimate traffic
 * is unaffected, while a single abusive request can no longer ask for an
 * unbounded completion over an unbounded prompt.
 */
const MAX_OUTPUT_TOKENS = 4096;
const MAX_MESSAGES = 100;
const MAX_TOTAL_INPUT_CHARS = 256_000;
const MAX_SYSTEM_CHARS = 32_000;

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
            ...getCorsHeaders(request),
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
    } = body;

    const badRequest = (error: string) =>
      new Response(JSON.stringify({ success: false, error }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request),
        },
      });

    if (!Array.isArray(messages) || messages.length === 0) {
      return badRequest('Messages are required');
    }

    if (messages.length > MAX_MESSAGES) {
      return badRequest(`A conversation may contain at most ${MAX_MESSAGES} messages`);
    }

    let totalInputChars = 0;
    for (const message of messages) {
      if (
        !message ||
        (message.role !== 'user' && message.role !== 'assistant') ||
        typeof message.content !== 'string'
      ) {
        return badRequest('Each message must have a role of user or assistant and string content');
      }
      totalInputChars += message.content.length;
    }

    if (totalInputChars > MAX_TOTAL_INPUT_CHARS) {
      return badRequest('Conversation is too long');
    }

    if (system !== undefined && (typeof system !== 'string' || system.length > MAX_SYSTEM_CHARS)) {
      return badRequest('System prompt is too long');
    }

    // Resolve model ID. Only the known aliases are billable - an unrecognised
    // value is rejected rather than forwarded to Anthropic verbatim.
    const modelId = ALLOWED_MODELS[model];
    if (!modelId) {
      return badRequest(
        `Unknown model "${model}". Supported values: ${Object.keys(ALLOWED_MODELS).join(', ')}`
      );
    }

    // Clamp the cost-bearing numeric fields rather than rejecting, so a caller
    // asking for slightly more than we allow still gets a useful answer.
    const boundedMaxTokens = Math.min(
      Math.max(Math.floor(Number(maxTokens) || 1), 1),
      MAX_OUTPUT_TOKENS
    );
    const boundedTemperature = Math.min(Math.max(Number(temperature) || 0, 0), 1);

    // Build request payload
    const payload: Record<string, unknown> = {
      model: modelId,
      max_tokens: boundedMaxTokens,
      temperature: boundedTemperature,
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
            ...getCorsHeaders(request),
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
          ...getCorsHeaders(request),
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to call Claude API',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request),
        },
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions(context: { request: Request }) {
  return handleCorsPreflightRequest(context.request);
}
