import type { GuideSource } from './index';

export const yieldFarmingGuide: GuideSource = {
  id: 'yield-farming',
  title: 'Yield Farming Guide: Earning Passive Income in DeFi',
  seoTitle: 'Yield Farming Explained: DeFi Guide',
  description: 'How DeFi yield farming works: liquidity pools, lending, staking and vaults, impermanent loss with worked numbers, true-yield maths, and the risks to weigh.',
  summary:
    'Yield farming means depositing crypto into DeFi protocols (liquidity pools, lending markets or staking) to earn trading fees, interest or token rewards. Advertised APYs are often inflated by reward tokens that lose value, and liquidity providers can suffer impermanent loss, so the realistic return is usually much lower than the headline number and always carries smart-contract risk.',
  category: 'DeFi',
  icon: '🌾',
  datePublished: '2026-01-02',
  dateModified: '2026-09-23',
  relatedGuides: ['defi-basics', 'defi-risks', 'crypto-taxes-basics'],
  relatedTools: [
    { label: 'DeFi yield tracker', url: '/defi-yield', description: 'Current yields with risk notes' },
    { label: 'Staking calculator', url: '/staking-calculator', description: 'Project staking rewards with compounding' },
    { label: 'Gas fee optimizer', url: '/gas-optimizer', description: 'Check what a deposit will cost in gas' },
  ],
  content: `
# Yield Farming Guide: Earning Passive Income in DeFi

Yield farming is the practice of earning returns by providing liquidity or staking assets in DeFi protocols. This guide covers strategies, risks, and how to get started. If DeFi is new to you, start with [DeFi Explained](/learn/defi-basics).

## What is Yield Farming?

Yield farming (also called liquidity mining) involves:
1. Depositing crypto into DeFi protocols
2. Earning rewards in the form of fees, interest, or tokens
3. Often compounding those rewards for higher returns

### Types of Yield

| Yield Type | Source | Example |
|------------|--------|---------|
| Trading fees | DEX swaps | 0.3% of each trade |
| Lending interest | Borrower payments | Variable APY |
| Token rewards | Protocol incentives | Governance tokens |
| Staking rewards | Network validation | Protocol-specific |

## Yield Farming Strategies

### Strategy 1: Liquidity Provision (LP)

Provide tokens to DEX trading pools and earn swap fees.

**How It Works:**
1. Deposit equal value of two tokens (e.g., ETH + USDC)
2. Receive LP tokens representing your share
3. Earn portion of trading fees
4. Can also earn bonus token rewards

**Example - Uniswap V2:**
- Deposit $1,000 ETH + $1,000 USDC
- Pool earns 0.3% on each swap
- Your share: proportional to your % of pool
- APY varies based on trading volume

**Best for:**
- Pairs you believe in long-term
- High-volume trading pairs
- When bonus rewards are available

### Strategy 2: Lending

Deposit assets in lending protocols to earn interest.

**How It Works:**
1. Deposit tokens (e.g., USDC)
2. Protocol lends to borrowers
3. You earn interest automatically
4. Can withdraw anytime (usually)

**Example - Aave (illustrative rate):**
- Deposit 10,000 USDC
- At, say, a 4% variable APY
- Earn roughly $400/year in interest, but the rate changes constantly with borrowing demand
- See current rates on our [DeFi yield page](/defi-yield)

**Best for:**
- Lower risk tolerance
- Stablecoins (predictable returns)
- When you don't want impermanent loss

### Strategy 3: Staking

Lock tokens to earn rewards.

**Types of Staking:**

**Protocol Staking:**
- Lock protocol tokens (e.g., CRV, AAVE)
- Earn protocol revenue or incentives
- Often includes governance rights

**Liquid Staking:**
- Stake ETH, receive stETH (or similar)
- Earn staking rewards while keeping liquidity
- Can use stETH in other DeFi activities

**Validator Staking:**
- 32 ETH for Ethereum validators
- Higher rewards, more responsibility
- Slashing risk if misbehavior

### Strategy 4: Yield Aggregation

Use aggregators to automatically optimize yields.

**How It Works:**
1. Deposit assets into vault/pool
2. Aggregator finds best yields
3. Auto-compounds rewards
4. You earn optimized returns

**Popular Aggregators:**
| Platform | Specialty |
|----------|-----------|
| Yearn Finance | Multi-strategy vaults |
| Beefy Finance | Cross-chain, auto-compound |
| Convex Finance | Curve LP optimization |
| Harvest Finance | Diversified strategies |

**Best for:**
- Set-and-forget approach
- When gas costs make manual compounding expensive
- Users who don't want to actively manage

### Strategy 5: Leveraged Yield Farming

Borrow to increase yield farming position.

**How It Works:**
1. Deposit collateral
2. Borrow additional assets
3. Farm with borrowed assets
4. Yield > Borrow cost = Profit

**Example (illustrative rates):**
- Deposit $10,000 ETH as collateral
- Borrow $5,000 USDC at 2% interest
- Farm with USDC at 8% APY
- Net profit: 6% on $5,000 = $300/year, as long as both rates stay put (they are variable and often move against you)

**WARNING:** High risk strategy. Liquidation risk if collateral drops.

## Understanding Impermanent Loss

Impermanent loss (IL) is the most important concept in yield farming.

### What is Impermanent Loss?

The difference in value between:
- Holding tokens in an LP position
- Simply holding those tokens separately

It occurs because the AMM automatically rebalances your position as prices change.

### Impermanent Loss Example

**Starting position:**
- Deposit 1 ETH ($2,000) + 2,000 USDC
- Total value: $4,000

**After ETH doubles to $4,000:**

| Scenario | ETH | USDC | Total |
|----------|-----|------|-------|
| Just held | 1 ETH ($4,000) | $2,000 | $6,000 |
| LP position | ~0.707 ETH ($2,828) | ~$2,828 | $5,656 |
| **Difference** | | | **-$344 (5.7% IL)** |

### Impermanent Loss Chart

| Price Change | Impermanent Loss |
|--------------|------------------|
| 1.25x (25% change) | 0.6% |
| 1.5x (50% change) | 2.0% |
| 2x (100% change) | 5.7% |
| 3x (200% change) | 13.4% |
| 4x (300% change) | 20.0% |
| 5x (400% change) | 25.5% |

### Mitigating Impermanent Loss

1. **Choose correlated pairs**: ETH/stETH, USDC/USDT
2. **Farm stablecoin pairs**: USDC/DAI (minimal IL)
3. **Consider fee earnings**: High volume can offset IL
4. **Use concentrated liquidity**: Uniswap V3 (advanced)
5. **Time your exits**: IL is only realized when you withdraw

### When IL is "Permanent"

IL becomes permanent loss when:
- You withdraw during high divergence
- One token goes to zero
- You need to exit for other reasons

## Calculating Yield

### Real Yield vs. Advertised APY

Advertised APYs often don't reflect reality.

**Consider:**
- Gas costs for deposits/withdrawals
- Compounding frequency
- Token reward price volatility
- Impermanent loss

### True Yield Calculation

\`\`\`
True Yield = (Fee APY + Reward APY - IL) - Gas Costs
\`\`\`

**Example:**
- Advertised: 50% APY
- Fees: 10% APY
- Rewards: 40% APY (but token drops 50% → 20%)
- IL: 5%
- Gas: $200 on $5,000 position = 4%

**Actual**: 10% + 20% - 5% - 4% = **21% APY**

### APY vs. APR Compounding

| Advertised | Daily Compound | Weekly Compound | No Compound |
|------------|----------------|-----------------|-------------|
| 10% APR | 10.52% | 10.51% | 10% |
| 50% APR | 64.82% | 64.48% | 50% |
| 100% APR | 171.46% | 169.26% | 100% |

Formula: APY = (1 + APR / n)^n − 1, where n is the number of compounding periods per year. Real-world compounding also costs gas each time, which can wipe out the benefit on small positions.

Higher APR = bigger compounding benefit.

## Getting Started: Step by Step

### Step 1: Choose a Strategy

Start with lower risk options:
- Stablecoin lending (Aave, Compound)
- Stablecoin LPs (Curve)
- Blue-chip pairs (ETH/USDC on Uniswap)

### Step 2: Select a Chain

| Chain | Pros | Cons |
|-------|------|------|
| Ethereum | Most liquidity | High gas |
| Arbitrum | Low gas, good liquidity | Less protocols |
| Base / Optimism | Very low gas | Newer; some bridge delays |
| Polygon (POL) | Very low gas | Less liquidity than the largest chains |
| Solana | Fast, cheap | Different ecosystem |

### Step 3: Prepare Your Wallet

1. Set up MetaMask or compatible wallet
2. Add the chain you'll use
3. Fund with the chain's native token for gas (ETH, POL, SOL, etc.; Polygon's MATIC was migrated to POL in September 2024)
4. Transfer farming tokens

### Step 4: Execute the Farm

**For LP Farming:**
1. Go to DEX (Uniswap, Curve, etc.)
2. Navigate to Pools/Liquidity
3. Select pool and click "Add Liquidity"
4. Enter amounts (or "Max")
5. Approve tokens (one-time per token)
6. Confirm deposit
7. Receive LP tokens

**For Staking:**
1. Go to protocol
2. Find staking section
3. Approve token
4. Stake amount
5. Monitor rewards

### Step 5: Monitor and Compound

- Check positions regularly
- Harvest and reinvest rewards
- Watch for impermanent loss
- Track overall performance

## Risk Management for Yield Farming

### Position Sizing

- Don't farm with money you can't afford to lose
- Maximum 5-10% of portfolio in any single farm
- Diversify across protocols and chains

### Protocol Selection

**Green Flags:**
- Multiple audits
- Long track record (1+ year)
- High TVL ($100M+)
- Active development
- Transparent team

**Red Flags:**
- No audits
- Anonymous team
- Very high APY (1000%+)
- Recent launch
- Forked code with minimal changes

### Exit Strategy

Before entering, decide:
- At what loss will you exit?
- At what profit will you take gains?
- How often will you review?

### Emergency Procedures

Know how to:
- Quickly unstake/withdraw
- Revoke token approvals
- Exit a depeg situation

## Advanced Concepts

### Concentrated Liquidity (Uniswap V3)

Provide liquidity in specific price ranges for higher capital efficiency.

**Example:**
- Traditional LP: Spread across all prices
- Concentrated LP: Focus on $1,800-$2,200 ETH range
- Result: Higher fees in that range, but IL if price leaves range

### Bribes and Vote Markets

Protocols pay for votes to direct emissions:
- Lock governance tokens
- Receive bribes for voting
- Examples: Convex (veCRV), Aura (veBAL)

### Flash Loans

Borrow without collateral if repaid in the same transaction.
- Used by developers for arbitrage and liquidations
- Requires writing smart contracts; not a retail strategy
- Also a common tool in DeFi exploits, which is why protocols guard against them

## Common Mistakes to Avoid

### 1. Chasing Highest APY

High APY often means:
- Higher risk
- Token inflation
- Unsustainable rewards

### 2. Ignoring Gas Costs

Don't farm with small amounts on Ethereum mainnet. $50 in gas on a $500 position = 10% cost.

### 3. Not Understanding What You're Farming

Know:
- What you're depositing
- Where the yield comes from
- What risks exist

### 4. Over-Concentrating

Don't put all funds in one:
- Protocol
- Chain
- Strategy

### 5. Farming and Forgetting

Regular monitoring is essential:
- Protocol upgrades
- Market changes
- Better opportunities

## Yield Farming Checklist

Before entering any farm:

- [ ] I understand the protocol
- [ ] I've checked for audits
- [ ] I know where the yield comes from
- [ ] I've calculated true APY including fees
- [ ] I understand impermanent loss risk
- [ ] Position size is appropriate
- [ ] I have an exit strategy
- [ ] I've tested with small amount first

## Key Takeaways

- Yield farming is earning returns by providing liquidity or staking
- Impermanent loss is the biggest risk in LP farming
- Real yields are often lower than advertised APYs
- Start with simple strategies (lending, stable LPs)
- Diversify across protocols and chains
- Monitor positions and compound regularly
- Never invest more than you can afford to lose

## Next Steps

1. Start with stablecoin lending on Aave
2. Try a stablecoin LP on Curve
3. Graduate to ETH/USDC pairs
4. Explore yield aggregators
5. Learn about concentrated liquidity
6. Read our [DeFi Risks guide](/learn/defi-risks) before depositing anything significant
7. Understand the tax side: rewards are usually income when received. See [Crypto Taxes](/learn/crypto-taxes-basics)

Remember: High APY = High Risk. In 2025–2026, lending major stablecoins on established protocols has mostly paid in the low-to-mid single digits. Yields far above that are usually paid in inflationary reward tokens or come with extra risk.
`
};
