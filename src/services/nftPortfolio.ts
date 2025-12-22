/**
 * NFT Portfolio Service
 *
 * Fetches and manages NFT holdings for connected wallets.
 *
 * Features:
 * - Fetch NFTs by wallet address
 * - Support for multiple chains (Ethereum, Polygon, etc.)
 * - Collection grouping and statistics
 * - Floor price tracking
 * - Rarity data integration
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  imageUrl?: string;
  animationUrl?: string;
  externalUrl?: string;
  chain: string;
  standard: 'ERC721' | 'ERC1155';
  quantity?: number;

  // Collection info
  collection: {
    name: string;
    slug?: string;
    imageUrl?: string;
    verified?: boolean;
  };

  // Metadata
  attributes?: NFTAttribute[];
  rarity?: {
    rank?: number;
    score?: number;
    total?: number;
  };

  // Pricing
  lastSalePrice?: {
    amount: number;
    currency: string;
    usdValue?: number;
  };
  floorPrice?: {
    amount: number;
    currency: string;
    usdValue?: number;
  };

  // Timestamps
  acquiredAt?: string;
  lastUpdated: string;
}

export interface NFTAttribute {
  traitType: string;
  value: string | number;
  displayType?: string;
  rarity?: number; // Percentage of items with this trait
}

export interface NFTCollection {
  contractAddress: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  verified?: boolean;
  chain: string;

  // Stats
  totalSupply?: number;
  ownedCount: number;
  floorPrice?: {
    amount: number;
    currency: string;
    usdValue?: number;
  };
  totalVolume?: number;

  // User's NFTs in this collection
  nfts: NFT[];
}

export interface NFTPortfolioSummary {
  totalNFTs: number;
  totalCollections: number;
  estimatedValue: number;
  topCollections: NFTCollection[];
  recentAcquisitions: NFT[];
  chainDistribution: { chain: string; count: number; value: number }[];
}

// Supported chains for NFT fetching
export const SUPPORTED_NFT_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH' },
  { id: 'base', name: 'Base', symbol: 'ETH' },
];

/**
 * Fetch NFTs for a wallet address
 */
export async function fetchWalletNFTs(
  walletAddress: string,
  chains: string[] = ['ethereum']
): Promise<{ nfts: NFT[]; error: string | null }> {
  try {
    // In production, you would call Alchemy/OpenSea/Moralis API
    // For now, check if we have cached data in the database

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('wallet_nfts')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .in('chain', chains)
        .order('acquired_at', { ascending: false });

      if (error && error.code !== '42P01') {
        throw error;
      }

      if (data && data.length > 0) {
        const nfts: NFT[] = data.map(mapDatabaseNFT);
        return { nfts, error: null };
      }
    }

    // Return demo data for testing
    return { nfts: getDemoNFTs(walletAddress), error: null };
  } catch (error) {
    console.error('Error fetching wallet NFTs:', error);
    return {
      nfts: [],
      error: error instanceof Error ? error.message : 'Failed to fetch NFTs',
    };
  }
}

/**
 * Get NFT collections grouped from NFTs
 */
export function groupNFTsByCollection(nfts: NFT[]): NFTCollection[] {
  const collectionsMap = new Map<string, NFTCollection>();

  for (const nft of nfts) {
    const key = `${nft.chain}:${nft.contractAddress}`;

    if (!collectionsMap.has(key)) {
      collectionsMap.set(key, {
        contractAddress: nft.contractAddress,
        name: nft.collection.name,
        slug: nft.collection.slug,
        imageUrl: nft.collection.imageUrl,
        verified: nft.collection.verified,
        chain: nft.chain,
        ownedCount: 0,
        floorPrice: nft.floorPrice,
        nfts: [],
      });
    }

    const collection = collectionsMap.get(key)!;
    collection.nfts.push(nft);
    collection.ownedCount++;

    // Update floor price if this NFT has a lower one
    if (nft.floorPrice && (!collection.floorPrice || nft.floorPrice.usdValue! < collection.floorPrice.usdValue!)) {
      collection.floorPrice = nft.floorPrice;
    }
  }

  return Array.from(collectionsMap.values()).sort((a, b) => b.ownedCount - a.ownedCount);
}

/**
 * Calculate portfolio summary
 */
export function calculateNFTPortfolioSummary(nfts: NFT[]): NFTPortfolioSummary {
  const collections = groupNFTsByCollection(nfts);

  // Calculate estimated value based on floor prices
  let estimatedValue = 0;
  for (const nft of nfts) {
    if (nft.floorPrice?.usdValue) {
      estimatedValue += nft.floorPrice.usdValue * (nft.quantity || 1);
    }
  }

  // Calculate chain distribution
  const chainCounts = new Map<string, { count: number; value: number }>();
  for (const nft of nfts) {
    const current = chainCounts.get(nft.chain) || { count: 0, value: 0 };
    current.count++;
    current.value += nft.floorPrice?.usdValue || 0;
    chainCounts.set(nft.chain, current);
  }

  const chainDistribution = Array.from(chainCounts.entries()).map(([chain, data]) => ({
    chain,
    ...data,
  }));

  // Get recent acquisitions
  const recentAcquisitions = [...nfts]
    .filter((nft) => nft.acquiredAt)
    .sort((a, b) => new Date(b.acquiredAt!).getTime() - new Date(a.acquiredAt!).getTime())
    .slice(0, 5);

  return {
    totalNFTs: nfts.length,
    totalCollections: collections.length,
    estimatedValue,
    topCollections: collections.slice(0, 5),
    recentAcquisitions,
    chainDistribution,
  };
}

/**
 * Refresh NFT data from blockchain
 */
export async function refreshNFTData(
  walletAddress: string,
  chain: string = 'ethereum'
): Promise<{ success: boolean; error: string | null }> {
  try {
    // In production, this would:
    // 1. Call Alchemy/OpenSea API to fetch fresh NFT data
    // 2. Update the database with new NFT holdings
    // 3. Fetch latest floor prices

    console.log(`Refreshing NFT data for ${walletAddress} on ${chain}`);

    // Simulated success
    return { success: true, error: null };
  } catch (error) {
    console.error('Error refreshing NFT data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh NFT data',
    };
  }
}

/**
 * Get NFT details by contract and token ID
 */
export async function getNFTDetails(
  contractAddress: string,
  tokenId: string,
  chain: string = 'ethereum'
): Promise<{ nft: NFT | null; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('wallet_nfts')
        .select('*')
        .eq('contract_address', contractAddress.toLowerCase())
        .eq('token_id', tokenId)
        .eq('chain', chain)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return { nft: mapDatabaseNFT(data), error: null };
      }
    }

    return { nft: null, error: 'NFT not found' };
  } catch (error) {
    console.error('Error fetching NFT details:', error);
    return {
      nft: null,
      error: error instanceof Error ? error.message : 'Failed to fetch NFT details',
    };
  }
}

/**
 * Map database record to NFT interface
 */
function mapDatabaseNFT(data: Record<string, unknown>): NFT {
  return {
    id: data.id as string,
    tokenId: data.token_id as string,
    contractAddress: data.contract_address as string,
    name: data.name as string,
    description: data.description as string | undefined,
    imageUrl: data.image_url as string | undefined,
    animationUrl: data.animation_url as string | undefined,
    externalUrl: data.external_url as string | undefined,
    chain: data.chain as string,
    standard: data.standard as 'ERC721' | 'ERC1155',
    quantity: data.quantity as number | undefined,
    collection: {
      name: data.collection_name as string,
      slug: data.collection_slug as string | undefined,
      imageUrl: data.collection_image as string | undefined,
      verified: data.collection_verified as boolean | undefined,
    },
    attributes: data.attributes as NFTAttribute[] | undefined,
    rarity: data.rarity as NFT['rarity'],
    lastSalePrice: data.last_sale_price as NFT['lastSalePrice'],
    floorPrice: data.floor_price as NFT['floorPrice'],
    acquiredAt: data.acquired_at as string | undefined,
    lastUpdated: data.last_updated as string,
  };
}

/**
 * Demo NFTs for testing
 */
function getDemoNFTs(walletAddress: string): NFT[] {
  void walletAddress; // Unused but needed for signature

  return [
    {
      id: 'demo-1',
      tokenId: '1234',
      contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      name: 'Bored Ape #1234',
      description: 'A unique digital collectible from the Bored Ape Yacht Club.',
      imageUrl: 'https://i.seadn.io/gae/i5dYZRkVCUK97bfprQ3WXyrT9BnLSZtVKGJlKQ919uaUB0sxbngVCioaiyu9r6snqfi2aaTyIvv6DHm4m2R3y7hMajbsv14pSZK8mhs?w=500',
      chain: 'ethereum',
      standard: 'ERC721',
      collection: {
        name: 'Bored Ape Yacht Club',
        slug: 'boredapeyachtclub',
        verified: true,
      },
      attributes: [
        { traitType: 'Background', value: 'Orange', rarity: 12.5 },
        { traitType: 'Fur', value: 'Dark Brown', rarity: 8.3 },
        { traitType: 'Eyes', value: 'Bored', rarity: 15.2 },
        { traitType: 'Clothes', value: 'Service', rarity: 3.1 },
      ],
      rarity: {
        rank: 1234,
        score: 82.5,
        total: 10000,
      },
      floorPrice: {
        amount: 28.5,
        currency: 'ETH',
        usdValue: 57000,
      },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      tokenId: '5678',
      contractAddress: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
      name: 'Mutant Ape #5678',
      description: 'A mutant ape from the MAYC collection.',
      imageUrl: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500',
      chain: 'ethereum',
      standard: 'ERC721',
      collection: {
        name: 'Mutant Ape Yacht Club',
        slug: 'mutant-ape-yacht-club',
        verified: true,
      },
      attributes: [
        { traitType: 'Background', value: 'M1 Gray', rarity: 10.2 },
        { traitType: 'Fur', value: 'M1 Noise', rarity: 6.8 },
      ],
      floorPrice: {
        amount: 5.2,
        currency: 'ETH',
        usdValue: 10400,
      },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      tokenId: '9012',
      contractAddress: '0xed5af388653567af2f388e6224dc7c4b3241c544',
      name: 'Azuki #9012',
      description: 'An Azuki from the anime-inspired collection.',
      imageUrl: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500',
      chain: 'ethereum',
      standard: 'ERC721',
      collection: {
        name: 'Azuki',
        slug: 'azuki',
        verified: true,
      },
      rarity: {
        rank: 2500,
        score: 68.3,
        total: 10000,
      },
      floorPrice: {
        amount: 8.5,
        currency: 'ETH',
        usdValue: 17000,
      },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'demo-4',
      tokenId: '42',
      contractAddress: '0x23581767a106ae21c074b2276d25e5c3e136a68b',
      name: 'Moonbird #42',
      description: 'A pixel art owl NFT from the Moonbirds collection.',
      chain: 'ethereum',
      standard: 'ERC721',
      collection: {
        name: 'Moonbirds',
        slug: 'proof-moonbirds',
        verified: true,
      },
      floorPrice: {
        amount: 1.8,
        currency: 'ETH',
        usdValue: 3600,
      },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'demo-5',
      tokenId: '777',
      contractAddress: '0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7',
      name: 'Pudgy Penguin #777',
      description: 'A cute pudgy penguin NFT.',
      chain: 'ethereum',
      standard: 'ERC721',
      collection: {
        name: 'Pudgy Penguins',
        slug: 'pudgypenguins',
        verified: true,
      },
      floorPrice: {
        amount: 12.3,
        currency: 'ETH',
        usdValue: 24600,
      },
      lastUpdated: new Date().toISOString(),
    },
  ];
}

/**
 * Format price for display
 */
export function formatNFTPrice(price?: NFT['floorPrice']): string {
  if (!price) return 'N/A';
  return `${price.amount.toLocaleString()} ${price.currency}`;
}

/**
 * Get rarity tier based on rank
 */
export function getRarityTier(rarity?: NFT['rarity']): {
  tier: string;
  color: string;
} {
  if (!rarity || !rarity.rank || !rarity.total) {
    return { tier: 'Unknown', color: '#94a3b8' };
  }

  const percentile = (rarity.rank / rarity.total) * 100;

  if (percentile <= 1) return { tier: 'Legendary', color: '#f59e0b' };
  if (percentile <= 5) return { tier: 'Epic', color: '#8b5cf6' };
  if (percentile <= 10) return { tier: 'Rare', color: '#3b82f6' };
  if (percentile <= 25) return { tier: 'Uncommon', color: '#22c55e' };
  return { tier: 'Common', color: '#94a3b8' };
}
