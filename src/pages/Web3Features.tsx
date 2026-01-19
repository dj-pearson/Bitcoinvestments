import { useState } from 'react';
import { SEO } from '../components/SEO';
import { RelatedPages } from '../components/InternalLinks';
import { PAGE_METADATA, generateToolSchema, generateFAQSchema } from '../lib/seo';

export function Web3Features() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setWalletAddress(address);
    // Basic Ethereum address validation (0x + 40 hex characters)
    setIsValidAddress(/^0x[a-fA-F0-9]{40}$/.test(address));
  };

  const meta = PAGE_METADATA.web3;
  const web3Schema = [
    generateToolSchema({
      name: 'Web3 Wallet Tracking',
      description: meta.description,
      url: '/web3',
    }),
    generateFAQSchema([
      {
        question: 'How do I track my crypto wallet?',
        answer: 'Enter your wallet address (0x...) in the input field. We support Ethereum, Polygon, Arbitrum, and Optimism addresses for portfolio tracking.',
      },
      {
        question: 'Is my wallet address safe to share?',
        answer: 'Yes! Your wallet address is public information on the blockchain. We only use it to view your transaction history and token balances - we never have access to your private keys.',
      },
      {
        question: 'What can I do with wallet tracking?',
        answer: 'Track your portfolio value, view transaction history, monitor token holdings, and get insights into your crypto investments - all without connecting your wallet directly.',
      },
    ]),
  ];

  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        keywords={meta.keywords}
        schema={web3Schema}
      />
      <div className="min-h-screen bg-gradient-to-b from-brand-dark to-black py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Web3 Wallet Tracking
            </h1>
            <p className="text-xl text-gray-300">
              Track your crypto portfolio by entering your wallet address
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl">ℹ️</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-200 mb-2">
                  Manual Wallet Tracking
                </h3>
                <p className="text-blue-100 mb-3">
                  We've simplified wallet tracking! Instead of connecting your wallet directly, 
                  simply enter your wallet address below. This provides the same portfolio tracking 
                  capabilities without any browser extension compatibility issues.
                </p>
                <p className="text-sm text-blue-200">
                  <strong>Benefits:</strong> Works with any wallet • No MetaMask required • Faster • More reliable
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Address Input */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-8">
            <label htmlFor="wallet-address" className="block text-lg font-semibold text-white mb-4">
              Enter Your Wallet Address
            </label>
            <div className="relative">
              <input
                id="wallet-address"
                type="text"
                value={walletAddress}
                onChange={handleAddressChange}
                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent font-mono text-sm"
              />
              {walletAddress && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isValidAddress ? (
                    <span className="text-green-400 text-2xl">✓</span>
                  ) : (
                    <span className="text-red-400 text-2xl">✗</span>
                  )}
                </div>
              )}
            </div>
            {walletAddress && !isValidAddress && (
              <p className="mt-2 text-sm text-red-400">
                Please enter a valid Ethereum address (starts with 0x followed by 40 characters)
              </p>
            )}
            <button
              disabled={!isValidAddress}
              className="mt-4 w-full px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              Track This Wallet
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Portfolio Tracking
              </h3>
              <p className="text-gray-300 text-sm">
                View your complete portfolio value, token holdings, and transaction history
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Transaction History
              </h3>
              <p className="text-gray-300 text-sm">
                Browse all your transactions across multiple chains with detailed insights
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Performance Analytics
              </h3>
              <p className="text-gray-300 text-sm">
                Get detailed analytics on your crypto investment performance over time
              </p>
            </div>
          </div>

          {/* Supported Networks */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Supported Networks
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-xl">⟠</span>
                <span>Ethereum</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-xl">🟣</span>
                <span>Polygon</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-xl">🔵</span>
                <span>Arbitrum</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-xl">🔴</span>
                <span>Optimism</span>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 border-t border-white/10 pt-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <details className="bg-white/5 border border-white/10 rounded-lg p-4">
                <summary className="font-semibold text-white cursor-pointer">
                  Where do I find my wallet address?
                </summary>
                <p className="mt-3 text-gray-300 text-sm">
                  Open your crypto wallet (MetaMask, Trust Wallet, Coinbase Wallet, etc.), 
                  and copy your address. It starts with "0x" and is 42 characters long.
                </p>
              </details>

              <details className="bg-white/5 border border-white/10 rounded-lg p-4">
                <summary className="font-semibold text-white cursor-pointer">
                  Can I track multiple wallets?
                </summary>
                <p className="mt-3 text-gray-300 text-sm">
                  Yes! You can add multiple wallet addresses to track different portfolios 
                  or accounts. Each wallet will be tracked separately in your dashboard.
                </p>
              </details>

              <details className="bg-white/5 border border-white/10 rounded-lg p-4">
                <summary className="font-semibold text-white cursor-pointer">
                  Is this as secure as connecting my wallet?
                </summary>
                <p className="mt-3 text-gray-300 text-sm">
                  Yes, and in some ways even more secure! Since we never connect to your wallet directly, 
                  there's no risk of malicious transaction requests. Your wallet address is public 
                  information on the blockchain anyway - we're just reading what's already publicly visible.
                </p>
              </details>
            </div>
          </div>

          {/* Related Pages */}
          <div className="mt-12">
            <RelatedPages
              currentPath="/web3"
              title="Related Tools"
              maxItems={3}
            />
          </div>
        </div>
      </div>
    </>
  );
}
