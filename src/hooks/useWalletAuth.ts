import { useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for wallet-based authentication (NO SIWE).
 * 
 * This hook provides a simple wallet authentication flow:
 * 1. User connects wallet via RainbowKit
 * 2. We check if wallet address exists in database
 * 3. If exists, link to existing account
 * 4. If not, create new account with wallet address
 * 
 * No message signing required - avoids MetaMask SES incompatibility.
 */
export function useWalletAuth() {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { user } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Authenticate user with their wallet address
   */
  const authenticateWallet = useCallback(async (walletAddress: string) => {
    try {
      setIsAuthenticating(true);
      setError(null);

      // Check if wallet address already exists in database
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, email, wallet_address')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingUser) {
        // Wallet is already linked to an account
        if (existingUser.email) {
          // User has an email account - sign them in
          // This requires the user to be already signed in via email
          // We just verify the wallet matches
          console.log('Wallet linked to existing email account:', existingUser.email);
        } else {
          // Wallet-only account exists
          console.log('Wallet-only account found');
        }
      } else {
        // New wallet - create a wallet-only account
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            wallet_address: walletAddress.toLowerCase(),
            username: `user_${walletAddress.slice(0, 8)}`,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error creating wallet account:', insertError);
          throw insertError;
        }

        console.log('New wallet-only account created');
      }

      // Store wallet address in session storage for quick access
      sessionStorage.setItem('wallet_address', walletAddress.toLowerCase());
      sessionStorage.setItem('wallet_connected', 'true');

    } catch (err) {
      console.error('Wallet authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  /**
   * Link wallet to existing email-based account
   */
  const linkWalletToAccount = useCallback(async (walletAddress: string) => {
    if (!user?.id) {
      throw new Error('User must be logged in to link wallet');
    }

    try {
      setIsAuthenticating(true);
      setError(null);

      // Update user's wallet address
      const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress.toLowerCase() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Store in session
      sessionStorage.setItem('wallet_address', walletAddress.toLowerCase());
      sessionStorage.setItem('wallet_connected', 'true');

      console.log('Wallet linked to account successfully');
    } catch (err) {
      console.error('Error linking wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to link wallet');
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [user]);

  /**
   * Disconnect wallet and clear session
   */
  const disconnectWallet = useCallback(() => {
    disconnect();
    sessionStorage.removeItem('wallet_address');
    sessionStorage.removeItem('wallet_connected');
    setError(null);
  }, [disconnect]);

  /**
   * Auto-authenticate when wallet connects
   */
  useEffect(() => {
    if (isConnected && address && !isAuthenticating) {
      // Check if user is already logged in via email
      if (user?.id) {
        // User is logged in - check if wallet is already linked
        if (user.wallet_address?.toLowerCase() === address.toLowerCase()) {
          console.log('Wallet already linked to this account');
        } else if (!user.wallet_address) {
          // No wallet linked yet - link it
          linkWalletToAccount(address).catch(console.error);
        } else {
          // Different wallet is linked - show warning
          console.warn('Different wallet already linked to this account');
          setError('A different wallet is already linked to your account');
        }
      } else {
        // No user logged in - authenticate with wallet
        authenticateWallet(address).catch(console.error);
      }
    }
  }, [isConnected, address, user, isAuthenticating, authenticateWallet, linkWalletToAccount]);

  /**
   * Clear session when wallet disconnects
   */
  useEffect(() => {
    if (!isConnected) {
      sessionStorage.removeItem('wallet_address');
      sessionStorage.removeItem('wallet_connected');
    }
  }, [isConnected]);

  return {
    // Wallet connection state
    address,
    isConnected,
    isConnecting,
    isAuthenticating,
    
    // Actions
    authenticateWallet,
    linkWalletToAccount,
    disconnectWallet,
    
    // Error state
    error,
    clearError: () => setError(null),
  };
}
