import { useState, useEffect } from 'react';
import { getUserPriceAlerts, createPriceAlert, deletePriceAlert } from '../services/database';
import { getCurrentUser, getUserProfile } from '../services/auth';
import { TIER_LIMITS } from '../services/subscriptionLimits';
import { hasPremiumAccess } from '../services/stripe';
import { UpgradePrompt, LimitCounter } from './UpgradePrompt';
import type { PriceAlert } from '../types/database';

interface PriceAlertsProps {
  className?: string;
}

export function PriceAlerts({ className = '' }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Subscription state
  const [isPremium, setIsPremium] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  // Form state
  const [symbol, setSymbol] = useState('BTC');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);

        // Load user alerts
        const userAlerts = await getUserPriceAlerts(user.id);
        setAlerts(userAlerts);

        // Count active alerts
        const activeCount = userAlerts.filter(a => a.is_active).length;
        setActiveAlertCount(activeCount);

        // Check subscription status
        const profile = await getUserProfile(user.id);
        const premium = hasPremiumAccess(
          profile?.subscription_status,
          profile?.subscription_expires_at
        );
        setIsPremium(premium);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleNewAlertClick = () => {
    // Check if user can create more alerts
    if (!isPremium && activeAlertCount >= TIER_LIMITS.free.maxActiveAlerts) {
      setShowUpgradePrompt(true);
      return;
    }
    setShowForm(!showForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !targetPrice) return;

    // Double-check limit before creating
    if (!isPremium && activeAlertCount >= TIER_LIMITS.free.maxActiveAlerts) {
      setShowUpgradePrompt(true);
      return;
    }

    setSubmitting(true);

    const newAlert = await createPriceAlert({
      user_id: userId,
      cryptocurrency_id: symbol.toLowerCase(),
      symbol: symbol.toUpperCase(),
      target_price: parseFloat(targetPrice),
      condition,
    });

    if (newAlert) {
      setAlerts([newAlert, ...alerts]);
      setActiveAlertCount(activeAlertCount + 1);
      setShowForm(false);
      setTargetPrice('');
    }

    setSubmitting(false);
  };

  const handleDelete = async (alertId: string) => {
    const alertToDelete = alerts.find(a => a.id === alertId);
    const success = await deletePriceAlert(alertId);
    if (success) {
      setAlerts(alerts.filter((a) => a.id !== alertId));
      // Update active count if the deleted alert was active
      if (alertToDelete?.is_active) {
        setActiveAlertCount(Math.max(0, activeAlertCount - 1));
      }
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">Price Alerts</h3>
          <p className="text-gray-400 text-sm mb-4">
            Sign in to set custom price alerts for your favorite cryptocurrencies.
          </p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
      {/* Upgrade prompt modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          limitType="alerts"
          currentCount={activeAlertCount}
          maxCount={TIER_LIMITS.free.maxActiveAlerts}
          variant="modal"
          onDismiss={() => setShowUpgradePrompt(false)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Price Alerts</h3>
        <button
          onClick={handleNewAlertClick}
          className="text-sm text-orange-500 hover:text-orange-400 font-medium"
        >
          {showForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {/* Show limit counter for free users */}
      {!isPremium && (
        <div className="mb-4">
          <LimitCounter
            current={activeAlertCount}
            max={TIER_LIMITS.free.maxActiveAlerts}
            label="Active alerts"
          />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cryptocurrency</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
                <option value="XRP">Ripple (XRP)</option>
                <option value="ADA">Cardano (ADA)</option>
                <option value="DOGE">Dogecoin (DOGE)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="above">Goes Above</option>
                <option value="below">Goes Below</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Target Price (USD)</label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g., 50000"
              step="0.01"
              min="0"
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-medium rounded-lg transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Alert'}
          </button>
        </form>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm">
            No alerts set. Create one to get notified when prices hit your targets.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                alert.is_active ? 'bg-gray-700/50' : 'bg-gray-700/25 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    alert.condition === 'above' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      alert.condition === 'above' ? 'text-green-500' : 'text-red-500'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={alert.condition === 'above' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">
                    {alert.symbol}{' '}
                    <span className="text-gray-400 font-normal">
                      {alert.condition === 'above' ? 'above' : 'below'}
                    </span>{' '}
                    ${alert.target_price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {alert.triggered_at
                      ? `Triggered ${new Date(alert.triggered_at).toLocaleDateString()}`
                      : 'Active'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Delete alert"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
