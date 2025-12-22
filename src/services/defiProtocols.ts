/**
 * DeFi Protocol Integration Service
 *
 * Fetches and displays DeFi positions including:
 * - Liquidity Pool (LP) positions
 * - Staking positions
 * - Lending/borrowing positions
 * - Yield farming positions
 *
 * Supported protocols:
 * - Uniswap V2/V3
 * - Aave V2/V3
 * - Compound
 * - Lido
 * - Curve
 * - Convex
 * - MakerDAO
 */

export interface DeFiPosition {
  id: string;
  protocol: Protocol;
  type: PositionType;
  chain: string;
  tokens: TokenInfo[];
  value: {
    usd: number;
    breakdown?: Record<string, number>;
  };
  apy?: number;
  rewards?: RewardInfo[];
  health?: number; // For lending positions (1 = safe, 0 = liquidation)
  metadata: Record<string, unknown>;
  lastUpdated: string;
}

export interface Protocol {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: 'dex' | 'lending' | 'staking' | 'yield' | 'bridge';
}

export type PositionType =
  | 'liquidity_pool'
  | 'staking'
  | 'lending_supply'
  | 'lending_borrow'
  | 'yield_farming'
  | 'vault';

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: number;
  value: number;
  logo?: string;
}

export interface RewardInfo {
  token: TokenInfo;
  pending: number;
  claimable: boolean;
}

export interface DeFiPortfolioSummary {
  totalValue: number;
  totalRewards: number;
  byProtocol: { protocol: Protocol; value: number; positions: number }[];
  byType: { type: PositionType; value: number; positions: number }[];
  byChain: { chain: string; value: number; positions: number }[];
  averageApy: number;
  riskScore: number; // 0-100, lower is safer
}

// Known protocols
export const PROTOCOLS: Record<string, Protocol> = {
  uniswap_v2: {
    id: 'uniswap_v2',
    name: 'Uniswap V2',
    logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    url: 'https://app.uniswap.org',
    category: 'dex',
  },
  uniswap_v3: {
    id: 'uniswap_v3',
    name: 'Uniswap V3',
    logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    url: 'https://app.uniswap.org',
    category: 'dex',
  },
  aave_v2: {
    id: 'aave_v2',
    name: 'Aave V2',
    logo: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    url: 'https://app.aave.com',
    category: 'lending',
  },
  aave_v3: {
    id: 'aave_v3',
    name: 'Aave V3',
    logo: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    url: 'https://app.aave.com',
    category: 'lending',
  },
  compound: {
    id: 'compound',
    name: 'Compound',
    logo: 'https://cryptologos.cc/logos/compound-comp-logo.png',
    url: 'https://app.compound.finance',
    category: 'lending',
  },
  lido: {
    id: 'lido',
    name: 'Lido',
    logo: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png',
    url: 'https://lido.fi',
    category: 'staking',
  },
  curve: {
    id: 'curve',
    name: 'Curve Finance',
    logo: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png',
    url: 'https://curve.fi',
    category: 'dex',
  },
  convex: {
    id: 'convex',
    name: 'Convex Finance',
    logo: 'https://www.convexfinance.com/static/icons/svg/convex.svg',
    url: 'https://www.convexfinance.com',
    category: 'yield',
  },
  makerdao: {
    id: 'makerdao',
    name: 'MakerDAO',
    logo: 'https://cryptologos.cc/logos/maker-mkr-logo.png',
    url: 'https://oasis.app',
    category: 'lending',
  },
  eigenlayer: {
    id: 'eigenlayer',
    name: 'EigenLayer',
    logo: 'https://www.eigenlayer.xyz/icon.png',
    url: 'https://www.eigenlayer.xyz',
    category: 'staking',
  },
  rocketpool: {
    id: 'rocketpool',
    name: 'Rocket Pool',
    logo: 'https://rocketpool.net/files/reth-logo.svg',
    url: 'https://rocketpool.net',
    category: 'staking',
  },
};

// Position type labels
export const POSITION_TYPE_LABELS: Record<PositionType, string> = {
  liquidity_pool: 'Liquidity Pool',
  staking: 'Staking',
  lending_supply: 'Lending (Supply)',
  lending_borrow: 'Borrowing',
  yield_farming: 'Yield Farming',
  vault: 'Vault',
};

/**
 * Fetch all DeFi positions for a wallet
 */
export async function fetchDeFiPositions(
  walletAddress: string,
  chains: string[] = ['ethereum']
): Promise<{ positions: DeFiPosition[]; error: string | null }> {
  try {
    // In production, you would call DeFiLlama, Zapper, or individual protocol APIs
    // For now, return demo data

    const positions = getDemoPositions(walletAddress);
    const filteredPositions = positions.filter((p) => chains.includes(p.chain));

    return { positions: filteredPositions, error: null };
  } catch (error) {
    console.error('Error fetching DeFi positions:', error);
    return {
      positions: [],
      error: error instanceof Error ? error.message : 'Failed to fetch DeFi positions',
    };
  }
}

/**
 * Calculate portfolio summary from positions
 */
export function calculateDeFiSummary(positions: DeFiPosition[]): DeFiPortfolioSummary {
  const totalValue = positions.reduce((sum, p) => sum + p.value.usd, 0);
  const totalRewards = positions.reduce(
    (sum, p) => sum + (p.rewards?.reduce((r, reward) => r + reward.token.value, 0) || 0),
    0
  );

  // Group by protocol
  const protocolMap = new Map<string, { protocol: Protocol; value: number; positions: number }>();
  for (const position of positions) {
    const existing = protocolMap.get(position.protocol.id) || {
      protocol: position.protocol,
      value: 0,
      positions: 0,
    };
    existing.value += position.value.usd;
    existing.positions += 1;
    protocolMap.set(position.protocol.id, existing);
  }

  // Group by type
  const typeMap = new Map<PositionType, { type: PositionType; value: number; positions: number }>();
  for (const position of positions) {
    const existing = typeMap.get(position.type) || {
      type: position.type,
      value: 0,
      positions: 0,
    };
    existing.value += position.value.usd;
    existing.positions += 1;
    typeMap.set(position.type, existing);
  }

  // Group by chain
  const chainMap = new Map<string, { chain: string; value: number; positions: number }>();
  for (const position of positions) {
    const existing = chainMap.get(position.chain) || {
      chain: position.chain,
      value: 0,
      positions: 0,
    };
    existing.value += position.value.usd;
    existing.positions += 1;
    chainMap.set(position.chain, existing);
  }

  // Calculate weighted average APY
  let weightedApySum = 0;
  let apyWeightSum = 0;
  for (const position of positions) {
    if (position.apy !== undefined) {
      weightedApySum += position.apy * position.value.usd;
      apyWeightSum += position.value.usd;
    }
  }
  const averageApy = apyWeightSum > 0 ? weightedApySum / apyWeightSum : 0;

  // Calculate risk score (simplified)
  let riskScore = 0;
  for (const position of positions) {
    const positionWeight = position.value.usd / totalValue;
    let positionRisk = 20; // Base risk

    // Higher risk for certain position types
    if (position.type === 'lending_borrow') positionRisk += 30;
    if (position.type === 'yield_farming') positionRisk += 20;
    if (position.type === 'liquidity_pool') positionRisk += 15;

    // Health factor for lending
    if (position.health !== undefined && position.health < 1.5) {
      positionRisk += (1.5 - position.health) * 50;
    }

    riskScore += positionRisk * positionWeight;
  }

  return {
    totalValue,
    totalRewards,
    byProtocol: Array.from(protocolMap.values()).sort((a, b) => b.value - a.value),
    byType: Array.from(typeMap.values()).sort((a, b) => b.value - a.value),
    byChain: Array.from(chainMap.values()).sort((a, b) => b.value - a.value),
    averageApy,
    riskScore: Math.min(100, Math.round(riskScore)),
  };
}

/**
 * Get claimable rewards across all positions
 */
export function getClaimableRewards(positions: DeFiPosition[]): RewardInfo[] {
  const rewards: RewardInfo[] = [];

  for (const position of positions) {
    if (position.rewards) {
      for (const reward of position.rewards) {
        if (reward.claimable && reward.pending > 0) {
          rewards.push(reward);
        }
      }
    }
  }

  return rewards.sort((a, b) => b.token.value - a.token.value);
}

/**
 * Format position type for display
 */
export function formatPositionType(type: PositionType): string {
  return POSITION_TYPE_LABELS[type] || type;
}

/**
 * Get risk level color
 */
export function getRiskColor(score: number): string {
  if (score < 30) return '#22c55e'; // Green - Low risk
  if (score < 60) return '#f59e0b'; // Yellow - Medium risk
  return '#ef4444'; // Red - High risk
}

/**
 * Get health factor color
 */
export function getHealthColor(health: number): string {
  if (health >= 2) return '#22c55e'; // Safe
  if (health >= 1.5) return '#f59e0b'; // Warning
  if (health >= 1.1) return '#f97316'; // Danger
  return '#ef4444'; // Critical
}

/**
 * Demo positions for testing
 */
function getDemoPositions(walletAddress: string): DeFiPosition[] {
  void walletAddress;

  return [
    {
      id: 'lido-steth-1',
      protocol: PROTOCOLS.lido,
      type: 'staking',
      chain: 'ethereum',
      tokens: [
        {
          address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
          symbol: 'stETH',
          name: 'Lido Staked ETH',
          decimals: 18,
          amount: 5.234,
          value: 10468,
          logo: 'https://assets.coingecko.com/coins/images/13442/small/steth_logo.png',
        },
      ],
      value: { usd: 10468 },
      apy: 3.8,
      rewards: [
        {
          token: {
            address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
            symbol: 'LDO',
            name: 'Lido DAO',
            decimals: 18,
            amount: 12.5,
            value: 25,
          },
          pending: 12.5,
          claimable: true,
        },
      ],
      metadata: {},
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'aave-eth-supply-1',
      protocol: PROTOCOLS.aave_v3,
      type: 'lending_supply',
      chain: 'ethereum',
      tokens: [
        {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          amount: 2.5,
          value: 5000,
        },
      ],
      value: { usd: 5000 },
      apy: 2.1,
      metadata: { collateralEnabled: true },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'aave-usdc-borrow-1',
      protocol: PROTOCOLS.aave_v3,
      type: 'lending_borrow',
      chain: 'ethereum',
      tokens: [
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          amount: 2000,
          value: 2000,
        },
      ],
      value: { usd: 2000 },
      apy: -4.5, // Negative because borrowing costs
      health: 1.8,
      metadata: { borrowRate: 'variable' },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'uniswap-v3-eth-usdc-1',
      protocol: PROTOCOLS.uniswap_v3,
      type: 'liquidity_pool',
      chain: 'ethereum',
      tokens: [
        {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          amount: 1.2,
          value: 2400,
        },
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          amount: 2400,
          value: 2400,
        },
      ],
      value: { usd: 4800, breakdown: { WETH: 2400, USDC: 2400 } },
      apy: 15.2,
      rewards: [
        {
          token: {
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            symbol: 'UNI',
            name: 'Uniswap',
            decimals: 18,
            amount: 5.2,
            value: 31.2,
          },
          pending: 5.2,
          claimable: true,
        },
      ],
      metadata: { feeTier: 0.3, tickLower: -887220, tickUpper: 887220, inRange: true },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'curve-3pool-1',
      protocol: PROTOCOLS.curve,
      type: 'liquidity_pool',
      chain: 'ethereum',
      tokens: [
        {
          address: '0x6B175474E89094C44Da98b954EesafeEldcB4Ef8',
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
          amount: 1000,
          value: 1000,
        },
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          amount: 1000,
          value: 1000,
        },
        {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6,
          amount: 1000,
          value: 1000,
        },
      ],
      value: { usd: 3000, breakdown: { DAI: 1000, USDC: 1000, USDT: 1000 } },
      apy: 4.5,
      rewards: [
        {
          token: {
            address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
            symbol: 'CRV',
            name: 'Curve DAO Token',
            decimals: 18,
            amount: 45.3,
            value: 22.6,
          },
          pending: 45.3,
          claimable: true,
        },
      ],
      metadata: { poolName: '3pool' },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'rocketpool-reth-1',
      protocol: PROTOCOLS.rocketpool,
      type: 'staking',
      chain: 'ethereum',
      tokens: [
        {
          address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
          symbol: 'rETH',
          name: 'Rocket Pool ETH',
          decimals: 18,
          amount: 2.1,
          value: 4410,
        },
      ],
      value: { usd: 4410 },
      apy: 3.2,
      metadata: {},
      lastUpdated: new Date().toISOString(),
    },
  ];
}

/**
 * Refresh DeFi positions (re-fetch from blockchain)
 */
export async function refreshDeFiPositions(
  walletAddress: string,
  chains: string[] = ['ethereum']
): Promise<{ success: boolean; error: string | null }> {
  try {
    // In production, this would trigger a fresh fetch from on-chain data
    console.log(`Refreshing DeFi positions for ${walletAddress} on ${chains.join(', ')}`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error refreshing DeFi positions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh positions',
    };
  }
}
