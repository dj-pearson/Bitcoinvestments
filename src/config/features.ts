/**
 * Account-backed features and what their "coming soon" page says.
 *
 * Every route that needs an account or the database is wrapped in
 * <FeatureGate feature="...">. While accounts are off (see staticMode.ts), or
 * the database is unreachable or older than this build expects, the gate
 * renders <ComingSoon feature="..."> with the copy below instead.
 *
 * `ready: false` keeps a feature dark in production even with accounts on,
 * because the page has no real data source yet. It still renders in local
 * development (`import.meta.env.DEV`) so it can be worked on.
 */

export type FeatureKey =
  | 'login'
  | 'signup'
  | 'password-reset'
  | 'profile'
  | 'report-scam'
  | 'affiliate-stats'
  | 'ad-manager'
  | 'tax-reports'
  | 'advisor'
  | 'affiliate'
  | 'portfolio-analysis'
  | 'developer-portal'
  | 'advertiser'
  | 'multi-exchange';

export interface FeatureLink {
  to: string;
  label: string;
}

export interface FeatureInfo {
  /** Page title; SEO.tsx appends " | Bitcoinvestments", so keep it ≤ 41 chars. */
  title: string;
  /** Meta description, 120–160 characters. */
  description: string;
  /** The page's single H1. */
  heading: string;
  /** Answer-first summary: what this is and why it is not available yet. */
  summary: string;
  /** What the feature will do once it opens. */
  plans: string[];
  /** Things on the site that already help with the same job. */
  alternatives: FeatureLink[];
  /** False while the page has no real backend; see the note above. */
  ready: boolean;
}

const ACCOUNTS_NOTE =
  'Accounts are not open yet. The guides, calculators and comparisons on this site work without one.';

export const FEATURES: Record<FeatureKey, FeatureInfo> = {
  login: {
    title: 'Sign In (Coming Soon)',
    description:
      'Bitcoinvestments accounts are not open yet. Everything else on the site works without signing in. Join the waitlist to hear when accounts launch.',
    heading: 'Sign-in is not open yet',
    summary: `${ACCOUNTS_NOTE} Join the newsletter below to hear when sign-in opens.`,
    plans: [
      'Save your portfolio and price alerts across devices',
      'Keep your calculator inputs and course progress in one place',
      'Optional two-factor authentication on every account',
    ],
    alternatives: [
      { to: '/dashboard', label: 'Track prices on the market dashboard' },
      { to: '/calculators', label: 'Use the calculators (no account needed)' },
      { to: '/learn', label: 'Read the beginner guides' },
    ],
    ready: true,
  },
  signup: {
    title: 'Create an Account (Soon)',
    description:
      'Bitcoinvestments accounts are not open yet. The guides, calculators and comparisons are free without one. Join the waitlist to hear when sign-up opens.',
    heading: 'Account sign-up is not open yet',
    summary: `${ACCOUNTS_NOTE} Join the newsletter below to hear when sign-up opens.`,
    plans: [
      'A free account to sync your portfolio and alerts between devices',
      'Email price alerts for the coins you follow',
      'Saved progress through the courses',
    ],
    alternatives: [
      { to: '/learn', label: 'Start with the beginner guides' },
      { to: '/compare', label: 'Compare exchanges and wallets' },
      { to: '/calculators', label: 'Try the calculators' },
    ],
    ready: true,
  },
  'password-reset': {
    title: 'Password Reset (Coming Soon)',
    description:
      'Password reset is part of Bitcoinvestments accounts, which are not open yet. No account has been created for you, so there is nothing to reset.',
    heading: 'Password reset is not available yet',
    summary:
      'Accounts are not open yet, so there is no password to reset. If you received a reset email that claims to be from us, do not click it.',
    plans: ['Secure email-based password reset once accounts open'],
    alternatives: [
      { to: '/learn/common-crypto-mistakes', label: 'How to spot phishing and other common mistakes' },
      { to: '/scam-database', label: 'Browse the scam database' },
    ],
    ready: true,
  },
  profile: {
    title: 'Your Profile (Coming Soon)',
    description:
      'Profiles, saved settings and two-factor authentication arrive with Bitcoinvestments accounts, which are not open yet. Join the waitlist for launch news.',
    heading: 'Profiles are not available yet',
    summary: `${ACCOUNTS_NOTE} Your profile will hold your settings, alerts and security options once they open.`,
    plans: [
      'Account settings and email preferences',
      'Two-factor authentication and active-session management',
      'Subscription and billing management',
    ],
    alternatives: [
      { to: '/dashboard', label: 'Market dashboard' },
      { to: '/learn/crypto-wallets-explained', label: 'Keeping your crypto secure' },
    ],
    ready: true,
  },
  'report-scam': {
    title: 'Report a Scam (Coming Soon)',
    description:
      'Submitting scam reports needs an account, and accounts are not open yet. You can still search the scam database and report fraud to the authorities.',
    heading: 'Scam reporting opens with accounts',
    summary:
      'Submitting a report to our database needs an account, which is not open yet. If you have lost money, report it to the authorities now rather than waiting for us.',
    plans: [
      'Submit a scam report with evidence for moderator review',
      'Vote on and discuss reports from other readers',
    ],
    alternatives: [
      { to: '/scam-database', label: 'Search the scam database' },
      { to: '/learn/common-crypto-mistakes', label: 'Common crypto mistakes and scams' },
    ],
    ready: true,
  },
  'affiliate-stats': {
    title: 'Affiliate Statistics (Admin)',
    description:
      'Affiliate click and conversion statistics are an internal tool for site administrators and are only available when the site database is connected.',
    heading: 'Affiliate statistics are not available',
    summary:
      'This is an internal reporting screen for site administrators. It needs the site database, which is not connected on this deployment.',
    plans: ['Click and conversion reporting for partner links'],
    alternatives: [{ to: '/compare', label: 'Compare exchanges and wallets' }],
    ready: true,
  },
  'ad-manager': {
    title: 'Ad Manager (Admin)',
    description:
      'The ad manager is an internal tool for site administrators and is only available when the site database is connected. Readers do not need it.',
    heading: 'The ad manager is not available',
    summary:
      'This is an internal screen for site administrators. It needs the site database, which is not connected on this deployment.',
    plans: ['Create, schedule and pause the ads shown on the site'],
    alternatives: [{ to: '/learn', label: 'Read the guides' }],
    ready: true,
  },
  'tax-reports': {
    title: 'Crypto Tax Reports (Soon)',
    description:
      'Downloadable crypto tax reports (Form 8949 data and TXF export) need an account, which is not open yet. Learn how crypto is taxed in the meantime.',
    heading: 'Tax reports are coming with accounts',
    summary:
      'Tax report downloads need an account so your transactions can be stored, and accounts are not open yet. Our tax guide and calculator explain how gains are worked out today.',
    plans: [
      'Capital gains summary from the transactions in your portfolio',
      'Form 8949-style CSV and TXF export for tax software',
      'FIFO, LIFO and highest-cost-first comparisons',
    ],
    alternatives: [
      { to: '/learn/crypto-taxes-basics', label: 'Crypto tax basics guide' },
      { to: '/calculators', label: 'Crypto tax calculator' },
    ],
    ready: true,
  },
  advisor: {
    title: 'Advisor Dashboard (Soon)',
    description:
      'A dashboard for financial advisors to view client crypto portfolios is planned. It is not built yet. Join the waitlist to hear when it is ready.',
    heading: 'The advisor dashboard is not built yet',
    summary:
      'We are planning a dashboard for advisors who manage client crypto allocations. It has no live data behind it yet, so it stays closed until it does.',
    plans: [
      'Client list with read-only access to the portfolios they share',
      'Allocation and performance summaries per client',
    ],
    alternatives: [
      { to: '/learn/portfolio-rebalancing', label: 'Portfolio rebalancing guide' },
      { to: '/learn/risk-management', label: 'Risk management guide' },
    ],
    ready: false,
  },
  affiliate: {
    title: 'Creator Affiliate Program (Soon)',
    description:
      'Our affiliate program for creators is not open yet. Applications need an account. Join the waitlist to hear when applications open.',
    heading: 'The creator affiliate program is not open yet',
    summary:
      'Applications for the creator affiliate program need an account, which is not open yet. Join the waitlist to hear when applications open.',
    plans: [
      'Apply with your channel or publication',
      'A personal referral link once your application is approved',
    ],
    alternatives: [{ to: '/learn', label: 'See the guides you would be linking to' }],
    ready: true,
  },
  'portfolio-analysis': {
    title: 'AI Portfolio Analysis (Soon)',
    description:
      'AI analysis of your own crypto portfolio needs an account so your holdings can be read. Accounts are not open yet. Join the waitlist for launch news.',
    heading: 'Portfolio analysis is not available yet',
    summary:
      'This tool analyses the holdings you have saved, so it needs an account, and accounts are not open yet. The rebalancing and risk guides cover the same ground by hand.',
    plans: [
      'Diversification and concentration check on your saved holdings',
      'Plain-English notes on risk, not buy or sell signals',
    ],
    alternatives: [
      { to: '/dashboard', label: 'Track a portfolio in this browser' },
      { to: '/learn/risk-management', label: 'Risk management guide' },
    ],
    ready: true,
  },
  'developer-portal': {
    title: 'Developer Portal (Coming Soon)',
    description:
      'API keys for the Bitcoinvestments API are issued from the developer portal, which needs an account. Accounts are not open yet. See the API plans.',
    heading: 'The developer portal is not open yet',
    summary:
      'API keys are issued from your account, and accounts are not open yet. The API pricing page describes what the API will offer.',
    plans: ['Create and revoke API keys', 'See your request usage against your plan limits'],
    alternatives: [{ to: '/developers/pricing', label: 'API plans and pricing' }],
    ready: true,
  },
  advertiser: {
    title: 'Advertiser Dashboard (Soon)',
    description:
      'The advertiser dashboard for sponsored placements needs an account, and accounts are not open yet. Join the waitlist to hear when it opens.',
    heading: 'The advertiser dashboard is not open yet',
    summary:
      'Sponsors will manage their campaigns here once accounts open. It needs an account, and accounts are not open yet.',
    plans: ['Campaign performance for sponsored articles and placements'],
    alternatives: [{ to: '/blog', label: 'Read the blog' }],
    ready: true,
  },
  'multi-exchange': {
    title: 'Multi-Exchange Tracking (Soon)',
    description:
      'Automatic syncing of balances from several crypto exchanges is not available. Track holdings from each exchange by hand in the free portfolio tracker.',
    heading: 'Exchange syncing is not available',
    summary:
      'Connecting exchange accounts needs an account and secure storage for API keys, and neither is available yet. You can enter holdings from every exchange by hand in the portfolio tracker today.',
    plans: ['Read-only balance sync from the exchanges you use, with keys stored encrypted on the server'],
    alternatives: [
      { to: '/dashboard', label: 'Open the portfolio tracker' },
      { to: '/learn/crypto-wallets-explained', label: 'Keeping your crypto secure' },
    ],
    ready: true,
  },
};
