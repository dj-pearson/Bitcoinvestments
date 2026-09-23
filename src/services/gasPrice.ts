/**
 * Network fee (gas) service.
 *
 * Where the data comes from
 * - Production: one same-origin request to `/api/gas` (functions/api/gas.ts),
 *   a Pages Function that reads eth_gasPrice / eth_feeHistory from public RPC
 *   endpoints and Bitcoin fee rates from mempool.space, cached for ~15 s. The
 *   browser never calls third-party RPC hosts (the CSP would block them).
 * - Development (`vite dev`, no Pages Functions): the same data is read
 *   directly from the RPC endpoints in the browser.
 * - Native token USD prices come from CoinGecko via services/coingecko.
 *
 * Public API (stable — other pages, e.g. the gas optimizer, consume it)
 * - `getGasPriceForChain(chain)` → `Promise<ChainGasStatus>`
 * - `getAllGasPrices()` → `Promise<ChainGasStatus[]>` (every supported chain,
 *   including unavailable ones, in a fixed order)
 * - `getBitcoinFeeEstimates()` → `Promise<BitcoinFeeEstimates>`
 * - `getSupportedChains()`, `getGasRecommendation()`, `formatGasPrice()`,
 *   `getChainStyle()`, `isGasDataAvailable()`, `clearGasCache()`
 *
 * `ChainGasStatus` extends the shared `ChainGasInfo` type, so existing code
 * that reads `gasPrice.average` or `estimatedCosts.transfer` still compiles.
 * The added fields are the contract for honesty:
 * - `available === false` → there is no real data. The numeric fields are 0
 *   placeholders and MUST NOT be displayed; show "unavailable" instead.
 * - `stale === true` → a last-known-good value; show `fetchedAt` with it.
 * - `costsAvailable === false` → gas is known but the token price is not, so
 *   `estimatedCosts` are 0 placeholders and must not be displayed.
 * - `excludesL1DataFee === true` (Arbitrum, Optimism, Base) → the USD cost
 *   estimates cover L2 execution gas only. Rollups also charge an L1 data fee
 *   that depends on transaction size and Ethereum's blob/base fee, and is
 *   often the larger part of the cost. Say so wherever an L2 cost is shown.
 */
import type { ChainGasInfo, GasPrice, SupportedChain } from '../types';
import { fetchSimplePrices } from './coingecko';

interface ChainConfig {
  chainId: number;
  chainName: string;
  symbol: string;
  rpcUrl: string;
  coingeckoId: string;
  isL2: boolean;
  gasUnits: {
    transfer: number;
    swap: number;
    nftMint: number;
  };
}

// Chain configurations with RPC endpoints and metadata
const CHAIN_CONFIG: Record<SupportedChain, ChainConfig> = {
  ethereum: {
    chainId: 1,
    chainName: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    coingeckoId: 'ethereum',
    isL2: false,
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  polygon: {
    chainId: 137,
    chainName: 'Polygon',
    // MATIC was replaced by POL as Polygon PoS's gas token on 4 Sep 2024.
    symbol: 'POL',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    coingeckoId: 'polygon-ecosystem-token',
    isL2: false,
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  arbitrum: {
    chainId: 42161,
    chainName: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    coingeckoId: 'ethereum',
    isL2: true,
    gasUnits: { transfer: 21000, swap: 300000, nftMint: 200000 },
  },
  optimism: {
    chainId: 10,
    chainName: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://optimism-rpc.publicnode.com',
    coingeckoId: 'ethereum',
    isL2: true,
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  bsc: {
    chainId: 56,
    chainName: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    coingeckoId: 'binancecoin',
    isL2: false,
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  avalanche: {
    chainId: 43114,
    chainName: 'Avalanche C-Chain',
    symbol: 'AVAX',
    rpcUrl: 'https://avalanche-c-chain-rpc.publicnode.com',
    coingeckoId: 'avalanche-2',
    isL2: false,
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
  base: {
    chainId: 8453,
    chainName: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://base-rpc.publicnode.com',
    coingeckoId: 'ethereum',
    isL2: true,
    gasUnits: { transfer: 21000, swap: 150000, nftMint: 120000 },
  },
};

const CHAIN_ORDER: SupportedChain[] = [
  'ethereum',
  'polygon',
  'arbitrum',
  'optimism',
  'bsc',
  'avalanche',
  'base',
];

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Gas data for one chain, with honesty flags. See the file header. */
export interface ChainGasStatus extends ChainGasInfo {
  chain: SupportedChain;
  /** False when no real gas data exists; numeric fields are placeholders. */
  available: boolean;
  /** True when this is a last-known-good value rather than a fresh read. */
  stale: boolean;
  /** Epoch ms of the underlying read, or null when unavailable. */
  fetchedAt: number | null;
  /** False when the native token price is unknown; costs are placeholders. */
  costsAvailable: boolean;
  /** True for rollups whose cost estimates omit the L1 data fee. */
  excludesL1DataFee: boolean;
  /** Short reason when unavailable or stale. */
  error?: string;
}

/**
 * Bitcoin fee-rate estimates in sat/vB from mempool.space's
 * `/api/v1/fees/recommended`. `available === false` means no data; the rate
 * fields are then null.
 */
export interface BitcoinFeeEstimates {
  available: boolean;
  stale: boolean;
  fetchedAt: number | null;
  /** Next block. */
  fastestFee: number | null;
  /** Within ~30 minutes (~3 blocks). */
  halfHourFee: number | null;
  /** Within ~1 hour (~6 blocks). */
  hourFee: number | null;
  /** Low priority; may take many hours or days. */
  economyFee: number | null;
  /** Minimum relay fee rate. */
  minimumFee: number | null;
  error?: string;
}

// ---------------------------------------------------------------------------
// Snapshot fetch (shared by all chains)
// ---------------------------------------------------------------------------

interface RawChainFee {
  ok: boolean;
  stale: boolean;
  fetchedAt: number | null;
  gasPrice: number | null;
  baseFee: number | null;
  priorityFees: [number, number, number] | null;
  error?: string;
}

interface RawBitcoinFee {
  ok: boolean;
  stale: boolean;
  fetchedAt: number | null;
  fastestFee: number | null;
  halfHourFee: number | null;
  hourFee: number | null;
  economyFee: number | null;
  minimumFee: number | null;
  error?: string;
}

interface GasSnapshot {
  fetchedAt: number;
  chains: Partial<Record<SupportedChain, RawChainFee>>;
  bitcoin: RawBitcoinFee;
}

const SNAPSHOT_TTL = 15_000;
let snapshotCache: { data: GasSnapshot; at: number } | null = null;
let snapshotInflight: Promise<GasSnapshot> | null = null;
/** Last good per chain, so a failed refresh can fall back (marked stale). */
const lastGoodChains = new Map<SupportedChain, RawChainFee>();
let lastGoodBitcoin: RawBitcoinFee | null = null;

const UNAVAILABLE_CHAIN: RawChainFee = {
  ok: false,
  stale: false,
  fetchedAt: null,
  gasPrice: null,
  baseFee: null,
  priorityFees: null,
  error: 'Gas data unavailable',
};

const UNAVAILABLE_BITCOIN: RawBitcoinFee = {
  ok: false,
  stale: false,
  fetchedAt: null,
  fastestFee: null,
  halfHourFee: null,
  hourFee: null,
  economyFee: null,
  minimumFee: null,
  error: 'Fee data unavailable',
};

async function timedFetch(url: string, init: RequestInit = {}, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function hexToGwei(hex: unknown): number | null {
  if (typeof hex !== 'string' || !/^0x[0-9a-f]+$/i.test(hex)) return null;
  const wei = Number(BigInt(hex));
  return Number.isFinite(wei) ? wei / 1e9 : null;
}

async function rpcCall(rpcUrl: string, method: string, params: unknown[] = []): Promise<unknown> {
  const response = await timedFetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  });
  if (!response.ok) throw new Error(`RPC error: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

/** Dev-only: read the snapshot directly from RPCs (no Pages Functions in vite dev). */
async function buildSnapshotInBrowser(): Promise<GasSnapshot> {
  const chains: Partial<Record<SupportedChain, RawChainFee>> = {};
  await Promise.all(
    CHAIN_ORDER.map(async (chain) => {
      const url = CHAIN_CONFIG[chain].rpcUrl;
      const [gas, history] = await Promise.allSettled([
        rpcCall(url, 'eth_gasPrice'),
        rpcCall(url, 'eth_feeHistory', ['0x4', 'latest', [10, 50, 90]]),
      ]);
      const gasPrice = gas.status === 'fulfilled' ? hexToGwei(gas.value) : null;
      if (gasPrice === null || gasPrice <= 0) {
        chains[chain] = { ...UNAVAILABLE_CHAIN };
        return;
      }
      let baseFee: number | null = null;
      let priorityFees: [number, number, number] | null = null;
      if (history.status === 'fulfilled' && history.value) {
        const h = history.value as { baseFeePerGas?: string[]; reward?: string[][] };
        if (h.baseFeePerGas?.length) baseFee = hexToGwei(h.baseFeePerGas[h.baseFeePerGas.length - 1]);
        const r = h.reward?.[h.reward.length - 1];
        if (r && r.length >= 3) {
          const [a, b, c] = r.map(hexToGwei);
          if (a !== null && b !== null && c !== null) priorityFees = [a, b, c];
        }
      }
      chains[chain] = { ok: true, stale: false, fetchedAt: Date.now(), gasPrice, baseFee, priorityFees };
    })
  );

  let bitcoin: RawBitcoinFee = { ...UNAVAILABLE_BITCOIN };
  try {
    const res = await timedFetch('https://mempool.space/api/v1/fees/recommended');
    if (res.ok) {
      const j = await res.json();
      bitcoin = {
        ok: true,
        stale: false,
        fetchedAt: Date.now(),
        fastestFee: j.fastestFee ?? null,
        halfHourFee: j.halfHourFee ?? null,
        hourFee: j.hourFee ?? null,
        economyFee: j.economyFee ?? null,
        minimumFee: j.minimumFee ?? null,
      };
    }
  } catch {
    /* unavailable */
  }

  return { fetchedAt: Date.now(), chains, bitcoin };
}

async function loadSnapshot(force = false): Promise<GasSnapshot> {
  if (!force && snapshotCache && Date.now() - snapshotCache.at < SNAPSHOT_TTL) {
    return snapshotCache.data;
  }
  if (snapshotInflight) return snapshotInflight;

  snapshotInflight = (async () => {
    let snapshot: GasSnapshot;
    try {
      if (import.meta.env.DEV) {
        snapshot = await buildSnapshotInBrowser();
      } else {
        const res = await timedFetch('/api/gas', { cache: force ? 'no-cache' : 'default' }, 10_000);
        if (!res.ok) throw new Error(`Gas API error: ${res.status}`);
        snapshot = (await res.json()) as GasSnapshot;
        if (!snapshot || typeof snapshot !== 'object' || !snapshot.chains) {
          throw new Error('Unexpected gas API response');
        }
      }
    } catch (err) {
      snapshot = {
        fetchedAt: Date.now(),
        chains: {},
        bitcoin: { ...UNAVAILABLE_BITCOIN, error: err instanceof Error ? err.message : 'Unavailable' },
      };
    }

    // Merge with last-good copies so a failed refresh degrades to stale data.
    for (const chain of CHAIN_ORDER) {
      const raw = snapshot.chains[chain];
      if (raw?.ok) {
        lastGoodChains.set(chain, raw);
      } else {
        const previous = lastGoodChains.get(chain);
        snapshot.chains[chain] = previous
          ? { ...previous, stale: true, error: raw?.error ?? 'Refresh failed' }
          : { ...UNAVAILABLE_CHAIN, error: raw?.error ?? UNAVAILABLE_CHAIN.error };
      }
    }
    if (snapshot.bitcoin?.ok) {
      lastGoodBitcoin = snapshot.bitcoin;
    } else if (lastGoodBitcoin) {
      snapshot.bitcoin = { ...lastGoodBitcoin, stale: true, error: snapshot.bitcoin?.error };
    } else {
      snapshot.bitcoin = snapshot.bitcoin ?? { ...UNAVAILABLE_BITCOIN };
    }

    snapshotCache = { data: snapshot, at: Date.now() };
    return snapshot;
  })();

  try {
    return await snapshotInflight;
  } finally {
    snapshotInflight = null;
  }
}

async function loadTokenPrices(): Promise<Record<string, number>> {
  const ids = [...new Set(CHAIN_ORDER.map((c) => CHAIN_CONFIG[c].coingeckoId))];
  try {
    const result = await fetchSimplePrices(ids, ['usd']);
    const out: Record<string, number> = {};
    for (const id of ids) {
      const usd = result.data[id]?.usd;
      if (typeof usd === 'number' && usd > 0) out[id] = usd;
    }
    return out;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Conversion to the public shape
// ---------------------------------------------------------------------------

function round(n: number): number {
  // Keep small L2 values meaningful (e.g. 0.0021 gwei).
  return n >= 1 ? Math.round(n * 100) / 100 : Number(n.toPrecision(3));
}

function calculateCost(gasPriceGwei: number, gasUnits: number, tokenPrice: number): number {
  return ((gasPriceGwei * gasUnits) / 1e9) * tokenPrice;
}

function toStatus(chain: SupportedChain, raw: RawChainFee, prices: Record<string, number>): ChainGasStatus {
  const config = CHAIN_CONFIG[chain];
  const base = {
    chain,
    chainId: config.chainId,
    chainName: config.chainName,
    symbol: config.symbol,
    excludesL1DataFee: config.isL2,
  };

  if (!raw.ok || raw.gasPrice === null) {
    return {
      ...base,
      available: false,
      stale: false,
      fetchedAt: null,
      costsAvailable: false,
      error: raw.error ?? 'Gas data unavailable',
      gasPrice: { low: 0, average: 0, high: 0, lastUpdated: '' },
      estimatedCosts: { transfer: 0, swap: 0, nftMint: 0 },
    };
  }

  const gp = raw.gasPrice;
  let low = gp * 0.8;
  let average = gp;
  let high = gp * 1.2;
  let instant = gp * 1.5;
  if (raw.baseFee !== null && raw.priorityFees) {
    const [p10, p50, p90] = raw.priorityFees;
    low = raw.baseFee + p10;
    average = raw.baseFee + p50;
    high = raw.baseFee + p90;
    instant = raw.baseFee + p90 * 1.5;
  }

  const gasPrice: GasPrice = {
    low: round(low),
    average: round(average),
    high: round(high),
    instant: round(instant),
    baseFee: raw.baseFee !== null ? round(raw.baseFee) : undefined,
    lastUpdated: raw.fetchedAt ? new Date(raw.fetchedAt).toISOString() : '',
  };

  const tokenPrice = prices[config.coingeckoId];
  const costsAvailable = typeof tokenPrice === 'number' && tokenPrice > 0;
  const cost = (units: number) =>
    costsAvailable ? Math.round(calculateCost(average, units, tokenPrice) * 10000) / 10000 : 0;

  return {
    ...base,
    available: true,
    stale: raw.stale,
    fetchedAt: raw.fetchedAt,
    costsAvailable,
    error: raw.stale ? raw.error : undefined,
    gasPrice,
    nativeTokenPrice: costsAvailable ? tokenPrice : undefined,
    estimatedCosts: {
      transfer: cost(config.gasUnits.transfer),
      swap: cost(config.gasUnits.swap),
      nftMint: cost(config.gasUnits.nftMint),
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Gas data for one chain. Never rejects; check `available`. */
export async function getGasPriceForChain(
  chain: SupportedChain,
  options: { force?: boolean } = {}
): Promise<ChainGasStatus> {
  const [snapshot, prices] = await Promise.all([loadSnapshot(options.force), loadTokenPrices()]);
  return toStatus(chain, snapshot.chains[chain] ?? UNAVAILABLE_CHAIN, prices);
}

/** Gas data for every supported chain, in a fixed order. Never rejects. */
export async function getAllGasPrices(options: { force?: boolean } = {}): Promise<ChainGasStatus[]> {
  const [snapshot, prices] = await Promise.all([loadSnapshot(options.force), loadTokenPrices()]);
  return CHAIN_ORDER.map((chain) => toStatus(chain, snapshot.chains[chain] ?? UNAVAILABLE_CHAIN, prices));
}

/** Bitcoin fee-rate estimates (sat/vB). Never rejects; check `available`. */
export async function getBitcoinFeeEstimates(options: { force?: boolean } = {}): Promise<BitcoinFeeEstimates> {
  const snapshot = await loadSnapshot(options.force);
  const b = snapshot.bitcoin ?? UNAVAILABLE_BITCOIN;
  return {
    available: b.ok,
    stale: b.ok ? b.stale : false,
    fetchedAt: b.ok ? b.fetchedAt : null,
    fastestFee: b.fastestFee,
    halfHourFee: b.halfHourFee,
    hourFee: b.hourFee,
    economyFee: b.economyFee,
    minimumFee: b.minimumFee,
    error: b.error,
  };
}

/** Whether a gas result holds real data that may be displayed. */
export function isGasDataAvailable(info: ChainGasInfo | ChainGasStatus): boolean {
  if ('available' in info) return info.available;
  return info.gasPrice.average > 0;
}

/**
 * Supported chains list. `isL2` marks rollups whose costs exclude the L1 data fee.
 */
export function getSupportedChains(): { id: SupportedChain; name: string; symbol: string; isL2: boolean }[] {
  return CHAIN_ORDER.map((id) => ({
    id,
    name: CHAIN_CONFIG[id].chainName,
    symbol: CHAIN_CONFIG[id].symbol,
    isL2: CHAIN_CONFIG[id].isL2,
  }));
}

/** Typical gas units assumed for the cost estimates on a chain. */
export function getGasUnits(chain: SupportedChain): { transfer: number; swap: number; nftMint: number } {
  return { ...CHAIN_CONFIG[chain].gasUnits };
}

/**
 * Get gas price recommendation based on urgency. Wait times are rough
 * Ethereum-mainnet guides, not guarantees.
 */
export function getGasRecommendation(
  gasPrice: GasPrice,
  urgency: 'low' | 'medium' | 'high' | 'instant'
): { price: number; waitTime: string } {
  switch (urgency) {
    case 'low':
      return { price: gasPrice.low, waitTime: '~10 minutes' };
    case 'medium':
      return { price: gasPrice.average, waitTime: '~3 minutes' };
    case 'high':
      return { price: gasPrice.high, waitTime: '~30 seconds' };
    case 'instant':
      return { price: gasPrice.instant || gasPrice.high * 1.5, waitTime: 'Next block' };
    default:
      return { price: gasPrice.average, waitTime: '~3 minutes' };
  }
}

/**
 * Format a gas price in gwei for display. Returns '—' for missing, zero or
 * non-finite values so a placeholder can never look like a live reading.
 */
export function formatGasPrice(gwei: number | null | undefined): string {
  if (gwei === null || gwei === undefined || !Number.isFinite(gwei) || gwei <= 0) {
    return '—';
  }
  if (gwei < 0.001) {
    return '<0.001';
  }
  if (gwei < 1) {
    return Number(gwei.toPrecision(2)).toString();
  }
  if (gwei < 10) {
    return gwei.toFixed(2);
  }
  return Math.round(gwei).toString();
}

/**
 * Get chain icon/color for UI
 */
export function getChainStyle(chain: SupportedChain): { color: string; bgColor: string } {
  const styles: Record<SupportedChain, { color: string; bgColor: string }> = {
    ethereum: { color: '#627EEA', bgColor: 'rgba(98, 126, 234, 0.1)' },
    polygon: { color: '#8247E5', bgColor: 'rgba(130, 71, 229, 0.1)' },
    arbitrum: { color: '#28A0F0', bgColor: 'rgba(40, 160, 240, 0.1)' },
    optimism: { color: '#FF0420', bgColor: 'rgba(255, 4, 32, 0.1)' },
    bsc: { color: '#F0B90B', bgColor: 'rgba(240, 185, 11, 0.1)' },
    avalanche: { color: '#E84142', bgColor: 'rgba(232, 65, 66, 0.1)' },
    base: { color: '#0052FF', bgColor: 'rgba(0, 82, 255, 0.1)' },
  };

  return styles[chain] || { color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' };
}

/**
 * Clear gas price caches (the next call goes back to the network).
 */
export function clearGasCache(): void {
  snapshotCache = null;
}
