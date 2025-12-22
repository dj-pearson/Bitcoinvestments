/**
 * Centralized Input Validation & Sanitization Library
 *
 * This module provides comprehensive validation and sanitization functions
 * to prevent XSS, SQL injection, and other security vulnerabilities.
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
 * Sanitize input for safe display (preserves structure but escapes HTML)
 */
export function sanitizeForDisplay(input: unknown): string {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input);

  return escapeHtml(input.trim());
}

/**
 * Sanitize a URL to prevent javascript: and data: schemes
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http, https, mailto, and tel protocols
  const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:', '/'];
  const hasAllowedProtocol = allowedProtocols.some((p) => trimmed.startsWith(p));

  if (!hasAllowedProtocol && !trimmed.startsWith('#')) {
    // If no protocol, assume it's a relative path
    if (url.includes(':')) {
      return ''; // Unknown protocol
    }
  }

  return url.trim();
}

/**
 * Strip all HTML from a string
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
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
          : typeof item === 'object'
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
 * Validate password strength
 */
export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}

export function validatePassword(
  password: string,
  options: PasswordValidationOptions = {}
): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options;

  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain an uppercase letter' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain a lowercase letter' };
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain a number' };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain a special character' };
  }

  return { isValid: true };
}

/**
 * Validate a username
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters' };
  }

  // Only allow alphanumeric, underscore, hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
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
 * Validate a phone number (basic international format)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().]/g, '');

  // Check for valid phone format (with optional country code)
  if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
    return { isValid: false, error: 'Invalid phone number format' };
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
 * Validate a non-negative number (including zero)
 */
export function validateNonNegativeNumber(value: unknown, fieldName = 'Value'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (num < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }

  return { isValid: true };
}

/**
 * Validate a cryptocurrency amount
 */
export function validateCryptoAmount(amount: unknown): ValidationResult {
  const result = validatePositiveNumber(amount, 'Amount');
  if (!result.isValid) return result;

  const num = typeof amount === 'string' ? parseFloat(amount) : (amount as number);

  // Check for reasonable precision (up to 18 decimals for most cryptos)
  const decimalPlaces = (num.toString().split('.')[1] || '').length;
  if (decimalPlaces > 18) {
    return { isValid: false, error: 'Too many decimal places' };
  }

  return { isValid: true };
}

/**
 * Validate a cryptocurrency address (basic format check)
 */
export function validateCryptoAddress(address: string, chain?: string): ValidationResult {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required' };
  }

  const trimmed = address.trim();

  // Check for dangerous characters
  if (/<|>|javascript:|data:|&|\s/i.test(trimmed)) {
    return { isValid: false, error: 'Invalid characters in address' };
  }

  // Chain-specific validation
  if (chain) {
    const lowerChain = chain.toLowerCase();

    if (lowerChain === 'ethereum' || lowerChain === 'eth') {
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        return { isValid: false, error: 'Invalid Ethereum address format' };
      }
    } else if (lowerChain === 'bitcoin' || lowerChain === 'btc') {
      // Basic Bitcoin address validation (legacy, SegWit, Bech32)
      if (!/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed)) {
        return { isValid: false, error: 'Invalid Bitcoin address format' };
      }
    }
  }

  // Generic validation: reasonable length and characters
  if (trimmed.length < 20 || trimmed.length > 100) {
    return { isValid: false, error: 'Invalid address length' };
  }

  return { isValid: true };
}

/**
 * Validate a date string
 */
export function validateDate(dateStr: string, options: { allowFuture?: boolean; allowPast?: boolean } = {}): ValidationResult {
  const { allowFuture = true, allowPast = true } = options;

  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'Date is required' };
  }

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  const now = new Date();

  if (!allowFuture && date > now) {
    return { isValid: false, error: 'Date cannot be in the future' };
  }

  if (!allowPast && date < now) {
    return { isValid: false, error: 'Date cannot be in the past' };
  }

  return { isValid: true };
}

/**
 * Validate required text field
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
 * Validate text length
 */
export function validateLength(
  value: string,
  options: { min?: number; max?: number; fieldName?: string } = {}
): ValidationResult {
  const { min = 0, max = Infinity, fieldName = 'Field' } = options;

  if (!value || typeof value !== 'string') {
    if (min > 0) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  }

  const trimmed = value.trim();

  if (trimmed.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` };
  }

  if (trimmed.length > max) {
    return { isValid: false, error: `${fieldName} must be less than ${max} characters` };
  }

  return { isValid: true };
}

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

/**
 * Validate multiple fields and return all errors
 */
export interface FieldValidation {
  field: string;
  value: unknown;
  validate: (value: unknown) => ValidationResult;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateForm(validations: FieldValidation[]): FormValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const { field, value, validate } of validations) {
    const result = validate(value);
    if (!result.isValid && result.error) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

// ============================================================================
// API REQUEST VALIDATION
// ============================================================================

/**
 * Validate and sanitize API request body
 */
export function sanitizeRequestBody<T extends Record<string, unknown>>(body: T): T {
  return sanitizeObject(body);
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

// ============================================================================
// CONTENT SECURITY
// ============================================================================

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
    /url\s*\(/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(content));
}

/**
 * Validate and sanitize user-generated content
 */
export function validateUserContent(
  content: string,
  options: { maxLength?: number; allowHtml?: boolean } = {}
): ValidationResult & { sanitized?: string } {
  const { maxLength = 10000, allowHtml = false } = options;

  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Content is required' };
  }

  if (content.length > maxLength) {
    return { isValid: false, error: `Content exceeds maximum length of ${maxLength} characters` };
  }

  if (!allowHtml && containsXssPatterns(content)) {
    return { isValid: false, error: 'Content contains invalid characters or patterns' };
  }

  const sanitized = allowHtml ? content : sanitizeString(content);

  return { isValid: true, sanitized };
}
