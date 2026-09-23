import type { GuideSource } from './index';

export const commonCryptoMistakesGuide: GuideSource = {
  id: 'common-crypto-mistakes',
  title: '10 Common Crypto Mistakes to Avoid',
  description:
    'The 10 most costly beginner crypto mistakes, from lost seed phrases and giveaway scams to panic selling, overtrading and ignoring taxes, and how to avoid each.',
  summary:
    'Most money lost in crypto is lost to avoidable mistakes rather than bad luck: no seed phrase backup, scams, weak account security, leaving large sums on exchanges, panic selling, investing money you need, and ignoring taxes. Each has a simple habit that prevents it.',
  category: 'Tips',
  icon: '⚠️',
  datePublished: '2026-01-02',
  dateModified: '2026-09-23',
  relatedGuides: ['crypto-wallets-explained', 'how-to-buy-crypto', 'risk-management', 'crypto-taxes-basics'],
  relatedTools: [
    { label: 'Scam database', url: '/scam-database', description: 'Check a site, wallet or offer before you send money' },
    { label: 'Crypto calculators', url: '/calculators', description: 'Fees, DCA and tax estimates' },
    { label: 'Compare wallets', url: '/compare?tab=wallets', description: 'Find a wallet you can control' },
  ],
  content: `
# 10 Common Crypto Mistakes to Avoid

Learning from others' mistakes is cheaper than making them yourself. Here are the most common crypto investing errors and how to avoid them.

> **About the examples:** the short named stories below are illustrative composites of common situations, not accounts of real people. Where we mention real events (Mt. Gox, FTX, the 2020 Twitter hack), they are documented public cases.

## 1. Not Backing Up Your Seed Phrase

### The Mistake

**Illustrative example**: James bought $5,000 worth of Bitcoin, stored it on his phone wallet, but never wrote down his 12-word seed phrase. When his phone died, his Bitcoin was lost forever.

**Cost**: $5,000+ lost permanently

### Why It's Dangerous

- No seed phrase = no recovery
- Devices fail, get lost, or stolen
- Lost keys are one of the biggest causes of permanently lost bitcoin: analytics firms such as Chainalysis estimate that millions of BTC will likely never move again

### How to Avoid It

✓ Write down seed phrase immediately after wallet creation

✓ Use paper (never digital storage)

✓ Make 2-3 copies

✓ Store in different secure locations

✓ Test recovery with small amount first

### Recovery Steps if You Haven't Backed Up Yet

If you currently have a wallet but no backup:

1. **Find your seed phrase** in wallet settings NOW
2. **Write it down** on paper
3. **Store it safely** in multiple locations
4. **Verify you wrote it correctly** by attempting recovery
5. **Never procrastinate this**

---

## 2. Falling for Scams

### The Mistake

**Illustrative example**: Sarah saw a tweet from "Elon Musk" promising to double any Bitcoin sent to an address. She sent 0.5 BTC. It was a scam account and the bitcoin is gone.

**Cost**: 0.5 BTC, unrecoverable

**Real case**: in July 2020, hackers took over verified Twitter accounts including Elon Musk's, Barack Obama's and Apple's and posted a "double your bitcoin" offer. People sent them more than $100,000 in bitcoin within hours.

### Common Scams to Watch For

#### Giveaway Scams
- "Send 1 BTC, get 2 BTC back"
- Always fake, including deepfake "live streams" of real executives
- Often impersonate celebrities
- Use hacked verified accounts

#### Phishing Websites
- Look like real exchanges
- Steal login credentials
- URLs are slightly different (coinbase.com vs coinbase-secure.com)

#### Ponzi Schemes
- Promise guaranteed returns
- "20% monthly guaranteed!"
- Eventually collapse
- Early investors paid with late investors' money

#### Fake Support
- Contact you claiming to be support
- Ask for seed phrase or private keys
- Real support NEVER asks for this

#### Romance and "Mentor" Scams (Pig Butchering)
- A friendly stranger or new online partner introduces a "trading platform"
- Early small withdrawals work, to build trust
- Larger deposits can never be withdrawn ("pay a tax first")

### How to Avoid Scams

✓ If it sounds too good to be true, it is

✓ Unsolicited "send X, get 2X back" giveaways are always scams

✓ Real support never contacts you first

✓ Always verify URLs (bookmark official sites)

✓ Never share seed phrase or private keys

✓ Be skeptical of urgency ("Act now!")

✓ Research before investing, and check our [scam database](/scam-database)

### Red Flags

🚩 Guaranteed returns

🚩 Time pressure ("Limited time!")

🚩 Unsolicited contact

🚩 Requests for private information

🚩 Too good to be true promises

---

## 3. Not Using Two-Factor Authentication (2FA)

### The Mistake

**Illustrative example**: Mike kept $30,000 on an exchange with only password protection. Hackers guessed his password and emptied his account.

**Cost**: $30,000 stolen

### Why It's Dangerous

- Passwords alone aren't enough
- Data breaches expose passwords
- Many people reuse passwords
- Exchange accounts are prime targets

### How to Avoid It

✓ Enable 2FA on ALL accounts

✓ Use authenticator apps or passkeys (Google Authenticator, Microsoft Authenticator, 2FAS)

✓ Avoid SMS-based 2FA (SIM swapping risk)

✓ Use hardware security keys for important accounts

✓ Never share 2FA codes with anyone

### Setting Up Proper 2FA

1. **Download Authenticator App**
   - Google Authenticator (can sync to your Google account)
   - Microsoft Authenticator
   - 2FAS (open source)
   - Or use a passkey / hardware security key where the exchange supports it

2. **Enable on Exchange**
   - Find Security Settings
   - Enable 2FA/Two-Factor
   - Scan QR code with app
   - Save backup codes

3. **Test It**
   - Log out
   - Log back in
   - Verify 2FA is required

---

## 4. Keeping Large Amounts on Exchanges

### The Mistake

**Illustrative example**: Tom kept $100,000 worth of crypto on an exchange for convenience. The exchange was hacked. Months later, he recovered only $10,000.

**Cost**: $90,000 lost

### Why It's Dangerous

- Exchanges are hacking targets
- You don't control the private keys
- Exchange could freeze your account
- Exchange could go bankrupt (Mt. Gox in 2014, FTX in 2022: FTX customers waited about two years for repayment, valued at 2022 prices rather than the far higher prices by then)
- "Not your keys, not your crypto"

### How to Avoid It

✓ Only keep trading amounts on exchanges

✓ Transfer large holdings to hardware wallet

✓ Use multiple wallets for diversification

✓ Regularly withdraw to personal wallets

### Safe Storage Strategy

| Amount | Storage Method |
|--------|----------------|
| $0-$500 | Exchange wallet (for convenience) |
| $500-$5,000 | Mobile/desktop wallet |
| $5,000+ | Hardware wallet (Ledger, Trezor) |
| $50,000+ | Multiple hardware wallets |

---

## 5. Panic Selling

### The Mistake

**Illustrative example**: Lisa put $30,000 into 0.5 BTC when the price was $60,000. When it dropped to $30,000, she panicked and sold, receiving $15,000. Bitcoin later recovered to $65,000, when her 0.5 BTC would have been worth $32,500.

**Cost**: a $15,000 realised loss, and $17,500 less than if she had held (fees and taxes ignored)

### Why It's Dangerous

- Crypto is extremely volatile
- 30–50% drops have happened within most bull markets, and 75%+ drops in bear markets
- Selling at bottom locks in losses
- Missing recovery = lost opportunity

### How to Avoid It

✓ Only invest what you can afford to lose

✓ Zoom out - look at long-term charts

✓ Set investment timeline (5+ years)

✓ Dollar-cost average to reduce emotion

✓ Don't check prices constantly

✓ Have a plan BEFORE investing

### The Right Mindset

**Remember:**
- Volatility is the price of admission
- Short-term noise doesn't matter
- Bitcoin has dropped roughly 75–85% several times and, so far, recovered (a smaller coin may never recover)
- Time in market > timing market

---

## 6. Investing More Than You Can Afford to Lose

### The Mistake

**Illustrative example**: Kevin used his emergency fund and credit cards to buy crypto, investing $50,000. The market crashed, and he needed money for emergency. Had to sell at 60% loss.

**Cost**: $30,000 loss + credit card debt

### Why It's Dangerous

- Crypto is highly volatile
- You might need money during a crash
- Forced selling at worst time
- Emotional decision-making
- Financial stress

### How to Avoid It

✓ Only invest disposable income

✓ Keep 3-6 months emergency fund first

✓ Never use credit cards or loans

✓ Never invest rent/bill money

✓ Start small ($100-$500)

✓ Gradually increase as comfortable

### Investment Priority Order

1. **Pay off high-interest debt** (credit cards)
2. **Build emergency fund** (3-6 months expenses)
3. **Max retirement accounts** (401k/IRA)
4. **Then invest** in crypto with a small share of your portfolio. Many planners suggest low single digits up to about 10% for most people; see [risk management](/learn/risk-management) for position sizing

---

## 7. Not Doing Your Own Research (FOMO Buying)

### The Mistake

**Illustrative example**: Rachel saw Dogecoin trending and bought $10,000 at the peak without research. It crashed 80%. She had no idea what she owned or why.

**Cost**: $8,000 paper loss

### Why It's Dangerous

- Buying at emotional peaks
- No understanding of investment
- Can't hold during dips (no conviction)
- Chasing pumps leads to losses

### How to Avoid It

✓ Research BEFORE buying

✓ Understand what you're investing in

✓ Read the whitepaper

✓ Check the team and track record

✓ Look at tokenomics

✓ Be patient - opportunities always return

### Research Checklist

Before buying ANY crypto:

- [ ] Read project whitepaper
- [ ] Understand the use case
- [ ] Check team credibility
- [ ] Review tokenomics (supply, distribution)
- [ ] Look at competition
- [ ] Read critical reviews
- [ ] Check community sentiment
- [ ] Verify it's not a scam
- [ ] Understand risks
- [ ] Have exit strategy

---

## 8. Sending to Wrong Address

### The Mistake

**Illustrative example**: David sent $15,000 of Bitcoin to an Ethereum address. Transactions are irreversible. The Bitcoin is gone forever.

**Cost**: $15,000 lost permanently

### Why It's Dangerous

- Crypto transactions can't be reversed
- Wrong address = permanent loss
- No customer service to call
- No chargebacks
- One small mistake = total loss

### How to Avoid It

✓ Always send test transaction first ($10-20)

✓ Verify every character of address

✓ Copy-paste (don't type manually)

✓ Use QR codes when possible

✓ Check first AND last 4 characters minimum

✓ Verify network matches (BTC to BTC, ETH to ETH)

✓ Be extra careful when tired

### Safe Transaction Process

1. **Get recipient address**
2. **Copy-paste or scan QR**
3. **Verify address** (first 4 + last 4 characters minimum)
4. **Check network** (Bitcoin, Ethereum, etc.)
5. **Send small test** ($10-20)
6. **Confirm receipt**
7. **Then send full amount**
8. **Save transaction ID**

---

## 9. Ignoring Tax Obligations

### The Mistake

**Illustrative example**: Chris made $200,000 trading crypto in 2021 but didn't report it. The IRS found out. He owes $60,000 in taxes plus $20,000 in penalties and interest.

**Cost**: $80,000 in penalties + stress

### Why It's Dangerous

- IRS treats crypto as property
- All sales/trades are taxable events
- US exchanges now report your sales to the IRS on Form 1099-DA (from 2025 transactions)
- Penalties for not reporting
- Potential audit

### How to Avoid It

✓ Track all transactions

✓ Use crypto tax software (CoinTracker, Koinly)

✓ Report on tax returns

✓ Set aside money for taxes (30% of gains)

✓ Consider tax-loss harvesting

✓ Consult crypto-savvy CPA

Read [Crypto Taxes: What You Need to Know](/learn/crypto-taxes-basics) for the details.

### US Tax Basics

**Taxable Events:**
- Selling crypto for USD
- Trading crypto for crypto
- Spending crypto
- Receiving staking rewards

**Not Taxable:**
- Buying crypto with USD
- Transferring between your own wallets
- HODLing (just holding)

---

## 10. Overtrading

### The Mistake

**Illustrative example**: Emma started day-trading crypto. After 6 months of constant trading, she calculated her returns: -15% after fees, and hundreds of hours wasted.

**Cost**: Time + stress + losses

### Why It's Dangerous

- Studies of retail day traders consistently find most lose money (one widely cited study of Brazilian futures day traders found 97% of those who kept at it for more than 300 days lost money)
- Trading fees add up quickly
- Emotional decision making
- Time consuming
- Stressful
- Tax complexity (more taxable events)

### How to Avoid It

✓ Buy and hold strategy for most investors

✓ Dollar-cost average

✓ Check prices weekly max

✓ Set it and forget it

✓ Focus on time in market

✓ If you must trade, use <5% of portfolio

### The Math of Overtrading

**Example:**
- 100 trades per year, each moving your whole balance
- 0.25% fee per trade
- 100 trades × 0.25% ≈ 25% of your capital paid in fees each year (about 22% once compounding is counted)
- You need roughly a 25–30% gross return just to break even
- Plus tax on every trade
- Plus time and stress

**Better approach:**
- Buy quality projects
- Hold long-term (5+ years)
- Save on fees
- Save on taxes (long-term gains)
- Save time and sanity

---

## Bonus Mistakes

### Not Diversifying
Don't put everything in one coin. Spread risk across 3-5 quality projects.

### Bragging About Holdings
Don't tell people how much you own. You become a target.

### Using Shared Devices or Untrusted Networks
Avoid logging into crypto accounts on shared computers or unknown networks. Use your own device, keep it updated, and prefer your mobile connection when out.

### Not Learning Continuously
Crypto evolves fast. Keep learning or get left behind.

---

## Quick Reference Checklist

✓ Backed up seed phrase securely

✓ Enabled 2FA on all accounts

✓ Moved large holdings to hardware wallet

✓ Only invested disposable income

✓ Researched before buying

✓ Using test transactions

✓ Tracking for taxes

✓ Following buy-and-hold strategy

✓ Staying skeptical of offers

✓ Continuing education

---

## Key Takeaways

1. **Security first** - Back up seed phrase, use 2FA, hardware wallet
2. **Stay skeptical** - If too good to be true, it is
3. **Be patient** - Don't panic sell or FOMO buy
4. **Think long-term** - Time in market beats timing
5. **Only invest disposable income** - Sleep soundly at night
6. **Do your research** - Understand what you own
7. **Slow down** - Double-check everything
8. **Track taxes** - Avoid IRS problems
9. **Keep learning** - Crypto evolves constantly
10. **Trust yourself** - Not influencers or hype

---

## Next Steps

Now that you know what NOT to do:

1. **Secure your existing holdings** - Review your current setup
2. **Learn proper practices** - Read our [Wallet Security Guide](/learn/crypto-wallets-explained)
3. **Buy carefully** - Follow [How to Buy Your First Cryptocurrency](/learn/how-to-buy-crypto)
4. **Start small** - Test everything with small amounts first
5. **Size your risk** - Read [Crypto Risk Management](/learn/risk-management) and model scenarios with our [calculators](/calculators)

Remember: in crypto there is rarely anyone who can reverse a mistake for you, so prevention is everything.
`,
};
