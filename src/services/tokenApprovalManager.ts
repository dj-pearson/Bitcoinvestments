/**
 * Token Approval Manager Service
 *
 * Helps users manage and revoke ERC20 token approvals for better security.
 *
 * Features:
 * - Fetch all token approvals for an address
 * - Identify risky approvals (unlimited, unknown protocols)
 * - Revoke approvals via wallet
 * - Risk scoring for approvals
 */

import { isSupabaseConfigured, db } from '../lib/supabase';

export interface TokenApproval {
  id: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenLogo?: string;
  spenderAddress: string;
  spenderName: string | null;
  spenderLogo?: string;
  allowance: string;
  allowanceFormatted: string;
  isUnlimited: boolean;
  approvalTxHash?: string;
  approvedAt?: string;
  lastUsedAt?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskReasons: string[];
  chain: string;
}

export interface ApprovalSummary {
  totalApprovals: number;
  unlimitedApprovals: number;
  highRiskApprovals: number;
  totalValueAtRisk: number;
  riskScore: number; // 0-100
}

// Known safe protocols (mainnet addresses)
const KNOWN_PROTOCOLS: Record<string, { name: string; logo?: string; safe: boolean }> = {
  // DEXes
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', safe: true },
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap Universal Router', safe: true },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', safe: true },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { name: 'SushiSwap Router', safe: true },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { name: '0x Exchange Proxy', safe: true },
  '0x1111111254fb6c44bac0bed2854e76f90643097d': { name: '1inch V4 Router', safe: true },
  '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch V5 Router', safe: true },

  // Lending
  '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': { name: 'Aave V2 Lending Pool', safe: true },
  '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': { name: 'Aave V3 Pool', safe: true },
  '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b': { name: 'Compound Comptroller', safe: true },

  // NFT Marketplaces
  '0x00000000006c3852cbef3e08e8df289169ede581': { name: 'OpenSea Seaport 1.1', safe: true },
  '0x00000000000001ad428e4906ae43d8f9852d0dd6': { name: 'OpenSea Seaport 1.4', safe: true },
  '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3': { name: 'X2Y2', safe: true },
  '0x59728544b08ab483533076417fbbb2fd0b17556e': { name: 'LooksRare Exchange', safe: true },

  // Bridges
  '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': { name: 'Optimism Gateway', safe: true },
  '0xa3a7b6f88361f48403514059f1f16c8e78d60eec': { name: 'Arbitrum Gateway', safe: true },

  // Staking
  '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': { name: 'Lido stETH', safe: true },
  '0x1a8caf36d7a7ad31e18eae3e3c3d15e9c1e65e4e': { name: 'Rocket Pool', safe: true },
};

// Maximum "safe" approval amount (in base units)
const MAX_SAFE_APPROVAL = BigInt('1000000000000000000000000'); // 1M tokens

/**
 * Get known protocol info
 */
export function getKnownProtocol(address: string): { name: string; logo?: string; safe: boolean } | null {
  return KNOWN_PROTOCOLS[address.toLowerCase()] || null;
}

/**
 * Calculate risk level for an approval
 */
export function calculateApprovalRisk(approval: Omit<TokenApproval, 'riskLevel' | 'riskReasons'>): {
  riskLevel: TokenApproval['riskLevel'];
  riskReasons: string[];
} {
  const reasons: string[] = [];
  let riskScore = 0;

  // Check if spender is known
  const knownProtocol = getKnownProtocol(approval.spenderAddress);
  if (!knownProtocol) {
    reasons.push('Unknown spender contract');
    riskScore += 30;
  } else if (!knownProtocol.safe) {
    reasons.push('Spender flagged as potentially risky');
    riskScore += 50;
  }

  // Check if unlimited approval
  if (approval.isUnlimited) {
    reasons.push('Unlimited approval amount');
    riskScore += 25;
  }

  // Check allowance amount
  try {
    const allowance = BigInt(approval.allowance);
    if (allowance > MAX_SAFE_APPROVAL && !approval.isUnlimited) {
      reasons.push('Very large approval amount');
      riskScore += 15;
    }
  } catch {
    // Invalid allowance format
  }

  // Check if approval is old and unused
  if (approval.approvedAt) {
    const approvalDate = new Date(approval.approvedAt);
    const daysSinceApproval = (Date.now() - approvalDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceApproval > 365) {
      reasons.push('Approval is over 1 year old');
      riskScore += 10;
    } else if (daysSinceApproval > 180) {
      reasons.push('Approval is over 6 months old');
      riskScore += 5;
    }
  }

  // Determine risk level based on score
  let riskLevel: TokenApproval['riskLevel'];
  if (riskScore >= 60) {
    riskLevel = 'critical';
  } else if (riskScore >= 40) {
    riskLevel = 'high';
  } else if (riskScore >= 20) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return { riskLevel, riskReasons: reasons };
}

/**
 * Fetch token approvals from blockchain (using Alchemy/Etherscan API)
 */
export async function fetchTokenApprovals(
  walletAddress: string,
  chain: string = 'ethereum'
): Promise<{ approvals: TokenApproval[]; error: string | null }> {
  try {
    // In production, you would call Alchemy's getTokenBalances + approval events
    // or use Etherscan's token transfer API
    // For now, we'll use stored approvals from the database

    if (isSupabaseConfigured()) {
      const { data, error } = await db
        .from('token_approvals')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('chain', chain)
        .eq('is_revoked', false)
        .order('last_checked_at', { ascending: false });

      if (error && error.code !== '42P01') {
        throw error;
      }

      const approvals: TokenApproval[] = ((data || []) as any[]).map((approval) => {
        const knownProtocol = getKnownProtocol(approval.spender_address);
        const baseApproval = {
          id: approval.id,
          tokenAddress: approval.token_address,
          tokenName: approval.token_name || 'Unknown Token',
          tokenSymbol: approval.token_symbol || '???',
          tokenDecimals: approval.token_decimals || 18,
          tokenLogo: approval.token_logo,
          spenderAddress: approval.spender_address,
          spenderName: knownProtocol?.name || approval.spender_name,
          spenderLogo: knownProtocol?.logo,
          allowance: approval.allowance || '0',
          allowanceFormatted: formatAllowance(approval.allowance || '0', approval.token_decimals || 18),
          isUnlimited: approval.is_unlimited,
          approvalTxHash: approval.approval_tx_hash,
          approvedAt: approval.approved_at,
          lastUsedAt: approval.last_used_at,
          chain: approval.chain,
        };

        const { riskLevel, riskReasons } = calculateApprovalRisk(baseApproval as TokenApproval);

        return {
          ...baseApproval,
          riskLevel,
          riskReasons,
        };
      });

      return { approvals, error: null };
    }

    // Demo data for when database is not configured
    return { approvals: getDemoApprovals(walletAddress), error: null };
  } catch (error) {
    console.error('Error fetching token approvals:', error);
    return {
      approvals: [],
      error: error instanceof Error ? error.message : 'Failed to fetch approvals',
    };
  }
}

/**
 * Format allowance for display
 */
function formatAllowance(allowance: string, decimals: number): string {
  try {
    const value = BigInt(allowance);
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

    // Check for unlimited (max uint256)
    if (value >= maxUint256 - BigInt(1000)) {
      return 'Unlimited';
    }

    // Format with proper decimals
    const divisor = BigInt(10 ** decimals);
    const wholePart = value / divisor;
    const fractionalPart = value % divisor;

    if (wholePart > BigInt(1000000000)) {
      return `${Number(wholePart / BigInt(1000000000)).toLocaleString()}B`;
    }
    if (wholePart > BigInt(1000000)) {
      return `${Number(wholePart / BigInt(1000000)).toLocaleString()}M`;
    }
    if (wholePart > BigInt(1000)) {
      return `${Number(wholePart / BigInt(1000)).toLocaleString()}K`;
    }

    return `${wholePart.toString()}.${fractionalPart.toString().slice(0, 4)}`;
  } catch {
    return allowance;
  }
}

/**
 * Calculate approval summary statistics
 */
export function calculateApprovalSummary(approvals: TokenApproval[]): ApprovalSummary {
  const unlimitedApprovals = approvals.filter((a) => a.isUnlimited).length;
  const highRiskApprovals = approvals.filter(
    (a) => a.riskLevel === 'high' || a.riskLevel === 'critical'
  ).length;

  // Calculate overall risk score (0-100)
  let riskScore = 0;
  if (approvals.length > 0) {
    const riskPoints = approvals.reduce((sum, a) => {
      const points = { low: 0, medium: 25, high: 50, critical: 100 };
      return sum + points[a.riskLevel];
    }, 0);
    riskScore = Math.min(100, Math.round(riskPoints / approvals.length));
  }

  return {
    totalApprovals: approvals.length,
    unlimitedApprovals,
    highRiskApprovals,
    totalValueAtRisk: 0, // Would need token prices to calculate
    riskScore,
  };
}

/**
 * Generate revoke transaction data
 */
export function generateRevokeData(tokenAddress: string, spenderAddress: string): {
  to: string;
  data: string;
} {
  // ERC20 approve function signature: approve(address,uint256)
  const functionSelector = '0x095ea7b3';

  // Pad spender address to 32 bytes
  const paddedSpender = spenderAddress.toLowerCase().slice(2).padStart(64, '0');

  // Set amount to 0 to revoke
  const paddedAmount = '0'.padStart(64, '0');

  return {
    to: tokenAddress,
    data: functionSelector + paddedSpender + paddedAmount,
  };
}

/**
 * Mark approval as revoked in database
 */
export async function markApprovalRevoked(
  approvalId: string,
  revokeTxHash: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    const { error } = await db
      .from('token_approvals')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoke_tx_hash: revokeTxHash,
      })
      .eq('id', approvalId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking approval as revoked:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update approval',
    };
  }
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(level: TokenApproval['riskLevel']): string {
  const colors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  };
  return colors[level];
}

/**
 * Get risk level styles
 */
export function getRiskLevelStyles(level: TokenApproval['riskLevel']): {
  bg: string;
  text: string;
  border: string;
} {
  const styles = {
    low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
    medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' },
    high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' },
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
  };
  return styles[level];
}

/**
 * Demo approvals for testing
 */
function getDemoApprovals(_walletAddress: string): TokenApproval[] {
  return [
    {
      id: '1',
      tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      tokenDecimals: 6,
      spenderAddress: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
      spenderName: 'Uniswap V2 Router',
      allowance: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      allowanceFormatted: 'Unlimited',
      isUnlimited: true,
      riskLevel: 'medium',
      riskReasons: ['Unlimited approval amount'],
      chain: 'ethereum',
    },
    {
      id: '2',
      tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
      tokenName: 'Dai Stablecoin',
      tokenSymbol: 'DAI',
      tokenDecimals: 18,
      spenderAddress: '0x1234567890123456789012345678901234567890',
      spenderName: null,
      allowance: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      allowanceFormatted: 'Unlimited',
      isUnlimited: true,
      riskLevel: 'critical',
      riskReasons: ['Unknown spender contract', 'Unlimited approval amount'],
      chain: 'ethereum',
    },
  ];
}
