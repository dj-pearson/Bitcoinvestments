import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut, updateUserProfile, getUserProfile, type AuthUser } from '../services/auth';
import { PriceAlerts } from '../components/PriceAlerts';
import type { User } from '../types/database';

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'alerts' | 'preferences'>('profile');

  // Preference form state
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [theme, setTheme] = useState('dark');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);

      // Load DB profile
      const dbProfile = await getUserProfile(currentUser.id);
      if (dbProfile) {
        setProfile(dbProfile);
        // Load preferences
        const prefs = dbProfile.preferences as Record<string, unknown> | null;
        if (prefs) {
          setExperienceLevel((prefs.experience_level as string) || 'beginner');
          setRiskTolerance((prefs.risk_tolerance as string) || 'moderate');
          setTheme((prefs.theme as string) || 'dark');
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setSaving(true);
    setSaveMessage(null);

    const { error } = await updateUserProfile(user.id, {
      preferences: {
        experience_level: experienceLevel,
        risk_tolerance: riskTolerance,
        theme,
        favorite_cryptocurrencies: [],
        notification_settings: {
          price_alerts: true,
          news_alerts: true,
          weekly_summary: true,
          marketing_emails: false,
        },
      },
    });

    if (error) {
      setSaveMessage({ type: 'error', text: error });
    } else {
      setSaveMessage({ type: 'success', text: 'Preferences saved successfully!' });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-red-400 hover:text-red-300 font-medium"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'profile'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Price Alerts
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'preferences'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Preferences
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <div className="px-4 py-3 bg-gray-700 rounded-lg text-white">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Account Created</label>
              <div className="px-4 py-3 bg-gray-700 rounded-lg text-white">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Subscription Status</label>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile?.subscription_status === 'premium'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {profile?.subscription_status === 'premium' ? 'Premium' : 'Free'}
                </span>
                {profile?.subscription_status !== 'premium' && (
                  <a
                    href="/pricing"
                    className="text-sm text-orange-500 hover:text-orange-400"
                  >
                    Upgrade to Premium
                  </a>
                )}
              </div>
            </div>

            {profile?.referral_code && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Your Referral Code</label>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-3 bg-gray-700 rounded-lg text-white font-mono flex-1">
                    {profile.referral_code}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(profile.referral_code || '')}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && <PriceAlerts />}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Preferences</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="beginner">Beginner - New to crypto</option>
                <option value="intermediate">Intermediate - Some experience</option>
                <option value="advanced">Advanced - Experienced investor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Risk Tolerance</label>
              <select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="conservative">Conservative - Safety first</option>
                <option value="moderate">Moderate - Balanced approach</option>
                <option value="aggressive">Aggressive - Higher risk/reward</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode (Coming Soon)</option>
              </select>
            </div>

            {saveMessage && (
              <div
                className={`p-4 rounded-lg ${
                  saveMessage.type === 'success'
                    ? 'bg-green-900/50 border border-green-700 text-green-300'
                    : 'bg-red-900/50 border border-red-700 text-red-300'
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
