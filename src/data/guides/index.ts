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

export interface GuideContent {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: number;
  icon: string;
  content: string;
}

export const guides: Record<string, GuideContent> = {
  'what-is-bitcoin': whatIsBitcoinGuide,
  'how-to-buy-crypto': howToBuyCryptoGuide,
  'crypto-wallets-explained': cryptoWalletsExplainedGuide,
  'common-crypto-mistakes': commonCryptoMistakesGuide,
  // Advanced Trading Strategies
  'dca-strategies': dcaStrategiesGuide,
  'portfolio-rebalancing': portfolioRebalancingGuide,
  'risk-management': riskManagementGuide,
  // DeFi Explained Series
  'defi-basics': defiBasicsGuide,
  'yield-farming': yieldFarmingGuide,
  'defi-risks': defiRisksGuide,
};

export function getGuide(id: string): GuideContent | undefined {
  return guides[id];
}

export function getAllGuides(): GuideContent[] {
  return Object.values(guides);
}
