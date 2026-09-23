/**
 * Null-safe formatters for market data.
 *
 * CoinGecko returns null for many fields on new or illiquid coins (24h change,
 * ATH dates, supply, market cap). Every formatter here returns '—' for null,
 * undefined or non-finite input, so the UI never shows "NaN%", "Infinity%" or
 * 1 January 1970.
 */

const DASH = '—';

export function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** "+1.23%" / "-4.50%" / "—". */
export function fmtPct(v: number | null | undefined, opts: { sign?: boolean; digits?: number } = {}): string {
  if (!isNum(v)) return DASH;
  const { sign = true, digits = 2 } = opts;
  const abs = Math.abs(v);
  const body = abs >= 1000
    ? abs.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : abs.toFixed(digits);
  const prefix = v < 0 ? '-' : sign && v > 0 ? '+' : '';
  return `${prefix}${body}%`;
}

/** Ratio as a percentage, guarding against a zero or missing denominator. */
export function fmtRatioPct(numerator: number | null | undefined, denominator: number | null | undefined): string {
  if (!isNum(numerator) || !isNum(denominator) || denominator <= 0) return DASH;
  return fmtPct((numerator / denominator) * 100, { sign: false });
}

/** Plain number with thousands separators. */
export function fmtNumber(v: number | null | undefined, maxDigits = 0): string {
  if (!isNum(v)) return DASH;
  return v.toLocaleString('en-US', { maximumFractionDigits: maxDigits });
}

/** USD price with precision that suits its size (works for sub-cent coins). */
export function fmtUsd(v: number | null | undefined): string {
  if (!isNum(v)) return DASH;
  const abs = Math.abs(v);
  if (abs === 0) return '$0.00';
  if (abs >= 1) {
    return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumSignificantDigits: 2, maximumSignificantDigits: 4 });
}

/** Compact axis label for a USD value: $68.4k, $1.2M, $0.00001234. */
export function fmtAxisUsd(v: number): string {
  if (!isNum(v)) return '';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e4) return `$${(v / 1e3).toFixed(1)}k`;
  if (abs >= 100) return `$${Math.round(v).toLocaleString('en-US')}`;
  if (abs >= 1) return `$${v.toFixed(2)}`;
  if (abs === 0) return '$0';
  return `$${Number(v.toPrecision(3))}`;
}

/** Locale date from an ISO timestamp, or '—' when missing/invalid. Client-side use only. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() <= 0) return DASH;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Time of day for an epoch-ms value. Client-side use only (after data loads). */
export function fmtTime(ms: number | null | undefined): string {
  if (!isNum(ms) || ms <= 0) return '';
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Date and time for an epoch-ms value. Client-side use only. */
export function fmtDateTime(ms: number | null | undefined): string {
  if (!isNum(ms) || ms <= 0) return '';
  return new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Deterministic "23 September 2026" from "2026-09-23" (no Date/timezone use),
 * safe to render on the server and the client alike.
 */
export function fmtStaticDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d || m > 12) return ymd;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
