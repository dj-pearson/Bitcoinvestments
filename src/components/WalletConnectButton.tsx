import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletAuth } from '../hooks/useWalletAuth';

/**
 * Wallet Connect Button with automatic authentication.
 * 
 * This component uses RainbowKit's ConnectButton for the wallet connection UI
 * and our custom useWalletAuth hook for automatic authentication.
 * 
 * No SIWE signing required - just connect and go!
 */
export function WalletConnectButton() {
  const { isAuthenticating, error, clearError } = useWalletAuth();

  return (
    <div className="relative">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      disabled={isAuthenticating}
                      className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAuthenticating ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 16, height: 16 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                    >
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {/* Error notification */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
          <div className="flex items-start justify-between gap-2">
            <p>{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 transition-colors"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
