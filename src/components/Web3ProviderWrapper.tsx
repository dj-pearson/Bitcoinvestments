import type { ReactNode } from 'react';

interface Web3ProviderWrapperProps {
  children: ReactNode;
}

/**
 * TEMPORARILY DISABLED: Web3 features are under maintenance due to compatibility issues
 * with wallet extension security (SES/Secure ECMAScript lockdown from MetaMask).
 * 
 * The SIWE library is incompatible with the hardened JavaScript environment created
 * by wallet extensions. We're working on a solution that doesn't rely on SIWE.
 */
export function Web3ProviderWrapper(_props: Web3ProviderWrapperProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark to-black p-4">
      <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <div className="text-6xl mb-6">🔧</div>
        <h2 className="text-2xl font-bold text-white mb-4">Web3 Features Under Maintenance</h2>
        <p className="text-gray-300 mb-4 text-lg">
          We're currently upgrading our Web3 wallet integration to improve compatibility with browser wallet extensions.
        </p>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <p className="text-yellow-200 text-sm">
            <strong>Technical Note:</strong> We discovered a compatibility issue between SIWE (Sign-In with Ethereum) 
            and MetaMask's security hardening (SES). We're implementing a wallet-only authentication system that 
            doesn't require SIWE message signing.
          </p>
        </div>
        <p className="text-gray-400 mb-6">
          All other features of Bitcoinvestments (Learn, Compare, Calculators, Scam Database) are fully functional.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a
            href="/"
            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg transition-colors font-medium"
          >
            Return to Homepage
          </a>
          <a
            href="/learn"
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            Browse Educational Content
          </a>
        </div>
        <p className="text-gray-500 text-sm mt-8">
          Expected resolution: Within 24-48 hours. Thank you for your patience!
        </p>
      </div>
    </div>
  );
}

export default Web3ProviderWrapper;
