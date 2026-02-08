/**
 * Centralized API Client
 *
 * Wraps fetch with:
 * - Automatic retry with exponential backoff for transient failures (5xx, network)
 * - Proper error typing via ApiError from apiError.ts
 * - Rate limit handling with Retry-After header respect
 * - Toast notification integration for user-facing errors
 * - Request/response logging in development
 *
 * Usage:
 *   import { apiClient } from '../lib/apiClient';
 *
 *   // Simple GET
 *   const data = await apiClient.get<Cryptocurrency[]>('/api/coingecko/coins/markets');
 *
 *   // POST with body
 *   const result = await apiClient.post('/api/v1/portfolio', { name: 'My Portfolio' });
 *
 *   // With custom retry config
 *   const data = await apiClient.get('/api/prices', { retryConfig: { maxRetries: 5 } });
 */

import { normalizeError, type ApiError, type RetryConfig } from './apiError';
import { captureException } from '../services/errorLogging';

// ============================================
// Types
// ============================================

export interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  /** Override retry behavior. Set maxRetries: 0 to disable retries. */
  retryConfig?: RetryConfig;
  /** Timeout in milliseconds. Default: 30000 (30s). */
  timeout?: number;
  /** Skip automatic error toast notification. */
  silent?: boolean;
  /** Custom error message for toasts. */
  errorMessage?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

type ToastFn = (title: string, message?: string) => void;

// ============================================
// Toast notification bridge
// ============================================

let _toastError: ToastFn | null = null;
let _toastWarning: ToastFn | null = null;

/**
 * Register toast functions so the API client can show user-facing
 * notifications. Call this once from a React component that has access
 * to the ToastContext (e.g., App or a layout component).
 */
export function registerToastHandlers(error: ToastFn, warning: ToastFn): void {
  _toastError = error;
  _toastWarning = warning;
}

function notifyError(title: string, message?: string): void {
  _toastError?.(title, message);
}

function notifyWarning(title: string, message?: string): void {
  _toastWarning?.(title, message);
}

// ============================================
// Retry helpers
// ============================================

const DEFAULT_RETRY: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000, // 1s, 2s, 4s
  maxDelay: 10000,
  shouldRetry: (error: ApiError) => error.retryable,
};

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

/**
 * Parse Retry-After header value into milliseconds.
 * Supports both seconds (integer) and HTTP-date formats.
 */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  if (!isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

// ============================================
// Core fetch wrapper
// ============================================

async function fetchWithRetry<T>(
  url: string,
  init: RequestInit,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const retryConfig = { ...DEFAULT_RETRY, ...options.retryConfig };
  const timeout = options.timeout ?? 30_000;

  let lastError: ApiError | undefined;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Successful response
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let data: T;
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as unknown as T;
        }
        return { data, status: response.status, headers: response.headers };
      }

      // Rate limited – respect Retry-After if present
      if (response.status === 429) {
        const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));
        if (attempt < retryConfig.maxRetries) {
          const delay = retryAfter ?? retryConfig.baseDelay * Math.pow(2, attempt);
          if (import.meta.env.DEV) {
            console.warn(`[apiClient] 429 rate limited – retrying in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
          }
          await new Promise(r => setTimeout(r, Math.min(delay, retryConfig.maxDelay)));
          continue;
        }
      }

      // Server error – retry if configured
      if (isRetryableStatus(response.status) && attempt < retryConfig.maxRetries) {
        const delay = retryConfig.baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        if (import.meta.env.DEV) {
          console.warn(`[apiClient] ${response.status} – retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
        }
        await new Promise(r => setTimeout(r, Math.min(delay, retryConfig.maxDelay)));
        continue;
      }

      // Non-retryable error – parse body for error details
      let errorBody: string;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = response.statusText;
      }

      const httpError = new Error(errorBody);
      Object.assign(httpError, { status: response.status, statusText: response.statusText });
      throw httpError;

    } catch (error) {
      clearTimeout(timeoutId);

      // AbortError from timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new Error(`Request timed out after ${timeout}ms`);
        Object.assign(timeoutError, { status: 408 });
        lastError = normalizeError(timeoutError);
      } else {
        lastError = normalizeError(error);
      }

      // Retry network errors
      if (lastError.retryable && attempt < retryConfig.maxRetries) {
        const delay = retryConfig.baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        if (import.meta.env.DEV) {
          console.warn(`[apiClient] Network error – retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
        }
        await new Promise(r => setTimeout(r, Math.min(delay, retryConfig.maxDelay)));
        continue;
      }
    }
  }

  // All retries exhausted
  const finalError = lastError ?? normalizeError(new Error('Request failed'));

  // Report to error logging
  captureException(finalError.originalError ?? finalError, {
    tags: { apiClient: 'true' },
    extra: { url, category: finalError.category },
  });

  // Show toast to user unless silent
  if (!options.silent) {
    const title = options.errorMessage ?? 'Request Failed';
    if (finalError.category === 'rate_limit') {
      notifyWarning('Slow down', finalError.userMessage);
    } else if (finalError.category === 'auth') {
      // Auth errors handled by auth context, don't duplicate
    } else {
      notifyError(title, finalError.userMessage);
    }
  }

  throw finalError;
}

// ============================================
// Public API
// ============================================

function buildUrl(path: string): string {
  // If already a full URL, use as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Relative paths resolve against the current origin
  return path;
}

export const apiClient = {
  /**
   * GET request with automatic retry and error handling.
   */
  async get<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { retryConfig, timeout, silent, errorMessage, ...fetchInit } = options;
    return fetchWithRetry<T>(buildUrl(url), { ...fetchInit, method: 'GET' }, options);
  },

  /**
   * POST request with automatic retry and error handling.
   */
  async post<T>(url: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { retryConfig, timeout, silent, errorMessage, ...fetchInit } = options;
    return fetchWithRetry<T>(
      buildUrl(url),
      {
        ...fetchInit,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...fetchInit.headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options,
    );
  },

  /**
   * PUT request with automatic retry and error handling.
   */
  async put<T>(url: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { retryConfig, timeout, silent, errorMessage, ...fetchInit } = options;
    return fetchWithRetry<T>(
      buildUrl(url),
      {
        ...fetchInit,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...fetchInit.headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options,
    );
  },

  /**
   * DELETE request with automatic retry and error handling.
   */
  async delete<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { retryConfig, timeout, silent, errorMessage, ...fetchInit } = options;
    return fetchWithRetry<T>(buildUrl(url), { ...fetchInit, method: 'DELETE' }, options);
  },
};

export default apiClient;
