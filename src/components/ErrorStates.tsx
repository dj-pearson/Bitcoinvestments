/**
 * Enhanced Error State Components
 *
 * Provides user-friendly error states with:
 * - Clear, actionable messaging
 * - Recovery actions
 * - Contextual icons
 * - Retry functionality
 * - Support links
 */

import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  WifiOff,
  RefreshCw,
  Home,
  ChevronLeft,
  Lock,
  ShieldX,
  Clock,
  ServerCrash,
  Search,
  Ban,
  HelpCircle,
  Mail,
  ExternalLink,
  type LucideIcon
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface ErrorAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: LucideIcon;
  external?: boolean;
}

interface ErrorStateProps {
  title: string;
  message: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: ErrorAction[];
  technicalDetails?: string;
  showSupport?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================
// Helper Components
// ============================================

function ErrorActionButton({ action }: { action: ErrorAction }) {
  const Icon = action.icon;
  const className = cn(
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    action.variant === 'primary' && 'px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white',
    action.variant === 'secondary' && 'px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10',
    action.variant === 'ghost' && 'px-4 py-2 text-gray-400 hover:text-white'
  );

  if (action.href) {
    if (action.external) {
      return (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {Icon && <Icon className="w-4 h-4" />}
          {action.label}
          {action.external && <ExternalLink className="w-3 h-3" />}
        </a>
      );
    }
    return (
      <Link to={action.href} className={className}>
        {Icon && <Icon className="w-4 h-4" />}
        {action.label}
      </Link>
    );
  }

  return (
    <button onClick={action.onClick} className={className}>
      {Icon && <Icon className="w-4 h-4" />}
      {action.label}
    </button>
  );
}

// ============================================
// Main ErrorState Component
// ============================================

export function ErrorState({
  title,
  message,
  icon: Icon = AlertTriangle,
  iconColor = 'text-red-400',
  actions,
  technicalDetails,
  showSupport = true,
  compact = false,
  className
}: ErrorStateProps) {
  const showTechnicalDetails = import.meta.env.DEV && technicalDetails;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className={cn(
        'rounded-full bg-white/5 flex items-center justify-center mb-6',
        compact ? 'w-14 h-14 mb-4' : 'w-16 h-16 mb-6'
      )}>
        <Icon className={cn(
          iconColor,
          compact ? 'w-7 h-7' : 'w-8 h-8'
        )} />
      </div>

      {/* Content */}
      <div className={cn('max-w-md', compact && 'max-w-sm')}>
        <h2 className={cn(
          'font-semibold text-white mb-2',
          compact ? 'text-lg' : 'text-xl'
        )}>
          {title}
        </h2>

        <p className={cn(
          'text-gray-400 mb-6',
          compact ? 'text-sm mb-4' : 'text-base mb-6'
        )}>
          {message}
        </p>

        {/* Technical details (dev only) */}
        {showTechnicalDetails && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
            <p className="text-xs font-mono text-red-400 break-all">
              {technicalDetails}
            </p>
          </div>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {actions.map((action, index) => (
              <ErrorActionButton key={index} action={action} />
            ))}
          </div>
        )}

        {/* Support link */}
        {showSupport && (
          <p className="text-xs text-gray-500">
            Need help?{' '}
            <a
              href="mailto:support@bitcoinvestments.net"
              className="text-brand-primary hover:text-brand-primary/80 underline"
            >
              Contact support
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Preset Error States
// ============================================

interface PresetErrorProps {
  onRetry?: () => void;
  className?: string;
}

/**
 * Network/connection error
 */
export function NetworkError({ onRetry, className }: PresetErrorProps) {
  return (
    <ErrorState
      icon={WifiOff}
      iconColor="text-amber-400"
      title="Connection problem"
      message="Unable to connect to the server. Please check your internet connection and try again."
      actions={[
        { label: 'Try again', variant: 'primary', onClick: onRetry, icon: RefreshCw },
        { label: 'Go home', variant: 'secondary', href: '/', icon: Home }
      ]}
      className={className}
    />
  );
}

/**
 * 404 Not Found
 */
export function NotFoundError({ className }: PresetErrorProps) {
  return (
    <ErrorState
      icon={Search}
      iconColor="text-gray-400"
      title="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
      actions={[
        { label: 'Go home', variant: 'primary', href: '/', icon: Home },
        { label: 'Go back', variant: 'secondary', onClick: () => window.history.back(), icon: ChevronLeft }
      ]}
      showSupport={false}
      className={className}
    />
  );
}

/**
 * 401/403 Authentication/Authorization error
 */
export function AuthError({ className }: PresetErrorProps) {
  return (
    <ErrorState
      icon={Lock}
      iconColor="text-amber-400"
      title="Access denied"
      message="You need to sign in to view this page. If you believe this is an error, try signing out and back in."
      actions={[
        { label: 'Sign in', variant: 'primary', href: '/login' },
        { label: 'Go home', variant: 'secondary', href: '/', icon: Home }
      ]}
      className={className}
    />
  );
}

/**
 * Permission denied (authenticated but not authorized)
 */
export function PermissionError({ className }: PresetErrorProps) {
  return (
    <ErrorState
      icon={ShieldX}
      iconColor="text-red-400"
      title="Permission denied"
      message="You don't have permission to access this resource. Contact an administrator if you believe this is a mistake."
      actions={[
        { label: 'Go back', variant: 'primary', onClick: () => window.history.back(), icon: ChevronLeft },
        { label: 'Contact support', variant: 'secondary', href: 'mailto:support@bitcoinvestments.net', icon: Mail }
      ]}
      className={className}
    />
  );
}

/**
 * Rate limit exceeded
 */
export function RateLimitError({ onRetry, className }: PresetErrorProps) {
  return (
    <ErrorState
      icon={Clock}
      iconColor="text-amber-400"
      title="Too many requests"
      message="You've made too many requests. Please wait a moment before trying again."
      actions={[
        { label: 'Wait and retry', variant: 'primary', onClick: onRetry, icon: RefreshCw }
      ]}
      className={className}
    />
  );
}

/**
 * Server error (500)
 */
export function ServerError({ onRetry, className }: PresetErrorProps) {
  return (
    <ErrorState
      icon={ServerCrash}
      iconColor="text-red-400"
      title="Something went wrong"
      message="We're experiencing technical difficulties. Our team has been notified and is working on it."
      actions={[
        { label: 'Try again', variant: 'primary', onClick: onRetry, icon: RefreshCw },
        { label: 'Go home', variant: 'secondary', href: '/', icon: Home }
      ]}
      className={className}
    />
  );
}

/**
 * Maintenance mode
 */
export function MaintenanceError({ className }: PresetErrorProps) {
  return (
    <ErrorState
      icon={Clock}
      iconColor="text-brand-primary"
      title="Under maintenance"
      message="We're performing scheduled maintenance. The site will be back shortly. Thanks for your patience!"
      actions={[
        { label: 'Check status', variant: 'primary', href: 'https://status.bitcoinvestments.net', external: true }
      ]}
      showSupport={false}
      className={className}
    />
  );
}

/**
 * Feature disabled/unavailable
 */
export function FeatureUnavailable({ featureName, className }: PresetErrorProps & { featureName?: string }) {
  return (
    <ErrorState
      icon={Ban}
      iconColor="text-gray-400"
      title={featureName ? `${featureName} is unavailable` : 'Feature unavailable'}
      message="This feature is temporarily unavailable. Please try again later or contact support if the issue persists."
      actions={[
        { label: 'Go back', variant: 'primary', onClick: () => window.history.back(), icon: ChevronLeft }
      ]}
      className={className}
    />
  );
}

/**
 * Data loading error (inline variant)
 */
export function DataLoadError({ onRetry, message, className }: PresetErrorProps & { message?: string }) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-8 px-4 text-center',
      className
    )}>
      <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
      <p className="text-sm text-gray-400 mb-4">
        {message || 'Failed to load data'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  );
}

// ============================================
// Inline Error Banner
// ============================================

interface ErrorBannerProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export function ErrorBanner({
  title,
  message,
  onDismiss,
  onRetry,
  variant = 'error',
  className
}: ErrorBannerProps) {
  const variants = {
    error: {
      bg: 'bg-red-500/10 border-red-500/20',
      icon: AlertCircle,
      iconColor: 'text-red-400',
      textColor: 'text-red-400'
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      textColor: 'text-amber-400'
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20',
      icon: HelpCircle,
      iconColor: 'text-blue-400',
      textColor: 'text-blue-400'
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex items-start gap-3',
        config.bg,
        className
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('font-medium mb-1', config.textColor)}>
            {title}
          </h4>
        )}
        <p className={cn('text-sm', config.textColor)}>
          {message}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition-colors',
              config.textColor,
              'hover:opacity-80'
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Dismiss"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      )}
    </div>
  );
}

// ============================================
// Form Error Summary
// ============================================

interface FormErrorSummaryProps {
  errors: Record<string, string>;
  title?: string;
  className?: string;
}

export function FormErrorSummary({
  errors,
  title = 'Please fix the following errors:',
  className
}: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([, value]) => value);

  if (errorEntries.length === 0) return null;

  return (
    <div
      className={cn(
        'rounded-lg border bg-red-500/10 border-red-500/20 p-4',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-red-400 mb-2">{title}</h4>
          <ul className="space-y-1">
            {errorEntries.map(([field, error]) => (
              <li key={field} className="text-sm text-red-400/80">
                <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>: {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
