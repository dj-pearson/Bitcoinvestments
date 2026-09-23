import type { GuideSource } from './index';

export const riskManagementGuide: GuideSource = {
  id: 'risk-management',
  title: 'Crypto Risk Management: Protecting Your Portfolio',
  seoTitle: 'Crypto Risk Management Guide',
  description: 'Crypto risk management in practice: how much to allocate, position sizing, stop-losses, diversification, hedging with ETF options, and a written plan.',
  summary:
    'Crypto risk management starts with deciding how much of your total wealth belongs in crypto at all, then sizing each position so a 75% or larger drop would not derail your finances. Diversification, custody choices, stop-losses and profit-taking rules help, but position size is the control that matters most.',
  category: 'Trading',
  icon: '🛡️',
  datePublished: '2026-01-02',
  dateModified: '2026-09-23',
  relatedGuides: ['portfolio-rebalancing', 'dca-strategies', 'defi-risks'],
  relatedTools: [
    { label: 'Strategy backtester', url: '/backtesting', description: 'See historical drawdowns for yourself' },
    { label: 'Crypto calculators', url: '/calculators', description: 'Position, DCA and tax calculators' },
    { label: 'Rebalancing calculator', url: '/rebalancing-alerts', description: 'Keep allocations inside your limits' },
  ],
  content: `
# Crypto Risk Management: Protecting Your Portfolio

Risk management is what separates successful investors from gamblers. In crypto's volatile markets, proper risk management isn't optional—it's essential for long-term survival and success.

## Understanding Crypto Risk

### Types of Risk in Cryptocurrency

#### 1. Market Risk (Volatility)
Price can drop 50–80% in bear markets. Even Bitcoin has fallen roughly 77–86% from its peak in each major bear market since 2014 (and about 93% in 2011). Smaller coins often fall further and never recover.

#### 2. Liquidity Risk
Inability to sell at desired price, especially in smaller altcoins or during market panic.

#### 3. Custody Risk
Risk of losing access to your funds through:
- Exchange hacks or bankruptcy
- Lost private keys
- Hardware wallet failure

#### 4. Regulatory Risk
Government actions can impact prices and access:
- Trading bans or restrictions on platforms
- Tax changes (for example, US broker reporting on Form 1099-DA started with 2025 transactions)
- Securities classifications

The US picture shifted in 2025: the SEC dropped most of its enforcement cases against major exchanges, and the GENIUS Act (signed July 2025) created a federal framework for payment stablecoins. A broader market-structure bill (the CLARITY Act) passed the House in 2025 and was still being debated in the Senate as of September 2026. Policy can swing back, so treat regulation as an ongoing risk rather than a solved one.

#### 5. Smart Contract Risk
For DeFi and tokens:
- Code vulnerabilities
- Rug pulls
- Protocol failures

#### 6. Counterparty Risk
Relying on third parties:
- Exchange solvency
- Stablecoin backing
- Bridge security

### Quantifying Risk: Key Metrics

**Maximum Drawdown (Max DD):**
The largest peak-to-trough decline. Bitcoin's worst was about 93% (2011); each bear market since 2014 has seen roughly 77–86%.

**Volatility:**
Standard deviation of returns. Crypto typically 3-5x more volatile than stocks.

**Sharpe Ratio:**
Return per unit of risk. Higher is better.

**Value at Risk (VaR):**
Maximum expected loss over a period at a given confidence level.

## Step Zero: How Much Crypto in Total?

Before sizing individual coins, decide what share of your **total investable wealth** goes into crypto at all. Many financial planners suggest a small allocation for most people (often in the low single digits, and rarely more than about 10%), sized so that losing 80% of it would be painful but not life-changing. Pay off high-interest debt and hold an emergency fund first.

The percentages in the rest of this guide describe how to split **your crypto allocation**, not your whole net worth.

## Position Sizing

Position sizing determines how much to invest in each asset. It's the most important risk management tool.

### The Golden Rules

1. **Never invest more than you can afford to lose completely**
2. **No single position should risk your financial security**
3. **Smaller positions = more room for error**

### Position Sizing Methods

#### Method 1: Fixed Percentage

Allocate a fixed percentage of portfolio to each position.

**Conservative:**
- Maximum 5% in any single altcoin
- Maximum 50% in any single asset (including BTC)

**Moderate:**
- Maximum 10% in any single altcoin
- Maximum 60% in any single asset

**Aggressive (not recommended):**
- Maximum 20% in any single altcoin
- Maximum 70% in any single asset

#### Method 2: Risk-Based Sizing

Size positions based on the asset's risk level.

| Asset Type | Max Position Size |
|------------|-------------------|
| Bitcoin | 40-60% |
| Ethereum | 20-30% |
| Large-cap altcoins | 5-10% each |
| Mid-cap altcoins | 2-5% each |
| Small-cap/memes | 1-2% each |

#### Method 3: Kelly Criterion (Advanced)

Mathematical formula for optimal position sizing:

\`\`\`
Kelly % = W - [(1-W) / R]

Where:
W = Win probability
R = Win/Loss ratio
\`\`\`

**Example:**
- 60% win rate (W = 0.6)
- Average win is 2x average loss (R = 2)
- Kelly % = 0.6 - (0.4 / 2) = 40%

**Important:** Most professionals use "half Kelly" (20% in this example) for safety. For long-term investing you rarely know W or R with any confidence, so treat Kelly as a way to see why over-betting is dangerous, not as a precise sizing rule.

### Position Sizing Example

**Portfolio**: $50,000
**Strategy**: Risk-based sizing

| Asset | Risk Level | Max % | Max $ |
|-------|------------|-------|-------|
| Bitcoin | Low | 50% | $25,000 |
| Ethereum | Low-Med | 25% | $12,500 |
| Solana | Medium | 10% | $5,000 |
| Chainlink | Medium | 5% | $2,500 |
| New altcoin | High | 2% | $1,000 |
| Cash reserve | - | 8% | $4,000 |

## Stop-Loss Strategies

Stop-losses limit downside by automatically selling at predetermined prices.

### Types of Stop-Losses

#### 1. Fixed Percentage Stop
Sell if price drops X% from purchase price.

**Common levels:**
- Conservative: 10-15%
- Moderate: 20-25%
- Aggressive: 30-40%

**Caution:** Tight stops get triggered frequently in volatile crypto markets.

#### 2. Trailing Stop
Moves up with price, locks in gains.

**Example:**
- Buy at $100
- Set 20% trailing stop
- Price rises to $150 → stop moves to $120
- Price drops to $120 → sell triggered
- Locked in $20 profit per unit

#### 3. Technical Stop
Based on support levels, moving averages, or chart patterns.

**Examples:**
- Below 200-day moving average
- Below key support level
- Below trend line

#### 4. Time-Based Stop
Exit if price doesn't perform within timeframe.

**Example:** "If not profitable in 3 months, reassess"

### Stop-Loss Considerations in Crypto

**Challenges:**
- 24/7 markets (can trigger while sleeping)
- High volatility (stops triggered then recovery)
- Flash crashes (wick through stop)
- Low liquidity (slippage on execution)

**Solutions:**
- Use mental stops + alerts instead of automatic
- Set stops below key support, not arbitrary %
- Use wider stops to accommodate volatility
- Consider position size as primary risk control

## Diversification

### Why Diversify?

Don't put all eggs in one basket. Different assets perform differently at different times.

### Diversification Strategies

#### 1. Asset Diversification
Spread across multiple cryptocurrencies.

**Minimum diversification:**
- 3-5 assets for small portfolios
- 5-15 assets for larger portfolios

**Maximum practical:**
- 15-20 assets (more becomes hard to track)

#### 2. Category Diversification
Invest across different crypto categories:

| Category | Examples | Portfolio % |
|----------|----------|-------------|
| Store of Value | BTC | 40-50% |
| Smart Contracts | ETH, SOL, AVAX | 20-30% |
| DeFi | UNI, AAVE, SKY (formerly MKR) | 5-10% |
| Infrastructure | LINK, GRT | 5-10% |
| Stablecoins | USDC, USDS (formerly DAI) | 5-10% |

(MakerDAO rebranded to Sky in 2024; DAI still exists alongside the newer USDS.)

#### 3. Temporal Diversification
Don't invest all at once:
- Dollar-cost average entries
- Scale into positions over time
- Take profits gradually

#### 4. Custody Diversification
Don't keep all funds in one place:
- Hardware wallet for long-term holdings
- Exchange for active trading
- Multiple exchanges if needed
- Multiple hardware wallets for large amounts

### Correlation Consideration

Assets that move together don't provide diversification.

**High correlation (less diversification benefit):**
- Most altcoins correlate with Bitcoin
- DeFi tokens correlate with ETH

**Lower correlation:**
- Stablecoins vs. crypto (but stablecoins carry their own issuer and de-peg risk)
- Some sector-specific tokens

In sharp sell-offs, correlations between crypto assets tend to rise towards 1, so "diversifying" across ten altcoins protects less than it seems.

## Advanced Risk Management Techniques

### 1. Risk-Adjusted Returns

Evaluate investments on return per unit of risk, not just total return.

**Example:**
- Investment A: 100% return, 80% max drawdown
- Investment B: 60% return, 30% max drawdown

Investment B has better risk-adjusted returns.

### 2. Hedging Strategies

Protect against downside using:

**Options:**
- Buy puts to protect against drops
- Sell covered calls for income
- Since November 2024, US investors can trade listed options on spot Bitcoin ETFs (for example IBIT) through an ordinary brokerage account, which is the most accessible route for most retail investors. Options can expire worthless; learn how they work before using them

**Short positions:**
- Short futures to hedge long exposure
- Warning: High risk, not for beginners

**Stablecoin allocation:**
- Move to stables during uncertainty
- Provides dry powder for opportunities

### 3. The Barbell Strategy

Combine very safe and very risky, avoid the middle:

**Safe side (80%):**
- Bitcoin
- Ethereum
- Stablecoins

**Risky side (20%):**
- High-risk/high-reward altcoins
- Early-stage projects
- Asymmetric bets

### 4. Profit Taking System

Don't let winners become losers. Systematic profit-taking:

**Option A - Price-based:**
| Price Multiple | Action |
|----------------|--------|
| 2x | Sell 25% |
| 3x | Sell 25% |
| 5x | Sell 25% |
| Hold | 25% forever |

**Option B - Time-based:**
- Take profits monthly/quarterly
- Reinvest or move to safer assets

### 5. Emergency Fund

Keep funds outside crypto for emergencies:
- 3-6 months expenses in traditional savings
- Prevents forced selling at bad times

## Building Your Risk Management Framework

### Step 1: Define Risk Tolerance

Answer honestly:
- How much can you afford to lose completely?
- How would you feel if portfolio dropped 50%?
- What's your investment time horizon?

### Step 2: Set Position Size Rules

Write down maximum position sizes:
- Per asset
- Per category
- Total crypto vs. traditional assets

### Step 3: Establish Entry/Exit Rules

Define:
- How you'll enter (lump sum, DCA, etc.)
- When you'll take profits
- What triggers a sell

### Step 4: Create Monitoring System

Set up:
- Portfolio tracking
- Price alerts
- Regular review schedule

### Step 5: Document Everything

Create a written investment policy:
- Your rules and reasoning
- Conditions for changing rules
- Review and update annually

## Risk Management Checklist

Use this before any investment:

**Before Investing:**
- [ ] Amount is money I can afford to lose
- [ ] Position size follows my rules
- [ ] I understand what I'm buying
- [ ] I have an exit strategy

**Portfolio Level:**
- [ ] No single asset > maximum allocation
- [ ] Diversified across categories
- [ ] Custody spread appropriately
- [ ] Emergency fund maintained

**Ongoing:**
- [ ] Regular portfolio review scheduled
- [ ] Price alerts set for key levels
- [ ] Rebalancing triggers defined
- [ ] Tax implications considered

## Common Risk Management Mistakes

### 1. No Plan at All
Flying blind with no risk limits or exit strategy.

### 2. Ignoring Position Sizing
Betting too big on single investments.

### 3. FOMO Overrides Rules
Breaking your rules during market euphoria.

### 4. Revenge Trading
Trying to recover losses with bigger bets.

### 5. Overconfidence
Taking larger risks after winning streaks.

### 6. Ignoring Custody Risk
Leaving everything on one exchange.

## Key Takeaways

- Risk management is more important than picking winners
- Position sizing is your first line of defense
- Diversification reduces but doesn't eliminate risk
- Have rules and follow them
- Protect capital first, grow capital second
- Document your strategy and review regularly

## Action Items

1. Calculate your maximum total crypto allocation
2. Set position size limits for each asset type
3. Diversify across assets, categories, and custody
4. Create entry and exit rules
5. Set up tracking and alerts
6. Write down your risk management policy

Next, put the plan into practice with [Portfolio Rebalancing](/learn/portfolio-rebalancing) and [DCA strategies](/learn/dca-strategies), check historical drawdowns in the [backtester](/backtesting), and if you use DeFi, read [DeFi Risks](/learn/defi-risks).

Remember: In crypto, those who manage risk survive to see the next bull market.
`
};
