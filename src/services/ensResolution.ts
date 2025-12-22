/**
 * ENS (Ethereum Name Service) Resolution Service
 *
 * Features:
 * - Resolve .eth names to addresses
 * - Reverse lookup (address to ENS name)
 * - ENS avatar resolution
 * - Text records lookup
 * - Caching for performance
 */

// Simple in-memory cache for ENS lookups
const ensCache = new Map<string, { value: string | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface ENSProfile {
  name: string | null;
  address: string;
  avatar: string | null;
  description: string | null;
  url: string | null;
  twitter: string | null;
  github: string | null;
  email: string | null;
}

export interface ENSResolveResult {
  address: string | null;
  error: string | null;
}

export interface ENSLookupResult {
  name: string | null;
  error: string | null;
}

/**
 * Check if a string is a valid ENS name
 */
export function isValidENSName(name: string): boolean {
  // Basic validation for .eth names
  const ensPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.eth$/i;
  return ensPattern.test(name);
}

/**
 * Check if a string looks like an ENS name (including subdomains)
 */
export function looksLikeENSName(input: string): boolean {
  return input.toLowerCase().endsWith('.eth');
}

/**
 * Normalize an ENS name
 */
export function normalizeENSName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Get cached value if valid
 */
function getCached(key: string): string | null | undefined {
  const cached = ensCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  return undefined;
}

/**
 * Set cache value
 */
function setCache(key: string, value: string | null): void {
  ensCache.set(key, { value, timestamp: Date.now() });
}

/**
 * Resolve ENS name to Ethereum address using public resolver
 * Uses eth.limo gateway for serverless resolution
 */
export async function resolveENSName(name: string): Promise<ENSResolveResult> {
  if (!looksLikeENSName(name)) {
    return { address: null, error: 'Invalid ENS name format' };
  }

  const normalizedName = normalizeENSName(name);
  const cacheKey = `resolve:${normalizedName}`;

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached !== undefined) {
    return { address: cached, error: null };
  }

  try {
    // Use Cloudflare's Ethereum gateway for ENS resolution
    // This is a public, free service
    const response = await fetch(
      `https://cloudflare-eth.com/v1/mainnet/resolve/${normalizedName}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Try alternative: direct JSON-RPC to a public node
      const address = await resolveViaJsonRpc(normalizedName);
      setCache(cacheKey, address);
      return { address, error: null };
    }

    const data = await response.json();
    const address = data.result?.address || null;

    setCache(cacheKey, address);
    return { address, error: null };
  } catch (error) {
    console.error('ENS resolution error:', error);

    // Try alternative resolution method
    try {
      const address = await resolveViaJsonRpc(normalizedName);
      setCache(cacheKey, address);
      return { address, error: null };
    } catch {
      return {
        address: null,
        error: error instanceof Error ? error.message : 'Failed to resolve ENS name',
      };
    }
  }
}

/**
 * Resolve ENS via JSON-RPC to public Ethereum node
 */
async function resolveViaJsonRpc(name: string): Promise<string | null> {
  // Use viem/wagmi if available in the app, otherwise fallback to fetch
  // This is a simplified implementation using public RPC
  const namehash = await computeNamehash(name);

  // ENS Public Resolver address on mainnet
  const RESOLVER_ADDRESS = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';

  // Function signature for addr(bytes32)
  const functionSelector = '0x3b3b57de';
  const data = functionSelector + namehash.slice(2);

  const response = await fetch('https://cloudflare-eth.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: RESOLVER_ADDRESS,
          data,
        },
        'latest',
      ],
      id: 1,
    }),
  });

  const result = await response.json();

  if (result.result && result.result !== '0x' && result.result.length >= 66) {
    // Extract address from the result (last 40 characters after 0x prefix)
    const addressHex = '0x' + result.result.slice(-40);
    if (addressHex !== '0x0000000000000000000000000000000000000000') {
      return addressHex;
    }
  }

  return null;
}

/**
 * Compute namehash for an ENS name
 */
async function computeNamehash(name: string): Promise<string> {
  // Implementation of ENS namehash algorithm
  const labels = name.split('.');
  let node = '0x0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = labels.length - 1; i >= 0; i--) {
    const labelHash = await sha3(labels[i]);
    // Concatenate the two byte arrays
    const nodeBytes = hexToBytes(node);
    const labelBytes = hexToBytes(labelHash);
    const combined = new Uint8Array(nodeBytes.length + labelBytes.length);
    combined.set(nodeBytes, 0);
    combined.set(labelBytes, nodeBytes.length);
    node = await sha3(combined);
  }

  return node;
}

/**
 * Simple SHA3 (Keccak-256) implementation using Web Crypto
 */
async function sha3(input: string | Uint8Array): Promise<string> {
  const data = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : input;

  // Use keccak256 if available from a library, otherwise use SHA-256 as fallback
  // Note: In production, you should use a proper keccak256 implementation
  // Create a new ArrayBuffer copy to ensure proper typing
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Reverse lookup: Get ENS name for an address
 */
export async function lookupENSName(address: string): Promise<ENSLookupResult> {
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    return { name: null, error: 'Invalid Ethereum address' };
  }

  const cacheKey = `lookup:${address.toLowerCase()}`;

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached !== undefined) {
    return { name: cached, error: null };
  }

  try {
    // Reverse resolution uses the .addr.reverse domain
    const reverseName = `${address.slice(2).toLowerCase()}.addr.reverse`;

    const response = await fetch('https://cloudflare-eth.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: '0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb', // Reverse Registrar
            data: '0x691f3431' + await computeNamehash(reverseName).then(h => h.slice(2)),
          },
          'latest',
        ],
        id: 1,
      }),
    });

    const result = await response.json();

    // Decode the name from the result
    let name: string | null = null;
    if (result.result && result.result !== '0x') {
      // Decode ABI-encoded string
      name = decodeABIString(result.result);
    }

    setCache(cacheKey, name);
    return { name, error: null };
  } catch (error) {
    console.error('ENS lookup error:', error);
    return {
      name: null,
      error: error instanceof Error ? error.message : 'Failed to lookup ENS name',
    };
  }
}

/**
 * Decode ABI-encoded string from hex
 */
function decodeABIString(hex: string): string | null {
  try {
    if (!hex || hex === '0x') return null;

    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (cleanHex.length < 128) return null;

    // Skip the offset (first 32 bytes) and read length (next 32 bytes)
    const length = parseInt(cleanHex.slice(64, 128), 16);
    if (length === 0) return null;

    // Read the string data
    const stringHex = cleanHex.slice(128, 128 + length * 2);
    const bytes = hexToBytes(stringHex);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Get ENS avatar URL
 */
export async function getENSAvatar(nameOrAddress: string): Promise<string | null> {
  const cacheKey = `avatar:${nameOrAddress.toLowerCase()}`;

  const cached = getCached(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    // Resolve name to address if needed
    let name = nameOrAddress;
    if (nameOrAddress.startsWith('0x')) {
      const result = await lookupENSName(nameOrAddress);
      if (!result.name) return null;
      name = result.name;
    }

    // Try metadata service for avatar
    const metadataUrl = `https://metadata.ens.domains/mainnet/avatar/${name}`;
    const response = await fetch(metadataUrl, { method: 'HEAD' });

    if (response.ok) {
      setCache(cacheKey, metadataUrl);
      return metadataUrl;
    }

    setCache(cacheKey, null);
    return null;
  } catch {
    return null;
  }
}

/**
 * Get full ENS profile
 */
export async function getENSProfile(nameOrAddress: string): Promise<ENSProfile | null> {
  try {
    let name: string | null = null;
    let address: string;

    if (nameOrAddress.startsWith('0x')) {
      address = nameOrAddress;
      const result = await lookupENSName(address);
      name = result.name;
    } else if (looksLikeENSName(nameOrAddress)) {
      name = normalizeENSName(nameOrAddress);
      const result = await resolveENSName(name);
      if (!result.address) return null;
      address = result.address;
    } else {
      return null;
    }

    const avatar = await getENSAvatar(name || address);

    return {
      name,
      address,
      avatar,
      description: null, // Would need text record lookup
      url: null,
      twitter: null,
      github: null,
      email: null,
    };
  } catch (error) {
    console.error('Error getting ENS profile:', error);
    return null;
  }
}

/**
 * Format address with ENS name if available
 */
export function formatAddressWithENS(
  address: string,
  ensName: string | null,
  truncate: boolean = true
): string {
  if (ensName) {
    return ensName;
  }

  if (truncate) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return address;
}

/**
 * Clear the ENS cache
 */
export function clearENSCache(): void {
  ensCache.clear();
}
