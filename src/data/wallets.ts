import type { Wallet } from '../types';

/**
 * Wallet data for comparison engine
 */
export const wallets: Wallet[] = [
  // Hardware Wallets
  {
    id: 'ledger-nano-x',
    name: 'Ledger Nano X',
    logo: '/images/wallets/ledger.svg',
    description: 'The Ledger Nano X is a Bluetooth-enabled hardware wallet that securely stores your private keys offline, supporting over 5,500 cryptocurrencies.',
    url: 'https://www.ledger.com',
    affiliate_url: 'https://shop.ledger.com/?r=AFFILIATE_ID',
    type: 'hardware',
    price: 149,
    supported_cryptocurrencies: 5500,
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Polygon', 'Avalanche', 'Cosmos', 'Polkadot'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: false,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: true,
      passphrase_support: true,
      secure_element: true,
      open_source: false,
    },
    features: {
      built_in_exchange: true,
      staking: true,
      nft_support: true,
      defi_access: true,
      browser_extension: false,
      mobile_app: true,
      desktop_app: true,
      hardware_wallet_support: true,
    },
    pros: [
      'Bluetooth connectivity for mobile use',
      'Certified secure element chip',
      'Supports 5,500+ cryptocurrencies',
      'Ledger Live app for easy management',
      'Staking directly from device',
    ],
    cons: [
      'Higher price point',
      'Bluetooth can be security concern for some',
      'Closed-source firmware',
      'Ledger data breach in 2020 exposed customer info',
    ],
    user_rating: 4.5,
    review_count: 12340,
    ease_of_use: 8,
  },
  {
    id: 'ledger-nano-s-plus',
    name: 'Ledger Nano S Plus',
    logo: '/images/wallets/ledger.svg',
    description: 'The Ledger Nano S Plus is an affordable hardware wallet with a larger screen and more memory than its predecessor.',
    url: 'https://www.ledger.com',
    affiliate_url: 'https://shop.ledger.com/?r=AFFILIATE_ID',
    type: 'hardware',
    price: 79,
    supported_cryptocurrencies: 5500,
    supported_chains: ['Bitcoin', 'Ethereum', 'Solana', 'Polygon', 'Avalanche', 'Cosmos', 'Polkadot'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: false,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: true,
      passphrase_support: true,
      secure_element: true,
      open_source: false,
    },
    features: {
      built_in_exchange: true,
      staking: true,
      nft_support: true,
      defi_access: true,
      browser_extension: false,
      mobile_app: false,
      desktop_app: true,
      hardware_wallet_support: true,
    },
    pros: [
      'More affordable than Nano X',
      'Larger screen than original Nano S',
      'Same security as Nano X',
      'Can store more apps simultaneously',
      'USB-C connectivity',
    ],
    cons: [
      'No Bluetooth connectivity',
      'No mobile app support',
      'Closed-source firmware',
      'Must be connected to computer',
    ],
    user_rating: 4.4,
    review_count: 8920,
    ease_of_use: 7,
  },
  {
    id: 'trezor-model-t',
    name: 'Trezor Model T',
    logo: '/images/wallets/trezor.svg',
    description: 'The Trezor Model T is a premium hardware wallet with a color touchscreen, open-source firmware, and support for over 1,800 cryptocurrencies.',
    url: 'https://trezor.io',
    affiliate_url: 'https://trezor.io/?offer_id=AFFILIATE_ID',
    type: 'hardware',
    price: 219,
    supported_cryptocurrencies: 1800,
    supported_chains: ['Bitcoin', 'Ethereum', 'Cardano', 'Solana', 'Polygon', 'Ripple'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: false,
      multi_sig: true,
      seed_phrase_backup: true,
      pin_protection: true,
      passphrase_support: true,
      secure_element: false,
      open_source: true,
    },
    features: {
      built_in_exchange: true,
      staking: false,
      nft_support: false,
      defi_access: true,
      browser_extension: false,
      mobile_app: true,
      desktop_app: true,
      hardware_wallet_support: true,
    },
    pros: [
      'Fully open-source firmware',
      'Color touchscreen for PIN entry',
      'Shamir backup support',
      'MicroSD card slot for backup',
      'Strong security track record',
    ],
    cons: [
      'Higher price point',
      'No secure element chip',
      'Fewer supported coins than Ledger',
      'Limited staking support',
    ],
    user_rating: 4.6,
    review_count: 6540,
    ease_of_use: 8,
  },
  {
    id: 'trezor-one',
    name: 'Trezor One',
    logo: '/images/wallets/trezor.svg',
    description: 'The original Trezor hardware wallet, offering proven security at an affordable price point.',
    url: 'https://trezor.io',
    affiliate_url: 'https://trezor.io/?offer_id=AFFILIATE_ID',
    type: 'hardware',
    price: 69,
    supported_cryptocurrencies: 1200,
    supported_chains: ['Bitcoin', 'Ethereum', 'Litecoin', 'Bitcoin Cash'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: false,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: true,
      passphrase_support: true,
      secure_element: false,
      open_source: true,
    },
    features: {
      built_in_exchange: true,
      staking: false,
      nft_support: false,
      defi_access: false,
      browser_extension: false,
      mobile_app: true,
      desktop_app: true,
      hardware_wallet_support: true,
    },
    pros: [
      'Affordable entry into hardware wallets',
      'Proven security over many years',
      'Open-source firmware',
      'Simple and reliable',
      'Good for Bitcoin-focused users',
    ],
    cons: [
      'Limited cryptocurrency support',
      'Small monochrome screen',
      'No advanced features',
      'No touchscreen',
    ],
    user_rating: 4.3,
    review_count: 11230,
    ease_of_use: 7,
  },

  // Software Wallets
  {
    id: 'metamask',
    name: 'MetaMask',
    logo: '/images/wallets/metamask.svg',
    description: 'MetaMask is the most popular Ethereum wallet, available as a browser extension and mobile app for interacting with DeFi and NFTs.',
    url: 'https://metamask.io',
    type: 'software',
    price: 0,
    supported_cryptocurrencies: 500000,
    supported_chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche', 'BSC', 'Base'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: true,
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
    pros: [
      'Free to use',
      'Seamless DeFi and dApp integration',
      'Supports all EVM-compatible chains',
      'Hardware wallet integration',
      'Large user community and support',
    ],
    cons: [
      'Only supports Ethereum-compatible chains',
      'No Bitcoin support',
      'Phishing attacks target MetaMask users',
      'Browser extension can be risky',
    ],
    user_rating: 4.2,
    review_count: 45600,
    ease_of_use: 8,
  },
  {
    id: 'phantom',
    name: 'Phantom',
    logo: '/images/wallets/phantom.svg',
    description: 'Phantom is a popular multi-chain wallet supporting Solana, Ethereum, and Bitcoin with a clean interface.',
    url: 'https://phantom.app',
    type: 'software',
    price: 0,
    supported_cryptocurrencies: 10000,
    supported_chains: ['Solana', 'Ethereum', 'Bitcoin', 'Polygon', 'Base'],
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
    pros: [
      'Beautiful, intuitive interface',
      'Multi-chain support including Bitcoin',
      'Built-in NFT gallery',
      'Solana staking available',
      'Fast and lightweight',
    ],
    cons: [
      'Limited to supported chains',
      'Closed-source',
      'Relatively new compared to alternatives',
      'Customer support can be slow',
    ],
    user_rating: 4.5,
    review_count: 18900,
    ease_of_use: 9,
  },
  {
    id: 'trust-wallet',
    name: 'Trust Wallet',
    logo: '/images/wallets/trust-wallet.svg',
    description: 'Trust Wallet is a mobile-first multi-chain wallet owned by Binance, supporting millions of assets across 100+ blockchains.',
    url: 'https://trustwallet.com',
    type: 'mobile',
    price: 0,
    supported_cryptocurrencies: 10000000,
    supported_chains: ['Bitcoin', 'Ethereum', 'BSC', 'Solana', 'Polygon', 'Cosmos', 'Avalanche'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: true,
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
      hardware_wallet_support: false,
    },
    pros: [
      'Supports 100+ blockchains',
      'Built-in dApp browser',
      'Staking for 23+ cryptocurrencies',
      'Backed by Binance',
      'Open-source code',
    ],
    cons: [
      'Mobile-focused design',
      'No hardware wallet integration',
      'Associated with Binance',
      'In-app browser can be risky',
    ],
    user_rating: 4.3,
    review_count: 67800,
    ease_of_use: 9,
  },
  {
    id: 'exodus',
    name: 'Exodus',
    logo: '/images/wallets/exodus.svg',
    description: 'Exodus is a beautifully designed desktop and mobile wallet with built-in exchange and portfolio tracking.',
    url: 'https://www.exodus.com',
    type: 'software',
    price: 0,
    supported_cryptocurrencies: 350,
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
    pros: [
      'Beautiful, intuitive interface',
      'Desktop and mobile apps',
      'Built-in exchange',
      'Trezor hardware wallet integration',
      '24/7 human support',
    ],
    cons: [
      'Closed-source',
      'Higher exchange fees',
      'No dApp browser',
      'Limited DeFi access',
    ],
    user_rating: 4.4,
    review_count: 23400,
    ease_of_use: 10,
  },
  {
    id: 'coinbase-wallet',
    name: 'Coinbase Wallet',
    logo: '/images/wallets/coinbase-wallet.svg',
    description: 'Coinbase Wallet is a self-custody wallet from Coinbase that lets you explore DeFi and NFTs without needing a Coinbase account.',
    url: 'https://www.coinbase.com/wallet',
    type: 'software',
    price: 0,
    supported_cryptocurrencies: 100000,
    supported_chains: ['Ethereum', 'Polygon', 'Solana', 'Avalanche', 'Arbitrum', 'Optimism', 'Base'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: false,
      seed_phrase_backup: true,
      pin_protection: true,
      passphrase_support: false,
      secure_element: false,
      open_source: true,
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
    pros: [
      'Easy Coinbase exchange integration',
      'Supports multiple chains',
      'Cloud backup option',
      'NFT gallery built-in',
      'Backed by trusted company',
    ],
    cons: [
      'Cloud backup security concerns',
      'Limited Bitcoin support',
      'No desktop app',
      'Slower than some competitors',
    ],
    user_rating: 4.1,
    review_count: 34500,
    ease_of_use: 9,
  },
  {
    id: 'blue-wallet',
    name: 'BlueWallet',
    logo: '/images/wallets/blue-wallet.svg',
    description: 'BlueWallet is a Bitcoin-focused mobile wallet with Lightning Network support and advanced features.',
    url: 'https://bluewallet.io',
    type: 'mobile',
    price: 0,
    supported_cryptocurrencies: 1,
    supported_chains: ['Bitcoin', 'Lightning Network'],
    security_features: {
      two_factor_auth: false,
      biometric_auth: true,
      multi_sig: true,
      seed_phrase_backup: true,
      pin_protection: true,
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
    pros: [
      'Bitcoin-only focus',
      'Lightning Network support',
      'Multi-sig vault option',
      'Fully open-source',
      'Watch-only wallets',
    ],
    cons: [
      'Bitcoin only - no altcoins',
      'Lightning can be complex',
      'Limited features for beginners',
      'No built-in exchange',
    ],
    user_rating: 4.6,
    review_count: 8900,
    ease_of_use: 6,
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

/**
 * Get wallets sorted by criteria
 */
export function getWalletsSortedBy(
  criteria: 'price' | 'user_rating' | 'ease_of_use' | 'supported_cryptocurrencies',
  order: 'asc' | 'desc' = 'desc'
): Wallet[] {
  return [...wallets].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (criteria) {
      case 'price':
        aValue = a.price || 0;
        bValue = b.price || 0;
        break;
      case 'user_rating':
        aValue = a.user_rating;
        bValue = b.user_rating;
        break;
      case 'ease_of_use':
        aValue = a.ease_of_use;
        bValue = b.ease_of_use;
        break;
      case 'supported_cryptocurrencies':
        aValue = a.supported_cryptocurrencies;
        bValue = b.supported_cryptocurrencies;
        break;
    }

    return order === 'asc' ? aValue - bValue : bValue - aValue;
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

/**
 * Filter wallets by security features
 */
export function filterWalletsBySecurity(
  securityFeatures: Partial<Wallet['security_features']>
): Wallet[] {
  return wallets.filter(wallet => {
    for (const [key, value] of Object.entries(securityFeatures)) {
      if (wallet.security_features[key as keyof typeof wallet.security_features] !== value) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get best wallet for specific use case
 */
export function getBestWalletFor(
  useCase: 'beginner' | 'security' | 'defi' | 'bitcoin' | 'mobile' | 'budget'
): Wallet | null {
  switch (useCase) {
    case 'beginner':
      return wallets.find(w => w.id === 'exodus') || null;
    case 'security':
      return wallets.find(w => w.id === 'trezor-model-t') || null;
    case 'defi':
      return wallets.find(w => w.id === 'metamask') || null;
    case 'bitcoin':
      return wallets.find(w => w.id === 'blue-wallet') || null;
    case 'mobile':
      return wallets.find(w => w.id === 'trust-wallet') || null;
    case 'budget':
      return wallets.find(w => w.id === 'trezor-one') || null;
    default:
      return null;
  }
}

/**
 * Compare two wallets
 */
export function compareWallets(wallet1Id: string, wallet2Id: string): {
  wallet1: Wallet;
  wallet2: Wallet;
  differences: {
    category: string;
    wallet1Value: string | number | boolean;
    wallet2Value: string | number | boolean;
  }[];
} | null {
  const wallet1 = getWalletById(wallet1Id);
  const wallet2 = getWalletById(wallet2Id);

  if (!wallet1 || !wallet2) {
    return null;
  }

  const differences: {
    category: string;
    wallet1Value: string | number | boolean;
    wallet2Value: string | number | boolean;
  }[] = [];

  // Compare basic properties
  if (wallet1.type !== wallet2.type) {
    differences.push({ category: 'Type', wallet1Value: wallet1.type, wallet2Value: wallet2.type });
  }
  if ((wallet1.price || 0) !== (wallet2.price || 0)) {
    differences.push({ category: 'Price', wallet1Value: wallet1.price || 0, wallet2Value: wallet2.price || 0 });
  }
  if (wallet1.supported_cryptocurrencies !== wallet2.supported_cryptocurrencies) {
    differences.push({
      category: 'Supported Coins',
      wallet1Value: wallet1.supported_cryptocurrencies,
      wallet2Value: wallet2.supported_cryptocurrencies,
    });
  }
  if (wallet1.ease_of_use !== wallet2.ease_of_use) {
    differences.push({
      category: 'Ease of Use',
      wallet1Value: wallet1.ease_of_use,
      wallet2Value: wallet2.ease_of_use,
    });
  }

  // Compare security features
  for (const [key, value] of Object.entries(wallet1.security_features)) {
    const wallet2Value = wallet2.security_features[key as keyof typeof wallet2.security_features];
    if (value !== wallet2Value) {
      differences.push({
        category: `Security: ${key.replace(/_/g, ' ')}`,
        wallet1Value: value,
        wallet2Value: wallet2Value,
      });
    }
  }

  // Compare features
  for (const [key, value] of Object.entries(wallet1.features)) {
    const wallet2Value = wallet2.features[key as keyof typeof wallet2.features];
    if (value !== wallet2Value) {
      differences.push({
        category: `Feature: ${key.replace(/_/g, ' ')}`,
        wallet1Value: value,
        wallet2Value: wallet2Value,
      });
    }
  }

  return { wallet1, wallet2, differences };
}
