import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Cpu,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Settings,
  TestTube,
  Save,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAIModelSettings,
  updateAIModelSettings,
  testClaudeAPI,
  markSettingsAsTested,
} from '../services/adminSettings';
import type { AIModelSettings } from '../types/admin-database';
import { CLAUDE_MODELS, DEFAULT_AI_SETTINGS } from '../types/admin-database';

interface TestResult {
  model: string;
  success: boolean;
  response?: string;
  error?: string;
  latency: number;
}

export function AdminAISettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AIModelSettings>(DEFAULT_AI_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { settings: loadedSettings, error } = await getAIModelSettings();
    if (!error) {
      setSettings(loadedSettings);
    }
    setLoading(false);
  }

  function handleSettingChange(key: keyof AIModelSettings, value: string | number) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveMessage(null);
  }

  async function handleTestModel(modelId: string) {
    setTesting(modelId);
    const result = await testClaudeAPI(modelId);
    setTestResults((prev) => ({
      ...prev,
      [modelId]: {
        model: modelId,
        success: result.success,
        response: result.response || undefined,
        error: result.error || undefined,
        latency: result.latency,
      },
    }));
    setTesting(null);
  }

  async function handleTestBothModels() {
    await Promise.all([
      handleTestModel(settings.defaultModel),
      handleTestModel(settings.lightweightModel),
    ]);
  }

  async function handleSaveSettings() {
    if (!user?.id) return;

    // Check if models have been tested
    const defaultTested = testResults[settings.defaultModel]?.success;
    const lightweightTested = testResults[settings.lightweightModel]?.success;

    if (!defaultTested || !lightweightTested) {
      setSaveMessage({
        type: 'error',
        text: 'Please test both models successfully before saving.',
      });
      return;
    }

    setSaving(true);
    const { success, error } = await updateAIModelSettings(settings, user.id);

    if (success) {
      await markSettingsAsTested(user.id);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setHasChanges(false);
      // Reload to get updated timestamps
      await loadSettings();
    } else {
      setSaveMessage({ type: 'error', text: error || 'Failed to save settings' });
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading AI settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bot className="w-8 h-8 mr-3 text-purple-600" />
                AI Model Settings
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Configure Claude AI models for all AI-powered features
              </p>
            </div>
            {settings.isConfigured && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Configured</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {!settings.isConfigured && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  AI Not Configured
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Test both models and save settings to enable AI features across the platform.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Key Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <div className="flex items-start">
            <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                API Configuration
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                The Claude API key is stored securely in Cloudflare environment variables as{' '}
                <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-purple-600 dark:text-purple-400">
                  CLAUDE_API_KEY
                </code>
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                Authentication uses <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">x-api-key</code> header as required by Anthropic.
              </p>
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Model Configuration
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Default Model */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Cpu className="w-4 h-4 mr-2 text-blue-600" />
                Default Model
                <span className="ml-2 text-xs text-gray-500">(Complex tasks, analysis, content generation)</span>
              </label>
              <div className="flex items-center space-x-3">
                <select
                  value={settings.defaultModel}
                  onChange={(e) => handleSettingChange('defaultModel', e.target.value)}
                  className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {CLAUDE_MODELS.map((model) => (
                    <option key={model.modelId} value={model.modelId}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleTestModel(settings.defaultModel)}
                  disabled={testing === settings.defaultModel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {testing === settings.defaultModel ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test
                </button>
              </div>
              {testResults[settings.defaultModel] && (
                <TestResultDisplay result={testResults[settings.defaultModel]} />
              )}
            </div>

            {/* Lightweight Model */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                Lightweight Model
                <span className="ml-2 text-xs text-gray-500">(Quick tasks, chatbot, summaries)</span>
              </label>
              <div className="flex items-center space-x-3">
                <select
                  value={settings.lightweightModel}
                  onChange={(e) => handleSettingChange('lightweightModel', e.target.value)}
                  className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {CLAUDE_MODELS.map((model) => (
                    <option key={model.modelId} value={model.modelId}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleTestModel(settings.lightweightModel)}
                  disabled={testing === settings.lightweightModel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {testing === settings.lightweightModel ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test
                </button>
              </div>
              {testResults[settings.lightweightModel] && (
                <TestResultDisplay result={testResults[settings.lightweightModel]} />
              )}
            </div>

            {/* Advanced Settings */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Advanced Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Max Tokens (Default)
                  </label>
                  <input
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                    min={256}
                    max={8192}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Temperature (0-1)
                  </label>
                  <input
                    type="number"
                    value={settings.temperature}
                    onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleTestBothModels}
              disabled={testing !== null}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Test Both Models
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {saveMessage && (
              <p
                className={`text-sm ${
                  saveMessage.type === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {saveMessage.text}
              </p>
            )}
            <button
              onClick={handleSaveSettings}
              disabled={saving || !hasChanges}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </button>
          </div>
        </div>

        {/* Last Tested Info */}
        {settings.lastTested && (
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Last tested: {new Date(settings.lastTested).toLocaleString()}
          </div>
        )}

        {/* Features Using AI */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Features Using These Settings
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AI_FEATURES.map((feature) => (
                <div
                  key={feature.name}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-center mb-2">
                    <feature.icon className={`w-5 h-5 mr-2 ${feature.iconColor}`} />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {feature.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    Uses: {feature.model}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestResultDisplay({ result }: { result: TestResult }) {
  return (
    <div
      className={`mt-2 p-3 rounded-lg text-sm ${
        result.success
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}
    >
      <div className="flex items-center">
        {result.success ? (
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
        )}
        <span
          className={`font-medium ${
            result.success
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}
        >
          {result.success ? 'Connection Successful' : 'Connection Failed'}
        </span>
        <span className="ml-auto text-gray-500 dark:text-gray-400">
          {result.latency}ms
        </span>
      </div>
      {result.response && (
        <p className="mt-1 text-green-700 dark:text-green-300">{result.response}</p>
      )}
      {result.error && (
        <p className="mt-1 text-red-700 dark:text-red-300">{result.error}</p>
      )}
    </div>
  );
}

// Features that use AI settings
import {
  FileText,
  TrendingUp,
  PieChart,
  Newspaper,
  MessageSquare,
  Calendar,
  LineChart,
  Mail,
  BookOpen,
} from 'lucide-react';

const AI_FEATURES = [
  {
    name: 'Blog Generator',
    description: 'Automated blog post creation for market analysis',
    model: 'Default Model',
    icon: FileText,
    iconColor: 'text-blue-500',
  },
  {
    name: 'Market Analysis',
    description: 'Weekly AI-generated market reports',
    model: 'Default Model',
    icon: TrendingUp,
    iconColor: 'text-green-500',
  },
  {
    name: 'Portfolio Recommendations',
    description: 'Personalized portfolio suggestions',
    model: 'Default Model',
    icon: PieChart,
    iconColor: 'text-purple-500',
  },
  {
    name: 'News Summarizer',
    description: 'Quick summaries of crypto news',
    model: 'Lightweight Model',
    icon: Newspaper,
    iconColor: 'text-orange-500',
  },
  {
    name: 'Chatbot Assistant',
    description: 'Interactive help and education',
    model: 'Lightweight Model',
    icon: MessageSquare,
    iconColor: 'text-pink-500',
  },
  {
    name: 'Content Calendar',
    description: 'AI-generated content schedule',
    model: 'Default Model',
    icon: Calendar,
    iconColor: 'text-indigo-500',
  },
  {
    name: 'Price Trend Analysis',
    description: 'Educational price trend insights',
    model: 'Default Model',
    icon: LineChart,
    iconColor: 'text-yellow-500',
  },
  {
    name: 'Newsletter Generation',
    description: 'Automated weekly newsletters',
    model: 'Default Model',
    icon: Mail,
    iconColor: 'text-red-500',
  },
  {
    name: 'Glossary Expansion',
    description: 'AI-generated term definitions',
    model: 'Lightweight Model',
    icon: BookOpen,
    iconColor: 'text-teal-500',
  },
];
