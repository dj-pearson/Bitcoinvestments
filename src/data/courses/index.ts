export interface CourseQA {
  question: string;
  answer: string;
}

export interface CourseModule {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  /** 140-160 char meta description. */
  metaDescription: string;
  /** Answer-first summary (1-3 sentences) shown at the top of the module. */
  summary: string;
  duration: number; // minutes
  objectives: string[];
  /** "Check your understanding" questions with answers (rendered visibly). */
  quiz: CourseQA[];
  content: string; // Markdown content
}

export interface Course {
  id: string;
  title: string;
  /** Short title for <title> (<= 41 chars). */
  seoTitle: string;
  description: string;
  /** 140-160 char meta description. */
  metaDescription: string;
  longDescription: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  totalDuration: number; // total minutes
  moduleCount: number;
  modules: CourseModule[];
  prerequisites?: string[];
  outcomes: string[];
  /** ISO dates (YYYY-MM-DD). */
  datePublished: string;
  dateModified: string;
  faqs: CourseQA[];
}

export const beginnerCompleteCourse: Course = {
  id: 'beginner-complete-course',
  title: "Beginner's Complete Course",
  seoTitle: 'Free Crypto Course for Beginners',
  description: 'From zero to confident crypto investor in 6 short modules',
  metaDescription:
    'A free six-module crypto course for beginners: how Bitcoin works, buying safely, wallets and seed phrases, market cycles, DCA and taxes, and avoiding scams.',
  longDescription: `This comprehensive course takes you from complete beginner to confident cryptocurrency investor.

You'll learn everything from the basics of what cryptocurrency is, to making your first purchase, securing your assets, and developing a long-term investment strategy. Each module builds on the previous one, ensuring you have a solid foundation before moving forward.`,
  icon: '🎓',
  difficulty: 'Beginner',
  totalDuration: 180,
  moduleCount: 6,
  prerequisites: [],
  // NEEDS-OWNER: named author/reviewer for the course.
  datePublished: '2026-01-02',
  dateModified: '2026-09-23',
  faqs: [
    {
      question: 'Is this crypto course really free?',
      answer: 'Yes. All six modules are free to read with no account or payment. Your progress is saved in your own browser.',
    },
    {
      question: 'How long does the course take?',
      answer: 'About three hours in total: six modules of 25 to 35 minutes each. You can take them one at a time over a week or two.',
    },
    {
      question: 'Do I need to buy crypto to take the course?',
      answer: 'No. You can complete every module without buying anything. Module 2 explains how to buy safely if and when you decide to.',
    },
    {
      question: 'Is this financial advice?',
      answer: 'No. The course is general education. Example allocations are illustrations, not recommendations for your situation.',
    },
  ],
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
      metaDescription:
        "Module 1 of our free crypto course: what cryptocurrency is, how Bitcoin and blockchains work, and the main types of coins, including stablecoins.",
      summary:
        "Cryptocurrency is digital money secured by cryptography and recorded on a shared public ledger called a blockchain, with no bank in the middle. Bitcoin, launched in 2009, was the first; today there are thousands of coins, from Ethereum to dollar-pegged stablecoins.",
      quiz: [
        { question: "What makes cryptocurrency different from traditional money?", answer: "It is issued and recorded by a decentralized network following public rules, rather than by a central bank or a commercial bank ledger, and anyone can verify transactions." },
        { question: "Who created Bitcoin, and when?", answer: "Someone using the name Satoshi Nakamoto published the whitepaper in October 2008 and launched the network in January 2009." },
        { question: "What is the maximum number of bitcoins that will ever exist?", answer: "21 million. More than 20 million had been mined by March 2026." },
        { question: "What is a blockchain?", answer: "A shared ledger made of blocks of transactions, each linked to the previous one by a cryptographic hash, and copied across many computers." },
        { question: "Name three types of cryptocurrency besides Bitcoin.", answer: "For example Ethereum (a smart-contract platform), stablecoins such as USDC, and other altcoins such as Solana." },
      ],
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

In October 2008, during the global financial crisis, an anonymous person (or group) using the name **Satoshi Nakamoto** published a whitepaper titled "Bitcoin: A Peer-to-Peer Electronic Cash System." The Bitcoin network itself went live in January 2009.

### Why Bitcoin Was Created

- **Remove intermediaries**: Send money directly to anyone, anywhere
- **Predictable supply**: No more than 21 million coins, issued on a fixed schedule that halves roughly every four years (most recently in April 2024)
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
The original cryptocurrency and largest by market cap. Often called "digital gold." Read more in [What is Bitcoin?](/learn/what-is-bitcoin)

### 2. Ethereum (ETH)
A platform for building decentralized applications (dApps) and smart contracts.

### 3. Stablecoins
Cryptocurrencies designed to track a stable asset, usually the US dollar:
- USDT (Tether)
- USDC (USD Coin)
- DAI / USDS (issued by Sky, formerly MakerDAO)

In the US, the GENIUS Act (July 2025) set federal reserve and disclosure rules for payment stablecoins. A stablecoin is still not a bank deposit and is not FDIC-insured.

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

More definitions are in the [crypto glossary](/glossary).

## Next Steps

Congratulations on completing Module 1! You now understand the basics of what cryptocurrency is and how it works.

In **Module 2**, we'll explore how to actually buy your first cryptocurrency safely and choose the right exchange for your needs.

---

**Key Takeaways:**
- Cryptocurrency is decentralized digital money secured by cryptography
- Bitcoin was described in a 2008 whitepaper and launched in 2009 as money that works without banks or governments
- Blockchain technology ensures security and transparency
- There are thousands of cryptocurrencies with different purposes
`
    },
    {
      id: 'module-2-buying-first-crypto',
      moduleNumber: 2,
      title: 'Buying Your First Cryptocurrency',
      description: 'Choosing an exchange, verification, and making your first purchase',
      metaDescription:
        "Module 2: how to buy your first crypto safely: exchange vs app vs spot ETF, account verification, 2FA, funding, market vs limit orders, and fees.",
      summary:
        "To buy your first crypto, choose a reputable regulated platform (or a spot Bitcoin ETF through a brokerage), verify your identity, secure the account with app-based 2FA, fund it by bank transfer and start with a small purchase. Check the total cost, including the spread, before you confirm.",
      quiz: [
        { question: "Why is a bank transfer usually better than a card for buying crypto?", answer: "Card purchases typically cost several percent in fees and credit cards may be treated as cash advances; bank transfers are usually free or cheap." },
        { question: "What is the difference between a market order and a limit order?", answer: "A market order buys immediately at the best available price; a limit order only buys at your chosen price or better, and may not fill." },
        { question: "Why avoid SMS-based two-factor authentication?", answer: "Attackers can hijack your phone number through a SIM swap and receive your codes. Authenticator apps, passkeys or security keys are safer." },
        { question: "What does a spot Bitcoin ETF give you?", answer: "Shares in a fund that holds bitcoin, bought through a normal brokerage or IRA, with no keys to manage but an annual fee and no way to withdraw the coins." },
      ],
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
For more advanced users who already hold crypto in their own wallet. You can't buy with dollars from your bank on most DEXs, and mistakes can't be reversed.

**Example:** Uniswap (Ethereum and its Layer 2 networks). We cover DEXs in [DeFi Explained](/learn/defi-basics); they are not a good place to make your first purchase.

#### Spot Bitcoin and Ether ETFs
Since January 2024 (Bitcoin) and July 2024 (Ether), US investors can buy exchange-traded funds that hold the actual coins, through any ordinary brokerage account or IRA.

| | Crypto exchange | Spot ETF in a brokerage |
|---|---|---|
| What you own | The coins (in your account, withdrawable) | Fund shares |
| Keys to manage | Optional (if you withdraw to a wallet) | None |
| Trading hours | 24/7 | Stock-market hours |
| Ongoing cost | None to hold | Annual expense ratio |
| Retirement accounts | Specialist providers only | Any IRA that allows ETFs |

An ETF is often the simplest route for retirement savings. An exchange lets you hold and move the coins themselves. This module walks through the exchange route; for a side-by-side comparison of providers, see our [exchange comparison](/compare).

### How to Choose Your First Exchange

Consider these factors:

| Factor | What to Look For |
|--------|-----------------|
| **Security** | 2FA or passkeys, cold storage, proof of reserves, track record (crypto balances are not FDIC-insured) |
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
   - Use an authenticator app (Google Authenticator, Microsoft Authenticator, 2FAS) or a passkey/security key
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
| **Bank Transfer (ACH)** | 1-5 business days to settle (many platforms let you buy right away) | Low/Free | High |
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
- Use "Pro" or "Advanced" trading interfaces, which usually charge a small percentage instead of a spread plus fee
- Use limit orders where available (often a lower "maker" fee, and no slippage)
- Withdraw less frequently (batch withdrawals)
- Compare fees across exchanges with our [exchange comparison](/compare)

## Common First-Timer Mistakes

1. **Buying with Credit Card** - High fees, potential cash advance charges
2. **Not Enabling 2FA** - Account security risk
3. **Panic Selling** - Price drops are normal; don't sell in fear
4. **Going All-In** - Never invest more than you can afford to lose
5. **Leaving Crypto on Exchange** - We'll cover proper storage in Module 3
6. **Forgetting Records** - Save every purchase confirmation. US platforms report your sales to the IRS on Form 1099-DA, and you'll need your cost basis (what you paid) when you sell

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
      metaDescription:
        "Module 3: securing your crypto with the right wallet, backing up a seed phrase safely, setting up a hardware wallet, and avoiding phishing and SIM swaps.",
      summary:
        "Whoever controls the private keys controls the crypto. Keep small amounts where convenient, move significant holdings to a hardware wallet, and protect the seed phrase on paper or metal in more than one place, because nobody can recover it for you.",
      quiz: [
        { question: "What does \"not your keys, not your coins\" mean?", answer: "If a company holds the private keys, you depend on it staying solvent and honest; only with your own keys do you fully control the coins." },
        { question: "Where should you never store a seed phrase?", answer: "Anywhere digital: photos, cloud drives, email, notes apps or password fields on websites." },
        { question: "Why send a small test transaction first?", answer: "To confirm the address and network are correct before risking the full amount, because crypto transfers cannot be reversed." },
        { question: "Why is an HTTPS padlock not proof a site is genuine?", answer: "Phishing sites can get HTTPS certificates too. Check the exact domain and use bookmarks instead." },
      ],
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
- **Mt. Gox (2014)**: About 850,000 BTC lost; customers waited roughly ten years for partial repayment
- **FTX (2022)**: Customer funds frozen when the exchange collapsed; repayments began in 2025, valued at 2022 prices
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
| Most secure | Costs roughly $60-$400 |
| Keys never online | Less convenient |
| Immune to malware | Can be lost/damaged |
| Built-in screens | Learning curve |

**Popular Options:**
- **Ledger** (Nano S Plus, Nano X, Nano Gen5, Flex, Stax) - wide coin support; Bluetooth on most models
- **Trezor** (Safe 3, Safe 5, Safe 7) - open-source firmware; the older Model T is discontinued
- **Coldcard** - Bitcoin-only, aimed at advanced users

Lineups checked September 2026. Compare current models in our [wallet comparison](/compare?tab=wallets) and [hardware wallet guide](/hardware-wallet).

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

### Example Seed Phrase (made up; never use a phrase you've seen anywhere)
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
   - Never click links in emails or search ads
   - Type URLs directly or use bookmarks
   - Check the exact domain (phishing sites use HTTPS padlocks too, so the padlock proves nothing)

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
| Logging in on shared computers | Keyloggers, saved sessions | Use your own updated device |

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

For more detail, read [Crypto Wallets Explained](/learn/crypto-wallets-explained).

**Next Module:** Understanding the Market - learn to interpret prices, trends, and make informed decisions.
`
    },
    {
      id: 'module-4-understanding-market',
      moduleNumber: 4,
      title: 'Understanding the Crypto Market',
      description: 'Reading charts, understanding volatility, and market cycles',
      metaDescription:
        "Module 4: reading crypto price charts, supply and demand, the four-year halving cycle, market cap and Fear & Greed, and how to cope with volatility.",
      summary:
        "Crypto prices are set by supply and demand in a market that never closes and swings far more than stocks. Candlestick charts, market cap and sentiment gauges help you understand what is happening, but none of them predicts prices, so plan for 50-80% drawdowns.",
      quiz: [
        { question: "What four prices does a candlestick show?", answer: "The open, close, high and low for that period." },
        { question: "What happened at the April 2024 halving?", answer: "The number of new bitcoins paid per block fell from 6.25 to 3.125 BTC." },
        { question: "Does a low Fear & Greed score mean crypto is undervalued?", answer: "No. It measures sentiment, not value. Prices can keep falling while fear is high." },
        { question: "How is market capitalisation calculated?", answer: "Current price multiplied by circulating supply." },
      ],
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
2. **High Volatility**: Daily moves of a few percent are routine for Bitcoin and Ethereum, 10-20% weekly swings are common, and 50-80% drawdowns have happened in bear markets
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
| 4th | Apr 2024 | $64,000 | about $126,000 (Oct 2025) |

Prices are approximate. Each peak has been a smaller multiple of the halving price than the one before (roughly 90x, 30x, 8x, then 2x), and many analysts think ETF demand and institutional buying now matter more than the halving itself.

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

| Score | Sentiment | What it tells you |
|-------|-----------|---------------|
| 0-24 | Extreme Fear | Sentiment is very negative; contrarians see this as a time to keep buying, not sell in panic |
| 25-44 | Fear | Sentiment is negative |
| 45-55 | Neutral | No strong mood either way |
| 56-75 | Greed | Sentiment is positive |
| 76-100 | Extreme Greed | Euphoria; a time to be careful about chasing prices |

The index measures **mood, not value**. A fearful market can keep falling and a greedy one can keep rising for months. Use it as a check on your own emotions, not as a price signal.

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
- Use indicators like the Fear & Greed Index as a check on emotion, not a price signal
- Expect volatility and plan for it

Check live prices on the [market dashboard](/dashboard).
- Never make emotional decisions

**Next Module:** Building Your Investment Strategy - create a personalized approach to crypto investing.
`
    },
    {
      id: 'module-5-investment-strategy',
      moduleNumber: 5,
      title: 'Building Your Investment Strategy',
      description: 'Portfolio allocation, DCA, and developing your personal approach',
      metaDescription:
        "Module 5: build a crypto investment plan: time horizon, risk tolerance, allocation examples, dollar-cost averaging with a worked table, exits, and US taxes.",
      summary:
        "A written plan beats reacting to headlines: decide your time horizon, keep crypto to a share of your investments you could see fall 80%, choose how to buy (usually a regular DCA schedule), and set exit and rebalancing rules in advance. Keep records from day one for taxes.",
      quiz: [
        { question: "What does dollar-cost averaging actually do?", answer: "Investing a fixed amount on a schedule buys more coins when prices are low and fewer when high, so your average cost is below the simple average of the prices you paid. It does not guarantee a profit." },
        { question: "Why fund an emergency account before buying crypto?", answer: "So you are never forced to sell crypto during a crash to cover a bill." },
        { question: "Is swapping one crypto for another taxable in the US?", answer: "Yes. It is treated as selling the first coin, so any gain is taxable." },
        { question: "What is rebalancing?", answer: "Trading back to your target allocation after prices move, for example selling some bitcoin after it grows from 60% to 75% of your crypto holdings." },
      ],
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

The percentages below are common illustrations, not recommendations for you. Many financial planners suggest keeping crypto to a small share of total investments.

**Conservative:**
- Can't stomach 50%+ drawdowns
- Need money in <3 years
- Crypto is 0-2% of total investments (or none)

**Moderate:**
- Uncomfortable but can handle volatility
- 3-5 year horizon
- Crypto is roughly 2-5% of total investments

**Aggressive:**
- High risk tolerance
- 5+ year horizon
- Crypto is roughly 5-10% of total investments; going higher means accepting that an 80% crash would seriously dent your net worth

### 3. What Are Your Goals?

- **Preservation**: Beat inflation, store value
- **Growth**: Significant portfolio appreciation
- **Income**: Generate yield from holdings
- **Speculation**: High risk, high reward plays

## Portfolio Allocation

### The Golden Rule

> Never invest more than you can afford to lose completely.

### Example Allocations Within Your Crypto Holdings

These split the crypto portion only. They are examples to show the idea, not advice.

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
| Feb | $35,000 | 0.0143 | 0.0268 | $37,333 |
| Mar | $45,000 | 0.0111 | 0.0379 | $39,581 |
| Apr | $30,000 | 0.0167 | 0.0546 | $36,655 |
| May | $50,000 | 0.0100 | 0.0646 | $38,722 |

(Illustrative prices; amounts rounded to four decimals, averages calculated from exact amounts.)

The simple average of the five prices is $40,000, but your average cost is about $38,722. That's the real effect of DCA: a fixed dollar amount buys more coins when the price is low and fewer when it's high. It doesn't guarantee a profit; if the price keeps falling, so does the value of what you hold. Try your own numbers in the [DCA calculator](/calculators).

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
- In Vanguard's 2012 study of stock and bond portfolios, investing a lump sum right away beat spreading it over 12 months about two-thirds of the time, because markets rise more often than they fall. Crypto wasn't studied and is far more volatile
- Higher regret (and risk) if the market drops right after you buy

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
- Example: Crypto grew from 5% to 9% of your investments, sell back to 5%

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

Active traders often limit the loss they'll accept on any single trade to about 1% of their portfolio. As a long-term investor you mainly control risk through the size of your total crypto allocation.

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

### Taxes (US)

In the US, crypto is property for tax purposes:
- **Buying and holding** is not taxable
- **Selling, swapping one coin for another, or spending** crypto is a taxable disposal; your gain is the sale value minus your **cost basis** (what you paid, including fees)
- Held **more than a year** means long-term rates (0%, 15% or 20%); a year or less means your ordinary income rate
- US platforms report your sales on **Form 1099-DA**: gross proceeds for 2025, and cost basis too for coins bought from January 1, 2026

Keep every purchase record from day one. Full details: [Crypto Taxes: What You Need to Know](/learn/crypto-taxes-basics).

**Next Module:** Avoiding Common Mistakes and Scams - protect yourself from the biggest risks in crypto.
`
    },
    {
      id: 'module-6-avoiding-mistakes',
      moduleNumber: 6,
      title: 'Avoiding Mistakes and Scams',
      description: 'Common pitfalls, scam identification, and staying safe',
      metaDescription:
        "Module 6: the most common beginner crypto mistakes and scams (phishing, rug pulls, pump-and-dumps, fake giveaways, romance scams) and how to protect yourself.",
      summary:
        "Most crypto losses come from avoidable mistakes such as FOMO buying, panic selling, leverage and weak security, or from scams that promise guaranteed or doubled returns. A written plan, healthy scepticism and checking before you send money prevent nearly all of them.",
      quiz: [
        { question: "What is a rug pull?", answer: "A scam where a project's developers attract deposits or token buyers and then drain the liquidity and disappear." },
        { question: "Will a legitimate exchange or wallet ever ask for your seed phrase?", answer: "Never. Anyone asking for it is trying to steal your funds." },
        { question: "What is the warning sign of a \"pig butchering\" scam?", answer: "An online friend or partner introduces a trading platform that shows big gains but demands \"taxes\" or \"fees\" before you can withdraw." },
        { question: "Why is leverage risky for beginners?", answer: "It amplifies losses as well as gains and can liquidate your entire position in a sudden price move." },
      ],
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
- Unsolicited "send crypto, get double back" giveaways are always scams
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
- If a platform lets you withdraw small amounts but asks for "taxes" or "fees" before a large withdrawal, it's a scam (often called "pig butchering")

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
- [ ] Have you searched our [scam database](/scam-database)?

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
- "Mastering Bitcoin" by Andreas Antonopoulos (technical, free online)
- "The Infinite Machine" by Camila Russo (history of Ethereum)
- "The Bitcoin Standard" by Saifedean Ammous (an opinionated pro-Bitcoin argument; read critics too)

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
1. Make your first (small) investment, following [How to Buy Your First Cryptocurrency](/learn/how-to-buy-crypto)
2. Set up your DCA schedule (plan it with the [DCA calculator](/calculators))
3. Secure your holdings properly
4. Keep the [glossary](/glossary) handy
5. Explore our [guides on DCA, rebalancing, risk and DeFi](/learn) when ready

Welcome to the world of crypto investing. Stay safe and stay curious.
`
    }
  ]
};

export const courses: Record<string, Course> = {
  'beginner-complete-course': beginnerCompleteCourse
};

export function getCourse(id: string): Course | undefined {
  return Object.prototype.hasOwnProperty.call(courses, id) ? courses[id] : undefined;
}

export function getAllCourses(): Course[] {
  return Object.values(courses);
}

export function getCourseModule(courseId: string, moduleId: string): CourseModule | undefined {
  const course = getCourse(courseId);
  if (!course) return undefined;
  return course.modules.find(m => m.id === moduleId);
}

/**
 * Module markdown without its leading "# Module N: ..." line: the page renders
 * the module title as its single <h1>.
 */
export function getModuleBody(module: CourseModule): string {
  return module.content.replace(/^\s*# [^\n]*\n/, '');
}
