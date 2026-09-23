/**
 * Curated coin profiles for /coin/:id.
 *
 * Plain-English, dated reference text for the largest, longest-lived coins.
 * Only coins with a profile here are indexable; other CoinGecko ids still
 * render live market data but are marked noindex.
 *
 * Rules for this file:
 * - Facts only, no price predictions or recommendations.
 * - Nothing here depends on live prices; live numbers come from CoinGecko.
 * - Every profile carries `lastVerified`. Update it when you re-check facts.
 *
 * Facts were checked on 2026-09-23 against project documentation and news
 * coverage (e.g. Polkadot Referendum 1710 supply cap, the MATIC→POL migration
 * of 4 Sep 2024, BNB quarterly burn reports, the Aug 2025 end of SEC v. Ripple).
 *
 * NEEDS-OWNER: editorial review of these profiles before relying on them as
 * the site's reviewed position.
 */

export interface CoinFAQ {
  question: string;
  answer: string;
}

export interface CoinProfile {
  /** CoinGecko id, also the URL slug: /coin/{id} */
  id: string;
  name: string;
  symbol: string;
  /** Short category, e.g. "Layer 1 blockchain", "Stablecoin". */
  category: string;
  /** Answer-first summary (1–3 sentences). */
  summary: string;
  /** "What is it?" paragraphs. */
  description: string[];
  /** Launch year (and month when well documented). */
  launched: string;
  /** Consensus / how blocks are produced. */
  consensus: string;
  /** Supply model in plain words. */
  supply: string;
  useCases: string[];
  risks: string[];
  faqs: CoinFAQ[];
  /** Official project site. */
  website: string;
  /** Internal guides that help a reader of this coin page. */
  related: { label: string; path: string }[];
  /** YYYY-MM-DD */
  lastVerified: string;
}

export const COIN_PROFILES_LAST_VERIFIED = '2026-09-23';
const V = COIN_PROFILES_LAST_VERIFIED;

const BUY_GUIDE = { label: 'How to buy crypto safely', path: '/learn/how-to-buy-crypto' };
const WALLET_GUIDE = { label: 'Crypto wallets explained', path: '/learn/crypto-wallets-explained' };
const DCA_GUIDE = { label: 'Dollar-cost averaging strategies', path: '/learn/dca-strategies' };
const RISK_GUIDE = { label: 'Risk management for crypto', path: '/learn/risk-management' };
const DEFI_GUIDE = { label: 'DeFi basics', path: '/learn/defi-basics' };
const DEFI_RISKS = { label: 'DeFi risks', path: '/learn/defi-risks' };
const BLOCKCHAIN_GUIDE = { label: 'Understanding blockchain', path: '/learn/understanding-blockchain' };

export const COIN_PROFILES: CoinProfile[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    category: 'Layer 1 blockchain · Store of value',
    summary:
      'Bitcoin is the first cryptocurrency, launched in January 2009. It runs on a proof-of-work network with a fixed limit of 21 million coins, and most people hold it as a long-term, scarce digital asset.',
    description: [
      'Bitcoin was described in a 2008 white paper by the pseudonymous Satoshi Nakamoto and went live on 3 January 2009. It lets people send value directly to each other without a bank, with transactions recorded on a public ledger that anyone can verify.',
      'New bitcoins are created as a reward for miners, who compete to add blocks roughly every 10 minutes. The reward halves about every four years; the April 2024 halving cut it to 3.125 BTC per block. About 95% of all bitcoin that will ever exist has already been mined.',
    ],
    launched: 'January 2009',
    consensus: 'Proof of work (SHA-256 mining)',
    supply: 'Hard cap of 21 million BTC; new issuance halves roughly every four years (next expected around 2028).',
    useCases: [
      'Long-term savings and a hedge against currency debasement (its main use today)',
      'Borderless payments and remittances, including via the Lightning Network',
      'Collateral and reserve asset for companies, funds and spot ETFs',
    ],
    risks: [
      'Large price swings: drawdowns of 70% or more have happened several times',
      'Lost keys mean lost coins; there is no password reset',
      'Regulation and tax rules vary by country and keep changing',
      'Mining uses a lot of energy, which draws political pressure',
    ],
    faqs: [
      {
        question: 'How many bitcoins will ever exist?',
        answer:
          'At most 21 million. The limit is enforced by the software every node runs, and the issuance schedule means the last fractions will be mined around the year 2140.',
      },
      {
        question: 'What is the Bitcoin halving?',
        answer:
          'Every 210,000 blocks (about four years) the reward for mining a block is cut in half. The most recent halving, in April 2024, reduced it from 6.25 to 3.125 BTC.',
      },
      {
        question: 'Do I have to buy a whole bitcoin?',
        answer:
          'No. One bitcoin divides into 100 million units called satoshis, and most exchanges let you buy a few dollars’ worth.',
      },
      {
        question: 'Where should I keep bitcoin?',
        answer:
          'Small amounts can stay on a reputable exchange, but for larger or long-term holdings many people use a self-custody wallet, ideally a hardware wallet, and keep the recovery phrase offline.',
      },
    ],
    website: 'https://bitcoin.org',
    related: [
      { label: 'What is Bitcoin? Beginner’s guide', path: '/learn/what-is-bitcoin' },
      BUY_GUIDE,
      WALLET_GUIDE,
      DCA_GUIDE,
    ],
    lastVerified: V,
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    category: 'Layer 1 smart-contract platform',
    summary:
      'Ethereum is a programmable blockchain, launched in July 2015, that runs smart contracts and most decentralized finance (DeFi) apps. ETH pays for transactions and is staked to secure the network, which switched to proof of stake in September 2022.',
    description: [
      'Ethereum was proposed by Vitalik Buterin and launched on 30 July 2015. Developers deploy programs (smart contracts) on it to create tokens, stablecoins, lending markets, exchanges and NFTs.',
      'In “the Merge” on 15 September 2022, Ethereum replaced mining with proof of stake: validators lock up 32 ETH to propose and attest to blocks. Since 2021 part of every transaction fee (the base fee) is burned, which offsets new issuance when the network is busy.',
    ],
    launched: 'July 2015',
    consensus: 'Proof of stake (since the Merge, September 2022)',
    supply: 'No fixed maximum. New ETH is issued to stakers while base fees are burned, so net supply can rise or fall.',
    useCases: [
      'Paying transaction fees (“gas”) on Ethereum and many layer-2 networks',
      'Staking to earn protocol rewards',
      'Collateral across DeFi and the base asset for most tokens and stablecoins',
    ],
    risks: [
      'Smart-contract bugs and hacks in apps built on Ethereum',
      'Fees can spike when the network is congested',
      'Competition from other smart-contract chains and from its own layer-2 networks',
      'Staking through third parties adds custody and slashing risk',
    ],
    faqs: [
      {
        question: 'Is ETH supply capped like Bitcoin?',
        answer:
          'No. Ethereum has no hard cap. Issuance goes to stakers, and the base-fee burn removes ETH, so the supply changes with network activity.',
      },
      {
        question: 'What is gas on Ethereum?',
        answer:
          'Gas is the fee you pay, in ETH, for a transaction or contract call. It is priced in gwei (a billionth of an ETH) and rises when demand for block space is high.',
      },
      {
        question: 'Can I stake ETH?',
        answer:
          'Yes. Running your own validator needs 32 ETH; smaller amounts can be staked through exchanges or liquid-staking protocols, each with its own custody and smart-contract risks.',
      },
    ],
    website: 'https://ethereum.org',
    related: [DEFI_GUIDE, WALLET_GUIDE, BUY_GUIDE, { label: 'Gas fee optimizer', path: '/gas-optimizer' }],
    lastVerified: V,
  },
  {
    id: 'tether',
    name: 'Tether',
    symbol: 'USDT',
    category: 'Stablecoin (US dollar)',
    summary:
      'Tether (USDT) is the largest US-dollar stablecoin, launched in 2014. Each token is meant to be redeemable for one dollar and is backed by reserves held by the issuer, Tether; its value depends on trusting that issuer.',
    description: [
      'USDT is issued by Tether and runs on several blockchains, most heavily Tron and Ethereum. Traders use it to move dollars between exchanges quickly and to hold dollar value without leaving crypto.',
      'Tether says its tokens are fully backed, mostly by short-term US Treasury bills, and publishes periodic reserve reports from an accounting firm. In 2021 US regulators fined the company over earlier claims about its reserves.',
    ],
    launched: '2014',
    consensus: 'None of its own: a token issued on other blockchains (Tron, Ethereum and others)',
    supply: 'No cap. Tokens are minted when customers deposit dollars and burned on redemption.',
    useCases: [
      'Trading pair and settlement asset on exchanges',
      'Holding dollar value inside crypto, and cross-border transfers',
      'Collateral in DeFi',
    ],
    risks: [
      'Issuer risk: you rely on Tether’s reserves, solvency and honesty',
      'The issuer can freeze tokens at specific addresses',
      'Short-lived de-pegs have happened in market stress',
      'Stablecoin regulation is changing in the US, EU and elsewhere',
    ],
    faqs: [
      {
        question: 'Is USDT always worth exactly $1?',
        answer:
          'It is designed to be, and usually trades within a cent of $1, but it has briefly traded below that during market stress. Its peg depends on Tether honoring redemptions.',
      },
      {
        question: 'Does holding USDT earn interest?',
        answer:
          'Not by itself. Any yield offered on USDT comes from a platform lending it out, which adds that platform’s risk.',
      },
      {
        question: 'What is the difference between USDT and USDC?',
        answer:
          'Both are dollar stablecoins backed by reserves, but they have different issuers (Tether versus Circle), reserve disclosures and regulatory status.',
      },
    ],
    website: 'https://tether.to',
    related: [RISK_GUIDE, DEFI_RISKS, BUY_GUIDE],
    lastVerified: V,
  },
  {
    id: 'ripple',
    name: 'XRP',
    symbol: 'XRP',
    category: 'Layer 1 payments network',
    summary:
      'XRP is the native asset of the XRP Ledger, a payments-focused blockchain launched in 2012. All 100 billion XRP were created at launch, and the company Ripple holds a large share, part of it in escrow.',
    description: [
      'The XRP Ledger settles transactions in a few seconds using a consensus protocol run by validators, not mining. It has a built-in decentralized exchange and is marketed for cross-border payments.',
      'Ripple, the company most associated with XRP, was sued by the US SEC in 2020. In July 2023 a court ruled that XRP sold on public exchanges was not a securities offering, while some institutional sales were; the appeals were dropped and the case ended in August 2025.',
    ],
    launched: 'June 2012',
    consensus: 'XRP Ledger consensus protocol (validators with trusted lists; no mining)',
    supply: '100 billion XRP created at genesis; no new issuance. A tiny amount is destroyed with every transaction fee. Ripple releases XRP from escrow on a schedule.',
    useCases: [
      'Cross-border payments and liquidity between currencies',
      'Fast, low-fee transfers between exchanges',
      'Tokens and stablecoins issued on the XRP Ledger',
    ],
    risks: [
      'Concentrated ownership: Ripple and its founders hold large amounts',
      'Price depends heavily on news about Ripple and regulation',
      'Real payment use by banks is smaller than marketing suggests',
    ],
    faqs: [
      {
        question: 'Is Ripple the same as XRP?',
        answer:
          'No. Ripple is a company; XRP is the asset of the XRP Ledger, an open network Ripple helped create and still promotes.',
      },
      {
        question: 'Is the SEC case against Ripple over?',
        answer:
          'Yes. After a 2023 ruling and a 2025 settlement process, both sides dropped their appeals and the court dismissed them in August 2025.',
      },
      {
        question: 'Can more XRP be created?',
        answer:
          'No. The 100 billion XRP were created when the ledger launched, and the total slowly falls as transaction fees are destroyed.',
      },
    ],
    website: 'https://xrpl.org',
    related: [BUY_GUIDE, WALLET_GUIDE, RISK_GUIDE],
    lastVerified: V,
  },
  {
    id: 'binancecoin',
    name: 'BNB',
    symbol: 'BNB',
    category: 'Exchange token · Layer 1',
    summary:
      'BNB is the token of the Binance ecosystem and BNB Chain, first sold in 2017. It pays fees on BNB Smart Chain and gives discounts on Binance, and its supply shrinks through quarterly burns toward a target of 100 million.',
    description: [
      'BNB launched in 2017 as a token sold to fund the Binance exchange. It now powers BNB Chain, whose BNB Smart Chain is an Ethereum-compatible network with low fees and a small set of validators.',
      'Binance burns BNB every quarter using a published formula. Total supply started at 200 million and was about 133 million after the July 2026 burn.',
    ],
    launched: 'July 2017',
    consensus: 'Proof of Staked Authority on BNB Smart Chain (a limited set of staked validators)',
    supply: 'Started at 200 million; quarterly burns aim to reduce it to 100 million (about 133 million as of mid-2026).',
    useCases: [
      'Gas fees on BNB Smart Chain',
      'Trading-fee discounts and launchpad access on Binance',
      'DeFi and payments within the BNB Chain ecosystem',
    ],
    risks: [
      'Tied closely to one company, Binance, and its regulatory standing',
      'Fewer validators than more decentralized chains',
      'Hacks and scams on BNB Smart Chain apps',
    ],
    faqs: [
      {
        question: 'What is the BNB burn?',
        answer:
          'Each quarter BNB is sent to an unusable address based on a formula tied to price and block production, permanently reducing the supply toward 100 million.',
      },
      {
        question: 'Do I need Binance to use BNB?',
        answer:
          'No. BNB can be held in a self-custody wallet and used on BNB Smart Chain without a Binance account, though the exchange is its biggest venue.',
      },
      {
        question: 'Is BNB Smart Chain the same as Ethereum?',
        answer:
          'No, but it is compatible with Ethereum tools and wallets, so many apps run on both. It trades some decentralization for lower fees.',
      },
    ],
    website: 'https://www.bnbchain.org',
    related: [BUY_GUIDE, DEFI_RISKS, WALLET_GUIDE],
    lastVerified: V,
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    category: 'Layer 1 smart-contract platform',
    summary:
      'Solana is a high-throughput proof-of-stake blockchain whose mainnet beta launched in March 2020. SOL pays for transactions and is staked to secure the network; fees are usually a fraction of a cent.',
    description: [
      'Solana was founded by Anatoly Yakovenko and uses a clock called Proof of History alongside proof of stake to order transactions quickly. It is popular for trading, payments, NFTs and new token launches.',
      'SOL has no maximum supply. Inflation started at 8% a year and falls each year toward a long-term floor of 1.5%, and part of every transaction fee is burned.',
    ],
    launched: 'March 2020 (mainnet beta)',
    consensus: 'Proof of stake with Proof of History',
    supply: 'No hard cap; annual inflation declines each year toward 1.5%. Part of each fee is burned.',
    useCases: [
      'Low-cost payments and stablecoin transfers',
      'Decentralized exchanges and trading apps',
      'Staking SOL for rewards',
    ],
    risks: [
      'The network has had several full outages (for example in 2021, 2022 and February 2024)',
      'Running a validator needs expensive hardware, which limits who can take part',
      'Many tokens launched on Solana are highly speculative or scams',
    ],
    faqs: [
      {
        question: 'Why are Solana fees so low?',
        answer:
          'Solana processes many transactions in parallel with fast block times, so block space is plentiful. Fees can rise for priority during busy periods.',
      },
      {
        question: 'Can I stake SOL?',
        answer:
          'Yes. You can delegate SOL to a validator from most Solana wallets and earn a share of inflation rewards, with no fixed minimum beyond account fees.',
      },
      {
        question: 'Has Solana ever gone down?',
        answer:
          'Yes. The network halted several times between 2021 and 2024 and was restarted by validators. Reliability has improved, but it remains a known risk.',
      },
    ],
    website: 'https://solana.com',
    related: [BUY_GUIDE, WALLET_GUIDE, { label: 'Staking calculator', path: '/staking-calculator' }],
    lastVerified: V,
  },
  {
    id: 'usd-coin',
    name: 'USD Coin',
    symbol: 'USDC',
    category: 'Stablecoin (US dollar)',
    summary:
      'USDC is a US-dollar stablecoin issued by Circle since 2018. Each token is backed by cash and short-term US Treasuries and can be redeemed for one dollar through Circle.',
    description: [
      'USDC runs natively on many blockchains, including Ethereum and Solana. Circle publishes monthly reserve reports, and most reserves are held in a fund managed by BlackRock.',
      'In March 2023 USDC briefly fell to about $0.87 after Circle disclosed $3.3 billion of reserves at the failed Silicon Valley Bank; it recovered once US authorities guaranteed that bank’s deposits.',
    ],
    launched: 'September 2018',
    consensus: 'None of its own: issued on other blockchains (Ethereum, Solana and others)',
    supply: 'No cap. Minted when dollars are deposited with Circle and burned on redemption.',
    useCases: [
      'Dollar payments and savings in crypto wallets',
      'Settlement on exchanges and in DeFi',
      'Cross-border transfers',
    ],
    risks: [
      'Issuer and banking risk, as the 2023 de-peg showed',
      'Circle can freeze tokens at specific addresses',
      'Yield offered on USDC comes from lending it out, which adds counterparty risk',
    ],
    faqs: [
      {
        question: 'Is USDC safer than USDT?',
        answer:
          'USDC publishes more detailed reserve reports and is issued by a US-regulated company, but it still carries issuer and banking risk, as March 2023 showed.',
      },
      {
        question: 'Who can redeem USDC for dollars?',
        answer:
          'Circle redeems directly for verified business customers; most individuals redeem by selling USDC for dollars on an exchange.',
      },
      {
        question: 'Why did USDC lose its peg in 2023?',
        answer:
          'Part of its reserves were deposited at Silicon Valley Bank when it failed. The price recovered after regulators guaranteed the bank’s deposits.',
      },
    ],
    website: 'https://www.circle.com/usdc',
    related: [RISK_GUIDE, DEFI_GUIDE, BUY_GUIDE],
    lastVerified: V,
  },
  {
    id: 'dogecoin',
    name: 'Dogecoin',
    symbol: 'DOGE',
    category: 'Payments · Meme coin',
    summary:
      'Dogecoin began as a joke in December 2013 and became one of the most widely held cryptocurrencies. It is a proof-of-work coin with no supply cap, issuing 10,000 new DOGE per block.',
    description: [
      'Created by Billy Markus and Jackson Palmer, Dogecoin is based on Litecoin’s code and uses Scrypt mining. Since 2014 it has been merge-mined with Litecoin, which shares security between the two.',
      'Blocks come about once a minute, and the fixed reward adds roughly 5 billion DOGE a year, so the percentage inflation slowly falls over time.',
    ],
    launched: 'December 2013',
    consensus: 'Proof of work (Scrypt, merge-mined with Litecoin)',
    supply: 'No cap; a fixed 10,000 DOGE per block (about 5 billion a year).',
    useCases: ['Tipping and small payments', 'Community and cultural uses', 'Speculative trading'],
    risks: [
      'Price is driven largely by social media and celebrity attention',
      'Unlimited supply means ongoing dilution',
      'Little development activity compared with smart-contract platforms',
    ],
    faqs: [
      {
        question: 'Does Dogecoin have a maximum supply?',
        answer: 'No. It adds a fixed 10,000 DOGE every block with no end date.',
      },
      {
        question: 'Is Dogecoin related to Shiba Inu?',
        answer:
          'Only by theme. Shiba Inu is a separate token on Ethereum that copied the dog meme; Dogecoin has its own blockchain.',
      },
      {
        question: 'Can Dogecoin run smart contracts?',
        answer: 'Not in any meaningful way. It is a simple payments chain, similar to Litecoin.',
      },
    ],
    website: 'https://dogecoin.com',
    related: [RISK_GUIDE, BUY_GUIDE, WALLET_GUIDE],
    lastVerified: V,
  },
  {
    id: 'tron',
    name: 'TRON',
    symbol: 'TRX',
    category: 'Layer 1 smart-contract platform',
    summary:
      'TRON is a delegated proof-of-stake blockchain founded by Justin Sun, with its mainnet live since 2018. It is best known as the main network for moving Tether (USDT) cheaply.',
    description: [
      'TRON raised money in a 2017 token sale and launched its own mainnet in 2018. Blocks are produced by 27 “Super Representatives” elected by TRX holders who stake (freeze) their tokens.',
      'Most of TRON’s activity is stablecoin transfers, especially USDT, because fees are low when users stake TRX for network resources.',
    ],
    launched: '2018 (mainnet)',
    consensus: 'Delegated proof of stake (27 elected Super Representatives)',
    supply: 'No fixed cap; new TRX is issued to block producers and some fees are burned.',
    useCases: ['Stablecoin (USDT) transfers', 'Paying for network bandwidth and energy', 'DeFi on TRON'],
    risks: [
      'Block production is concentrated in a small elected group',
      'Strong influence of its founder and related entities',
      'Stablecoin transfers on TRON are frequently used in scams, so be careful with unknown contacts',
    ],
    faqs: [
      {
        question: 'Why is USDT on TRON so popular?',
        answer:
          'Transfers are fast and cheap compared with Ethereum, which made TRON the default network for moving USDT between exchanges and people.',
      },
      {
        question: 'What are Super Representatives?',
        answer:
          'The 27 block producers elected by TRX holders. They validate transactions and earn rewards, which they often share with voters.',
      },
      {
        question: 'Do I need TRX to send USDT on TRON?',
        answer:
          'Yes, some TRX (or staked TRX for “energy”) is needed to pay network fees, even when sending a token.',
      },
    ],
    website: 'https://tron.network',
    related: [BUY_GUIDE, WALLET_GUIDE, RISK_GUIDE],
    lastVerified: V,
  },
  {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    category: 'Layer 1 smart-contract platform',
    summary:
      'Cardano is a proof-of-stake blockchain launched in September 2017 and co-founded by Charles Hoskinson. It is known for a research-driven approach, and ADA has a maximum supply of 45 billion.',
    description: [
      'Cardano uses the Ouroboros proof-of-stake protocol. ADA holders delegate to stake pools without locking their coins. Smart contracts arrived in September 2021 (the Alonzo upgrade).',
      'On-chain governance, letting ADA holders vote on treasury spending and upgrades, was introduced with the Chang hard fork in September 2024.',
    ],
    launched: 'September 2017',
    consensus: 'Proof of stake (Ouroboros)',
    supply: 'Maximum 45 billion ADA; the remainder is released gradually as staking rewards.',
    useCases: ['Staking via stake pools', 'Smart contracts and DeFi', 'On-chain governance'],
    risks: [
      'Smaller app and DeFi ecosystem than Ethereum or Solana',
      'Development has historically moved slower than roadmaps suggested',
      'Price volatility typical of large altcoins',
    ],
    faqs: [
      {
        question: 'Is staked ADA locked?',
        answer:
          'No. Delegating ADA to a stake pool keeps it in your wallet and you can move it at any time.',
      },
      {
        question: 'What is the maximum supply of ADA?',
        answer: '45 billion ADA. Most already exists; the rest is paid out slowly as staking rewards.',
      },
      {
        question: 'Who runs Cardano?',
        answer:
          'Independent stake-pool operators produce blocks. Development is led by several organizations, and since 2024 ADA holders can vote on governance actions.',
      },
    ],
    website: 'https://cardano.org',
    related: [BUY_GUIDE, WALLET_GUIDE, { label: 'Staking calculator', path: '/staking-calculator' }],
    lastVerified: V,
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    category: 'Oracle network (token on Ethereum)',
    summary:
      'Chainlink is a network of “oracles” that feeds outside data, such as asset prices, to smart contracts. LINK, launched in 2017 with a fixed supply of 1 billion, pays node operators and can be staked.',
    description: [
      'Smart contracts cannot see data outside their blockchain on their own. Chainlink’s node operators fetch and agree on that data, most famously the price feeds used by lending and trading apps.',
      'LINK is an ERC-20 token on Ethereum and is bridged to other chains. Its mainnet went live in 2019; staking for LINK holders began in 2022.',
    ],
    launched: 'September 2017 (token sale); mainnet 2019',
    consensus: 'None of its own: a token on Ethereum; oracle reports are signed by independent node operators',
    supply: 'Fixed 1 billion LINK total; circulating supply grows as the team and reserves release tokens.',
    useCases: ['Price feeds for DeFi', 'Cross-chain messaging (CCIP)', 'Paying and staking with node operators'],
    risks: [
      'Large holdings by the team and project reserves can be sold into the market',
      'Demand for LINK does not automatically follow usage of Chainlink services',
      'A faulty or manipulated data feed could affect many apps at once',
    ],
    faqs: [
      {
        question: 'What is a blockchain oracle?',
        answer:
          'A service that brings outside information, such as prices or weather, onto a blockchain so smart contracts can use it.',
      },
      {
        question: 'Does Chainlink have its own blockchain?',
        answer: 'No. LINK is a token on Ethereum, and Chainlink services run across many blockchains.',
      },
      {
        question: 'Can more LINK be created?',
        answer: 'No. The total supply is fixed at 1 billion; circulating supply rises as locked tokens are released.',
      },
    ],
    website: 'https://chain.link',
    related: [DEFI_GUIDE, DEFI_RISKS, BUY_GUIDE],
    lastVerified: V,
  },
  {
    id: 'avalanche-2',
    name: 'Avalanche',
    symbol: 'AVAX',
    category: 'Layer 1 smart-contract platform',
    summary:
      'Avalanche is a proof-of-stake blockchain platform launched in September 2020. Its C-Chain runs Ethereum-compatible apps with fast finality, and AVAX has a maximum supply of 720 million.',
    description: [
      'Avalanche was built by Ava Labs, founded by Emin Gün Sirer. It uses the Avalanche (Snow) family of consensus protocols, where validators repeatedly sample each other to agree within about a second or two.',
      'Projects can launch their own chains (“Avalanche L1s”, formerly subnets). Transaction fees on the main network are burned.',
    ],
    launched: 'September 2020',
    consensus: 'Proof of stake (Avalanche/Snow consensus)',
    supply: 'Maximum 720 million AVAX; fees are burned.',
    useCases: ['DeFi on the C-Chain', 'Custom chains for games and institutions', 'Staking AVAX'],
    risks: [
      'Competition from many other Ethereum-compatible chains',
      'Token unlocks and staking rewards add supply',
      'Bridge and app hacks, as on any smart-contract chain',
    ],
    faqs: [
      {
        question: 'Is Avalanche compatible with Ethereum wallets?',
        answer: 'Yes. The C-Chain works with Ethereum wallets such as MetaMask once the network is added.',
      },
      {
        question: 'What is the AVAX maximum supply?',
        answer: '720 million AVAX. Because fees are burned, the supply may never reach that number.',
      },
      {
        question: 'How fast are Avalanche transactions?',
        answer: 'Transactions on the C-Chain typically become final in about one to two seconds.',
      },
    ],
    website: 'https://www.avax.network',
    related: [DEFI_GUIDE, BUY_GUIDE, WALLET_GUIDE],
    lastVerified: V,
  },
  {
    id: 'stellar',
    name: 'Stellar',
    symbol: 'XLM',
    category: 'Layer 1 payments network',
    summary:
      'Stellar is an open payments network launched in 2014 for moving money and issuing assets such as stablecoins cheaply. XLM pays small network fees and has a fixed supply of about 50 billion after a 2019 burn.',
    description: [
      'Stellar was co-founded by Jed McCaleb and is supported by the non-profit Stellar Development Foundation. Validators reach agreement with the Stellar Consensus Protocol, a federated voting system rather than mining.',
      'In 2019 the network ended inflation and the foundation burned about half of the XLM supply, leaving roughly 50 billion.',
    ],
    launched: '2014',
    consensus: 'Stellar Consensus Protocol (federated Byzantine agreement)',
    supply: 'About 50 billion XLM; no new issuance since 2019.',
    useCases: ['Cross-border payments and remittances', 'Issuing stablecoins and tokenized assets', 'Low-cost transfers'],
    risks: [
      'The Stellar Development Foundation holds a large share of XLM',
      'Crowded market for payment-focused chains',
      'Adoption by payment companies is gradual',
    ],
    faqs: [
      {
        question: 'Is Stellar related to XRP?',
        answer:
          'They share history: Jed McCaleb co-founded Ripple before starting Stellar, and both target payments. They are separate networks.',
      },
      {
        question: 'Can new XLM be created?',
        answer: 'No. Inflation was switched off by a network vote in 2019.',
      },
      {
        question: 'What is Stellar used for?',
        answer: 'Moving money across borders and issuing digital versions of assets, including USDC and other stablecoins.',
      },
    ],
    website: 'https://stellar.org',
    related: [BUY_GUIDE, WALLET_GUIDE, BLOCKCHAIN_GUIDE],
    lastVerified: V,
  },
  {
    id: 'bitcoin-cash',
    name: 'Bitcoin Cash',
    symbol: 'BCH',
    category: 'Payments (Bitcoin fork)',
    summary:
      'Bitcoin Cash split from Bitcoin on 1 August 2017 to allow much larger blocks for cheaper payments. It keeps Bitcoin’s 21 million cap and proof-of-work mining.',
    description: [
      'The fork came out of the “block size war”: supporters wanted bigger blocks so everyday payments stay cheap on-chain, instead of relying on second layers like Lightning.',
      'Anyone holding bitcoin at the fork received the same amount of BCH. It uses SHA-256 mining, so it shares miners with Bitcoin, and it had its own halving in April 2024.',
    ],
    launched: 'August 2017 (hard fork of Bitcoin)',
    consensus: 'Proof of work (SHA-256)',
    supply: 'Hard cap of 21 million BCH, same schedule as Bitcoin.',
    useCases: ['Low-fee peer-to-peer payments', 'Merchant payments'],
    risks: [
      'Much lower hash power than Bitcoin, so in theory easier to attack',
      'Smaller developer and merchant community',
      'Further splits have happened before (Bitcoin SV in 2018)',
    ],
    faqs: [
      {
        question: 'Is Bitcoin Cash the same as Bitcoin?',
        answer: 'No. It is a separate coin that shares Bitcoin’s history up to August 2017.',
      },
      {
        question: 'Why was Bitcoin Cash created?',
        answer: 'To raise the block size limit so more transactions fit on-chain and fees stay low.',
      },
      {
        question: 'Does Bitcoin Cash have a supply cap?',
        answer: 'Yes, 21 million BCH, with halvings roughly every four years like Bitcoin.',
      },
    ],
    website: 'https://bitcoincash.org',
    related: [{ label: 'What is Bitcoin?', path: '/learn/what-is-bitcoin' }, BUY_GUIDE, WALLET_GUIDE],
    lastVerified: V,
  },
  {
    id: 'litecoin',
    name: 'Litecoin',
    symbol: 'LTC',
    category: 'Payments',
    summary:
      'Litecoin is one of the oldest cryptocurrencies, launched in October 2011 by Charlie Lee as a faster, lighter version of Bitcoin. It has 2.5-minute blocks and a cap of 84 million LTC.',
    description: [
      'Litecoin copied Bitcoin’s design but changed the mining algorithm to Scrypt and made blocks four times as frequent. It has often been a test bed for upgrades later used on Bitcoin, such as SegWit.',
      'Its block reward halves about every four years; the August 2023 halving cut it to 6.25 LTC. The optional MWEB upgrade (2022) added private transactions.',
    ],
    launched: 'October 2011',
    consensus: 'Proof of work (Scrypt)',
    supply: 'Hard cap of 84 million LTC; halvings about every four years.',
    useCases: ['Payments with faster confirmation than Bitcoin', 'Low-fee transfers between exchanges'],
    risks: [
      'Less distinct role now that many chains offer cheap payments',
      'Slow development and limited new features',
      'Price volatility',
    ],
    faqs: [
      {
        question: 'How is Litecoin different from Bitcoin?',
        answer:
          'Blocks are every 2.5 minutes instead of 10, it uses Scrypt mining, and its cap is 84 million instead of 21 million.',
      },
      {
        question: 'When is the next Litecoin halving?',
        answer: 'The last one was in August 2023; halvings come every 840,000 blocks, so the next is expected around mid-to-late 2027.',
      },
      {
        question: 'Is Litecoin private?',
        answer: 'Not by default. The optional MWEB feature lets users make confidential transactions.',
      },
    ],
    website: 'https://litecoin.org',
    related: [BUY_GUIDE, WALLET_GUIDE, { label: 'What is Bitcoin?', path: '/learn/what-is-bitcoin' }],
    lastVerified: V,
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    category: 'Layer 0 / multi-chain network',
    summary:
      'Polkadot is a proof-of-stake network, live since May 2020, that connects many specialised blockchains under shared security. Holders voted in 2025 to cap DOT at 2.1 billion, with lower issuance starting March 2026.',
    description: [
      'Polkadot was founded by Ethereum co-founder Gavin Wood. A central “relay chain” secures connected chains (parachains, now also called rollups), which can pass messages to each other.',
      'Governance is fully on-chain: DOT holders vote on upgrades and treasury spending. Referendum 1710 set a 2.1 billion supply cap, and from 14 March 2026 yearly issuance was cut roughly in half.',
    ],
    launched: 'May 2020',
    consensus: 'Nominated proof of stake',
    supply: 'Capped at 2.1 billion DOT (about 1.6 billion existed when the cap was approved); issuance steps down every two years.',
    useCases: ['Staking and nominating validators', 'On-chain governance', 'Paying for blockspace on connected chains'],
    risks: [
      'Parachain and app adoption has been slower than expected',
      'Complex architecture that is still changing',
      'Staking rewards fall as issuance is cut',
    ],
    faqs: [
      {
        question: 'Does DOT have a maximum supply?',
        answer: 'Yes, since the 2.1 billion cap approved by Polkadot governance (Referendum 1710) took effect in 2026.',
      },
      {
        question: 'What is a parachain?',
        answer:
          'A blockchain that connects to Polkadot’s relay chain to share its security and exchange messages with other connected chains.',
      },
      {
        question: 'Can I stake DOT?',
        answer: 'Yes, by nominating validators or joining a nomination pool from a Polkadot wallet. Unstaking takes a waiting period.',
      },
    ],
    website: 'https://polkadot.com',
    related: [BLOCKCHAIN_GUIDE, BUY_GUIDE, { label: 'Staking calculator', path: '/staking-calculator' }],
    lastVerified: V,
  },
  {
    id: 'shiba-inu',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    category: 'Meme coin (token on Ethereum)',
    summary:
      'Shiba Inu (SHIB) is a meme token launched in August 2020 on Ethereum, inspired by Dogecoin. It has hundreds of trillions of tokens in circulation, so each one is worth a tiny fraction of a cent.',
    description: [
      'SHIB was created by an anonymous developer known as “Ryoshi” with a supply of one quadrillion tokens. Half were sent to Vitalik Buterin, who in 2021 burned most of them and donated the rest.',
      'The project has since added a decentralized exchange and Shibarium, a layer-2 network launched in 2023.',
    ],
    launched: 'August 2020',
    consensus: 'None of its own: an ERC-20 token on Ethereum (Shibarium L2 settles to Ethereum)',
    supply: 'About 589 trillion SHIB circulating after burns; no minting.',
    useCases: ['Speculation and community', 'Trading within the Shiba Inu ecosystem'],
    risks: [
      'Value driven almost entirely by hype and sentiment',
      'Large holders can move the price sharply',
      'Many copycat tokens and scams use the SHIB name',
    ],
    faqs: [
      {
        question: 'Why is SHIB so cheap per token?',
        answer:
          'Because there are hundreds of trillions of tokens. The price per token says nothing about value; market cap is the number to compare.',
      },
      {
        question: 'Can Shiba Inu reach $1?',
        answer:
          'At today’s supply, $1 per SHIB would mean a market value far larger than the entire world economy, so it is not realistic without burning almost all tokens.',
      },
      {
        question: 'Is Shiba Inu the same as Dogecoin?',
        answer: 'No. Dogecoin is its own blockchain; SHIB is a token on Ethereum that borrowed the meme.',
      },
    ],
    website: 'https://shibatoken.com',
    related: [RISK_GUIDE, { label: 'Common crypto mistakes', path: '/learn/common-crypto-mistakes' }, BUY_GUIDE],
    lastVerified: V,
  },
  {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    category: 'Layer 1 smart-contract platform',
    summary:
      'Sui is a proof-of-stake blockchain launched in May 2023 by Mysten Labs, a team of former Meta engineers. It uses the Move programming language, and SUI has a maximum supply of 10 billion.',
    description: [
      'Sui treats assets as objects, which lets many transactions run in parallel and settle in under a second. Smart contracts are written in Move, a language designed to make asset handling safer.',
      'Only part of the 10 billion SUI circulates; the rest unlocks on a schedule to investors, the team and the foundation.',
    ],
    launched: 'May 2023',
    consensus: 'Delegated proof of stake',
    supply: 'Maximum 10 billion SUI, released gradually through scheduled unlocks.',
    useCases: ['DeFi and trading apps', 'Games and digital collectibles', 'Staking SUI'],
    risks: [
      'Large scheduled token unlocks add selling pressure',
      'Young network with a short track record',
      'In May 2025 validators froze funds stolen in a hack of a Sui exchange, showing they can coordinate interventions',
    ],
    faqs: [
      {
        question: 'What is the Move language?',
        answer:
          'A smart-contract language first developed at Meta for the Diem project. It makes it harder to accidentally copy or lose assets in code.',
      },
      {
        question: 'What is the SUI maximum supply?',
        answer: '10 billion SUI. A large share is still locked and unlocks over several years.',
      },
      {
        question: 'Can I stake SUI?',
        answer: 'Yes, by delegating to a validator from a Sui wallet; rewards are paid each epoch (about a day).',
      },
    ],
    website: 'https://sui.io',
    related: [DEFI_GUIDE, BUY_GUIDE, WALLET_GUIDE],
    lastVerified: V,
  },
  {
    id: 'hedera-hashgraph',
    name: 'Hedera',
    symbol: 'HBAR',
    category: 'Public ledger (hashgraph)',
    summary:
      'Hedera is a public network using hashgraph consensus rather than a traditional blockchain, open to the public since 2019. It is governed by a council of large organisations, and all 50 billion HBAR were created at launch.',
    description: [
      'Hedera’s hashgraph algorithm reaches agreement through a “gossip about gossip” protocol with fast finality and low, fixed-dollar fees. Nodes are run by members of the Hedera Council, a group of companies and universities.',
      'Its services include token issuance, a consensus/logging service used by businesses, and Ethereum-compatible smart contracts.',
    ],
    launched: '2018 (mainnet); open access September 2019',
    consensus: 'Hashgraph (asynchronous Byzantine fault tolerant) with proof of stake',
    supply: '50 billion HBAR created at genesis; released into circulation over time.',
    useCases: ['Enterprise logging and audit trails', 'Tokenization and payments', 'Staking HBAR'],
    risks: [
      'Governed by a council of large organisations, which is less decentralised',
      'Large amounts of HBAR are still held by the treasury',
      'Enterprise interest does not always become real usage',
    ],
    faqs: [
      {
        question: 'Is Hedera a blockchain?',
        answer: 'Technically it is a distributed ledger using a hashgraph data structure rather than a chain of blocks.',
      },
      {
        question: 'Who controls Hedera?',
        answer: 'The Hedera Council, a group of organisations that run nodes and vote on network decisions.',
      },
      {
        question: 'Can more HBAR be created?',
        answer: 'No. All 50 billion were created at launch; circulating supply rises as the treasury releases them.',
      },
    ],
    website: 'https://hedera.com',
    related: [BLOCKCHAIN_GUIDE, BUY_GUIDE, WALLET_GUIDE],
    lastVerified: V,
  },
  {
    id: 'polygon-ecosystem-token',
    name: 'Polygon',
    symbol: 'POL',
    category: 'Ethereum scaling network',
    summary:
      'POL is the token of Polygon, a network that makes Ethereum-style transactions cheaper. It replaced MATIC as Polygon PoS’s gas and staking token on 4 September 2024, and about 99% of MATIC has since migrated.',
    description: [
      'Polygon started in 2017 as Matic Network and launched its proof-of-stake chain in 2020. It is compatible with Ethereum wallets and apps and is widely used for payments and real-world-asset tokens.',
      'POL started with a 10 billion supply swapped 1:1 from MATIC and adds 2% a year: 1% for validator rewards and 1% for a community treasury.',
    ],
    launched: '2020 (Polygon PoS as Matic); POL since September 2024',
    consensus: 'Proof of stake (validators stake POL on Ethereum)',
    supply: 'Started at 10 billion POL with 2% yearly emission (1% validators, 1% community treasury).',
    useCases: ['Gas fees on Polygon PoS', 'Staking to secure Polygon', 'Payments and tokenized assets'],
    risks: [
      'Ongoing 2% emission dilutes holders',
      'Heavy competition from other Ethereum layer-2 networks',
      'Bridges between Polygon and Ethereum add technical risk',
    ],
    faqs: [
      {
        question: 'What happened to MATIC?',
        answer:
          'MATIC was upgraded to POL on 4 September 2024. Tokens on Polygon PoS converted automatically; MATIC on Ethereum and exchanges migrates 1:1.',
      },
      {
        question: 'Is Polygon a layer 2?',
        answer:
          'Polygon PoS is a separate proof-of-stake chain that checkpoints to Ethereum. Polygon also builds zero-knowledge scaling technology.',
      },
      {
        question: 'Does POL have a maximum supply?',
        answer: 'No hard cap. It started at 10 billion and grows about 2% a year under the current rules.',
      },
    ],
    website: 'https://polygon.technology',
    related: [DEFI_GUIDE, { label: 'Gas fee optimizer', path: '/gas-optimizer' }, BUY_GUIDE],
    lastVerified: V,
  },
];

const PROFILE_MAP = new Map(COIN_PROFILES.map((p) => [p.id, p]));

/** CoinGecko ids with a curated profile. Use for the sitemap: /coin/{id}. */
export const CURATED_COIN_IDS: string[] = COIN_PROFILES.map((p) => p.id);

export function getCoinProfile(id: string | undefined): CoinProfile | undefined {
  return id ? PROFILE_MAP.get(id) : undefined;
}

export function isCuratedCoin(id: string | undefined): boolean {
  return !!id && PROFILE_MAP.has(id);
}
