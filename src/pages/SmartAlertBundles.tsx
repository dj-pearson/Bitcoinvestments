/**
 * /alert-bundles: Crypto Price Alerts.
 *
 * Free, browser-saved price alerts. Alerts are stored in localStorage and
 * checked against CoinGecko prices while this tab is open; when one is met the
 * page shows it and, with permission, sends a browser notification. There is
 * no server component and no email/SMS delivery.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Trash2, RotateCcw, Search } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { FaqSection, LastUpdated, Callout } from '../components/alerts/PageParts';
import { webApplicationSchema, type FaqItem } from '../components/alerts/schema';
import { COMMON_COINS, fetchUsdPrices } from '../lib/coinIds';
import { searchCryptocurrencies } from '../services/coingecko';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showLocalNotification,
} from '../services/pushNotifications';
import {
  MAX_LOCAL_ALERTS,
  describeAlert,
  isAlertMet,
  loadLocalAlerts,
  saveLocalAlerts,
  type LocalAlertCondition,
  type LocalPriceAlert,
} from '../services/localPriceAlerts';

const LAST_UPDATED = '2026-09-23';
const PAGE_PATH = '/alert-bundles';
const CHECK_INTERVAL_MS = 60_000;
const TOOL_DESCRIPTION =
  'Free crypto price alerts saved in your browser: get an on-page and desktop notification when a coin crosses your price or moves by a set percentage.';

interface CoinChoice {
  id: string;
  symbol: string;
  name: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How do these crypto price alerts work?',
    answer:
      'You pick a coin and a condition (above a price, below a price, or a percentage move). The alert is saved in this browser. While this page is open, it checks CoinGecko prices about once a minute and notifies you when a condition is met.',
  },
  {
    question: 'Will I get an alert if I close the tab?',
    answer:
      'No. Alerts only fire while this tab is open, because the checking runs in your browser. Email alerts need an account, which is coming soon. For alerts that work with your browser closed, use the price-alert feature in your exchange or portfolio app.',
  },
  {
    question: 'Why did my alert fire late or at a slightly different price?',
    answer:
      'Prices are checked about once a minute and CoinGecko prices are an aggregate across exchanges, cached for up to a minute. A fast wick can cross your level and come back between checks, and the price on your exchange can differ a little from the aggregate.',
  },
  {
    question: 'Are my alerts private?',
    answer:
      'Yes. They are stored only in this browser’s local storage. The page asks CoinGecko (through our proxy) for the prices of the coins you watch, but no alert settings or personal data are sent to us.',
  },
  {
    question: 'Should I trade when a golden cross or RSI alert fires?',
    answer:
      'Treat indicator alerts as a prompt to look, not a signal to act. Moving-average crosses lag price, RSI can stay overbought or oversold for a long time, and backtests of simple signal rules are easy to overfit. This page only offers price alerts; it does not give trading signals.',
  },
];

const ALERT_TYPES = [
  {
    title: 'Price level (above / below)',
    body: 'Fires when the price crosses a number you choose — for example “BTC below $90,000” to remind you of a planned buy. Best for levels you have already decided to act on.',
    caveat: 'Round numbers are crowded; prices often wick through them briefly.',
  },
  {
    title: 'Percentage move',
    body: 'Fires when the price has moved by X% up or down from when you set it. Useful for “tell me if anything big happens” without guessing a level.',
    caveat: 'In crypto a 5–10% daily move is common; pick a threshold that matters to you.',
  },
  {
    title: 'Golden cross / death cross',
    body: 'A golden cross is when a short moving average (often the 50-day) crosses above a long one (often the 200-day); a death cross is the reverse. Charting apps and exchanges can alert on these.',
    caveat: 'Both are lagging: by the time they fire, much of the move has usually happened, and there are many false signals in sideways markets.',
  },
  {
    title: 'RSI overbought / oversold',
    body: 'The Relative Strength Index measures recent gains vs losses on a 0–100 scale; readings above 70 or below 30 are called overbought or oversold.',
    caveat: 'In strong trends RSI can stay above 70 or below 30 for weeks, so it is a context tool, not a timing signal.',
  },
];

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

const fmtUsd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 1 ? 6 : 2 });

export default function SmartAlertBundlesPage() {
  const [alerts, setAlerts] = useState<LocalPriceAlert[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [coin, setCoin] = useState<CoinChoice>(COMMON_COINS[0]);
  const [condition, setCondition] = useState<LocalAlertCondition>('above');
  const [target, setTarget] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [lastChecked, setLastChecked] = useState<string>('');
  const [checkError, setCheckError] = useState('');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [announcement, setAnnouncement] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CoinChoice[]>([]);
  const [searchStatus, setSearchStatus] = useState('');
  const alertsRef = useRef<LocalPriceAlert[]>([]);

  // Load saved alerts and notification permission (browser only).
  useEffect(() => {
    setAlerts(loadLocalAlerts());
    setPermission(typeof window !== 'undefined' && 'Notification' in window ? getNotificationPermission() : 'unsupported');
    setLoaded(true);
  }, []);

  useEffect(() => {
    alertsRef.current = alerts;
    if (loaded) setStorageOk(saveLocalAlerts(alerts));
  }, [alerts, loaded]);

  const checkPrices = useCallback(async () => {
    const active = alertsRef.current.filter((a) => !a.triggeredAt);
    const ids = [...new Set(alertsRef.current.map((a) => a.coinId))];
    if (ids.length === 0) return;
    try {
      const latest = await fetchUsdPrices(ids);
      setPrices((prev) => ({ ...prev, ...latest }));
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCheckError(ids.some((id) => latest[id] === undefined) ? 'CoinGecko returned no price for some coins.' : '');

      const fired = active.filter((a) => latest[a.coinId] !== undefined && isAlertMet(a, latest[a.coinId]));
      if (fired.length === 0) return;
      const now = new Date().toISOString();
      const firedIds = new Set(fired.map((a) => a.id));
      setAlerts((prev) =>
        prev.map((a) => (firedIds.has(a.id) && !a.triggeredAt ? { ...a, triggeredAt: now, triggeredPrice: latest[a.coinId] } : a))
      );
      const text = fired.map((a) => `${describeAlert(a)} — now ${fmtUsd(latest[a.coinId])}`).join('; ');
      setAnnouncement(`Alert triggered: ${text}`);
      if (getNotificationPermission() === 'granted') {
        for (const a of fired) {
          void showLocalNotification(`Price alert: ${a.symbol}`, {
            body: `${describeAlert(a)}. Now ${fmtUsd(latest[a.coinId])}.`,
            tag: `bi-alert-${a.id}`,
          });
        }
      }
    } catch (err) {
      setCheckError(`Price check failed (${err instanceof Error ? err.message : 'network error'}). Will retry.`);
    }
  }, []);

  // Poll while the tab is visible and there is something to watch.
  const hasActive = alerts.some((a) => !a.triggeredAt);
  useEffect(() => {
    if (!loaded || !hasActive) return;
    void checkPrices();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void checkPrices();
    }, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkPrices();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loaded, hasActive, checkPrices]);

  async function enableNotifications() {
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchStatus('Type at least two characters.');
      return;
    }
    setSearchStatus('Searching…');
    try {
      const results = await searchCryptocurrencies(q);
      const mapped = results.slice(0, 8).map((r) => ({ id: r.id, symbol: r.symbol.toUpperCase(), name: r.name }));
      setSearchResults(mapped);
      setSearchStatus(mapped.length ? '' : 'No coins found.');
    } catch {
      setSearchResults([]);
      setSearchStatus('Search failed. Try again in a minute.');
    }
  }

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const value = parseFloat(target);
    if (!Number.isFinite(value) || value <= 0) {
      setFormError(condition === 'move' ? 'Enter a percentage greater than 0.' : 'Enter a price greater than 0.');
      return;
    }
    if (condition === 'move' && value > 1000) {
      setFormError('Enter a percentage of 1000 or less.');
      return;
    }
    if (alerts.length >= MAX_LOCAL_ALERTS) {
      setFormError(`You can save up to ${MAX_LOCAL_ALERTS} alerts in this browser. Delete one first.`);
      return;
    }
    setCreating(true);
    let reference: number | null = null;
    try {
      const latest = await fetchUsdPrices([coin.id]);
      reference = latest[coin.id] ?? null;
      if (reference !== null) setPrices((prev) => ({ ...prev, [coin.id]: reference as number }));
    } catch {
      reference = null;
    }
    if (condition === 'move' && reference === null) {
      setCreating(false);
      setFormError('Could not load the current price, which a percentage alert needs. Try again shortly.');
      return;
    }
    const alert: LocalPriceAlert = {
      id: newId(),
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      condition,
      target: value,
      referencePrice: reference,
      createdAt: new Date().toISOString(),
      triggeredAt: null,
      triggeredPrice: null,
    };
    if (reference !== null && condition !== 'move' && isAlertMet(alert, reference)) {
      setFormError(`Note: ${coin.symbol} is already ${condition} that level (${fmtUsd(reference)}), so this alert will fire on the next check.`);
    }
    setAlerts((prev) => [alert, ...prev]);
    setTarget('');
    setCreating(false);
  }

  function removeAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  function rearm(id: string) {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, triggeredAt: null, triggeredPrice: null, referencePrice: a.condition === 'move' ? prices[a.coinId] ?? a.referencePrice : a.referencePrice }
          : a
      )
    );
  }

  const inputClass =
    'w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const isCommon = COMMON_COINS.some((c) => c.id === coin.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO
        pageKey="alertBundles"
        urlPath={PAGE_PATH}
        faqs={FAQS}
        customSchema={webApplicationSchema('Crypto Price Alerts', TOOL_DESCRIPTION, PAGE_PATH)}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <BellRing className="h-8 w-8 text-orange-500" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crypto Price Alerts</h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl">
            Set free price alerts for any coin on CoinGecko — above a price, below a price, or a percentage move — and
            get an on-page and desktop notification when one hits. Alerts are saved in this browser and checked about
            once a minute while this tab is open.
          </p>
          <div className="mt-3">
            <LastUpdated date={LAST_UPDATED} />
          </div>
        </header>

        <Callout tone="warning" title="Alerts only fire while this tab is open">
          Checking happens in your browser, so closing this tab (or letting your computer sleep) pauses it. Email alerts
          need an account — coming soon.
        </Callout>

        <div aria-live="assertive" className="sr-only">{announcement}</div>
        {announcement && (
          <div className="mt-4 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-4 flex justify-between gap-3" role="status">
            <p className="text-orange-900 dark:text-orange-100 font-medium">{announcement}</p>
            <button type="button" onClick={() => setAnnouncement('')} className="text-sm underline text-orange-900 dark:text-orange-100">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <section aria-labelledby="new-alert-heading" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 id="new-alert-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">New alert</h2>
            <form onSubmit={createAlert} className="space-y-4" noValidate>
              <div>
                <label htmlFor="pa-coin" className={labelClass}>Coin</label>
                <select
                  id="pa-coin"
                  value={coin.id}
                  onChange={(e) => {
                    const found = COMMON_COINS.find((c) => c.id === e.target.value);
                    if (found) setCoin(found);
                  }}
                  className={inputClass}
                >
                  {!isCommon && <option value={coin.id}>{coin.name} ({coin.symbol})</option>}
                  {COMMON_COINS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pa-cond" className={labelClass}>Condition</label>
                <select id="pa-cond" value={condition} onChange={(e) => setCondition(e.target.value as LocalAlertCondition)} className={inputClass}>
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                  <option value="move">Price moves by % (up or down)</option>
                </select>
              </div>
              <div>
                <label htmlFor="pa-target" className={labelClass}>
                  {condition === 'move' ? 'Move size (%)' : 'Price (USD)'}
                </label>
                <input
                  id="pa-target"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={condition === 'move' ? 'e.g. 10' : prices[coin.id] ? `now ${fmtUsd(prices[coin.id])}` : 'e.g. 100000'}
                  aria-describedby={formError ? 'pa-form-msg' : undefined}
                  className={inputClass}
                />
              </div>
              {formError && <p id="pa-form-msg" className="text-sm text-amber-700 dark:text-amber-300">{formError}</p>}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium"
              >
                {creating ? 'Saving…' : 'Save alert'}
              </button>
            </form>

            <form onSubmit={runSearch} className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <label htmlFor="pa-search" className={labelClass}>Find another coin</label>
              <div className="flex gap-2">
                <input id="pa-search" type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Name or ticker" className={inputClass} />
                <button type="submit" className="px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200" aria-label="Search coins">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {searchStatus && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2" role="status">{searchStatus}</p>}
              {searchResults.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {searchResults.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCoin(r);
                          setSearchResults([]);
                          setSearchStatus(`Selected ${r.name} (${r.symbol}).`);
                        }}
                        className="w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                      >
                        {r.name} <span className="text-gray-500">({r.symbol}) · id: {r.id}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Many tokens share a ticker. Check the CoinGecko id before you rely on an alert.
              </p>
            </form>
          </section>

          <section aria-labelledby="my-alerts-heading" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 id="my-alerts-heading" className="text-xl font-semibold text-gray-900 dark:text-white">Your alerts</h2>
              {permission !== 'unsupported' && permission !== 'granted' && (
                <button
                  type="button"
                  onClick={enableNotifications}
                  disabled={permission === 'denied'}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-60"
                >
                  {permission === 'denied' ? 'Notifications blocked' : 'Enable desktop notifications'}
                </button>
              )}
            </div>
            {permission === 'denied' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Notifications are blocked for this site in your browser settings. Alerts will still show on this page.
              </p>
            )}
            {!loaded ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading saved alerts…</p>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No alerts yet. Create one on the left.</p>
            ) : (
              <ul className="space-y-3">
                {alerts.map((a) => {
                  const now = prices[a.coinId];
                  return (
                    <li key={a.id} className={`rounded-lg border p-3 ${a.triggeredAt ? 'border-orange-300 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{describeAlert(a)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {a.name} · {now !== undefined ? `now ${fmtUsd(now)}` : 'price not loaded yet'}
                          </p>
                          <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">
                            {a.triggeredAt
                              ? `Triggered at ${a.triggeredPrice !== null ? fmtUsd(a.triggeredPrice) : 'n/a'} on ${new Date(a.triggeredAt).toLocaleString()}`
                              : 'Watching'}
                          </p>
                        </div>
                        <div className="flex items-start gap-1">
                          {a.triggeredAt && (
                            <button type="button" onClick={() => rearm(a.id)} aria-label={`Re-arm alert: ${describeAlert(a)}`} className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                              <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                          <button type="button" onClick={() => removeAlert(a.id)} aria-label={`Delete alert: ${describeAlert(a)}`} className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1" aria-live="polite">
              {lastChecked && <p>Last price check: {lastChecked} (prices from CoinGecko).</p>}
              {checkError && <p className="text-amber-700 dark:text-amber-300">{checkError}</p>}
              {!storageOk && <p className="text-amber-700 dark:text-amber-300">This browser is blocking storage, so alerts will be lost when you leave the page.</p>}
            </div>
          </section>
        </div>

        <article className="mt-12 space-y-4 text-gray-800 dark:text-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Common types of crypto alerts</h2>
          <p>
            Alerts are useful for acting on a plan you made in advance — a buy level, a stop you want to review, a move
            big enough to rebalance. They are less useful as a source of trade ideas. This page offers the first two
            types below; the others are available in most charting and exchange apps.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {ALERT_TYPES.map((t) => (
              <div key={t.title} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t.title}</h3>
                <p className="text-sm">{t.body}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2"><strong>Caveat:</strong> {t.caveat}</p>
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white pt-4">Be sceptical of paid “signal” alerts</h2>
          <p>
            Services that sell buy/sell alerts often advertise win rates that cannot be checked, count only the winners,
            or were fitted to past data after the fact. Ask for a complete, timestamped record of every alert, including
            the losers, before trusting a claimed track record — and remember that the seller may be trading against
            the people who follow the signal. See{' '}
            <Link to="/influencer-verification" className="text-orange-600 dark:text-orange-400 underline">how to vet a crypto influencer</Link>{' '}
            and the <Link to="/scam-database" className="text-orange-600 dark:text-orange-400 underline">scam database</Link>.
          </p>
          <p>
            Learn how the indicators work on the{' '}
            <Link to="/trading-indicators" className="text-orange-600 dark:text-orange-400 underline">trading indicators</Link> page,
            or plan regular buys with the <Link to="/dca-automation" className="text-orange-600 dark:text-orange-400 underline">DCA planner</Link>.
          </p>
        </article>

        <FaqSection items={FAQS} />
      </div>
    </div>
  );
}
