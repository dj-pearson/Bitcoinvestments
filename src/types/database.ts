/**
 * Supabase Database Types
 *
 * Hand-maintained from supabase/migrations (last reconciled with
 * 20260923000300_reconcile_schema.sql). Only the tables the typed `supabase`
 * client touches need to be here; code that uses the untyped `db` client from
 * src/lib/supabase.ts is not checked against this file.
 *
 * Tables keyed by something other than `id` (app_meta, notification_preferences,
 * platform_review_helpful_votes) are deliberately left out: src/security/layers.ts
 * filters any typed table by `id`, which a keyless table would break. They are
 * read through `db`.
 *
 * With access to the live project, prefer regenerating it:
 *   pnpm dlx supabase gen types typescript --project-id <project-id> > src/types/database.ts
 */

/** Values of the public.subscription_status enum. */
export type SubscriptionStatusValue = 'free' | 'premium' | 'advisor' | 'enterprise' | 'api' | 'lifetime';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          wallet_address: string | null; // legacy, from the removed wallet login
          created_at: string;
          updated_at: string;
          // The column can hold every SubscriptionStatusValue since the
          // 2026-09-23 reconcile migration. It stays typed as the original pair
          // until the helpers that take it (AdUnit, Advertisement, useDataDelay,
          // useSubscription, portfolio.ts, the premium-gated pages) accept the
          // wider type; widening it here first would break those call sites.
          subscription_status: 'free' | 'premium';
          subscription_tier: string | null;
          subscription_expires_at: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          preferences: Json;
          referral_code: string | null;
          referred_by: string | null;
          // Admin fields
          role: 'user' | 'admin' | 'super_admin';
          is_suspended: boolean;
          suspended_at: string | null;
          suspended_reason: string | null;
          last_login_at: string | null;
          // Two-Factor Authentication fields
          two_factor_enabled: boolean;
          two_factor_secret: string | null;
          two_factor_recovery_codes: string[] | null;
          two_factor_enabled_at: string | null;
          username: string | null;
          lifetime_purchase_date: string | null;
          lifetime_purchase_amount: number | null;
          payment_failed_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null; // Made optional for wallet-only accounts
          wallet_address?: string | null;
                    created_at?: string;
          updated_at?: string;
          subscription_status?: 'free' | 'premium';
          subscription_tier?: string | null;
          subscription_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          preferences?: Json;
          referral_code?: string | null;
          referred_by?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          is_suspended?: boolean;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          last_login_at?: string | null;
          // Two-Factor Authentication fields
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          two_factor_recovery_codes?: string[] | null;
          two_factor_enabled_at?: string | null;
          username?: string | null;
          lifetime_purchase_date?: string | null;
          lifetime_purchase_amount?: number | null;
          payment_failed_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
          subscription_status?: 'free' | 'premium';
          subscription_tier?: string | null;
          subscription_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          preferences?: Json;
          referral_code?: string | null;
          referred_by?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          is_suspended?: boolean;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          last_login_at?: string | null;
          // Two-Factor Authentication fields
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          two_factor_recovery_codes?: string[] | null;
          two_factor_enabled_at?: string | null;
          username?: string | null;
          lifetime_purchase_date?: string | null;
          lifetime_purchase_amount?: number | null;
          payment_failed_at?: string | null;
        };
        Relationships: [];
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
          is_default: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          is_default?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          is_default?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'portfolios_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      holdings: {
        Row: {
          id: string;
          portfolio_id: string;
          cryptocurrency_id: string;
          symbol: string;
          name: string;
          amount: number;
          average_buy_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          cryptocurrency_id: string;
          symbol: string;
          name: string;
          amount: number;
          average_buy_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          cryptocurrency_id?: string;
          symbol?: string;
          name?: string;
          amount?: number;
          average_buy_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'holdings_portfolio_id_fkey';
            columns: ['portfolio_id'];
            isOneToOne: false;
            referencedRelation: 'portfolios';
            referencedColumns: ['id'];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          holding_id: string;
          type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'staking_reward';
          amount: number;
          price_per_unit: number;
          total_value: number;
          fee: number | null;
          date: string;
          notes: string | null;
          exchange: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          holding_id: string;
          type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'staking_reward';
          amount: number;
          price_per_unit: number;
          total_value: number;
          fee?: number | null;
          date: string;
          notes?: string | null;
          exchange?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          holding_id?: string;
          type?: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'staking_reward';
          amount?: number;
          price_per_unit?: number;
          total_value?: number;
          fee?: number | null;
          date?: string;
          notes?: string | null;
          exchange?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_holding_id_fkey';
            columns: ['holding_id'];
            isOneToOne: false;
            referencedRelation: 'holdings';
            referencedColumns: ['id'];
          }
        ];
      };
      price_alerts: {
        Row: {
          id: string;
          user_id: string;
          cryptocurrency_id: string;
          symbol: string;
          target_price: number;
          condition: 'above' | 'below';
          is_active: boolean;
          triggered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cryptocurrency_id: string;
          symbol: string;
          target_price: number;
          condition: 'above' | 'below';
          is_active?: boolean;
          triggered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cryptocurrency_id?: string;
          symbol?: string;
          target_price?: number;
          condition?: 'above' | 'below';
          is_active?: boolean;
          triggered_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'price_alerts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      affiliate_clicks: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string;
          affiliate_id: string;
          platform_type: 'exchange' | 'wallet' | 'tax_software' | 'course';
          platform_name: string;
          source_page: string;
          clicked_at: string;
          converted: boolean;
          conversion_value: number | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id: string;
          affiliate_id: string;
          platform_type: 'exchange' | 'wallet' | 'tax_software' | 'course';
          platform_name: string;
          source_page: string;
          clicked_at?: string;
          converted?: boolean;
          conversion_value?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string;
          affiliate_id?: string;
          platform_type?: 'exchange' | 'wallet' | 'tax_software' | 'course';
          platform_name?: string;
          source_page?: string;
          clicked_at?: string;
          converted?: boolean;
          conversion_value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_clicks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          featured_image: string | null;
          author_id: string;
          category: string;
          tags: string[];
          published_at: string | null;
          created_at: string;
          updated_at: string;
          status: 'draft' | 'published' | 'archived';
          seo_title: string | null;
          seo_description: string | null;
          read_time_minutes: number;
          view_count: number;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          featured_image?: string | null;
          author_id: string;
          category: string;
          tags?: string[];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: 'draft' | 'published' | 'archived';
          seo_title?: string | null;
          seo_description?: string | null;
          read_time_minutes?: number;
          view_count?: number;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string;
          content?: string;
          featured_image?: string | null;
          author_id?: string;
          category?: string;
          tags?: string[];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: 'draft' | 'published' | 'archived';
          seo_title?: string | null;
          seo_description?: string | null;
          read_time_minutes?: number;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'articles_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      advertisements: {
        Row: {
          id: string;
          campaign_name: string;
          advertiser_id: string;
          ad_zone: 'banner' | 'sidebar' | 'native' | 'popup';
          image_url: string;
          target_url: string;
          alt_text: string;
          cta_text: string | null;
          start_date: string;
          end_date: string;
          impressions: number;
          clicks: number;
          status: 'active' | 'paused' | 'ended';
          targeting: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_name: string;
          advertiser_id: string;
          ad_zone: 'banner' | 'sidebar' | 'native' | 'popup';
          image_url: string;
          target_url: string;
          alt_text: string;
          cta_text?: string | null;
          start_date: string;
          end_date: string;
          impressions?: number;
          clicks?: number;
          status?: 'active' | 'paused' | 'ended';
          targeting?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_name?: string;
          advertiser_id?: string;
          ad_zone?: 'banner' | 'sidebar' | 'native' | 'popup';
          image_url?: string;
          target_url?: string;
          alt_text?: string;
          cta_text?: string | null;
          start_date?: string;
          end_date?: string;
          impressions?: number;
          clicks?: number;
          status?: 'active' | 'paused' | 'ended';
          targeting?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
          unsubscribed_at: string | null;
          is_active: boolean;
          source: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          is_active?: boolean;
          source?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          is_active?: boolean;
          source?: string | null;
        };
        Relationships: [];
      };
      // Web3 Tables
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
      // Admin Tables
      admin_audit_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_type: string | null;
          target_id: string | null;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_audit_logs_admin_id_fkey';
            columns: ['admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      admin_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          category: string | null;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          category?: string | null;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          category?: string | null;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_settings_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      scam_reports: {
        Row: {
          id: string;
          title: string;
          description: string;
          scam_type: 'phishing' | 'ponzi' | 'rug_pull' | 'fake_ico' | 'impersonation' | 'fake_exchange' | 'pump_dump' | 'other';
          severity: 'low' | 'medium' | 'high' | 'critical';
          status: 'pending' | 'verified' | 'rejected' | 'investigating';
          website_url: string | null;
          social_media_links: Json | null;
          wallet_addresses: string[] | null;
          email_addresses: string[] | null;
          phone_numbers: string[] | null;
          token_name: string | null;
          token_symbol: string | null;
          blockchain: string | null;
          contract_address: string | null;
          red_flags: string[] | null;
          victims_count: number;
          estimated_loss_usd: number | null;
          first_reported_date: string | null;
          reported_by: string | null;
          verified_by: string | null;
          verified_at: string | null;
          evidence_links: string[] | null;
          screenshots: Json | null;
          source: string;
          external_id: string | null;
          upvotes: number;
          downvotes: number;
          dispute_count: number;
          trust_score: number;
          last_activity_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          scam_type: 'phishing' | 'ponzi' | 'rug_pull' | 'fake_ico' | 'impersonation' | 'fake_exchange' | 'pump_dump' | 'other';
          severity?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'pending' | 'verified' | 'rejected' | 'investigating';
          website_url?: string | null;
          social_media_links?: Json | null;
          wallet_addresses?: string[] | null;
          email_addresses?: string[] | null;
          phone_numbers?: string[] | null;
          token_name?: string | null;
          token_symbol?: string | null;
          blockchain?: string | null;
          contract_address?: string | null;
          red_flags?: string[] | null;
          victims_count?: number;
          estimated_loss_usd?: number | null;
          first_reported_date?: string | null;
          reported_by?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          evidence_links?: string[] | null;
          screenshots?: Json | null;
          source?: string;
          external_id?: string | null;
          upvotes?: number;
          downvotes?: number;
          dispute_count?: number;
          trust_score?: number;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          scam_type?: 'phishing' | 'ponzi' | 'rug_pull' | 'fake_ico' | 'impersonation' | 'fake_exchange' | 'pump_dump' | 'other';
          severity?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'pending' | 'verified' | 'rejected' | 'investigating';
          website_url?: string | null;
          social_media_links?: Json | null;
          wallet_addresses?: string[] | null;
          email_addresses?: string[] | null;
          phone_numbers?: string[] | null;
          token_name?: string | null;
          token_symbol?: string | null;
          blockchain?: string | null;
          contract_address?: string | null;
          red_flags?: string[] | null;
          victims_count?: number;
          estimated_loss_usd?: number | null;
          first_reported_date?: string | null;
          reported_by?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          evidence_links?: string[] | null;
          screenshots?: Json | null;
          source?: string;
          external_id?: string | null;
          upvotes?: number;
          downvotes?: number;
          dispute_count?: number;
          trust_score?: number;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scam_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          reports_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          reports_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          reports_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      scam_report_comments: {
        Row: {
          id: string;
          scam_report_id: string;
          user_id: string;
          comment: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scam_report_id: string;
          user_id: string;
          comment: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scam_report_id?: string;
          user_id?: string;
          comment?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scam_report_comments_scam_report_id_fkey';
            columns: ['scam_report_id'];
            isOneToOne: false;
            referencedRelation: 'scam_reports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scam_report_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      // Tax Report Purchases (one-time seasonal package)
      tax_report_purchases: {
        Row: {
          id: string;
          user_id: string;
          package_type: 'basic' | 'premium';
          tax_year: number;
          price_paid: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          status: 'pending' | 'completed' | 'refunded' | 'failed';
          purchased_at: string | null;
          refunded_at: string | null;
          report_generated_at: string | null;
          report_download_count: number;
          last_download_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_type: 'basic' | 'premium';
          tax_year: number;
          price_paid: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          status?: 'pending' | 'completed' | 'refunded' | 'failed';
          purchased_at?: string | null;
          refunded_at?: string | null;
          report_generated_at?: string | null;
          report_download_count?: number;
          last_download_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_type?: 'basic' | 'premium';
          tax_year?: number;
          price_paid?: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          status?: 'pending' | 'completed' | 'refunded' | 'failed';
          purchased_at?: string | null;
          refunded_at?: string | null;
          report_generated_at?: string | null;
          report_download_count?: number;
          last_download_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tax_report_purchases_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      // Platform Reviews table for exchanges, wallets, and tax software
      platform_reviews: {
        Row: {
          id: string;
          user_id: string;
          platform_type: 'exchange' | 'wallet' | 'tax_software';
          platform_id: string;
          rating: number; // 1-5 stars
          title: string;
          content: string;
          pros: string[] | null;
          cons: string[] | null;
          verified_user: boolean;
          helpful_count: number;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform_type: 'exchange' | 'wallet' | 'tax_software';
          platform_id: string;
          rating: number;
          title: string;
          content: string;
          pros?: string[] | null;
          cons?: string[] | null;
          verified_user?: boolean;
          helpful_count?: number;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform_type?: 'exchange' | 'wallet' | 'tax_software';
          platform_id?: string;
          rating?: number;
          title?: string;
          content?: string;
          pros?: string[] | null;
          cons?: string[] | null;
          verified_user?: boolean;
          helpful_count?: number;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'platform_reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      // User Sessions table for session management
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          device_name: string | null;
          is_active: boolean;
          created_at: string;
          last_used_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          device_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          last_used_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          keys?: Json;
          device_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          last_used_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      moderation_queue: {
        Row: {
          id: string;
          type: 'review' | 'comment' | 'report';
          source_id: string | null;
          content: string;
          author_id: string | null;
          author_email: string | null;
          status: 'pending' | 'approved' | 'rejected';
          flagged: boolean;
          flag_reason: string | null;
          flagged_by: string | null;
          moderated_by: string | null;
          moderated_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'review' | 'comment' | 'report';
          source_id?: string | null;
          content: string;
          author_id?: string | null;
          author_email?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          flagged?: boolean;
          flag_reason?: string | null;
          flagged_by?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'review' | 'comment' | 'report';
          source_id?: string | null;
          content?: string;
          author_id?: string | null;
          author_email?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          flagged?: boolean;
          flag_reason?: string | null;
          flagged_by?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      influencer_referrals: {
        Row: {
          id: string;
          affiliate_code: string;
          session_id: string | null;
          user_id: string | null;
          landing_page: string | null;
          source_url: string | null;
          clicked_at: string;
          expires_at: string | null;
          converted: boolean;
          converted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          affiliate_code: string;
          session_id?: string | null;
          user_id?: string | null;
          landing_page?: string | null;
          source_url?: string | null;
          clicked_at?: string;
          expires_at?: string | null;
          converted?: boolean;
          converted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          affiliate_code?: string;
          session_id?: string | null;
          user_id?: string | null;
          landing_page?: string | null;
          source_url?: string | null;
          clicked_at?: string;
          expires_at?: string | null;
          converted?: boolean;
          converted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      affiliate_applications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          platform: 'youtube' | 'twitter' | 'blog' | 'podcast' | 'instagram' | 'tiktok' | 'other';
          platform_url: string;
          followers_count: number | null;
          content_description: string | null;
          why_join: string | null;
          agreed_to_terms: boolean;
          status: 'pending' | 'approved' | 'rejected';
          reviewer_id: string | null;
          reviewer_notes: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          platform: 'youtube' | 'twitter' | 'blog' | 'podcast' | 'instagram' | 'tiktok' | 'other';
          platform_url: string;
          followers_count?: number | null;
          content_description?: string | null;
          why_join?: string | null;
          agreed_to_terms?: boolean;
          status?: 'pending' | 'approved' | 'rejected';
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          platform?: 'youtube' | 'twitter' | 'blog' | 'podcast' | 'instagram' | 'tiktok' | 'other';
          platform_url?: string;
          followers_count?: number | null;
          content_description?: string | null;
          why_join?: string | null;
          agreed_to_terms?: boolean;
          status?: 'pending' | 'approved' | 'rejected';
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_applications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      api_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: 'free' | 'starter' | 'professional' | 'enterprise';
          status: 'active' | 'past_due' | 'inactive' | 'canceled';
          started_at: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier?: 'free' | 'starter' | 'professional' | 'enterprise';
          status?: 'active' | 'past_due' | 'inactive' | 'canceled';
          started_at?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: 'free' | 'starter' | 'professional' | 'enterprise';
          status?: 'active' | 'past_due' | 'inactive' | 'canceled';
          started_at?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          tier: 'free' | 'starter' | 'professional' | 'enterprise';
          status: 'active' | 'suspended' | 'revoked' | 'expired';
          permissions: string[];
          rate_limit_per_minute: number;
          rate_limit_per_day: number;
          requests_today: number;
          requests_this_month: number;
          last_used_at: string | null;
          expires_at: string | null;
          ip_whitelist: string[];
          allowed_origins: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          tier?: 'free' | 'starter' | 'professional' | 'enterprise';
          status?: 'active' | 'suspended' | 'revoked' | 'expired';
          permissions?: string[];
          rate_limit_per_minute?: number;
          rate_limit_per_day?: number;
          requests_today?: number;
          requests_this_month?: number;
          last_used_at?: string | null;
          expires_at?: string | null;
          ip_whitelist?: string[];
          allowed_origins?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_prefix?: string;
          key_hash?: string;
          tier?: 'free' | 'starter' | 'professional' | 'enterprise';
          status?: 'active' | 'suspended' | 'revoked' | 'expired';
          permissions?: string[];
          rate_limit_per_minute?: number;
          rate_limit_per_day?: number;
          requests_today?: number;
          requests_this_month?: number;
          last_used_at?: string | null;
          expires_at?: string | null;
          ip_whitelist?: string[];
          allowed_origins?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          device_info: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          last_activity_at: string;
          expires_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          device_info?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          last_activity_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_info?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          last_activity_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_ad_impressions: {
        Args: {
          ad_id: string;
        };
        Returns: undefined;
      };
      increment_ad_clicks: {
        Args: {
          ad_id: string;
        };
        Returns: undefined;
      };
      generate_referral_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_scam_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      has_tax_report_purchase: {
        Args: {
          p_user_id: string;
          p_tax_year: number;
        };
        Returns: boolean;
      };
      get_tax_report_package_type: {
        Args: {
          p_user_id: string;
          p_tax_year: number;
        };
        Returns: string | null;
      };
      increment_review_helpful: {
        Args: {
          review_id: string;
        };
        Returns: undefined;
      };
      increment_tax_report_download: {
        Args: {
          p_purchase_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      subscription_status: SubscriptionStatusValue;
      transaction_type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'staking_reward';
      alert_condition: 'above' | 'below';
      platform_type: 'exchange' | 'wallet' | 'tax_software' | 'course';
      article_status: 'draft' | 'published' | 'archived';
      ad_zone: 'banner' | 'sidebar' | 'native' | 'popup';
      ad_status: 'active' | 'paused' | 'ended';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type User = Tables<'users'>;
export type Portfolio = Tables<'portfolios'>;
export type Holding = Tables<'holdings'>;
export type Transaction = Tables<'transactions'>;
export type PriceAlert = Tables<'price_alerts'>;
export type AffiliateClick = Tables<'affiliate_clicks'>;
export type Article = Tables<'articles'>;
export type Advertisement = Tables<'advertisements'>;
export type NewsletterSubscriber = Tables<'newsletter_subscribers'>;
export type TaxReportPurchase = Tables<'tax_report_purchases'>;
export type PlatformReview = Tables<'platform_reviews'>;
export type UserSession = Tables<'user_sessions'>;
export type PushSubscriptionRow = Tables<'push_subscriptions'>;
export type ModerationQueueItem = Tables<'moderation_queue'>;
export type AffiliateApplication = Tables<'affiliate_applications'>;
export type ApiSubscription = Tables<'api_subscriptions'>;

// Type for database function calls
type PublicSchema = Database[Extract<keyof Database, 'public'>];
export type DbFunction<T extends keyof PublicSchema['Functions']> = PublicSchema['Functions'][T];
