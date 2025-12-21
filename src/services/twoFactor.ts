/**
 * Two-Factor Authentication (2FA) Service
 *
 * Implements TOTP (Time-based One-Time Password) authentication
 * using the Web Crypto API for secure secret generation.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Base32 alphabet for encoding secrets
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a cryptographically secure random secret for TOTP
 */
export function generateSecret(): string {
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  return base32Encode(randomBytes);
}

/**
 * Encode bytes to Base32 (RFC 4648)
 */
function base32Encode(data: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Decode Base32 string to bytes
 */
function base32Decode(encoded: string): Uint8Array {
  const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const output = new Uint8Array(Math.floor((cleanedInput.length * 5) / 8));

  let bits = 0;
  let value = 0;
  let index = 0;

  for (const char of cleanedInput) {
    const charIndex = BASE32_ALPHABET.indexOf(char);
    if (charIndex === -1) continue;

    value = (value << 5) | charIndex;
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return output;
}

/**
 * Generate TOTP code from secret
 */
export async function generateTOTP(secret: string, timeStep = 30): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  const counterBytes = new Uint8Array(8);

  // Convert counter to big-endian bytes
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    // Use division and floor for proper bit shifting behavior
  }
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const keyData = base32Decode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verify a TOTP code
 * Allows for a window of +/- 1 time step to account for clock drift
 */
export async function verifyTOTP(
  secret: string,
  code: string,
  timeStep = 30,
  window = 1
): Promise<boolean> {
  const normalizedCode = code.replace(/\s/g, '');

  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const counter = now + i;
    const counterBytes = new Uint8Array(8);
    let temp = counter;
    for (let j = 7; j >= 0; j--) {
      counterBytes[j] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }

    try {
      const keyData = base32Decode(secret);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
      const hmac = new Uint8Array(signature);

      const offset = hmac[hmac.length - 1] & 0x0f;
      const binary =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

      const expectedCode = (binary % 1000000).toString().padStart(6, '0');

      if (expectedCode === normalizedCode) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

/**
 * Generate recovery codes (8 codes, 8 characters each)
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars

  for (let i = 0; i < 8; i++) {
    let code = '';
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);

    for (let j = 0; j < 8; j++) {
      code += characters[randomBytes[j] % characters.length];
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Generate otpauth:// URI for QR code
 */
export function generateOTPAuthURI(
  secret: string,
  email: string,
  issuer = 'BitcoinInvestments'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// Database operations

export interface TwoFactorSettings {
  is_enabled: boolean;
  secret?: string;
  recovery_codes?: string[];
  enabled_at?: string;
}

/**
 * Get 2FA settings for a user
 */
export async function getTwoFactorSettings(userId: string): Promise<TwoFactorSettings | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('two_factor_enabled, two_factor_secret, two_factor_recovery_codes, two_factor_enabled_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    is_enabled: data.two_factor_enabled || false,
    secret: data.two_factor_secret || undefined,
    recovery_codes: data.two_factor_recovery_codes || undefined,
    enabled_at: data.two_factor_enabled_at || undefined,
  };
}

/**
 * Enable 2FA for a user
 */
export async function enableTwoFactor(
  userId: string,
  secret: string,
  recoveryCodes: string[]
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Database is not configured' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      two_factor_enabled: true,
      two_factor_secret: secret,
      two_factor_recovery_codes: recoveryCodes,
      two_factor_enabled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(userId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Database is not configured' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_recovery_codes: null,
      two_factor_enabled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Verify 2FA code during login
 */
export async function verifyTwoFactorCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database is not configured' };
  }

  const settings = await getTwoFactorSettings(userId);

  if (!settings?.is_enabled || !settings.secret) {
    return { success: false, error: '2FA is not enabled for this account' };
  }

  const isValid = await verifyTOTP(settings.secret, code);

  if (isValid) {
    return { success: true, error: null };
  }

  return { success: false, error: 'Invalid verification code' };
}

/**
 * Use a recovery code (one-time use)
 */
export async function useRecoveryCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database is not configured' };
  }

  const settings = await getTwoFactorSettings(userId);

  if (!settings?.is_enabled || !settings.recovery_codes) {
    return { success: false, error: '2FA is not enabled for this account' };
  }

  const normalizedCode = code.toUpperCase().replace(/\s/g, '');
  const codeIndex = settings.recovery_codes.findIndex(c => c === normalizedCode);

  if (codeIndex === -1) {
    return { success: false, error: 'Invalid recovery code' };
  }

  // Remove the used recovery code
  const updatedCodes = [...settings.recovery_codes];
  updatedCodes.splice(codeIndex, 1);

  const { error } = await supabase
    .from('users')
    .update({
      two_factor_recovery_codes: updatedCodes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
