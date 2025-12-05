import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

// Use Alchemy Solana or a public RPC endpoint
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC_URL);

export interface SolanaTransactionData {
  signature: string;
  blockTime: number | null;
  slot: number;
  fee: number;
  status: 'success' | 'failed';
  type: string;
  amount?: number;
  token?: string;
}

/**
 * Fetch Solana transaction history for a wallet address
 */
export async function fetchSolanaTransactions(
  address: string,
  limit: number = 100
): Promise<SolanaTransactionData[]> {
  try {
    const publicKey = new PublicKey(address);
    
    // Fetch transaction signatures
    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { limit }
    );

    // Fetch full transaction details
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getParsedTransaction(
            sig.signature,
            { maxSupportedTransactionVersion: 0 }
          );
          
          return tx ? parseTransaction(tx, sig.signature) : null;
        } catch (error) {
          console.error(`Error fetching transaction ${sig.signature}:`, error);
          return null;
        }
      })
    );

    return transactions.filter((tx): tx is SolanaTransactionData => tx !== null);
  } catch (error) {
    console.error('Error fetching Solana transactions:', error);
    throw error;
  }
}

/**
 * Parse Solana transaction data
 */
function parseTransaction(
  tx: ParsedTransactionWithMeta,
  signature: string
): SolanaTransactionData {
  const status = tx.meta?.err ? 'failed' : 'success';
  
  return {
    signature,
    blockTime: tx.blockTime,
    slot: tx.slot,
    fee: tx.meta?.fee || 0,
    status,
    type: 'transfer', // Simplified - would need more logic to determine type
  };
}

/**
 * Fetch Solana token balances
 */
export async function fetchSolanaTokenBalances(address: string) {
  try {
    const publicKey = new PublicKey(address);
    
    // Fetch SOL balance
    const balance = await connection.getBalance(publicKey);
    
    // Fetch SPL token balances
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );

    const tokens = tokenAccounts.value.map((account) => {
      const info = account.account.data.parsed.info;
      return {
        mint: info.mint,
        balance: info.tokenAmount.uiAmount,
        decimals: info.tokenAmount.decimals,
      };
    });

    return {
      sol: balance / 1e9, // Convert lamports to SOL
      tokens,
    };
  } catch (error) {
    console.error('Error fetching Solana balances:', error);
    throw error;
  }
}
