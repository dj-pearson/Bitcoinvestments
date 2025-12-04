import { whatIsBitcoinGuide } from './what-is-bitcoin';
import { howToBuyCryptoGuide } from './how-to-buy-crypto';
import { cryptoWalletsExplainedGuide } from './crypto-wallets-explained';
import { commonCryptoMistakesGuide } from './common-crypto-mistakes';

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
};

export function getGuide(id: string): GuideContent | undefined {
  return guides[id];
}

export function getAllGuides(): GuideContent[] {
  return Object.values(guides);
}
