/**
 * Centralized Input Validation & Sanitization Library
 *
 * This module provides comprehensive validation and sanitization functions
 * to prevent XSS, SQL injection, and other security vulnerabilities.
 */

import DOMPurify from 'dompurify';

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

// ============================================================================
// DOM PURIFY HTML SANITIZATION
// ============================================================================

/**
 * DOMPurify configuration for safe HTML rendering
 * Allows basic formatting tags but removes scripts, event handlers, and dangerous content
 */
const DOMPURIFY_ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'sub', 'sup',
];

const DOMPURIFY_ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'id',
  'colspan', 'rowspan',
];

const DOMPURIFY_FORBID_TAGS = ['script', 'style', 'iframe', 'form', 'input', 'button', 'object', 'embed'];
const DOMPURIFY_FORBID_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'];

/**
 * Sanitize HTML content for safe rendering with dangerouslySetInnerHTML
 * Uses DOMPurify to remove XSS vectors while preserving safe formatting
 *
 * @param html - The HTML string to sanitize
 * @param convertNewlines - Whether to convert \n to <br/> (default: true)
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html: string, convertNewlines = true): string {
  if (!html || typeof html !== 'string') return '';

  // First convert newlines to br tags if requested
  const processed = convertNewlines ? html.replace(/\n/g, '<br/>') : html;

  // Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(processed, {
    ALLOWED_TAGS: DOMPURIFY_ALLOWED_TAGS,
    ALLOWED_ATTR: DOMPURIFY_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: DOMPURIFY_FORBID_TAGS,
    FORBID_ATTR: DOMPURIFY_FORBID_ATTR,
    ADD_ATTR: ['target'],
  });

  return sanitized;
}

/**
 * Create a safe HTML object for React's dangerouslySetInnerHTML
 * This is a convenience wrapper that returns the proper format
 *
 * @param html - The HTML string to sanitize
 * @param convertNewlines - Whether to convert \n to <br/> (default: true)
 * @returns Object with __html property containing sanitized HTML
 */
export function createSafeHtml(html: string, convertNewlines = true): { __html: string } {
  return { __html: sanitizeHtml(html, convertNewlines) };
}

// ============================================================================
// ZOD SCHEMA VALIDATION
// ============================================================================

import { z } from 'zod';

/**
 * Email validation schema with common edge cases handled
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email is too long')
  .transform((email) => email.toLowerCase().trim());

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

/**
 * Strong password schema with additional requirements for registration
 */
export const strongPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Password must contain at least one number'
  );

/**
 * Two-factor authentication code schema (6 digits)
 */
export const twoFactorCodeSchema = z
  .string()
  .length(6, 'Code must be exactly 6 digits')
  .regex(/^\d{6}$/, 'Code must contain only numbers');

/**
 * Recovery code schema (8 alphanumeric characters)
 */
export const recoveryCodeSchema = z
  .string()
  .min(8, 'Recovery code must be at least 8 characters')
  .max(10, 'Recovery code is too long')
  .transform((code) => code.toUpperCase());

/**
 * Login form schema
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * Registration form schema
 */
export const signupFormSchema = z
  .object({
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    name: z
      .string()
      .max(100, 'Name is too long')
      .regex(/^[a-zA-Z\s'-]*$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
      .transform((name) => name.trim())
      .optional()
      .or(z.literal('')),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupFormSchema>;

/**
 * Forgot password form schema
 */
export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;

/**
 * Reset password form schema
 */
export const resetPasswordFormSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  email: emailSchema,
  subject: z
    .string()
    .min(1, 'Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject is too long'),
  message: z
    .string()
    .min(1, 'Message is required')
    .min(20, 'Message must be at least 20 characters')
    .max(5000, 'Message is too long'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Support ticket form schema
 */
export const supportTicketFormSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject is too long'),
  category: z.enum(['bug', 'feature', 'account', 'billing', 'other'], {
    message: 'Please select a category',
  }),
  priority: z.enum(['low', 'medium', 'high'], {
    message: 'Please select a priority',
  }),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(10000, 'Description is too long'),
});

export type SupportTicketFormData = z.infer<typeof supportTicketFormSchema>;

/**
 * Portfolio transaction form schema
 */
export const transactionFormSchema = z.object({
  type: z.enum(['buy', 'sell', 'transfer', 'reward'], {
    message: 'Please select a transaction type',
  }),
  coinId: z.string().min(1, 'Please select a cryptocurrency'),
  amount: z
    .number({ message: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .finite('Invalid amount'),
  pricePerCoin: z
    .number({ message: 'Price must be a number' })
    .nonnegative('Price cannot be negative')
    .finite('Invalid price'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(500, 'Notes are too long').optional(),
  fee: z
    .number({ message: 'Fee must be a number' })
    .nonnegative('Fee cannot be negative')
    .optional(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

/**
 * Create portfolio form schema
 */
export const createPortfolioFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Portfolio name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long'),
  description: z.string().max(200, 'Description is too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
});

export type CreatePortfolioFormData = z.infer<typeof createPortfolioFormSchema>;

/**
 * Validate form data with a Zod schema and return structured errors
 */
export function validateWithZod<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Convert Zod errors to a simple object
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}

/**
 * Get the first error message from a Zod error
 */
export function getFirstZodError(error: z.ZodError): string {
  return error.issues[0]?.message || 'Validation failed';
}

/**
 * Check if a field has an error in the error record
 */
export function hasFieldError(
  errors: Record<string, string> | undefined,
  field: string
): boolean {
  return errors ? field in errors : false;
}

/**
 * Get error message for a specific field
 */
export function getFieldError(
  errors: Record<string, string> | undefined,
  field: string
): string | undefined {
  return errors?.[field];
}
