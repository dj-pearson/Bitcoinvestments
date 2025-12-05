import type { ChainGasInfo, GasPrice, SupportedChain } from '../types';

// Chain configurations with RPC endpoints and metadata
const CHAIN_CONFIG: Record<
  SupportedChain,
  {
    chainId: number;
    chainName: string;
    symbol: string;
    rpcUrl: string;
    coingeckoId: string;
    gasUnits: {
      transfer: number;
      swap: number;
      nftMint: number;
    };
  }
> = {
  ethereum: {
    chainId: 1,
    chainName: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    coingeckoId: 'ethereum',
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  polygon: {
    chainId: 137,
    chainName: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon.llamarpc.com',
    coingeckoId: 'matic-network',
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  arbitrum: {
    chainId: 42161,
    chainName: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arbitrum.llamarpc.com',
    coingeckoId: 'ethereum',
    gasUnits: { transfer: 21000, swap: 300000, nftMint: 200000 },
  },
  optimism: {
    chainId: 10,
    chainName: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://optimism.llamarpc.com',
    coingeckoId: 'ethereum',
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  bsc: {
    chainId: 56,
    chainName: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    coingeckoId: 'binancecoin',
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  avalanche: {
    chainId: 43114,
    chainName: 'Avalanche C-Chain',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    coingeckoId: 'avalanche-2',
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  base: {
    chainId: 8453,
    chainName: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    coingeckoId: 'ethereum',
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
};

// Cache for gas prices and token prices
const gasCache = new Map<string, { data: ChainGasInfo; timestamp: number }>();
const priceCache = new Map<string, { price: number; timestamp: number }>();
const GAS_CACHE_DURATION = 15000; // 15 seconds for gas prices
const PRICE_CACHE_DURATION = 60000; // 1 minute for token prices

/**
 * Make an RPC call to fetch gas price
 */
async function rpcCall(
  rpcUrl: string,
  method: string,
  params: unknown[] = []
): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.result;
}

/**
 * Convert wei to gwei
 */
function weiToGwei(wei: string): number {
  const weiNum = parseInt(wei, 16);
  return weiNum / 1e9;
}

/**
 * Fetch native token price from CoinGecko
 */
async function getTokenPrice(coingeckoId: string): Promise<number> {
  const cached = priceCache.get(coingeckoId);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_DURATION) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch token price');
    }

    const data = await response.json();
    const price = data[coingeckoId]?.usd || 0;

    priceCache.set(coingeckoId, { price, timestamp: Date.now() });
    return price;
  } catch (error) {
    console.error(`Error fetching price for ${coingeckoId}:`, error);
    // Return cached price even if expired, or 0
    return cached?.price || 0;
  }
}

/**
 * Calculate estimated cost in USD
 */
function calculateCost(
  gasPrice: number, // in gwei
  gasUnits: number,
  tokenPrice: number
): number {
  const gasCostInToken = (gasPrice * gasUnits) / 1e9;
  return gasCostInToken * tokenPrice;
}

/**
 * Fetch gas price for a specific chain
 */
export async function getGasPriceForChain(
  chain: SupportedChain
): Promise<ChainGasInfo> {
  const cacheKey = chain;
  const cached = gasCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < GAS_CACHE_DURATION) {
    return cached.data;
  }

  const config = CHAIN_CONFIG[chain];

  try {
    // Fetch gas price and token price in parallel
    const [gasPriceHex, tokenPrice] = await Promise.all([
      rpcCall(config.rpcUrl, 'eth_gasPrice'),
      getTokenPrice(config.coingeckoId),
    ]);

    const gasPriceGwei = weiToGwei(gasPriceHex);

    // Try to get fee history for more accurate estimates (EIP-1559 chains)
    let baseFee: number | undefined;
    let low = gasPriceGwei * 0.8;
    let average = gasPriceGwei;
    let high = gasPriceGwei * 1.2;
    let instant = gasPriceGwei * 1.5;

    try {
      const feeHistory = await rpcCall(config.rpcUrl, 'eth_feeHistory', [
        '0x4', // 4 blocks
        'latest',
        [10, 50, 90], // percentiles
      ]);

      if (feeHistory) {
        const parsed = feeHistory as unknown as {
          baseFeePerGas: string[];
          reward: string[][];
        };

        if (parsed.baseFeePerGas && parsed.baseFeePerGas.length > 0) {
          baseFee = weiToGwei(parsed.baseFeePerGas[parsed.baseFeePerGas.length - 1]);

          // Calculate priority fees from rewards
          if (parsed.reward && parsed.reward.length > 0) {
            const latestRewards = parsed.reward[parsed.reward.length - 1];
            if (latestRewards && latestRewards.length >= 3) {
              const lowPriority = weiToGwei(latestRewards[0]);
              const avgPriority = weiToGwei(latestRewards[1]);
              const highPriority = weiToGwei(latestRewards[2]);

              low = baseFee + lowPriority;
              average = baseFee + avgPriority;
              high = baseFee + highPriority;
              instant = baseFee + highPriority * 1.5;
            }
          }
        }
      }
    } catch {
      // Some chains don't support eth_feeHistory, use fallback values
      console.debug(`Chain ${chain} doesn't support eth_feeHistory, using estimates`);
    }

    const gasPrice: GasPrice = {
      low: Math.round(low * 100) / 100,
      average: Math.round(average * 100) / 100,
      high: Math.round(high * 100) / 100,
      instant: Math.round(instant * 100) / 100,
      baseFee: baseFee ? Math.round(baseFee * 100) / 100 : undefined,
      lastUpdated: new Date().toISOString(),
    };

    const chainGasInfo: ChainGasInfo = {
      chainId: config.chainId,
      chainName: config.chainName,
      symbol: config.symbol,
      gasPrice,
      nativeTokenPrice: tokenPrice,
      estimatedCosts: {
        transfer: Math.round(calculateCost(average, config.gasUnits.transfer, tokenPrice) * 100) / 100,
        swap: Math.round(calculateCost(average, config.gasUnits.swap, tokenPrice) * 100) / 100,
        nftMint: Math.round(calculateCost(average, config.gasUnits.nftMint, tokenPrice) * 100) / 100,
      },
    };

    gasCache.set(cacheKey, { data: chainGasInfo, timestamp: Date.now() });
    return chainGasInfo;
  } catch (error) {
    console.error(`Error fetching gas price for ${chain}:`, error);

    // Return cached data if available, even if expired
    if (cached) {
      return cached.data;
    }

    // Return default values as fallback
    return {
      chainId: config.chainId,
      chainName: config.chainName,
      symbol: config.symbol,
      gasPrice: {
        low: 0,
        average: 0,
        high: 0,
        lastUpdated: new Date().toISOString(),
      },
      estimatedCosts: {
        transfer: 0,
        swap: 0,
        nftMint: 0,
      },
    };
  }
}

/**
 * Fetch gas prices for all supported chains
 */
export async function getAllGasPrices(): Promise<ChainGasInfo[]> {
  const chains: SupportedChain[] = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'bsc',
    'avalanche',
    'base',
  ];

  const results = await Promise.allSettled(
    chains.map(chain => getGasPriceForChain(chain))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<ChainGasInfo> =>
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

/**
 * Get supported chains list
 */
export function getSupportedChains(): { id: SupportedChain; name: string; symbol: string }[] {
  return Object.entries(CHAIN_CONFIG).map(([id, config]) => ({
    id: id as SupportedChain,
    name: config.chainName,
    symbol: config.symbol,
  }));
}

/**
 * Get gas price recommendation based on urgency
 */
export function getGasRecommendation(
  gasPrice: GasPrice,
  urgency: 'low' | 'medium' | 'high' | 'instant'
): { price: number; waitTime: string } {
  switch (urgency) {
    case 'low':
      return { price: gasPrice.low, waitTime: '~10 minutes' };
    case 'medium':
      return { price: gasPrice.average, waitTime: '~3 minutes' };
    case 'high':
      return { price: gasPrice.high, waitTime: '~30 seconds' };
    case 'instant':
      return { price: gasPrice.instant || gasPrice.high * 1.5, waitTime: 'Next block' };
    default:
      return { price: gasPrice.average, waitTime: '~3 minutes' };
  }
}

/**
 * Format gas price for display
 */
export function formatGasPrice(gwei: number): string {
  if (gwei < 0.01) {
    return '<0.01';
  }
  if (gwei < 1) {
    return gwei.toFixed(3);
  }
  if (gwei < 10) {
    return gwei.toFixed(2);
  }
  return Math.round(gwei).toString();
}

/**
 * Get chain icon/color for UI
 */
export function getChainStyle(chain: SupportedChain): { color: string; bgColor: string } {
  const styles: Record<SupportedChain, { color: string; bgColor: string }> = {
    ethereum: { color: '#627EEA', bgColor: 'rgba(98, 126, 234, 0.1)' },
    polygon: { color: '#8247E5', bgColor: 'rgba(130, 71, 229, 0.1)' },
    arbitrum: { color: '#28A0F0', bgColor: 'rgba(40, 160, 240, 0.1)' },
    optimism: { color: '#FF0420', bgColor: 'rgba(255, 4, 32, 0.1)' },
    bsc: { color: '#F0B90B', bgColor: 'rgba(240, 185, 11, 0.1)' },
    avalanche: { color: '#E84142', bgColor: 'rgba(232, 65, 66, 0.1)' },
    base: { color: '#0052FF', bgColor: 'rgba(0, 82, 255, 0.1)' },
  };

  return styles[chain] || { color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' };
}

/**
 * Clear gas price cache
 */
export function clearGasCache(): void {
  gasCache.clear();
  priceCache.clear();
}
