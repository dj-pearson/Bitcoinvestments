/**
 * Empty State Components
 *
 * Provides helpful empty state designs with:
 * - Contextual illustrations/icons
 * - Clear messaging
 * - Call-to-action buttons
 * - Suggestions for next steps
 */

import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  Inbox,
  Search,
  FileText,
  Wallet,
  TrendingUp,
  PieChart,
  Bell,
  History,
  Star,
  Users,
  Settings,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  type LucideIcon
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  illustration?: 'search' | 'inbox' | 'portfolio' | 'chart' | 'wallet' | 'notifications' | 'history' | 'settings';
  actions?: EmptyStateAction[];
  suggestions?: string[];
  compact?: boolean;
  className?: string;
}

// ============================================
// Icon Illustrations
// ============================================

const illustrations: Record<NonNullable<EmptyStateProps['illustration']>, LucideIcon> = {
  search: Search,
  inbox: Inbox,
  portfolio: PieChart,
  chart: TrendingUp,
  wallet: Wallet,
  notifications: Bell,
  history: History,
  settings: Settings,
};

// ============================================
// Main EmptyState Component
// ============================================

export function EmptyState({
  title,
  description,
  icon: CustomIcon,
  illustration,
  actions,
  suggestions,
  compact = false,
  className
}: EmptyStateProps) {
  const Icon = CustomIcon || (illustration ? illustrations[illustration] : Inbox);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      {/* Icon/Illustration */}
      <div className={cn(
        'relative mb-6',
        compact ? 'mb-4' : 'mb-6'
      )}>
        {/* Background glow */}
        <div className="absolute inset-0 blur-2xl bg-brand-primary/20 rounded-full scale-150" />

        {/* Icon container */}
        <div className={cn(
          'relative rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10',
          'flex items-center justify-center',
          compact ? 'w-16 h-16' : 'w-20 h-20'
        )}>
          <Icon className={cn(
            'text-gray-400',
            compact ? 'w-8 h-8' : 'w-10 h-10'
          )} />
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        'max-w-sm',
        compact ? 'max-w-xs' : 'max-w-sm'
      )}>
        <h3 className={cn(
          'font-semibold text-white mb-2',
          compact ? 'text-lg' : 'text-xl'
        )}>
          {title}
        </h3>

        <p className={cn(
          'text-gray-400 mb-6',
          compact ? 'text-sm mb-4' : 'text-base mb-6'
        )}>
          {description}
        </p>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className={cn(
            'flex flex-wrap justify-center gap-3',
            compact ? 'gap-2' : 'gap-3'
          )}>
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              const buttonClasses = cn(
                'inline-flex items-center gap-2 font-medium transition-all duration-200',
                compact ? 'px-4 py-2 text-sm' : 'px-5 py-2.5',
                action.variant === 'primary' && 'rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white shadow-glow-sm hover:shadow-glow-md',
                action.variant === 'secondary' && 'rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10',
                action.variant === 'ghost' && 'text-gray-400 hover:text-white'
              );

              if (action.href) {
                return (
                  <Link key={index} to={action.href} className={buttonClasses}>
                    {ActionIcon && <ActionIcon className="w-4 h-4" />}
                    {action.label}
                    {action.variant === 'primary' && !ActionIcon && (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </Link>
                );
              }

              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={buttonClasses}
                >
                  {ActionIcon && <ActionIcon className="w-4 h-4" />}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Suggestions
            </p>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-400"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Preset Empty States
// ============================================

interface PresetEmptyStateProps {
  actions?: EmptyStateAction[];
  className?: string;
}

/**
 * Empty state for search results
 */
export function NoSearchResults({ actions, className }: PresetEmptyStateProps & { query?: string }) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      description="We couldn't find anything matching your search. Try different keywords or check your spelling."
      suggestions={[
        'Try using fewer or different keywords',
        'Check for typos in your search',
        'Use broader search terms'
      ]}
      actions={actions || [
        { label: 'Clear search', variant: 'secondary' }
      ]}
      className={className}
    />
  );
}

/**
 * Empty state for portfolio/holdings
 */
export function NoHoldings({ actions, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      illustration="portfolio"
      title="No holdings yet"
      description="Start building your portfolio by adding your first cryptocurrency holding."
      actions={actions || [
        { label: 'Add your first holding', variant: 'primary', icon: Plus, href: '/portfolio-analysis' }
      ]}
      suggestions={[
        'Connect your exchange accounts',
        'Manually add your holdings',
        'Import from a CSV file'
      ]}
      className={className}
    />
  );
}

/**
 * Empty state for transactions
 */
export function NoTransactions({ actions, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      illustration="history"
      title="No transactions yet"
      description="Your transaction history will appear here once you start tracking your trades."
      actions={actions || [
        { label: 'Add transaction', variant: 'primary', icon: Plus },
        { label: 'Import from exchange', variant: 'secondary' }
      ]}
      className={className}
    />
  );
}

/**
 * Empty state for notifications
 */
export function NoNotifications({ actions, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      illustration="notifications"
      title="All caught up!"
      description="You have no new notifications. Set up alerts to stay informed about market movements."
      actions={actions || [
        { label: 'Set up alerts', variant: 'primary', href: '/alert-bundles' }
      ]}
      compact
      className={className}
    />
  );
}

/**
 * Empty state for watchlist
 */
export function NoWatchlistItems({ actions, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Star}
      title="Your watchlist is empty"
      description="Add cryptocurrencies to your watchlist to track their prices and performance."
      actions={actions || [
        { label: 'Browse coins', variant: 'primary', href: '/charts' },
        { label: 'Learn how', variant: 'ghost' }
      ]}
      className={className}
    />
  );
}

/**
 * Empty state for data loading failed
 */
export function NoDataAvailable({ actions, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      illustration="chart"
      title="No data available"
      description="We couldn't load the data. This might be temporary - please try again."
      actions={actions || [
        { label: 'Retry', variant: 'primary' }
      ]}
      className={className}
    />
  );
}

/**
 * Empty state for new users
 */
export function WelcomeNewUser({ actions, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Sparkles}
      title="Welcome to Bitcoin Investments!"
      description="Get started with your crypto journey. Here are some things you can do to get the most out of the platform."
      actions={actions || [
        { label: 'Take the tour', variant: 'primary', icon: ArrowRight },
        { label: 'Skip for now', variant: 'ghost' }
      ]}
      suggestions={[
        'Connect your wallet or exchange',
        'Explore the learning center',
        'Set up price alerts'
      ]}
      className={className}
    />
  );
}

/**
 * Empty state for premium features
 */
export function PremiumFeatureTeaser({
  featureName,
  actions,
  className
}: PresetEmptyStateProps & { featureName: string }) {
  return (
    <EmptyState
      icon={ShieldCheck}
      title={`Unlock ${featureName}`}
      description="This premium feature helps you make smarter investment decisions. Upgrade to access advanced tools and analytics."
      actions={actions || [
        { label: 'Upgrade now', variant: 'primary', href: '/pricing' },
        { label: 'Learn more', variant: 'secondary' }
      ]}
      className={className}
    />
  );
}

/**
 * Empty state for social/community features
 */
export function NoCommunityContent({ actions, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Users}
      title="Be the first to contribute"
      description="No community content yet. Share your insights and help others in their crypto journey."
      actions={actions || [
        { label: 'Start a discussion', variant: 'primary', icon: Plus },
        { label: 'Browse topics', variant: 'secondary' }
      ]}
      className={className}
    />
  );
}

/**
 * Empty state for reports
 */
export function NoReportsAvailable({ actions, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={FileText}
      title="No reports generated yet"
      description="Generate your first report to track your portfolio performance and tax obligations."
      actions={actions || [
        { label: 'Generate report', variant: 'primary', href: '/tax-reports' }
      ]}
      className={className}
    />
  );
}

// ============================================
// Table Empty State (inline variant)
// ============================================

interface TableEmptyStateProps {
  message?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function TableEmptyState({
  message = 'No data to display',
  action,
  className
}: TableEmptyStateProps) {
  return (
    <tr>
      <td
        colSpan={100}
        className={cn('text-center py-12', className)}
      >
        <div className="flex flex-col items-center gap-3">
          <Inbox className="w-8 h-8 text-gray-500" />
          <p className="text-gray-400">{message}</p>
          {action && (
            action.href ? (
              <Link
                to={action.href}
                className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
              >
                {action.label}
              </button>
            )
          )}
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Card Empty State (small inline variant)
// ============================================

interface CardEmptyStateProps {
  icon?: LucideIcon;
  message: string;
  action?: EmptyStateAction;
  className?: string;
}

export function CardEmptyState({
  icon: Icon = Inbox,
  message,
  action,
  className
}: CardEmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-8 px-4 text-center',
      className
    )}>
      <Icon className="w-6 h-6 text-gray-500 mb-2" />
      <p className="text-sm text-gray-400 mb-3">{message}</p>
      {action && (
        action.href ? (
          <Link
            to={action.href}
            className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium flex items-center gap-1"
          >
            {action.label}
            <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

export default EmptyState;
