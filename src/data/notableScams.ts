/**
 * Notable documented crypto fraud cases.
 *
 * Inclusion rule: every entry is backed by a primary government source (a
 * Department of Justice, SEC or FBI release) linked in `sourceUrl`. The
 * summaries restate only what that source says. Where a case is at the charge
 * stage, the text says so: an indictment or complaint is an allegation and
 * defendants are presumed innocent unless and until proven guilty.
 *
 * NEEDS-OWNER: editorial review of this list before promoting it further.
 */

export type CaseStatus = 'Sentenced' | 'Convicted' | 'Charged' | 'Civil charges';

export interface NotableScamCase {
  id: string;
  name: string;
  /** Explainer slug in src/data/scamTypes.ts */
  scamTypeSlug: string;
  /** Scheme category in plain words */
  category: string;
  /** Loss or amount figure as stated by the source */
  amount: string;
  jurisdiction: string;
  status: CaseStatus;
  /** Date of the referenced government action (ISO) */
  actionDate: string;
  summary: string;
  lesson: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const NOTABLE_SCAMS_LAST_VERIFIED = '2026-09-23';

export const NOTABLE_SCAMS: NotableScamCase[] = [
  {
    id: 'prince-group',
    name: 'Prince Group scam compounds',
    scamTypeSlug: 'pig-butchering',
    category: 'Pig butchering from forced-labour compounds',
    amount: 'About 127,271 BTC (roughly $15 billion) subject to a civil forfeiture complaint',
    jurisdiction: 'U.S. (E.D.N.Y.)',
    status: 'Charged',
    actionDate: '2025-10-14',
    summary:
      'The Justice Department unsealed an indictment charging Chen Zhi, chairman of Cambodia-based Prince Holding Group, with wire fraud conspiracy and money laundering conspiracy over crypto investment ("pig butchering") schemes run from forced-labour compounds, and filed what it described as the largest forfeiture action in its history. The charges are allegations.',
    lesson: 'Pig butchering is run at industrial scale. The person messaging you may be working under coercion from a script.',
    sourceLabel: 'U.S. Department of Justice press release',
    sourceUrl:
      'https://www.justice.gov/opa/pr/chairman-prince-group-indicted-operating-cambodian-forced-labor-scam-compounds-engaged',
  },
  {
    id: 'onecoin',
    name: 'OneCoin',
    scamTypeSlug: 'fake-investment-platforms',
    category: 'Fraudulent cryptocurrency sold through multi-level marketing',
    amount: 'Over $4 billion invested by victims worldwide (per DOJ)',
    jurisdiction: 'U.S. (S.D.N.Y.)',
    status: 'Sentenced',
    actionDate: '2023-09-12',
    summary:
      'Co-founder Karl Sebastian Greenwood was sentenced to 20 years in prison and ordered to forfeit $300 million. Prosecutors described OneCoin as a fraudulent cryptocurrency marketed through a global multi-level-marketing network. Co-founder Ruja Ignatova was added to the FBI Ten Most Wanted list in June 2022.',
    lesson: 'Returns that depend on recruiting new buyers, for a coin you cannot withdraw to your own wallet, are a warning sign.',
    sourceLabel: 'U.S. Attorney’s Office, S.D.N.Y.',
    sourceUrl:
      'https://www.justice.gov/usao-sdny/pr/co-founder-multibillion-dollar-cryptocurrency-scheme-onecoin-sentenced-20-years-prison',
  },
  {
    id: 'ftx',
    name: 'FTX',
    scamTypeSlug: 'fake-investment-platforms',
    category: 'Misappropriation of exchange customer funds',
    amount: 'Billions in customer funds; over $1.7B from investors and $1.3B from lenders (per DOJ)',
    jurisdiction: 'U.S. (S.D.N.Y.)',
    status: 'Sentenced',
    actionDate: '2024-03-28',
    summary:
      'FTX founder Samuel Bankman-Fried was sentenced to 25 years in prison after a jury convicted him of wire fraud and conspiracy counts for misappropriating FTX customer deposits and defrauding investors and lenders.',
    lesson: 'Assets left on any exchange depend on that company. Self-custody removes that counterparty risk.',
    sourceLabel: 'U.S. Department of Justice press release',
    sourceUrl:
      'https://www.justice.gov/archives/opa/pr/samuel-bankman-fried-sentenced-25-years-his-orchestration-multiple-fraudulent-schemes',
  },
  {
    id: 'bitconnect',
    name: 'BitConnect',
    scamTypeSlug: 'fake-investment-platforms',
    category: 'Alleged Ponzi "lending program"',
    amount: '$2.4 billion (per the indictment)',
    jurisdiction: 'U.S. (S.D. Cal.)',
    status: 'Charged',
    actionDate: '2022-02-25',
    summary:
      'A federal grand jury indicted BitConnect founder Satish Kumbhani, alleging that the "lending program" and its claimed trading bot were a Ponzi scheme paying earlier investors with later investors’ money. The charges are allegations.',
    lesson: 'Fixed daily returns from a secret "trading bot" are the signature of a Ponzi scheme.',
    sourceLabel: 'U.S. Department of Justice press release',
    sourceUrl: 'https://www.justice.gov/archives/opa/pr/bitconnect-founder-indicted-global-24-billion-cryptocurrency-scheme',
  },
  {
    id: 'forsage',
    name: 'Forsage',
    scamTypeSlug: 'fake-investment-platforms',
    category: 'Alleged smart-contract pyramid and Ponzi scheme',
    amount: 'More than $300 million raised (per the SEC)',
    jurisdiction: 'U.S. (SEC civil action)',
    status: 'Civil charges',
    actionDate: '2022-08-01',
    summary:
      'The SEC charged 11 people, including Forsage’s four founders and U.S. promoters, alleging the platform was a pyramid and Ponzi scheme run through smart contracts that raised over $300 million from millions of retail investors.',
    lesson: '"It runs on a smart contract" does not make a recruitment-based payout scheme legitimate.',
    sourceLabel: 'SEC press release 2022-134',
    sourceUrl: 'https://www.sec.gov/newsroom/press-releases/2022-134',
  },
  {
    id: 'safemoon',
    name: 'SafeMoon',
    scamTypeSlug: 'rug-pulls',
    category: 'Misappropriation of a token’s liquidity pool',
    amount: 'Over $9 million in crypto diverted (per DOJ)',
    jurisdiction: 'U.S. (E.D.N.Y.)',
    status: 'Sentenced',
    actionDate: '2026-02-10',
    summary:
      'SafeMoon CEO Braden John Karony was sentenced to 100 months in prison after a jury convicted him in May 2025 of securities fraud, wire fraud and money laundering conspiracy for diverting crypto from the token’s liquidity pool for personal use.',
    lesson: 'Whoever controls a project’s liquidity pool can take it. Check who holds those keys before buying.',
    sourceLabel: 'U.S. Attorney’s Office, E.D.N.Y.',
    sourceUrl:
      'https://www.justice.gov/usao-edny/pr/ceo-digital-asset-company-safemoon-sentenced-100-months-prison-multi-million-dollar',
  },
];
