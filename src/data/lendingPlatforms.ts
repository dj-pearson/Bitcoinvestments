/**
 * Static, dated facts for /lending. Everything here is either widely
 * documented public record or deliberately qualitative. Rates are NOT stored
 * here: DeFi rates come live from /api/yields (DefiLlama); CeFi rates are
 * tier-dependent and change often, so we point readers to the provider.
 */

export const LENDING_LAST_REVIEWED = '2026-09-23';

export interface CeFiCollapse {
  name: string;
  froze: string;
  bankruptcy: string;
  summary: string;
}

/** The 2022 CeFi lender failures (dates from court filings and company notices). */
export const CEFI_COLLAPSES: CeFiCollapse[] = [
  {
    name: 'Celsius Network',
    froze: 'June 12, 2022',
    bankruptcy: 'July 13, 2022 (Chapter 11)',
    summary:
      'Promised high yields while taking concentrated, illiquid bets with customer deposits. Froze withdrawals for about 1.7 million users. Its founder was later convicted of fraud and sentenced to 12 years in prison.',
  },
  {
    name: 'Voyager Digital',
    froze: 'July 1, 2022',
    bankruptcy: 'July 5, 2022 (Chapter 11)',
    summary:
      'Lent a large share of customer assets to the hedge fund Three Arrows Capital, which defaulted. US regulators said Voyager had wrongly implied customer funds were FDIC insured.',
  },
  {
    name: 'BlockFi',
    froze: 'November 10, 2022',
    bankruptcy: 'November 28, 2022 (Chapter 11)',
    summary:
      'Survived the mid-2022 crash through a credit line from FTX, then failed when FTX collapsed. Had already paid $100 million in 2022 to settle SEC and state charges over its interest accounts.',
  },
  {
    name: 'Genesis Global Capital',
    froze: 'November 16, 2022',
    bankruptcy: 'January 19, 2023 (Chapter 11)',
    summary:
      'A large institutional lender hit by the Three Arrows and FTX failures. Its freeze also locked the savings of Gemini Earn customers, whose deposits Gemini had lent to Genesis.',
  },
];

export const CEFI_LESSONS: Array<{ title: string; body: string }> = [
  {
    title: 'Your coins are lent out on terms you cannot see',
    body:
      'CeFi lenders re-lend (rehypothecate) deposits to trading firms and other borrowers. You do not see who borrowed, how much collateral they posted, or how concentrated the book is.',
  },
  {
    title: 'Withdrawals can be frozen overnight',
    body:
      'Every one of these firms paused withdrawals first and filed for bankruptcy days or weeks later. Terms of service usually allow this.',
  },
  {
    title: 'No FDIC or SIPC protection',
    body:
      'Crypto deposits at a lender are not bank deposits. In bankruptcy, depositors are generally unsecured creditors and wait in line, sometimes for years, for a partial recovery.',
  },
  {
    title: '"Insured" rarely means what it sounds like',
    body:
      'Where a platform mentions insurance, it typically covers specific events such as theft from a custodian, not the lender\'s own losses or insolvency. Read the policy scope before relying on it.',
  },
];

export interface DeFiLendingProtocol {
  name: string;
  /** DefiLlama project slugs used to match /api/yields pools. */
  llamaSlugs: string[];
  url: string;
  description: string;
}

export const DEFI_LENDING_PROTOCOLS: DeFiLendingProtocol[] = [
  {
    name: 'Aave',
    llamaSlugs: ['aave-v3'],
    url: 'https://aave.com',
    description:
      'The largest DeFi lending market, running on Ethereum and many layer 2s. Pooled markets: every depositor of an asset earns the same variable rate, set by a utilization curve.',
  },
  {
    name: 'Compound',
    llamaSlugs: ['compound-v3'],
    url: 'https://compound.finance',
    description:
      'One of the original DeFi lending protocols. Version 3 ("Comet") uses separate markets, each with a single borrowable asset such as USDC, and several accepted collateral assets.',
  },
  {
    name: 'Morpho',
    llamaSlugs: ['morpho-blue', 'morpho-v1'],
    url: 'https://morpho.org',
    description:
      'Isolated lending markets plus "vaults" run by third-party curators who choose which markets to lend into. Rates and risk vary a lot by vault and curator.',
  },
  {
    name: 'Spark',
    llamaSlugs: ['sparklend'],
    url: 'https://spark.fi',
    description:
      'SparkLend is a lending market connected to the Sky (formerly MakerDAO) ecosystem, focused on DAI/USDS and ETH-based collateral.',
  },
];

export interface CeFiPlatformNote {
  name: string;
  url: string;
  facts: string[];
  usAvailability: string;
  rates: string;
}

/**
 * CeFi platforms: only verified, dated facts. No trust scores, no insurance
 * or licensing claims we cannot source.
 * NEEDS-OWNER: add further CeFi platforms only with dated, sourced facts; if an
 * affiliate relationship exists, link with rel="sponsored" and disclose it.
 */
export const CEFI_PLATFORMS: CeFiPlatformNote[] = [
  {
    name: 'Nexo',
    url: 'https://nexo.com',
    facts: [
      'Stopped serving US customers in late 2022 after failing to agree terms with state and federal regulators over its Earn Interest Product.',
      'In January 2023 agreed to pay $45 million in penalties ($22.5 million to the SEC and $22.5 million to state regulators) over that unregistered product.',
      'Announced its return to the US market on April 28, 2025.',
    ],
    usAvailability:
      'Announced a US relaunch in 2025; which products are offered can differ by state. Check the provider before signing up.',
    rates:
      'Variable and tier-dependent: advertised top rates usually require a loyalty tier, holding the NEXO token, or fixed terms. See the provider for current rates.',
  },
];

export interface StablecoinNote {
  symbol: string;
  status: 'current' | 'legacy';
  note: string;
}

export const STABLECOINS: StablecoinNote[] = [
  { symbol: 'USDC', status: 'current', note: 'Issued by Circle, backed by cash and short-term US Treasuries. The deepest lending markets in DeFi.' },
  { symbol: 'USDT', status: 'current', note: 'Issued by Tether; the largest stablecoin by supply. Reserve disclosures are attestations, not full audits.' },
  { symbol: 'DAI / USDS', status: 'current', note: 'Crypto-collateralized stablecoins from Sky (formerly MakerDAO). USDS is the upgraded form of DAI; both remain in use.' },
  { symbol: 'BUSD', status: 'legacy', note: 'Paxos stopped minting BUSD in February 2023 at the direction of New York regulators. Treat it as wound down.' },
  { symbol: 'TUSD', status: 'legacy', note: 'Lost its dollar peg in early 2024 amid questions about its reserves. Not recommended for new deposits.' },
];

export const LENDING_FAQS = [
  {
    question: 'Is crypto lending safe?',
    answer:
      'No form of crypto lending is risk-free and none is FDIC insured. DeFi lending risks smart-contract bugs, oracle failures and bad debt; CeFi lending adds the risk that the company itself fails, as Celsius, Voyager, BlockFi and Genesis did in 2022-23. Only lend what you could afford to have locked up or lost.',
  },
  {
    question: 'What is the difference between CeFi and DeFi lending?',
    answer:
      'CeFi (centralized) lenders are companies: you hand them your coins, they set the rate and decide whom to lend to. DeFi (decentralized) lending runs on public smart contracts such as Aave or Compound: rates are set by supply and demand, and every loan, its collateral and liquidations are visible on-chain. DeFi removes company risk but adds smart-contract risk and requires managing your own wallet.',
  },
  {
    question: 'Why do DeFi lending rates change so much?',
    answer:
      'Rates follow utilization, the share of a pool that is borrowed. Most markets have a "kink": below a target utilization rates rise slowly, above it they rise steeply to attract deposits and push borrowers to repay. When many traders borrow stablecoins at once, supply rates can jump for days.',
  },
  {
    question: 'What happened to Celsius, BlockFi and Voyager?',
    answer:
      'All three froze customer withdrawals and filed for Chapter 11 bankruptcy in 2022 (Celsius and Voyager in July, BlockFi in November after FTX collapsed). Genesis followed in January 2023. Customers became creditors in bankruptcy and recovered their funds only partially and slowly.',
  },
  {
    question: 'What is LTV and when do I get liquidated?',
    answer:
      'Loan-to-value is how much you borrow relative to your collateral. Each market has a liquidation threshold; if your debt grows past that share of your collateral\'s value (for example because the collateral price falls), anyone can repay part of your loan and take some collateral at a discount. Borrowing well below the maximum leaves room for price swings.',
  },
  {
    question: 'Where do the DeFi rates on this page come from?',
    answer:
      'From DefiLlama\'s free yields dataset, filtered to Aave, Compound, Morpho and Spark markets with at least $10 million deposited, cached on our server for about an hour. The snapshot time is shown above the table.',
  },
];
