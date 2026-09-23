/**
 * Sourced guidance shared by /scam-database, /scam/:id and the
 * "How to report a crypto scam" page: loss statistics, external checkers,
 * official reporting channels, evidence checklist and FAQs.
 *
 * Figures are from the FBI Internet Crime Complaint Center (IC3) 2025 annual
 * report, released April 2026. Re-check each April when the next report is
 * published.
 */

export const SCAM_GUIDANCE_LAST_VERIFIED = '2026-09-23';

export interface ExternalLink {
  name: string;
  url: string;
  description: string;
}

// ---------------------------------------------------------------------------
// FBI IC3 statistics
// ---------------------------------------------------------------------------

export const IC3_STATS = {
  year: 2025,
  published: 'April 2026',
  reportUrl: 'https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf',
  totalComplaints: 'more than 1 million',
  totalLosses: '$20.9 billion',
  cryptoComplaints: '181,565',
  cryptoLosses: 'more than $11 billion',
  cryptoChange: 'up 22% from 2024',
  recoveryScamComplaints: 'more than 10,500',
  recoveryScamLosses: 'about $1.4 billion',
  kioskComplaints: 'more than 13,400',
  kioskLosses: 'more than $388 million',
  /** Previous year for context */
  prior: {
    year: 2024,
    cryptoLosses: '$9.3 billion',
    reportUrl: 'https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf',
  },
} as const;

/** One-sentence statistic suitable for BLUF text and FAQ answers. */
export const IC3_HEADLINE = `In ${IC3_STATS.year}, Americans filed ${IC3_STATS.cryptoComplaints} cryptocurrency fraud complaints with the FBI’s IC3 reporting ${IC3_STATS.cryptoLosses} in losses, ${IC3_STATS.cryptoChange} and about half of all reported internet-crime losses.`;

// ---------------------------------------------------------------------------
// Check before you send: independent tools
// ---------------------------------------------------------------------------

export const EXTERNAL_CHECKERS: ExternalLink[] = [
  {
    name: 'Chainabuse',
    url: 'https://www.chainabuse.com/',
    description: 'Community reports of scam addresses, domains and tokens across many chains.',
  },
  {
    name: 'Etherscan',
    url: 'https://etherscan.io/',
    description: 'Look up an Ethereum address or contract. Watch for "Phish/Hack" labels and contract verification.',
  },
  {
    name: 'mempool.space',
    url: 'https://mempool.space/',
    description: 'Open-source Bitcoin explorer to check an address’s history before you send.',
  },
  {
    name: 'Revoke.cash',
    url: 'https://revoke.cash/',
    description: 'See and cancel token approvals your wallet has granted, the permission wallet drainers abuse.',
  },
  {
    name: 'ScamSniffer',
    url: 'https://www.scamsniffer.io/',
    description: 'Tracks phishing and wallet-drainer sites and publishes research on active campaigns.',
  },
  {
    name: 'FINRA BrokerCheck',
    url: 'https://brokercheck.finra.org/',
    description: 'Check whether a person or firm offering investments is registered in the U.S.',
  },
  {
    name: 'NFA BASIC',
    url: 'https://www.nfa.futures.org/basicnet/',
    description: 'Check registration of U.S. futures and commodities firms, including some crypto derivatives platforms.',
  },
];

// ---------------------------------------------------------------------------
// Where to report
// ---------------------------------------------------------------------------

export interface ReportingChannel extends ExternalLink {
  when: string;
  region: 'US' | 'International' | 'Industry';
}

export const REPORTING_CHANNELS: ReportingChannel[] = [
  {
    name: 'FBI Internet Crime Complaint Center (IC3)',
    url: 'https://www.ic3.gov/',
    description:
      'The main U.S. federal channel for online and crypto fraud. Include wallet addresses, transaction IDs, amounts and dates.',
    when: 'Any crypto fraud loss or attempted fraud in the U.S.',
    region: 'US',
  },
  {
    name: 'FTC ReportFraud',
    url: 'https://reportfraud.ftc.gov/',
    description: 'Feeds the Consumer Sentinel database used by law enforcement nationwide.',
    when: 'Scams, impersonation, romance and investment fraud.',
    region: 'US',
  },
  {
    name: 'SEC Tips, Complaints and Referrals',
    url: 'https://www.sec.gov/tcr',
    description: 'For fraud involving investments, offerings, trading platforms or market manipulation.',
    when: 'Fake investment platforms, token offerings, pump-and-dumps.',
    region: 'US',
  },
  {
    name: 'CFTC tips and complaints',
    url: 'https://www.cftc.gov/complaint',
    description: 'For commodities and derivatives fraud, which includes many crypto trading schemes.',
    when: 'Crypto trading, forex-style and derivatives schemes.',
    region: 'US',
  },
  {
    name: 'Your state securities regulator (NASAA directory)',
    url: 'https://www.nasaa.org/contact-your-regulator/',
    description: 'State regulators investigate unregistered offerings and advisers in their state.',
    when: 'Investment schemes promoted to you locally or by someone in your state.',
    region: 'US',
  },
  {
    name: 'National Elder Fraud Hotline',
    url: 'https://ovc.ojp.gov/program/elder-fraud-abuse/national-elder-fraud-hotline',
    description: 'U.S. Department of Justice hotline (833-372-8311) that helps people aged 60+ report fraud.',
    when: 'The victim is 60 or older.',
    region: 'US',
  },
  {
    name: 'Report Fraud (UK)',
    url: 'https://www.reportfraud.police.uk/',
    description: 'The UK’s national fraud reporting service, which replaced Action Fraud in December 2025.',
    when: 'You are in England, Wales or Northern Ireland.',
    region: 'International',
  },
  {
    name: 'Canadian Anti-Fraud Centre',
    url: 'https://antifraudcentre-centreantifraude.ca/',
    description: 'Canada’s central fraud reporting service.',
    when: 'You are in Canada.',
    region: 'International',
  },
  {
    name: 'Chainabuse',
    url: 'https://www.chainabuse.com/',
    description: 'Public report that warns other users about the address or site. Not a law-enforcement report.',
    when: 'In addition to the official reports above.',
    region: 'Industry',
  },
];

// ---------------------------------------------------------------------------
// Evidence to keep
// ---------------------------------------------------------------------------

export const EVIDENCE_CHECKLIST: string[] = [
  'Transaction IDs (hashes) for every payment, with dates, amounts and the coin or token.',
  'The wallet addresses you sent to and the address you sent from.',
  'The website address (URL), app name and any download links. Do not revisit the site.',
  'Screenshots of the platform dashboard, balances and withdrawal errors.',
  'Chat logs, emails, text messages, usernames and phone numbers used by the scammer.',
  'Exchange account statements and crypto ATM receipts.',
  'A short timeline in your own words: first contact, each payment, when you realised.',
];

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export interface FaqItem {
  question: string;
  answer: string;
}

export const SCAM_DATABASE_FAQ: FaqItem[] = [
  {
    question: 'How do I check if a crypto wallet address or website is a scam?',
    answer:
      'Search the exact address or domain on Chainabuse and on a block explorer such as Etherscan or mempool.space, and look for news or regulator warnings. No database is complete: a missing record does not mean the address or site is safe. Treat guaranteed returns, pressure to act fast and requests for your seed phrase as red flags on their own.',
  },
  {
    question: 'What does "no match in our records" mean?',
    answer:
      'It means nobody has submitted a verified community report for that exact value here. Scammers create new addresses and domains constantly, so a new scam will have no reports anywhere. It is not a safety rating.',
  },
  {
    question: 'How much money is lost to crypto scams?',
    answer: `${IC3_HEADLINE} Investment fraud, including pig butchering, is the largest category. These figures only cover complaints filed with IC3, so real losses are higher.`,
  },
  {
    question: 'What is the most common crypto scam?',
    answer:
      'By reported losses, crypto investment fraud is the largest category in FBI IC3 data: fake trading platforms, often introduced through relationship-building "pig butchering" contacts. Phishing and wallet drainers, impersonation and crypto-ATM scams are also widespread.',
  },
  {
    question: 'Can I get my crypto back after a scam?',
    answer:
      'Usually not. Blockchain transfers cannot be reversed. Recovery is sometimes possible when funds reach a regulated exchange that can freeze them, which is why reporting quickly to IC3 and the receiving exchange matters. Anyone who charges an upfront fee to recover crypto is almost certainly running a recovery scam.',
  },
  {
    question: 'How are community reports on this site verified?',
    answer:
      'Community reports are submitted by users and start as pending. They are published only after a moderator reviews them, and they remain allegations from the reporter, not findings of fact or legal judgments. Anyone named in a report can dispute it.',
  },
];

export const REPORT_SCAM_FAQ: FaqItem[] = [
  {
    question: 'Where do I report a crypto scam in the United States?',
    answer:
      'File a complaint with the FBI at ic3.gov and with the FTC at ReportFraud.ftc.gov. If the scam involved an investment or trading platform, also send a tip to the SEC (sec.gov/tcr) or the CFTC (cftc.gov/complaint), and contact your state securities regulator.',
  },
  {
    question: 'Will reporting get my money back?',
    answer:
      'Reporting does not guarantee recovery, but it is the only route that can lead to one. Law enforcement uses reports to trace funds, freeze assets at exchanges and build cases. In some cases seized funds are later returned to victims through a court process.',
  },
  {
    question: 'Should I pay a company that says it can recover my crypto?',
    answer: `No. The FBI warns that fake law firms and people impersonating IC3 staff target crypto scam victims with recovery offers. The IC3 does not charge to recover funds and does not refer victims to paid recovery companies. IC3 recorded ${IC3_STATS.recoveryScamComplaints} recovery-scam complaints in ${IC3_STATS.year}, with ${IC3_STATS.recoveryScamLosses} in losses.`,
  },
  {
    question: 'What information should I include in a scam report?',
    answer:
      'Transaction IDs, wallet addresses, amounts and dates for every payment; the website or app used; screenshots; and all messages with the scammer, including usernames and phone numbers. A short written timeline helps investigators.',
  },
  {
    question: 'Should I tell the exchange I sent the money from?',
    answer:
      'Yes, and quickly. Contact the support team of the exchange you sent from, and of the receiving exchange if you know it. Exchanges can sometimes freeze funds that are still in an account they control.',
  },
];
