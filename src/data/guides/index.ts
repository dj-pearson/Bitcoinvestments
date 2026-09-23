import { whatIsBitcoinGuide } from './what-is-bitcoin';
import { howToBuyCryptoGuide } from './how-to-buy-crypto';
import { cryptoWalletsExplainedGuide } from './crypto-wallets-explained';
import { commonCryptoMistakesGuide } from './common-crypto-mistakes';
import { dcaStrategiesGuide } from './dca-strategies';
import { portfolioRebalancingGuide } from './portfolio-rebalancing';
import { riskManagementGuide } from './risk-management';
import { defiBasicsGuide } from './defi-basics';
import { yieldFarmingGuide } from './yield-farming';
import { defiRisksGuide } from './defi-risks';
import { understandingBlockchainGuide } from './understanding-blockchain';
import { cryptoTaxesBasicsGuide } from './crypto-taxes-basics';

export interface GuideFAQ {
  question: string;
  answer: string;
}

export interface GuideLink {
  label: string;
  url: string;
  description?: string;
}

/** Default byline until the owner supplies named authors/reviewers. */
// NEEDS-OWNER: named author(s) and a qualified reviewer (CPA/EA for the tax guide).
export const EDITORIAL_AUTHOR = 'the Bitcoinvestments editorial team';

/** Shape each guide file exports. `readTime` is computed, never hand-typed. */
export interface GuideSource {
  id: string;
  title: string;
  /** Shorter title for <title> (≤ 41 chars so the full title fits in 60). */
  seoTitle?: string;
  description: string;
  /** Answer-first summary (1–3 sentences) shown under the H1. */
  summary: string;
  category: string;
  icon: string;
  /** ISO date (YYYY-MM-DD) the guide was first published. */
  datePublished: string;
  /** ISO date (YYYY-MM-DD) the guide was last reviewed/updated. */
  dateModified: string;
  author?: string;
  /** Visible FAQ rendered below the article; also emitted as FAQPage schema. */
  faqs?: GuideFAQ[];
  /** Steps for HowTo schema (must mirror steps visible in the content). */
  howToSteps?: Array<{ name: string; text: string }>;
  relatedGuides?: string[];
  relatedTools?: GuideLink[];
  content: string;
}

export interface GuideContent extends GuideSource {
  author: string;
  readTime: number;
}

const WORDS_PER_MINUTE = 230;

/** Reading time from the word count of the markdown body (and FAQ). */
export function computeReadTime(text: string): number {
  const words = text
    .replace(/[`#>*_|[\]()-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * Remove the leading `# Title` line: the page renders the title as its single
 * <h1>, so repeating it in the body produced a second (sometimes different) H1.
 */
function stripLeadingH1(content: string): string {
  return content.replace(/^\s*# [^\n]*\n/, '');
}

function build(source: GuideSource): GuideContent {
  const content = stripLeadingH1(source.content);
  const faqText = (source.faqs ?? []).map((f) => `${f.question} ${f.answer}`).join(' ');
  return {
    ...source,
    content,
    author: source.author ?? EDITORIAL_AUTHOR,
    readTime: computeReadTime(`${content} ${faqText}`),
  };
}

const SOURCES: GuideSource[] = [
  whatIsBitcoinGuide,
  understandingBlockchainGuide,
  howToBuyCryptoGuide,
  cryptoWalletsExplainedGuide,
  commonCryptoMistakesGuide,
  cryptoTaxesBasicsGuide,
  dcaStrategiesGuide,
  portfolioRebalancingGuide,
  riskManagementGuide,
  defiBasicsGuide,
  yieldFarmingGuide,
  defiRisksGuide,
];

export const guides: Record<string, GuideContent> = Object.fromEntries(
  SOURCES.map((s) => [s.id, build(s)])
);

/**
 * Ordered beginner path shown on /learn ("Start here").
 */
export const BEGINNER_PATH: string[] = [
  'what-is-bitcoin',
  'understanding-blockchain',
  'crypto-wallets-explained',
  'how-to-buy-crypto',
  'common-crypto-mistakes',
  'crypto-taxes-basics',
];

export function getGuide(id: string): GuideContent | undefined {
  return Object.prototype.hasOwnProperty.call(guides, id) ? guides[id] : undefined;
}

export function getAllGuides(): GuideContent[] {
  return Object.values(guides);
}

/** Related guides, falling back to others in the same category. */
export function getRelatedGuides(guide: GuideContent, limit = 3): GuideContent[] {
  const explicit = (guide.relatedGuides ?? [])
    .map((id) => getGuide(id))
    .filter((g): g is GuideContent => !!g && g.id !== guide.id);
  if (explicit.length >= limit) return explicit.slice(0, limit);
  const extra = getAllGuides().filter(
    (g) => g.id !== guide.id && g.category === guide.category && !explicit.includes(g)
  );
  return [...explicit, ...extra].slice(0, limit);
}

/** Human-readable date for a fixed ISO date (deterministic, SSR-safe). */
export function formatGuideDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}
