import { Alchemy, Network, AssetTransfersCategory } from 'alchemy-sdk';

const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// Initialize Alchemy instances for different networks
const alchemyInstances = {
  ethereum: new Alchemy({
    apiKey: alchemyApiKey,
    network: Network.ETH_MAINNET,
  }),
  polygon: new Alchemy({
    apiKey: alchemyApiKey,
    network: Network.MATIC_MAINNET,
  }),
  arbitrum: new Alchemy({
    apiKey: alchemyApiKey,
    network: Network.ARB_MAINNET,
  }),
  optimism: new Alchemy({
    apiKey: alchemyApiKey,
    network: Network.OPT_MAINNET,
  }),
};

export type SupportedChain = keyof typeof alchemyInstances;

export interface TransactionData {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  asset: string | null;
  category: string;
  blockNum: string;
  timestamp: string;
  rawContract?: {
    address?: string | null;
    decimal?: string | null;
  };
}

/**
 * Fetch transaction history for a wallet address on a specific chain
 */
export async function fetchTransactionHistory(
  address: string,
  chain: SupportedChain,
  options?: {
    fromBlock?: string;
    toBlock?: string;
    maxCount?: number;
  }
): Promise<TransactionData[]> {
  const alchemy = alchemyInstances[chain];
  
  if (!alchemy) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    // Fetch asset transfers (includes ETH, ERC20, ERC721, ERC1155)
    const transfers = await alchemy.core.getAssetTransfers({
      fromAddress: address,
      category: [
        AssetTransfersCategory.EXTERNAL,
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.ERC721,
        AssetTransfersCategory.ERC1155,
      ],
      maxCount: options?.maxCount || 100,
      fromBlock: options?.fromBlock || '0x0',
      toBlock: options?.toBlock || 'latest',
    });

    const receivedTransfers = await alchemy.core.getAssetTransfers({
      toAddress: address,
      category: [
        AssetTransfersCategory.EXTERNAL,
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.ERC721,
        AssetTransfersCategory.ERC1155,
      ],
      maxCount: options?.maxCount || 100,
      fromBlock: options?.fromBlock || '0x0',
      toBlock: options?.toBlock || 'latest',
    });

    // Combine and normalize the data
    const allTransfers = [...transfers.transfers, ...receivedTransfers.transfers];
    
    return allTransfers.map((transfer) => ({
      hash: transfer.hash,
      from: transfer.from,
      to: transfer.to || null,
      value: transfer.value?.toString() || '0',
      asset: transfer.asset || null,
      category: transfer.category,
      blockNum: transfer.blockNum,
      timestamp: (transfer as unknown as { metadata?: { blockTimestamp?: string } }).metadata?.blockTimestamp || '',
      rawContract: transfer.rawContract ? {
        address: transfer.rawContract.address ?? undefined,
        decimal: transfer.rawContract.decimal ?? undefined,
      } : undefined,
    }));
  } catch (error) {
    console.error(`Error fetching transactions for ${chain}:`, error);
    throw error;
  }
}

/**
 * Fetch token balances for a wallet address
 */
export async function fetchTokenBalances(
  address: string,
  chain: SupportedChain
) {
  const alchemy = alchemyInstances[chain];
  
  if (!alchemy) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    const balances = await alchemy.core.getTokenBalances(address);
    
    // Filter out zero balances and get token metadata
    const nonZeroBalances = balances.tokenBalances.filter(
      (token) => token.tokenBalance !== '0x0'
    );

    const tokensWithMetadata = await Promise.all(
      nonZeroBalances.map(async (token) => {
        const metadata = await alchemy.core.getTokenMetadata(
          token.contractAddress
        );
        
        return {
          contractAddress: token.contractAddress,
          balance: token.tokenBalance || '0',
          name: metadata.name || 'Unknown',
          symbol: metadata.symbol || 'UNKNOWN',
          decimals: metadata.decimals || 18,
          logo: metadata.logo || null,
        };
      })
    );

    return tokensWithMetadata;
  } catch (error) {
    console.error(`Error fetching token balances for ${chain}:`, error);
    throw error;
  }
}

/**
 * Fetch native balance (ETH, MATIC, etc.)
 */
export async function fetchNativeBalance(
  address: string,
  chain: SupportedChain
) {
  const alchemy = alchemyInstances[chain];
  
  if (!alchemy) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    const balance = await alchemy.core.getBalance(address);
    return balance.toString();
  } catch (error) {
    console.error(`Error fetching native balance for ${chain}:`, error);
    throw error;
  }
}

/**
 * Fetch token approvals for a wallet address
 */
export async function fetchTokenApprovals(
  address: string,
  chain: SupportedChain
) {
  const alchemy = alchemyInstances[chain];
  
  if (!alchemy) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    // Fetch all ERC20 token transfers where the address approved a spender
    const transfers = await alchemy.core.getAssetTransfers({
      fromAddress: address,
      category: [AssetTransfersCategory.ERC20],
      maxCount: 1000,
    });

    // Extract unique contract addresses
    const contractAddresses = new Set(
      transfers.transfers
        .map((t) => t.rawContract?.address)
        .filter(Boolean)
    );

    // For each contract, we would need to check the allowance
    // This is a simplified version - full implementation would require reading allowance from contract
    return Array.from(contractAddresses).map((address) => ({
      contractAddress: address as string,
      // In a full implementation, we'd fetch the actual allowance amount
      // and spender address from the contract
    }));
  } catch (error) {
    console.error(`Error fetching token approvals for ${chain}:`, error);
    throw error;
  }
}
