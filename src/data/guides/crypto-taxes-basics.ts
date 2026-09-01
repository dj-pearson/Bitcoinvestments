export const cryptoTaxesBasicsGuide = {
  id: 'crypto-taxes-basics',
  title: 'Cryptocurrency Taxes: What You Need to Know',
  description: 'How crypto is taxed in the US, which everyday actions trigger a taxable event, and the record-keeping that makes filing survivable.',
  category: 'Taxes',
  readTime: 16,
  icon: '📊',
  content: `
# Cryptocurrency Taxes: What You Need to Know

> **This is general education, not tax advice.** Tax rules vary by country, change frequently, and depend heavily on your personal circumstances. This guide focuses on United States federal rules as a worked example. Before you file, talk to a qualified tax professional who understands crypto. Getting this wrong is expensive; getting advice is not.

The single most common — and most costly — misunderstanding in crypto is this: **you can owe tax on a year where you never withdrew a single dollar to your bank account.**

If that sentence is surprising, this guide is for you.

## The Core Idea: Crypto Is Property, Not Currency

In the US, the IRS has treated virtual currency as **property** since Notice 2014-21. This one classification drives nearly everything else.

Because it's property rather than currency, crypto follows the same broad rules as shares or real estate:

- Buying and holding it isn't a taxable event
- **Disposing** of it is
- When you dispose of it, you owe tax on the *gain* — what it's worth now minus what you paid

That word "disposing" is doing a lot of work, and it's where most people get caught out.

## What Actually Triggers a Taxable Event

### Taxable: Selling crypto for dollars

The obvious one. You bought 1 ETH for $2,000 and sold it for $3,500. You realised a $1,500 gain.

### Taxable: Trading one crypto for another

**This is the one that surprises people.** Swapping BTC for ETH is treated as selling your BTC at fair market value and immediately buying ETH with the proceeds.

You never touched dollars. You may not even think of it as a sale. The IRS does. Some tried to argue such swaps qualified as "like-kind exchanges" under Section 1031 — the Tax Cuts and Jobs Act of 2017 limited that provision to real property, closing the argument for tax years from 2018 onward.

### Taxable: Spending crypto on goods or services

Buying a laptop with Bitcoin is a disposal. You owe tax on the gain between what you paid for that Bitcoin and its value when you spent it. Yes, even for a cup of coffee. This is a significant practical obstacle to crypto as everyday money.

### Taxable as income: Being paid in crypto

Salary, freelance payment, staking rewards, mining rewards, most airdrops. These are **ordinary income** at fair market value on the day you received them — taxed at your normal income rate, not the capital gains rate.

Then a second rule kicks in: that value becomes your **cost basis**. When you later sell those coins, you owe capital gains on any change in value since you received them. One batch of coins, two separate taxable moments.

### Not taxable: Buying crypto with dollars

Purchasing and holding creates no tax event. It establishes your cost basis and starts your holding-period clock.

### Not taxable: Holding, however much it moves

Unrealised gains aren't taxed. A portfolio up 400% on paper generates no tax bill until you dispose of something.

### Not taxable: Moving between your own wallets

Transferring from an exchange to your hardware wallet is not a disposal — you still own it. **However**, exchanges frequently report these as withdrawals, and tax software often flags them as sales. You need records to demonstrate otherwise, which is why the record-keeping section below matters.

### Not taxable: Gifting, within limits

Gifting crypto is generally not taxable to the giver below the annual exclusion (\\$19,000 per recipient for 2025). The recipient typically inherits your cost basis. Donating directly to a qualified charity can be notably efficient — you may deduct the fair market value without realising the gain — but the rules are detailed and worth professional input.

## Short-Term vs Long-Term: The Rule Worth Building Around

How long you held before disposing determines the rate you pay, and the gap is large.

**Short-term** (held one year or less) is taxed as **ordinary income** — the same rates as your salary, currently up to 37% federally.

**Long-term** (held more than one year) gets preferential rates: **0%, 15%, or 20%** depending on your total taxable income.

Consider a $10,000 gain for someone in the 24% bracket:

| Holding period | Federal tax | You keep |
|---|---|---|
| Sold at 11 months | $2,400 | $7,600 |
| Sold at 13 months | $1,500 | $8,500 |

Two extra months of patience, $900 different. This is one of the few genuinely reliable ways to improve your after-tax returns, and it costs nothing but time.

Note the clock is **more than** one year — exactly 365 days is still short-term. Hold to day 366.

Higher earners should also be aware of the **Net Investment Income Tax**: an additional 3.8% on investment income above \\$200,000 (single) or \\$250,000 (married filing jointly).

## Cost Basis: The Part Everyone Underestimates

Your **cost basis** is what you paid, including fees. Gain equals proceeds minus basis. Simple — until you've bought the same coin twenty times at twenty prices and sell part of the stack.

Which coins did you sell?

### The methods

**FIFO (First In, First Out)** — the earliest coins you bought are the first sold. This is the default if you don't specify otherwise. In a market that has risen, FIFO sells your cheapest coins and produces the largest gain — but those coins are also most likely to qualify for long-term rates.

**Specific Identification** — you nominate exactly which lot you're selling. This offers the most control, letting you select high-basis lots to reduce a gain or realise losses deliberately. It requires records adequate to identify the specific units.

**HIFO (Highest In, First Out)** — a specific-identification strategy of always selling your most expensive lots first, minimising the current gain. Popular with tax software, and it depends entirely on maintaining the records to substantiate it.

### A rule change worth knowing about

The IRS has moved toward requiring cost basis to be tracked **per wallet or account** rather than universally across all your holdings. Revenue Procedure 2024-28 provided a safe harbour for allocating existing basis to specific accounts. If you hold the same asset across several exchanges and wallets, this is exactly the sort of detail worth raising with a professional rather than assuming your old approach still applies.

## Losses Are Genuinely Useful

Losses aren't just disappointing — they have real tax value.

**They offset gains.** A $5,000 gain and a $3,000 loss leaves $2,000 taxable.

**They offset ordinary income, up to a point.** With losses beyond your gains, you may deduct up to **$3,000** per year against ordinary income.

**They carry forward indefinitely.** A $20,000 net loss offsets $3,000 this year and carries the remaining $17,000 into future years.

### Tax-loss harvesting, and the wash sale question

**Tax-loss harvesting** means deliberately selling a losing position to realise the loss and reduce your bill.

For stocks, the **wash sale rule** blocks claiming a loss if you buy a substantially identical security within 30 days either side. Because crypto is classified as property rather than a security, that rule has historically not applied to it — meaning crypto holders could sell at a loss and rebuy immediately.

Two cautions. First, closing this gap has been repeatedly proposed in Congress; treat it as a rule that could change. Second, the **economic substance doctrine** gives the IRS room to challenge transactions with no purpose beyond tax avoidance. Aggressive same-minute round trips are a strategy to discuss with a professional, not to copy from social media.

One more detail that trips people up: losses net **within** their holding period first — short-term against short-term, long-term against long-term — and only the remainder crosses over. It's a small rule with a real effect on the final number.

## Staking, Mining, DeFi and NFTs

**Staking rewards** are generally ordinary income at fair market value when you gain dominion and control. Revenue Ruling 2023-14 addressed this directly. Their value at receipt becomes the basis for a later capital gain.

**Mining** is ordinary income at fair market value when received. Mining as a business rather than a hobby changes the treatment substantially, including potential self-employment tax and the ability to deduct equipment and electricity.

**Airdrops** are generally ordinary income when you have dominion and control over the tokens.

**DeFi is genuinely unsettled.** Supplying liquidity, wrapping tokens, borrowing against collateral, receiving LP tokens — the treatment of many of these is not fully specified in guidance. Conservative positions and professional input matter more here than anywhere else in this guide.

**NFTs** are property too, but some may qualify as **collectibles**, which carry a higher maximum long-term rate of 28%. Creators and traders face different treatment again.

## Reporting: The Forms and the Deadline

**Form 8949** lists each disposal: what you sold, when you acquired it, when you disposed of it, proceeds, cost basis, gain or loss.

**Schedule D** summarises Form 8949 into net short-term and long-term figures.

**Schedule 1 or Schedule C** covers crypto received as income — Schedule C if it's self-employment.

**Form 1040** carries a **digital asset question** near the top. Answer it honestly. It's a direct question on a return signed under penalty of perjury.

**FBAR / Form 8938** may apply to foreign accounts. Whether foreign crypto exchanges trigger these has been an area of ongoing development — another one for a professional.

The federal deadline is generally **April 15**. An extension to file is not an extension to pay.

### Form 1099-DA is changing things

Brokers began reporting digital asset dispositions on the new **Form 1099-DA** for transactions from 2025, with cost basis reporting phasing in for 2026. Practically: the IRS increasingly receives information about your trades directly. Any mismatch between what an exchange reports and what you file invites a notice. Whatever your record-keeping was like before, this is the moment to tighten it.

## Record-Keeping: Do This Now, Not in April

The tax bill is rarely the painful part. Reconstructing three years of trades across five platforms — two of which no longer exist — is the painful part.

**Keep for every transaction:**
- Date and time
- What you acquired or disposed of, and how much
- Fair market value in your local currency at that moment
- Fees paid
- Wallet addresses or exchange involved
- What kind of transaction it was

**Practical habits that save real pain:**

1. **Export your history quarterly, not annually.** Exchanges shut down, restrict access, and lose historical data. Mt. Gox, Celsius, FTX — users of all three found their records much harder to reconstruct after the fact.
2. **Label transfers as you make them.** A wallet-to-wallet move you can identify today is indistinguishable from a sale in eighteen months.
3. **Record the fiat value at the time of every crypto-to-crypto trade.** You'll need it, and backfilling historical prices across hundreds of trades is grim.
4. **Use crypto tax software.** Connecting exchanges and wallets to a dedicated tool costs a fraction of what an accountant charges to untangle it manually.
5. **Keep records for at least three years** after filing — longer if there's any chance of substantial understatement.

## Common and Costly Mistakes

**Assuming no withdrawal means no tax.** The most expensive misconception in crypto. Trade actively all year, never cash out, still owe tax.

**Forgetting crypto-to-crypto trades.** Every swap is a disposal. A busy DeFi year can generate hundreds.

**Ignoring small transactions.** There's no de minimis exemption for personal crypto transactions in current US law. Every disposal counts, however small.

**Losing basis records after moving wallets.** Without basis, you may end up treating your basis as zero — taxing the entire proceeds as gain.

**Answering the 1040 digital asset question carelessly.** It's asked under penalty of perjury.

**Selling at eleven months.** Pure avoidable cost. Check your holding periods before you sell.

**Not planning for the bill.** A large gain in a rising market can meet a tax bill due after the market falls — with a portfolio no longer worth enough to cover it. If you realise a significant gain, set the tax aside in cash immediately.

**Assuming losses are worthless.** They offset gains, offset up to $3,000 of income, and carry forward.

## If You Haven't Been Reporting

Blockchains are permanent, public records. The IRS has issued John Doe summonses to major exchanges, sent warning letters to thousands of holders, and now receives broker reporting directly.

If you have unreported crypto activity, the answer is to fix it — amended returns, or one of the available voluntary disclosure routes — with a tax professional's help. Penalties for coming forward are meaningfully lower than penalties for being found.

## Outside the United States

The property-based model is common but far from universal:

- **United Kingdom** — Capital Gains Tax with an annual exempt amount; HMRC has detailed crypto guidance
- **Germany** — private sales of crypto held over one year have been tax-free, subject to conditions
- **Portugal** — long treated as favourable, though the rules have tightened
- **Australia** — CGT applies, with a discount for assets held over a year
- **Canada** — generally 50% of the capital gain is taxable
- **India** — a flat 30% on gains plus a transaction-level TDS

These change. Verify current rules for your jurisdiction rather than relying on a summary — including this one.

## Key Takeaways

- Crypto is **property** in the US, so disposals are taxable events
- **Crypto-to-crypto trades are taxable**, even without touching dollars
- You can owe tax in a year you withdrew nothing
- Holding **more than one year** moves you to substantially lower long-term rates
- Income events are taxed twice over: as income at receipt, then as capital gains on later disposal
- **Cost basis records are everything** — reconstruct them now, not in April
- Losses offset gains, offset up to $3,000 of ordinary income, and carry forward indefinitely
- Form 1099-DA means the IRS increasingly sees your trades directly
- **Talk to a qualified tax professional.** This guide is a map, not a substitute

## Where to Go Next

- **[Crypto Tax Calculator](/calculators?type=tax)** — estimate capital gains on a disposal
- **[Crypto Risk Management](/learn/risk-management)** — position sizing and planning for the downside
- **[Portfolio Rebalancing](/learn/portfolio-rebalancing)** — rebalancing is itself a taxable event worth planning around

Tax is the part of investing most people avoid thinking about until it's urgent. An hour spent on record-keeping today is worth many hours and a great deal of money next April.
`
};
