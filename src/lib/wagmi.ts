import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';

// Get API keys from environment variables
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const wagmiConfig = getDefaultConfig({
  appName: 'Bitcoin Investments',
  projectId: walletConnectProjectId,
  chains: [mainnet, polygon, arbitrum, optimism],
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
