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

/**
 * Web3Provider with proper error handling for SIWE/Wagmi bundling
 * This wrapper ensures Web3 libraries only load in the browser environment
 */
export function Web3ProviderWrapper({ children }: Web3ProviderWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  // Don't render Web3 providers during SSR or initial hydration
  if (!isClient) {
    return <>{children}</>;
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark to-black p-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">⚠️ Web3 Error</h2>
          <p className="text-gray-300 mb-4">
            There was an issue loading Web3 features:
          </p>
          <pre className="text-xs text-red-400 bg-red-900/20 p-3 rounded mb-4 overflow-auto">
            {errorMessage}
          </pre>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="block w-full text-center px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg transition-colors"
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
    console.error('Web3Provider Error:', error);
    setHasError(true);
    setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export default Web3ProviderWrapper;
