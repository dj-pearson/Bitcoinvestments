/**
 * Forbidden (403) Page
 *
 * Displayed when a user tries to access a resource they don't have permission for.
 */

import { Link } from 'react-router-dom';
import { Home, LogIn, ShieldAlert, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import { SEO } from '../components/SEO';
export function Forbidden() {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <SEO title="Access Denied (403)" description="You do not have permission to view this page. Sign in with an account that has access, or head back to the homepage." noindex />
      <div className="max-w-xl mx-auto px-4 text-center">
        <div className="mb-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-500/10 border border-orange-500/20"
            aria-hidden="true"
          >
            <ShieldAlert className="w-12 h-12 text-orange-400" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">403</h1>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-300 mb-4">Access Denied</h2>

        <p className="text-gray-400 mb-8">
          {user
            ? "You don't have permission to access this page. This content may require a premium subscription or admin access."
            : 'You need to be signed in to access this page.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {user ? (
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-lg transition-colors"
            >
              <CreditCard className="w-5 h-5" aria-hidden="true" />
              View Plans
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-lg transition-colors"
            >
              <LogIn className="w-5 h-5" aria-hidden="true" />
              Sign In
            </Link>
          )}
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Forbidden;
