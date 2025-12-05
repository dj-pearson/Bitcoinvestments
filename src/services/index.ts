// CoinGecko API service
export * from './coingecko';

// Calculator services
export * from './calculators';

// Portfolio service (local storage)
export * from './portfolio';

// Affiliate tracking service
export * from './affiliate';

// Authentication service
export * from './auth';

// Database service (Supabase)
// Note: Rename addTransaction to avoid conflict with portfolio.ts
export {
  getUserPortfolios,
  createDbPortfolio,
  deleteDbPortfolio,
  getPortfolioHoldings,
  upsertHolding,
  deleteHolding,
  getHoldingTransactions,
  addTransaction as addDbTransaction,
  trackAffiliateClickDb,
  markClickConvertedDb,
  getAffiliateStatsDb,
  getUserPriceAlerts,
  countActiveAlerts,
  createPriceAlert,
  deletePriceAlert,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getPublishedArticles,
  getArticleBySlug,
  getActiveAds,
  trackAdImpression,
  trackAdClick,
  hasTaxReportPurchase,
  getTaxReportPackageType,
  getUserTaxReportPurchases,
  incrementTaxReportDownload,
} from './database';

// News service
export * from './news';
