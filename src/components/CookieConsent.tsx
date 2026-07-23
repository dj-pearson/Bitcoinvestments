import { useState, useEffect, useRef, useCallback } from 'react';
import { Cookie, X } from 'lucide-react';
import {
  CONSENT_REOPEN_EVENT,
  getCookiePreferences,
  saveCookiePreferences,
  type CookiePreferences,
} from '@/lib/consent';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const openBanner = useCallback((existing?: CookiePreferences | null) => {
    if (existing) {
      setPreferences({
        necessary: true,
        analytics: existing.analytics,
        marketing: existing.marketing,
      });
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setShowBanner(true);
  }, []);

  useEffect(() => {
    // Only auto-show on first visit (no stored decision yet).
    if (!getCookiePreferences()) {
      const timer = setTimeout(() => openBanner(), 1000);
      return () => clearTimeout(timer);
    }
  }, [openBanner]);

  // Allow other parts of the app (e.g. footer "Cookie preferences") to reopen.
  useEffect(() => {
    const handler = () => openBanner(getCookiePreferences());
    window.addEventListener(CONSENT_REOPEN_EVENT, handler);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, handler);
  }, [openBanner]);

  const closeBanner = useCallback(() => {
    setShowBanner(false);
    setShowDetails(false);
    // Restore focus to whatever was focused before the dialog opened.
    previouslyFocused.current?.focus?.();
  }, []);

  const persist = useCallback(
    (prefs: CookiePreferences) => {
      saveCookiePreferences(prefs);
      closeBanner();
    },
    [closeBanner]
  );

  const handleAcceptAll = () =>
    persist({ necessary: true, analytics: true, marketing: true });
  const handleAcceptNecessary = () =>
    persist({ necessary: true, analytics: false, marketing: false });
  const handleSaveCustom = () => persist(preferences);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (showBanner) {
      // Focus the dialog container so screen readers announce it.
      dialogRef.current?.focus();
    }
  }, [showBanner]);

  // Keyboard handling: Escape closes (necessary only), Tab is trapped.
  useEffect(() => {
    if (!showBanner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleAcceptNecessary();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBanner, showDetails, preferences]);

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay (only interactive/visible when the details panel is open) */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity pointer-events-auto ${
          showDetails ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowDetails(false)}
        aria-hidden="true"
      />

      {/* Banner */}
      <div className="fixed bottom-0 inset-x-0 p-4 pointer-events-auto">
        <div className="max-w-5xl mx-auto">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-desc"
            tabIndex={-1}
            className="glass-card border-orange-500/30 p-6 animate-slide-up focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <div className="flex flex-col md:flex-row items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Cookie className="w-6 h-6 text-orange-500" aria-hidden="true" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <h2 id="cookie-consent-title" className="text-lg font-bold text-white mb-2">
                  We Value Your Privacy
                </h2>
                <p id="cookie-consent-desc" className="text-gray-300 text-sm mb-4">
                  We use cookies to enhance your browsing experience, analyze site traffic, and
                  provide personalized content. Analytics and marketing cookies are only set with
                  your consent. You can change your choice at any time from the "Cookie
                  Preferences" link in the footer.
                </p>

                {/* Custom Preferences */}
                {showDetails && (
                  <div className="mb-4 space-y-3 p-4 bg-white/5 rounded-lg">
                    {/* Necessary Cookies */}
                    <div className="flex items-start justify-between">
                      <div className="flex-grow pr-4">
                        <span className="block text-sm font-medium text-white mb-1">
                          Necessary Cookies
                        </span>
                        <p className="text-xs text-gray-400">
                          Essential for the website to function properly. These cannot be disabled.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className="w-12 h-6 bg-orange-500 rounded-full flex items-center px-1"
                          role="img"
                          aria-label="Necessary cookies are always enabled"
                        >
                          <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                        </div>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between">
                      <div className="flex-grow pr-4">
                        <span id="analytics-cookie-label" className="block text-sm font-medium text-white mb-1">
                          Analytics Cookies
                        </span>
                        <p className="text-xs text-gray-400">
                          Help us understand how visitors interact with our website by collecting
                          anonymous data.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={preferences.analytics}
                          aria-labelledby="analytics-cookie-label"
                          onClick={() =>
                            setPreferences({ ...preferences, analytics: !preferences.analytics })
                          }
                          className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-brand-dark ${
                            preferences.analytics ? 'bg-orange-500' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              preferences.analytics ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start justify-between">
                      <div className="flex-grow pr-4">
                        <span id="marketing-cookie-label" className="block text-sm font-medium text-white mb-1">
                          Marketing Cookies
                        </span>
                        <p className="text-xs text-gray-400">
                          Used to track visitors across websites to display relevant ads.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={preferences.marketing}
                          aria-labelledby="marketing-cookie-label"
                          onClick={() =>
                            setPreferences({ ...preferences, marketing: !preferences.marketing })
                          }
                          className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-brand-dark ${
                            preferences.marketing ? 'bg-orange-500' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              preferences.marketing ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {showDetails ? (
                    <>
                      <button
                        onClick={handleSaveCustom}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-brand-dark"
                      >
                        Save Preferences
                      </button>
                      <button
                        onClick={() => setShowDetails(false)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-brand-dark"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleAcceptAll}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-brand-dark"
                      >
                        Accept All
                      </button>
                      <button
                        onClick={handleAcceptNecessary}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-brand-dark"
                      >
                        Reject Non-Essential
                      </button>
                      <button
                        onClick={() => setShowDetails(true)}
                        className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-brand-dark rounded-lg"
                      >
                        Customize
                      </button>
                    </>
                  )}
                </div>

                {/* Privacy Policy Link */}
                <p className="text-xs text-gray-400 mt-3">
                  Learn more in our{' '}
                  <a
                    href="/privacy"
                    className="text-orange-500 hover:text-orange-400 underline"
                  >
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a href="/terms" className="text-orange-500 hover:text-orange-400 underline">
                    Terms of Service
                  </a>
                  .
                </p>
              </div>

              {/* Close button (only visible when not showing details) */}
              {!showDetails && (
                <button
                  onClick={handleAcceptNecessary}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Close and reject non-essential cookies"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
