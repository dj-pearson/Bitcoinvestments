import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  relatedTerms?: string[];
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Basics
  {
    term: 'Bitcoin (BTC)',
    definition: 'The first and most well-known cryptocurrency, created by the pseudonymous Satoshi Nakamoto in 2009. Bitcoin operates on a decentralized peer-to-peer network using blockchain technology.',
    category: 'Basics',
    relatedTerms: ['Blockchain', 'Cryptocurrency', 'Satoshi']
  },
  {
    term: 'Blockchain',
    definition: 'A distributed digital ledger that records all transactions across a network of computers. Each block contains transaction data and is cryptographically linked to the previous block, creating an immutable chain.',
    category: 'Basics',
    relatedTerms: ['Block', 'Decentralization', 'Node']
  },
  {
    term: 'Cryptocurrency',
    definition: 'A digital or virtual currency that uses cryptography for security and operates on a decentralized network, typically a blockchain.',
    category: 'Basics',
    relatedTerms: ['Bitcoin', 'Altcoin', 'Token']
  },
  {
    term: 'Altcoin',
    definition: 'Any cryptocurrency other than Bitcoin. Examples include Ethereum (ETH), Solana (SOL), and Cardano (ADA).',
    category: 'Basics',
    relatedTerms: ['Bitcoin', 'Token', 'Cryptocurrency']
  },
  {
    term: 'Wallet',
    definition: 'A digital tool that stores your private keys and allows you to send, receive, and manage your cryptocurrencies. Wallets can be hardware (physical devices), software (apps), or web-based.',
    category: 'Basics',
    relatedTerms: ['Private Key', 'Public Key', 'Cold Storage']
  },
  {
    term: 'Exchange',
    definition: 'A platform where you can buy, sell, and trade cryptocurrencies. Examples include Coinbase, Kraken, and Binance.',
    category: 'Basics',
    relatedTerms: ['Trading', 'Liquidity', 'Order Book']
  },

  // Technical
  {
    term: 'Private Key',
    definition: 'A secret cryptographic code that proves ownership of your cryptocurrency and allows you to sign transactions. Never share your private key with anyone.',
    category: 'Technical',
    relatedTerms: ['Public Key', 'Wallet', 'Seed Phrase']
  },
  {
    term: 'Public Key',
    definition: 'A cryptographic code derived from your private key that can be shared publicly. It\'s used to receive cryptocurrency and verify signatures.',
    category: 'Technical',
    relatedTerms: ['Private Key', 'Wallet Address']
  },
  {
    term: 'Seed Phrase',
    definition: 'A list of 12-24 words that can be used to recover your cryptocurrency wallet. Also called a recovery phrase or mnemonic phrase. Keep it secure and never share it.',
    category: 'Technical',
    relatedTerms: ['Private Key', 'Wallet', 'Cold Storage']
  },
  {
    term: 'Hash',
    definition: 'A fixed-length alphanumeric string created by a cryptographic hash function. Used to verify data integrity and create block identifiers in blockchain.',
    category: 'Technical',
    relatedTerms: ['Mining', 'Proof of Work', 'Block']
  },
  {
    term: 'Smart Contract',
    definition: 'Self-executing code stored on a blockchain that automatically enforces the terms of an agreement when predetermined conditions are met.',
    category: 'Technical',
    relatedTerms: ['Ethereum', 'DeFi', 'dApp']
  },
  {
    term: 'Gas',
    definition: 'A unit measuring the computational effort required to execute operations on the Ethereum network. Gas fees are paid to miners/validators for processing transactions.',
    category: 'Technical',
    relatedTerms: ['Ethereum', 'Transaction Fee', 'Gwei']
  },

  // Trading
  {
    term: 'HODL',
    definition: 'Crypto slang meaning "hold" - a strategy of holding cryptocurrency long-term regardless of price volatility. Originally a typo that became a backronym for "Hold On for Dear Life."',
    category: 'Trading',
    relatedTerms: ['Bull Market', 'Bear Market', 'Diamond Hands']
  },
  {
    term: 'DCA (Dollar Cost Averaging)',
    definition: 'An investment strategy where you invest a fixed amount at regular intervals, regardless of price. This reduces the impact of volatility on your overall purchase.',
    category: 'Trading',
    relatedTerms: ['HODL', 'Investment Strategy']
  },
  {
    term: 'Market Cap',
    definition: 'The total value of a cryptocurrency, calculated by multiplying the current price by the total circulating supply.',
    category: 'Trading',
    relatedTerms: ['Circulating Supply', 'Total Supply']
  },
  {
    term: 'Bull Market',
    definition: 'A market condition where prices are rising or expected to rise. Characterized by optimism and investor confidence.',
    category: 'Trading',
    relatedTerms: ['Bear Market', 'ATH', 'FOMO']
  },
  {
    term: 'Bear Market',
    definition: 'A market condition where prices are falling or expected to fall. Characterized by pessimism and fear.',
    category: 'Trading',
    relatedTerms: ['Bull Market', 'FUD', 'Capitulation']
  },
  {
    term: 'ATH (All-Time High)',
    definition: 'The highest price a cryptocurrency has ever reached in its trading history.',
    category: 'Trading',
    relatedTerms: ['ATL', 'Bull Market', 'Breakout']
  },
  {
    term: 'FOMO',
    definition: 'Fear Of Missing Out - the anxiety of missing a potentially profitable investment opportunity, often leading to impulsive buying decisions.',
    category: 'Trading',
    relatedTerms: ['FUD', 'Bull Market', 'DYOR']
  },
  {
    term: 'FUD',
    definition: 'Fear, Uncertainty, and Doubt - negative information spread about a cryptocurrency to cause panic selling.',
    category: 'Trading',
    relatedTerms: ['FOMO', 'Bear Market', 'Whale']
  },

  // DeFi
  {
    term: 'DeFi (Decentralized Finance)',
    definition: 'Financial services built on blockchain technology that operate without traditional intermediaries like banks. Includes lending, borrowing, and trading protocols.',
    category: 'DeFi',
    relatedTerms: ['Smart Contract', 'DEX', 'Yield Farming']
  },
  {
    term: 'DEX (Decentralized Exchange)',
    definition: 'A cryptocurrency exchange that operates without a central authority, allowing peer-to-peer trading directly between users. Examples include Uniswap and SushiSwap.',
    category: 'DeFi',
    relatedTerms: ['CEX', 'AMM', 'Liquidity Pool']
  },
  {
    term: 'Yield Farming',
    definition: 'The practice of staking or lending cryptocurrency to earn rewards or interest. Users provide liquidity to DeFi protocols in exchange for yield.',
    category: 'DeFi',
    relatedTerms: ['Staking', 'Liquidity Pool', 'APY']
  },
  {
    term: 'Staking',
    definition: 'Locking up cryptocurrency to support blockchain operations (like transaction validation) and earn rewards. Used in Proof of Stake networks.',
    category: 'DeFi',
    relatedTerms: ['Proof of Stake', 'Validator', 'APY']
  },
  {
    term: 'Liquidity Pool',
    definition: 'A collection of funds locked in a smart contract used to facilitate trading on DEXs. Liquidity providers earn fees from trades made in the pool.',
    category: 'DeFi',
    relatedTerms: ['DEX', 'AMM', 'Impermanent Loss']
  },
  {
    term: 'APY (Annual Percentage Yield)',
    definition: 'The real rate of return on an investment accounting for compound interest. Used to measure staking and yield farming returns.',
    category: 'DeFi',
    relatedTerms: ['APR', 'Staking', 'Yield Farming']
  },

  // Security
  {
    term: 'Cold Storage',
    definition: 'Keeping cryptocurrency offline in a hardware wallet or paper wallet to protect it from hacking. The most secure way to store large amounts.',
    category: 'Security',
    relatedTerms: ['Hardware Wallet', 'Hot Wallet', 'Seed Phrase']
  },
  {
    term: 'Hot Wallet',
    definition: 'A cryptocurrency wallet connected to the internet. More convenient for trading but less secure than cold storage.',
    category: 'Security',
    relatedTerms: ['Cold Storage', 'Exchange', 'Private Key']
  },
  {
    term: '2FA (Two-Factor Authentication)',
    definition: 'A security measure requiring two different forms of verification to access an account. Essential for protecting exchange accounts.',
    category: 'Security',
    relatedTerms: ['Security', 'Exchange', 'Phishing']
  },
  {
    term: 'Rug Pull',
    definition: 'A scam where developers abandon a project and run away with investor funds. Common in DeFi and new token launches.',
    category: 'Security',
    relatedTerms: ['Scam', 'DYOR', 'Smart Contract']
  },
  {
    term: 'DYOR',
    definition: 'Do Your Own Research - advice to thoroughly research any cryptocurrency before investing. Don\'t rely solely on others\' opinions.',
    category: 'Security',
    relatedTerms: ['FUD', 'FOMO', 'Whitepaper']
  },

  // Mining & Consensus
  {
    term: 'Mining',
    definition: 'The process of using computer power to solve complex mathematical puzzles that validate transactions and create new blocks. Miners are rewarded with cryptocurrency.',
    category: 'Mining',
    relatedTerms: ['Proof of Work', 'Hash Rate', 'Block Reward']
  },
  {
    term: 'Proof of Work (PoW)',
    definition: 'A consensus mechanism where miners compete to solve puzzles to validate transactions. Used by Bitcoin. Requires significant computational power.',
    category: 'Mining',
    relatedTerms: ['Mining', 'Proof of Stake', 'Hash']
  },
  {
    term: 'Proof of Stake (PoS)',
    definition: 'A consensus mechanism where validators are chosen based on the amount of cryptocurrency they stake. More energy-efficient than Proof of Work.',
    category: 'Mining',
    relatedTerms: ['Staking', 'Validator', 'Proof of Work']
  },
  {
    term: 'Node',
    definition: 'A computer that maintains a copy of the blockchain and helps validate and relay transactions across the network.',
    category: 'Mining',
    relatedTerms: ['Blockchain', 'Decentralization', 'Validator']
  },

  // NFTs & Web3
  {
    term: 'NFT (Non-Fungible Token)',
    definition: 'A unique digital token representing ownership of a specific item like art, music, or collectibles. Unlike cryptocurrencies, each NFT is unique and not interchangeable.',
    category: 'NFTs',
    relatedTerms: ['Token', 'Smart Contract', 'Metadata']
  },
  {
    term: 'Web3',
    definition: 'The vision of a decentralized internet built on blockchain technology, where users control their data and digital identities.',
    category: 'NFTs',
    relatedTerms: ['Blockchain', 'dApp', 'DeFi']
  },
  {
    term: 'dApp (Decentralized Application)',
    definition: 'An application that runs on a blockchain network rather than centralized servers. Users interact with dApps through their crypto wallets.',
    category: 'NFTs',
    relatedTerms: ['Smart Contract', 'Web3', 'Wallet']
  },
  {
    term: 'Metaverse',
    definition: 'Virtual worlds where users can interact, trade, and own digital assets using cryptocurrency and NFTs.',
    category: 'NFTs',
    relatedTerms: ['NFT', 'Web3', 'Virtual Reality']
  },
];

const CATEGORIES = ['All', 'Basics', 'Technical', 'Trading', 'DeFi', 'Security', 'Mining', 'NFTs'];

export function Glossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter((item) => {
      const matchesSearch =
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedCategory]);

  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    filteredTerms.forEach((term) => {
      const letter = term.term[0].toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(term);
    });
    return groups;
  }, [filteredTerms]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Crypto Glossary
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Learn the essential terms and concepts you need to navigate the world of cryptocurrency.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terms..."
            className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Terms Count */}
      <p className="text-gray-400 text-sm mb-6">
        Showing {filteredTerms.length} of {GLOSSARY_TERMS.length} terms
      </p>

      {/* Glossary List */}
      {Object.keys(groupedTerms).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No terms found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTerms).map(([letter, terms]) => (
            <div key={letter}>
              <h2 className="text-2xl font-bold text-orange-500 mb-4 border-b border-gray-700 pb-2">
                {letter}
              </h2>
              <div className="space-y-3">
                {terms.map((item) => (
                  <div
                    key={item.term}
                    className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedTerm(
                          expandedTerm === item.term ? null : item.term
                        )
                      }
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-white">
                          {item.term}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                          {item.category}
                        </span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedTerm === item.term ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {expandedTerm === item.term && (
                      <div className="px-6 pb-4 border-t border-gray-700">
                        <p className="text-gray-300 mt-4 leading-relaxed">
                          {item.definition}
                        </p>
                        {item.relatedTerms && item.relatedTerms.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500 mb-2">
                              Related Terms:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.relatedTerms.map((related) => (
                                <button
                                  key={related}
                                  onClick={() => {
                                    setSearchQuery(related);
                                    setSelectedCategory('All');
                                    setExpandedTerm(null);
                                  }}
                                  className="text-sm px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                                >
                                  {related}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
