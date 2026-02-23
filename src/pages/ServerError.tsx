/**
 * ServerError (500) Page
 *
 * Displayed when an unexpected error occurs on the server or client.
 */

import { Link } from 'react-router-dom';
import { Home, RefreshCw, AlertOctagon, Mail } from 'lucide-react';

export function ServerError() {
  const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="max-w-xl mx-auto px-4 text-center">
        <div className="mb-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20"
            aria-hidden="true"
          >
            <AlertOctagon className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">500</h1>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-300 mb-4">
          Something Went Wrong
        </h2>

        <p className="text-gray-400 mb-2">
          We encountered an unexpected error. Our team has been notified and is working on a fix.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Error Reference:{' '}
          <code className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">
            {errorId}
          </code>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            Try Again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            Go Home
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Need help? Contact us at{' '}
          <a
            href="mailto:support@bitcoinvestments.net"
            className="inline-flex items-center gap-1 text-brand-primary hover:text-brand-primary/80 underline"
          >
            <Mail className="w-3 h-3" aria-hidden="true" />
            support@bitcoinvestments.net
          </a>
        </p>
      </div>
    </div>
  );
}

export default ServerError;
