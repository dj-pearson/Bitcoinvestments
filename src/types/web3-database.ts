/**
 * Web3 Database Types Extension
 * Additional types for blockchain and wallet functionality
 */

import { Database } from './database';

// Extend the existing Database type with Web3 tables
export interface Web3Database extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      user_wallets: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          wallet_label: string | null;
          wallet_type: string | null;
          added_at: string;
          last_synced_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          wallet_label?: string | null;
          wallet_type?: string | null;
          added_at?: string;
          last_synced_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_address?: string;
          chain?: string;
          wallet_label?: string | null;
          wallet_type?: string | null;
          added_at?: string;
          last_synced_at?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'user_wallets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      transaction_syncs: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          sync_started_at: string;
          sync_completed_at: string | null;
          transactions_imported: number;
          sync_status: 'pending' | 'in_progress' | 'completed' | 'failed';
          error_message: string | null;
          from_block: string | null;
          to_block: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          sync_started_at?: string;
          sync_completed_at?: string | null;
          transactions_imported?: number;
          sync_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
          error_message?: string | null;
          from_block?: string | null;
          to_block?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_address?: string;
          chain?: string;
          sync_started_at?: string;
          sync_completed_at?: string | null;
          transactions_imported?: number;
          sync_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
          error_message?: string | null;
          from_block?: string | null;
          to_block?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_syncs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      token_approvals: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          token_address: string;
          token_name: string | null;
          token_symbol: string | null;
          spender_address: string;
          spender_name: string | null;
          allowance: string | null;
          is_unlimited: boolean;
          approved_at: string | null;
          last_checked_at: string;
          is_revoked: boolean;
          revoked_at: string | null;
          approval_tx_hash: string | null;
          risk_level: 'low' | 'medium' | 'high' | 'unknown';
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          token_address: string;
          token_name?: string | null;
          token_symbol?: string | null;
          spender_address: string;
          spender_name?: string | null;
          allowance?: string | null;
          is_unlimited?: boolean;
          approved_at?: string | null;
          last_checked_at?: string;
          is_revoked?: boolean;
          revoked_at?: string | null;
          approval_tx_hash?: string | null;
          risk_level?: 'low' | 'medium' | 'high' | 'unknown';
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_address?: string;
          chain?: string;
          token_address?: string;
          token_name?: string | null;
          token_symbol?: string | null;
          spender_address?: string;
          spender_name?: string | null;
          allowance?: string | null;
          is_unlimited?: boolean;
          approved_at?: string | null;
          last_checked_at?: string;
          is_revoked?: boolean;
          revoked_at?: string | null;
          approval_tx_hash?: string | null;
          risk_level?: 'low' | 'medium' | 'high' | 'unknown';
        };
        Relationships: [
          {
            foreignKeyName: 'token_approvals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      wallet_auth_nonces: {
        Row: {
          id: string;
          wallet_address: string;
          nonce: string;
          created_at: string;
          expires_at: string;
          used: boolean;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          nonce: string;
          created_at?: string;
          expires_at: string;
          used?: boolean;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          nonce?: string;
          created_at?: string;
          expires_at?: string;
          used?: boolean;
        };
        Relationships: [];
      };
    };
  };
}

// Helper types for Web3 tables
export type UserWallet = Web3Database['public']['Tables']['user_wallets']['Row'];
export type InsertUserWallet = Web3Database['public']['Tables']['user_wallets']['Insert'];
export type UpdateUserWallet = Web3Database['public']['Tables']['user_wallets']['Update'];

export type TransactionSync = Web3Database['public']['Tables']['transaction_syncs']['Row'];
export type InsertTransactionSync = Web3Database['public']['Tables']['transaction_syncs']['Insert'];
export type UpdateTransactionSync = Web3Database['public']['Tables']['transaction_syncs']['Update'];

export type TokenApproval = Web3Database['public']['Tables']['token_approvals']['Row'];
export type InsertTokenApproval = Web3Database['public']['Tables']['token_approvals']['Insert'];
export type UpdateTokenApproval = Web3Database['public']['Tables']['token_approvals']['Update'];

export type WalletAuthNonce = Web3Database['public']['Tables']['wallet_auth_nonces']['Row'];
export type InsertWalletAuthNonce = Web3Database['public']['Tables']['wallet_auth_nonces']['Insert'];
export type UpdateWalletAuthNonce = Web3Database['public']['Tables']['wallet_auth_nonces']['Update'];

// Extended Transaction type with blockchain fields
export interface BlockchainTransaction {
  blockchain_tx_hash?: string | null;
  blockchain_chain?: string | null;
  synced_from_wallet?: boolean;
  synced_at?: string | null;
  gas_fee?: number | null;
  token_address?: string | null;
}
