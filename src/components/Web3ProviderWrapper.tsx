import { useState, useEffect, type ReactNode } from 'react';
import { PageLoader } from './LoadingSkeletons';

interface Web3ProviderWrapperProps {
  children: ReactNode;
}

/**
 * Web3Provider with wallet-only authentication (NO SIWE).
 * This wrapper dynamically imports Web3 libraries to avoid module evaluation errors.
 * 
 * Authentication approach: Uses wallet address directly without SIWE message signing.
 * This avoids the SES (Secure ECMAScript) incompatibility issue with MetaMask.
 */
export function Web3ProviderWrapper({ children }: Web3ProviderWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [Web3Content, setWeb3Content] = useState<React.ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    // Dynamically import Web3 providers only in the browser
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Import Web3 dependencies dynamically to avoid SES lockdown issues
    Promise.all([
      import('wagmi'),
      import('@tanstack/react-query'),
      import('@rainbow-me/rainbowkit'),
      import('@rainbow-me/rainbowkit/styles.css'),
      import('../lib/wagmi'),
    ])
      .then(([{ WagmiProvider }, { QueryClient, QueryClientProvider }, { RainbowKitProvider }, _, { wagmiConfig }]) => {
        // Create QueryClient
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

        // Create the Web3 provider component
        const Provider: React.FC<{ children: ReactNode }> = ({ children }) => (
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={web3QueryClient}>
              <RainbowKitProvider>
                {children}
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        );

        setWeb3Content(() => Provider);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load Web3 providers:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <PageLoader message="Loading Web3..." />;
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

  if (!Web3Content) {
    return <>{children}</>;
  }

  return <Web3Content>{children}</Web3Content>;
}

export default Web3ProviderWrapper;
