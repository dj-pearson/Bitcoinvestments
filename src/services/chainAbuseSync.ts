/**
 * ChainAbuse Integration Service
 * Integrates with ChainAbuse API for real-time scam data
 * @see https://docs.chainabuse.com/docs/welcome-to-chainabuse-api
 */

import { supabase } from '../lib/supabase';
import type { ScamType, ScamSeverity, InsertScamReport } from '../types/admin-database';

// ChainAbuse API response structure
export interface ChainAbuseReport {
  id: string;
  address?: string;
  url?: string;
  category: string;
  description: string;
  reportedBy?: string;
  createdAt: string;
  chain?: string;
  confidenceScore?: number;
  amount?: number;
  currency?: string;
}

// ChainAbuse categories mapped to our types
const CHAINABUSE_CATEGORY_MAP: Record<string, ScamType> = {
  'phishing': 'phishing',
  'scam': 'other',
  'fraud': 'other',
  'impersonation': 'impersonation',
  'ransomware': 'other',
  'sextortion': 'other',
  'pig_butchering': 'ponzi',
  'investment_scam': 'ponzi',
  'rug_pull': 'rug_pull',
  'fake_ico': 'fake_ico',
  'fake_exchange': 'fake_exchange',
  'pump_and_dump': 'pump_dump',
  'romance_scam': 'impersonation',
  'giveaway_scam': 'impersonation',
  'nft_scam': 'rug_pull',
  'wallet_drainer': 'phishing',
};

// Chain mapping
const CHAIN_MAP: Record<string, string> = {
  'ethereum': 'Ethereum',
  'eth': 'Ethereum',
  'bitcoin': 'Bitcoin',
  'btc': 'Bitcoin',
  'solana': 'Solana',
  'sol': 'Solana',
  'polygon': 'Polygon',
  'matic': 'Polygon',
  'bsc': 'BNB Chain',
  'bnb': 'BNB Chain',
  'avalanche': 'Avalanche',
  'avax': 'Avalanche',
  'arbitrum': 'Arbitrum',
  'optimism': 'Optimism',
  'base': 'Base',
  'fantom': 'Fantom',
};

/**
 * Map ChainAbuse category to our ScamType
 */
function mapChainAbuseCategory(category: string): ScamType {
  const normalized = category.toLowerCase().replace(/[- ]/g, '_');
  return CHAINABUSE_CATEGORY_MAP[normalized] || 'other';
}

/**
 * Map chain to blockchain name
 */
function mapChain(chain?: string): string | null {
  if (!chain) return null;
  const normalized = chain.toLowerCase();
  return CHAIN_MAP[normalized] || chain;
}

/**
 * Determine severity based on confidence score and amount
 */
function determineSeverity(report: ChainAbuseReport): ScamSeverity {
  const score = report.confidenceScore || 0;
  const amount = report.amount || 0;

  // High confidence + large amount = critical
  if (score >= 80 && amount >= 100000) return 'critical';
  if (score >= 70 || amount >= 50000) return 'high';
  if (score >= 50 || amount >= 10000) return 'medium';
  return 'low';
}

/**
 * Transform ChainAbuse report to our format
 */
export function transformChainAbuseReport(report: ChainAbuseReport): InsertScamReport {
  const scamType = mapChainAbuseCategory(report.category);
  const severity = determineSeverity(report);
  const blockchain = mapChain(report.chain);

  // Generate red flags
  const redFlags: string[] = [];
  if (report.confidenceScore && report.confidenceScore >= 70) {
    redFlags.push('High confidence scam report');
  }
  if (report.category.toLowerCase().includes('phishing')) {
    redFlags.push('Phishing attempt - steals credentials');
  }
  if (report.category.toLowerCase().includes('drainer')) {
    redFlags.push('Wallet drainer - empties connected wallets');
  }

  return {
    title: `${report.category}: ${report.url || report.address?.slice(0, 20) || 'Unknown'}`,
    description: report.description || `Reported ${report.category} scam`,
    scam_type: scamType,
    severity,
    status: 'verified',
    website_url: report.url || null,
    wallet_addresses: report.address ? [report.address] : null,
    blockchain,
    red_flags: redFlags.length > 0 ? redFlags : null,
    victims_count: 1,
    estimated_loss_usd: report.amount || null,
  };
}

/**
 * Fetch reports from ChainAbuse API
 * Note: Requires API key from ChainAbuse
 */
export async function fetchChainAbuseReports(apiKey: string, params?: {
  address?: string;
  url?: string;
  category?: string;
  limit?: number;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.address) queryParams.append('address', params.address);
    if (params?.url) queryParams.append('url', params.url);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(
      `https://api.chainabuse.com/v1/reports?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ChainAbuse API returned ${response.status}`);
    }

    const data = await response.json();
    return { reports: data.reports || [], error: null };
  } catch (error) {
    console.error('ChainAbuse API error:', error);
    return { reports: [], error: String(error) };
  }
}

/**
 * Check if an address is reported on ChainAbuse
 */
export async function checkAddressOnChainAbuse(apiKey: string, address: string) {
  return fetchChainAbuseReports(apiKey, { address, limit: 10 });
}

/**
 * Import ChainAbuse reports into our database
 */
export async function importChainAbuseReports(reports: ChainAbuseReport[]) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const report of reports) {
    try {
      // Check if already exists by URL or address
      let existing = null;
      if (report.url) {
        const { data } = await supabase
          .from('scam_reports')
          .select('id')
          .eq('website_url', report.url)
          .single();
        existing = data;
      } else if (report.address) {
        const { data } = await supabase
          .from('scam_reports')
          .select('id')
          .contains('wallet_addresses', [report.address])
          .single();
        existing = data;
      }

      if (existing) {
        results.skipped++;
        continue;
      }

      const transformed = transformChainAbuseReport(report);
      transformed.reported_by = null; // System import

      const { error } = await supabase
        .from('scam_reports')
        .insert({
          ...transformed,
          source: 'community_import',
          external_id: report.id,
        });

      if (error) {
        results.errors.push(`Failed to import ${report.id}: ${error.message}`);
      } else {
        results.imported++;
      }
    } catch (err) {
      results.errors.push(`Error processing ${report.id}: ${err}`);
    }
  }

  return results;
}

/**
 * Comprehensive sample data based on DFPI, FBI IC3, and ChainAbuse patterns
 * These represent real scam patterns without using actual victim data
 */
export function getComprehensiveSampleData(): InsertScamReport[] {
  return [
    // === PIG BUTCHERING / ROMANCE INVESTMENT SCAMS (Largest category - $5.8B in 2024) ===
    {
      title: 'Pig Butchering: Fake Crypto Trading Platform via WhatsApp',
      description: 'Victim was contacted on WhatsApp by someone claiming to be an investment advisor. After weeks of building trust, they were directed to a fake trading platform showing fabricated profits. When attempting to withdraw, victims are asked for additional "taxes" or "fees" that are never refunded.',
      scam_type: 'ponzi',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://coinbase-pro-trading.net',
      blockchain: 'Ethereum',
      red_flags: [
        'Initial contact via social media or dating apps',
        'Gradual trust building over weeks/months',
        'Fake trading platform with fabricated profits',
        'Cannot withdraw without paying "fees" or "taxes"',
        'Pressure to invest more to "unlock" funds',
      ],
      victims_count: 2847,
      estimated_loss_usd: 12500000,
    },
    {
      title: 'Romance Scam: Tinder Crypto Investment Scheme',
      description: 'Scammers create fake profiles on dating apps, build romantic relationships, then convince victims to invest in cryptocurrency through fraudulent platforms. Victims report emotional manipulation combined with financial fraud.',
      scam_type: 'impersonation',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://btc-wealth-invest.com',
      blockchain: 'Bitcoin',
      red_flags: [
        'Met on dating app but quickly moves to WhatsApp/Telegram',
        'Claims to be successful crypto trader',
        'Refuses video calls or in-person meetings',
        'Platform shows unrealistic returns (10-50% weekly)',
        'Romantic relationship used to build trust',
      ],
      victims_count: 1523,
      estimated_loss_usd: 8900000,
    },

    // === CRYPTO ATM FRAUD ($246.7M in 2024) ===
    {
      title: 'Government Impersonation: IRS Crypto ATM Scam',
      description: 'Scammers impersonate IRS or Social Security agents, claiming victim owes back taxes or faces arrest. They instruct victims to pay via Bitcoin ATM, providing QR codes that send funds to scammer wallets.',
      scam_type: 'impersonation',
      severity: 'high',
      status: 'verified',
      wallet_addresses: ['bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'],
      blockchain: 'Bitcoin',
      red_flags: [
        'Caller claims to be government agency',
        'Threats of immediate arrest or legal action',
        'Demands payment via crypto ATM specifically',
        'Provides QR code for payment',
        'Creates urgency - must pay within hours',
      ],
      victims_count: 4521,
      estimated_loss_usd: 15000000,
    },
    {
      title: 'Tech Support Scam: Microsoft Crypto ATM Payment',
      description: 'Victims receive pop-up warnings about computer viruses. When calling the provided number, scammers claim the computer is compromised and demand payment via Bitcoin ATM to "secure" their accounts.',
      scam_type: 'impersonation',
      severity: 'high',
      status: 'verified',
      phone_numbers: ['+1-888-555-0123'],
      blockchain: 'Bitcoin',
      red_flags: [
        'Pop-up warning with phone number',
        'Caller requests remote access to computer',
        'Claims bank accounts are compromised',
        'Insists on Bitcoin ATM payment',
        'Stays on phone during payment',
      ],
      victims_count: 892,
      estimated_loss_usd: 3200000,
    },

    // === WALLET DRAINER ATTACKS (New category from DFPI) ===
    {
      title: 'Wallet Drainer: Fake NFT Mint Site',
      description: 'Malicious website disguised as popular NFT collection mint. When users connect their wallets and approve the transaction, a smart contract drains all tokens and NFTs from the connected wallet.',
      scam_type: 'phishing',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://boredape-official-mint.io',
      contract_address: '0x1234567890abcdef1234567890abcdef12345678',
      blockchain: 'Ethereum',
      red_flags: [
        'Fake mint site for popular NFT project',
        'Requests unlimited token approvals',
        'Transaction drains entire wallet',
        'Uses similar domain to legitimate project',
        'Promoted via hacked Twitter accounts',
      ],
      victims_count: 342,
      estimated_loss_usd: 4500000,
    },
    {
      title: 'Wallet Drainer: Fake Airdrop Claim',
      description: 'Users directed to claim "free" airdrop tokens. The malicious smart contract requests token approvals that allow it to drain all assets from the connected wallet.',
      scam_type: 'phishing',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://uniswap-airdrop-claim.org',
      contract_address: '0xabcdef1234567890abcdef1234567890abcdef12',
      blockchain: 'Ethereum',
      red_flags: [
        'Unsolicited airdrop announcement',
        'Requires wallet connection to claim',
        'Requests SetApprovalForAll permission',
        'Uses Uniswap branding without authorization',
        'Spread via phishing emails and social media',
      ],
      victims_count: 567,
      estimated_loss_usd: 2800000,
    },

    // === CRYPTO GAMING SCAMS (New DFPI category) ===
    {
      title: 'Play-to-Earn Scam: Fake Axie Infinity Clone',
      description: 'Fraudulent play-to-earn game promising daily crypto rewards. Users must purchase NFTs or tokens to participate. The game either never pays out or eventually disappears with user funds.',
      scam_type: 'rug_pull',
      severity: 'high',
      status: 'verified',
      website_url: 'https://meta-pets-game.io',
      token_name: 'MetaPets',
      token_symbol: 'MPETS',
      blockchain: 'BNB Chain',
      red_flags: [
        'Requires upfront NFT/token purchase',
        'Promises unrealistic daily returns',
        'Anonymous development team',
        'No real gameplay, just token staking',
        'Locked liquidity with hidden backdoors',
      ],
      victims_count: 1234,
      estimated_loss_usd: 3400000,
    },

    // === BITCOIN MINING SCAMS (New DFPI category) ===
    {
      title: 'Cloud Mining Scam: Fake Bitcoin Mining Investment',
      description: 'Company claims to operate large Bitcoin mining facilities. Investors purchase "mining contracts" that promise daily BTC payouts. Early investors receive payments from new investor funds (Ponzi structure).',
      scam_type: 'ponzi',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://btc-cloud-mining-pro.com',
      blockchain: 'Bitcoin',
      red_flags: [
        'Guaranteed daily mining returns',
        'No proof of actual mining operations',
        'Referral bonuses encourage recruitment',
        'Withdrawals delayed or require "upgrades"',
        'Anonymous operators',
      ],
      victims_count: 4521,
      estimated_loss_usd: 8900000,
    },

    // === CRYPTO JOB SCAMS (New DFPI category) ===
    {
      title: 'Job Scam: Fake Crypto Trading Company Recruitment',
      description: 'Scammers impersonate recruiters from legitimate crypto companies on LinkedIn. Victims are "hired" for remote positions but must first pay for "training" or "equipment" in cryptocurrency.',
      scam_type: 'impersonation',
      severity: 'medium',
      status: 'verified',
      website_url: 'https://binance-careers-portal.com',
      red_flags: [
        'Unsolicited job offer via LinkedIn/email',
        'Requires upfront payment for training',
        'Interview conducted only via text chat',
        'Salary seems too good to be true',
        'Payment requested in cryptocurrency',
      ],
      victims_count: 234,
      estimated_loss_usd: 450000,
    },

    // === INVESTMENT GROUP SCAMS (WhatsApp/Telegram) ===
    {
      title: 'Telegram Pump Group: Fake Trading Signals',
      description: 'Premium Telegram group promising profitable trading signals. Admins accumulate tokens before announcing "buy signals" to members, then sell at the inflated price (pump and dump).',
      scam_type: 'pump_dump',
      severity: 'high',
      status: 'verified',
      social_media_links: { telegram: 't.me/cryptoprofitsignals' },
      blockchain: 'Ethereum',
      red_flags: [
        'Premium membership fee required',
        'Claims of insider trading information',
        'Signals always on low-cap tokens',
        'Admin sells while members buy',
        'Screenshots of fake profits',
      ],
      victims_count: 892,
      estimated_loss_usd: 1200000,
    },

    // === CELEBRITY IMPERSONATION SCAMS ===
    {
      title: 'Elon Musk Bitcoin Giveaway Scam',
      description: 'Fake YouTube livestream or Twitter posts impersonating Elon Musk promoting a "crypto giveaway" where users send Bitcoin and supposedly receive double back. No funds are ever returned.',
      scam_type: 'impersonation',
      severity: 'high',
      status: 'verified',
      website_url: 'https://tesla-btc-event.com',
      wallet_addresses: ['bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'],
      blockchain: 'Bitcoin',
      red_flags: [
        'Claims celebrity is giving away crypto',
        '"Send X to receive 2X back" promise',
        'Uses deepfake or old video footage',
        'Creates artificial urgency (limited time)',
        'Promoted via YouTube ads or hacked accounts',
      ],
      victims_count: 3456,
      estimated_loss_usd: 5600000,
    },
    {
      title: 'MrBeast Crypto Giveaway Scam',
      description: 'Fraudulent ads and websites impersonating MrBeast offering free cryptocurrency. Victims must "verify their wallet" by sending a small amount first, which is never returned.',
      scam_type: 'impersonation',
      severity: 'medium',
      status: 'verified',
      website_url: 'https://mrbeast-crypto-giveaway.net',
      blockchain: 'Ethereum',
      red_flags: [
        'Uses celebrity likeness without permission',
        'Requires sending crypto to receive more',
        'Fake verification process',
        'Promoted via social media ads',
        'Professional-looking but fraudulent website',
      ],
      victims_count: 1234,
      estimated_loss_usd: 890000,
    },

    // === RUG PULLS (DeFi/Token Scams) ===
    {
      title: 'Rug Pull: SafeMoon Clone Token',
      description: 'Token launched with promises of revolutionary tokenomics. Developers held large portion of supply, disabled selling, then drained liquidity pool.',
      scam_type: 'rug_pull',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://safegalaxy-token.com',
      token_name: 'SafeGalaxy',
      token_symbol: 'SAFEGAL',
      contract_address: '0xfedcba0987654321fedcba0987654321fedcba09',
      blockchain: 'BNB Chain',
      red_flags: [
        'Anonymous team with cartoon avatars',
        'Honeypot - selling disabled',
        'Unlocked liquidity pool',
        'Aggressive social media marketing',
        'Copied smart contract code',
      ],
      victims_count: 4521,
      estimated_loss_usd: 2300000,
    },
    {
      title: 'DeFi Rug Pull: Fake Yield Farm',
      description: 'High-APY yield farming protocol that allowed deposits but prevented withdrawals. Smart contract contained hidden function allowing owner to drain all funds.',
      scam_type: 'rug_pull',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://mega-yield-farm.finance',
      contract_address: '0x9876543210fedcba9876543210fedcba98765432',
      blockchain: 'Ethereum',
      red_flags: [
        'APY over 10,000%',
        'Unaudited smart contract',
        'Owner can modify contract parameters',
        'No timelocks on admin functions',
        'Team tokens not locked',
      ],
      victims_count: 892,
      estimated_loss_usd: 4500000,
    },

    // === FAKE EXCHANGES ===
    {
      title: 'Fake Exchange: Binance Clone',
      description: 'Phishing site designed to look exactly like Binance. Users who enter credentials have their accounts compromised, and deposits are stolen.',
      scam_type: 'fake_exchange',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://binance-secure-login.com',
      blockchain: 'Bitcoin',
      red_flags: [
        'Domain similar but not identical to real exchange',
        'Requests 2FA codes or seed phrases',
        'SSL certificate from unusual provider',
        'Contact information doesn\'t match official site',
        'Promoted via phishing emails',
      ],
      victims_count: 234,
      estimated_loss_usd: 890000,
    },
    {
      title: 'Fake Exchange: Unregistered Trading Platform',
      description: 'Unregistered exchange offering leveraged crypto trading. Platform manipulates prices against users and makes withdrawals impossible.',
      scam_type: 'fake_exchange',
      severity: 'high',
      status: 'verified',
      website_url: 'https://crypto-futures-pro.com',
      red_flags: [
        'Not registered with any financial authority',
        'Unrealistic leverage options (1000x)',
        'Prices don\'t match other exchanges',
        'Withdrawals require additional deposits',
        'No physical address or verifiable team',
      ],
      victims_count: 567,
      estimated_loss_usd: 2100000,
    },

    // === PHISHING SITES ===
    {
      title: 'MetaMask Phishing: Fake Wallet Recovery',
      description: 'Phishing site claiming to offer MetaMask wallet recovery services. Users who enter their seed phrase have their wallets immediately drained.',
      scam_type: 'phishing',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://metamask-wallet-recovery.io',
      blockchain: 'Ethereum',
      red_flags: [
        'Asks for seed phrase or private key',
        'Claims to recover lost wallets',
        'Domain doesn\'t match official site',
        'Found via Google ads or SEO manipulation',
        'No legitimate recovery service needs your seed phrase',
      ],
      victims_count: 1234,
      estimated_loss_usd: 3400000,
    },
    {
      title: 'Ledger Phishing: Fake Firmware Update',
      description: 'Phishing campaign impersonating Ledger hardware wallet. Email claims urgent firmware update is needed and directs to fake site requesting 24-word recovery phrase.',
      scam_type: 'phishing',
      severity: 'critical',
      status: 'verified',
      website_url: 'https://ledger-firmware-update.com',
      email_addresses: ['security@ledger-support.com'],
      blockchain: 'Bitcoin',
      red_flags: [
        'Email creates urgency about security',
        'Domain not ledger.com',
        'Requests recovery phrase entry',
        'Ledger never asks for recovery phrase online',
        'Poor grammar in email (sometimes)',
      ],
      victims_count: 892,
      estimated_loss_usd: 5600000,
    },
    {
      title: 'OpenSea Phishing: Fake Collection Verification',
      description: 'Scammers send emails claiming NFT collections need "verification" to avoid being delisted. Link leads to site that requests wallet signature to drain NFTs.',
      scam_type: 'phishing',
      severity: 'high',
      status: 'verified',
      website_url: 'https://opensea-collection-verify.com',
      blockchain: 'Ethereum',
      red_flags: [
        'Unsolicited email about collection',
        'Creates urgency about delisting',
        'Requests wallet signature for "verification"',
        'Domain not opensea.io',
        'Transaction actually transfers NFTs',
      ],
      victims_count: 345,
      estimated_loss_usd: 1200000,
    },

    // === AI-ENHANCED SCAMS (Emerging threat) ===
    {
      title: 'AI Trading Bot Scam: Fake Automated Returns',
      description: 'Claims to use advanced AI for automated crypto trading with guaranteed profits. Dashboard shows fabricated gains while actual deposits are stolen.',
      scam_type: 'ponzi',
      severity: 'high',
      status: 'verified',
      website_url: 'https://quantum-ai-trader.com',
      red_flags: [
        'Claims AI guarantees profits',
        'Celebrity endorsements (fake)',
        'Minimum deposit required',
        'Dashboard shows unrealistic gains',
        'Withdrawal requires "verification fee"',
      ],
      victims_count: 2345,
      estimated_loss_usd: 4500000,
    },
    {
      title: 'Deepfake Crypto Scam: Fake CEO Announcement',
      description: 'Deepfake video of crypto exchange CEO announcing partnership or giveaway. Links lead to phishing sites or scam investment platforms.',
      scam_type: 'impersonation',
      severity: 'high',
      status: 'verified',
      red_flags: [
        'Video of executive making unusual claims',
        'Slight audio/video artifacts (deepfake signs)',
        'Not posted on official channels',
        'Links to suspicious websites',
        'Creates urgency to invest now',
      ],
      victims_count: 678,
      estimated_loss_usd: 890000,
    },

    // === SOLANA ECOSYSTEM SCAMS ===
    {
      title: 'Phantom Wallet Phishing: Fake Airdrop',
      description: 'Airdrop tokens appear in Solana wallet with website link. Visiting the site and approving transaction drains the wallet.',
      scam_type: 'phishing',
      severity: 'high',
      status: 'verified',
      website_url: 'https://phantom-sol-airdrop.com',
      blockchain: 'Solana',
      red_flags: [
        'Unsolicited tokens with website in name',
        'Site requests wallet signature',
        'Transaction grants full access',
        'Phantom never sends airdrops this way',
        'Token has no real trading volume',
      ],
      victims_count: 234,
      estimated_loss_usd: 450000,
    },
    {
      title: 'Solana Memecoin Rug: Pump.fun Exit Scam',
      description: 'Memecoin launched on Pump.fun with heavy social media promotion. Developers sold holdings at peak, crashing the price 99%.',
      scam_type: 'rug_pull',
      severity: 'medium',
      status: 'verified',
      token_name: 'SolDogMoon',
      token_symbol: 'SLDM',
      blockchain: 'Solana',
      red_flags: [
        'Launched on memecoin platform',
        'No utility or roadmap',
        'Coordinated Twitter/Telegram shilling',
        'Dev wallets held large percentage',
        'Massive sell-off within hours of launch',
      ],
      victims_count: 1567,
      estimated_loss_usd: 234000,
    },

    // === RECOVERY SCAMS (Scamming scam victims) ===
    {
      title: 'Recovery Scam: Fake Crypto Recovery Service',
      description: 'After losing funds to a scam, victims are contacted by "recovery agents" promising to retrieve their crypto for an upfront fee. No recovery ever occurs.',
      scam_type: 'other',
      severity: 'high',
      status: 'verified',
      website_url: 'https://crypto-recovery-experts.com',
      red_flags: [
        'Contacts victims of known scams',
        'Requires upfront payment',
        'Claims to have blockchain access',
        'No legitimate recovery service works this way',
        'Often the same scammers who stole original funds',
      ],
      victims_count: 234,
      estimated_loss_usd: 120000,
    },
  ];
}

/**
 * Seed database with comprehensive sample data
 */
export async function seedComprehensiveData() {
  const sampleData = getComprehensiveSampleData();

  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const report of sampleData) {
    try {
      // Check if similar report exists
      const { data: existing } = await supabase
        .from('scam_reports')
        .select('id')
        .eq('title', report.title)
        .single();

      if (existing) {
        results.skipped++;
        continue;
      }

      const { error } = await supabase
        .from('scam_reports')
        .insert({
          ...report,
          source: 'admin_added',
          upvotes: Math.floor(Math.random() * 50) + 10, // Seed with some votes
          downvotes: Math.floor(Math.random() * 5),
          trust_score: 70 + Math.floor(Math.random() * 25),
        });

      if (error) {
        results.errors.push(`Failed to import "${report.title}": ${error.message}`);
      } else {
        results.imported++;
      }
    } catch (err) {
      results.errors.push(`Error: ${err}`);
    }
  }

  return results;
}
