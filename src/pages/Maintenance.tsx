/**
 * Maintenance Mode Page
 *
 * Displayed when the platform is undergoing scheduled maintenance.
 */

import { Wrench, Mail } from 'lucide-react';

import { SEO } from '../components/SEO';
export function Maintenance() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
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

        <p className="text-gray-300 mb-8">
          Bitcoinvestments is down for maintenance. Please try again shortly.
        </p>

        <p className="text-sm text-gray-400">
          Need help?{' '}
          <a
            href="mailto:support@bitcoinvestments.net"
            className="inline-flex items-center gap-1 text-brand-primary underline"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            support@bitcoinvestments.net
          </a>
        </p>
      </div>
    </div>
  );
}

export default Maintenance;
