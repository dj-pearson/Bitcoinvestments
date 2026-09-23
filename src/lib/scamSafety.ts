/**
 * Helpers for handling untrusted scam-report data safely.
 *
 * Community reports contain URLs of suspected scam sites, addresses and other
 * values supplied by users. None of it is rendered as a live link: URLs are
 * "defanged" (hxxps://example[.]com) and shown as text, so nobody clicks
 * through to a phishing page from our site and no `javascript:` URL can run.
 */

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export function isEvmAddress(value: string): boolean {
  return EVM_ADDRESS.test(value.trim());
}

/**
 * EVM addresses are case-insensitive (mixed case is only a checksum), so they
 * are stored and compared in lowercase. Other chains (Bitcoin base58, Solana)
 * are case-sensitive and are only trimmed.
 */
export function normalizeAddress(value: string): string {
  const trimmed = value.trim();
  return isEvmAddress(trimmed) ? trimmed.toLowerCase() : trimmed;
}

/** Loose format check for addresses entered in the report form. */
export function looksLikeAddress(value: string): boolean {
  const v = value.trim();
  if (isEvmAddress(v)) return true;
  // Bitcoin bech32 / legacy
  if (/^(bc1|tb1)[02-9ac-hj-np-z]{11,87}$/i.test(v)) return true;
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(v)) return true;
  // Solana and other base58 chains
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)) return true;
  // Tron
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(v)) return true;
  return false;
}

/** True only for absolute http(s) URLs. Rejects javascript:, data:, etc. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Render a URL as inert text: hxxps://example[.]com/path
 * Any scheme other than http(s) is dropped entirely and replaced with a marker.
 */
export function defangUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  if (hasScheme && !isHttpUrl(raw)) {
    return '[unsafe link removed]';
  }
  return raw
    .replace(/^http/i, 'hxxp')
    .replace(/\./g, '[.]');
}

/**
 * Normalise a website search input to the part worth matching: drops scheme,
 * "www." and trailing slashes, lowercases the host.
 */
export function normalizeWebsiteQuery(value: string): string {
  let v = value.trim();
  v = v.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  v = v.replace(/^www\./i, '');
  v = v.replace(/\/+$/, '');
  return v.toLowerCase();
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Minimum description length before a verified report may be indexed. */
export const MIN_INDEXABLE_REPORT_WORDS = 120;

/**
 * A community report page is indexable only when a moderator has verified it,
 * it cites at least one http(s) evidence link, and its description is
 * substantial. Everything else is noindex.
 */
export function isScamReportIndexable(report: {
  status: string;
  description: string | null;
  evidence_links: string[] | null;
}): boolean {
  if (report.status !== 'verified') return false;
  const evidence = (report.evidence_links || []).filter(isHttpUrl);
  if (evidence.length < 1) return false;
  return countWords(report.description) >= MIN_INDEXABLE_REPORT_WORDS;
}

const SOURCE_LABELS: Record<string, string> = {
  user_reported: 'Submitted by a community member',
  community_import: 'Imported from a community list',
  admin_added: 'Added by a site moderator',
  chainabuse: 'Imported from Chainabuse',
  cryptoscamdb: 'Imported from CryptoScamDB',
};

export function describeReportSource(source: string | null | undefined): string {
  if (!source) return SOURCE_LABELS.user_reported;
  return SOURCE_LABELS[source] || `Source: ${source}`;
}

/** Format an ISO date as e.g. "September 23, 2026" in UTC (stable across timezones). */
export function formatDateUTC(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
