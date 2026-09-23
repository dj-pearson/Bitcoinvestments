/**
 * Small, render-safe helpers for the compare and hardware-wallet pages.
 * Nothing here reads the clock, the locale or the browser, so output is the
 * same on the server (prerender) and the client.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** '2026-09-23' -> 'Sep 23, 2026'; '2025-10' -> 'Oct 2025'; '2019' -> '2019'. */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!m) return String(y);
  if (!d) return `${MONTHS[m - 1]} ${y}`;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** '2026-09-23' -> 'September 2026' */
export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return m ? `${MONTHS_LONG[m - 1]} ${y}` : String(y);
}

/** 0.0049 -> '0.49%'; trims to at most 2 decimals. */
export function pct(fraction: number): string {
  return `${Number((fraction * 100).toFixed(2))}%`;
}

/** 12.3456 -> '$12.35' */
export function usd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Pick the longest title that fits the base-title budget. SEO.tsx appends
 * " | Bitcoinvestments" (19 chars), so the base must be at most 41.
 */
export function pickTitle(candidates: string[], max = 41): string {
  const fitting = candidates.filter(c => c.length <= max);
  if (fitting.length === 0) return candidates[candidates.length - 1].slice(0, max);
  return fitting.reduce((a, b) => (b.length > a.length ? b : a));
}

/** Trim a meta description to at most `max` chars on a word boundary. */
export function clampDescription(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

export const SITE_URL = 'https://bitcoinvestments.net';
