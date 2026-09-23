/**
 * Common crypto scam types: static, sourced reference content.
 *
 * This is the baseline body of /scam-database. It renders without a database,
 * so the page always has something true and useful to say even when the
 * community report store is unavailable.
 *
 * Every entry links to at least one government or regulator page describing
 * the scheme. Descriptions are general patterns, not claims about any named
 * business or person.
 */

import type { ScamType } from '../types/admin-database';

export interface SourceLink {
  label: string;
  url: string;
}

export interface ScamTypeInfo {
  /** Anchor id on /scam-database, e.g. /scam-database#pig-butchering */
  slug: string;
  name: string;
  /** Other names people search for */
  aliases: string[];
  /** One or two sentence definition (answer-first) */
  summary: string;
  howItWorks: string[];
  redFlags: string[];
  whatToDo: string[];
  sources: SourceLink[];
  /** Community-report categories (scam_reports.scam_type) that map to this explainer */
  reportTypes: ScamType[];
}

const FTC_CRYPTO: SourceLink = {
  label: 'FTC: What to know about cryptocurrency and scams',
  url: 'https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-scams',
};
const IC3_CRYPTO: SourceLink = {
  label: 'FBI IC3: Cryptocurrency fraud information',
  url: 'https://www.ic3.gov/CrimeInfo/Cryptocurrency',
};
const CFTC_FAKE_SITES: SourceLink = {
  label: 'CFTC: Watch out for fraudulent digital asset trading websites',
  url: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/watch_out_for_digital_fraud.html',
};

const SEC_CRYPTO_ALERT: SourceLink = {
  label: 'SEC Investor Alert: 5 ways fraudsters lure victims into crypto scams',
  url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/crypto-scams',
};

export const SCAM_TYPES_LAST_REVIEWED = '2026-09-23';

export const SCAM_TYPES: ScamTypeInfo[] = [
  {
    slug: 'pig-butchering',
    name: 'Pig butchering (relationship investment scam)',
    aliases: ['relationship investment scam', 'sha zhu pan', 'wrong-number text scam'],
    summary:
      'A scammer builds trust over weeks or months, often starting with a "wrong number" text or a dating or social-media contact, then steers the victim into a fake crypto investment platform that shows invented profits until the money is gone.',
    howItWorks: [
      'Contact starts casually: a misdirected text, a dating match, a LinkedIn or WhatsApp message.',
      'The "friend" mentions their success trading crypto and offers to teach you.',
      'You are sent to a trading website or app that looks professional. Small early withdrawals may work to build confidence.',
      'The dashboard shows large gains, so you deposit more. When you try to withdraw, you are told to pay "taxes", "fees" or a "security deposit" first.',
      'The balance was never real. Deposits went straight to the scammers’ wallets.',
    ],
    redFlags: [
      'Someone you have never met in person is coaching you on investments.',
      'The platform is not one you found yourself, or its app is not in an official app store.',
      'Returns look steady and far above market rates.',
      'You must pay a fee or tax before you can withdraw.',
      'Pressure to keep the relationship and the investment secret from family.',
    ],
    whatToDo: [
      'Stop sending money. No further payment will unlock a withdrawal.',
      'Save the chat history, the website address, wallet addresses and transaction IDs.',
      'Report to the FBI at ic3.gov and to the FTC at ReportFraud.ftc.gov.',
      'Expect follow-up "recovery" offers. They are a second scam.',
    ],
    sources: [
      IC3_CRYPTO,
      {
        label: 'CFTC: Customer advisory on relationship investment scams',
        url: 'https://www.cftc.gov/PressRoom/PressReleases/8859-24',
      },
    ],
    reportTypes: ['fake_exchange', 'ponzi'],
  },
  {
    slug: 'fake-investment-platforms',
    name: 'Fake exchanges and investment platforms',
    aliases: ['fake crypto exchange', 'fake trading app', 'crypto investment scam'],
    summary:
      'A website or app that imitates a crypto exchange, trading bot or "AI arbitrage" service. It accepts deposits, displays fabricated balances and never lets you withdraw.',
    howItWorks: [
      'Ads, social-media posts or a contact promote a platform promising guaranteed or unusually high returns.',
      'The site may copy the look of a real exchange or use a name close to a real firm.',
      'Account balances are numbers in a database the scammer controls, not assets on a blockchain.',
      'Withdrawals are blocked with invented fees, "verification" steps or account freezes.',
    ],
    redFlags: [
      'Guaranteed returns, or daily or weekly percentage payouts.',
      'The domain was registered recently or differs by a letter from a known brand.',
      'No verifiable registration with a regulator where you live.',
      'Customer support only through chat apps.',
      'You were asked to deposit crypto to a personal wallet address.',
    ],
    whatToDo: [
      'Check registration: FINRA BrokerCheck, the SEC, the CFTC or NFA, or your state securities regulator.',
      'Search the exact domain on Chainabuse and in news reports before depositing.',
      'If you already deposited, stop, collect evidence and report to IC3, the FTC and the SEC or CFTC.',
    ],
    sources: [CFTC_FAKE_SITES, FTC_CRYPTO],
    reportTypes: ['fake_exchange'],
  },
  {
    slug: 'rug-pulls',
    name: 'Rug pulls',
    aliases: ['exit scam', 'honeypot token', 'liquidity pull'],
    summary:
      'The creators of a token or DeFi project attract buyers, then drain the liquidity pool, mint unlimited tokens or disable selling, leaving holders with tokens that cannot be sold.',
    howItWorks: [
      'A new token launches with heavy social-media promotion and a roadmap.',
      'Early price gains draw in buyers who swap ETH, SOL or stablecoins for the token.',
      'Developers keep hidden powers in the contract: minting, blacklisting, changeable taxes, or control of the liquidity.',
      'They remove the liquidity or sell a large hidden allocation, and the price collapses to near zero.',
    ],
    redFlags: [
      'Anonymous team and unverified or unaudited contract code.',
      'Liquidity is not locked, or the lock is short.',
      'A few wallets hold most of the supply.',
      'You can buy but test sells fail, or sell taxes are extreme (a "honeypot").',
      'Hype built on celebrity or meme branding with no product.',
    ],
    whatToDo: [
      'Before buying, check holder concentration and contract permissions on a block explorer.',
      'Revoke token approvals you gave the project.',
      'Report the contract address to Chainabuse and to IC3 if you lost money.',
    ],
    sources: [
      SEC_CRYPTO_ALERT,
      IC3_CRYPTO,
    ],
    reportTypes: ['rug_pull', 'fake_ico'],
  },
  {
    slug: 'phishing-wallet-drainers',
    name: 'Phishing and wallet drainers',
    aliases: ['approval phishing', 'drainer kit', 'seed phrase phishing', 'fake wallet support'],
    summary:
      'Fake websites, emails, ads and "support" accounts trick you into typing your seed phrase or signing a transaction that gives the attacker permission to move your tokens.',
    howItWorks: [
      'You land on a copy of a real site through a search ad, a reply to your social post, a Discord message or an email.',
      'The site asks you to "connect wallet" and sign a message or approval, or to enter your recovery phrase to "fix" or "validate" the wallet.',
      'A signed approval or permit lets a drainer contract move your tokens later, without asking again.',
      'Funds are swept within minutes and moved through mixers or bridges.',
    ],
    redFlags: [
      'Anyone asking for your seed phrase or private key. Legitimate services never do.',
      'Urgent messages: "your wallet is compromised", "claim before it expires".',
      'Unsolicited support contact after you asked a question in public.',
      'A signature request you do not understand, especially unlimited approvals or "Permit" signatures.',
      'Search ads that sit above the real site.',
    ],
    whatToDo: [
      'If you entered a seed phrase, treat that wallet as lost: move any remaining funds to a brand-new wallet with a new phrase.',
      'If you signed an approval, revoke it with a token-approval checker, then move funds.',
      'Report the phishing URL to the site you were impersonating, to Chainabuse, and to IC3.',
    ],
    sources: [
      FTC_CRYPTO,
      {
        label: 'FBI IC3: Cyber criminals using social engineering techniques',
        url: 'https://www.ic3.gov/PSA/2024/PSA240411',
      },
    ],
    reportTypes: ['phishing'],
  },
  {
    slug: 'address-poisoning',
    name: 'Address poisoning',
    aliases: ['address spoofing', 'zero-value transfer scam', 'lookalike address'],
    summary:
      'An attacker sends a tiny or zero-value transfer from an address that starts and ends with the same characters as one you use, hoping you copy it from your transaction history next time you send funds.',
    howItWorks: [
      'Bots watch the chain for wallets that send funds regularly.',
      'They generate a lookalike address that matches the first and last few characters of your usual recipient.',
      'They send a dust or zero-value token transfer so the lookalike appears in your wallet history.',
      'Next time you copy "the usual address" from history, you send funds to the attacker.',
    ],
    redFlags: [
      'Unexpected tiny or zero-value transfers in your history.',
      'Tokens you never bought appearing in your wallet.',
      'Two addresses in your history that look identical at a glance.',
    ],
    whatToDo: [
      'Never copy recipient addresses from transaction history. Use a saved address book entry.',
      'Check the full address, not only the first and last characters.',
      'Send a small test transaction for large transfers.',
      'Blockchain transfers cannot be reversed; report losses to IC3 and to the exchange that received the funds.',
    ],
    sources: [IC3_CRYPTO],
    reportTypes: ['phishing', 'other'],
  },
  {
    slug: 'recovery-scams',
    name: 'Recovery scams',
    aliases: ['fund recovery scam', 'fake crypto recovery service', 'fake law firm', 'IC3 impersonation'],
    summary:
      'People who already lost money are contacted by "recovery experts", fake law firms or impostors claiming to be from the FBI or IC3, who promise to get the funds back for an upfront fee.',
    howItWorks: [
      'Victim lists are shared between scam groups, or victims find "recovery" ads after posting online.',
      'The contact claims to work with the FBI, a regulator or a court, sometimes with fake badges or letters.',
      'They ask for a fee, a "tax" or your wallet access to release the recovered funds.',
      'Nothing is recovered; the victim loses more.',
    ],
    redFlags: [
      'Any upfront payment to recover stolen crypto.',
      'Unsolicited contact that already knows about your loss.',
      'Claims of government affiliation. The IC3 does not charge to recover funds and does not refer victims to paid recovery firms.',
      'Requests for your seed phrase or remote access to your computer.',
    ],
    whatToDo: [
      'Do not pay. Hang up, and contact agencies only through their official websites.',
      'Report the recovery contact to IC3 as a separate complaint.',
    ],
    sources: [
      {
        label: 'FBI IC3: Fictitious law firms targeting crypto scam victims (2025)',
        url: 'https://www.ic3.gov/PSA/2025/PSA250813',
      },
      {
        label: 'FBI IC3: Scammers impersonating the IC3 (2026)',
        url: 'https://www.ic3.gov/PSA/2026/PSA260720',
      },
    ],
    reportTypes: ['impersonation'],
  },
  {
    slug: 'impersonation-giveaways',
    name: 'Impersonation and giveaway scams',
    aliases: ['double your crypto', 'celebrity giveaway', 'government impersonation', 'crypto ATM scam'],
    summary:
      'Scammers pose as a celebrity, a company, a bank, a government agency or tech support, and tell you to send crypto: to "double" it in a giveaway, pay a fine, or "protect" your money. They often direct victims to crypto ATMs.',
    howItWorks: [
      'A deepfake video, hacked verified account or livestream promises to send back twice what you send.',
      'Or a caller claiming to be your bank, the police or a government agency says your money is at risk and must be moved.',
      'You are told to withdraw cash and feed it into a crypto kiosk, scanning a QR code they provide.',
    ],
    redFlags: [
      'Anyone who asks you to pay a bill, fine or "safe account" in crypto.',
      'Instructions to use a crypto ATM while someone stays on the phone with you.',
      'Promises to multiply crypto you send.',
      'Pressure, secrecy and threats of arrest.',
    ],
    whatToDo: [
      'Hang up and call the organisation on a number you look up yourself.',
      'Contact the crypto kiosk operator immediately with your receipt; some can flag transactions.',
      'Report to the FTC and IC3.',
    ],
    sources: [FTC_CRYPTO],
    reportTypes: ['impersonation'],
  },
  {
    slug: 'romance-scams',
    name: 'Romance scams',
    aliases: ['dating app crypto scam', 'online romance fraud'],
    summary:
      'A fake online partner builds an emotional relationship, then asks for crypto for an emergency, travel, or a shared investment. It often overlaps with pig butchering.',
    howItWorks: [
      'Contact starts on a dating app or social media with attractive, stolen photos.',
      'The partner avoids video calls or meeting in person.',
      'Requests start small (a medical bill, a ticket) and grow, often paid in crypto or gift cards.',
    ],
    redFlags: [
      'You have never met or video-called them.',
      'They quickly profess strong feelings and move the chat off the platform.',
      'Any request for money, especially in crypto.',
    ],
    whatToDo: [
      'Do not send money. Talk to a trusted friend or family member.',
      'Report the profile to the platform and report the loss to the FTC and IC3.',
    ],
    sources: [
      {
        label: 'CFTC: Customer advisory on romance fraud',
        url: 'https://www.cftc.gov/PressRoom/PressReleases/8859-24',
      },
      FTC_CRYPTO,
    ],
    reportTypes: ['other'],
  },
  {
    slug: 'pump-and-dump',
    name: 'Pump-and-dump schemes',
    aliases: ['crypto pump group', 'shill coin'],
    summary:
      'Organisers buy a thinly traded token, hype it through paid promoters or group chats to push the price up, then sell to the buyers they attracted.',
    howItWorks: [
      'Insiders accumulate a small-cap token cheaply.',
      'Coordinated posts, paid influencers or "signal" groups announce the token is about to explode.',
      'New buyers push the price up; insiders sell into that demand.',
      'The price falls back once the promotion stops, leaving late buyers with losses.',
    ],
    redFlags: [
      'Countdown "pump" calls in Telegram or Discord groups.',
      'Influencers promoting a token without disclosing that they were paid.',
      'Sudden volume and price spikes with no news.',
    ],
    whatToDo: [
      'Treat urgent "buy now" calls as marketing, not advice.',
      'Report suspected manipulation to the SEC or CFTC tip lines.',
    ],
    sources: [
      SEC_CRYPTO_ALERT,
      {
        label: 'SEC Investor Alert: Group chats as a gateway to investment scams',
        url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/gateway-to-investment-scams',
      },
    ],
    reportTypes: ['pump_dump'],
  },
  {
    slug: 'fake-airdrops',
    name: 'Fake airdrops and free tokens',
    aliases: ['airdrop scam', 'NFT airdrop scam', 'claim token scam'],
    summary:
      'Unknown tokens or NFTs appear in your wallet with a link to "claim" or "redeem" them. The claim site is a drainer that asks for approvals or your seed phrase.',
    howItWorks: [
      'Attackers send tokens or NFTs to many wallets at once.',
      'The token name or image contains a website address.',
      'Visiting the site and connecting your wallet triggers a malicious approval or asks for your recovery phrase.',
    ],
    redFlags: [
      'Tokens or NFTs you did not buy, especially with a URL in the name.',
      '"Claim" pages that need your seed phrase or a wallet approval.',
      'Deadlines pushing you to act fast.',
    ],
    whatToDo: [
      'Ignore or hide unknown tokens. Do not interact with them or visit their links.',
      'If you connected and signed, revoke approvals and move funds to a new wallet.',
    ],
    sources: [
      {
        label: 'FBI IC3: NFT airdrops disguised as free rewards (2025)',
        url: 'https://www.ic3.gov/PSA/2025/PSA250603',
      },
    ],
    reportTypes: ['phishing'],
  },
  {
    slug: 'sim-swap',
    name: 'SIM swapping',
    aliases: ['SIM hijacking', 'port-out fraud'],
    summary:
      'A criminal convinces or bribes a mobile carrier to move your phone number to their SIM card, then uses SMS codes to take over your exchange and email accounts.',
    howItWorks: [
      'The attacker gathers your personal details from data leaks and social media.',
      'They pose as you to the carrier, or use an insider, to port your number.',
      'Your phone suddenly loses service; the attacker receives your texts.',
      'They reset passwords with SMS codes and withdraw crypto from exchange accounts.',
    ],
    redFlags: [
      'Your phone unexpectedly shows "No service" or "SOS only".',
      'Password-reset or login alerts you did not request.',
      'Publicly advertising that you hold crypto.',
    ],
    whatToDo: [
      'Contact your carrier immediately from another phone; ask for a port-out or SIM lock.',
      'Switch exchange and email logins from SMS codes to an authenticator app or security key.',
      'Report to IC3 and to the exchanges involved.',
    ],
    sources: [
      {
        label: 'FBI IC3: Criminals increasing SIM swap schemes',
        url: 'https://www.ic3.gov/PSA/2022/PSA220208/',
      },
    ],
    reportTypes: ['other'],
  },
];

/** Explainer for a community report category, used on /scam/:id */
export function getScamTypeForReport(type: ScamType): ScamTypeInfo | undefined {
  // Explicit preferred mapping, so each category points at its closest explainer
  const preferred: Partial<Record<ScamType, string>> = {
    phishing: 'phishing-wallet-drainers',
    ponzi: 'fake-investment-platforms',
    rug_pull: 'rug-pulls',
    fake_ico: 'rug-pulls',
    impersonation: 'impersonation-giveaways',
    fake_exchange: 'fake-investment-platforms',
    pump_dump: 'pump-and-dump',
  };
  const slug = preferred[type];
  return slug ? SCAM_TYPES.find((t) => t.slug === slug) : undefined;
}
