/**
 * Token Approval Management Service
 * Handles fetching and revoking ERC20 token approvals
 */

import { createPublicClient, createWalletClient, custom, parseAbi, http, formatUnits } from 'viem';
import { mainnet, polygon, arbitrum, optimism } from 'viem/chains';
import { supabase } from '../lib/supabase';
import type { InsertTokenApproval } from '../types/web3-database';

const chains = { mainnet, polygon, arbitrum, optimism };

// ERC20 ABI for allowance and approve functions
const erc20Abi = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
]);

export interface TokenApprovalInfo {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  spenderAddress: string;
  spenderName: string | null;
  allowance: string;
  isUnlimited: boolean;
  chain: string;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
}

/**
 * Fetch all token approvals for a wallet address
 */
export async function fetchTokenApprovalsForWallet(
  walletAddress: string,
  chainName: string,
  tokenAddresses: string[]
): Promise<TokenApprovalInfo[]> {
  const chain = chains[chainName as keyof typeof chains];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainName}`);
  }

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const approvals: TokenApprovalInfo[] = [];

  for (const tokenAddress of tokenAddresses) {
    try {
      // Get token metadata
      const [name, symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      ]);

      // In a full implementation, we would:
      // 1. Fetch all Approval events for this token + wallet
      // 2. Check current allowance for each spender
      // 3. Filter out zero allowances

      // For this MVP, we'll create a placeholder structure
      // that would be populated by actual approval events

    } catch (error) {
      console.error(`Error fetching approval for ${tokenAddress}:`, error);
    }
  }

  return approvals;
}

/**
 * Revoke a token approval by setting allowance to 0
 */
export async function revokeTokenApproval(
  tokenAddress: string,
  spenderAddress: string,
  chainName: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!window.ethereum) {
    return { success: false, error: 'No wallet provider found' };
  }

  try {
    const chain = chains[chainName as keyof typeof chains];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }

    const walletClient = createWalletClient({
      chain,
      transport: custom(window.ethereum),
    });

    const [account] = await walletClient.getAddresses();

    // Send transaction to set allowance to 0
    const hash = await walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spenderAddress as `0x${string}`, BigInt(0)],
      account,
    });

    return { success: true, txHash: hash };
  } catch (error) {
    console.error('Error revoking approval:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke approval',
    };
  }
}

/**
 * Save token approval to database
 */
export async function saveTokenApproval(
  userId: string,
  approval: TokenApprovalInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('token_approvals').insert<InsertTokenApproval>({
      user_id: userId,
      wallet_address: approval.tokenAddress.toLowerCase(),
      chain: approval.chain,
      token_address: approval.tokenAddress.toLowerCase(),
      token_name: approval.tokenName,
      token_symbol: approval.tokenSymbol,
      spender_address: approval.spenderAddress.toLowerCase(),
      spender_name: approval.spenderName,
      allowance: approval.allowance,
      is_unlimited: approval.isUnlimited,
      risk_level: approval.riskLevel,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving token approval:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save approval',
    };
  }
}

/**
 * Get token approvals from database
 */
export async function getTokenApprovals(userId: string, walletAddress?: string) {
  try {
    let query = supabase
      .from('token_approvals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .order('last_checked_at', { ascending: false });

    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress.toLowerCase());
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching token approvals:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch approvals',
    };
  }
}

/**
 * Mark token approval as revoked
 */
export async function markApprovalAsRevoked(
  approvalId: string,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('token_approvals')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', approvalId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking approval as revoked:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update approval',
    };
  }
}

/**
 * Assess risk level of a spender address
 * In a full implementation, this would check against known protocols
 */
function assessRiskLevel(spenderAddress: string, spenderName: string | null): 'low' | 'medium' | 'high' | 'unknown' {
  const knownSafe = ['uniswap', 'aave', 'compound', 'curve'];

  if (spenderName && knownSafe.some(name => spenderName.toLowerCase().includes(name))) {
    return 'low';
  }

  return 'unknown';
}
