/**
 * Wallet Transaction Sync Service
 * Manages syncing blockchain transactions to the database
 */

import { supabase } from '../lib/supabase';
import { fetchTransactionHistory, SupportedChain } from './alchemy';
import { fetchSolanaTransactions } from './solana';
import type { InsertUserWallet, InsertTransactionSync } from '../types/web3-database';

export interface SyncProgress {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  imported: number;
  total: number;
  error?: string;
}

/**
 * Save a connected wallet to the database
 */
export async function saveConnectedWallet(
  userId: string,
  walletAddress: string,
  chain: string,
  walletType: string = 'metamask',
  label?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .insert<InsertUserWallet>({
        user_id: userId,
        wallet_address: walletAddress.toLowerCase(),
        chain,
        wallet_type: walletType,
        wallet_label: label || `${walletType} - ${chain}`,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: true }; // Wallet already exists
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving wallet:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save wallet' 
    };
  }
}

/**
 * Get all connected wallets for a user
 */
export async function getUserWallets(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('added_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch wallets' 
    };
  }
}

/**
 * Sync transactions for a wallet from the blockchain
 */
export async function syncWalletTransactions(
  userId: string,
  walletAddress: string,
  chain: string,
  portfolioId?: string,
  onProgress?: (progress: SyncProgress) => void
): Promise<{ success: boolean; imported: number; error?: string }> {
  // Create sync record
  const { data: syncRecord, error: syncError } = await supabase
    .from('transaction_syncs')
    .insert<InsertTransactionSync>({
      user_id: userId,
      wallet_address: walletAddress.toLowerCase(),
      chain,
      sync_status: 'in_progress',
    })
    .select()
    .single();

  if (syncError || !syncRecord) {
    return { 
      success: false, 
      imported: 0, 
      error: 'Failed to create sync record' 
    };
  }

  try {
    onProgress?.({
      status: 'in_progress',
      imported: 0,
      total: 0,
    });

    // Fetch transactions based on chain type
    let transactions: any[] = [];
    
    if (chain === 'solana') {
      transactions = await fetchSolanaTransactions(walletAddress);
    } else {
      transactions = await fetchTransactionHistory(
        walletAddress,
        chain as SupportedChain
      );
    }

    if (transactions.length === 0) {
      await supabase
        .from('transaction_syncs')
        .update({
          sync_status: 'completed',
          sync_completed_at: new Date().toISOString(),
          transactions_imported: 0,
        })
        .eq('id', syncRecord.id);

      return { success: true, imported: 0 };
    }

    // Process and import transactions
    let imported = 0;
    const total = transactions.length;

    for (const tx of transactions) {
      try {
        // Determine if transaction is buy/sell/transfer based on address
        const isSent = tx.from?.toLowerCase() === walletAddress.toLowerCase();
        const type = isSent ? 'transfer_out' : 'transfer_in';

        // Parse amount and create transaction record
        // Note: This requires a holding_id which should be created/found based on the asset
        // For now, we'll store the raw blockchain data
        
        // TODO: Match with existing holdings or create new ones
        // For MVP, we'll just track that sync happened
        
        imported++;
        onProgress?.({
          status: 'in_progress',
          imported,
          total,
        });
      } catch (txError) {
        console.error('Error processing transaction:', txError);
        // Continue with next transaction
      }
    }

    // Update sync record
    await supabase
      .from('transaction_syncs')
      .update({
        sync_status: 'completed',
        sync_completed_at: new Date().toISOString(),
        transactions_imported: imported,
      })
      .eq('id', syncRecord.id);

    // Update wallet last_synced_at
    await supabase
      .from('user_wallets')
      .update({
        last_synced_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('chain', chain);

    onProgress?.({
      status: 'completed',
      imported,
      total,
    });

    return { success: true, imported };
  } catch (error) {
    console.error('Error syncing transactions:', error);

    // Update sync record with error
    await supabase
      .from('transaction_syncs')
      .update({
        sync_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', syncRecord.id);

    return {
      success: false,
      imported: 0,
      error: error instanceof Error ? error.message : 'Failed to sync transactions',
    };
  }
}

/**
 * Get sync history for a wallet
 */
export async function getSyncHistory(userId: string, walletAddress?: string) {
  try {
    let query = supabase
      .from('transaction_syncs')
      .select('*')
      .eq('user_id', userId)
      .order('sync_started_at', { ascending: false })
      .limit(50);

    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress.toLowerCase());
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching sync history:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch sync history',
    };
  }
}
