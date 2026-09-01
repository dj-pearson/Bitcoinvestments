/**
 * Smart Alert Bundles Page
 *
 * Pre-configured alert packages for different trading strategies.
 * Individual bundles: $4.99-9.99/month per bundle
 * Free users: 1 free bundle preview
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Bell,
  TrendingUp,
  Shield,
  Layers,
  Fish,
  Activity,
  Check,
  ChevronRight,
  Star,
  Users,
  Percent,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAlertBundles,
  getBundlePerformance,
  getUserBundleSubscriptions,
} from '../services/smartAlertBundles';
import type {
  AlertBundle,
  UserAlertBundleSubscription,
  BundlePerformance,
} from '../types/premiumFeatures';

import { PageSEO } from '../components/PageSEO';
const BUNDLE_ICONS: Record<string, any> = {
  'TrendingUp': TrendingUp,
  'Shield': Shield,
  'Layers': Layers,
  'Fish': Fish,
  'Activity': Activity,
};

export default function SmartAlertBundlesPage() {
  const { user, profile } = useAuth();
  const [bundles, setBundles] = useState<AlertBundle[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserAlertBundleSubscription[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<AlertBundle | null>(null);
  const [performance, setPerformance] = useState<BundlePerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasMainAccess = profile?.subscription_status && ['premium', 'lifetime', 'advisor', 'enterprise'].includes(profile.subscription_status);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [bundleData, subData] = await Promise.all([
        getAlertBundles(),
        user?.id ? getUserBundleSubscriptions(user.id) : Promise.resolve([]),
      ]);
      setBundles(bundleData);
      setSubscriptions(subData);

      if (bundleData.length > 0) {
        setSelectedBundle(bundleData[0]);
        const perfData = await getBundlePerformance(bundleData[0].id, '30d');
        setPerformance(perfData);
      }
    } catch (err) {
      console.error('Failed to load bundle data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectBundle(bundle: AlertBundle) {
    setSelectedBundle(bundle);
    const perfData = await getBundlePerformance(bundle.id, '30d');
    setPerformance(perfData);
  }

  function isSubscribed(bundleId: string) {
    return subscriptions.some(s => s.bundle_id === bundleId && s.status === 'active') || hasMainAccess;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="alertBundles" urlPath="/alert-bundles" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Smart Alert Bundles
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Pre-configured alert packages for different trading strategies. Subscribe to the bundles that match your style.
          </p>
        </div>

        {/* Active Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Active Bundles</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {subscriptions.map(sub => (
                <div
                  key={sub.id}
                  className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white min-w-[200px]"
                >
                  <p className="font-semibold">{sub.bundle_name}</p>
                  <p className="text-sm text-amber-100">
                    {sub.alerts_triggered_count} alerts triggered
                  </p>
                  <p className="text-xs text-amber-200 mt-2">
                    Expires: {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bundle List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Bundles</h2>
              <div className="space-y-3">
                {bundles.map(bundle => {
                  const IconComponent = BUNDLE_ICONS[bundle.icon] || Package;
                  const subscribed = isSubscribed(bundle.id);

                  return (
                    <button
                      key={bundle.id}
                      onClick={() => handleSelectBundle(bundle)}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        selectedBundle?.id === bundle.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`h-6 w-6 ${
                          selectedBundle?.id === bundle.id ? 'text-white' : 'text-amber-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{bundle.name}</p>
                            {bundle.is_featured && (
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-sm ${
                              selectedBundle?.id === bundle.id ? 'text-amber-100' : 'text-gray-500'
                            }`}>
                              ${bundle.price_monthly}/mo
                            </span>
                            {subscribed && (
                              <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bundle Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedBundle && (
              <>
                {/* Bundle Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const IconComponent = BUNDLE_ICONS[selectedBundle.icon] || Package;
                        return (
                          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                            <IconComponent className="h-8 w-8 text-amber-500" />
                          </div>
                        );
                      })()}
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedBundle.name}
                          </h2>
                          {selectedBundle.is_featured && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {selectedBundle.description}
                        </p>
                      </div>
                    </div>
                    {!isSubscribed(selectedBundle.id) ? (
                      <Link
                        to="/pricing"
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600"
                      >
                        Subscribe ${selectedBundle.price_monthly}/mo
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    ) : (
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                        <Check className="h-5 w-5 inline mr-1" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                        <Users className="h-4 w-4" />
                        Subscribers
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedBundle.subscriber_count.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                        <Bell className="h-4 w-4" />
                        Alerts Included
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedBundle.alerts_included.length}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                        <Percent className="h-4 w-4" />
                        Success Rate
                      </div>
                      <p className={`text-2xl font-bold ${
                        selectedBundle.success_rate && selectedBundle.success_rate > 60
                          ? 'text-green-500'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {selectedBundle.success_rate ? `${selectedBundle.success_rate}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alerts in Bundle */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Alerts in This Bundle
                  </h3>
                  <div className="space-y-3">
                    {selectedBundle.alerts_included.length === 0 ? (
                      <p className="text-gray-500">Alert details available after subscription</p>
                    ) : (
                      selectedBundle.alerts_included.map(alert => (
                        <div
                          key={alert.id}
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{alert.name}</p>
                              <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                                {alert.alert_type}
                              </span>
                              {alert.is_configurable && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                  Customizable
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>Channels: {alert.notification_channels.join(', ')}</span>
                            <span>Cooldown: {alert.cooldown_minutes}min</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Performance */}
                {performance && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      30-Day Performance
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-gray-500">Alerts Sent</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {performance.alerts_sent}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Accuracy Rate</p>
                        <p className={`text-2xl font-bold ${
                          performance.accuracy_rate > 60 ? 'text-green-500' : 'text-gray-900 dark:text-white'
                        }`}>
                          {performance.accuracy_rate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Response Time</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {performance.avg_response_time_hours.toFixed(1)}h
                        </p>
                      </div>
                    </div>

                    {/* Recent Alerts */}
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Notable Alerts</h4>
                    <div className="space-y-2">
                      {performance.notable_alerts.map((alert, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg ${
                            alert.was_accurate
                              ? 'bg-green-50 dark:bg-green-900/20'
                              : 'bg-red-50 dark:bg-red-900/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {alert.alert_name} - {alert.asset}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(alert.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                ${alert.price_at_alert.toLocaleString()} → ${alert.price_after_24h.toLocaleString()}
                              </p>
                              <p className={`text-xs font-medium ${
                                alert.was_accurate ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {alert.was_accurate ? 'Accurate' : 'Inaccurate'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* All Bundles Overview */}
            {!selectedBundle && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Select a bundle to view details
                </h2>
                <p className="text-gray-500">
                  Choose from our curated collection of alert bundles designed for different trading strategies.
                </p>
              </div>
            )}

            {/* Premium Banner */}
            {!hasMainAccess && (
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Get All Bundles with Premium</h3>
                <p className="text-amber-100 mb-4">
                  Subscribe to our main Premium plan and get access to all alert bundles included, plus many more features.
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-amber-600 rounded-lg font-semibold hover:bg-amber-50"
                >
                  View Premium Plans
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
