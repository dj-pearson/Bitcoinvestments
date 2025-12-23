/**
 * Navigation Configuration
 *
 * Centralized configuration for navigation items with tier-based access control.
 * Supports subscription tiers, one-time purchases, and role-based visibility.
 */

import type { SubscriptionStatus } from '../types';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  LineChart,
  ArrowLeftRight,
  Calculator,
  Wrench,
  BookOpen,
  Wallet,
  Fuel,
  TrendingUp,
  PiggyBank,
  RefreshCw,
  BarChart3,
  Activity,
  Bell,
  Clock,
  Users,
  Share2,
  Link2,
  Landmark,
  Eye,
  Shield,
  Bot,
  FileText,
  Settings,
  CreditCard,
  Briefcase,
  Building2,
  Crown,
  Sparkles,
  Key,
} from 'lucide-react';

// ==================== Types ====================

export type UserRole = 'user' | 'admin' | 'super_admin';

export type AccessRequirement =
  | 'public'           // Anyone can access
  | 'authenticated'    // Must be logged in
  | 'free'             // Free tier and above
  | 'premium'          // Premium tier and above
  | 'lifetime'         // Lifetime or premium
  | 'advisor'          // Advisor tier and above
  | 'enterprise'       // Enterprise tier only
  | 'admin'            // Admin or super_admin role
  | 'super_admin';     // Super admin only

export type OneTimePurchase =
  | 'tax_package'
  | 'hardware_wallet'
  | 'gas_optimizer'
  | 'defi_yield'
  | 'retirement_calculator'
  | 'multi_exchange'
  | 'staking_calculator'
  | 'trading_indicators'
  | 'whale_tracking'
  | 'rebalancing_alerts'
  | 'dca_automation'
  | 'alert_bundles'
  | 'onchain_analytics'
  | 'nft_portfolio'
  | 'social_trading'
  | 'influencer_verification';

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  // Access control
  access?: AccessRequirement;
  requiredPurchases?: OneTimePurchase[];  // User must have ANY of these purchases
  requiredRole?: UserRole[];              // User must have ANY of these roles
  // Display options
  badge?: 'new' | 'premium' | 'pro' | 'beta';
  showUpgradePrompt?: boolean;  // Show lock icon with upgrade prompt for non-eligible users
  hideIfNoAccess?: boolean;     // Completely hide if user doesn't have access
  // Children for dropdowns
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  access?: AccessRequirement;
  requiredRole?: UserRole[];
}

// ==================== Access Control Helpers ====================

const TIER_HIERARCHY: Record<SubscriptionStatus, number> = {
  free: 0,
  premium: 1,
  lifetime: 1,  // Same as premium
  advisor: 2,
  enterprise: 3,
};

export function hasAccessToTier(
  userTier: SubscriptionStatus | undefined,
  requiredTier: AccessRequirement
): boolean {
  if (requiredTier === 'public') return true;
  if (requiredTier === 'authenticated') return !!userTier;

  const userLevel = TIER_HIERARCHY[userTier || 'free'] || 0;

  switch (requiredTier) {
    case 'free':
      return userLevel >= 0;
    case 'premium':
    case 'lifetime':
      return userLevel >= 1;
    case 'advisor':
      return userLevel >= 2;
    case 'enterprise':
      return userLevel >= 3;
    default:
      return false;
  }
}

export function hasRoleAccess(
  userRole: UserRole | undefined,
  requiredRoles?: UserRole[]
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRole) return false;

  // Super admin can access everything
  if (userRole === 'super_admin') return true;

  // Admin can access admin and user content
  if (userRole === 'admin' && requiredRoles.includes('admin')) return true;

  return requiredRoles.includes(userRole);
}

export interface UserContext {
  isAuthenticated: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiresAt?: string | null;
  role?: UserRole;
  purchases?: OneTimePurchase[];
}

export function canAccessNavItem(
  item: NavItem,
  context: UserContext
): boolean {
  // Check role requirement first
  if (item.requiredRole && !hasRoleAccess(context.role, item.requiredRole)) {
    return false;
  }

  // Check access requirement
  if (item.access) {
    if (item.access === 'admin' || item.access === 'super_admin') {
      return hasRoleAccess(context.role, [item.access]);
    }
    if (!hasAccessToTier(context.subscriptionStatus, item.access)) {
      // Check if user has required purchase as fallback
      if (item.requiredPurchases && context.purchases) {
        return item.requiredPurchases.some(p => context.purchases?.includes(p));
      }
      return false;
    }
  }

  return true;
}

export function filterNavItems(
  items: NavItem[],
  context: UserContext
): NavItem[] {
  return items
    .filter(item => {
      if (item.hideIfNoAccess && !canAccessNavItem(item, context)) {
        return false;
      }
      return true;
    })
    .map(item => ({
      ...item,
      children: item.children ? filterNavItems(item.children, context) : undefined,
    }));
}

// ==================== Main Navigation Configuration ====================

export const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    access: 'authenticated',
  },
  {
    label: 'Charts',
    href: '/charts',
    icon: LineChart,
    access: 'public',
  },
  {
    label: 'Compare',
    href: '/compare',
    icon: ArrowLeftRight,
    children: [
      { label: 'Exchanges', href: '/compare?tab=exchanges' },
      { label: 'Wallets', href: '/compare?tab=wallets' },
      { label: 'Lending Rates', href: '/lending', badge: 'new' },
    ],
  },
  {
    label: 'Calculators',
    href: '/calculators',
    icon: Calculator,
    children: [
      { label: 'DCA Calculator', href: '/calculators?type=dca' },
      { label: 'Fee Calculator', href: '/calculators?type=fees' },
      { label: 'Staking Calculator', href: '/staking-calculator', badge: 'new' },
      { label: 'Tax Calculator', href: '/calculators?type=tax' },
      { label: 'Retirement Calculator', href: '/retirement-calculator', badge: 'premium', access: 'premium', requiredPurchases: ['retirement_calculator'] },
    ],
  },
  {
    label: 'Tools',
    href: '/portfolio-analysis',
    icon: Wrench,
    children: [
      { label: 'Portfolio Analysis', href: '/portfolio-analysis', access: 'authenticated' },
      { label: 'Backtesting', href: '/backtesting', access: 'authenticated' },
      { label: 'Tax Reports', href: '/tax-reports', access: 'authenticated' },
      { label: 'Web3 Features', href: '/web3' },
      { label: 'Scam Database', href: '/scam-database' },
    ],
  },
  {
    label: 'Premium',
    href: '/premium',
    icon: Crown,
    badge: 'premium',
    children: [
      // Trading & Analysis
      {
        label: 'Trading Indicators',
        href: '/trading-indicators',
        icon: BarChart3,
        description: 'RSI, MACD, Bollinger Bands',
        badge: 'pro',
        access: 'premium',
        requiredPurchases: ['trading_indicators'],
        showUpgradePrompt: true,
      },
      {
        label: 'On-Chain Analytics',
        href: '/onchain-analytics',
        icon: Activity,
        description: 'NVT, MVRV, SOPR metrics',
        badge: 'pro',
        access: 'premium',
        requiredPurchases: ['onchain_analytics'],
        showUpgradePrompt: true,
      },
      {
        label: 'Whale Tracking',
        href: '/whale-tracking',
        icon: Eye,
        description: 'Track large wallet movements',
        badge: 'pro',
        access: 'premium',
        requiredPurchases: ['whale_tracking'],
        showUpgradePrompt: true,
      },
      // Automation & Alerts
      {
        label: 'DCA Automation',
        href: '/dca-automation',
        icon: Clock,
        description: 'Automated dollar-cost averaging',
        badge: 'new',
        access: 'premium',
        requiredPurchases: ['dca_automation'],
        showUpgradePrompt: true,
      },
      {
        label: 'Rebalancing Alerts',
        href: '/rebalancing-alerts',
        icon: RefreshCw,
        description: 'AI-powered portfolio drift alerts',
        access: 'premium',
        requiredPurchases: ['rebalancing_alerts'],
        showUpgradePrompt: true,
      },
      {
        label: 'Smart Alert Bundles',
        href: '/alert-bundles',
        icon: Bell,
        description: 'Pre-configured alert packages',
        badge: 'new',
        access: 'premium',
        requiredPurchases: ['alert_bundles'],
        showUpgradePrompt: true,
      },
      // Portfolio & Sync
      {
        label: 'Multi-Exchange Sync',
        href: '/multi-exchange',
        icon: RefreshCw,
        description: 'Auto-sync portfolios via API',
        access: 'premium',
        requiredPurchases: ['multi_exchange'],
        showUpgradePrompt: true,
      },
      {
        label: 'Hardware Wallet',
        href: '/hardware-wallet',
        icon: Wallet,
        description: 'Track cold storage assets',
        access: 'premium',
        requiredPurchases: ['hardware_wallet'],
        showUpgradePrompt: true,
      },
      // DeFi
      {
        label: 'DeFi Yield',
        href: '/defi-yield',
        icon: TrendingUp,
        description: 'Compare yield farming opportunities',
        badge: 'new',
        access: 'premium',
        requiredPurchases: ['defi_yield'],
        showUpgradePrompt: true,
      },
      {
        label: 'Gas Optimizer',
        href: '/gas-optimizer',
        icon: Fuel,
        description: 'Predict optimal transaction timing',
        access: 'premium',
        requiredPurchases: ['gas_optimizer'],
        showUpgradePrompt: true,
      },
      // Social
      {
        label: 'Social Trading',
        href: '/social-trading',
        icon: Share2,
        description: 'Copy successful portfolios',
        badge: 'new',
        access: 'premium',
        requiredPurchases: ['social_trading'],
        showUpgradePrompt: true,
      },
      {
        label: 'Influencer Verification',
        href: '/influencer-verification',
        icon: Shield,
        description: 'Verify crypto influencer claims',
        access: 'premium',
        requiredPurchases: ['influencer_verification'],
        showUpgradePrompt: true,
      },
    ],
  },
  {
    label: 'Learn',
    href: '/learn',
    icon: BookOpen,
    access: 'public',
  },
];

// ==================== User Profile Menu Items ====================

export const userMenuItems: NavItem[] = [
  {
    label: 'Profile Settings',
    href: '/profile',
    icon: Settings,
    access: 'authenticated',
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    access: 'authenticated',
  },
  {
    label: 'Portfolio Analysis',
    href: '/portfolio-analysis',
    icon: BarChart3,
    access: 'authenticated',
  },
  {
    label: 'Backtesting',
    href: '/backtesting',
    icon: Activity,
    access: 'authenticated',
  },
  {
    label: 'Tax Reports',
    href: '/tax-reports',
    icon: FileText,
    access: 'authenticated',
  },
  {
    label: 'Affiliate Stats',
    href: '/affiliate-stats',
    icon: Link2,
    access: 'authenticated',
  },
  {
    label: 'Subscription',
    href: '/pricing',
    icon: CreditCard,
    access: 'authenticated',
  },
];

// ==================== Advisor-Specific Menu Items ====================

export const advisorMenuItems: NavItem[] = [
  {
    label: 'Client Dashboard',
    href: '/advisor/clients',
    icon: Users,
    access: 'advisor',
    description: 'Manage client portfolios',
  },
  {
    label: 'White-Label Reports',
    href: '/advisor/reports',
    icon: FileText,
    access: 'advisor',
    description: 'Generate branded reports',
  },
  {
    label: 'Compliance Exports',
    href: '/advisor/compliance',
    icon: Shield,
    access: 'advisor',
    description: 'Regulatory documentation',
  },
  {
    label: 'Branding Settings',
    href: '/advisor/branding',
    icon: Sparkles,
    access: 'advisor',
    description: 'Customize your brand',
  },
];

// ==================== Enterprise-Specific Menu Items ====================

export const enterpriseMenuItems: NavItem[] = [
  {
    label: 'Team Management',
    href: '/enterprise/team',
    icon: Users,
    access: 'enterprise',
    description: 'Manage team members',
  },
  {
    label: 'API Access',
    href: '/developers/portal',
    icon: Key,
    access: 'enterprise',
    description: 'API keys and documentation',
  },
  {
    label: 'Enterprise Dashboard',
    href: '/enterprise/dashboard',
    icon: Building2,
    access: 'enterprise',
    description: 'Organization overview',
  },
];

// ==================== Admin Navigation ====================

export const adminNavSections: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        description: 'System overview and KPIs',
      },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    items: [
      {
        label: 'User Management',
        href: '/admin/users',
        icon: Users,
        description: 'Manage user accounts',
      },
      {
        label: 'Scam Database',
        href: '/admin/scam-database',
        icon: Shield,
        description: 'Review scam reports',
      },
      {
        label: 'Content Management',
        href: '/admin/content',
        icon: FileText,
        description: 'Manage articles and guides',
      },
    ],
  },
  {
    id: 'monetization',
    label: 'Monetization',
    items: [
      {
        label: 'Subscription Analytics',
        href: '/admin/subscriptions',
        icon: CreditCard,
        description: 'Revenue and subscriber metrics',
      },
      {
        label: 'Ad Manager',
        href: '/admin/ads',
        icon: Briefcase,
        description: 'Manage advertisements',
      },
      {
        label: 'Affiliate Performance',
        href: '/admin/affiliates',
        icon: Link2,
        description: 'Track affiliate earnings',
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        label: 'AI Settings',
        href: '/admin/ai-settings',
        icon: Bot,
        description: 'Configure AI models',
      },
      {
        label: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: Activity,
        description: 'System activity logs',
      },
      {
        label: 'System Settings',
        href: '/admin/settings',
        icon: Settings,
        description: 'Global configuration',
        requiredRole: ['super_admin'],
      },
    ],
  },
];

// ==================== Helper to get all admin nav items flat ====================

export function getAdminNavItems(): NavItem[] {
  return adminNavSections.flatMap(section => section.items);
}

// ==================== Get navigation for user context ====================

export function getNavigationForUser(context: UserContext) {
  return {
    mainNav: filterNavItems(mainNavItems, context),
    userMenu: filterNavItems(userMenuItems, context),
    advisorMenu: context.subscriptionStatus === 'advisor' || context.subscriptionStatus === 'enterprise'
      ? filterNavItems(advisorMenuItems, context)
      : [],
    enterpriseMenu: context.subscriptionStatus === 'enterprise'
      ? filterNavItems(enterpriseMenuItems, context)
      : [],
    adminNav: context.role === 'admin' || context.role === 'super_admin'
      ? adminNavSections
      : [],
  };
}
