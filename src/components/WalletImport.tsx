import { useState, useEffect } from 'react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, Download, Check, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Portfolio } from '../types';
import { addHolding, updatePortfolioPrices } from '../services/portfolio';

interface WalletImportProps {
  portfolio: Portfolio;
  onUpdate: (portfolio: Portfolio) => void;
  onClose?: () => void;
}

// Map of common tokens on Ethereum mainnet
const SUPPORTED_TOKENS = [
  { 
    id: 'ethereum', 
    symbol: 'ETH', 
    name: 'Ethereum',
    isNative: true 
  },
  // Add more ERC-20 tokens as needed
];

export function WalletImport({ portfolio, onUpdate, onClose }: WalletImportProps) {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());

  // Get ETH balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: address,
  });

  const availableTokens = [
    ...(ethBalance && ethBalance.value > 0n ? [{
      id: 'ethereum',
      symbol: ethBalance.symbol,
      name: 'Ethereum',
      balance: parseFloat(ethBalance.formatted),
      value: ethBalance.formatted,
    }] : []),
  ];

  useEffect(() => {
    // Reset imported state when wallet changes
    setImported(false);
    setSelectedTokens(new Set());
  }, [address]);

  const toggleToken = (tokenId: string) => {
    const newSet = new Set(selectedTokens);
    if (newSet.has(tokenId)) {
      newSet.delete(tokenId);
    } else {
      newSet.add(tokenId);
    }
    setSelectedTokens(newSet);
  };

  const handleImport = async () => {
    if (selectedTokens.size === 0) {
      alert('Please select at least one token to import');
      return;
    }

    setImporting(true);
    
    try {
      let updatedPortfolio = portfolio;

      // Import selected tokens
      for (const token of availableTokens) {
        if (selectedTokens.has(token.id)) {
          // Get current price (will be fetched from CoinGecko)
          const currentPrice = 0; // Will be updated by updatePortfolioPrices

          updatedPortfolio = await addHolding(
            updatedPortfolio,
            token.id,
            token.symbol,
            token.name,
            token.balance,
            currentPrice, // Use 0 as purchase price since we don't know it
            new Date().toISOString().split('T')[0]
          );
        }
      }

      // Update all prices
      const withPrices = await updatePortfolioPrices(updatedPortfolio);
      onUpdate(withPrices);
      
      setImported(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error importing wallet holdings:', error);
      alert('Failed to import wallet holdings. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Wallet className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Import from Wallet</h4>
            <p className="text-xs text-gray-400">
              Connect your wallet to import holdings automatically
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-6 space-y-4">
          <p className="text-sm text-gray-400">
            Connect your wallet to view and import your cryptocurrency holdings
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected wallet info */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Connected Wallet</p>
              <button
                onClick={() => disconnect()}
                className="text-xs text-red-400 hover:underline"
              >
                Disconnect
              </button>
            </div>
            <p className="text-sm font-mono text-white">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {chain?.name || 'Unknown Network'}
            </p>
          </div>

          {/* Token list */}
          {ethLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : availableTokens.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-gray-400">
                No native tokens found in this wallet
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-left">
                <p className="text-xs text-blue-300 font-medium mb-1">
                  ℹ️ Currently Supported Tokens:
                </p>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li>• Native ETH (Ethereum)</li>
                  <li>• Native MATIC (Polygon)</li>
                  <li>• Native ETH (Arbitrum, Optimism)</li>
                </ul>
                <p className="text-xs text-blue-400 mt-2">
                  ERC-20 tokens (USDC, USDT, etc.) will be supported soon!
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-300 font-medium mb-1">
                  ℹ️ Token Detection
                </p>
                <p className="text-xs text-blue-200">
                  Currently showing: <strong>Native tokens only</strong> (ETH, MATIC).
                  ERC-20 tokens (USDC, USDT, WBTC, etc.) are not yet detected.
                  You can still add them manually after importing.
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Select tokens to import:
                </p>
                {availableTokens.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => toggleToken(token.id)}
                    disabled={importing || imported}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                      selectedTokens.has(token.id)
                        ? 'bg-orange-500/20 border border-orange-500'
                        : 'bg-white/5 hover:bg-white/10',
                      (importing || imported) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        selectedTokens.has(token.id)
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-600'
                      )}>
                        {selectedTokens.has(token.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">
                          {token.name} ({token.symbol})
                        </p>
                        <p className="text-xs text-gray-400">
                          {token.balance.toFixed(6)} {token.symbol}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {imported ? (
                <div className="flex items-center justify-center gap-2 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Successfully imported!</span>
                </div>
              ) : (
                <button
                  onClick={handleImport}
                  disabled={selectedTokens.size === 0 || importing}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                    selectedTokens.size === 0 || importing
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  )}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>
                        Import {selectedTokens.size} {selectedTokens.size === 1 ? 'Token' : 'Tokens'}
                      </span>
                    </>
                  )}
                </button>
              )}

              <p className="text-xs text-gray-500 text-center">
                Note: Purchase price will be set to $0 since we don't know your original cost basis.
                You can edit holdings later to add accurate purchase prices.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Standalone modal version
export function WalletImportModal({
  open,
  portfolio,
  onUpdate,
  onClose,
}: {
  open: boolean;
  portfolio: Portfolio;
  onUpdate: (portfolio: Portfolio) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md p-6">
        <WalletImport portfolio={portfolio} onUpdate={onUpdate} onClose={onClose} />
      </div>
    </div>
  );
}

