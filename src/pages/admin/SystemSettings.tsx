import { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  Globe,
  Mail,
  Shield,
  Database,
  Key,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  settings: SettingItem[];
}

interface SettingItem {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'email' | 'number' | 'toggle' | 'select' | 'secret';
  value: any;
  options?: { value: string; label: string }[];
  envVar?: string;
}

export function SystemSettings() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    // Simulate loading settings
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSettings({
      site_name: 'BitcoinVestments',
      site_url: 'https://bitcoinvestments.com',
      support_email: 'support@bitcoinvestments.com',
      maintenance_mode: false,
      registration_enabled: true,
      email_verification: true,
      two_factor_required: false,
      session_timeout: 30,
      max_login_attempts: 5,
      default_theme: 'dark',
      stripe_webhook_url: 'https://api.bitcoinvestments.com/api/stripe-webhook',
      coingecko_rate_limit: 30,
    });
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    // Simulate saving
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
    setSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  }

  const sections: SettingsSection[] = [
    {
      id: 'general',
      title: 'General',
      description: 'Basic site configuration',
      icon: Globe,
      settings: [
        {
          key: 'site_name',
          label: 'Site Name',
          description: 'The name of your platform',
          type: 'text',
          value: settings.site_name,
        },
        {
          key: 'site_url',
          label: 'Site URL',
          description: 'The primary domain for your platform',
          type: 'text',
          value: settings.site_url,
        },
        {
          key: 'maintenance_mode',
          label: 'Maintenance Mode',
          description: 'Enable to show maintenance page to users',
          type: 'toggle',
          value: settings.maintenance_mode,
        },
        {
          key: 'default_theme',
          label: 'Default Theme',
          description: 'Default color theme for new users',
          type: 'select',
          value: settings.default_theme,
          options: [
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'system', label: 'System' },
          ],
        },
      ],
    },
    {
      id: 'email',
      title: 'Email',
      description: 'Email service configuration',
      icon: Mail,
      settings: [
        {
          key: 'support_email',
          label: 'Support Email',
          description: 'Email address for support inquiries',
          type: 'email',
          value: settings.support_email,
        },
        {
          key: 'email_verification',
          label: 'Email Verification',
          description: 'Require email verification for new accounts',
          type: 'toggle',
          value: settings.email_verification,
        },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Authentication and security settings',
      icon: Shield,
      settings: [
        {
          key: 'registration_enabled',
          label: 'User Registration',
          description: 'Allow new user registrations',
          type: 'toggle',
          value: settings.registration_enabled,
        },
        {
          key: 'two_factor_required',
          label: 'Require 2FA',
          description: 'Require two-factor authentication for all users',
          type: 'toggle',
          value: settings.two_factor_required,
        },
        {
          key: 'session_timeout',
          label: 'Session Timeout (days)',
          description: 'How long before inactive sessions expire',
          type: 'number',
          value: settings.session_timeout,
        },
        {
          key: 'max_login_attempts',
          label: 'Max Login Attempts',
          description: 'Failed attempts before account lockout',
          type: 'number',
          value: settings.max_login_attempts,
        },
      ],
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Third-party service configuration',
      icon: Key,
      settings: [
        {
          key: 'stripe_webhook_url',
          label: 'Stripe Webhook URL',
          description: 'Webhook endpoint for Stripe events',
          type: 'text',
          value: settings.stripe_webhook_url,
        },
        {
          key: 'coingecko_rate_limit',
          label: 'CoinGecko Rate Limit',
          description: 'Requests per minute to CoinGecko API',
          type: 'number',
          value: settings.coingecko_rate_limit,
        },
      ],
    },
  ];

  const envVariables = [
    { name: 'SUPABASE_URL', status: 'configured', description: 'Database connection URL' },
    { name: 'SUPABASE_ANON_KEY', status: 'configured', description: 'Public API key' },
    { name: 'STRIPE_SECRET_KEY', status: 'configured', description: 'Stripe API secret' },
    { name: 'STRIPE_WEBHOOK_SECRET', status: 'configured', description: 'Stripe webhook signing' },
    { name: 'CLAUDE_API_KEY', status: 'configured', description: 'Claude AI API key' },
    { name: 'COINGECKO_API_KEY', status: 'configured', description: 'CoinGecko Pro API key' },
    { name: 'AMAZON_SES_ACCESS_KEY', status: 'configured', description: 'AWS SES credentials' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-slate-400 mt-1">Configure your platform settings and integrations</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span
              className={`text-sm ${
                saveMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {saveMessage.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 p-3 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-sm">{section.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                  </div>
                </button>
              );
            })}

            {/* Environment Variables Link */}
            <button
              onClick={() => setActiveSection('env')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeSection === 'env'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="w-5 h-5" />
              <div>
                <p className="font-medium text-sm">Environment</p>
                <p className="text-xs text-slate-500 mt-0.5">API keys & secrets</p>
              </div>
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === 'env' ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white">Environment Variables</h2>
                <p className="text-sm text-slate-400 mt-1">
                  These are configured in Cloudflare Pages environment settings
                </p>
              </div>
              <div className="p-6 space-y-4">
                {envVariables.map((env) => (
                  <div
                    key={env.name}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          env.status === 'configured' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                        }`}
                      >
                        {env.status === 'configured' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-mono text-sm text-white">{env.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{env.description}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        env.status === 'configured'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {env.status}
                    </span>
                  </div>
                ))}

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-400">Security Note</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Environment variables are securely stored in Cloudflare Pages. Never expose
                        secret keys in client-side code.
                      </p>
                      <a
                        href="https://dash.cloudflare.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2"
                      >
                        Manage in Cloudflare Dashboard
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : currentSection ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white">{currentSection.title} Settings</h2>
                <p className="text-sm text-slate-400 mt-1">{currentSection.description}</p>
              </div>
              <div className="p-6 space-y-6">
                {currentSection.settings.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white">{setting.label}</label>
                      {setting.envVar && (
                        <span className="text-xs text-slate-500 font-mono">{setting.envVar}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{setting.description}</p>

                    {setting.type === 'toggle' ? (
                      <button
                        onClick={() =>
                          setSettings({ ...settings, [setting.key]: !settings[setting.key] })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings[setting.key] ? 'bg-orange-500' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : setting.type === 'select' ? (
                      <select
                        value={settings[setting.key]}
                        onChange={(e) => setSettings({ ...settings, [setting.key]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                      >
                        {setting.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : setting.type === 'secret' ? (
                      <div className="relative">
                        <input
                          type={showSecrets[setting.key] ? 'text' : 'password'}
                          value={settings[setting.key]}
                          onChange={(e) =>
                            setSettings({ ...settings, [setting.key]: e.target.value })
                          }
                          className="w-full px-4 py-2.5 pr-20 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={() =>
                              setShowSecrets({ ...showSecrets, [setting.key]: !showSecrets[setting.key] })
                            }
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
                          >
                            {showSecrets[setting.key] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type={setting.type}
                        value={settings[setting.key]}
                        onChange={(e) =>
                          setSettings({ ...settings, [setting.key]: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

