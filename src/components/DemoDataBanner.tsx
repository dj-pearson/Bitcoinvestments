/**
 * DemoDataBanner
 *
 * Several dashboards render hardcoded sample rows behind a simulated API delay,
 * which makes fabricated figures look like live data. On an admin billing page
 * that is a real hazard: someone can read a made-up MRR number and act on it.
 *
 * This banner marks those screens explicitly until each one is wired to its
 * real data source. It is deliberately loud — remove the banner in the same
 * change that connects the page, not before.
 */

import { AlertTriangle } from 'lucide-react';

interface DemoDataBannerProps {
  /** What this screen will read from once it is connected, e.g. "Stripe billing". */
  source: string;
  className?: string;
}

export function DemoDataBanner({ source, className = '' }: DemoDataBannerProps) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 p-4 mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 ${className}`}
    >
      <AlertTriangle
        className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="text-sm">
        <p className="font-semibold text-amber-200">Sample data — not live</p>
        <p className="text-amber-100/80 mt-0.5">
          Every figure on this page is placeholder content. It is not read from {source} and
          must not be used for reporting or decisions.
        </p>
      </div>
    </div>
  );
}

export default DemoDataBanner;
