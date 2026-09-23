import type { GuideSource } from './index';

export const whatIsBitcoinGuide: GuideSource = {
  id: 'what-is-bitcoin',
  title: 'What is Bitcoin? A Beginner\'s Guide',
  seoTitle: 'What Is Bitcoin? A Beginner\'s Guide',
  description:
    'What Bitcoin is, how it works, the 21 million supply cap and halving, spot Bitcoin ETFs, and the real risks, explained in plain English for beginners.',
  summary:
    'Bitcoin is a digital currency that runs on a public network no company or government controls. Only 21 million will ever exist, new coins are issued on a fixed schedule that halves roughly every four years, and you can own it directly in a wallet or indirectly through a spot Bitcoin ETF.',
  category: 'Basics',
  icon: '₿',
  datePublished: '2026-01-02',
  dateModified: '2026-09-23',
  relatedGuides: ['understanding-blockchain', 'how-to-buy-crypto', 'crypto-wallets-explained', 'common-crypto-mistakes'],
  relatedTools: [
    { label: 'Market dashboard', url: '/dashboard', description: 'Current Bitcoin price and market data' },
    { label: 'DCA calculator', url: '/calculators', description: 'Model buying a fixed amount on a schedule' },
    { label: 'Crypto glossary', url: '/glossary', description: 'Plain-English definitions of the jargon' },
    { label: 'Free beginner course', url: '/course/beginner-complete-course', description: 'Six short modules, no account needed' },
  ],
  faqs: [
    {
      question: 'Who created Bitcoin?',
      answer:
        'A person or group using the name Satoshi Nakamoto published the Bitcoin whitepaper in October 2008 and launched the network in January 2009. Their real identity has never been confirmed.',
    },
    {
      question: 'How many bitcoins are left to mine?',
      answer:
        'The 20 millionth bitcoin was mined in March 2026, so fewer than 1 million remain. Because the block reward keeps halving, the last fractions will not be issued until around the year 2140.',
    },
    {
      question: 'What is the Bitcoin halving?',
      answer:
        'Every 210,000 blocks (about four years) the number of new bitcoins paid to miners per block is cut in half. The most recent halving, in April 2024, cut it from 6.25 to 3.125 BTC. The next is expected around 2028.',
    },
    {
      question: 'Can I buy a fraction of a bitcoin?',
      answer:
        'Yes. One bitcoin divides into 100 million units called satoshis, and most exchanges and apps let you buy a few dollars\' worth.',
    },
    {
      question: 'Is Bitcoin legal in the US?',
      answer:
        'Yes. Buying, holding and selling bitcoin is legal in the United States. The IRS treats it as property, so selling or spending it can trigger capital gains tax.',
    },
    {
      question: 'Should I buy bitcoin directly or through an ETF?',
      answer:
        'Buying directly lets you hold the coins yourself and move them; an ETF lives in a normal brokerage or retirement account with no keys to manage, but you pay an annual fund fee and cannot withdraw actual bitcoin. Neither removes price risk.',
    },
  ],
  content: `
# What is Bitcoin? A Beginner's Guide

Bitcoin (BTC) is the first and best-known cryptocurrency. It was described in a whitepaper published in October 2008 by someone using the pseudonym Satoshi Nakamoto, and the network went live in January 2009. It is money that runs on a public network rather than through a bank or government.

## Understanding Bitcoin Basics

### What Makes Bitcoin Different?

1. **Decentralized**: No single entity controls Bitcoin. Thousands of independently run computers (nodes) enforce the same rules.
2. **Digital**: Bitcoin exists only in electronic form. There are no physical bitcoins.
3. **Limited supply**: No more than 21 million bitcoins will ever exist.
4. **Peer-to-peer**: You can send bitcoin directly to anyone, anywhere, without asking a bank's permission.

### How Does Bitcoin Work?

Bitcoin runs on a **blockchain**: a public ledger of every transaction, copied across the network. Our [blockchain guide](/learn/understanding-blockchain) explains the mechanics in more depth.

When you send bitcoin:
1. Your wallet signs a transaction with your private key
2. The transaction is broadcast to the network
3. Miners include it in a new block (roughly every 10 minutes)
4. Each later block adds another "confirmation", making it harder to reverse
5. The recipient's wallet shows the funds

## Supply and the Halving

New bitcoins enter circulation as a reward to miners for each block. That reward is cut in half every 210,000 blocks, roughly every four years:

| Period | New BTC per block |
|--------|-------------------|
| 2009–2012 | 50 |
| 2012–2016 | 25 |
| 2016–2020 | 12.5 |
| 2020–April 2024 | 6.25 |
| April 2024–about 2028 | 3.125 |

The fourth halving happened in April 2024 at block 840,000. The 20 millionth bitcoin was mined in March 2026, so more than 95% of all bitcoin that will ever exist is already in circulation. The remaining supply trickles out until around 2140.

Past halvings were followed by large price rallies, but that history is short (four cycles) and it is not a guarantee. Since the 2024 halving, much more of the buying has come through ETFs and large institutions, which may change how cycles behave.

## Spot Bitcoin ETFs

Since January 2024, US investors can buy **spot Bitcoin exchange-traded funds (ETFs)** in an ordinary brokerage account or IRA. Each fund holds actual bitcoin with a custodian, and its shares trade on the stock market like any other ETF. Spot Ether ETFs followed in July 2024.

| | Buying bitcoin directly | Buying a spot Bitcoin ETF |
|---|---|---|
| Where you hold it | Exchange account or your own wallet | Brokerage account or IRA |
| Keys to manage | Yes, if you self-custody | No |
| Trading hours | 24/7 | Stock-market hours |
| Ongoing cost | None to hold (fees when you buy/sell) | Annual expense ratio |
| Can you withdraw coins? | Yes | No |
| Tax paperwork | Form 1099-DA from US brokers (2025+) | Normal brokerage 1099 |

ETFs are a simpler route for many people, especially in retirement accounts. Self-custody gives you full control and no ongoing fee, but you take on the job of protecting your keys. See our [wallet guide](/learn/crypto-wallets-explained) before choosing that route.

## Why People Own Bitcoin

### Store of value

Many holders see Bitcoin as "digital gold": a scarce asset whose supply schedule no one can change. Critics point out that its price has been far more volatile than gold, with several falls of 75% or more from a peak.

### Payments and access

- **Borderless transfers**: send value across borders at any hour
- **Access**: anyone with an internet connection can hold it, without a bank account
- **Censorship resistance**: coins held in your own wallet cannot be frozen by a third party (coins on an exchange can be)

### Price history

Bitcoin went from essentially no value in 2009 to an all-time high of about $126,000 in early October 2025. It has also fallen sharply many times along the way. For the current price, see the [market dashboard](/dashboard). Treat past performance as history, not a forecast.

### Adoption and legal status

- In the US, spot Bitcoin ETFs have made it a mainstream holding in brokerage accounts and some pension and advisory portfolios.
- El Salvador made bitcoin legal tender in 2021, but in January 2025 it amended the law as part of an IMF agreement, so businesses are no longer required to accept it. The Central African Republic adopted it in 2022 and reversed course in 2023.
- Rules differ by country and keep changing, so check your own country's position.

## Key Concepts to Know

- **Bitcoin address**: a string you share to receive bitcoin, like an account number. Example: \`bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq\`
- **Private key**: the secret that lets you spend your bitcoin. **Never share it.**
- **Seed phrase**: 12 or 24 words that back up all the keys in a wallet.
- **Mining**: using specialised computers to add blocks and secure the network in exchange for new bitcoin and fees.
- **Satoshi (sat)**: the smallest unit. 1 BTC = 100,000,000 sats.

The [glossary](/glossary) has more terms.

## Getting Started with Bitcoin

1. **Learn the basics** and the risks (you are doing that now).
2. **Decide how you will hold it**: an ETF in a brokerage account, an exchange account, or your own wallet. Hardware wallets such as Ledger and Trezor are the usual choice for larger self-custodied amounts.
3. **Buy from a reputable provider**: see [How to Buy Your First Cryptocurrency](/learn/how-to-buy-crypto) and our [exchange comparison](/compare).
4. **Secure it**: turn on two-factor authentication, write your seed phrase on paper or metal, and never type it into a website.

## Common Bitcoin Myths

- **"Bitcoin is anonymous."** False. It is pseudonymous. Every transaction is public and can often be traced to a person.
- **"Bitcoin is only for criminals."** Illicit use exists, but blockchain-analytics firms such as Chainalysis estimate it is a small share of on-chain volume.
- **"You have to buy a whole bitcoin."** False. You can buy a few dollars' worth.
- **"Bitcoin has no value."** Its value, like gold's, rests on people agreeing it is scarce and useful. That agreement can weaken, which is one reason the price is volatile.

## Risks to Consider

1. **Volatility**: falls of 50–80% have happened several times.
2. **Irreversible transactions**: send to the wrong address and it is usually gone.
3. **Custody risk**: lose your keys and you lose your bitcoin; leave it with a company and you depend on that company.
4. **Scams**: fake giveaways, fake apps and "investment managers" target new buyers. See [common mistakes](/learn/common-crypto-mistakes) and the [scam database](/scam-database).
5. **Regulation and tax**: rules are still evolving. Selling or spending bitcoin can be a taxable event; see [crypto taxes](/learn/crypto-taxes-basics).

## Key Takeaways

- Bitcoin is a decentralized digital currency with a hard cap of 21 million coins.
- New issuance halves about every four years; the latest halving was April 2024.
- You can own it directly or through a spot Bitcoin ETF.
- It is volatile. Only invest money you can afford to leave alone through a large drop.

## Resources

- [Bitcoin whitepaper](https://bitcoin.org/bitcoin.pdf) (Satoshi Nakamoto, 2008)
- [Bitcoin.org](https://bitcoin.org), community-maintained reference
`,
};
