import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { generateNonce, createSiweMessage, verifySiweMessage, authenticateWithWallet } from '../../services/siwe';
import { LogIn, Loader } from 'lucide-react';

interface Web3AuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function Web3Auth({ onSuccess, onError }: Web3AuthProps) {
  const { address, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSignIn() {
    if (!address || !chain) {
      const errorMsg = 'Please connect your wallet first';
      setMessage({ type: 'error', text: errorMsg });
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Generate nonce
      const nonce = await generateNonce(address);

      // Create SIWE message
      const siweMessage = createSiweMessage(address, chain.id, nonce);

      // Request signature
      const signature = await signMessageAsync({ message: siweMessage });

      // Verify signature
      const verification = await verifySiweMessage(siweMessage, signature);

      if (!verification.valid) {
        throw new Error(verification.error || 'Signature verification failed');
      }

      // Authenticate with wallet
      const authResult = await authenticateWithWallet(address);

      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      setMessage({ type: 'success', text: 'Successfully signed in with wallet!' });
      onSuccess?.();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to sign in';
      console.error('Web3 auth error:', error);
      setMessage({ type: 'error', text: errorMsg });
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="web3-auth p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center gap-3 mb-6">
        <LogIn className="text-blue-600" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sign In with Wallet
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign a message with your wallet to authenticate
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {!address && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg mb-4">
          Please connect your wallet first
        </div>
      )}

      {address && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Wallet Address
            </div>
            <div className="font-mono text-sm text-gray-900 dark:text-white break-all">
              {address}
            </div>
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In with Wallet
              </>
            )}
          </button>

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By signing in, you agree to create an account and link your wallet address
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          How it works
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Connect your wallet using the Connect Wallet button</li>
          <li>• Sign a message to verify ownership of your wallet</li>
          <li>• Your wallet will be linked to your account</li>
          <li>• No gas fees - signing is free!</li>
          <li>• Uses industry-standard Sign-In with Ethereum (SIWE)</li>
        </ul>
      </div>
    </div>
  );
}
