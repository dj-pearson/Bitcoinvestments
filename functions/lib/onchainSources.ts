/**
 * Public, keyless on-chain data sources used by /api/onchain and
 * /api/onchain/large-transactions.
 *
 * Every value returned here comes from an upstream response. Nothing is
 * estimated, interpolated or invented: if an upstream call fails or returns an
 * unexpected shape, that metric is reported as unavailable (with the reason)
 * and the page says so. Each metric carries its source name, a link to the
 * source, and the timestamp the source attached to the data point.
 *
 * Sources (no API key, free public endpoints):
 * - mempool.space REST API (https://mempool.space/docs/api/rest): hashrate,
 *   difficulty, difficulty-adjustment estimate, fee estimates, mempool size,
 *   recent blocks and per-block transaction summaries.
 * - Blockchain.com Charts API (https://www.blockchain.com/explorer/api/charts_api):
 *   daily confirmed transactions and daily unique addresses.
 */

const MEMPOOL_BASE = 'https://mempool.space/api';
const BLOCKCHAIN_CHARTS_BASE = 'https://api.blockchain.info/charts';

export const SOURCES = {
  mempool: { name: 'mempool.space', url: 'https://mempool.space' },
  blockchainCom: { name: 'Blockchain.com Charts', url: 'https://www.blockchain.com/explorer/charts' },
} as const;

const UPSTREAM_TIMEOUT_MS = 8000;

export interface SeriesPoint {
  /** Unix time in milliseconds */
  t: number;
  v: number;
}

export interface MetricResult<T> {
  ok: true;
  data: T;
  /** ISO timestamp of the newest data point the source reported */
  asOf: string;
  source: string;
  sourceUrl: string;
}

export interface MetricError {
  ok: false;
  error: string;
  source: string;
  sourceUrl: string;
}

export type Metric<T> = MetricResult<T> | MetricError;

async function fetchJson(url: string, cacheTtl: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Bitcoinvestments/1.0 (+https://bitcoinvestments.net)' },
      signal: controller.signal,
      // Cloudflare edge cache for the upstream response.
      cf: { cacheTtl, cacheEverything: true },
    } as RequestInit);
    if (!res.ok) throw new Error(`upstream returned HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function num(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) ? x : null;
}

function fail(source: { name: string; url: string }, err: unknown): MetricError {
  return {
    ok: false,
    error: err instanceof Error ? err.message : 'unknown error',
    source: source.name,
    sourceUrl: source.url,
  };
}

function ok<T>(source: { name: string; url: string }, data: T, asOfMs: number): MetricResult<T> {
  return { ok: true, data, asOf: new Date(asOfMs).toISOString(), source: source.name, sourceUrl: source.url };
}

// ---------------------------------------------------------------------------
// mempool.space
// ---------------------------------------------------------------------------

export interface HashrateData {
  /** Latest daily average hashrate, hashes per second */
  current: number;
  /** Daily average hashrate, oldest -> newest */
  series: SeriesPoint[];
}

/** GET /v1/mining/hashrate/3m -> { hashrates: [{ timestamp (s), avgHashrate }] } */
export async function getHashrate(): Promise<Metric<HashrateData>> {
  const src = { name: SOURCES.mempool.name, url: 'https://mempool.space/graphs/mining/hashrate-difficulty' };
  try {
    const raw = await fetchJson(`${MEMPOOL_BASE}/v1/mining/hashrate/3m`, 600);
    if (!isRecord(raw) || !Array.isArray(raw.hashrates)) throw new Error('unexpected response shape');
    const series: SeriesPoint[] = [];
    for (const p of raw.hashrates) {
      if (!isRecord(p)) continue;
      const t = num(p.timestamp);
      const v = num(p.avgHashrate);
      if (t !== null && v !== null) series.push({ t: t * 1000, v });
    }
    series.sort((a, b) => a.t - b.t);
    const latest = series[series.length - 1];
    if (!latest) throw new Error('no data points');
    return ok(src, { current: latest.v, series }, latest.t);
  } catch (err) {
    return fail(src, err);
  }
}

export interface DifficultyData {
  /** Difficulty of the newest block */
  current: number;
  /** Height of the block the difficulty was read from */
  height: number;
  /** Estimated % change at the next retarget (mempool.space estimate) */
  estimatedChangePercent: number | null;
  /** Blocks until the next retarget */
  remainingBlocks: number | null;
  /** Estimated retarget time (ms) */
  estimatedRetargetAt: number | null;
  /** Progress through the current 2016-block epoch, 0-100 */
  progressPercent: number | null;
}

export async function getDifficulty(
  blocks: Metric<BlockData[]>
): Promise<Metric<DifficultyData>> {
  const src = { name: SOURCES.mempool.name, url: 'https://mempool.space/mining' };
  try {
    if (!blocks.ok || blocks.data.length === 0) {
      throw new Error(blocks.ok ? 'no recent blocks' : blocks.error);
    }
    const tip = blocks.data[0];
    const adj = await fetchJson(`${MEMPOOL_BASE}/v1/difficulty-adjustment`, 120).catch(() => null);
    const a = isRecord(adj) ? adj : {};
    return ok(
      src,
      {
        current: tip.difficulty,
        height: tip.height,
        estimatedChangePercent: num(a.difficultyChange),
        remainingBlocks: num(a.remainingBlocks),
        estimatedRetargetAt: num(a.estimatedRetargetDate),
        progressPercent: num(a.progressPercent),
      },
      tip.timestamp
    );
  } catch (err) {
    return fail(src, err);
  }
}

export interface FeeData {
  fastest: number;
  halfHour: number;
  hour: number;
  economy: number | null;
  minimum: number | null;
}

/** GET /v1/fees/recommended -> sat/vB estimates */
export async function getFees(): Promise<Metric<FeeData>> {
  const src = { name: SOURCES.mempool.name, url: 'https://mempool.space' };
  try {
    const raw = await fetchJson(`${MEMPOOL_BASE}/v1/fees/recommended`, 60);
    if (!isRecord(raw)) throw new Error('unexpected response shape');
    const fastest = num(raw.fastestFee);
    const halfHour = num(raw.halfHourFee);
    const hour = num(raw.hourFee);
    const economy = num(raw.economyFee);
    const minimum = num(raw.minimumFee);
    if (fastest === null || halfHour === null || hour === null) throw new Error('missing fee fields');
    // The endpoint has no timestamp of its own: it is a live estimate, so the
    // fetch time is the honest "as of".
    return ok(src, { fastest, halfHour, hour, economy, minimum }, Date.now());
  } catch (err) {
    return fail(src, err);
  }
}

export interface MempoolData {
  /** Unconfirmed transactions waiting */
  count: number;
  /** Total virtual size in vbytes */
  vsize: number;
  /** Total fees waiting, in satoshis (null if the source omitted it) */
  totalFeeSats: number | null;
}

/** GET /mempool -> { count, vsize, total_fee } */
export async function getMempool(): Promise<Metric<MempoolData>> {
  const src = { name: SOURCES.mempool.name, url: 'https://mempool.space' };
  try {
    const raw = await fetchJson(`${MEMPOOL_BASE}/mempool`, 60);
    if (!isRecord(raw)) throw new Error('unexpected response shape');
    const count = num(raw.count);
    const vsize = num(raw.vsize);
    const totalFee = num(raw.total_fee);
    if (count === null || vsize === null) throw new Error('missing mempool fields');
    return ok(src, { count, vsize, totalFeeSats: totalFee }, Date.now());
  } catch (err) {
    return fail(src, err);
  }
}

export interface BlockData {
  id: string;
  height: number;
  /** ms */
  timestamp: number;
  txCount: number;
  sizeBytes: number;
  difficulty: number;
  /** sat/vB, null if the source did not include it */
  medianFeeRate: number | null;
  /** satoshis, null if the source did not include it */
  totalFeesSats: number | null;
  pool: string | null;
}

/** GET /v1/blocks -> newest blocks first */
export async function getRecentBlocks(): Promise<Metric<BlockData[]>> {
  const src = { name: SOURCES.mempool.name, url: 'https://mempool.space/blocks' };
  try {
    const raw = await fetchJson(`${MEMPOOL_BASE}/v1/blocks`, 60);
    if (!Array.isArray(raw)) throw new Error('unexpected response shape');
    const blocks: BlockData[] = [];
    for (const b of raw) {
      if (!isRecord(b)) continue;
      const height = num(b.height);
      const ts = num(b.timestamp);
      const id = typeof b.id === 'string' && /^[0-9a-f]{64}$/.test(b.id) ? b.id : null;
      if (height === null || ts === null || id === null) continue;
      const extras = isRecord(b.extras) ? b.extras : {};
      const pool = isRecord(extras.pool) && typeof extras.pool.name === 'string' ? extras.pool.name : null;
      blocks.push({
        id,
        height,
        timestamp: ts * 1000,
        txCount: num(b.tx_count) ?? 0,
        sizeBytes: num(b.size) ?? 0,
        difficulty: num(b.difficulty) ?? 0,
        medianFeeRate: num(extras.medianFee),
        totalFeesSats: num(extras.totalFees),
        pool,
      });
    }
    blocks.sort((a, b) => b.height - a.height);
    if (blocks.length === 0) throw new Error('no blocks returned');
    return ok(src, blocks, blocks[0].timestamp);
  } catch (err) {
    return fail(src, err);
  }
}

export interface LargeTransaction {
  txid: string;
  /** Sum of all outputs, satoshis. Includes change returned to the sender. */
  outputValueSats: number;
  feeSats: number;
  vsize: number;
  blockHeight: number;
  /** ms */
  blockTime: number;
}

/**
 * Largest transactions (by total output value) in the newest `blockCount`
 * blocks, from GET /v1/block/:hash/summary.
 */
export async function getLargestRecentTransactions(
  blockCount = 3,
  limit = 15
): Promise<Metric<{ transactions: LargeTransaction[]; blocksScanned: number[] }>> {
  const src = { name: SOURCES.mempool.name, url: 'https://mempool.space' };
  try {
    const blocks = await getRecentBlocks();
    if (!blocks.ok) throw new Error(blocks.error);
    const scan = blocks.data.slice(0, blockCount);
    const summaries = await Promise.all(
      scan.map((b) =>
        fetchJson(`${MEMPOOL_BASE}/v1/block/${b.id}/summary`, 3600).then(
          (raw) => ({ block: b, raw }),
          () => ({ block: b, raw: null })
        )
      )
    );
    const txs: LargeTransaction[] = [];
    const scanned: number[] = [];
    for (const { block, raw } of summaries) {
      if (!Array.isArray(raw)) continue;
      scanned.push(block.height);
      // Index 0 is the coinbase (the miner's reward), not a transfer.
      raw.slice(1).forEach((t) => {
        if (!isRecord(t) || typeof t.txid !== 'string' || !/^[0-9a-f]{64}$/.test(t.txid)) return;
        const value = num(t.value);
        if (value === null) return;
        txs.push({
          txid: t.txid,
          outputValueSats: value,
          feeSats: num(t.fee) ?? 0,
          vsize: num(t.vsize) ?? 0,
          blockHeight: block.height,
          blockTime: block.timestamp,
        });
      });
    }
    if (scanned.length === 0) throw new Error('could not read any block summaries');
    txs.sort((a, b) => b.outputValueSats - a.outputValueSats);
    return ok(src, { transactions: txs.slice(0, limit), blocksScanned: scanned }, scan[0].timestamp);
  } catch (err) {
    return fail(src, err);
  }
}

// ---------------------------------------------------------------------------
// Blockchain.com Charts API
// ---------------------------------------------------------------------------

export interface DailySeriesData {
  latest: number;
  series: SeriesPoint[];
}

/** GET /charts/:name?timespan=90days&format=json -> { values: [{ x (s), y }] } */
export async function getBlockchainChart(
  chart: 'n-transactions' | 'n-unique-addresses'
): Promise<Metric<DailySeriesData>> {
  const src = { name: SOURCES.blockchainCom.name, url: `https://www.blockchain.com/explorer/charts/${chart}` };
  try {
    const raw = await fetchJson(`${BLOCKCHAIN_CHARTS_BASE}/${chart}?timespan=90days&format=json`, 3600);
    if (!isRecord(raw) || !Array.isArray(raw.values)) throw new Error('unexpected response shape');
    const series: SeriesPoint[] = [];
    for (const p of raw.values) {
      if (!isRecord(p)) continue;
      const x = num(p.x);
      const y = num(p.y);
      if (x !== null && y !== null) series.push({ t: x * 1000, v: y });
    }
    series.sort((a, b) => a.t - b.t);
    const latest = series[series.length - 1];
    if (!latest) throw new Error('no data points');
    return ok(src, { latest: latest.v, series }, latest.t);
  } catch (err) {
    return fail(src, err);
  }
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

interface CacheContext {
  request: Request;
  waitUntil?: (p: Promise<unknown>) => void;
}

/**
 * Serve from the Cloudflare edge cache when possible, otherwise build the
 * payload, cache it and return it. A payload where some upstream failed is
 * cached only briefly so a transient outage does not stick. GET only.
 */
export async function cachedJson(
  context: CacheContext,
  ttlSeconds: number,
  build: () => Promise<{ payload: unknown; partial: boolean }>
): Promise<Response> {
  const { request } = context;
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'GET' },
    });
  }

  const url = new URL(request.url);
  // Ignore query strings so callers cannot bypass the cache.
  const cacheKey = new Request(`${url.origin}${url.pathname}`, { method: 'GET' });
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;

  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  let body: string;
  let ttl = ttlSeconds;
  try {
    const built = await build();
    body = JSON.stringify(built.payload);
    if (built.partial) ttl = Math.min(ttlSeconds, 30);
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to build on-chain data' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const response = new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${ttl}`,
    },
  });

  if (cache) {
    const put = cache.put(cacheKey, response.clone());
    if (context.waitUntil) context.waitUntil(put);
    else await put;
  }
  return response;
}
