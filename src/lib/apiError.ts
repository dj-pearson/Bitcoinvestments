/**
 * API Error Handling Utilities
 *
 * Provides user-friendly error messages and retry logic for API calls.
 * Transforms technical errors into actionable user feedback.
 */

import { PostgrestError } from '@supabase/supabase-js';

// Error types for categorization
export type ErrorCategory =
  | 'network'
  | 'auth'
  | 'validation'
  | 'not_found'
  | 'permission'
  | 'rate_limit'
  | 'server'
  | 'unknown';

export interface ApiError {
  message: string;
  userMessage: string;
  category: ErrorCategory;
  retryable: boolean;
  originalError?: unknown;
}

// User-friendly error messages mapped by category
const USER_MESSAGES: Record<ErrorCategory, string> = {
  network: 'Unable to connect. Please check your internet connection and try again.',
  auth: 'Your session has expired. Please sign in again.',
  validation: 'The information provided is invalid. Please check and try again.',
  not_found: 'The requested resource could not be found.',
  permission: 'You don\'t have permission to perform this action.',
  rate_limit: 'Too many requests. Please wait a moment and try again.',
  server: 'Something went wrong on our end. Our team has been notified.',
  unknown: 'An unexpected error occurred. Please try again.',
};

// Common Supabase/Postgres error codes
const POSTGRES_ERROR_MAP: Record<string, { category: ErrorCategory; message: string }> = {
  '23505': { category: 'validation', message: 'This record already exists.' },
  '23503': { category: 'validation', message: 'Related record not found.' },
  '42501': { category: 'permission', message: 'Permission denied.' },
  '42P01': { category: 'server', message: 'Table not found.' },
  'PGRST116': { category: 'not_found', message: 'Record not found.' },
  'PGRST301': { category: 'auth', message: 'Authentication required.' },
  'PGRST302': { category: 'auth', message: 'Session expired.' },
};

/**
 * Categorize an error based on its type and content
 */
function categorizeError(error: unknown): ErrorCategory {
  if (!error) return 'unknown';

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'network';
  }

  // PostgrestError from Supabase
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // Check for Postgres error codes
    if (typeof err.code === 'string' && POSTGRES_ERROR_MAP[err.code]) {
      return POSTGRES_ERROR_MAP[err.code].category;
    }

    // Check for HTTP status codes
    const status = err.status || err.statusCode;
    if (typeof status === 'number') {
      if (status === 401 || status === 403) return 'auth';
      if (status === 404) return 'not_found';
      if (status === 422 || status === 400) return 'validation';
      if (status === 429) return 'rate_limit';
      if (status >= 500) return 'server';
    }

    // Check for message patterns
    const message = String(err.message || '').toLowerCase();
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('unauthorized') || message.includes('unauthenticated') || message.includes('jwt')) {
      return 'auth';
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return 'permission';
    }
  }

  return 'unknown';
}

/**
 * Transform any error into a standardized ApiError
 */
export function normalizeError(error: unknown): ApiError {
  const category = categorizeError(error);

  let technicalMessage = 'Unknown error';
  if (error instanceof Error) {
    technicalMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    technicalMessage = String(err.message || err.error || JSON.stringify(error));
  } else if (typeof error === 'string') {
    technicalMessage = error;
  }

  // Check for specific Postgres error codes for more specific messages
  let userMessage = USER_MESSAGES[category];
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.code === 'string' && POSTGRES_ERROR_MAP[err.code]) {
      userMessage = POSTGRES_ERROR_MAP[err.code].message;
    }
  }

  return {
    message: technicalMessage,
    userMessage,
    category,
    retryable: category === 'network' || category === 'rate_limit' || category === 'server',
    originalError: error,
  };
}

/**
 * Handle Supabase/Postgres errors specifically
 */
export function handleSupabaseError(error: PostgrestError | null): ApiError | null {
  if (!error) return null;
  return normalizeError(error);
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: ApiError, attempt: number) => boolean;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error) => error.retryable,
};

/**
 * Execute an async function with automatic retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, shouldRetry } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: ApiError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = normalizeError(error);

      // Don't retry if it's the last attempt or error isn't retryable
      if (attempt === maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = ApiError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Wrap an async operation to return a Result type instead of throwing
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: normalizeError(error) };
  }
}

/**
 * Create a user-friendly error message for display
 */
export function getDisplayError(error: unknown): string {
  const apiError = normalizeError(error);
  return apiError.userMessage;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const apiError = normalizeError(error);
  return apiError.retryable;
}

/**
 * Log error for debugging while returning user-friendly message
 */
export function handleError(error: unknown, context?: string): string {
  const apiError = normalizeError(error);

  // Log for debugging (in development) or to error tracking (in production)
  if (import.meta.env.DEV) {
    console.error(`[${context || 'API Error'}]`, {
      category: apiError.category,
      message: apiError.message,
      userMessage: apiError.userMessage,
      retryable: apiError.retryable,
      originalError: apiError.originalError,
    });
  }

  return apiError.userMessage;
}
