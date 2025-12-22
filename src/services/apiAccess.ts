import { db } from '../lib/supabase';

// Types
export type ApiKeyStatus = 'active' | 'suspended' | 'revoked' | 'expired';
export type ApiTier = 'free' | 'starter' | 'professional' | 'enterprise';
export type EndpointCategory = 'portfolio' | 'market' | 'trading' | 'analytics' | 'social' | 'account';

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  tier: ApiTier;
  status: ApiKeyStatus;
  permissions: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  requestsToday: number;
  requestsThisMonth: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  ipWhitelist: string[];
  allowedOrigins: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  category: EndpointCategory;
  name: string;
  description: string;
  requiredTier: ApiTier;
  requiredPermissions: string[];
  rateLimitMultiplier: number;
  requestSchema: object;
  responseSchema: object;
  exampleRequest: object;
  exampleResponse: object;
  isDeprecated: boolean;
  deprecationMessage?: string;
  version: string;
}

export interface ApiUsageLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  requestSize: number;
  responseSize: number;
  ipAddress: string;
  userAgent: string;
  errorMessage?: string;
  createdAt: string;
}

export interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  requestsByDay: { date: string; count: number }[];
  errorsByType: Record<string, number>;
}

export interface ApiTierDetails {
  tier: ApiTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  maxKeys: number;
  supportLevel: string;
  webhooks: boolean;
  realtimeData: boolean;
  historicalData: string;
}

// Demo data
const demoApiKeys: ApiKey[] = [
  {
    id: '1',
    userId: 'demo-user',
    name: 'Production Key',
    keyPrefix: 'bv_live_abc123',
    keyHash: 'hashed',
    tier: 'professional',
    status: 'active',
    permissions: ['portfolio:read', 'market:read', 'trading:read', 'analytics:read'],
    rateLimitPerMinute: 100,
    rateLimitPerDay: 10000,
    requestsToday: 1247,
    requestsThisMonth: 28450,
    lastUsedAt: new Date().toISOString(),
    expiresAt: null,
    ipWhitelist: [],
    allowedOrigins: ['https://myapp.com', 'https://staging.myapp.com'],
    createdAt: '2024-10-15T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: 'demo-user',
    name: 'Development Key',
    keyPrefix: 'bv_test_xyz789',
    keyHash: 'hashed',
    tier: 'starter',
    status: 'active',
    permissions: ['portfolio:read', 'market:read'],
    rateLimitPerMinute: 30,
    rateLimitPerDay: 1000,
    requestsToday: 89,
    requestsThisMonth: 2340,
    lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: null,
    ipWhitelist: ['192.168.1.1'],
    allowedOrigins: ['http://localhost:3000'],
    createdAt: '2024-11-01T14:30:00Z',
    updatedAt: new Date().toISOString()
  }
];

const demoEndpoints: ApiEndpoint[] = [
  {
    id: '1',
    path: '/v1/portfolio',
    method: 'GET',
    category: 'portfolio',
    name: 'Get Portfolio',
    description: 'Retrieve the authenticated user\'s portfolio with current holdings and valuations',
    requiredTier: 'free',
    requiredPermissions: ['portfolio:read'],
    rateLimitMultiplier: 1,
    requestSchema: {},
    responseSchema: {
      type: 'object',
      properties: {
        totalValue: { type: 'number' },
        holdings: { type: 'array' }
      }
    },
    exampleRequest: {
      headers: { 'Authorization': 'Bearer bv_live_xxx' }
    },
    exampleResponse: {
      totalValue: 45230.50,
      holdings: [
        { symbol: 'BTC', amount: 0.5, value: 32500 },
        { symbol: 'ETH', amount: 5.2, value: 12730.50 }
      ]
    },
    isDeprecated: false,
    version: '1.0'
  },
  {
    id: '2',
    path: '/v1/portfolio/transactions',
    method: 'GET',
    category: 'portfolio',
    name: 'Get Transactions',
    description: 'Retrieve transaction history with filtering and pagination',
    requiredTier: 'starter',
    requiredPermissions: ['portfolio:read'],
    rateLimitMultiplier: 1,
    requestSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 50 },
        offset: { type: 'number', default: 0 },
        type: { type: 'string', enum: ['buy', 'sell', 'transfer'] }
      }
    },
    responseSchema: {},
    exampleRequest: { query: { limit: 10, type: 'buy' } },
    exampleResponse: {
      transactions: [],
      total: 156,
      hasMore: true
    },
    isDeprecated: false,
    version: '1.0'
  },
  {
    id: '3',
    path: '/v1/market/prices',
    method: 'GET',
    category: 'market',
    name: 'Get Market Prices',
    description: 'Get real-time prices for specified cryptocurrencies',
    requiredTier: 'free',
    requiredPermissions: ['market:read'],
    rateLimitMultiplier: 0.5,
    requestSchema: {
      type: 'object',
      properties: {
        symbols: { type: 'array', items: { type: 'string' } },
        currency: { type: 'string', default: 'USD' }
      }
    },
    responseSchema: {},
    exampleRequest: { query: { symbols: ['BTC', 'ETH'], currency: 'USD' } },
    exampleResponse: {
      prices: {
        BTC: { price: 65000, change24h: 2.5 },
        ETH: { price: 2450, change24h: -1.2 }
      },
      timestamp: '2024-12-22T10:00:00Z'
    },
    isDeprecated: false,
    version: '1.0'
  },
  {
    id: '4',
    path: '/v1/market/historical',
    method: 'GET',
    category: 'market',
    name: 'Historical Data',
    description: 'Get historical price data for charting and analysis',
    requiredTier: 'professional',
    requiredPermissions: ['market:read'],
    rateLimitMultiplier: 2,
    requestSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        interval: { type: 'string', enum: ['1m', '5m', '1h', '1d', '1w'] },
        from: { type: 'string', format: 'date-time' },
        to: { type: 'string', format: 'date-time' }
      }
    },
    responseSchema: {},
    exampleRequest: { query: { symbol: 'BTC', interval: '1d', from: '2024-01-01' } },
    exampleResponse: {
      data: [
        { timestamp: '2024-01-01', open: 42000, high: 43500, low: 41800, close: 43200, volume: 25000000000 }
      ]
    },
    isDeprecated: false,
    version: '1.0'
  },
  {
    id: '5',
    path: '/v1/analytics/performance',
    method: 'GET',
    category: 'analytics',
    name: 'Portfolio Performance',
    description: 'Get detailed performance analytics and metrics',
    requiredTier: 'professional',
    requiredPermissions: ['analytics:read'],
    rateLimitMultiplier: 3,
    requestSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['1d', '7d', '30d', '90d', '1y', 'all'] }
      }
    },
    responseSchema: {},
    exampleRequest: { query: { period: '30d' } },
    exampleResponse: {
      totalReturn: 15.4,
      sharpeRatio: 1.8,
      maxDrawdown: -12.3,
      winRate: 65.2
    },
    isDeprecated: false,
    version: '1.0'
  },
  {
    id: '6',
    path: '/v1/webhooks',
    method: 'POST',
    category: 'account',
    name: 'Create Webhook',
    description: 'Create a webhook to receive real-time notifications',
    requiredTier: 'professional',
    requiredPermissions: ['webhooks:write'],
    rateLimitMultiplier: 5,
    requestSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        events: { type: 'array', items: { type: 'string' } },
        secret: { type: 'string' }
      }
    },
    responseSchema: {},
    exampleRequest: {
      body: {
        url: 'https://myapp.com/webhooks/crypto',
        events: ['price.alert', 'transaction.new'],
        secret: 'whsec_xxx'
      }
    },
    exampleResponse: {
      id: 'wh_abc123',
      url: 'https://myapp.com/webhooks/crypto',
      events: ['price.alert', 'transaction.new'],
      createdAt: '2024-12-22T10:00:00Z'
    },
    isDeprecated: false,
    version: '1.0'
  }
];

const demoTiers: ApiTierDetails[] = [
  {
    tier: 'free',
    name: 'Free',
    description: 'Perfect for personal projects and getting started',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'Basic portfolio endpoints',
      'Real-time market prices',
      'Community support',
      '1 API key'
    ],
    rateLimitPerMinute: 10,
    rateLimitPerDay: 100,
    maxKeys: 1,
    supportLevel: 'Community',
    webhooks: false,
    realtimeData: false,
    historicalData: '7 days'
  },
  {
    tier: 'starter',
    name: 'Starter',
    description: 'For developers building their first crypto apps',
    priceMonthly: 29,
    priceYearly: 290,
    features: [
      'All Free features',
      'Transaction history',
      'Basic analytics',
      'Email support',
      '3 API keys'
    ],
    rateLimitPerMinute: 30,
    rateLimitPerDay: 1000,
    maxKeys: 3,
    supportLevel: 'Email',
    webhooks: false,
    realtimeData: false,
    historicalData: '30 days'
  },
  {
    tier: 'professional',
    name: 'Professional',
    description: 'For serious developers and small teams',
    priceMonthly: 99,
    priceYearly: 990,
    features: [
      'All Starter features',
      'Historical data access',
      'Advanced analytics',
      'Webhooks',
      'Priority support',
      '10 API keys'
    ],
    rateLimitPerMinute: 100,
    rateLimitPerDay: 10000,
    maxKeys: 10,
    supportLevel: 'Priority',
    webhooks: true,
    realtimeData: true,
    historicalData: '1 year'
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    priceMonthly: 499,
    priceYearly: 4990,
    features: [
      'All Professional features',
      'Unlimited historical data',
      'Custom endpoints',
      'Dedicated support',
      'SLA guarantee',
      'Unlimited API keys'
    ],
    rateLimitPerMinute: 1000,
    rateLimitPerDay: 100000,
    maxKeys: -1,
    supportLevel: 'Dedicated',
    webhooks: true,
    realtimeData: true,
    historicalData: 'Unlimited'
  }
];

// API Key Functions
export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || demoApiKeys;
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return demoApiKeys;
  }
}

export async function createApiKey(
  userId: string,
  name: string,
  permissions: string[]
): Promise<{ key: ApiKey; secretKey: string } | null> {
  try {
    // Generate a random key (in production, this would be cryptographically secure)
    const secretKey = `bv_live_${generateRandomString(32)}`;
    const keyPrefix = secretKey.substring(0, 15);
    const keyHash = await hashKey(secretKey);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        permissions,
        tier: 'free',
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return { key: data, secretKey };
  } catch (error) {
    console.error('Error creating API key:', error);
    return null;
  }
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', keyId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error revoking API key:', error);
    return false;
  }
}

export async function updateApiKeySettings(
  keyId: string,
  settings: {
    name?: string;
    permissions?: string[];
    ipWhitelist?: string[];
    allowedOrigins?: string[];
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating API key:', error);
    return false;
  }
}

// Endpoint Functions
export async function getApiEndpoints(): Promise<ApiEndpoint[]> {
  try {
    const { data, error } = await supabase
      .from('api_endpoints')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data || demoEndpoints;
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    return demoEndpoints;
  }
}

export async function getEndpointsByCategory(category: EndpointCategory): Promise<ApiEndpoint[]> {
  const endpoints = await getApiEndpoints();
  return endpoints.filter(e => e.category === category);
}

// Usage Functions
export async function getApiUsageStats(keyId: string, period: string = '30d'): Promise<ApiUsageStats> {
  try {
    const { data, error } = await supabase
      .rpc('get_api_usage_stats', { key_id: keyId, time_period: period });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return {
      totalRequests: 28450,
      successfulRequests: 27892,
      failedRequests: 558,
      averageResponseTime: 145,
      requestsByEndpoint: {
        '/v1/market/prices': 15230,
        '/v1/portfolio': 8450,
        '/v1/analytics/performance': 4770
      },
      requestsByDay: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 1500) + 500
      })).reverse(),
      errorsByType: {
        '400': 234,
        '401': 156,
        '429': 168
      }
    };
  }
}

export async function getRecentApiLogs(keyId: string, limit: number = 50): Promise<ApiUsageLog[]> {
  try {
    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('*')
      .eq('api_key_id', keyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching API logs:', error);
    return [];
  }
}

// Tier Functions
export function getApiTiers(): ApiTierDetails[] {
  return demoTiers;
}

export function getTierDetails(tier: ApiTier): ApiTierDetails | undefined {
  return demoTiers.find(t => t.tier === tier);
}

export async function upgradeTier(userId: string, newTier: ApiTier): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('api_subscriptions')
      .upsert({
        user_id: userId,
        tier: newTier,
        started_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error upgrading tier:', error);
    return false;
  }
}

// Utility Functions
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashKey(key: string): Promise<string> {
  // In production, use proper crypto hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Permission helpers
export const API_PERMISSIONS = {
  'portfolio:read': 'Read portfolio data',
  'portfolio:write': 'Modify portfolio',
  'market:read': 'Read market data',
  'trading:read': 'Read trading data',
  'trading:write': 'Execute trades',
  'analytics:read': 'Read analytics',
  'social:read': 'Read social data',
  'social:write': 'Post social content',
  'webhooks:read': 'Read webhooks',
  'webhooks:write': 'Manage webhooks',
  'account:read': 'Read account info',
  'account:write': 'Modify account'
};

export function getPermissionLabel(permission: string): string {
  return API_PERMISSIONS[permission as keyof typeof API_PERMISSIONS] || permission;
}
