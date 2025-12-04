/**
 * Supabase Database Types
 *
 * These types define the schema for all database tables.
 * Run the Supabase CLI to generate these automatically:
 * npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
 */

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
          email: string;
          created_at: string;
          updated_at: string;
          subscription_status: 'free' | 'premium';
          subscription_expires_at: string | null;
          preferences: Json;
          referral_code: string | null;
          referred_by: string | null;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          subscription_status?: 'free' | 'premium';
          subscription_expires_at?: string | null;
          preferences?: Json;
          referral_code?: string | null;
          referred_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          subscription_status?: 'free' | 'premium';
          subscription_expires_at?: string | null;
          preferences?: Json;
          referral_code?: string | null;
          referred_by?: string | null;
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
    };
    Enums: {
      subscription_status: 'free' | 'premium';
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

// Type for database function calls
type PublicSchema = Database[Extract<keyof Database, 'public'>];
export type DbFunction<T extends keyof PublicSchema['Functions']> = PublicSchema['Functions'][T];
