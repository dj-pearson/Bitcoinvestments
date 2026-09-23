/**
 * Ticker symbol -> CoinGecko coin id.
 *
 * CoinGecko's price endpoints take coin ids ("bitcoin"), not tickers ("BTC").
 * Tickers are not unique across the market, so this map only covers the
 * large, unambiguous coins used by the alert and rebalancing tools. Anything
 * else should be looked up by id through CoinGecko search.
 *
 * functions/api/check-price-alerts.ts keeps its own copy of this map for
 * legacy rows (Pages Functions are bundled separately from src/). Keep the two
 * in sync when adding coins.
 */
export const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  TRX: 'tron',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  DOT: 'polkadot',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  XLM: 'stellar',
  ATOM: 'cosmos',
  UNI: 'uniswap',
  POL: 'polygon-ecosystem-token',
  NEAR: 'near',
  DAI: 'dai',
};

/** Common coins offered in pickers, in display order. */
export const COMMON_COINS: Array<{ id: string; symbol: string; name: string }> = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USDC' },
];

/** Returns the CoinGecko id for a ticker, or null when it is not in the map. */
export function coinGeckoIdForSymbol(symbol: string): string | null {
  return SYMBOL_TO_COINGECKO_ID[symbol.trim().toUpperCase()] ?? null;
}

/** Base URL for CoinGecko: the same-origin proxy in production. */
export const COINGECKO_BASE = import.meta.env.DEV
  ? 'https://api.coingecko.com/api/v3'
  : '/api/coingecko';

/**
 * Fetches USD prices for CoinGecko ids. Unlike getSimplePrices() in
 * services/coingecko.ts, this throws on failure so callers can tell the user
 * the price check failed instead of silently showing nothing.
 */
export async function fetchUsdPrices(ids: string[]): Promise<Record<string, number>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const url = `${COINGECKO_BASE}/simple/price?ids=${unique.map(encodeURIComponent).join(',')}&vs_currencies=usd`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Price request failed (HTTP ${response.status})`);
  }
  const data = (await response.json()) as Record<string, { usd?: number }>;
  const out: Record<string, number> = {};
  for (const [id, entry] of Object.entries(data)) {
    if (typeof entry?.usd === 'number' && Number.isFinite(entry.usd)) out[id] = entry.usd;
  }
  return out;
}
