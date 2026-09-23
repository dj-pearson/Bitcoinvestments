// Cloudflare Pages Function: gas / network fee snapshot
//
// GET /api/gas
//
// Reads current fee data from public JSON-RPC endpoints for the EVM chains the
// site tracks, plus Bitcoin's recommended fee rates from mempool.space, and
// returns one JSON snapshot. It runs server-side so the browser only talks to
// our own origin (the site CSP does not allow third-party RPC hosts), and it is
// cached so every visitor shares one upstream fetch:
//
// - fresh snapshot cached for FRESH_TTL seconds (Cache API)
// - last good value per chain kept for LAST_GOOD_TTL seconds; when a chain's
//   RPC fails, its last good value is returned with `stale: true` and its own
//   `fetchedAt`, and a chain with no good value at all is `ok: false`.
//   Nothing is ever reported as a live zero.
//
// Response shape (all fee values in gwei, Bitcoin in sat/vB):
// {
//   fetchedAt: number,               // epoch ms of this snapshot
//   chains: {
//     [chain]: {
//       ok: boolean, stale: boolean, fetchedAt: number | null,
//       gasPrice: number | null,     // eth_gasPrice
//       baseFee: number | null,      // latest base fee (EIP-1559 chains)
//       priorityFees: [p10, p50, p90] | null,  // from eth_feeHistory
//       error?: string
//     }
//   },
//   bitcoin: { ok, stale, fetchedAt, fastestFee, halfHourFee, hourFee,
//              economyFee, minimumFee, error? }
// }

// No bindings are required; the Cache API (caches.default) holds both copies.
type Env = Record<string, unknown>;

const CHAINS: Record<string, string> = {
  ethereum: 'https://ethereum-rpc.publicnode.com',
  polygon: 'https://polygon-bor-rpc.publicnode.com',
  arbitrum: 'https://arbitrum-one-rpc.publicnode.com',
  optimism: 'https://optimism-rpc.publicnode.com',
  bsc: 'https://bsc-rpc.publicnode.com',
  avalanche: 'https://avalanche-c-chain-rpc.publicnode.com',
  base: 'https://base-rpc.publicnode.com',
};

const MEMPOOL_FEES_URL = 'https://mempool.space/api/v1/fees/recommended';

const FRESH_TTL = 15; // seconds
const LAST_GOOD_TTL = 60 * 60; // seconds
const UPSTREAM_TIMEOUT_MS = 4000;

const FRESH_KEY = 'https://gas.internal/v1/snapshot';
const LAST_GOOD_KEY = 'https://gas.internal/v1/last-good';

interface ChainFee {
  ok: boolean;
  stale: boolean;
  fetchedAt: number | null;
  gasPrice: number | null;
  baseFee: number | null;
  priorityFees: [number, number, number] | null;
  error?: string;
}

interface BitcoinFee {
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

interface Snapshot {
  fetchedAt: number;
  chains: Record<string, ChainFee>;
  bitcoin: BitcoinFee;
}

function hexToGwei(hex: unknown): number | null {
  if (typeof hex !== 'string' || !/^0x[0-9a-f]+$/i.test(hex)) return null;
  const wei = Number(BigInt(hex));
  return Number.isFinite(wei) ? wei / 1e9 : null;
}

async function withTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function rpc(url: string, method: string, params: unknown[] = []): Promise<unknown> {
  const res = await withTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: { message?: string } };
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}

async function readChain(url: string): Promise<ChainFee> {
  const now = Date.now();
  const [gasResult, historyResult] = await Promise.allSettled([
    rpc(url, 'eth_gasPrice'),
    rpc(url, 'eth_feeHistory', ['0x4', 'latest', [10, 50, 90]]),
  ]);

  const gasPrice = gasResult.status === 'fulfilled' ? hexToGwei(gasResult.value) : null;
  let baseFee: number | null = null;
  let priorityFees: [number, number, number] | null = null;

  if (historyResult.status === 'fulfilled' && historyResult.value) {
    const history = historyResult.value as { baseFeePerGas?: string[]; reward?: string[][] };
    if (Array.isArray(history.baseFeePerGas) && history.baseFeePerGas.length > 0) {
      // The last entry is the base fee for the next block.
      baseFee = hexToGwei(history.baseFeePerGas[history.baseFeePerGas.length - 1]);
    }
    const rewards = Array.isArray(history.reward) ? history.reward[history.reward.length - 1] : undefined;
    if (rewards && rewards.length >= 3) {
      const [p10, p50, p90] = rewards.map(hexToGwei);
      if (p10 !== null && p50 !== null && p90 !== null) priorityFees = [p10, p50, p90];
    }
  }

  if (gasPrice === null || gasPrice <= 0) {
    return {
      ok: false,
      stale: false,
      fetchedAt: null,
      gasPrice: null,
      baseFee: null,
      priorityFees: null,
      error: gasResult.status === 'rejected' ? String(gasResult.reason) : 'No gas price returned',
    };
  }

  return { ok: true, stale: false, fetchedAt: now, gasPrice, baseFee, priorityFees };
}

async function readBitcoin(): Promise<BitcoinFee> {
  try {
    const res = await withTimeout(MEMPOOL_FEES_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`mempool.space HTTP ${res.status}`);
    const json = (await res.json()) as Record<string, unknown>;
    const pick = (k: string) => (typeof json[k] === 'number' && (json[k] as number) > 0 ? (json[k] as number) : null);
    const fee: BitcoinFee = {
      ok: true,
      stale: false,
      fetchedAt: Date.now(),
      fastestFee: pick('fastestFee'),
      halfHourFee: pick('halfHourFee'),
      hourFee: pick('hourFee'),
      economyFee: pick('economyFee'),
      minimumFee: pick('minimumFee'),
    };
    if (fee.fastestFee === null || fee.hourFee === null) throw new Error('Incomplete fee data');
    return fee;
  } catch (err) {
    return {
      ok: false,
      stale: false,
      fetchedAt: null,
      fastestFee: null,
      halfHourFee: null,
      hourFee: null,
      economyFee: null,
      minimumFee: null,
      error: err instanceof Error ? err.message : 'Unavailable',
    };
  }
}

async function readCachedJson<T>(key: string): Promise<T | null> {
  try {
    const hit = await caches.default.match(new Request(key));
    return hit ? ((await hit.json()) as T) : null;
  } catch {
    return null;
  }
}

async function writeCachedJson(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await caches.default.put(
      new Request(key),
      new Response(JSON.stringify(value), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}` },
      })
    );
  } catch {
    /* cache unavailable */
  }
}

function respond(snapshot: Snapshot, cacheStatus: string): Response {
  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${FRESH_TTL}`,
      'X-Cache': cacheStatus,
    },
  });
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  waitUntil?: (promise: Promise<unknown>) => void;
}): Promise<Response> {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'GET, HEAD' },
    });
  }

  const fresh = await readCachedJson<Snapshot>(FRESH_KEY);
  if (fresh && Date.now() - fresh.fetchedAt < FRESH_TTL * 1000) {
    return respond(fresh, 'HIT');
  }

  const names = Object.keys(CHAINS);
  const [chainResults, bitcoin] = await Promise.all([
    Promise.all(names.map((name) => readChain(CHAINS[name]))),
    readBitcoin(),
  ]);

  const lastGood = await readCachedJson<Snapshot>(LAST_GOOD_KEY);

  const snapshot: Snapshot = { fetchedAt: Date.now(), chains: {}, bitcoin };
  const nextLastGood: Snapshot = {
    fetchedAt: snapshot.fetchedAt,
    chains: { ...(lastGood?.chains ?? {}) },
    bitcoin: lastGood?.bitcoin ?? bitcoin,
  };

  names.forEach((name, i) => {
    const result = chainResults[i];
    if (result.ok) {
      snapshot.chains[name] = result;
      nextLastGood.chains[name] = result;
      return;
    }
    const previous = lastGood?.chains?.[name];
    if (previous?.ok && previous.fetchedAt && Date.now() - previous.fetchedAt < LAST_GOOD_TTL * 1000) {
      snapshot.chains[name] = { ...previous, stale: true, error: result.error };
    } else {
      snapshot.chains[name] = result;
    }
  });

  if (bitcoin.ok) {
    nextLastGood.bitcoin = bitcoin;
  } else if (
    lastGood?.bitcoin?.ok &&
    lastGood.bitcoin.fetchedAt &&
    Date.now() - lastGood.bitcoin.fetchedAt < LAST_GOOD_TTL * 1000
  ) {
    snapshot.bitcoin = { ...lastGood.bitcoin, stale: true, error: bitcoin.error };
  }

  const writes = Promise.all([
    writeCachedJson(FRESH_KEY, snapshot, FRESH_TTL),
    writeCachedJson(LAST_GOOD_KEY, nextLastGood, LAST_GOOD_TTL),
  ]);
  if (context.waitUntil) context.waitUntil(writes);
  else await writes;

  return respond(snapshot, 'MISS');
}
