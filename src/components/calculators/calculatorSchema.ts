/** JSON-LD builders and small formatters for the calculator pages (no React). */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
}

const SITE = 'https://bitcoinvestments.net';

/** WebApplication JSON-LD without ratings (we have no review system). */
export function webApplicationSchema(opts: {
  name: string;
  description: string;
  path: string;
  dateModified: string;
  featureList?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: opts.name,
    description: opts.description,
    url: `${SITE}${opts.path}`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any (runs in the browser)',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    dateModified: opts.dateModified,
    ...(opts.featureList ? { featureList: opts.featureList } : {}),
    provider: { '@type': 'Organization', name: 'Bitcoinvestments', url: SITE },
  };
}

export function howToSchema(name: string, description: string, steps: HowToStep[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
  };
}

export function breadcrumbSchema(name: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name, item: `${SITE}${path}` },
    ],
  };
}

/** Format an ISO date (YYYY-MM-DD) as "September 23, 2026" without timezone drift. */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

