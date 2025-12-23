/**
 * CryptoScamDB Integration Service
 * Syncs and maps data from the open-source CryptoScamDB database
 * @see https://github.com/CryptoScamDB/api.cryptoscamdb.org
 */

import { supabase } from '../lib/supabase';
import type { ScamType, ScamSeverity, InsertScamReport } from '../types/admin-database';

// CryptoScamDB data structure based on their YAML/JSON format
export interface CryptoScamDBEntry {
  id: number;
  name: string;
  url: string;
  coin?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  addresses?: string[];
  reporter?: string;
  status?: string;
}

// Mapping CryptoScamDB categories to our scam types
const CATEGORY_MAP: Record<string, ScamType> = {
  'Phishing': 'phishing',
  'phishing': 'phishing',
  'Scam': 'other',
  'scam': 'other',
  'Fake ICO': 'fake_ico',
  'fake_ico': 'fake_ico',
  'Fake Exchange': 'fake_exchange',
  'fake_exchange': 'fake_exchange',
  'Ponzi': 'ponzi',
  'ponzi': 'ponzi',
  'Pyramid': 'ponzi',
  'Rug Pull': 'rug_pull',
  'rug_pull': 'rug_pull',
  'rugpull': 'rug_pull',
  'Impersonation': 'impersonation',
  'impersonation': 'impersonation',
  'Pump & Dump': 'pump_dump',
  'pump_dump': 'pump_dump',
};

// Mapping coins to blockchains
const COIN_TO_BLOCKCHAIN: Record<string, string> = {
  'ETH': 'Ethereum',
  'BTC': 'Bitcoin',
  'SOL': 'Solana',
  'MATIC': 'Polygon',
  'BNB': 'BNB Chain',
  'AVAX': 'Avalanche',
  'FTM': 'Fantom',
  'ARB': 'Arbitrum',
  'OP': 'Optimism',
};

/**
 * Map CryptoScamDB category to our ScamType
 */
function mapCategory(category?: string): ScamType {
  if (!category) return 'phishing'; // Default to phishing as most common
  return CATEGORY_MAP[category] || 'other';
}

/**
 * Map coin to blockchain
 */
function mapCoinToBlockchain(coin?: string): string | null {
  if (!coin) return null;
  return COIN_TO_BLOCKCHAIN[coin.toUpperCase()] || null;
}

/**
 * Determine severity based on entry characteristics
 */
function determineSeverity(entry: CryptoScamDBEntry): ScamSeverity {
  // High severity for exchanges and ICOs (larger potential losses)
  if (entry.category === 'Fake Exchange' || entry.category === 'Fake ICO') {
    return 'high';
  }
  // Critical for known ponzi/pyramid schemes
  if (entry.category === 'Ponzi' || entry.category === 'Pyramid') {
    return 'critical';
  }
  // Medium for phishing with known addresses
  if (entry.addresses && entry.addresses.length > 0) {
    return 'medium';
  }
  // Default to low for basic phishing sites
  return 'low';
}

/**
 * Generate red flags based on entry data
 */
function generateRedFlags(entry: CryptoScamDBEntry): string[] {
  const flags: string[] = [];

  if (entry.category === 'Phishing' || entry.category === 'phishing') {
    flags.push('Impersonating legitimate service');
    flags.push('Fake website mimicking trusted brand');
  }

  if (entry.subcategory) {
    flags.push(`Targets ${entry.subcategory} users`);
  }

  if (entry.addresses && entry.addresses.length > 0) {
    flags.push('Known malicious wallet addresses');
  }

  if (entry.url) {
    // Check for suspicious URL patterns
    if (entry.url.includes('-') && entry.url.split('-').length > 2) {
      flags.push('URL contains multiple hyphens (typosquatting)');
    }
    if (/\d/.test(entry.url.split('.')[0])) {
      flags.push('URL contains numbers mimicking legitimate domain');
    }
  }

  if (entry.category === 'Ponzi' || entry.category === 'Pyramid') {
    flags.push('Unrealistic return promises');
    flags.push('Recruitment-based rewards');
  }

  if (entry.category === 'Rug Pull' || entry.category === 'rug_pull') {
    flags.push('Sudden liquidity removal');
    flags.push('Anonymous team');
  }

  return flags;
}

/**
 * Transform CryptoScamDB entry to our ScamReport format
 */
export function transformEntry(entry: CryptoScamDBEntry): InsertScamReport {
  const scamType = mapCategory(entry.category);
  const severity = determineSeverity(entry);
  const blockchain = mapCoinToBlockchain(entry.coin);
  const redFlags = generateRedFlags(entry);

  // Generate a descriptive title
  const title = entry.description
    ? `${entry.name}: ${entry.description.slice(0, 50)}${entry.description.length > 50 ? '...' : ''}`
    : `${entry.category || 'Scam'}: ${entry.name}`;

  // Generate description
  const description = entry.description ||
    `Reported ${entry.category || 'scam'} at ${entry.url}${entry.subcategory ? `. Targets ${entry.subcategory} users.` : ''}`;

  return {
    title,
    description,
    scam_type: scamType,
    severity,
    status: 'verified', // CryptoScamDB entries are pre-verified
    website_url: entry.url.startsWith('http') ? entry.url : `https://${entry.url}`,
    wallet_addresses: entry.addresses || null,
    blockchain,
    red_flags: redFlags.length > 0 ? redFlags : null,
    victims_count: 0, // Unknown from CryptoScamDB
    estimated_loss_usd: null,
    first_reported_date: new Date().toISOString().split('T')[0],
  };
}

/**
 * Import entries from CryptoScamDB format
 */
export async function importCryptoScamDBEntries(entries: CryptoScamDBEntry[]) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const entry of entries) {
    try {
      // Check if URL already exists
      const { data: existing } = await supabase
        .from('scam_reports')
        .select('id')
        .eq('website_url', entry.url.startsWith('http') ? entry.url : `https://${entry.url}`)
        .single();

      if (existing) {
        results.skipped++;
        continue;
      }

      const transformed = transformEntry(entry);

      const { error } = await supabase
        .from('scam_reports')
        .insert(transformed);

      if (error) {
        results.errors.push(`Failed to import ${entry.name}: ${error.message}`);
      } else {
        results.imported++;
      }
    } catch (err) {
      results.errors.push(`Error processing ${entry.name}: ${err}`);
    }
  }

  return results;
}

/**
 * Sync with CryptoScamDB API (when available)
 * Note: The API may require authentication or have rate limits
 */
export async function syncWithCryptoScamDB() {
  try {
    // Try to fetch from the API
    const response = await fetch('https://api.cryptoscamdb.org/v1/scams', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // The API response structure may vary
    const entries: CryptoScamDBEntry[] = Array.isArray(data) ? data : data.result || data.scams || [];

    return await importCryptoScamDBEntries(entries);
  } catch (error) {
    console.error('Failed to sync with CryptoScamDB:', error);
    return {
      imported: 0,
      skipped: 0,
      errors: [`API sync failed: ${error}`],
    };
  }
}

/**
 * Get sample data based on CryptoScamDB format
 * This provides initial seed data when the API is unavailable
 */
export function getSampleCryptoScamDBData(): CryptoScamDBEntry[] {
  return [
    // Phishing Sites
    {
      id: 1,
      name: 'myethervvallet.com',
      url: 'myethervvallet.com',
      coin: 'ETH',
      category: 'Phishing',
      subcategory: 'MyEtherWallet',
      description: 'Fake MyEtherWallet phishing site stealing private keys',
      reporter: 'MyCrypto',
    },
    {
      id: 2,
      name: 'metamask-wallet.io',
      url: 'metamask-wallet.io',
      coin: 'ETH',
      category: 'Phishing',
      subcategory: 'MetaMask',
      description: 'Fraudulent MetaMask clone requesting seed phrases',
      addresses: ['0x1234567890abcdef1234567890abcdef12345678'],
      reporter: 'Community',
    },
    {
      id: 3,
      name: 'trust-wallet-connect.com',
      url: 'trust-wallet-connect.com',
      coin: 'ETH',
      category: 'Phishing',
      subcategory: 'Trust Wallet',
      description: 'Fake Trust Wallet connection page',
      reporter: 'MyCrypto',
    },
    {
      id: 4,
      name: 'uniswap-airdrop.org',
      url: 'uniswap-airdrop.org',
      coin: 'ETH',
      category: 'Phishing',
      subcategory: 'Uniswap',
      description: 'Fake Uniswap airdrop claiming site',
      addresses: ['0xabcdef1234567890abcdef1234567890abcdef12'],
      reporter: 'Community',
    },
    // Rug Pulls
    {
      id: 5,
      name: 'SafeMoonClassic',
      url: 'safemoonclassic.io',
      coin: 'BNB',
      category: 'Rug Pull',
      description: 'Exit scam - developers drained liquidity pool',
      addresses: ['0x9876543210fedcba9876543210fedcba98765432'],
      reporter: 'RugDoc',
    },
    {
      id: 6,
      name: 'SquidGame Token',
      url: 'squidgame.cash',
      coin: 'BNB',
      category: 'Rug Pull',
      description: 'Famous rug pull where investors could not sell tokens',
      reporter: 'Community',
    },
    {
      id: 7,
      name: 'AnubisDAO',
      url: 'anubisdao.xyz',
      coin: 'ETH',
      category: 'Rug Pull',
      description: '$60M rug pull shortly after launch',
      addresses: ['0xfedcba0987654321fedcba0987654321fedcba09'],
      reporter: 'CertiK',
    },
    // Fake ICOs
    {
      id: 8,
      name: 'BitConnect',
      url: 'bitconnect.co',
      coin: 'BTC',
      category: 'Ponzi',
      description: 'Major cryptocurrency Ponzi scheme - $2.4B losses',
      reporter: 'SEC',
    },
    {
      id: 9,
      name: 'OneCoin',
      url: 'onecoin.eu',
      coin: 'BTC',
      category: 'Ponzi',
      description: 'Fraudulent cryptocurrency and pyramid scheme - $4B losses',
      reporter: 'FBI',
    },
    {
      id: 10,
      name: 'PlusToken',
      url: 'plustoken.io',
      coin: 'BTC',
      category: 'Ponzi',
      description: 'Chinese crypto Ponzi scheme - $2B losses',
      reporter: 'Community',
    },
    // Fake Exchanges
    {
      id: 11,
      name: 'Binance-Pro',
      url: 'binance-pro.com',
      coin: 'BTC',
      category: 'Fake Exchange',
      subcategory: 'Binance',
      description: 'Fake Binance exchange stealing deposits',
      reporter: 'Binance',
    },
    {
      id: 12,
      name: 'Coinbase-Trading',
      url: 'coinbase-trading.net',
      coin: 'BTC',
      category: 'Fake Exchange',
      subcategory: 'Coinbase',
      description: 'Fraudulent Coinbase clone',
      reporter: 'Community',
    },
    // Impersonation Scams
    {
      id: 13,
      name: 'Elon Musk Giveaway',
      url: 'elonmusk-crypto.com',
      coin: 'BTC',
      category: 'Impersonation',
      subcategory: 'Celebrity',
      description: 'Fake Elon Musk crypto giveaway scam',
      addresses: ['bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'],
      reporter: 'Twitter',
    },
    {
      id: 14,
      name: 'Vitalik ETH Doubler',
      url: 'vitalik-giveaway.org',
      coin: 'ETH',
      category: 'Impersonation',
      subcategory: 'Celebrity',
      description: 'Fake Vitalik Buterin ETH doubling scam',
      addresses: ['0x1111222233334444555566667777888899990000'],
      reporter: 'Community',
    },
    // Pump and Dump
    {
      id: 15,
      name: 'SaveTheKids Token',
      url: 'savethekids.io',
      coin: 'BNB',
      category: 'Pump & Dump',
      description: 'Influencer-promoted pump and dump scheme',
      reporter: 'Community',
    },
    // More Phishing
    {
      id: 16,
      name: 'ledger-live-wallet.com',
      url: 'ledger-live-wallet.com',
      coin: 'BTC',
      category: 'Phishing',
      subcategory: 'Ledger',
      description: 'Fake Ledger Live application stealing recovery phrases',
      reporter: 'Ledger',
    },
    {
      id: 17,
      name: 'opensea-verify.io',
      url: 'opensea-verify.io',
      coin: 'ETH',
      category: 'Phishing',
      subcategory: 'OpenSea',
      description: 'Fake OpenSea verification site',
      reporter: 'OpenSea',
    },
    {
      id: 18,
      name: 'pancakeswap-v3.com',
      url: 'pancakeswap-v3.com',
      coin: 'BNB',
      category: 'Phishing',
      subcategory: 'PancakeSwap',
      description: 'Fake PancakeSwap DEX stealing funds',
      reporter: 'Community',
    },
    // Solana Scams
    {
      id: 19,
      name: 'phantom-airdrop.com',
      url: 'phantom-airdrop.com',
      coin: 'SOL',
      category: 'Phishing',
      subcategory: 'Phantom',
      description: 'Fake Phantom wallet airdrop claiming site',
      reporter: 'Phantom',
    },
    {
      id: 20,
      name: 'solana-staking-rewards.io',
      url: 'solana-staking-rewards.io',
      coin: 'SOL',
      category: 'Phishing',
      subcategory: 'Solana',
      description: 'Fake Solana staking rewards scam',
      reporter: 'Community',
    },
    // Investment Scams
    {
      id: 21,
      name: 'CryptoTrader Pro',
      url: 'cryptotrader-pro.com',
      coin: 'BTC',
      category: 'Scam',
      description: 'Fake automated trading platform promising guaranteed returns',
      reporter: 'Community',
    },
    {
      id: 22,
      name: 'Bitcoin Revolution',
      url: 'bitcoin-revolution.app',
      coin: 'BTC',
      category: 'Scam',
      description: 'Celebrity-endorsed fake trading bot scam',
      reporter: 'Community',
    },
    // NFT Scams
    {
      id: 23,
      name: 'Bored Ape Yacht Club Fake Mint',
      url: 'boredapeyachtclub-mint.com',
      coin: 'ETH',
      category: 'Phishing',
      subcategory: 'NFT',
      description: 'Fake BAYC minting site stealing ETH',
      reporter: 'BAYC',
    },
    {
      id: 24,
      name: 'Azuki Official Mint',
      url: 'azuki-official-mint.io',
      coin: 'ETH',
      category: 'Phishing',
      subcategory: 'NFT',
      description: 'Fraudulent Azuki NFT minting page',
      reporter: 'Community',
    },
    // DeFi Exploits
    {
      id: 25,
      name: 'FakeAave',
      url: 'aave-finance.org',
      coin: 'ETH',
      category: 'Phishing',
      subcategory: 'Aave',
      description: 'Fake Aave lending protocol stealing deposits',
      addresses: ['0xaaaa1111bbbb2222cccc3333dddd4444eeee5555'],
      reporter: 'Aave',
    },
  ];
}

/**
 * Seed database with sample CryptoScamDB data
 */
export async function seedSampleData() {
  const sampleData = getSampleCryptoScamDBData();
  return await importCryptoScamDBEntries(sampleData);
}
