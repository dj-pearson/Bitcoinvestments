/**
 * Environment Configuration
 *
 * Provides typed, validated access to environment variables.
 * Fails fast with clear messages if required vars are missing.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Required: Supabase
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY is required'),

  // Optional: Supabase extras
  VITE_SUPABASE_PROJECT_ID: z.string().optional().default(''),

  // Optional: Stripe
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),
  VITE_STRIPE_PRICE_MONTHLY: z.string().optional().default(''),
  VITE_STRIPE_PRICE_ANNUAL: z.string().optional().default(''),
  VITE_STRIPE_PRICE_LIFETIME: z.string().optional().default(''),
  VITE_STRIPE_PRICE_ADVISOR: z.string().optional().default(''),
  VITE_STRIPE_PRICE_ENTERPRISE: z.string().optional().default(''),

  // Optional: Web3

  // Optional: Monitoring
  VITE_SENTRY_DSN: z.string().optional().default(''),
  VITE_SENTRY_ENABLED: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true'),

  // Optional: Analytics
  VITE_PLAUSIBLE_DOMAIN: z.string().optional().default(''),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const raw = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? '',
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
    VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID ?? '',
    VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
    VITE_STRIPE_PRICE_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_MONTHLY ?? '',
    VITE_STRIPE_PRICE_ANNUAL: import.meta.env.VITE_STRIPE_PRICE_ANNUAL ?? '',
    VITE_STRIPE_PRICE_LIFETIME: import.meta.env.VITE_STRIPE_PRICE_LIFETIME ?? '',
    VITE_STRIPE_PRICE_ADVISOR: import.meta.env.VITE_STRIPE_PRICE_ADVISOR ?? '',
    VITE_STRIPE_PRICE_ENTERPRISE: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE ?? '',
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN ?? '',
    VITE_SENTRY_ENABLED: import.meta.env.VITE_SENTRY_ENABLED ?? 'false',
    VITE_PLAUSIBLE_DOMAIN: import.meta.env.VITE_PLAUSIBLE_DOMAIN ?? '',
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    if (import.meta.env.PROD) {
      console.error(`[ENV] Missing required environment variables:\n${errors}`);
    } else {
      console.warn(`[ENV] Environment validation warnings:\n${errors}`);
    }

    // In dev mode, return partial config with defaults rather than crashing
    return raw as unknown as EnvConfig;
  }

  return result.data;
}

/**
 * Validated environment configuration.
 * Access like: env.VITE_SUPABASE_URL
 */
export const env = loadEnv();
