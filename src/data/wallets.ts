import type { Wallet, WalletIncident, FactSource } from '../types';

/**
 * Wallet data for /compare and /hardware-wallet.
 *
 * Every entry carries `last_verified` and `sources`. Hardware prices are
 * USD list prices; manufacturers discount older models often, so the pages
 * say "list price" and link to the official store.
 *
 * Discontinued models (Trezor Model T, Trezor Model One) stay listed with
 * `status: 'discontinued'` so existing links keep working and readers who
 * own one get accurate support information.
 *
 * Affiliate links are NOT stored here: `affiliate_partner_id` maps to
 * services/affiliate.ts, which falls back to the plain official URL.
 */

/** Date the whole data set was last reviewed. */
export const WALLETS_LAST_VERIFIED = '2026-09-23';

const LEDGER_INCIDENTS: WalletIncident[] = [
  {
    date: '2020-07',
    summary:
      "Ledger's e-commerce and marketing database was breached; names, postal addresses and phone numbers of about 272,000 customers (and about 1M email addresses) leaked, fuelling years of phishing. Devices and funds were not compromised.",
  },
  {
    date: '2023-05',
    summary:
      'Ledger announced Ledger Recover, an opt-in paid service that backs up encrypted shares of your recovery phrase with third parties. It showed that firmware can export key material if you consent, which many users criticised.',
  },
  {
    date: '2023-12',
    summary:
      "Ledger's Connect Kit JavaScript library (used by dApps, not the devices) was hijacked in a supply-chain attack for a few hours; users who signed malicious transactions on affected sites lost funds.",
  },
];

const TREZOR_INCIDENTS: WalletIncident[] = [
  {
    date: '2024-01',
    summary:
      'A third-party support-ticketing system used by Trezor was accessed without authorisation, exposing contact details of about 66,000 people who had contacted support. Devices and funds were not affected.',
  },
];

const LEDGER_SOURCES: FactSource[] = [
  { label: 'Ledger: introducing Nano Gen5 and Ledger Wallet', url: 'https://www.ledger.com/blog-introducing-ledger-nano-gen5-ledger-wallet' },
  { label: 'Ledger hardware wallet comparison (official shop)', url: 'https://shop.ledger.com/pages/hardware-wallets-comparison' },
];

const TREZOR_SOURCES: FactSource[] = [
  { label: 'Trezor: support for older models', url: 'https://trezor.io/support/logistics/orders-payments/support-for-older-models' },
  { label: 'Trezor: staking in Trezor Suite', url: 'https://trezor.io/guides/sending-receiving-staking-funds/staking-assets-in-trezor-suite' },
];

const LEDGER_SECURITY = {
  two_factor_auth: false,
  biometric_auth: false,
  multi_sig: true,
  seed_phrase_backup: true,
  pin_protection: true,
  passphrase_support: true,
  secure_element: true,
  open_source: false,
};

const TREZOR_SECURITY = {
  two_factor_auth: false,
  biometric_auth: false,
  multi_sig: true,
  seed_phrase_backup: true,
  pin_protection: true,
  passphrase_support: true,
  secure_element: true,
  open_source: true,
};

const HW_FEATURES = {
  built_in_exchange: true,
  staking: true,
  nft_support: true,
  defi_access: true,
  browser_extension: false,
  mobile_app: true,
  desktop_app: true,
  hardware_wallet_support: true,
};

export const wallets: Wallet[] = [
  // ─── Hardware wallets: Ledger ──────────────────────────────────────────
  {
    id: 'ledger-nano-gen5',
    name: 'Ledger Nano Gen5',
    brand: 'Ledger',
    description:
      'Ledger Nano Gen5 (October 2025) is Ledger\'s newest Nano: a touchscreen, Bluetooth and NFC, and a certified secure element, managed with the Ledger Wallet app.',
    url: 'https://www.ledger.com',
    affiliate_partner_id: 'ledger',
    type: 'hardware',
    status: 'current',
    price: 179,
    assets_label: "15,000+ assets (Ledger's claim)",
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Polygon', 'Avalanche', 'Cosmos', 'Polkadot', 'Cardano'],
    security_features: LEDGER_SECURITY,
    features: HW_FEATURES,
    hardware: {
      screen: 'Touchscreen',
      connectivity: ['USB-C', 'Bluetooth', 'NFC'],
      secure_element: 'Yes (certified secure element)',
      open_source_firmware: false,
      bitcoin_only_edition: false,
      backup_options: '24-word recovery phrase; Ledger Recovery Key card included; optional paid Ledger Recover',
      released: '2025-10',
    },
    best_for: 'Phone-first users who want a touchscreen and Bluetooth at a mid-range price.',
    pros: [
      'Touchscreen with clear signing at a lower price than Flex or Stax',
      'Bluetooth and NFC for use with the Ledger Wallet mobile app',
      'Certified secure element',
    ],
    cons: [
      'Closed-source secure-element firmware',
      'Bluetooth is an extra (encrypted) attack surface some users prefer to avoid',
      'Ledger Recover showed firmware can export key shares with user consent',
    ],
    incidents: LEDGER_INCIDENTS,
    ease_of_use: 8,
    last_verified: '2026-09-23',
    sources: [
      ...LEDGER_SOURCES,
      { label: 'CoinDesk: Ledger unveils $179 Nano Gen5', url: 'https://www.coindesk.com/tech/2025/10/23/ledger-unveils-usd179-nano-gen5-built-for-identity-in-an-ai-driven-world' },
    ],
  },
  {
    id: 'ledger-nano-x',
    name: 'Ledger Nano X',
    brand: 'Ledger',
    description:
      'The Ledger Nano X is a button-operated Bluetooth hardware wallet with a certified secure element. It still works well but is now largely superseded by the Nano Gen5.',
    url: 'https://www.ledger.com',
    affiliate_partner_id: 'ledger',
    type: 'hardware',
    status: 'current',
    price: 149,
    price_note: 'Launch list price. Ledger often discounts it (seen around $99 in 2026); check the official store.',
    assets_label: "15,000+ assets (Ledger's claim)",
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Polygon', 'Avalanche', 'Cosmos', 'Polkadot', 'Cardano'],
    security_features: LEDGER_SECURITY,
    features: HW_FEATURES,
    hardware: {
      screen: 'Small monochrome screen, two buttons',
      connectivity: ['USB-C', 'Bluetooth'],
      secure_element: 'Yes (certified secure element)',
      open_source_firmware: false,
      bitcoin_only_edition: false,
      backup_options: '24-word recovery phrase; optional paid Ledger Recover',
      released: '2019',
    },
    best_for: 'Buyers who find it discounted and want Bluetooth without paying for a touchscreen.',
    pros: [
      'Bluetooth for mobile use with the Ledger Wallet app',
      'Certified secure element',
      'Wide coin support and staking through Ledger Wallet',
    ],
    cons: [
      'Small screen and buttons make verifying long addresses tedious',
      'Closed-source secure-element firmware',
      'Newer Nano Gen5 adds a touchscreen and NFC for a similar price',
    ],
    incidents: LEDGER_INCIDENTS,
    ease_of_use: 7,
    last_verified: '2026-09-23',
    sources: LEDGER_SOURCES,
  },
  {
    id: 'ledger-nano-s-plus',
    name: 'Ledger Nano S Plus',
    brand: 'Ledger',
    description:
      'The Ledger Nano S Plus is Ledger\'s entry-level USB-C device with a certified secure element. It works with the Ledger Wallet app on desktop and on Android over USB.',
    url: 'https://www.ledger.com',
    affiliate_partner_id: 'ledger',
    type: 'hardware',
    status: 'current',
    price: 79,
    price_note: 'Launch list price. Often discounted (seen around $59 in 2026); check the official store.',
    assets_label: "15,000+ assets (Ledger's claim)",
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Polygon', 'Avalanche', 'Cosmos', 'Polkadot', 'Cardano'],
    security_features: LEDGER_SECURITY,
    features: HW_FEATURES,
    hardware: {
      screen: 'Small monochrome screen, two buttons',
      connectivity: ['USB-C'],
      secure_element: 'Yes (certified secure element)',
      open_source_firmware: false,
      bitcoin_only_edition: false,
      backup_options: '24-word recovery phrase; optional paid Ledger Recover',
      released: '2022',
    },
    best_for: 'A low-cost first hardware wallet with a secure element.',
    pros: [
      'Low price with a certified secure element',
      'Same app and coin support as pricier Ledgers',
      'Works with Android phones over USB (OTG)',
    ],
    cons: [
      'No Bluetooth, so no iPhone use',
      'Small screen and buttons',
      'Closed-source secure-element firmware',
    ],
    incidents: LEDGER_INCIDENTS,
    ease_of_use: 7,
    last_verified: '2026-09-23',
    sources: LEDGER_SOURCES,
  },
  {
    id: 'ledger-flex',
    name: 'Ledger Flex',
    brand: 'Ledger',
    description:
      'Ledger Flex is a mid-to-high-end hardware wallet with a large E Ink touchscreen, Bluetooth and NFC, and a certified secure element.',
    url: 'https://www.ledger.com',
    affiliate_partner_id: 'ledger',
    type: 'hardware',
    status: 'current',
    price: 249,
    assets_label: "15,000+ assets (Ledger's claim)",
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Polygon', 'Avalanche', 'Cosmos', 'Polkadot', 'Cardano'],
    security_features: LEDGER_SECURITY,
    features: HW_FEATURES,
    hardware: {
      screen: 'Large E Ink touchscreen',
      connectivity: ['USB-C', 'Bluetooth', 'NFC'],
      secure_element: 'Yes (certified secure element)',
      open_source_firmware: false,
      bitcoin_only_edition: false,
      backup_options: '24-word recovery phrase; Ledger Recovery Key card included; optional paid Ledger Recover',
      released: '2024-07',
    },
    best_for: 'Frequent DeFi or NFT signers who want a large screen to read transactions.',
    pros: [
      'Large touchscreen makes clear signing easy to read',
      'Bluetooth and NFC',
      'Certified secure element',
    ],
    cons: [
      'Costs about $70 more than Nano Gen5',
      'Closed-source secure-element firmware',
    ],
    incidents: LEDGER_INCIDENTS,
    ease_of_use: 9,
    last_verified: '2026-09-23',
    sources: [
      ...LEDGER_SOURCES,
      { label: 'TechCrunch: Ledger launches Ledger Flex', url: 'https://techcrunch.com/2024/07/26/ledger-launches-ledger-flex-a-mid-range-hardware-crypto-wallet' },
    ],
  },
  {
    id: 'ledger-stax',
    name: 'Ledger Stax',
    brand: 'Ledger',
    description:
      'Ledger Stax is Ledger\'s premium device: a curved E Ink touchscreen, Bluetooth, NFC and wireless charging, with the same secure element as other Ledgers.',
    url: 'https://www.ledger.com',
    affiliate_partner_id: 'ledger',
    type: 'hardware',
    status: 'current',
    price: 399,
    price_note: 'Launched at $279; list price has been about $399 for some time.',
    assets_label: "15,000+ assets (Ledger's claim)",
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Polygon', 'Avalanche', 'Cosmos', 'Polkadot', 'Cardano'],
    security_features: LEDGER_SECURITY,
    features: HW_FEATURES,
    hardware: {
      screen: 'Curved E Ink touchscreen',
      connectivity: ['USB-C', 'Bluetooth', 'NFC', 'Wireless charging'],
      secure_element: 'Yes (certified secure element)',
      open_source_firmware: false,
      bitcoin_only_edition: false,
      backup_options: '24-word recovery phrase; Ledger Recovery Key card included; optional paid Ledger Recover',
      released: '2024-05',
    },
    best_for: 'People who value design and a big screen and do not mind paying for it.',
    pros: [
      'Largest screen of any Ledger',
      'Bluetooth, NFC and wireless charging',
      'Certified secure element',
    ],
    cons: [
      'Most expensive device in this comparison',
      'Security is the same as the much cheaper Nano models',
      'Closed-source secure-element firmware',
    ],
    incidents: LEDGER_INCIDENTS,
    ease_of_use: 9,
    last_verified: '2026-09-23',
    sources: [
      ...LEDGER_SOURCES,
      { label: 'TechCrunch: Ledger starts shipping Stax', url: 'https://techcrunch.com/2024/05/27/ledger-starts-shipping-its-high-end-hardware-crypto-wallet' },
    ],
  },

  // ─── Hardware wallets: Trezor ──────────────────────────────────────────
  {
    id: 'trezor-safe-3',
    name: 'Trezor Safe 3',
    brand: 'Trezor',
    description:
      'Trezor Safe 3 is Trezor\'s entry model and the successor to the Model One: open-source firmware, a secure element for PIN protection, and USB-C.',
    url: 'https://trezor.io',
    affiliate_partner_id: 'trezor',
    type: 'hardware',
    status: 'current',
    price: 79,
    price_note: 'Launch list price; reported selling for $59 from mid-2026. Check the official store.',
    assets_label: "Thousands of assets (Trezor's claim)",
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Polygon', 'Litecoin'],
    security_features: TREZOR_SECURITY,
    features: HW_FEATURES,
    hardware: {
      screen: 'Small monochrome OLED, two buttons',
      connectivity: ['USB-C'],
      secure_element: 'Yes (EAL6+), used alongside open-source firmware',
      open_source_firmware: true,
      bitcoin_only_edition: true,
      backup_options: '12/20/24-word backup, including multi-share (Shamir, SLIP-39) backup',
      released: '2023',
    },
    best_for: 'The best-value open-source hardware wallet for most people.',
    pros: [
      'Low price with open-source firmware and a secure element',
      'Multi-share (Shamir) backup support',
      'Bitcoin-only firmware available',
      'ETH, SOL and ADA staking in Trezor Suite',
    ],
    cons: [
      'Small screen and buttons',
      'USB only: no Bluetooth, so no iPhone signing',
    ],
    incidents: TREZOR_INCIDENTS,
    ease_of_use: 7,
    last_verified: '2026-09-23',
    sources: TREZOR_SOURCES,
  },
  {
    id: 'trezor-safe-5',
    name: 'Trezor Safe 5',
    brand: 'Trezor',
    description:
      'Trezor Safe 5 adds a colour touchscreen with haptic feedback to the Safe 3\'s open-source firmware and secure element. It replaced the Model T.',
    url: 'https://trezor.io',
    affiliate_partner_id: 'trezor',
    type: 'hardware',
    status: 'current',
    price: 169,
    assets_label: "Thousands of assets (Trezor's claim)",
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Polygon', 'Litecoin'],
    security_features: TREZOR_SECURITY,
    features: HW_FEATURES,
    hardware: {
      screen: 'Colour touchscreen with haptic feedback',
      connectivity: ['USB-C'],
      secure_element: 'Yes (EAL6+), used alongside open-source firmware',
      open_source_firmware: true,
      bitcoin_only_edition: true,
      backup_options: '12/20/24-word backup, including multi-share (Shamir, SLIP-39) backup',
      released: '2024',
    },
    best_for: 'Open-source fans who want a touchscreen without paying Safe 7 prices.',
    pros: [
      'Colour touchscreen for easier address checks',
      'Open-source firmware plus secure element',
      'Multi-share (Shamir) backup',
      'ETH, SOL and ADA staking in Trezor Suite',
    ],
    cons: [
      'USB only: no Bluetooth',
      'Costs roughly twice the Safe 3 for the same core security',
    ],
    incidents: TREZOR_INCIDENTS,
    ease_of_use: 8,
    last_verified: '2026-09-23',
    sources: TREZOR_SOURCES,
  },
  {
    id: 'trezor-safe-7',
    name: 'Trezor Safe 7',
    brand: 'Trezor',
    description:
      'Trezor Safe 7 (October 2025) is Trezor\'s flagship: a larger touchscreen, Bluetooth for iOS and Android, and TROPIC01, an auditable ("transparent") secure element alongside a certified one.',
    url: 'https://trezor.io',
    affiliate_partner_id: 'trezor',
    type: 'hardware',
    status: 'current',
    price: 249,
    assets_label: "Thousands of assets (Trezor's claim)",
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Polygon', 'Litecoin'],
    security_features: TREZOR_SECURITY,
    features: HW_FEATURES,
    hardware: {
      screen: 'Larger colour touchscreen',
      connectivity: ['USB-C', 'Bluetooth', 'Wireless charging'],
      secure_element: 'Yes: TROPIC01 (auditable) plus a certified secure element',
      open_source_firmware: true,
      bitcoin_only_edition: true,
      backup_options: '12/20/24-word backup, including multi-share (Shamir, SLIP-39) backup',
      released: '2025-10',
    },
    best_for: 'Open-source buyers who want Bluetooth and iPhone support.',
    pros: [
      'First hardware wallet with an openly auditable secure element (TROPIC01)',
      'Bluetooth for iOS and Android',
      'Open-source firmware and multi-share backup',
    ],
    cons: [
      'Newest model, so the shortest track record',
      'Price is similar to Ledger Flex',
    ],
    incidents: TREZOR_INCIDENTS,
    ease_of_use: 9,
    last_verified: '2026-09-23',
    sources: [
      ...TREZOR_SOURCES,
      { label: 'Trezor Safe 7 launch (Chainwire)', url: 'https://tr.tradingview.com/news/chainwire:a19d30fa5094b:0-trezor-launches-trezor-safe-7-first-hardware-wallet-with-transparent-secure-element' },
    ],
  },
  {
    id: 'trezor-model-t',
    name: 'Trezor Model T',
    brand: 'Trezor',
    description:
      'The Trezor Model T was Trezor\'s touchscreen model from 2018. It was removed from Trezor\'s shop on 2026-01-08 but still receives security updates.',
    url: 'https://trezor.io',
    affiliate_partner_id: 'trezor',
    type: 'hardware',
    status: 'discontinued',
    status_note:
      'Discontinued: removed from Trezor\'s shop on 2026-01-08. Existing devices keep receiving security updates. Buying new? Look at the Trezor Safe 5 or Safe 7.',
    price: 219,
    price_note: 'Last list price before it was discontinued.',
    assets_label: "Thousands of assets (Trezor's claim)",
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Polygon', 'Litecoin'],
    security_features: { ...TREZOR_SECURITY, secure_element: false },
    features: HW_FEATURES,
    hardware: {
      screen: 'Colour touchscreen',
      connectivity: ['USB-C'],
      secure_element: 'No',
      open_source_firmware: true,
      bitcoin_only_edition: true,
      backup_options: '12/24-word backup, including multi-share (Shamir) backup',
      released: '2018',
    },
    best_for: 'Existing owners. New buyers should choose a Safe model instead.',
    pros: [
      'Open-source firmware and touchscreen',
      'Still supported with security updates',
      'ETH, SOL and ADA staking in Trezor Suite',
    ],
    cons: [
      'Discontinued; no longer sold by Trezor',
      'No secure element: researchers have extracted seeds with physical access (a strong passphrase mitigates this)',
    ],
    incidents: TREZOR_INCIDENTS,
    ease_of_use: 8,
    last_verified: '2026-09-23',
    sources: TREZOR_SOURCES,
  },
  {
    id: 'trezor-one',
    name: 'Trezor Model One',
    brand: 'Trezor',
    description:
      'The Trezor Model One (2014) was the first consumer hardware wallet. It is no longer sold, but Trezor says it will get maintenance until at least 2031 and critical fixes until at least 2036.',
    url: 'https://trezor.io/trezor-model-one',
    affiliate_partner_id: 'trezor',
    type: 'hardware',
    status: 'discontinued',
    status_note:
      'Discontinued: removed from Trezor\'s shop on 2026-01-08. Supported with maintenance until at least 2031 and critical security fixes until at least 2036. Its successor is the Trezor Safe 3.',
    price: 69,
    price_note: 'Last list price before it was discontinued.',
    assets_label: 'Fewer assets than newer Trezors',
    supported_chains: ['Bitcoin', 'Ethereum', 'Litecoin', 'Bitcoin Cash'],
    security_features: { ...TREZOR_SECURITY, secure_element: false },
    features: { ...HW_FEATURES, staking: false, nft_support: false, defi_access: false },
    hardware: {
      screen: 'Small monochrome OLED, two buttons',
      connectivity: ['Micro-USB'],
      secure_element: 'No',
      open_source_firmware: true,
      bitcoin_only_edition: true,
      backup_options: '12/24-word recovery phrase',
      released: '2014',
    },
    best_for: 'Existing owners. New buyers should choose the Trezor Safe 3.',
    pros: [
      'Open-source firmware with a long track record',
      'Long support window (critical fixes until at least 2036)',
    ],
    cons: [
      'Discontinued; no longer sold by Trezor',
      'No secure element: physical-extraction attacks are known (use a passphrase)',
      'Micro-USB, small screen, no staking in Trezor Suite',
    ],
    incidents: TREZOR_INCIDENTS,
    ease_of_use: 6,
    last_verified: '2026-09-23',
    sources: [
      ...TREZOR_SOURCES,
      { label: 'Trezor Model One product page', url: 'https://trezor.io/trezor-model-one' },
    ],
  },

  // ─── Software wallets ──────────────────────────────────────────────────
  {
    id: 'metamask',
    name: 'MetaMask',
    brand: 'MetaMask (Consensys)',
    description:
      'MetaMask is the most widely used Ethereum wallet, as a browser extension and mobile app. It added native Bitcoin in December 2025 and Solana in 2025.',
    url: 'https://metamask.io',
    type: 'software',
    status: 'current',
    price: 0,
    assets_label: 'EVM tokens, plus Bitcoin and Solana',
    supported_chains: ['Ethereum', 'Bitcoin', 'Solana', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'BNB Chain', 'Avalanche'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: false,
      passphrase_support: false,
      secure_element: false,
      open_source: true,
    },
    features: {
      built_in_exchange: true,
      staking: true,
      nft_support: true,
      defi_access: true,
      browser_extension: true,
      mobile_app: true,
      desktop_app: false,
      hardware_wallet_support: true,
    },
    best_for: 'Using Ethereum and layer-2 DeFi apps, ideally paired with a hardware wallet.',
    pros: [
      'Works with nearly every EVM dApp',
      'Native Bitcoin (since Dec 2025) and Solana accounts',
      'Pairs with Ledger and Trezor for signing',
      'Public source code',
    ],
    cons: [
      'Bitcoin and Solana support is newer than its EVM support',
      'Constant phishing and fake-extension attacks target MetaMask users',
      'A hot wallet: keys live on an internet-connected device',
    ],
    ease_of_use: 7,
    last_verified: '2026-09-23',
    sources: [{ label: 'MetaMask: Bitcoin on MetaMask', url: 'https://metamask.io/news/bitcoin-on-metamask-btc-wallet' }],
  },
  {
    id: 'phantom',
    name: 'Phantom',
    brand: 'Phantom',
    description:
      'Phantom launched in 2021 as a Solana wallet and now also supports Ethereum, Bitcoin, Base, Polygon, Sui and Monad.',
    url: 'https://phantom.com',
    type: 'software',
    status: 'current',
    price: 0,
    assets_label: 'Tokens on Solana, EVM chains, Bitcoin and Sui',
    supported_chains: ['Solana', 'Ethereum', 'Bitcoin', 'Base', 'Polygon', 'Sui', 'Monad'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: false,
      passphrase_support: false,
      secure_element: false,
      open_source: false,
    },
    features: {
      built_in_exchange: true,
      staking: true,
      nft_support: true,
      defi_access: true,
      browser_extension: true,
      mobile_app: true,
      desktop_app: false,
      hardware_wallet_support: true,
    },
    best_for: 'Solana users who also hold some ETH or BTC.',
    pros: [
      'Clean, fast interface',
      'Multi-chain, including Bitcoin',
      'Built-in NFT gallery and SOL staking',
      'Ledger support for signing',
    ],
    cons: [
      'Closed-source',
      'A hot wallet: keys live on an internet-connected device',
      'Support is mostly self-serve',
    ],
    ease_of_use: 9,
    last_verified: '2026-09-23',
    sources: [{ label: 'Phantom', url: 'https://phantom.com' }],
  },
  {
    id: 'trust-wallet',
    name: 'Trust Wallet',
    brand: 'Trust Wallet',
    description:
      'Trust Wallet is a mobile-first multi-chain wallet (with a browser extension) that supports 100+ blockchains. It is associated with Binance.',
    url: 'https://trustwallet.com',
    type: 'mobile',
    status: 'current',
    price: 0,
    assets_label: '100+ blockchains',
    supported_chains: ['Bitcoin', 'Ethereum', 'BNB Chain', 'Solana', 'Polygon', 'Cosmos', 'Avalanche'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: true,
      passphrase_support: false,
      secure_element: false,
      open_source: false,
    },
    features: {
      built_in_exchange: true,
      staking: true,
      nft_support: true,
      defi_access: true,
      browser_extension: true,
      mobile_app: true,
      desktop_app: false,
      hardware_wallet_support: true,
    },
    best_for: 'Mobile users who hold coins on many different chains.',
    pros: [
      'Supports 100+ blockchains',
      'Built-in staking and swaps',
      'Browser extension can sign with a Ledger',
    ],
    cons: [
      'December 2025: browser extension v2.68 was compromised and about $7M was stolen; affected users were reimbursed',
      'Only parts of the code (such as the wallet core library) are open source',
      'Associated with Binance',
    ],
    incidents: [
      {
        date: '2025-12',
        summary:
          'A malicious Trust Wallet Chrome extension release (v2.68) drained funds from users who imported recovery phrases; about $7–8.5M was stolen and Trust Wallet reimbursed affected users.',
        url: 'https://trustwallet.com/blog/company/trust-wallet-browser-extension-v268-incident-community-update',
      },
    ],
    ease_of_use: 9,
    last_verified: '2026-09-23',
    sources: [
      { label: 'Trust Wallet: extension v2.68 incident update', url: 'https://trustwallet.com/blog/company/trust-wallet-browser-extension-v268-incident-community-update' },
    ],
  },
  {
    id: 'exodus',
    name: 'Exodus',
    brand: 'Exodus',
    description:
      'Exodus is a desktop and mobile wallet with a built-in swap and portfolio view. The company is listed on NYSE American (EXOD).',
    url: 'https://www.exodus.com',
    type: 'software',
    status: 'current',
    price: 0,
    assets_label: 'Hundreds of assets',
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Algorand', 'Tezos'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: true,
      passphrase_support: false,
      secure_element: false,
      open_source: false,
    },
    features: {
      built_in_exchange: true,
      staking: true,
      nft_support: true,
      defi_access: false,
      browser_extension: false,
      mobile_app: true,
      desktop_app: true,
      hardware_wallet_support: true,
    },
    best_for: 'Beginners who want a polished desktop wallet with a built-in swap.',
    pros: [
      'Very easy desktop and mobile apps',
      'Built-in swap and portfolio tracking',
      'Trezor and Ledger integration',
      'Human support',
    ],
    cons: [
      'Closed-source',
      'Swap prices include a spread that can be high',
      'Exodus is winding down its Web3 browser extension (support ends 2026-10-01) and has ended in-app WalletConnect/dApp browsing',
    ],
    ease_of_use: 10,
    last_verified: '2026-09-23',
    sources: [
      { label: 'Exodus Web3 Wallet', url: 'https://www.exodus.com/web3-wallet' },
      { label: 'Exodus: Web3 browser and WalletConnect support ended', url: 'https://support.exodus.com/support/en/articles/8598986-web3-browser-in-exodus-mobile' },
    ],
  },
  {
    id: 'coinbase-wallet',
    name: 'Coinbase Wallet',
    brand: 'Coinbase',
    description:
      'Coinbase Wallet is Coinbase\'s self-custody wallet. It was renamed the "Base app" in July 2025 and renamed back to Coinbase Wallet on 2026-09-10. You do not need a Coinbase account to use it.',
    url: 'https://www.coinbase.com/wallet',
    type: 'software',
    status: 'current',
    price: 0,
    assets_label: 'Tokens on Bitcoin, Solana and 10+ EVM networks',
    supported_chains: ['Ethereum', 'Base', 'Bitcoin', 'Solana', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: true,
      passphrase_support: false,
      secure_element: false,
      open_source: false,
    },
    features: {
      built_in_exchange: true,
      staking: false,
      nft_support: true,
      defi_access: true,
      browser_extension: true,
      mobile_app: true,
      desktop_app: false,
      hardware_wallet_support: true,
    },
    best_for: 'Coinbase customers taking their first step into self-custody on Base.',
    pros: [
      'Easy transfers from a Coinbase account',
      'Bitcoin, Solana and many EVM networks',
      'Optional encrypted cloud backup of the recovery phrase',
    ],
    cons: [
      'Cloud backup is convenient but only as safe as your cloud account and password',
      'Two renames in about a year (Base app, then back) can confuse support searches',
      'A hot wallet: keys live on an internet-connected device',
    ],
    ease_of_use: 9,
    last_verified: '2026-09-23',
    sources: [
      { label: 'The Block: Base app renamed back to Coinbase Wallet (2026-09-10)', url: 'https://www.theblock.co/news/defi/2026-09-10-coinbase-rebrands-base-app-back-to-coinbase-wallet-after-just-over-a-year-as-social-experiment-falls-short-414115' },
    ],
  },
  {
    id: 'blue-wallet',
    name: 'BlueWallet',
    brand: 'BlueWallet',
    description:
      'BlueWallet is an open-source, Bitcoin-only mobile wallet with watch-only and multisig vault features. Its hosted Lightning service ended in 2023.',
    url: 'https://bluewallet.io',
    type: 'mobile',
    status: 'current',
    price: 0,
    assets_label: 'Bitcoin only',
    supported_chains: ['Bitcoin'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: true,
      seed_phrase_backup: true,
      pin_protection: false,
      passphrase_support: true,
      secure_element: false,
      open_source: true,
    },
    features: {
      built_in_exchange: false,
      staking: false,
      nft_support: false,
      defi_access: false,
      browser_extension: false,
      mobile_app: true,
      desktop_app: true,
      hardware_wallet_support: true,
    },
    best_for: 'Bitcoin-only holders who want multisig or watch-only wallets on their phone.',
    pros: [
      'Bitcoin-only and fully open source',
      'Multisig vaults with hardware-wallet co-signers',
      'Watch-only wallets for cold-storage balances',
    ],
    cons: [
      'Its custodial Lightning service (LndHub) was shut down in April 2023; Lightning now needs your own node',
      'Bitcoin only',
      'Advanced features can overwhelm beginners',
    ],
    ease_of_use: 6,
    last_verified: '2026-09-23',
    sources: [{ label: 'BlueWallet: sunsetting LndHub', url: 'https://bluewallet.io/sunsetting-lndhub/' }],
  },
];

/**
 * Get wallet by ID
 */
export function getWalletById(id: string): Wallet | undefined {
  return wallets.find(w => w.id === id);
}

/**
 * Get wallets filtered by type
 */
export function getWalletsByType(type: Wallet['type']): Wallet[] {
  return wallets.filter(w => w.type === type);
}

/** Current (still sold) hardware wallets, cheapest first. */
export function getCurrentHardwareWallets(): Wallet[] {
  return wallets
    .filter(w => w.type === 'hardware' && w.status === 'current')
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0) || a.name.localeCompare(b.name));
}

/**
 * Get wallets sorted by criteria
 */
export function getWalletsSortedBy(
  criteria: 'price' | 'ease_of_use',
  order: 'asc' | 'desc' = 'desc'
): Wallet[] {
  return [...wallets].sort((a, b) => {
    const aValue = criteria === 'price' ? a.price ?? 0 : a.ease_of_use;
    const bValue = criteria === 'price' ? b.price ?? 0 : b.ease_of_use;
    const diff = order === 'asc' ? aValue - bValue : bValue - aValue;
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}

/**
 * Filter wallets by features
 */
export function filterWalletsByFeatures(
  features: Partial<Wallet['features']>
): Wallet[] {
  return wallets.filter(wallet => {
    for (const [key, value] of Object.entries(features)) {
      if (wallet.features[key as keyof typeof wallet.features] !== value) {
        return false;
      }
    }
    return true;
  });
}

export type WalletUseCase =
  | 'hardware_budget'
  | 'hardware_open_source'
  | 'hardware_mobile'
  | 'beginner'
  | 'defi'
  | 'bitcoin';

/**
 * Editorial "best for" picks, each with the reason shown on the page.
 */
export function getBestWalletFor(
  useCase: WalletUseCase
): { wallet: Wallet; reason: string } | null {
  const pick = (id: string, reason: string) => {
    const wallet = getWalletById(id);
    return wallet ? { wallet, reason } : null;
  };
  switch (useCase) {
    case 'hardware_budget':
      return pick('trezor-safe-3', 'Open-source firmware and a secure element at the lowest list price of any current model here.');
    case 'hardware_open_source':
      return pick('trezor-safe-5', 'Touchscreen, open-source firmware, secure element and Shamir backup for well under $200.');
    case 'hardware_mobile':
      return pick('ledger-nano-gen5', 'Touchscreen, Bluetooth and NFC for iPhone and Android at $179.');
    case 'beginner':
      return pick('exodus', 'The easiest desktop + mobile software wallet we cover. Move larger amounts to a hardware wallet.');
    case 'defi':
      return pick('metamask', 'Works with almost every Ethereum and layer-2 app, and signs with a Ledger or Trezor.');
    case 'bitcoin':
      return pick('blue-wallet', 'Open-source, Bitcoin-only, with multisig vaults and watch-only wallets.');
    default:
      return null;
  }
}

/** One row of a head-to-head table. */
export interface ComparisonRow {
  label: string;
  values: [string, string];
  differs: boolean;
}

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');

function priceLabel(w: Wallet): string {
  if (!w.price) return 'Free';
  return `$${w.price}${w.status === 'discontinued' ? ' (last list price)' : ''}`;
}

/**
 * Head-to-head comparison of two wallets for the detail page table.
 */
export function compareWallets(wallet1Id: string, wallet2Id: string): {
  wallet1: Wallet;
  wallet2: Wallet;
  rows: ComparisonRow[];
} | null {
  const wallet1 = getWalletById(wallet1Id);
  const wallet2 = getWalletById(wallet2Id);
  if (!wallet1 || !wallet2) return null;

  const row = (label: string, get: (w: Wallet) => string): ComparisonRow => {
    const values: [string, string] = [get(wallet1), get(wallet2)];
    return { label, values, differs: values[0] !== values[1] };
  };

  const rows: ComparisonRow[] = [
    row('Type', w => w.type.charAt(0).toUpperCase() + w.type.slice(1)),
    row('Status', w => (w.status === 'current' ? 'Current' : 'Discontinued')),
    row('Price', priceLabel),
    row('Assets', w => w.assets_label),
    row('Open source', w => yesNo(w.security_features.open_source)),
    row('Secure element', w => w.hardware?.secure_element ?? 'No (software wallet)'),
    row('Connectivity', w => w.hardware?.connectivity.join(', ') ?? 'Phone / computer'),
    row('Screen', w => w.hardware?.screen ?? 'Your phone or computer'),
    row('Backup', w => w.hardware?.backup_options ?? (w.security_features.seed_phrase_backup ? 'Recovery phrase' : 'None')),
    row('Passphrase support', w => yesNo(w.security_features.passphrase_support)),
    row('Multisig', w => yesNo(w.security_features.multi_sig)),
    row('Staking', w => yesNo(w.features.staking)),
    row('DeFi / dApps', w => yesNo(w.features.defi_access)),
    row('Mobile app', w => yesNo(w.features.mobile_app)),
    row('Desktop app', w => yesNo(w.features.desktop_app)),
    row('Browser extension', w => yesNo(w.features.browser_extension)),
    row('Ease of use (editorial)', w => `${w.ease_of_use}/10`),
    row('Best for', w => w.best_for),
  ];

  return { wallet1, wallet2, rows };
}

/**
 * Default rival for a wallet's head-to-head table: for hardware, the closest
 * current model by price from another brand; otherwise the closest software
 * wallet by ease of use.
 */
export function getDefaultWalletRival(wallet: Wallet): Wallet | undefined {
  const pool = wallets.filter(w =>
    w.id !== wallet.id &&
    w.status === 'current' &&
    (wallet.type === 'hardware' ? w.type === 'hardware' && w.brand !== wallet.brand : w.type !== 'hardware')
  );
  const distance = (w: Wallet) =>
    wallet.type === 'hardware'
      ? Math.abs((w.price ?? 0) - (wallet.price ?? 0))
      : Math.abs(w.ease_of_use - wallet.ease_of_use);
  return [...pool].sort((a, b) => distance(a) - distance(b) || a.name.localeCompare(b.name))[0];
}
