/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */

import React from 'react';
import { RefreshCw, AlertTriangle, Home, ChevronLeft } from 'lucide-react';
import { captureException, addBreadcrumb } from '../services/errorLogging';

// Fallback error boundary when Sentry is not available
class SentryErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: any; onError?: any; showDialog?: boolean },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo.componentStack, 'no-id');
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} resetError={() => this.setState({ hasError: false })} componentStack="" eventId="" />;
    }
    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: unknown;
  componentStack: string;
  eventId: string;
  resetError: () => void;
}

/**
 * Get error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Fallback UI shown when an error occurs
 */
function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="glass-card p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Something went wrong
          </h1>

          <p className="text-gray-400 mb-6">
            We've encountered an unexpected error. Our team has been notified and is working to fix it.
          </p>

          {/* Error details (only in development) */}
          {import.meta.env.DEV && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
              <p className="text-sm font-mono text-red-400 break-all">
                {getErrorMessage(error)}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Go Back
            </button>

            <button
              onClick={resetError}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            If this problem persists, please{' '}
            <a
              href="mailto:support@bitcoinvestments.net"
              className="text-brand-primary hover:underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Page-level error fallback - catches errors in page components
 */
function PageErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Failed to load this section
          </h2>

          <p className="text-gray-400 mb-6 text-sm">
            There was a problem loading this content. Please try again.
          </p>

          {import.meta.env.DEV && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
              <p className="text-xs font-mono text-red-400 break-all">
                {getErrorMessage(error)}
              </p>
            </div>
          )}

          <button
            onClick={resetError}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Main application error boundary
 * Wraps the entire app and catches any unhandled errors
 */
export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  const handleError = (error: unknown, componentStack: string, eventId: string) => {
    // Log error details for debugging
    addBreadcrumb({
      message: 'Error boundary caught error',
      category: 'error',
      level: 'error',
      data: {
        error: getErrorMessage(error),
        componentStack,
        eventId,
      },
    });

    // Capture the error with Sentry
    captureException(error, {
      tags: { errorBoundary: 'app' },
      extra: { componentStack, eventId },
    });
  };

  return (
    <SentryErrorBoundary
      fallback={ErrorFallback}
      onError={handleError}
      showDialog={import.meta.env.PROD} // Show feedback dialog in production
    >
      {children}
    </SentryErrorBoundary>
  );
}

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

/**
 * Page-level error boundary
 * Wraps individual pages to catch errors without crashing the entire app
 */
export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  const handleError = (error: unknown, componentStack: string, eventId: string) => {
    addBreadcrumb({
      message: `Page error: ${pageName || 'unknown'}`,
      category: 'error',
      level: 'error',
      data: {
        error: getErrorMessage(error),
        pageName,
        eventId,
      },
    });

    captureException(error, {
      tags: {
        errorBoundary: 'page',
        pageName: pageName || 'unknown',
      },
      extra: { componentStack, eventId },
    });
  };

  return (
    <SentryErrorBoundary
      fallback={PageErrorFallback}
      onError={handleError}
    >
      {children}
    </SentryErrorBoundary>
  );
}

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ReactNode;
}

/**
 * Component-level error boundary
 * For wrapping individual components that might fail
 */
export function ComponentErrorBoundary({
  children,
  componentName,
  fallback,
}: ComponentErrorBoundaryProps) {
  const handleError = (error: unknown, _componentStack: string, _eventId: string) => {
    captureException(error, {
      tags: {
        errorBoundary: 'component',
        componentName: componentName || 'unknown',
      },
    });
  };

  const defaultFallback = (
    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
      <p className="text-sm text-red-400">
        Failed to load {componentName || 'component'}
      </p>
    </div>
  );

  const fallbackElement = fallback ? (
    <>{fallback}</>
  ) : defaultFallback;

  return (
    <SentryErrorBoundary
      fallback={() => fallbackElement}
      onError={handleError}
    >
      {children}
    </SentryErrorBoundary>
  );
}

export default AppErrorBoundary;
