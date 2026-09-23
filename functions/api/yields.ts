/**
 * Cloudflare Pages Function: GET /api/yields
 *
 * A trimmed, curated slice of DefiLlama's free yields dataset
 * (https://yields.llama.fi/pools, plus /lendBorrow for borrow rates when it
 * answers). Used by /defi-yield and /lending so the browser never has to talk
 * to a third-party host and never has to download the ~10 MB upstream file.
 *
 * Caching: the processed payload is stored in caches.default for up to 24h
 * and is considered fresh for 1h. After that the stale copy is served
 * immediately while a background refresh runs (stale-while-revalidate). If
 * DefiLlama is down, the last good copy keeps being served until it expires.
 *
 * Response: { asOf, source, sourceUrl, pools: YieldPool[] }
 * Nothing here is invented: every number is DefiLlama's, passed through or
 * dropped. Pools DefiLlama flags as statistical outliers are excluded.
 */

interface PagesContext {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

/** Upstream pool object (only the fields we read). */
interface LlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number | null;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  apyMean30d?: number | null;
  stablecoin?: boolean;
  ilRisk?: string;
  exposure?: string;
  poolMeta?: string | null;
  outlier?: boolean;
}

interface LlamaLendBorrow {
  pool: string;
  apyBaseBorrow?: number | null;
  apyRewardBorrow?: number | null;
  totalSupplyUsd?: number | null;
  totalBorrowUsd?: number | null;
  ltv?: number | null;
}

export type YieldCategory = 'lending' | 'liquid-staking' | 'dex' | 'savings' | 'yield';

export interface YieldPool {
  id: string;
  project: string;
  projectName: string;
  category: YieldCategory;
  chain: string;
  symbol: string;
  poolMeta: string | null;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  apyMean30d: number | null;
  stablecoin: boolean;
  ilRisk: boolean;
  exposure: 'single' | 'multi' | null;
  apyBaseBorrow: number | null;
  apyRewardBorrow: number | null;
  totalSupplyUsd: number | null;
  totalBorrowUsd: number | null;
  ltv: number | null;
  url: string;
}

const POOLS_URL = 'https://yields.llama.fi/pools';
const LEND_BORROW_URL = 'https://yields.llama.fi/lendBorrow';
const FRESH_MS = 60 * 60 * 1000; // 1 hour
const MAX_STALE_S = 24 * 60 * 60; // keep a last-good copy for 24 hours
const CACHE_KEY = 'https://cache.internal/api/yields/v1';

/**
 * Curated, long-running protocols. DefiLlama slugs change occasionally, so a
 * few aliases are listed; a slug with no pools simply matches nothing.
 */
const PROJECTS: Record<string, { name: string; category: YieldCategory }> = {
  'aave-v3': { name: 'Aave V3', category: 'lending' },
  'compound-v3': { name: 'Compound V3', category: 'lending' },
  sparklend: { name: 'SparkLend', category: 'lending' },
  'morpho-blue': { name: 'Morpho', category: 'lending' },
  'morpho-v1': { name: 'Morpho', category: 'lending' },
  'fluid-lending': { name: 'Fluid', category: 'lending' },
  'spark-savings': { name: 'Spark Savings', category: 'savings' },
  'sky-lending': { name: 'Sky Savings Rate', category: 'savings' },
  lido: { name: 'Lido', category: 'liquid-staking' },
  'rocket-pool': { name: 'Rocket Pool', category: 'liquid-staking' },
  'coinbase-wrapped-staked-eth': { name: 'Coinbase cbETH', category: 'liquid-staking' },
  'jito-liquid-staking': { name: 'Jito', category: 'liquid-staking' },
  'marinade-liquid-staking': { name: 'Marinade', category: 'liquid-staking' },
  'uniswap-v3': { name: 'Uniswap V3', category: 'dex' },
  'uniswap-v4': { name: 'Uniswap V4', category: 'dex' },
  'curve-dex': { name: 'Curve', category: 'dex' },
  'balancer-v2': { name: 'Balancer V2', category: 'dex' },
  'aerodrome-v1': { name: 'Aerodrome', category: 'dex' },
  'aerodrome-slipstream': { name: 'Aerodrome Slipstream', category: 'dex' },
  'convex-finance': { name: 'Convex', category: 'yield' },
  'yearn-finance': { name: 'Yearn', category: 'yield' },
};

const CHAINS = new Set([
  'Ethereum',
  'Arbitrum',
  'Optimism',
  'Base',
  'Polygon',
  'Avalanche',
  'BSC',
  'Solana',
]);

/** Major stablecoins and major assets (plus their common wrapped forms). */
const TOKENS = new Set([
  'USDC', 'USDT', 'DAI', 'USDS', 'SDAI', 'SUSDS', 'PYUSD', 'GHO', 'LUSD', 'USDC.E', 'USDT0',
  'ETH', 'WETH', 'STETH', 'WSTETH', 'RETH', 'CBETH', 'WEETH',
  'BTC', 'WBTC', 'CBBTC', 'TBTC',
  'SOL', 'JITOSOL', 'MSOL',
]);

const MIN_TVL_USD = 10_000_000;
const MAX_APY = 100; // anything above this is almost always an anomaly or a farm
const MAX_POOLS = 200;

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function round(v: number | null, dp = 2): number | null {
  if (v === null) return null;
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}

function symbolAllowed(symbol: string): boolean {
  const parts = symbol.toUpperCase().split('-').filter(Boolean);
  return parts.length > 0 && parts.every((p) => TOKENS.has(p));
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Bitcoinvestments/1.0' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function buildPayload(): Promise<string> {
  const [poolsRaw, lendBorrowRaw] = await Promise.allSettled([
    fetchJson(POOLS_URL, 20_000),
    fetchJson(LEND_BORROW_URL, 20_000),
  ]);

  if (poolsRaw.status !== 'fulfilled') {
    throw poolsRaw.reason instanceof Error ? poolsRaw.reason : new Error('pools fetch failed');
  }
  const data = (poolsRaw.value as { data?: LlamaPool[] })?.data;
  if (!Array.isArray(data)) throw new Error('Unexpected pools payload');

  // Borrow side is optional: if DefiLlama restricts or drops the endpoint, the
  // supply data still ships and borrow columns show "n/a".
  const borrowById = new Map<string, LlamaLendBorrow>();
  if (lendBorrowRaw.status === 'fulfilled' && Array.isArray(lendBorrowRaw.value)) {
    for (const row of lendBorrowRaw.value as LlamaLendBorrow[]) {
      if (row && typeof row.pool === 'string') borrowById.set(row.pool, row);
    }
  }

  const pools: YieldPool[] = [];
  for (const p of data) {
    const meta = PROJECTS[p.project];
    if (!meta || !CHAINS.has(p.chain) || p.outlier) continue;
    const tvl = num(p.tvlUsd);
    const apy = num(p.apy);
    if (tvl === null || tvl < MIN_TVL_USD || apy === null || apy < 0 || apy > MAX_APY) continue;
    if (typeof p.symbol !== 'string' || !symbolAllowed(p.symbol)) continue;

    const b = borrowById.get(p.pool);
    pools.push({
      id: p.pool,
      project: p.project,
      projectName: meta.name,
      category: meta.category,
      chain: p.chain,
      symbol: p.symbol.toUpperCase(),
      poolMeta: typeof p.poolMeta === 'string' && p.poolMeta ? p.poolMeta.slice(0, 80) : null,
      tvlUsd: Math.round(tvl),
      apy: round(apy) as number,
      apyBase: round(num(p.apyBase)),
      apyReward: round(num(p.apyReward)),
      apyMean30d: round(num(p.apyMean30d)),
      stablecoin: p.stablecoin === true,
      ilRisk: p.ilRisk === 'yes',
      exposure: p.exposure === 'single' || p.exposure === 'multi' ? p.exposure : null,
      apyBaseBorrow: round(num(b?.apyBaseBorrow)),
      apyRewardBorrow: round(num(b?.apyRewardBorrow)),
      totalSupplyUsd: num(b?.totalSupplyUsd) !== null ? Math.round(b!.totalSupplyUsd as number) : null,
      totalBorrowUsd: num(b?.totalBorrowUsd) !== null ? Math.round(b!.totalBorrowUsd as number) : null,
      ltv: round(num(b?.ltv), 4),
      url: `https://defillama.com/yields/pool/${encodeURIComponent(p.pool)}`,
    });
  }

  pools.sort((a, b) => b.tvlUsd - a.tvlUsd);

  return JSON.stringify({
    asOf: new Date().toISOString(),
    source: 'DefiLlama',
    sourceUrl: 'https://defillama.com/yields',
    pools: pools.slice(0, MAX_POOLS),
  });
}

function clientResponse(body: string, status: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
      'X-Yields-Cache': status,
    },
  });
}

async function storeInCache(cache: Cache, body: string): Promise<void> {
  await cache.put(
    CACHE_KEY,
    new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${MAX_STALE_S}`,
        'X-Fetched-At': String(Date.now()),
      },
    })
  );
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(CACHE_KEY);

  if (cached) {
    const fetchedAt = Number(cached.headers.get('X-Fetched-At') || 0);
    const body = await cached.text();
    if (Date.now() - fetchedAt < FRESH_MS) {
      return clientResponse(body, 'fresh');
    }
    // Stale: answer now, refresh in the background.
    context.waitUntil(
      buildPayload()
        .then((fresh) => storeInCache(cache, fresh))
        .catch(() => undefined)
    );
    return clientResponse(body, 'stale');
  }

  try {
    const body = await buildPayload();
    context.waitUntil(storeInCache(cache, body));
    return clientResponse(body, 'miss');
  } catch {
    return new Response(
      JSON.stringify({ error: 'Yield data is temporarily unavailable from DefiLlama.' }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
