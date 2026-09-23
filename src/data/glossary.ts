/**
 * Crypto glossary: the single source for /glossary and site search.
 *
 * Every `related` entry must be the slug of another term in this list (checked
 * by `findBrokenGlossaryLinks`, which the glossary page asserts in dev).
 * Each term is reachable at /glossary#<slug>.
 */

export type GlossaryCategory =
  | 'Basics'
  | 'Technical'
  | 'Trading'
  | 'DeFi'
  | 'Security'
  | 'Tax & Regulation'
  | 'Web3';

export interface GlossaryTerm {
  slug: string;
  term: string;
  definition: string;
  category: GlossaryCategory;
  /** Slugs of related terms. */
  related?: string[];
  /** Optional deeper-reading link on this site. */
  learnMore?: { label: string; url: string };
}

/** Date the glossary definitions were last reviewed (ISO). */
export const GLOSSARY_LAST_REVIEWED = '2026-09-23';

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  'Basics',
  'Technical',
  'Trading',
  'DeFi',
  'Security',
  'Tax & Regulation',
  'Web3',
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // ── Basics ────────────────────────────────────────────────────────────
  {
    slug: 'bitcoin',
    term: 'Bitcoin (BTC)',
    definition:
      'The first cryptocurrency, described in a 2008 whitepaper by the pseudonymous Satoshi Nakamoto and launched in January 2009. It runs on a proof-of-work blockchain and its supply is capped at 21 million coins.',
    category: 'Basics',
    related: ['blockchain', 'satoshi', 'halving', 'mining'],
    learnMore: { label: 'What is Bitcoin?', url: '/learn/what-is-bitcoin' },
  },
  {
    slug: 'blockchain',
    term: 'Blockchain',
    definition:
      'A shared ledger made of blocks of transactions, each linked to the one before by a cryptographic hash and copied across many independent computers, so records are hard to alter without everyone noticing.',
    category: 'Basics',
    related: ['block', 'hash', 'node', 'consensus'],
    learnMore: { label: 'Understanding Blockchain Technology', url: '/learn/understanding-blockchain' },
  },
  {
    slug: 'cryptocurrency',
    term: 'Cryptocurrency',
    definition:
      'A digital asset that uses cryptography and a decentralized network, usually a blockchain, to record who owns what and to transfer value without a central bank or intermediary.',
    category: 'Basics',
    related: ['bitcoin', 'altcoin', 'token', 'blockchain'],
  },
  {
    slug: 'altcoin',
    term: 'Altcoin',
    definition:
      'Any cryptocurrency other than Bitcoin, such as Ether, Solana or Cardano. Most altcoins are riskier and less liquid than Bitcoin, and many have failed.',
    category: 'Basics',
    related: ['bitcoin', 'ethereum', 'memecoin', 'bitcoin-dominance'],
  },
  {
    slug: 'ethereum',
    term: 'Ethereum (ETH)',
    definition:
      'A blockchain that runs smart contracts, launched in 2015. Its native currency is ether (ETH), used to pay gas fees. Ethereum switched from proof of work to proof of stake in September 2022 ("the Merge").',
    category: 'Basics',
    related: ['smart-contract', 'gas', 'proof-of-stake', 'layer-2'],
  },
  {
    slug: 'satoshi',
    term: 'Satoshi (sat)',
    definition:
      'The smallest unit of bitcoin: 1 BTC = 100,000,000 satoshis. Named after Bitcoin\'s creator. Fees and small amounts are often quoted in sats.',
    category: 'Basics',
    related: ['bitcoin', 'transaction-fee'],
  },
  {
    slug: 'stablecoin',
    term: 'Stablecoin',
    definition:
      'A token designed to hold a steady value, usually $1. Most are backed by cash and short-term US Treasury bills (USDC, USDT); some by crypto collateral (DAI, USDS). Stablecoins are not bank deposits and can lose their peg, as TerraUSD did in 2022.',
    category: 'Basics',
    related: ['genius-act', 'defi', 'token'],
  },
  {
    slug: 'token',
    term: 'Token (vs coin)',
    definition:
      'A "coin" is the native asset of its own blockchain (BTC on Bitcoin, ETH on Ethereum). A "token" is created by a smart contract on an existing blockchain, such as USDC or UNI on Ethereum. People often use the words interchangeably.',
    category: 'Basics',
    related: ['cryptocurrency', 'smart-contract', 'stablecoin', 'nft'],
  },
  {
    slug: 'wallet',
    term: 'Wallet',
    definition:
      'Software or a device that holds the private keys needed to send crypto and shows your balances. The coins themselves stay on the blockchain; the wallet controls access to them.',
    category: 'Basics',
    related: ['private-key', 'seed-phrase', 'hot-wallet', 'hardware-wallet'],
    learnMore: { label: 'Crypto Wallets Explained', url: '/learn/crypto-wallets-explained' },
  },
  {
    slug: 'exchange',
    term: 'Exchange (CEX)',
    definition:
      'A company that lets you buy, sell and hold crypto, often with dollars from your bank, such as Coinbase, Kraken or Gemini. A centralized exchange (CEX) holds your coins for you unless you withdraw them.',
    category: 'Basics',
    related: ['dex', 'kyc', 'self-custody', 'proof-of-reserves'],
    learnMore: { label: 'Compare exchanges', url: '/compare' },
  },
  {
    slug: 'fiat',
    term: 'Fiat currency',
    definition:
      'Government-issued money such as the US dollar or euro, whose value comes from law and trust in the issuer rather than a physical commodity. "Fiat on-ramp" means a way to turn fiat into crypto.',
    category: 'Basics',
    related: ['stablecoin', 'exchange', 'cbdc'],
  },
  {
    slug: 'market-cap',
    term: 'Market capitalisation (market cap)',
    definition:
      'Current price multiplied by circulating supply. It is the usual way to rank cryptocurrencies by size, but it is not the amount of money invested or that could be withdrawn.',
    category: 'Basics',
    related: ['circulating-supply', 'fdv', 'bitcoin-dominance'],
  },
  {
    slug: 'whitepaper',
    term: 'Whitepaper',
    definition:
      'A document describing a crypto project\'s design, purpose and token plans. Bitcoin\'s nine-page whitepaper (2008) is the original example. A whitepaper is a pitch, not proof the project works.',
    category: 'Basics',
    related: ['tokenomics', 'dyor'],
  },
  {
    slug: 'halving',
    term: 'Halving',
    definition:
      'The scheduled 50% cut in the number of new bitcoins paid to miners per block, every 210,000 blocks (about four years). The April 2024 halving reduced it from 6.25 to 3.125 BTC; the next is expected around 2028.',
    category: 'Basics',
    related: ['block-reward', 'mining', 'max-supply', 'bitcoin'],
  },
  {
    slug: 'spot-bitcoin-etf',
    term: 'Spot Bitcoin ETF',
    definition:
      'An exchange-traded fund that holds actual bitcoin and trades on the stock market. US spot Bitcoin ETFs launched in January 2024 (spot Ether ETFs in July 2024), letting you get exposure in a brokerage account or IRA without managing keys, for an annual fee.',
    category: 'Basics',
    related: ['bitcoin', 'self-custody', 'wash-sale-rule'],
    learnMore: { label: 'How to buy crypto', url: '/learn/how-to-buy-crypto' },
  },
  {
    slug: 'memecoin',
    term: 'Memecoin',
    definition:
      'A token driven mainly by jokes, internet culture or celebrity rather than a product, such as Dogecoin. Memecoins are extremely volatile and many launch as pump-and-dumps or rug pulls.',
    category: 'Basics',
    related: ['altcoin', 'rug-pull', 'fomo'],
  },
  {
    slug: 'cbdc',
    term: 'CBDC (central bank digital currency)',
    definition:
      'A digital form of a country\'s currency issued by its central bank, such as China\'s e-CNY. Unlike Bitcoin it is centrally controlled; unlike a stablecoin it is a direct liability of the central bank.',
    category: 'Basics',
    related: ['fiat', 'stablecoin'],
  },
  {
    slug: 'rwa',
    term: 'Real-world assets (RWA) / tokenization',
    definition:
      'Traditional assets such as Treasury bills, bonds or property represented as tokens on a blockchain. Tokenized Treasury funds grew quickly in 2024–2026; you still rely on the issuer and legal structure behind the token.',
    category: 'Basics',
    related: ['token', 'stablecoin', 'oracle'],
  },

  // ── Technical ─────────────────────────────────────────────────────────
  {
    slug: 'block',
    term: 'Block',
    definition:
      'A batch of transactions added to a blockchain together, with a timestamp and the hash of the previous block. Bitcoin produces a block about every 10 minutes; Ethereum every 12 seconds.',
    category: 'Technical',
    related: ['blockchain', 'confirmation', 'block-reward', 'hash'],
  },
  {
    slug: 'hash',
    term: 'Hash',
    definition:
      'A fixed-length fingerprint produced by running data through a hash function such as SHA-256. Any change to the input gives a completely different output, which is how blockchains detect tampering.',
    category: 'Technical',
    related: ['block', 'proof-of-work', 'hash-rate'],
  },
  {
    slug: 'node',
    term: 'Node',
    definition:
      'A computer running a blockchain\'s software that keeps a copy of the ledger, checks every block and transaction against the rules, and relays them to other nodes.',
    category: 'Technical',
    related: ['blockchain', 'validator', 'decentralization'],
  },
  {
    slug: 'mining',
    term: 'Mining',
    definition:
      'In proof-of-work blockchains, using specialised computers to find a valid block and earn the block reward plus fees. Mining secures Bitcoin by making it expensive to rewrite history.',
    category: 'Technical',
    related: ['proof-of-work', 'hash-rate', 'block-reward', 'halving'],
  },
  {
    slug: 'proof-of-work',
    term: 'Proof of work (PoW)',
    definition:
      'A consensus method where miners compete to find a hash below a target by trial and error, spending electricity. The longest chain with the most accumulated work is accepted. Used by Bitcoin.',
    category: 'Technical',
    related: ['mining', 'proof-of-stake', 'consensus', 'hash-rate'],
  },
  {
    slug: 'proof-of-stake',
    term: 'Proof of stake (PoS)',
    definition:
      'A consensus method where validators lock up (stake) the network\'s coins as collateral to propose and confirm blocks, and can lose part of it ("slashing") for cheating. Uses far less energy than proof of work. Used by Ethereum since 2022.',
    category: 'Technical',
    related: ['validator', 'staking', 'proof-of-work', 'consensus'],
  },
  {
    slug: 'validator',
    term: 'Validator',
    definition:
      'A participant in a proof-of-stake network who stakes coins to propose and attest to blocks, earning rewards. On Ethereum a validator needs at least 32 ETH.',
    category: 'Technical',
    related: ['proof-of-stake', 'staking', 'node'],
  },
  {
    slug: 'hash-rate',
    term: 'Hash rate',
    definition:
      'The total computing power miners devote to a proof-of-work network, measured in hashes per second. A higher hash rate makes a 51% attack more expensive.',
    category: 'Technical',
    related: ['mining', 'proof-of-work', 'hash'],
  },
  {
    slug: 'block-reward',
    term: 'Block reward',
    definition:
      'What a miner earns for a new block: newly created coins (the subsidy, 3.125 BTC per Bitcoin block since April 2024) plus the fees of transactions in the block.',
    category: 'Technical',
    related: ['halving', 'mining', 'transaction-fee'],
  },
  {
    slug: 'confirmation',
    term: 'Confirmation',
    definition:
      'Each block added after the one containing your transaction. More confirmations make a transaction harder to reverse; exchanges usually wait for a set number before crediting a deposit.',
    category: 'Technical',
    related: ['block', 'mempool'],
  },
  {
    slug: 'mempool',
    term: 'Mempool',
    definition:
      'The waiting area of valid transactions that have been broadcast but not yet included in a block. When it is crowded, transactions paying higher fees get confirmed first.',
    category: 'Technical',
    related: ['transaction-fee', 'confirmation', 'gas'],
  },
  {
    slug: 'transaction-fee',
    term: 'Transaction fee (network fee)',
    definition:
      'The amount paid to the network to process a transaction, separate from any exchange fee. On Bitcoin it depends on transaction size and demand for block space; on Ethereum it is called gas.',
    category: 'Technical',
    related: ['gas', 'mempool', 'satoshi'],
  },
  {
    slug: 'gas',
    term: 'Gas',
    definition:
      'The unit of computation on Ethereum and similar chains, and by extension the fee for a transaction: gas used × gas price. Since EIP-1559 (2021) each fee has a base fee, which is burned, plus an optional priority fee (tip) paid to the validator.',
    category: 'Technical',
    related: ['gwei', 'ethereum', 'transaction-fee', 'layer-2'],
    learnMore: { label: 'Gas fee optimizer', url: '/gas-optimizer' },
  },
  {
    slug: 'gwei',
    term: 'Gwei',
    definition:
      'A small unit of ether used to quote gas prices: 1 gwei = 0.000000001 ETH (one billionth).',
    category: 'Technical',
    related: ['gas', 'ethereum'],
  },
  {
    slug: 'smart-contract',
    term: 'Smart contract',
    definition:
      'A program stored on a blockchain that runs exactly as written when called, with no one able to stop or change it unless it was built to allow that. Smart contracts power DeFi, tokens and NFTs; bugs in them can be exploited.',
    category: 'Technical',
    related: ['ethereum', 'defi', 'dapp', 'oracle'],
  },
  {
    slug: 'layer-2',
    term: 'Layer 2 (L2)',
    definition:
      'A network built on top of a base blockchain that processes transactions more cheaply and settles back to it, such as Ethereum rollups (Arbitrum, Optimism, Base) or Bitcoin\'s Lightning Network.',
    category: 'Technical',
    related: ['lightning-network', 'ethereum', 'gas', 'bridge'],
  },
  {
    slug: 'lightning-network',
    term: 'Lightning Network',
    definition:
      'A Layer 2 payment network for Bitcoin that uses payment channels to send small amounts almost instantly for tiny fees, settling to the main chain only when channels open or close.',
    category: 'Technical',
    related: ['layer-2', 'bitcoin'],
  },
  {
    slug: 'fork',
    term: 'Fork (hard fork / soft fork)',
    definition:
      'A change to a blockchain\'s rules. A soft fork is backward-compatible; a hard fork is not, and if some users refuse it the chain can split in two, as when Bitcoin Cash split from Bitcoin in 2017.',
    category: 'Technical',
    related: ['consensus', 'node'],
  },
  {
    slug: 'private-key',
    term: 'Private key',
    definition:
      'The secret number that lets you sign transactions and spend crypto from an address. Anyone who has it controls the funds, so it must never be shared or typed into a website.',
    category: 'Technical',
    related: ['public-key', 'seed-phrase', 'wallet', 'self-custody'],
  },
  {
    slug: 'public-key',
    term: 'Public key',
    definition:
      'The number derived from a private key that lets others verify your signatures. Addresses are derived from public keys, so it is safe to share.',
    category: 'Technical',
    related: ['private-key', 'wallet-address'],
  },
  {
    slug: 'wallet-address',
    term: 'Wallet address',
    definition:
      'The string you share to receive crypto, like an account number (Bitcoin addresses often start with bc1, Ethereum addresses with 0x). Always copy it from your wallet and check the first and last characters before sending.',
    category: 'Technical',
    related: ['public-key', 'address-poisoning', 'wallet'],
  },
  {
    slug: 'consensus',
    term: 'Consensus mechanism',
    definition:
      'The rules a blockchain uses so thousands of computers that do not trust each other agree on one version of the ledger, such as proof of work or proof of stake.',
    category: 'Technical',
    related: ['proof-of-work', 'proof-of-stake', 'node'],
  },
  {
    slug: 'oracle',
    term: 'Oracle',
    definition:
      'A service that feeds outside data, such as asset prices, into smart contracts. Chainlink is the best known. If an oracle is wrong or manipulated, contracts that rely on it can be drained.',
    category: 'Technical',
    related: ['smart-contract', 'defi'],
  },
  {
    slug: 'bridge',
    term: 'Bridge (cross-chain bridge)',
    definition:
      'A protocol that moves tokens between blockchains, usually by locking them on one chain and issuing a wrapped version on another. Bridges hold large pools of funds and have been among the biggest hacking targets.',
    category: 'Technical',
    related: ['wrapped-token', 'layer-2', 'defi'],
  },
  {
    slug: 'wrapped-token',
    term: 'Wrapped token',
    definition:
      'A token on one blockchain that represents an asset from another and is backed 1:1 by it, such as WBTC (bitcoin on Ethereum). You depend on whoever holds the backing asset.',
    category: 'Technical',
    related: ['bridge', 'token'],
  },
  {
    slug: 'decentralization',
    term: 'Decentralization',
    definition:
      'How widely control of a network is spread among independent participants. More decentralization makes a network harder to shut down or censor, usually at the cost of speed.',
    category: 'Technical',
    related: ['node', 'consensus', 'dao'],
  },

  // ── Trading ───────────────────────────────────────────────────────────
  {
    slug: 'hodl',
    term: 'HODL',
    definition:
      'Crypto slang for holding for the long term instead of trading. It began as a typo of "hold" in a 2013 Bitcoin forum post and was later backronymed as "hold on for dear life".',
    category: 'Trading',
    related: ['dca', 'bear-market', 'fomo'],
  },
  {
    slug: 'dca',
    term: 'DCA (dollar-cost averaging)',
    definition:
      'Investing a fixed amount on a fixed schedule regardless of price. It spreads your entry price and removes the need to time the market, but does not guarantee a profit.',
    category: 'Trading',
    related: ['hodl', 'volatility', 'rebalancing'],
    learnMore: { label: 'DCA calculator', url: '/calculators' },
  },
  {
    slug: 'bull-market',
    term: 'Bull market',
    definition:
      'A sustained period of rising prices and optimism. In crypto, bull markets have often been followed by very deep bear markets.',
    category: 'Trading',
    related: ['bear-market', 'ath', 'fomo'],
  },
  {
    slug: 'bear-market',
    term: 'Bear market',
    definition:
      'A sustained period of falling prices, commonly defined as a drop of 20% or more from a peak. Bitcoin bear markets have seen falls of roughly 75–85%.',
    category: 'Trading',
    related: ['bull-market', 'capitulation', 'fud'],
  },
  {
    slug: 'ath',
    term: 'ATH (all-time high)',
    definition:
      'The highest price an asset has ever traded at. Bitcoin\'s latest ATH was about $126,000 in early October 2025.',
    category: 'Trading',
    related: ['atl', 'bull-market'],
  },
  {
    slug: 'atl',
    term: 'ATL (all-time low)',
    definition: 'The lowest price an asset has ever traded at since it began trading.',
    category: 'Trading',
    related: ['ath', 'bear-market'],
  },
  {
    slug: 'fomo',
    term: 'FOMO',
    definition:
      'Fear of missing out: the urge to buy because prices are rising fast and others seem to be profiting. FOMO buying often means buying near a top.',
    category: 'Trading',
    related: ['fud', 'bull-market', 'dyor'],
  },
  {
    slug: 'fud',
    term: 'FUD',
    definition:
      'Fear, uncertainty and doubt: negative news or claims that push prices down. Sometimes justified criticism is dismissed as "FUD", so judge the evidence, not the label.',
    category: 'Trading',
    related: ['fomo', 'bear-market'],
  },
  {
    slug: 'volatility',
    term: 'Volatility',
    definition:
      'How much and how fast a price moves. Bitcoin has historically been several times more volatile than the stock market, with daily moves of a few percent being routine.',
    category: 'Trading',
    related: ['dca', 'leverage', 'bear-market'],
  },
  {
    slug: 'liquidity',
    term: 'Liquidity',
    definition:
      'How easily an asset can be bought or sold without moving its price. Low liquidity means wider spreads and more slippage.',
    category: 'Trading',
    related: ['order-book', 'spread', 'slippage', 'liquidity-pool'],
  },
  {
    slug: 'order-book',
    term: 'Order book',
    definition:
      'The live list of buy (bid) and sell (ask) orders at each price on an exchange. The gap between the best bid and best ask is the spread.',
    category: 'Trading',
    related: ['limit-order', 'market-order', 'spread'],
  },
  {
    slug: 'market-order',
    term: 'Market order',
    definition:
      'An order to buy or sell immediately at the best available price. It always fills (if there is liquidity), but in fast or thin markets you may pay more than the quoted price.',
    category: 'Trading',
    related: ['limit-order', 'slippage', 'maker-taker-fees'],
  },
  {
    slug: 'limit-order',
    term: 'Limit order',
    definition:
      'An order to buy or sell only at a set price or better. It avoids slippage and often pays the lower "maker" fee, but may never fill.',
    category: 'Trading',
    related: ['market-order', 'order-book', 'maker-taker-fees'],
  },
  {
    slug: 'stop-loss',
    term: 'Stop-loss order',
    definition:
      'An order that sells automatically if the price falls to a chosen level, to cap losses. In sudden crashes it can fill well below the stop price.',
    category: 'Trading',
    related: ['limit-order', 'volatility'],
    learnMore: { label: 'Crypto risk management', url: '/learn/risk-management' },
  },
  {
    slug: 'spread',
    term: 'Spread',
    definition:
      'The difference between the buy and sell price. "Simple buy" screens in many apps include a spread as a hidden cost on top of any stated fee.',
    category: 'Trading',
    related: ['order-book', 'liquidity', 'slippage'],
  },
  {
    slug: 'slippage',
    term: 'Slippage',
    definition:
      'The difference between the price you expected and the price you actually got, caused by the market moving or by your order being large relative to available liquidity.',
    category: 'Trading',
    related: ['market-order', 'liquidity', 'amm'],
  },
  {
    slug: 'maker-taker-fees',
    term: 'Maker and taker fees',
    definition:
      'Exchange fee tiers. A "maker" order rests on the order book and adds liquidity (usually a lower fee); a "taker" order fills against an existing order (usually a higher fee).',
    category: 'Trading',
    related: ['limit-order', 'market-order', 'exchange'],
  },
  {
    slug: 'leverage',
    term: 'Leverage',
    definition:
      'Trading with borrowed money to control a bigger position than your own funds. At 10x leverage, a 10% move against you can wipe out your entire deposit.',
    category: 'Trading',
    related: ['liquidation', 'perpetual-futures', 'volatility'],
  },
  {
    slug: 'liquidation',
    term: 'Liquidation',
    definition:
      'The forced closing of a leveraged position or a DeFi loan when collateral no longer covers it. You typically lose the collateral plus a penalty.',
    category: 'Trading',
    related: ['leverage', 'health-factor', 'perpetual-futures'],
  },
  {
    slug: 'perpetual-futures',
    term: 'Futures and perpetuals',
    definition:
      'Derivative contracts that let you bet on price moves, usually with leverage. Perpetual futures ("perps") never expire and use a periodic funding rate to track the spot price. Most offshore perp venues are not available to US users.',
    category: 'Trading',
    related: ['leverage', 'liquidation'],
  },
  {
    slug: 'whale',
    term: 'Whale',
    definition:
      'An individual or entity holding a very large amount of a cryptocurrency, large enough that their trades can move the price.',
    category: 'Trading',
    related: ['liquidity', 'market-cap'],
  },
  {
    slug: 'bitcoin-dominance',
    term: 'Bitcoin dominance',
    definition:
      'Bitcoin\'s share of the total crypto market capitalisation. Rising dominance usually means money is favouring Bitcoin over altcoins.',
    category: 'Trading',
    related: ['market-cap', 'altcoin'],
  },
  {
    slug: 'fear-and-greed-index',
    term: 'Fear & Greed Index',
    definition:
      'A 0–100 gauge of crypto market sentiment built from volatility, momentum, social media and other inputs. It measures mood, not value: prices can keep falling in "extreme fear".',
    category: 'Trading',
    related: ['fomo', 'fud', 'capitulation'],
  },
  {
    slug: 'circulating-supply',
    term: 'Circulating supply',
    definition:
      'The number of coins currently available to trade, excluding locked or unissued tokens. Used to calculate market cap.',
    category: 'Trading',
    related: ['max-supply', 'market-cap', 'fdv'],
  },
  {
    slug: 'max-supply',
    term: 'Max supply',
    definition:
      'The most coins that can ever exist under a protocol\'s rules, such as 21 million for Bitcoin. Some assets, including ether, have no fixed maximum.',
    category: 'Trading',
    related: ['circulating-supply', 'halving', 'tokenomics'],
  },
  {
    slug: 'fdv',
    term: 'Fully diluted valuation (FDV)',
    definition:
      'Price multiplied by the maximum (or total planned) supply. A large gap between market cap and FDV means many more tokens will be unlocked, which can pressure the price.',
    category: 'Trading',
    related: ['market-cap', 'tokenomics', 'max-supply'],
  },
  {
    slug: 'tokenomics',
    term: 'Tokenomics',
    definition:
      'How a token\'s supply, issuance, distribution and uses are designed, including how much insiders hold and when their tokens unlock.',
    category: 'Trading',
    related: ['fdv', 'max-supply', 'whitepaper'],
  },
  {
    slug: 'capitulation',
    term: 'Capitulation',
    definition:
      'A wave of panic selling in which many holders give up at once, often near (but not reliably at) a market bottom.',
    category: 'Trading',
    related: ['bear-market', 'fear-and-greed-index'],
  },
  {
    slug: 'rebalancing',
    term: 'Rebalancing',
    definition:
      'Trading back to your target allocation after price moves have changed it, for example selling some bitcoin after it grows from 60% to 75% of your crypto. Sales can be taxable.',
    category: 'Trading',
    related: ['dca', 'taxable-event'],
    learnMore: { label: 'Portfolio rebalancing guide', url: '/learn/portfolio-rebalancing' },
  },

  // ── DeFi ──────────────────────────────────────────────────────────────
  {
    slug: 'defi',
    term: 'DeFi (decentralized finance)',
    definition:
      'Financial services such as trading, lending and borrowing that run as smart contracts on public blockchains and are used directly from your own wallet, without a bank or broker. There is no deposit insurance.',
    category: 'DeFi',
    related: ['smart-contract', 'dex', 'yield-farming', 'tvl'],
    learnMore: { label: 'DeFi Explained', url: '/learn/defi-basics' },
  },
  {
    slug: 'dex',
    term: 'DEX (decentralized exchange)',
    definition:
      'An exchange run by smart contracts where you trade directly from your wallet, such as Uniswap or Curve. There is no account or custodian, and no one can reverse a mistaken trade.',
    category: 'DeFi',
    related: ['amm', 'liquidity-pool', 'exchange', 'slippage'],
  },
  {
    slug: 'amm',
    term: 'AMM (automated market maker)',
    definition:
      'A DEX design that prices trades using a formula over a pool of tokens (for example x × y = k) instead of an order book.',
    category: 'DeFi',
    related: ['dex', 'liquidity-pool', 'impermanent-loss'],
  },
  {
    slug: 'liquidity-pool',
    term: 'Liquidity pool',
    definition:
      'Tokens deposited into a smart contract so others can trade against them. Liquidity providers earn a share of trading fees but take on impermanent loss and smart-contract risk.',
    category: 'DeFi',
    related: ['amm', 'impermanent-loss', 'yield-farming'],
  },
  {
    slug: 'impermanent-loss',
    term: 'Impermanent loss',
    definition:
      'The shortfall a liquidity provider suffers versus simply holding the two tokens, caused by the pool rebalancing as prices diverge. If one token doubles against the other, the loss is about 5.7%.',
    category: 'DeFi',
    related: ['liquidity-pool', 'amm', 'yield-farming'],
    learnMore: { label: 'Yield farming guide', url: '/learn/yield-farming' },
  },
  {
    slug: 'yield-farming',
    term: 'Yield farming',
    definition:
      'Moving crypto into DeFi protocols (liquidity pools, lending markets, vaults) to earn fees, interest or reward tokens. Advertised yields often depend on reward tokens that lose value.',
    category: 'DeFi',
    related: ['liquidity-pool', 'apy', 'staking', 'impermanent-loss'],
    learnMore: { label: 'Yield farming guide', url: '/learn/yield-farming' },
  },
  {
    slug: 'staking',
    term: 'Staking',
    definition:
      'Locking coins in a proof-of-stake network, directly or through a provider, to help secure it and earn rewards. Risks include slashing, lock-up periods and the provider failing. In the US, rewards are taxable income when received.',
    category: 'DeFi',
    related: ['proof-of-stake', 'validator', 'liquid-staking', 'apy'],
    learnMore: { label: 'Staking calculator', url: '/staking-calculator' },
  },
  {
    slug: 'liquid-staking',
    term: 'Liquid staking',
    definition:
      'Staking through a protocol such as Lido that gives you a tradable token (like stETH) representing your staked coins and rewards, so you can use or sell it while still earning.',
    category: 'DeFi',
    related: ['staking', 'wrapped-token'],
  },
  {
    slug: 'apy',
    term: 'APY (annual percentage yield)',
    definition:
      'The yearly return including compounding: APY = (1 + APR/n)^n − 1 for n compounding periods. A 10% APR compounded daily is about a 10.52% APY.',
    category: 'DeFi',
    related: ['apr', 'staking', 'yield-farming'],
  },
  {
    slug: 'apr',
    term: 'APR (annual percentage rate)',
    definition:
      'A yearly rate of return or interest without compounding. It is lower than the equivalent APY whenever rewards are compounded.',
    category: 'DeFi',
    related: ['apy'],
  },
  {
    slug: 'tvl',
    term: 'TVL (total value locked)',
    definition:
      'The value of assets deposited in a DeFi protocol or chain. A rough measure of size and usage, not a guarantee of safety.',
    category: 'DeFi',
    related: ['defi', 'liquidity-pool'],
  },
  {
    slug: 'dao',
    term: 'DAO (decentralized autonomous organization)',
    definition:
      'A group that governs a protocol or treasury through token-holder votes executed by smart contracts. In practice a few large holders often control the outcome.',
    category: 'DeFi',
    related: ['decentralization', 'smart-contract', 'token'],
  },
  {
    slug: 'airdrop',
    term: 'Airdrop',
    definition:
      'Free tokens sent to wallet addresses, often to early users of a protocol. Unexpected tokens can be scams that lure you to a malicious site. In the US, airdrops are generally taxable income when you gain control of them.',
    category: 'DeFi',
    related: ['token', 'phishing', 'taxable-event'],
  },
  {
    slug: 'flash-loan',
    term: 'Flash loan',
    definition:
      'An uncollateralized DeFi loan that must be borrowed and repaid within a single transaction. Used by developers for arbitrage and liquidations, and frequently in exploits of vulnerable protocols.',
    category: 'DeFi',
    related: ['smart-contract', 'defi'],
  },
  {
    slug: 'health-factor',
    term: 'Health factor',
    definition:
      'In lending protocols such as Aave, a number showing how safely a loan is collateralized. Below 1, the position can be liquidated.',
    category: 'DeFi',
    related: ['liquidation', 'defi'],
  },

  // ── Security ──────────────────────────────────────────────────────────
  {
    slug: 'seed-phrase',
    term: 'Seed phrase (recovery phrase)',
    definition:
      'A list of 12 or 24 words that can regenerate every private key in a wallet. Whoever has it controls the funds. Write it on paper or metal, keep copies in separate safe places, and never type it into a website or store it digitally.',
    category: 'Security',
    related: ['private-key', 'passphrase', 'hardware-wallet', 'self-custody'],
  },
  {
    slug: 'passphrase',
    term: 'Passphrase ("25th word")',
    definition:
      'An optional extra word or phrase added to a seed phrase that creates a separate hidden wallet. It protects you if someone finds your seed, but if you forget it the funds are lost.',
    category: 'Security',
    related: ['seed-phrase', 'hardware-wallet'],
  },
  {
    slug: 'self-custody',
    term: 'Self-custody (custodial vs non-custodial)',
    definition:
      'Holding your own private keys (non-custodial) instead of letting an exchange hold them (custodial). "Not your keys, not your coins": self-custody removes platform risk but makes you responsible for backups.',
    category: 'Security',
    related: ['private-key', 'hardware-wallet', 'exchange', 'seed-phrase'],
  },
  {
    slug: 'cold-storage',
    term: 'Cold storage',
    definition:
      'Keeping private keys on a device that never connects directly to the internet, usually a hardware wallet. The standard for long-term savings.',
    category: 'Security',
    related: ['hardware-wallet', 'hot-wallet', 'seed-phrase'],
  },
  {
    slug: 'hot-wallet',
    term: 'Hot wallet',
    definition:
      'A wallet whose keys live on an internet-connected phone or computer (such as MetaMask or BlueWallet). Convenient for small amounts, but exposed to malware and phishing.',
    category: 'Security',
    related: ['cold-storage', 'wallet', 'phishing'],
  },
  {
    slug: 'hardware-wallet',
    term: 'Hardware wallet',
    definition:
      'A small dedicated device, such as a Ledger or Trezor, that stores keys offline and signs transactions on its own screen. Buy only from the maker or an authorised reseller.',
    category: 'Security',
    related: ['cold-storage', 'seed-phrase', 'self-custody'],
    learnMore: { label: 'Hardware wallet guide', url: '/hardware-wallet' },
  },
  {
    slug: 'multisig',
    term: 'Multisig (multi-signature)',
    definition:
      'A wallet that needs several keys to approve a transaction, such as 2 of 3. It removes any single point of failure; Safe (formerly Gnosis Safe) is a common Ethereum example.',
    category: 'Security',
    related: ['self-custody', 'hardware-wallet'],
  },
  {
    slug: 'two-factor-authentication',
    term: '2FA (two-factor authentication)',
    definition:
      'A second login check beyond your password. Authenticator apps, passkeys and hardware security keys are much safer than SMS codes, which can be stolen via SIM swaps.',
    category: 'Security',
    related: ['sim-swap', 'phishing'],
  },
  {
    slug: 'phishing',
    term: 'Phishing',
    definition:
      'Fake websites, emails, ads or messages that imitate a real company to steal logins, seed phrases or wallet approvals. Phishing sites often have HTTPS padlocks, so check the exact domain and use bookmarks.',
    category: 'Security',
    related: ['two-factor-authentication', 'address-poisoning', 'seed-phrase'],
    learnMore: { label: 'Scam database', url: '/scam-database' },
  },
  {
    slug: 'sim-swap',
    term: 'SIM swap',
    definition:
      'An attack where a criminal convinces your mobile carrier to move your number to their SIM, then uses it to receive SMS codes and reset your accounts. Use app-based 2FA and add a carrier PIN.',
    category: 'Security',
    related: ['two-factor-authentication', 'phishing'],
  },
  {
    slug: 'address-poisoning',
    term: 'Address poisoning',
    definition:
      'A scam that sends tiny transactions from an address that looks like one you use, hoping you later copy it from your history by mistake. Always copy addresses from the source, and check more than the first and last few characters.',
    category: 'Security',
    related: ['wallet-address', 'phishing'],
  },
  {
    slug: 'rug-pull',
    term: 'Rug pull',
    definition:
      'A scam in which a project\'s creators attract money into a token or protocol and then drain the funds or liquidity and disappear.',
    category: 'Security',
    related: ['dyor', 'memecoin', 'smart-contract'],
  },
  {
    slug: 'pig-butchering',
    term: 'Pig-butchering scam',
    definition:
      'A long con in which a scammer builds a friendship or romance online, then steers the victim to a fake trading platform that shows big gains but demands "taxes" or "fees" before any withdrawal.',
    category: 'Security',
    related: ['phishing', 'rug-pull'],
    learnMore: { label: 'Common crypto mistakes', url: '/learn/common-crypto-mistakes' },
  },
  {
    slug: 'dyor',
    term: 'DYOR',
    definition:
      '"Do your own research": check a project\'s team, code, audits, token distribution and independent criticism before investing, rather than relying on promoters.',
    category: 'Security',
    related: ['whitepaper', 'rug-pull', 'fomo'],
  },
  {
    slug: 'kyc',
    term: 'KYC / AML',
    definition:
      'Know Your Customer and Anti-Money Laundering rules that require regulated exchanges to verify your identity (ID, address, often a selfie and, in the US, your Social Security number) and monitor transactions.',
    category: 'Security',
    related: ['exchange'],
  },
  {
    slug: 'proof-of-reserves',
    term: 'Proof of reserves',
    definition:
      'An exchange\'s cryptographic or audited demonstration that it holds customer assets. It does not always show liabilities, so it is reassuring but not a full audit.',
    category: 'Security',
    related: ['exchange', 'self-custody'],
  },

  // ── Tax & Regulation ──────────────────────────────────────────────────
  {
    slug: 'taxable-event',
    term: 'Taxable event',
    definition:
      'In the US, an action that triggers tax: selling crypto, swapping it for another crypto, spending it, or receiving it as income (pay, staking, most airdrops). Buying with dollars and moving between your own wallets are not taxable.',
    category: 'Tax & Regulation',
    related: ['cost-basis', 'capital-gains', 'form-1099-da'],
    learnMore: { label: 'Crypto taxes guide', url: '/learn/crypto-taxes-basics' },
  },
  {
    slug: 'cost-basis',
    term: 'Cost basis',
    definition:
      'What you paid for an asset, including fees, used to work out your gain or loss when you sell. Since 2025, US taxpayers must track basis per wallet or account.',
    category: 'Tax & Regulation',
    related: ['capital-gains', 'form-1099-da', 'taxable-event'],
  },
  {
    slug: 'capital-gains',
    term: 'Capital gains tax',
    definition:
      'Tax on the profit from selling an asset. In the US, crypto held more than a year gets long-term rates (0%, 15% or 20%); a year or less is taxed at ordinary income rates.',
    category: 'Tax & Regulation',
    related: ['cost-basis', 'taxable-event', 'wash-sale-rule'],
    learnMore: { label: 'Crypto tax calculator', url: '/calculators?type=tax' },
  },
  {
    slug: 'form-1099-da',
    term: 'Form 1099-DA',
    definition:
      'The IRS form US crypto brokers use to report customers\' sales. It covers gross proceeds for 2025 transactions, and cost basis as well for coins acquired from January 1, 2026 and held at the same broker.',
    category: 'Tax & Regulation',
    related: ['cost-basis', 'capital-gains', 'taxable-event'],
  },
  {
    slug: 'wash-sale-rule',
    term: 'Wash-sale rule',
    definition:
      'A US rule that disallows a loss if you rebuy a substantially identical security within 30 days. As of September 2026 it does not apply to crypto held directly (crypto is property), but it does apply to crypto ETFs, and bills to extend it are pending.',
    category: 'Tax & Regulation',
    related: ['capital-gains', 'spot-bitcoin-etf'],
  },
  {
    slug: 'genius-act',
    term: 'GENIUS Act',
    definition:
      'The US federal stablecoin law signed in July 2025. It requires payment stablecoin issuers to hold 1:1 reserves in cash and short-term Treasuries, publish reserve reports and be licensed.',
    category: 'Tax & Regulation',
    related: ['stablecoin'],
  },

  // ── Web3 ──────────────────────────────────────────────────────────────
  {
    slug: 'nft',
    term: 'NFT (non-fungible token)',
    definition:
      'A token that is unique rather than interchangeable, used to represent ownership of a specific item such as digital art, a collectible or a ticket. Owning an NFT does not automatically give you copyright in the artwork.',
    category: 'Web3',
    related: ['token', 'smart-contract', 'web3'],
  },
  {
    slug: 'web3',
    term: 'Web3',
    definition:
      'A loose term for apps and services built on blockchains, where users hold their own assets and identity in wallets rather than accounts controlled by a company.',
    category: 'Web3',
    related: ['dapp', 'defi', 'nft'],
  },
  {
    slug: 'dapp',
    term: 'dApp (decentralized application)',
    definition:
      'An app whose core logic runs as smart contracts on a blockchain, used by connecting a wallet. The website front-end is often still run by a company and can be blocked or spoofed.',
    category: 'Web3',
    related: ['smart-contract', 'web3', 'wallet'],
  },
];

const BY_SLUG: Map<string, GlossaryTerm> = new Map(GLOSSARY_TERMS.map((t) => [t.slug, t]));

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return BY_SLUG.get(slug);
}

/** URL of a term on the glossary page. */
export function glossaryTermUrl(slug: string): string {
  return `/glossary#${slug}`;
}

/** Related-term slugs that do not resolve (should always be empty). */
export function findBrokenGlossaryLinks(): Array<{ from: string; to: string }> {
  const broken: Array<{ from: string; to: string }> = [];
  const seen = new Set<string>();
  for (const t of GLOSSARY_TERMS) {
    if (seen.has(t.slug)) broken.push({ from: t.slug, to: '(duplicate slug)' });
    seen.add(t.slug);
    for (const r of t.related ?? []) {
      if (!BY_SLUG.has(r)) broken.push({ from: t.slug, to: r });
    }
  }
  return broken;
}
