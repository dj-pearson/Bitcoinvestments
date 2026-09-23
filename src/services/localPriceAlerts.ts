/**
 * Browser-saved price alerts for /alert-bundles.
 *
 * Alerts live in localStorage on this device only. The page checks them
 * against CoinGecko prices while the tab is open. Nothing is sent to a server.
 * All storage access is wrapped so private mode or blocked storage degrades to
 * an in-memory list instead of throwing.
 */

export type LocalAlertCondition = 'above' | 'below' | 'move';

export interface LocalPriceAlert {
  id: string;
  /** CoinGecko coin id, e.g. "bitcoin". */
  coinId: string;
  symbol: string;
  name: string;
  condition: LocalAlertCondition;
  /** USD price for above/below; percent (e.g. 10) for move. */
  target: number;
  /** Price when the alert was created; the base for 'move' alerts. */
  referencePrice: number | null;
  createdAt: string;
  triggeredAt: string | null;
  triggeredPrice: number | null;
}

const STORAGE_KEY = 'bi:price-alerts:v1';
export const MAX_LOCAL_ALERTS = 25;

function isAlert(v: unknown): v is LocalPriceAlert {
  if (!v || typeof v !== 'object') return false;
  const a = v as LocalPriceAlert;
  return (
    typeof a.id === 'string' &&
    typeof a.coinId === 'string' &&
    typeof a.symbol === 'string' &&
    (a.condition === 'above' || a.condition === 'below' || a.condition === 'move') &&
    typeof a.target === 'number' &&
    Number.isFinite(a.target)
  );
}

/** Reads saved alerts. Call only in an effect or handler (touches localStorage). */
export function loadLocalAlerts(): LocalPriceAlert[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isAlert).slice(0, MAX_LOCAL_ALERTS) : [];
  } catch {
    return [];
  }
}

/** Saves alerts. Returns false when storage is unavailable. */
export function saveLocalAlerts(alerts: LocalPriceAlert[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    return true;
  } catch {
    return false;
  }
}

/** True when `price` meets the alert's condition. */
export function isAlertMet(alert: LocalPriceAlert, price: number): boolean {
  if (!Number.isFinite(price)) return false;
  switch (alert.condition) {
    case 'above':
      return price >= alert.target;
    case 'below':
      return price <= alert.target;
    case 'move': {
      const ref = alert.referencePrice;
      if (!ref || ref <= 0) return false;
      return Math.abs((price - ref) / ref) * 100 >= alert.target;
    }
  }
}

/** Plain-language description, e.g. "BTC goes above $120,000". */
export function describeAlert(alert: LocalPriceAlert): string {
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 1 ? 6 : 2 });
  switch (alert.condition) {
    case 'above':
      return `${alert.symbol} goes above ${fmt(alert.target)}`;
    case 'below':
      return `${alert.symbol} goes below ${fmt(alert.target)}`;
    case 'move':
      return `${alert.symbol} moves ${alert.target}% either way from ${alert.referencePrice ? fmt(alert.referencePrice) : 'the price when set'}`;
  }
}
