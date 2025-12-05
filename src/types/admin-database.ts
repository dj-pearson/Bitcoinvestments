/**
 * Admin and Scam Database Types
 * Type definitions for admin infrastructure and scam reporting system
 */

// Types for Admin and Scam Database

// AI Model Configuration Types
export type AIModelProvider = 'claude' | 'openai' | 'gemini';

export interface AIModel {
  id: string;
  name: string;
  provider: AIModelProvider;
  modelId: string;
  description: string;
  isDefault?: boolean;
  isLightweight?: boolean;
}

export interface AIModelSettings {
  provider: AIModelProvider;
  apiKeySecretName: string;
  defaultModel: string;
  lightweightModel: string;
  maxTokens: number;
  temperature: number;
  lastTested: string | null;
  lastTestedBy: string | null;
  isConfigured: boolean;
}

// Available Claude models
export const CLAUDE_MODELS: AIModel[] = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'claude',
    modelId: 'claude-sonnet-4-5-20250929',
    description: 'Most capable model for complex tasks',
    isDefault: true,
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'claude',
    modelId: 'claude-haiku-4-5-20251001',
    description: 'Fast, lightweight model for simple tasks',
    isLightweight: true,
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'claude',
    modelId: 'claude-opus-4-20250514',
    description: 'Most powerful model for complex reasoning',
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'claude',
    modelId: 'claude-sonnet-4-20250514',
    description: 'Balanced performance and speed',
  },
];

// Default AI settings
export const DEFAULT_AI_SETTINGS: AIModelSettings = {
  provider: 'claude',
  apiKeySecretName: 'CLAUDE_API_KEY',
  defaultModel: 'claude-sonnet-4-5-20250929',
  lightweightModel: 'claude-haiku-4-5-20251001',
  maxTokens: 4096,
  temperature: 0.7,
  lastTested: null,
  lastTestedBy: null,
  isConfigured: false,
};

// User roles
export type UserRole = 'user' | 'admin' | 'super_admin';

// Extended User type with admin fields
export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  subscription_status: 'free' | 'premium';
  subscription_tier: string | null;
}

// Admin Audit Logs
export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface InsertAdminAuditLog {
  admin_id: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// Admin Settings
export interface AdminSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  category: string | null;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface InsertAdminSetting {
  key: string;
  value: Record<string, any>;
  category?: string | null;
  description?: string | null;
  updated_by?: string | null;
}

// Scam Report Types
export type ScamType =
  | 'phishing'
  | 'ponzi'
  | 'rug_pull'
  | 'fake_ico'
  | 'impersonation'
  | 'fake_exchange'
  | 'pump_dump'
  | 'other';

export type ScamSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ScamStatus = 'pending' | 'verified' | 'rejected' | 'investigating';

export interface ScamReport {
  id: string;
  title: string;
  description: string;
  scam_type: ScamType;
  severity: ScamSeverity;
  status: ScamStatus;

  // Associated entities
  website_url: string | null;
  social_media_links: Record<string, string> | null;
  wallet_addresses: string[] | null;
  email_addresses: string[] | null;
  phone_numbers: string[] | null;

  // Cryptocurrency specific
  token_name: string | null;
  token_symbol: string | null;
  blockchain: string | null;
  contract_address: string | null;

  // Metadata
  red_flags: string[] | null;
  victims_count: number;
  estimated_loss_usd: number | null;
  first_reported_date: string | null;

  // Reporting info
  reported_by: string | null;
  verified_by: string | null;
  verified_at: string | null;

  // Evidence
  evidence_links: string[] | null;
  screenshots: Record<string, any> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface InsertScamReport {
  title: string;
  description: string;
  scam_type: ScamType;
  severity?: ScamSeverity;
  status?: ScamStatus;
  website_url?: string | null;
  social_media_links?: Record<string, string> | null;
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
  evidence_links?: string[] | null;
  screenshots?: Record<string, any> | null;
}

export interface UpdateScamReport {
  title?: string;
  description?: string;
  scam_type?: ScamType;
  severity?: ScamSeverity;
  status?: ScamStatus;
  website_url?: string | null;
  social_media_links?: Record<string, string> | null;
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
  verified_by?: string | null;
  verified_at?: string | null;
  evidence_links?: string[] | null;
  screenshots?: Record<string, any> | null;
}

// Scam Report Comments
export interface ScamReportComment {
  id: string;
  scam_report_id: string;
  user_id: string;
  comment: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsertScamReportComment {
  scam_report_id: string;
  user_id: string;
  comment: string;
  is_admin?: boolean;
}

// Scam Categories
export interface ScamCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  reports_count: number;
  created_at: string;
}

// Admin Stats Types
export interface UserStats {
  total_users: number;
  active_users: number;
  premium_users: number;
  suspended_users: number;
  new_users_7d: number;
  new_users_30d: number;
}

export interface ScamStats {
  total_reports: number;
  verified_reports: number;
  pending_reports: number;
  total_victims: number;
  total_loss_usd: number;
}

// Search filters
export interface ScamSearchFilters {
  query?: string;
  scam_type?: ScamType | ScamType[];
  severity?: ScamSeverity | ScamSeverity[];
  status?: ScamStatus;
  blockchain?: string;
  min_loss?: number;
  max_loss?: number;
  date_from?: string;
  date_to?: string;
}
