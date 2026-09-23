/** Schema helpers shared by the alert and automation tool pages. */

export interface FaqItem {
  question: string;
  answer: string;
}

const SITE_URL = 'https://bitcoinvestments.net';

/** WebApplication JSON-LD for a free, in-browser tool. */
export function webApplicationSchema(name: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: `${SITE_URL}${path}`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any (runs in the browser)',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'Bitcoinvestments', url: SITE_URL },
  };
}

