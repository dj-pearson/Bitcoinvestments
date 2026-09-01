/**
 * Maintenance Mode Page
 *
 * Displayed when the platform is undergoing scheduled maintenance.
 */

import { Wrench, Twitter, Mail } from 'lucide-react';

import { SEO } from '../components/SEO';
export function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-brand-dark">
      <SEO title="Scheduled Maintenance" description="Bitcoinvestments is temporarily offline for scheduled maintenance. We will be back shortly." noindex />
      <div className="max-w-xl mx-auto px-4 text-center">
        <div className="mb-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20"
            aria-hidden="true"
          >
            <Wrench className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          We'll Be Right Back
        </h1>

        <p className="text-gray-400 mb-8">
          Bitcoinvestments is currently undergoing scheduled maintenance to improve your
          experience. We'll be back online shortly.
        </p>

        <div className="glass-card p-6 mb-8">
          <p className="text-sm text-gray-400">
            Stay updated on our progress:
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <a
              href="https://twitter.com/bitcoinvestments"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              <Twitter className="w-4 h-4" aria-hidden="true" />
              Twitter
            </a>
            <a
              href="mailto:support@bitcoinvestments.net"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              Email
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-600">
          If this maintenance is unexpected, please contact support@bitcoinvestments.net
        </p>
      </div>
    </div>
  );
}

export default Maintenance;
