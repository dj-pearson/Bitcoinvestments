import type { GuideSource } from './index';

export const defiBasicsGuide: GuideSource = {
  id: 'defi-basics',
  title: 'DeFi Explained: Understanding Decentralized Finance',
  seoTitle: 'What Is DeFi? Decentralized Finance Guide',
  description: 'What DeFi is and how it works: DEXs, lending, stablecoins, liquidity pools and AMMs, plus fees, key metrics, the risks, and how to start safely.',
  summary:
    'DeFi (decentralized finance) is a set of financial apps, such as exchanges, lending markets and stablecoins, that run as smart contracts on public blockchains instead of through banks or brokers. You use them from your own wallet, which gives you control and 24/7 access but also leaves you responsible for security, with no deposit insurance or support line.',
  category: 'DeFi',
  icon: '🏦',
  datePublished: '2026-01-02',
  dateModified: '2026-09-23',
  relatedGuides: ['yield-farming', 'defi-risks', 'understanding-blockchain'],
  relatedTools: [
    { label: 'DeFi yield tracker', url: '/defi-yield', description: 'Compare yields, with the risks spelled out' },
    { label: 'Gas fee optimizer', url: '/gas-optimizer', description: 'Current network fees and cheaper options' },
    { label: 'Scam database', url: '/scam-database', description: 'Check a protocol or token before connecting' },
  ],
  content: `
# DeFi Explained: Understanding Decentralized Finance

Decentralized Finance (DeFi) rebuilds financial services such as trading, lending and saving as smart contracts on public blockchains. This guide explains what DeFi is, how it works, and how to try it safely. If blockchains and smart contracts are new to you, read [Understanding Blockchain Technology](/learn/understanding-blockchain) first.

## What is DeFi?

DeFi stands for **Decentralized Finance** - a collection of financial applications built on blockchain networks that operate without traditional intermediaries like banks.

### Traditional Finance vs. DeFi

| Traditional Finance | DeFi |
|---------------------|------|
| Banks control your money | You control your money |
| Limited hours | 24/7/365 |
| Requires permission | Permissionless |
| Opaque (hidden processes) | Transparent (open code) |
| Slow (days for transfers) | Fast (seconds to minutes) |
| Geographic restrictions | Global access (some front-ends block certain countries) |
| Identity required | Pseudonymous |
| Deposit insurance, fraud teams | No insurance, no reversals |

### The DeFi Stack

DeFi is built in layers (not to be confused with "Layer 2" scaling networks, which are separate blockchains that settle to a base chain):

1. **Settlement layer**: the blockchain itself, e.g. Ethereum, Solana, or an Ethereum Layer 2 such as Arbitrum or Base
2. **Protocol layer**: smart contracts that provide the service (a lending market, an exchange)
3. **Application layer**: websites and apps you use to interact with those contracts
4. **Aggregation layer**: tools that route your trade or deposit across many protocols

## Core DeFi Concepts

### Smart Contracts

Self-executing programs that automatically enforce agreements.

**Example**: A lending smart contract automatically:
- Accepts deposits
- Calculates interest
- Enables borrowing against collateral
- Liquidates under-collateralized loans

All without human intervention.

### Liquidity Pools

Pools of tokens locked in smart contracts that enable trading and other activities.

**How they work:**
1. Users deposit tokens into pools (become "liquidity providers")
2. Traders swap tokens using the pool
3. Liquidity providers earn fees from trades

### Automated Market Makers (AMMs)

Algorithms that determine prices based on token ratios in liquidity pools.

**The formula** (constant product):
\`\`\`
x * y = k

Where:
x = Amount of Token A in pool
y = Amount of Token B in pool
k = Constant (always stays the same)
\`\`\`

When you buy Token A, its quantity in the pool decreases, so its price increases.

### Total Value Locked (TVL)

The total amount of assets deposited in DeFi protocols. Used to measure protocol adoption and trust.

### Gas Fees

Transaction fees paid to use the network. On Ethereum, part of each fee (the base fee) is burned and the rest (the priority fee) goes to validators. In DeFi:
- Complex transactions = higher gas
- Busy networks = higher gas
- Layer 2s and other chains = lower gas

## Major DeFi Categories

### 1. Decentralized Exchanges (DEXs)

Trade cryptocurrencies without centralized intermediaries.

**How DEXs Work:**
- Use liquidity pools instead of order books
- Automated market makers set prices
- Anyone can trade or provide liquidity

**Popular DEXs:**
| DEX | Chain | Type |
|-----|-------|------|
| Uniswap | Ethereum and L2s | AMM |
| Curve | Ethereum and L2s | Stablecoin AMM |
| Aerodrome | Base | AMM |
| Jupiter | Solana | Aggregator |

Perpetual-futures exchanges such as dYdX (now its own Cosmos-based chain) and Hyperliquid are not available to US users and involve leverage; they are not a starting point for beginners.

### 2. Lending & Borrowing

Lend your crypto to earn interest, or borrow against your holdings.

**How It Works:**
1. **Lenders** deposit assets into pools
2. **Borrowers** provide collateral and borrow from pools
3. Interest rates adjust based on supply/demand
4. No credit checks - only collateral matters

**Key Concept - Over-Collateralization:**
DeFi loans require more collateral than the loan amount.

**Example:**
- Want to borrow $1,000
- Must deposit $1,500+ in collateral
- If collateral value drops, loan gets liquidated

**Popular Lending Protocols:**
- **Aave**: The largest lending market, on many chains; variable rates (its old "stable rate" borrowing has been retired)
- **Compound**: One of the original lending protocols; algorithmic rates
- **Sky** (formerly MakerDAO): Issues the USDS stablecoin (and the older DAI) against collateral

### 3. Stablecoins

Cryptocurrencies designed to maintain stable value, usually $1.

**Types of Stablecoins:**

| Type | How It Works | Examples |
|------|--------------|----------|
| Fiat-backed | Reserves of cash and short-term US Treasury bills | USDC, USDT, PYUSD |
| Crypto-backed | Over-collateralized by crypto and other assets | DAI, USDS |
| Algorithmic | Supply adjusts to maintain the peg, with little or no collateral | TerraUSD (UST), which collapsed in May 2022 |

Purely algorithmic stablecoins have a poor track record: UST lost its peg and wiped out roughly $40 billion of value in days. In the US, the **GENIUS Act** (signed July 2025) set federal rules for payment stablecoins, including 1:1 reserves of cash and short-term Treasuries and regular public disclosure of reserves. It does not make a stablecoin risk-free or government-insured.

**Use Cases:**
- Store value without volatility
- Trading pairs on DEXs
- Earning yield
- Cross-border payments

### 4. Derivatives

Financial contracts based on underlying assets.

**DeFi Derivatives:**
- **Perpetual futures**: Trade with leverage, no expiry
- **Options**: Right to buy/sell at specific price
- **Synthetic assets**: Track real-world assets

**Examples:**
- dYdX and Hyperliquid (perpetuals; not available to US users)
- GMX (perpetuals)
- Synthetix (synthetic assets)

Leveraged derivatives can liquidate your whole deposit in minutes. They are not suitable for beginners.

### 5. Yield Aggregators

Automatically optimize yield farming strategies.

**How They Work:**
1. You deposit assets
2. Protocol automatically moves funds to best yields
3. Compounds returns automatically
4. You withdraw with profits

**Popular Aggregators:**
- Yearn Finance
- Beefy Finance
- Harvest Finance

### 6. Insurance

Protect against smart contract failures and hacks.

**What It Covers:**
- Smart contract bugs
- Oracle failures
- Governance attacks
- Exchange hacks

**Providers:**
- Nexus Mutual is the longest-running; a handful of smaller providers come and go

Coverage is limited, claims are decided by the provider's members or rules, and cover amounts are small relative to DeFi deposits. Read exactly what is and isn't covered.

## How to Get Started with DeFi

### Step 1: Get a Web3 Wallet

You need a non-custodial wallet that can interact with DeFi apps.

**Recommended Wallets:**
- **MetaMask**: Most popular, browser extension
- **Rabby**: Better security, multi-chain
- **Rainbow**: Mobile-friendly
- **Phantom**: For Solana

### Step 2: Fund Your Wallet

Transfer crypto from an exchange to your wallet:
1. Copy your wallet address
2. Withdraw from exchange to that address
3. Start with small amounts to test

### Step 3: Connect to DeFi Apps

1. Visit the DeFi protocol's website
2. Click "Connect Wallet"
3. Approve the connection in your wallet
4. Now you can interact with the protocol

### Step 4: Start Simple

Begin with straightforward activities:
1. **Swap tokens** on a DEX (Uniswap)
2. **Provide liquidity** in a stable pair
3. **Lend** stablecoins for yield
4. **Graduate** to more complex strategies

## Understanding DeFi Fees

### Gas Fees

Transaction fees vary by:
- Network congestion
- Transaction complexity
- Chain used

**Rough cost comparison (typical 2025–2026 ranges; fees change minute to minute):**
| Chain | Typical Swap Cost |
|-------|-------------------|
| Ethereum mainnet | Often under $1–5 when quiet; $20+ at busy times |
| Arbitrum, Base, Optimism | Usually a few cents |
| Polygon (POL) | Usually under a cent to a few cents |
| Solana | Usually under a cent to a few cents |

Since Ethereum's Dencun upgrade (March 2024), Layer 2 fees have dropped sharply. Check live Ethereum fees in our [gas optimizer](/gas-optimizer).

### Protocol Fees

- Swap fees: 0.1-0.3% per trade
- Lending rates: Variable (0.1-10%+ APY)
- Withdrawal fees: Often none, just gas

## DeFi vs. CeFi (Centralized Finance)

### When to Use DeFi

- Want full control of your assets
- Need 24/7 access
- Want to earn yield on holdings
- Privacy is important
- Willing to manage own security

### When to Use CeFi

- New to crypto
- Want customer support
- Need fiat on/off ramps
- Not comfortable with self-custody
- Want a company you can contact (note that crypto held with a centralized platform is not FDIC-insured, and platforms such as Celsius and FTX failed in 2022)

### The Hybrid Approach

Many users use both:
1. Buy crypto on centralized exchange
2. Transfer to wallet for DeFi activities
3. Use CeFi for fiat conversion

## Key DeFi Metrics to Understand

### APY vs. APR

**APR (Annual Percentage Rate):**
Simple interest, not compounded

**APY (Annual Percentage Yield):**
Includes compound interest

**Example:**
- 10% APR, not compounded = 10% return over a year
- 10% APR compounded daily = about 10.52% APY

### Impermanent Loss

When providing liquidity, you can lose value compared to just holding.

**Example:**
- Deposit 1 ETH + $2000 USDC to pool
- ETH price doubles to $4000
- Your LP position is now worth less than if you just held

*We cover this in detail, with a table, in the [Yield Farming guide](/learn/yield-farming).*

### Health Factor

In lending protocols, measures how safe your loan is.

- Health Factor > 1: Safe
- Health Factor < 1: Can be liquidated

Higher collateral = higher health factor = safer loan.

## DeFi Safety Basics

### Before Using Any Protocol

1. **Research the project**: Team, audits, track record
2. **Check TVL**: Higher usually means more trust
3. **Read the docs**: Understand how it works
4. **Start small**: Test with amounts you can afford to lose
5. **Verify URLs**: Phishing sites are common

### While Using DeFi

1. **Approve only what's needed**: Revoke unused approvals
2. **Monitor positions**: Set alerts for important levels
3. **Understand liquidation risks**: Keep health factor safe
4. **Diversify protocols**: Don't put everything in one place

### Red Flags

- Anonymous teams
- No audits
- Unrealistic APYs (1000%+)
- Recently launched (< 6 months)
- Low TVL (< $10M)
- Listed in our [scam database](/scam-database)

## The Future of DeFi

### Current Limitations

- High gas fees (on Ethereum mainnet)
- Complexity for new users
- Smart contract risks
- Regulatory uncertainty

### What's Improving

- Layer 2 solutions reducing costs
- Better user interfaces
- Cross-chain bridges
- Institutional adoption
- Regulatory frameworks developing (the US GENIUS Act for stablecoins in 2025; market-structure legislation still pending in the Senate as of September 2026)

## Key Takeaways

- DeFi enables financial services without intermediaries
- Core activities: trading, lending, borrowing, earning yield
- You maintain full control but also full responsibility
- Start simple and understand what you're doing
- Always consider gas costs in your calculations
- Security is your responsibility - research before using

## Next Steps

1. Set up a Web3 wallet (MetaMask)
2. Transfer a small amount of ETH or other crypto
3. Practice a simple swap on Uniswap
4. Learn about [yield farming](/learn/yield-farming) in our next guide
5. Read [DeFi Risks Explained](/learn/defi-risks) before going deeper
6. Compare current yields, with their risks, on our [DeFi yield page](/defi-yield)

DeFi is powerful but complex. Take your time learning before committing significant capital.
`
};
