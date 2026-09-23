/**
 * Proof-of-stake reference data for the staking calculator.
 *
 * Rates are TYPICAL RANGES for native/network staking, not live quotes and not a
 * specific provider's rate. They move with how much of each token is staked and
 * with protocol changes, and providers deduct a commission. Checked against
 * public staking dashboards and aggregator summaries on `STAKING_META.lastVerified`.
 *
 * NEEDS-OWNER: if live, provider-specific rates are wanted, add a
 * `staking_opportunities` Supabase table (provider, asset, net_apy, commission,
 * last_verified) or a cached Pages Function, and keep this file as the fallback.
 * Providers below are listed without rates on purpose.
 */

export type StakingAssetId = 'ETH' | 'SOL' | 'ADA' | 'DOT' | 'ATOM' | 'AVAX';

export type ProviderKind = 'exchange' | 'liquid' | 'native';

export interface StakingProvider {
  name: string;
  kind: ProviderKind;
  note: string;
  url: string;
}

export interface StakingAsset {
  id: StakingAssetId;
  name: string;
  coingeckoId: string;
  /** Typical yearly reward range for native staking, % APY (before provider commission). */
  apyLow: number;
  apyHigh: number;
  /** How rewards are paid, used as the default payout frequency. */
  payoutsPerYear: number;
  rewardNote: string;
  unbonding: string;
  minimum: string;
  slashing: string;
  /** Rough network inflation context, so users can see "real" yield. */
  inflationNote: string;
  providers: StakingProvider[];
}

export const STAKING_META = {
  lastVerified: '2026-09-23',
  sourceNote:
    'Typical ranges from public staking dashboards and network explorers (e.g. beaconcha.in for Ethereum, validator explorers for other chains) and staking-rate aggregators, checked September 2026.',
} as const;

const exchange = (name: string, url: string, note = 'Custodial: the exchange holds your coins and keeps a commission from rewards. Availability varies by US state.'): StakingProvider => ({
  name,
  kind: 'exchange',
  note,
  url,
});

export const STAKING_ASSETS: StakingAsset[] = [
  {
    id: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    apyLow: 2.5,
    apyHigh: 3.5,
    payoutsPerYear: 365,
    rewardNote: 'Consensus-layer rewards plus priority fees and MEV. The rate falls as more ETH is staked.',
    unbonding: 'Withdrawals go through an exit queue that has ranged from under a day to several weeks. Liquid staking tokens can be sold on the market instead.',
    minimum: '32 ETH to run a validator yourself; any amount through a pool, liquid staking protocol or exchange.',
    slashing: 'Yes, for validator misbehaviour; pooled and exchange stakers share the operator’s risk.',
    inflationNote: 'ETH supply has been close to flat since 2022 (issuance partly offset by fee burning), so most of the reward is real yield.',
    providers: [
      exchange('Coinbase', 'https://www.coinbase.com/staking'),
      exchange('Kraken', 'https://www.kraken.com/features/staking-coins'),
      { name: 'Lido (stETH)', kind: 'liquid', note: 'Liquid staking token you can hold or trade; Lido takes 10% of rewards. Smart-contract risk.', url: 'https://lido.fi' },
      { name: 'Rocket Pool (rETH)', kind: 'liquid', note: 'Decentralised liquid staking; rETH rises in value instead of paying out. Smart-contract risk.', url: 'https://rocketpool.net' },
    ],
  },
  {
    id: 'SOL',
    name: 'Solana',
    coingeckoId: 'solana',
    apyLow: 6,
    apyHigh: 7.5,
    payoutsPerYear: 180,
    rewardNote: 'Inflation rewards paid each epoch (about 2 days); validators charge a commission. Liquid staking tokens may add MEV rewards.',
    unbonding: 'Deactivating a stake takes until the end of the current epoch (about 2-3 days).',
    minimum: 'Any amount (plus a small rent-exempt reserve) when delegating from a wallet.',
    slashing: 'Solana has not slashed stakers automatically to date; validator downtime lowers rewards.',
    inflationNote: 'SOL inflation is several percent a year and declining, so real yield is well below the headline rate.',
    providers: [
      { name: 'Native delegation (Phantom, Solflare)', kind: 'native', note: 'Delegate to a validator from your own wallet; you keep custody.', url: 'https://solana.com' },
      { name: 'Jito (JitoSOL)', kind: 'liquid', note: 'Liquid staking token that includes MEV rewards. Smart-contract risk.', url: 'https://www.jito.network' },
      { name: 'Marinade (mSOL)', kind: 'liquid', note: 'Liquid staking spread across many validators. Smart-contract risk.', url: 'https://marinade.finance' },
      exchange('Coinbase', 'https://www.coinbase.com/staking'),
      exchange('Kraken', 'https://www.kraken.com/features/staking-coins'),
    ],
  },
  {
    id: 'ADA',
    name: 'Cardano',
    coingeckoId: 'cardano',
    apyLow: 2,
    apyHigh: 3.5,
    payoutsPerYear: 73,
    rewardNote: 'Rewards paid every 5-day epoch; the first reward arrives roughly 15-20 days after delegating.',
    unbonding: 'None: ADA never leaves your wallet and can be spent at any time.',
    minimum: 'Any amount (a refundable 2 ADA deposit registers the stake key).',
    slashing: 'No slashing.',
    inflationNote: 'Rewards come from a reserve that shrinks over time, so the rate drifts down slowly.',
    providers: [
      { name: 'Native delegation (Lace, Eternl, Yoroi)', kind: 'native', note: 'Delegate to a stake pool from your own wallet; no lock-up.', url: 'https://cardano.org' },
      exchange('Kraken', 'https://www.kraken.com/features/staking-coins'),
    ],
  },
  {
    id: 'DOT',
    name: 'Polkadot',
    coingeckoId: 'polkadot',
    apyLow: 11,
    apyHigh: 14,
    payoutsPerYear: 365,
    rewardNote: 'Rewards per era (about a day) for nominators whose validators are active.',
    unbonding: 'Historically 28 days. Polkadot has been changing its staking and unbonding rules during 2026, so check the current period before staking.',
    minimum: 'About 1 DOT through a nomination pool; a much larger, changing minimum to nominate directly.',
    slashing: 'Yes, nominators can be slashed with their validators.',
    inflationNote: 'DOT has had high inflation (its tokenomics were changed in 2026), so the real, after-inflation yield is much lower than the headline rate.',
    providers: [
      { name: 'Nomination pools (Polkadot app, Nova Wallet)', kind: 'native', note: 'Join a pool from your own wallet; you keep custody.', url: 'https://polkadot.com' },
      exchange('Kraken', 'https://www.kraken.com/features/staking-coins'),
    ],
  },
  {
    id: 'ATOM',
    name: 'Cosmos',
    coingeckoId: 'cosmos',
    apyLow: 14,
    apyHigh: 20,
    payoutsPerYear: 365,
    rewardNote: 'Rewards accrue continuously and must be claimed (and re-delegated to compound).',
    unbonding: '21 days, with no rewards during unbonding.',
    minimum: 'Any amount.',
    slashing: 'Yes, for validator downtime or double-signing.',
    inflationNote: 'ATOM inflation is roughly 7-10% a year, so most of the headline rate only offsets dilution.',
    providers: [
      { name: 'Native delegation (Keplr, Leap)', kind: 'native', note: 'Delegate from your own wallet; claim and restake rewards yourself.', url: 'https://cosmos.network' },
      exchange('Coinbase', 'https://www.coinbase.com/staking'),
      exchange('Kraken', 'https://www.kraken.com/features/staking-coins'),
    ],
  },
  {
    id: 'AVAX',
    name: 'Avalanche',
    coingeckoId: 'avalanche-2',
    apyLow: 6,
    apyHigh: 8,
    payoutsPerYear: 1,
    rewardNote: 'Rewards are paid when the delegation period you choose ends; longer periods earn slightly more.',
    unbonding: 'Coins are locked for the whole delegation period you pick (minimum 2 weeks).',
    minimum: '25 AVAX to delegate natively; less through exchanges or liquid staking.',
    slashing: 'No slashing, but you earn nothing if the validator’s uptime is too low.',
    inflationNote: 'New AVAX is minted for rewards, partly offset by fee burning.',
    providers: [
      { name: 'Native delegation (Core wallet)', kind: 'native', note: 'Delegate from your own wallet for a fixed period.', url: 'https://core.app' },
      exchange('Kraken', 'https://www.kraken.com/features/staking-coins'),
    ],
  },
];

export const STAKING_BY_ID: Record<StakingAssetId, StakingAsset> = Object.fromEntries(
  STAKING_ASSETS.map((a) => [a.id, a])
) as Record<StakingAssetId, StakingAsset>;

export function isStakingAsset(v: string | null | undefined): v is StakingAssetId {
  return !!v && v in STAKING_BY_ID;
}
