import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'bitcoin_investments_cookie_consent';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setShowBanner(false);

    // Here you would typically initialize or disable analytics/marketing scripts
    // based on the user's preferences
    if (prefs.analytics) {
      // Initialize analytics (e.g., Plausible, Mixpanel)
      console.log('Analytics enabled');
    }

    if (prefs.marketing) {
      // Initialize marketing cookies
      console.log('Marketing cookies enabled');
    }
  };

  const handleAcceptAll = () => {
    const allPrefs: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allPrefs);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    savePreferences(necessaryOnly);
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity pointer-events-auto ${
          showDetails ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowDetails(false)}
      />

      {/* Banner */}
      <div className="fixed bottom-0 inset-x-0 p-4 pointer-events-auto">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card border-orange-500/30 p-6 animate-slide-up">
            <div className="flex flex-col md:flex-row items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Cookie className="w-6 h-6 text-orange-500" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-white mb-2">
                  We Value Your Privacy
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  We use cookies to enhance your browsing experience, analyze site traffic, and
                  provide personalized content. You can choose which types of cookies to accept.
                </p>

                {/* Custom Preferences */}
                {showDetails && (
                  <div className="mb-4 space-y-3 p-4 bg-white/5 rounded-lg">
                    {/* Necessary Cookies */}
                    <div className="flex items-start justify-between">
                      <div className="flex-grow pr-4">
                        <label className="block text-sm font-medium text-white mb-1">
                          Necessary Cookies
                        </label>
                        <p className="text-xs text-gray-400">
                          Essential for the website to function properly. These cannot be disabled.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-12 h-6 bg-orange-500 rounded-full flex items-center px-1">
                          <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                        </div>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between">
                      <div className="flex-grow pr-4">
                        <label className="block text-sm font-medium text-white mb-1">
                          Analytics Cookies
                        </label>
                        <p className="text-xs text-gray-400">
                          Help us understand how visitors interact with our website by collecting
                          anonymous data.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreferences({ ...preferences, analytics: !preferences.analytics })
                          }
                          className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
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
                        <label className="block text-sm font-medium text-white mb-1">
                          Marketing Cookies
                        </label>
                        <p className="text-xs text-gray-400">
                          Used to track visitors across websites to display relevant ads.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreferences({ ...preferences, marketing: !preferences.marketing })
                          }
                          className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
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
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                      >
                        Save Preferences
                      </button>
                      <button
                        onClick={() => setShowDetails(false)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleAcceptAll}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                      >
                        Accept All
                      </button>
                      <button
                        onClick={handleAcceptNecessary}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                      >
                        Necessary Only
                      </button>
                      <button
                        onClick={() => setShowDetails(true)}
                        className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
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
                  <a href="/legal/terms" className="text-orange-500 hover:text-orange-400 underline">
                    Terms of Service
                  </a>
                  .
                </p>
              </div>

              {/* Close button (only visible when not showing details) */}
              {!showDetails && (
                <button
                  onClick={handleAcceptNecessary}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Close and accept necessary cookies only"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if the user has consented to a specific cookie type
 */
export function hasConsent(type: 'necessary' | 'analytics' | 'marketing'): boolean {
  if (typeof window === 'undefined') return false;

  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!consent) return false;

  try {
    const prefs: CookiePreferences = JSON.parse(consent);
    return prefs[type] || false;
  } catch {
    return false;
  }
}

/**
 * Get current cookie preferences
 */
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;

  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!consent) return null;

  try {
    return JSON.parse(consent) as CookiePreferences;
  } catch {
    return null;
  }
}
