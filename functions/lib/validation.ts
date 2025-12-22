/**
 * Server-side Input Validation & Sanitization
 *
 * This module provides validation and sanitization functions
 * for Cloudflare Pages Functions (server-side).
 */

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * HTML entity encoding map
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a string by removing HTML tags and dangerous characters
 */
export function sanitizeString(input: unknown): string {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input);

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script injection patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Normalize whitespace
    .trim();
}

/**
 * Sanitize object by recursively sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Length check
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  // Check for dangerous patterns
  if (/<|>|javascript:|data:/i.test(trimmed)) {
    return { isValid: false, error: 'Invalid characters in email' };
  }

  return { isValid: true };
}

/**
 * Validate a URL
 */
export function validateUrl(url: string, options: { requireHttps?: boolean } = {}): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  try {
    const parsedUrl = new URL(trimmed);

    if (options.requireHttps && parsedUrl.protocol !== 'https:') {
      return { isValid: false, error: 'URL must use HTTPS' };
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'Invalid URL protocol' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate required field
 */
export function validateRequired(value: unknown, fieldName = 'Field'): ValidationResult {
  if (value === null || value === undefined) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[]
): ValidationResult {
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }
  return { isValid: true };
}

/**
 * Validate a positive number
 */
export function validatePositiveNumber(value: unknown, fieldName = 'Value'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (num <= 0) {
    return { isValid: false, error: `${fieldName} must be a positive number` };
  }

  return { isValid: true };
}

/**
 * Check if content contains potential XSS patterns
 */
export function containsXssPatterns(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi,
    /data:\s*text\/html/gi,
    /expression\s*\(/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(content));
}

// ============================================================================
// REQUEST VALIDATION HELPERS
// ============================================================================

/**
 * Parse and validate JSON body from request
 */
export async function parseAndValidateBody<T extends Record<string, unknown>>(
  request: Request,
  requiredFields: string[] = []
): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await request.json() as T;

    // Validate required fields
    const validation = validateRequiredFields(body, requiredFields);
    if (!validation.isValid) {
      return { data: null, error: validation.error || 'Invalid request' };
    }

    // Sanitize the body
    const sanitized = sanitizeObject(body);

    return { data: sanitized as T, error: null };
  } catch (e) {
    return { data: null, error: 'Invalid JSON body' };
  }
}

/**
 * Create a JSON error response
 */
export function jsonError(error: string, status = 400): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create a JSON success response
 */
export function jsonSuccess<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// SPECIFIC VALIDATORS
// ============================================================================

/**
 * Validate Stripe price ID
 */
export function validateStripePriceId(priceId: string, validPriceIds: string[]): ValidationResult {
  if (!priceId || typeof priceId !== 'string') {
    return { isValid: false, error: 'Price ID is required' };
  }

  // Basic Stripe price ID format check
  if (!priceId.startsWith('price_')) {
    return { isValid: false, error: 'Invalid price ID format' };
  }

  // Check against whitelist
  if (!validPriceIds.includes(priceId)) {
    return { isValid: false, error: 'Invalid price ID' };
  }

  return { isValid: true };
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string, fieldName = 'ID'): ValidationResult {
  if (!uuid || typeof uuid !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { isValid: false, error: `Invalid ${fieldName} format` };
  }

  return { isValid: true };
}

/**
 * Validate email message content
 */
export function validateEmailContent(content: {
  to: string;
  subject: string;
  html: string;
}): ValidationResult {
  // Validate recipient email
  const emailResult = validateEmail(content.to);
  if (!emailResult.isValid) {
    return emailResult;
  }

  // Validate subject
  if (!content.subject || content.subject.trim().length === 0) {
    return { isValid: false, error: 'Subject is required' };
  }

  if (content.subject.length > 500) {
    return { isValid: false, error: 'Subject is too long' };
  }

  // Validate HTML content
  if (!content.html || content.html.trim().length === 0) {
    return { isValid: false, error: 'Email content is required' };
  }

  if (content.html.length > 100000) {
    return { isValid: false, error: 'Email content is too long' };
  }

  return { isValid: true };
}
