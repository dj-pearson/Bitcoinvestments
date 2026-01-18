import { type ReactNode } from 'react';

interface Web3ProviderWrapperProps {
  children: ReactNode;
}

/**
 * TEMPORARY FIX: Web3/SIWE bundling issues in production
 * Disabling Web3 provider until the bundling issues are resolved
 */
export function Web3ProviderWrapper({ children: _children }: Web3ProviderWrapperProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark to-black p-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">🔧 Maintenance</h2>
        <p className="text-gray-300 mb-4">
          Web3 wallet features are temporarily unavailable while we resolve a technical issue.
        </p>
        <p className="text-sm text-gray-400 mb-4">
          All other features of the platform are fully functional. We apologize for the inconvenience.
        </p>
        <a
          href="/"
          className="block w-full text-center px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg transition-colors"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}

export default Web3ProviderWrapper;
