import { useState, useEffect, type ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from '../lib/wagmi';

// Create a separate QueryClient for Web3 to avoid conflicts
const web3QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface Web3ProviderWrapperProps {
  children: ReactNode;
}

export function Web3ProviderWrapper({ children }: Web3ProviderWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      setHasError(true);
      setErrorMessage('Web3 features require a browser environment');
      return;
    }

    // Try to detect if Web3 libraries loaded correctly
    try {
      // Test if critical objects exist
      if (!globalThis.Buffer) {
        console.warn('Buffer polyfill not loaded');
      }
    } catch (error) {
      console.error('Web3 initialization error:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark to-black p-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Web3 Features Unavailable</h2>
          <p className="text-gray-300 mb-4">
            We're having trouble loading Web3 features. This page requires wallet connectivity.
          </p>
          {errorMessage && (
            <p className="text-sm text-gray-500 mb-4">Error: {errorMessage}</p>
          )}
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg transition-colors"
            >
              Reload Page
            </button>
            <a
              href="/"
              className="block w-full text-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={web3QueryClient}>
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  } catch (error) {
    console.error('Web3Provider render error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark to-black p-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Web3 Error</h2>
          <p className="text-gray-300 mb-4">
            Failed to initialize Web3 providers. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default Web3ProviderWrapper;
