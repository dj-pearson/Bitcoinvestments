import React, { useState } from 'react';
import { WalletConnect, TransactionImport, Web3Auth, TokenApprovalManager } from '../components/Web3';
import { useAccount } from 'wagmi';

export function Web3Features() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'import' | 'auth' | 'approvals'>('import');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Web3 Features
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet and manage blockchain features
          </p>
        </div>

        {/* Wallet Connection Section */}
        <div className="mb-8 flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Wallet Connection
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected
                ? 'Your wallet is connected'
                : 'Connect your wallet to access Web3 features'}
            </p>
          </div>
          <WalletConnect />
        </div>

        {/* Feature Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('import')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transaction Import
              </button>
              <button
                onClick={() => setActiveTab('auth')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'auth'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Web3 Authentication
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approvals'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Token Approvals
              </button>
            </nav>
          </div>
        </div>

        {/* Feature Content */}
        <div className="mb-8">
          {activeTab === 'import' && <TransactionImport />}
          {activeTab === 'auth' && <Web3Auth />}
          {activeTab === 'approvals' && <TokenApprovalManager />}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Web3 Integration Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Transaction History Import
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically import your on-chain transactions from multiple networks for
                comprehensive portfolio tracking and tax reporting.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Web3 Authentication
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in securely using your wallet with Sign-In with Ethereum (SIWE) protocol.
                No passwords needed.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Token Approval Manager
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor and revoke token approvals to protect your assets from compromised
                contracts and potential security risks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
