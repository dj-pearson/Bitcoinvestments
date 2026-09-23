/**
 * JSON-LD builders for the compare and hardware-wallet pages.
 *
 * Rules: only describe what is visible on the page; never emit
 * aggregateRating (we have no collected ratings to aggregate); hardware
 * wallets are Products with a Brand and an Offer; no image URLs for logos we
 * do not host.
 */

import type { Exchange, Wallet } from '../../types';
import { SITE_URL } from './compareUtils';

const PUBLISHER = { '@type': 'Organization', name: 'Bitcoinvestments', url: SITE_URL };

/**
 * Editorial Review of an exchange. The rating is our editorial score (0-10),
 * shown on the page with its methodology. Not an aggregate of user ratings.
 */
export function exchangeReviewSchema(exchange: Exchange) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: `${exchange.name} review`,
    url: `${SITE_URL}/compare/exchange/${exchange.id}`,
    datePublished: exchange.last_verified,
    dateModified: exchange.last_verified,
    author: PUBLISHER,
    publisher: PUBLISHER,
    itemReviewed: {
      '@type': 'Organization',
      name: exchange.name,
      url: exchange.url,
      foundingDate: String(exchange.year_established),
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: exchange.trust_score,
      bestRating: 10,
      worstRating: 0,
      ratingExplanation: 'Bitcoinvestments editorial score; see the methodology on /compare.',
    },
    reviewBody: `${exchange.best_for} Not ideal for: ${exchange.not_for}`,
    positiveNotes: {
      '@type': 'ItemList',
      itemListElement: exchange.pros.map((name, i) => ({ '@type': 'ListItem', position: i + 1, name })),
    },
    negativeNotes: {
      '@type': 'ItemList',
      itemListElement: exchange.cons.map((name, i) => ({ '@type': 'ListItem', position: i + 1, name })),
    },
  };
}

/** Product (hardware) or SoftwareApplication (software) for a wallet. */
export function walletSchema(wallet: Wallet) {
  const pageUrl = `${SITE_URL}/compare/wallet/${wallet.id}`;
  if (wallet.type === 'hardware') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: wallet.name,
      description: wallet.description,
      url: pageUrl,
      brand: { '@type': 'Brand', name: wallet.brand },
      model: wallet.name,
      category: 'Cryptocurrency hardware wallet',
      ...(wallet.price
        ? {
            offers: {
              '@type': 'Offer',
              price: wallet.price.toFixed(2),
              priceCurrency: 'USD',
              url: wallet.url,
              availability:
                wallet.status === 'current'
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/Discontinued',
              seller: { '@type': 'Organization', name: wallet.brand },
            },
          }
        : {}),
    };
  }
  const os = [
    wallet.features.mobile_app ? 'iOS, Android' : null,
    wallet.features.desktop_app ? 'Windows, macOS, Linux' : null,
    wallet.features.browser_extension ? 'Chrome, Brave, Firefox (extension)' : null,
  ].filter(Boolean).join(', ');
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: wallet.name,
    description: wallet.description,
    url: pageUrl,
    applicationCategory: 'FinanceApplication',
    operatingSystem: os || 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: wallet.brand },
  };
}

/** ItemList of internal pages, in the order shown on the page. */
export function itemListSchema(name: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: `${SITE_URL}${item.path}`,
    })),
  };
}
