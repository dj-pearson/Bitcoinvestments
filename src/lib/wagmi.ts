import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';
import { http } from 'wagmi';

// Get API keys from environment variables
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// Configure transports with fallbacks
const transports = {
  [mainnet.id]: http(
    alchemyApiKey 
      ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
      : 'https://eth.llamarpc.com' // Public fallback
  ),
  [polygon.id]: http(
    alchemyApiKey
      ? `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
      : 'https://polygon.llamarpc.com' // Public fallback
  ),
  [arbitrum.id]: http(
    alchemyApiKey
      ? `https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
      : 'https://arbitrum.llamarpc.com' // Public fallback
  ),
  [optimism.id]: http(
    alchemyApiKey
      ? `https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
      : 'https://optimism.llamarpc.com' // Public fallback
  ),
};

export const wagmiConfig = getDefaultConfig({
  appName: 'Bitcoin Investments',
  projectId: walletConnectProjectId,
  chains: [mainnet, polygon, arbitrum, optimism],
  transports,
  ssr: false, // If using SSR, set to true
});

// Chain configuration for Alchemy
export const alchemyConfig = {
  apiKey: alchemyApiKey,
  networks: {
    mainnet: `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
    polygon: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
    optimism: `https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  },
};

// Supported chains for the application
export const supportedChains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', type: 'evm' as const },
  { id: 137, name: 'Polygon', symbol: 'MATIC', type: 'evm' as const },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', type: 'evm' as const },
  { id: 10, name: 'Optimism', symbol: 'ETH', type: 'evm' as const },
  { id: 'solana', name: 'Solana', symbol: 'SOL', type: 'solana' as const },
];
