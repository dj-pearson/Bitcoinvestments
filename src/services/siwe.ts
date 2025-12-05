/**
 * Sign-In with Ethereum (SIWE) Service
 * Handles wallet-based authentication
 */

import { SiweMessage } from 'siwe';
import { supabase } from '../lib/supabase';
import type { InsertWalletAuthNonce } from '../types/web3-database';

/**
 * Generate a nonce for SIWE authentication
 */
export async function generateNonce(walletAddress: string): Promise<string> {
  const nonce = generateRandomNonce();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute expiry

  try {
    const { error } = await supabase
      .from('wallet_auth_nonces')
      .insert<InsertWalletAuthNonce>({
        wallet_address: walletAddress.toLowerCase(),
        nonce,
        expires_at: expiresAt.toISOString(),
      });

    if (error) throw error;
    return nonce;
  } catch (error) {
    console.error('Error generating nonce:', error);
    throw new Error('Failed to generate authentication nonce');
  }
}

/**
 * Verify a signed SIWE message
 */
export async function verifySiweMessage(
  message: string,
  signature: string
): Promise<{ valid: boolean; address?: string; error?: string }> {
  try {
    const siweMessage = new SiweMessage(message);
    const { data: fields, success } = await siweMessage.verify({ signature });

    if (!success) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Verify nonce exists and hasn't been used
    const { data: nonceData, error: nonceError } = await supabase
      .from('wallet_auth_nonces')
      .select('*')
      .eq('wallet_address', fields.address.toLowerCase())
      .eq('nonce', fields.nonce)
      .eq('used', false)
      .single();

    if (nonceError || !nonceData) {
      return { valid: false, error: 'Invalid or expired nonce' };
    }

    // Check if nonce has expired
    const expiresAt = new Date(nonceData.expires_at);
    if (expiresAt < new Date()) {
      return { valid: false, error: 'Nonce has expired' };
    }

    // Mark nonce as used
    await supabase
      .from('wallet_auth_nonces')
      .update({ used: true })
      .eq('id', nonceData.id);

    return { valid: true, address: fields.address };
  } catch (error) {
    console.error('Error verifying SIWE message:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Create or get user for wallet authentication
 */
export async function authenticateWithWallet(
  walletAddress: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if user exists with this wallet
    const { data: existingWallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('user_id')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (existingWallet) {
      // User exists, return their ID
      return { success: true, userId: existingWallet.user_id };
    }

    // Create new user with wallet
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${walletAddress.toLowerCase()}@wallet.local`,
      password: generateRandomPassword(),
      options: {
        data: {
          wallet_address: walletAddress.toLowerCase(),
          auth_method: 'wallet',
        },
      },
    });

    if (authError || !authData.user) {
      throw authError || new Error('Failed to create user');
    }

    // Save wallet to user_wallets table
    await supabase.from('user_wallets').insert({
      user_id: authData.user.id,
      wallet_address: walletAddress.toLowerCase(),
      chain: 'ethereum', // Default to ethereum
      wallet_type: 'web3',
      wallet_label: 'Primary Wallet',
    });

    return { success: true, userId: authData.user.id };
  } catch (error) {
    console.error('Error authenticating with wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Create a SIWE message for signing
 */
export function createSiweMessage(
  address: string,
  chainId: number,
  nonce: string
): string {
  const domain = window.location.host;
  const origin = window.location.origin;

  const message = new SiweMessage({
    domain,
    address,
    statement: 'Sign in to Bitcoin Investments with your Ethereum wallet',
    uri: origin,
    version: '1',
    chainId,
    nonce,
  });

  return message.prepareMessage();
}

// Helper functions
function generateRandomNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function generateRandomPassword(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
