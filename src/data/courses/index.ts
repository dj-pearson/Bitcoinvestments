export interface CourseModule {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  duration: number; // minutes
  objectives: string[];
  content: string; // Markdown content
}

export interface Course {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  totalDuration: number; // total minutes
  moduleCount: number;
  modules: CourseModule[];
  prerequisites?: string[];
  outcomes: string[];
}

export const beginnerCompleteCourse: Course = {
  id: 'beginner-complete-course',
  title: "Beginner's Complete Course",
  description: 'From zero to confident crypto investor in 6 comprehensive modules',
  longDescription: `This comprehensive course takes you from complete beginner to confident cryptocurrency investor.

You'll learn everything from the basics of what cryptocurrency is, to making your first purchase, securing your assets, and developing a long-term investment strategy. Each module builds on the previous one, ensuring you have a solid foundation before moving forward.`,
  icon: '🎓',
  difficulty: 'Beginner',
  totalDuration: 180,
  moduleCount: 6,
  prerequisites: [],
  outcomes: [
    'Understand how Bitcoin and cryptocurrencies work',
    'Safely buy and store your first cryptocurrency',
    'Implement security best practices',
    'Develop a personal investment strategy',
    'Avoid common mistakes that cost beginners money',
    'Confidently navigate the crypto ecosystem'
  ],
  modules: [
    {
      id: 'module-1-crypto-fundamentals',
      moduleNumber: 1,
      title: 'Cryptocurrency Fundamentals',
      description: 'Understanding Bitcoin, blockchain, and why crypto matters',
      duration: 25,
      objectives: [
        'Define what cryptocurrency is and how it differs from traditional money',
        'Understand how blockchain technology works',
        'Recognize why Bitcoin was created and its value proposition',
        'Identify different types of cryptocurrencies'
      ],
      content: `
# Module 1: Cryptocurrency Fundamentals

Welcome to your crypto journey! In this first module, we'll build the foundation you need to understand the entire cryptocurrency ecosystem.

## What is Cryptocurrency?

Cryptocurrency is digital or virtual money that uses cryptography for security. Unlike traditional currencies issued by governments (called "fiat currencies"), cryptocurrencies operate on decentralized networks.

### Key Characteristics

1. **Digital**: Exists only in electronic form - no physical coins or bills
2. **Decentralized**: No central authority like a bank or government controls it
3. **Secure**: Uses advanced cryptography to secure transactions
4. **Transparent**: All transactions are recorded on a public ledger
5. **Global**: Can be sent anywhere in the world, 24/7

## The Story of Bitcoin

In 2008, during the global financial crisis, an anonymous person (or group) using the name **Satoshi Nakamoto** published a whitepaper titled "Bitcoin: A Peer-to-Peer Electronic Cash System."

### Why Bitcoin Was Created

- **Remove intermediaries**: Send money directly to anyone, anywhere
- **Prevent inflation**: Fixed supply of 21 million coins
- **Financial freedom**: No government or bank can freeze your funds
- **Transparency**: Anyone can verify transactions

> "The root problem with conventional currency is all the trust that's required to make it work." - Satoshi Nakamoto

## How Blockchain Works

Blockchain is the technology that powers Bitcoin and most cryptocurrencies. Think of it as a shared, unchangeable record book.

### The Blockchain Process

1. **Transaction Initiated**: You decide to send Bitcoin to someone
2. **Broadcast**: Your transaction is sent to the network
3. **Verification**: Thousands of computers (nodes) verify the transaction
4. **Block Creation**: Verified transactions are grouped into a "block"
5. **Chain Addition**: The block is added to the existing chain of blocks
6. **Confirmation**: The transaction is complete and permanent

### Why Blockchain is Secure

- **Distributed**: Copies exist on thousands of computers worldwide
- **Immutable**: Once recorded, transactions cannot be altered
- **Transparent**: Anyone can view the blockchain
- **Consensus**: Network must agree on the validity of transactions

## Types of Cryptocurrencies

While Bitcoin was the first, there are now thousands of cryptocurrencies. Here are the main categories:

### 1. Bitcoin (BTC)
The original cryptocurrency and largest by market cap. Often called "digital gold."

### 2. Ethereum (ETH)
A platform for building decentralized applications (dApps) and smart contracts.

### 3. Stablecoins
Cryptocurrencies pegged to stable assets like the US dollar:
- USDT (Tether)
- USDC (USD Coin)
- DAI

### 4. Altcoins
All other cryptocurrencies besides Bitcoin:
- Litecoin (LTC)
- Cardano (ADA)
- Solana (SOL)
- And thousands more

## Why This Matters for You

Understanding these fundamentals helps you:

- **Make informed decisions** about which cryptocurrencies to invest in
- **Recognize scams** that prey on uninformed investors
- **Understand market movements** and why prices fluctuate
- **Communicate confidently** about crypto with others

## Key Terms to Remember

| Term | Definition |
|------|------------|
| **Cryptocurrency** | Digital money secured by cryptography |
| **Blockchain** | A distributed ledger recording all transactions |
| **Bitcoin** | The first and largest cryptocurrency |
| **Satoshi** | The smallest unit of Bitcoin (0.00000001 BTC) |
| **Node** | A computer that maintains a copy of the blockchain |
| **Mining** | The process of validating transactions and creating new coins |

## Module 1 Quiz

Test your understanding:

1. What makes cryptocurrency different from traditional money?
2. Who created Bitcoin and when?
3. What is the maximum number of Bitcoins that will ever exist?
4. What is a blockchain?
5. Name three types of cryptocurrencies besides Bitcoin.

## Next Steps

Congratulations on completing Module 1! You now understand the basics of what cryptocurrency is and how it works.

In **Module 2**, we'll explore how to actually buy your first cryptocurrency safely and choose the right exchange for your needs.

---

**Key Takeaways:**
- Cryptocurrency is decentralized digital money secured by cryptography
- Bitcoin was created in 2008 to provide financial freedom from banks and governments
- Blockchain technology ensures security and transparency
- There are thousands of cryptocurrencies with different purposes
`
    },
    {
      id: 'module-2-buying-first-crypto',
      moduleNumber: 2,
      title: 'Buying Your First Cryptocurrency',
      description: 'Choosing an exchange, verification, and making your first purchase',
      duration: 30,
      objectives: [
        'Compare different cryptocurrency exchanges',
        'Complete exchange verification (KYC) process',
        'Fund your account and make your first purchase',
        'Understand fees and how to minimize them'
      ],
      content: `
# Module 2: Buying Your First Cryptocurrency

Now that you understand what cryptocurrency is, it's time to make your first purchase. This module will guide you through the entire process step by step.

## Choosing a Cryptocurrency Exchange

An exchange is a platform where you can buy, sell, and trade cryptocurrencies. Choosing the right one is crucial for a good experience.

### Types of Exchanges

#### Centralized Exchanges (CEX)
Most beginner-friendly option. Companies that act as intermediaries.

**Pros:**
- Easy to use
- Customer support available
- Fiat currency support (USD, EUR, etc.)
- High liquidity

**Cons:**
- Requires identity verification (KYC)
- You don't control private keys
- Can be hacked or freeze accounts

**Popular Options:**
- **Coinbase** - Best for beginners, user-friendly interface
- **Kraken** - Strong security, good for US customers
- **Gemini** - Regulated, great security features

#### Decentralized Exchanges (DEX)
For more advanced users who want full control.

**Popular Options:**
- Uniswap
- SushiSwap
- dYdX

### How to Choose Your First Exchange

Consider these factors:

| Factor | What to Look For |
|--------|-----------------|
| **Security** | 2FA, insurance, cold storage |
| **Fees** | Trading fees, withdrawal fees, deposit fees |
| **Supported Coins** | Does it have what you want to buy? |
| **Payment Methods** | Bank transfer, debit card, wire |
| **User Experience** | Easy interface for beginners |
| **Customer Support** | Responsive help when needed |
| **Regulation** | Licensed in your country |

## Setting Up Your Account

### Step 1: Create an Account

1. Visit your chosen exchange's website
2. Click "Sign Up" or "Get Started"
3. Enter your email address
4. Create a strong, unique password
5. Verify your email

### Step 2: Complete Verification (KYC)

KYC (Know Your Customer) is required by law for most exchanges.

**What You'll Need:**
- Government-issued ID (passport, driver's license)
- Proof of address (utility bill, bank statement)
- Selfie or video verification
- Social Security Number (for US customers)

**Tips for Fast Verification:**
- Use high-quality photos with good lighting
- Make sure all text is clearly readable
- Match the name on your ID exactly
- Be patient - can take 24-72 hours

### Step 3: Secure Your Account

**Essential Security Measures:**

1. **Enable Two-Factor Authentication (2FA)**
   - Use an authenticator app (Google Authenticator, Authy)
   - Avoid SMS-based 2FA if possible

2. **Use a Strong Password**
   - At least 16 characters
   - Mix of letters, numbers, symbols
   - Don't reuse passwords

3. **Whitelist Withdrawal Addresses**
   - Only allow withdrawals to pre-approved addresses

## Funding Your Account

### Payment Methods

| Method | Speed | Fees | Limits |
|--------|-------|------|--------|
| **Bank Transfer (ACH)** | 3-5 days | Low/Free | High |
| **Wire Transfer** | 1-2 days | Medium | Very High |
| **Debit Card** | Instant | High (3-5%) | Medium |
| **Credit Card** | Instant | Very High | Medium |

### Recommended Approach

1. **Start with ACH transfer** for lowest fees
2. Use debit card only for small, urgent purchases
3. Avoid credit cards (high fees + potential cash advance charges)

## Making Your First Purchase

### Market Orders vs. Limit Orders

**Market Order:**
- Buy immediately at current market price
- Best for beginners
- Guaranteed execution
- May get slightly different price than shown

**Limit Order:**
- Set your own price
- Order only fills if price is reached
- Good for specific entry points
- May not execute if price never hits

### Your First Buy: Step by Step

1. **Navigate to the trading section**
2. **Select Bitcoin (BTC)** - recommended for your first purchase
3. **Choose "Buy" or "Purchase"**
4. **Enter the amount** (start small - $25-$100)
5. **Review the transaction** including fees
6. **Confirm the purchase**
7. **Verify it appears** in your portfolio

## Understanding Fees

### Types of Exchange Fees

1. **Trading Fees** (0.1% - 1.5%)
   - Charged on each buy/sell
   - Usually a percentage of transaction

2. **Deposit Fees**
   - Often free for bank transfers
   - 2-5% for debit/credit cards

3. **Withdrawal Fees**
   - Fixed amount per withdrawal
   - Varies by cryptocurrency

4. **Spread**
   - Hidden fee in price difference
   - More common on simple "buy" interfaces

### How to Minimize Fees

- Use bank transfers instead of cards
- Use "Pro" or "Advanced" trading interfaces
- Trade during low-volume periods
- Withdraw less frequently (batch withdrawals)
- Compare fees across exchanges

## Common First-Timer Mistakes

1. **Buying with Credit Card** - High fees, potential cash advance charges
2. **Not Enabling 2FA** - Account security risk
3. **Panic Selling** - Price drops are normal; don't sell in fear
4. **Going All-In** - Never invest more than you can afford to lose
5. **Leaving Crypto on Exchange** - We'll cover proper storage in Module 3

## Practice Exercise

Before investing real money, try these steps:

1. Create an account on a beginner-friendly exchange
2. Complete identity verification
3. Enable 2FA using an authenticator app
4. Link a bank account (don't deposit yet)
5. Explore the interface and understand the fees

## Module 2 Summary

You now know how to:
- Choose the right exchange for your needs
- Set up and secure your account
- Fund your account cost-effectively
- Make your first cryptocurrency purchase
- Avoid common beginner mistakes

---

**Key Takeaways:**
- Start with a reputable, regulated exchange like Coinbase or Kraken
- Complete KYC verification before trying to deposit
- Always enable two-factor authentication
- Use bank transfers to minimize fees
- Start small with your first purchase ($25-$100)

**Next Module:** Securing Your Crypto - because buying is just the beginning!
`
    },
    {
      id: 'module-3-securing-crypto',
      moduleNumber: 3,
      title: 'Securing Your Cryptocurrency',
      description: 'Wallets, private keys, and protecting your investment',
      duration: 35,
      objectives: [
        'Understand different types of crypto wallets',
        'Set up a secure wallet for your needs',
        'Properly backup and protect your seed phrase',
        'Implement security best practices'
      ],
      content: `
# Module 3: Securing Your Cryptocurrency

"Not your keys, not your coins" is a fundamental principle in crypto. This module teaches you how to take full control of your assets.

## Why Security Matters

When you buy crypto on an exchange, the exchange controls it. If the exchange:
- Gets hacked
- Goes bankrupt
- Freezes your account
- Gets shut down by regulators

**You could lose everything.**

Famous examples:
- **Mt. Gox (2014)**: 850,000 BTC stolen, users lost everything
- **FTX (2022)**: Billions lost when exchange collapsed
- **QuadrigaCX (2019)**: CEO died with only access to cold wallets

## Understanding Crypto Wallets

A wallet doesn't actually "store" your crypto. Your coins live on the blockchain. A wallet stores your **private keys** - the passwords that prove you own your crypto.

### Types of Wallets

#### 1. Exchange Wallets (Custodial)
Your crypto stays on the exchange.

| Pros | Cons |
|------|------|
| Convenient | You don't control keys |
| No setup required | Can be hacked |
| Easy to trade | Can freeze accounts |
| Customer support | Single point of failure |

**Best for:** Small amounts you're actively trading

#### 2. Software Wallets (Hot Wallets)
Apps on your phone or computer.

| Pros | Cons |
|------|------|
| You control keys | Connected to internet |
| Free to use | Malware risk |
| Easy to access | Device can be lost/stolen |
| Good for daily use | Less secure than hardware |

**Popular Options:**
- **Exodus** - Beautiful interface, multi-coin
- **BlueWallet** - Bitcoin-focused, Lightning support
- **Trust Wallet** - Good for altcoins
- **MetaMask** - Essential for DeFi/Ethereum

**Best for:** Moderate amounts for regular use

#### 3. Hardware Wallets (Cold Storage)
Physical devices that store keys offline.

| Pros | Cons |
|------|------|
| Most secure | Costs $60-$200 |
| Keys never online | Less convenient |
| Immune to malware | Can be lost/damaged |
| Built-in screens | Learning curve |

**Popular Options:**
- **Ledger Nano X** - Bluetooth, wide coin support
- **Trezor Model T** - Touchscreen, open source
- **Coldcard** - Bitcoin-only, maximum security

**Best for:** Significant amounts for long-term holding

#### 4. Paper Wallets
Private keys printed on paper.

| Pros | Cons |
|------|------|
| Completely offline | Easy to damage |
| Free | Hard to use securely |
| No electronics | No partial withdrawals |

**Best for:** Advanced users only (mostly obsolete)

## The Seed Phrase: Your Master Key

When you create a wallet, you'll receive a **seed phrase** (also called recovery phrase or mnemonic). This is usually 12 or 24 words.

### Example Seed Phrase
\`\`\`
apple banana cherry diamond elephant flower
garden horizon igloo jungle kingdom lemon
\`\`\`

### Critical Rules for Your Seed Phrase

**DO:**
- Write it down on paper (multiple copies)
- Store copies in different physical locations
- Use a metal backup (fire/water resistant)
- Memorize it if possible

**DON'T:**
- Store it digitally (no photos, no notes app, no cloud)
- Share it with anyone
- Enter it on any website
- Keep only one copy

> Anyone with your seed phrase has complete access to your crypto. There is no customer support, no recovery, no reversing transactions.

## Setting Up Your First Hardware Wallet

### Step-by-Step: Ledger Setup

1. **Purchase from official site only**
   - Never buy used or from third parties
   - Verify security seal is intact

2. **Install Ledger Live**
   - Download from official website
   - Verify the download

3. **Set up as new device**
   - Create a new PIN (6-8 digits)
   - Write down your 24-word seed phrase

4. **Verify your seed phrase**
   - Device will quiz you on random words
   - This confirms you wrote it correctly

5. **Install apps**
   - Add Bitcoin, Ethereum, etc. as needed

6. **Test with small amount**
   - Send a small amount first
   - Verify you can send and receive

### Backup Verification

After setup, you should:
1. Write seed phrase on metal backup
2. Store in secure location (safe, safety deposit box)
3. Create a second paper backup
4. Store in different location
5. Test recovery on a different device (optional but recommended)

## Security Best Practices

### Account Security

1. **Use unique, strong passwords**
   - Password manager recommended (1Password, Bitwarden)
   - Never reuse passwords

2. **Enable 2FA everywhere**
   - Use authenticator apps, not SMS
   - Backup your 2FA codes

3. **Use a dedicated email**
   - Create separate email for crypto accounts
   - Enable additional security features

### Operational Security

1. **Verify addresses carefully**
   - Always triple-check recipient addresses
   - Use QR codes when possible
   - Send test transactions first

2. **Be paranoid about phishing**
   - Never click links in emails
   - Type URLs directly
   - Verify SSL certificates

3. **Keep software updated**
   - Wallet firmware
   - Operating system
   - Antivirus software

### Physical Security

1. **Don't talk about your holdings**
   - Bragging makes you a target
   - Even family can be compromised

2. **Secure your devices**
   - Use strong device passwords
   - Enable full disk encryption
   - Consider a dedicated crypto device

3. **Plan for inheritance**
   - What happens to your crypto if you die?
   - Consider a crypto will or dead man's switch

## Common Security Mistakes

| Mistake | Consequence | Prevention |
|---------|-------------|------------|
| Storing seed phrase digitally | Complete theft | Paper/metal only |
| Using SMS 2FA | SIM swap attacks | Use authenticator apps |
| Clicking phishing links | Account compromise | Type URLs directly |
| Reusing passwords | Multi-account breach | Password manager |
| Public WiFi transactions | Man-in-middle attacks | Use VPN or mobile data |

## Security Checklist

Use this checklist to secure your crypto:

- [ ] Hardware wallet purchased from official source
- [ ] Seed phrase written on paper (multiple copies)
- [ ] Metal backup created
- [ ] Backups stored in separate locations
- [ ] Strong, unique passwords for all accounts
- [ ] 2FA enabled with authenticator app
- [ ] Test transaction completed successfully
- [ ] Recovery process understood and tested
- [ ] Inheritance plan in place

## Module 3 Summary

Security is your responsibility in crypto. The good news is that proper security is straightforward - it just requires diligence.

---

**Key Takeaways:**
- "Not your keys, not your coins" - take custody of significant holdings
- Hardware wallets are the gold standard for security
- Your seed phrase IS your crypto - protect it like your life savings
- Never store seed phrases digitally
- Follow security best practices consistently

**Next Module:** Understanding the Market - learn to interpret prices, trends, and make informed decisions.
`
    },
    {
      id: 'module-4-understanding-market',
      moduleNumber: 4,
      title: 'Understanding the Crypto Market',
      description: 'Reading charts, understanding volatility, and market cycles',
      duration: 30,
      objectives: [
        'Read and interpret basic price charts',
        'Understand market cycles and volatility',
        'Identify bull and bear markets',
        'Use market indicators to inform decisions'
      ],
      content: `
# Module 4: Understanding the Crypto Market

The crypto market operates 24/7/365 and can be incredibly volatile. This module helps you understand what moves prices and how to interpret market data.

## Market Fundamentals

### What Determines Crypto Prices?

Like any market, crypto prices are determined by **supply and demand**:

**Price goes UP when:**
- More buyers than sellers
- Good news or positive developments
- Institutional adoption
- Reduced supply (like Bitcoin halving)

**Price goes DOWN when:**
- More sellers than buyers
- Bad news or negative developments
- Regulatory crackdowns
- Exchange hacks or security issues

### Unique Crypto Market Characteristics

1. **24/7 Trading**: Never closes, no holidays
2. **High Volatility**: 10-20% daily moves are normal
3. **Global**: Trades simultaneously worldwide
4. **Correlation**: Most cryptos move together with Bitcoin
5. **Retail Driven**: More individual investors than stocks

## Reading Price Charts

Understanding charts is essential for making informed decisions.

### Basic Chart Types

#### Line Chart
Shows closing prices connected by a line. Best for seeing overall trends.

#### Candlestick Chart
Most popular for crypto. Each "candle" shows:
- **Open price**: Where the period started
- **Close price**: Where it ended
- **High**: Maximum price reached
- **Low**: Minimum price reached

**Green/White candle** = Price went UP (close > open)
**Red/Black candle** = Price went DOWN (close < open)

### Timeframes

| Timeframe | Best For |
|-----------|----------|
| 1 minute | Scalp trading (not recommended) |
| 1 hour | Short-term moves |
| 4 hours | Swing trading |
| Daily | Most useful for investors |
| Weekly | Long-term trends |
| Monthly | Big picture view |

### Key Price Levels

#### Support
A price level where buying pressure typically prevents further decline. Think of it as a "floor."

#### Resistance
A price level where selling pressure typically prevents further rise. Think of it as a "ceiling."

#### All-Time High (ATH)
The highest price ever reached. Major psychological level.

## Market Cycles

Crypto markets tend to move in cycles, often related to Bitcoin's halving events.

### The Four Phases

#### 1. Accumulation (Bottom)
- Price has fallen significantly
- Sentiment is extremely negative
- Smart money starts buying
- Low volatility, sideways movement

#### 2. Bull Market (Uptrend)
- Prices rising consistently
- Growing optimism
- Media coverage increases
- New investors enter
- FOMO (Fear of Missing Out) kicks in

#### 3. Distribution (Top)
- Price makes new highs
- Extreme optimism/euphoria
- Everyone talking about crypto
- "This time is different" mentality
- Smart money sells to newcomers

#### 4. Bear Market (Downtrend)
- Prices falling consistently
- Growing pessimism
- Media coverage turns negative
- Capitulation events
- "Crypto is dead" headlines

### Bitcoin Halving Cycles

Every ~4 years, Bitcoin's mining reward is cut in half. Historically, this has preceded major bull runs:

| Halving | Date | Price at Halving | Next Bull Peak |
|---------|------|------------------|----------------|
| 1st | Nov 2012 | $12 | $1,100 (2013) |
| 2nd | Jul 2016 | $650 | $20,000 (2017) |
| 3rd | May 2020 | $8,700 | $69,000 (2021) |
| 4th | Apr 2024 | $64,000 | TBD |

> Past performance doesn't guarantee future results, but understanding cycles helps set realistic expectations.

## Key Market Indicators

### 1. Market Cap
Total value of a cryptocurrency: Price × Circulating Supply

**Categories:**
- Large Cap: $10B+ (Bitcoin, Ethereum)
- Mid Cap: $1B-$10B
- Small Cap: $100M-$1B
- Micro Cap: <$100M (high risk)

### 2. Volume
Amount of trading in a period. Higher volume = more conviction in price moves.

### 3. Bitcoin Dominance
Bitcoin's percentage of total crypto market cap.
- Rising: Risk-off, flight to quality
- Falling: Altcoin season, risk-on

### 4. Fear & Greed Index
Measures market sentiment from 0 (Extreme Fear) to 100 (Extreme Greed).

| Score | Sentiment | Consideration |
|-------|-----------|---------------|
| 0-25 | Extreme Fear | Potential buying opportunity |
| 25-45 | Fear | Market undervalued |
| 45-55 | Neutral | Wait for direction |
| 55-75 | Greed | Market overvalued |
| 75-100 | Extreme Greed | Potential selling opportunity |

> "Be fearful when others are greedy, and greedy when others are fearful." - Warren Buffett

## Understanding Volatility

### Why Is Crypto So Volatile?

1. **Small market size**: Compared to stocks/forex
2. **24/7 trading**: No circuit breakers
3. **Leverage**: Amplifies moves both ways
4. **Low liquidity**: In smaller coins
5. **News sensitivity**: Tweets can move markets
6. **Speculation**: Many buyers don't understand fundamentals

### How to Handle Volatility

**Mental Preparation:**
- Expect 30-40% drops even in bull markets
- Expect 80%+ drops in bear markets
- Don't check prices constantly
- Zoom out to longer timeframes

**Practical Strategies:**
- Only invest what you can afford to lose
- Dollar-cost average to smooth entry
- Have an exit strategy before you buy
- Take profits on the way up
- Keep some cash for opportunities

## Common Market Mistakes

1. **Buying the Top**
   - FOMO into parabolic moves
   - Solution: DCA, don't chase pumps

2. **Selling the Bottom**
   - Panic selling during crashes
   - Solution: Have a plan, stick to it

3. **Overtrading**
   - Trying to catch every move
   - Solution: Long-term perspective

4. **Ignoring Bitcoin**
   - Chasing small cap coins first
   - Solution: Start with BTC, then diversify

5. **Using Leverage**
   - Amplifying both gains AND losses
   - Solution: Avoid leverage as a beginner

## Your Market Analysis Checklist

Before making decisions, consider:

- [ ] What is the current market cycle phase?
- [ ] What is Bitcoin doing? (BTC leads the market)
- [ ] What is the Fear & Greed Index showing?
- [ ] Am I making this decision based on emotion or logic?
- [ ] Does this fit my long-term strategy?
- [ ] Can I afford to lose this money?

## Module 4 Summary

Understanding the market helps you make rational decisions and avoid emotional mistakes.

---

**Key Takeaways:**
- Price is determined by supply and demand
- Learn to read basic candlestick charts
- Crypto moves in cycles - understand where we are
- Use indicators like Fear & Greed Index as guides
- Expect volatility and plan for it
- Never make emotional decisions

**Next Module:** Building Your Investment Strategy - create a personalized approach to crypto investing.
`
    },
    {
      id: 'module-5-investment-strategy',
      moduleNumber: 5,
      title: 'Building Your Investment Strategy',
      description: 'Portfolio allocation, DCA, and developing your personal approach',
      duration: 35,
      objectives: [
        'Determine your risk tolerance and investment goals',
        'Build a diversified crypto portfolio',
        'Implement dollar-cost averaging effectively',
        'Create entry and exit strategies'
      ],
      content: `
# Module 5: Building Your Investment Strategy

A solid strategy is what separates successful investors from gamblers. This module helps you develop a personalized approach to crypto investing.

## Defining Your Investment Goals

Before investing, answer these questions:

### 1. What's Your Time Horizon?

| Horizon | Strategy | Risk Level |
|---------|----------|------------|
| <1 year | Short-term | High (timing matters) |
| 1-3 years | Medium-term | Medium |
| 3-5 years | Long-term | Lower (time to recover) |
| 5+ years | Very long-term | Lowest |

### 2. What's Your Risk Tolerance?

**Conservative:**
- Can't stomach 50%+ drawdowns
- Need money in <3 years
- Crypto is <5% of portfolio

**Moderate:**
- Uncomfortable but can handle volatility
- 3-5 year horizon
- Crypto is 5-15% of portfolio

**Aggressive:**
- High risk tolerance
- 5+ year horizon
- Crypto is 15-30% of portfolio

### 3. What Are Your Goals?

- **Preservation**: Beat inflation, store value
- **Growth**: Significant portfolio appreciation
- **Income**: Generate yield from holdings
- **Speculation**: High risk, high reward plays

## Portfolio Allocation

### The Golden Rule

> Never invest more than you can afford to lose completely.

### Suggested Allocations by Risk Profile

**Conservative Portfolio:**
- 80% Bitcoin
- 15% Ethereum
- 5% Stablecoins (for opportunities)

**Moderate Portfolio:**
- 50% Bitcoin
- 30% Ethereum
- 15% Large-cap altcoins
- 5% Stablecoins

**Aggressive Portfolio:**
- 40% Bitcoin
- 25% Ethereum
- 25% Altcoins (various cap sizes)
- 10% High-risk/high-reward plays

### Why Bitcoin First?

1. **Most proven**: 15+ years of history
2. **Most liquid**: Easiest to buy/sell
3. **Least risky**: In crypto terms
4. **Institutional adoption**: Largest player interest
5. **Store of value**: Clearest use case

### Altcoin Selection Criteria

If including altcoins, evaluate:

| Factor | Questions to Ask |
|--------|-----------------|
| **Use Case** | What problem does it solve? |
| **Team** | Who's building it? Track record? |
| **Tokenomics** | Supply? Inflation? Distribution? |
| **Competition** | How does it compare to alternatives? |
| **Adoption** | Active users? Real usage? |
| **Development** | Active GitHub? Updates? |

## Dollar-Cost Averaging (DCA)

DCA is the strategy of investing a fixed amount at regular intervals, regardless of price.

### Why DCA Works

1. **Removes emotion**: No need to time the market
2. **Reduces risk**: Averages out volatility
3. **Builds discipline**: Consistent investing habit
4. **Psychological ease**: Small, regular investments feel manageable

### DCA in Practice

**Example**: $500/month into Bitcoin

| Month | BTC Price | Amount Bought | Total BTC | Avg Cost |
|-------|-----------|---------------|-----------|----------|
| Jan | $40,000 | 0.0125 | 0.0125 | $40,000 |
| Feb | $35,000 | 0.0143 | 0.0268 | $37,313 |
| Mar | $45,000 | 0.0111 | 0.0379 | $39,577 |
| Apr | $30,000 | 0.0167 | 0.0546 | $36,630 |
| May | $50,000 | 0.0100 | 0.0646 | $38,700 |

Even with volatile prices, you end up with an average cost below the highest price.

### DCA Best Practices

1. **Set it and forget it**: Automate if possible
2. **Be consistent**: Same amount, same schedule
3. **Stay the course**: Don't stop during dips
4. **Think in years**: Not days or months
5. **Review quarterly**: Adjust amounts if needed

### When to Modify DCA

**Increase allocation when:**
- Fear & Greed shows Extreme Fear
- Major price drops (30%+)
- You have extra disposable income

**Decrease/pause when:**
- You need the money for emergencies
- Your allocation to crypto is too high
- Life circumstances change

## Entry and Exit Strategies

### Entry Strategies

**1. DCA (Recommended)**
- Regular purchases regardless of price
- Best for most investors

**2. Lump Sum**
- Invest entire amount at once
- Statistically beats DCA (if you have the nerve)
- Higher risk if market drops immediately

**3. Value Averaging**
- Adjust buy amount based on performance
- Buy more when price is down
- Buy less when price is up

### Exit Strategies

**1. Time-Based**
- Sell after predetermined holding period
- Example: Sell 25% after 4 years

**2. Target-Based**
- Sell at predetermined price targets
- Example: Sell 10% at each 2x from entry

**3. Rebalancing**
- Sell to maintain allocation percentages
- Example: Crypto grew to 30%, sell to return to 20%

**4. Scaled Exit**
- Sell in portions, not all at once
- Example: Sell 10% at $100K, 10% at $150K, etc.

### Creating Your Exit Plan

Before you invest, decide:
1. At what profit will you take some gains?
2. At what loss will you cut positions?
3. How will you handle life events (buying house, etc.)?

Write it down and commit to it!

## Risk Management

### Position Sizing

Never put too much into a single asset:
- Bitcoin: Up to 50-60% of crypto portfolio
- Ethereum: Up to 25-35%
- Any single altcoin: Maximum 5-10%

### The 1% Rule

Never risk more than 1% of your total portfolio on a single trade (for active traders).

### Emergency Fund First

Before investing in crypto:
- 3-6 months expenses in savings
- No high-interest debt
- Retirement accounts funded

### Rebalancing

Periodically adjust back to target allocations:

**When to rebalance:**
- Quarterly (time-based)
- When allocations drift 5%+ (threshold-based)
- After major market moves

**Example:**
Target: 60% BTC, 40% ETH

After bull run:
- BTC grew to 75%, ETH is 25%
- Sell some BTC, buy ETH to return to 60/40

## Creating Your Personal Investment Plan

Fill out this template:

**My Crypto Investment Plan**

1. **Time Horizon**: ___ years
2. **Risk Tolerance**: Conservative / Moderate / Aggressive
3. **Total Amount to Invest**: $___
4. **DCA Amount**: $___ per [week/month]
5. **Target Allocation**:
   - Bitcoin: ___%
   - Ethereum: ___%
   - Other: ___%
6. **Exit Targets**:
   - Take ___% profit at ___% gain
   - Rebalance when allocations drift ___%
7. **Review Schedule**: [Quarterly/Monthly]

## Module 5 Summary

A good strategy keeps you disciplined through market chaos.

---

**Key Takeaways:**
- Define your goals, time horizon, and risk tolerance first
- Start with Bitcoin, then consider diversification
- DCA is the best strategy for most beginners
- Have entry AND exit strategies before investing
- Manage risk through position sizing and diversification
- Write down your plan and stick to it

**Next Module:** Avoiding Common Mistakes and Scams - protect yourself from the biggest risks in crypto.
`
    },
    {
      id: 'module-6-avoiding-mistakes',
      moduleNumber: 6,
      title: 'Avoiding Mistakes and Scams',
      description: 'Common pitfalls, scam identification, and staying safe',
      duration: 25,
      objectives: [
        'Recognize and avoid common beginner mistakes',
        'Identify crypto scams and fraud attempts',
        'Develop healthy investing habits',
        'Know where to continue your education'
      ],
      content: `
# Module 6: Avoiding Mistakes and Scams

Congratulations on reaching the final module! This lesson will help you avoid the costly mistakes that trap most beginners.

## Common Beginner Mistakes

### 1. FOMO Buying

**The Mistake:** Buying because price is going up and you don't want to miss out.

**Why It's Dangerous:**
- Often buy at local tops
- Emotional, not rational decision
- Usually regretted within days

**How to Avoid:**
- Stick to your DCA schedule
- Remember: there's always another opportunity
- Ask: "Would I buy this if price was flat?"

### 2. Panic Selling

**The Mistake:** Selling because price is dropping rapidly.

**Why It's Dangerous:**
- Lock in losses
- Often sell at local bottoms
- Miss the recovery

**How to Avoid:**
- Zoom out to weekly/monthly charts
- Remember your time horizon
- Don't check prices constantly

### 3. Overtrading

**The Mistake:** Constantly buying and selling to "time the market."

**Why It's Dangerous:**
- Fees eat into profits
- Tax complications
- Usually underperforms buy-and-hold

**How to Avoid:**
- Set and forget strategy
- Review monthly at most
- Focus on accumulation, not trading

### 4. Ignoring Security

**The Mistake:** Leaving crypto on exchanges, weak passwords, no 2FA.

**Why It's Dangerous:**
- Exchange hacks
- Account takeovers
- Permanent loss

**How to Avoid:**
- Review Module 3
- Hardware wallet for significant amounts
- Security audit your setup

### 5. All-In on Altcoins

**The Mistake:** Skipping Bitcoin for "the next Bitcoin."

**Why It's Dangerous:**
- Most altcoins fail (90%+)
- Higher volatility
- Lower liquidity
- Harder to research properly

**How to Avoid:**
- Start with Bitcoin
- Only allocate 10-20% to alts
- Research thoroughly before buying

### 6. Using Leverage

**The Mistake:** Borrowing money to amplify gains.

**Why It's Dangerous:**
- Amplifies losses equally
- Liquidation risk
- Emotional decision-making

**How to Avoid:**
- Never use leverage as a beginner
- If you must: 2x maximum, ever
- Cash only for first 2+ years

### 7. Falling for "Guaranteed Returns"

**The Mistake:** Investing based on promises of fixed returns.

**Why It's Dangerous:**
- Nothing in crypto is guaranteed
- Hallmark of scams
- Too good to be true = false

**How to Avoid:**
- Be skeptical of all promises
- If it sounds too good, it is
- Verify everything independently

## Types of Crypto Scams

### 1. Phishing

**How It Works:**
- Fake websites that look like real exchanges
- Emails pretending to be from exchanges
- Steal login credentials or seed phrases

**Red Flags:**
- Urgent language ("Act now or lose funds")
- Suspicious URLs (coinbase-security.com vs coinbase.com)
- Requests for seed phrase (legitimate services NEVER ask)

**Protection:**
- Type URLs directly
- Use bookmarks
- Never click email links
- Never share seed phrase

### 2. Rug Pulls

**How It Works:**
- Developers create a token
- Hype it up, attract investors
- Drain liquidity and disappear

**Red Flags:**
- Anonymous team
- No audit
- Locked liquidity? Check if truly locked
- Too much hype, too little substance

**Protection:**
- Stick to established projects
- Research team backgrounds
- Check for audits
- Be skeptical of new tokens

### 3. Pump and Dump

**How It Works:**
- Group coordinates to buy a small coin
- Price spikes on low volume
- Leaders sell to latecomers
- Price crashes

**Red Flags:**
- "Insider tips" in group chats
- Coordinated buying signals
- Unknown coins suddenly pumping
- Pressure to buy NOW

**Protection:**
- Never join pump groups
- Be suspicious of "alpha" tips
- If you didn't find it yourself, be careful

### 4. Impersonation Scams

**How It Works:**
- Scammers pose as famous people/companies
- "Send 1 BTC, get 2 back" schemes
- Fake giveaways

**Red Flags:**
- Asking you to send crypto first
- Promise of guaranteed returns
- Urgent limited time offers
- Too good to be true

**Protection:**
- No one gives away free crypto
- Never send crypto to "verify" your wallet
- Verify accounts through official channels

### 5. Romance Scams

**How It Works:**
- Scammer builds online relationship
- Introduces "great investment opportunity"
- Victim sends funds to scammer

**Red Flags:**
- Online relationship turning to finance
- Partner claims expertise but you can't verify
- Pressure to invest in specific platform

**Protection:**
- Never invest based on romantic partner's advice
- Verify independently
- Be skeptical of online relationships

### 6. Fake Exchanges/Wallets

**How It Works:**
- Clone of legitimate exchange/wallet
- User deposits funds
- Funds are stolen

**Red Flags:**
- Slightly different URL
- Pushed through ads
- App store ratings seem fake

**Protection:**
- Only use well-known exchanges
- Download wallets from official sites
- Verify everything multiple times

## Scam Protection Checklist

Before investing in anything, verify:

- [ ] Is the team public and verifiable?
- [ ] Is there a working product?
- [ ] Are there independent audits?
- [ ] Is the code open source?
- [ ] Does the tokenomics make sense?
- [ ] Is there real community discussion (not just hype)?
- [ ] Can you find negative reviews/criticism?
- [ ] Would you still invest if a friend didn't recommend it?

## Healthy Investing Habits

### Do's

1. **Continue learning**: Crypto evolves rapidly
2. **Verify everything**: Trust but verify (actually, just verify)
3. **Take profits**: Lock in gains along the way
4. **Diversify**: Don't put all eggs in one basket
5. **Review regularly**: Quarterly portfolio review
6. **Stay humble**: Even experts get it wrong

### Don'ts

1. **Don't chase pumps**: Missing one won't kill you
2. **Don't revenge trade**: Losses happen, don't compound them
3. **Don't over-invest**: Sleep test - can you sleep at night?
4. **Don't ignore taxes**: Keep records from day one
5. **Don't share holdings**: Makes you a target
6. **Don't trust, verify**: Everyone has an agenda

## Continuing Your Education

### Recommended Resources

**Websites:**
- Bitcoin.org - Bitcoin fundamentals
- Ethereum.org - Ethereum learning
- CoinGecko/CoinMarketCap - Price data and research

**Books:**
- "The Bitcoin Standard" by Saifedean Ammous
- "Mastering Bitcoin" by Andreas Antonopoulos
- "The Infinite Machine" by Camila Russo

**Podcasts:**
- What Bitcoin Did
- Bankless
- Unchained

### Red Flag: Bad Information Sources

Be skeptical of:
- YouTube "gurus" promising gains
- Telegram/Discord "alpha" groups
- Paid newsletters (most are bad)
- Twitter influencers shilling coins

### Good Information Habits

1. Read original sources (whitepapers, docs)
2. Follow multiple perspectives
3. Understand counter-arguments
4. Update your knowledge continuously
5. Be willing to change your mind

## Course Completion Checklist

Verify your knowledge:

- [ ] I can explain what Bitcoin is to a friend
- [ ] I have an account on a reputable exchange
- [ ] I have enabled 2FA on all accounts
- [ ] I understand the difference between wallet types
- [ ] I have written down and secured my seed phrase
- [ ] I can read a basic price chart
- [ ] I understand market cycles
- [ ] I have a written investment plan
- [ ] I know my DCA amount and schedule
- [ ] I can identify common scams
- [ ] I know where to continue learning

## Final Thoughts

You've completed the Beginner's Complete Course! Here's what sets successful crypto investors apart:

1. **Patience**: Wealth is built over years, not days
2. **Discipline**: Follow your plan, especially when it's hard
3. **Humility**: Stay open to being wrong
4. **Curiosity**: Keep learning and adapting
5. **Security**: Protect what you've built

The crypto journey is a marathon, not a sprint. You now have the foundation to navigate it successfully.

---

**Key Takeaways:**
- Avoid FOMO, panic selling, and overtrading
- Be extremely skeptical of "guaranteed" returns
- Learn to identify common scam patterns
- Develop healthy, sustainable investing habits
- Continue educating yourself
- Trust yourself, verify everything else

## Congratulations!

You've completed the Beginner's Complete Course. You're now equipped with the knowledge to:

- Understand cryptocurrency fundamentals
- Safely buy and store your crypto
- Read and interpret market data
- Build and execute your investment strategy
- Protect yourself from scams and mistakes

**Your next steps:**
1. Make your first (small) investment
2. Set up your DCA schedule
3. Secure your holdings properly
4. Join our community for ongoing support
5. Explore our advanced guides when ready

Welcome to the world of crypto investing. Stay safe, stay curious, and happy investing!
`
    }
  ]
};

export const courses: Record<string, Course> = {
  'beginner-complete-course': beginnerCompleteCourse
};

export function getCourse(id: string): Course | undefined {
  return courses[id];
}

export function getAllCourses(): Course[] {
  return Object.values(courses);
}

export function getCourseModule(courseId: string, moduleId: string): CourseModule | undefined {
  const course = getCourse(courseId);
  if (!course) return undefined;
  return course.modules.find(m => m.id === moduleId);
}
