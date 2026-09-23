import { AlertCircle, RefreshCw } from 'lucide-react';
import { fmtDateTime } from '../../lib/marketFormat';

interface MarketDataStatusProps {
  /** Epoch ms the data was fetched from CoinGecko. */
  fetchedAt?: number | null;
  stale?: boolean;
  /** Message when there is no data at all. */
  error?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/**
 * Source attribution + freshness line for CoinGecko-backed sections.
 * - error and no data → alert with Retry
 * - stale data → amber "as of" notice with Retry
 * - fresh data → "Source: CoinGecko · Updated {time}"
 */
export function MarketDataStatus({
  fetchedAt,
  stale,
  error,
  onRetry,
  retrying,
  className = '',
}: MarketDataStatusProps) {
  if (error && !fetchedAt) {
    return (
      <div
        role="alert"
        className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-200 ${className}`}
      >
        <div className="flex items-start gap-2 flex-1">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!fetchedAt) return null;

  if (stale) {
    return (
      <div
        role="status"
        className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 ${className}`}
      >
        <span className="flex-1">
          Couldn&apos;t refresh from CoinGecko. Showing the last data we have, as of {fmtDateTime(fetchedAt)}.
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      Source:{' '}
      <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">
        CoinGecko
      </a>{' '}
      · Updated {fmtDateTime(fetchedAt)}
    </p>
  );
}
