export const defiRisksGuide = {
  id: 'defi-risks',
  title: 'DeFi Risks Explained: Protecting Yourself in Decentralized Finance',
  description: 'Understand smart contract risks, rug pulls, oracle failures, and how to protect your assets in DeFi. Essential reading before farming.',
  category: 'DeFi',
  readTime: 17,
  icon: '⚠️',
  content: `
# DeFi Risks Explained: Protecting Yourself in Decentralized Finance

DeFi offers incredible opportunities but comes with significant risks. This guide covers every major risk category and how to protect yourself.

## The Reality of DeFi Risk

### DeFi Losses by the Numbers

- **2021**: $1.3 billion lost to DeFi exploits
- **2022**: $3.1 billion lost to DeFi exploits
- **2023**: $1.7 billion lost to DeFi exploits

These numbers don't include:
- Impermanent loss
- Failed projects
- Scams and rug pulls

### Why DeFi is Risky

1. **Code is law**: Bugs can't be reversed
2. **Immutability**: Mistakes are permanent
3. **Complexity**: Many interdependencies
4. **Speed of innovation**: Less time for security audits
5. **Open source**: Attackers can study code

## Smart Contract Risks

### What Can Go Wrong

Smart contracts are code, and code has bugs.

**Common Vulnerabilities:**

| Vulnerability | Description | Example |
|---------------|-------------|---------|
| Reentrancy | Attacker repeatedly calls function | The DAO hack ($60M) |
| Flash loan attacks | Manipulate prices in single tx | bZx ($8M) |
| Integer overflow | Math errors | Multiple protocols |
| Access control | Unauthorized functions | Countless projects |
| Logic errors | Flawed business logic | Many protocols |

### Case Study: The DAO Hack (2016)

- Raised $150M in ETH
- Reentrancy bug discovered
- Attacker drained $60M
- Led to Ethereum hard fork

**Lesson**: Even heavily-funded, popular projects can have critical bugs.

### How to Assess Smart Contract Risk

**Check for:**
1. **Audits**: Have reputable firms reviewed the code?
2. **Bug bounties**: Does the protocol incentivize finding bugs?
3. **Time**: How long has the code been deployed without issues?
4. **Forks**: Is it a copy of battle-tested code?

**Red flags:**
- No audits
- Single auditor only
- Major changes after audit
- Rushed deployment

### Audit Firms to Look For

Reputable auditors:
- Trail of Bits
- OpenZeppelin
- Consensys Diligence
- Certik
- PeckShield
- Halborn

**Note**: Even audited protocols get hacked. Audits reduce but don't eliminate risk.

## Rug Pulls and Exit Scams

### What is a Rug Pull?

When developers abandon a project and steal user funds.

**Types of Rug Pulls:**

#### 1. Liquidity Rug
- Developers add liquidity to DEX
- Users buy tokens
- Developers remove all liquidity
- Token becomes unsellable

#### 2. Sell Rug
- Team holds large token supply
- Dump tokens on users
- Price crashes, team profits

#### 3. Mint Rug
- Hidden function allows unlimited minting
- Developers mint and sell
- Inflation destroys value

### Warning Signs

**Team Red Flags:**
- Anonymous team with no history
- No LinkedIn/Twitter presence
- Defensive when questioned
- Overpromising, underdelivering

**Technical Red Flags:**
- Unverified contracts
- Admin keys without timelock
- Ability to pause trading
- Mint functions without limits
- No audit or sham audit

**Community Red Flags:**
- Excessive hype, no substance
- Silencing of critics
- Paid promotions from influencers
- FOMO-inducing language

### Protection Strategies

1. **Research the team**: Real people with reputation to protect
2. **Check contract functions**: Look for dangerous admin capabilities
3. **Verify liquidity lock**: Is it really locked? For how long?
4. **Start small**: Test with amount you can lose
5. **Be skeptical**: If it seems too good...

## Oracle Risks

### What are Oracles?

Oracles bring external data (prices, events) onto the blockchain.

### Oracle Failure Modes

#### 1. Price Manipulation
Attacker manipulates price feed to exploit protocols.

**Example**:
- Protocol uses single DEX price
- Attacker manipulates DEX price with large trade
- Borrows at wrong price
- Arbitrages the difference

#### 2. Stale Data
Oracle doesn't update fast enough during volatility.

**Example**:
- Price crashes 40%
- Oracle still shows old price
- Liquidations don't trigger properly
- Protocol accumulates bad debt

#### 3. Oracle Downtime
Oracle goes offline, protocol can't function.

### Protection

**Choose protocols that use:**
- Multiple oracle sources (Chainlink)
- Time-weighted average prices (TWAP)
- Circuit breakers for extreme moves
- Fallback oracles

## Liquidity Risks

### What is Liquidity Risk?

The risk of not being able to exit your position at a fair price.

### Liquidity Risk Scenarios

#### 1. Low Liquidity Tokens
- Large orders move price significantly
- Slippage can be 10%+ on exits
- In panic, may not be able to sell at all

#### 2. De-peg Events
- Stablecoin loses $1 peg
- Everyone rushes to exit
- Not enough liquidity for all sellers
- Some users trapped at discount

#### 3. Protocol Exploits
- Hack causes panic
- Bridge/withdrawal congestion
- Gas prices spike
- Users can't exit

### Protection Strategies

1. **Trade liquid pairs**: Higher TVL = better liquidity
2. **Avoid small caps**: Unless you can afford total loss
3. **Use limit orders**: When available
4. **Monitor health factors**: Keep buffer above liquidation
5. **Diversify custodians**: Don't get trapped on one chain

## Protocol-Specific Risks

### Lending Protocol Risks

**Liquidation Risk:**
- Collateral value drops
- Health factor goes below 1
- Position liquidated
- Often lose 5-15% to liquidation penalty

**Bad Debt Risk:**
- Cascade liquidations
- Protocol can't cover all debts
- Lenders may not be made whole

**Utilization Risk:**
- High borrowing = high utilization
- Can't withdraw immediately
- Must wait for loans to be repaid

### LP Risks

**Impermanent Loss:**
- Price divergence causes loss
- Can exceed trading fee earnings
- Worst with volatile pairs

**Smart Contract Risk:**
- Both tokens AND LP contract risks
- More contracts = more risk

**Hack Drain:**
- If pool is hacked, LP tokens worthless
- No recourse typically

### Bridge Risks

Bridges are especially risky due to complexity.

**Notable Bridge Hacks:**
| Bridge | Amount | Year |
|--------|--------|------|
| Ronin | $620M | 2022 |
| Wormhole | $320M | 2022 |
| Nomad | $190M | 2022 |
| Harmony | $100M | 2022 |

**Protection:**
- Minimize bridged amounts
- Use established bridges
- Don't leave funds on bridges
- Consider centralized transfer for large amounts

## Regulatory Risks

### Current Landscape

- US SEC increasingly active
- Various tokens classified as securities
- Sanctions compliance (Tornado Cash)
- Tax reporting requirements

### Potential Impacts

**On protocols:**
- Forced to block US users
- Shutdown or migration
- Token reclassification

**On users:**
- Tax obligations
- Potential legal issues
- Reduced access to protocols

### Protection

1. **Know your jurisdiction's rules**
2. **Keep records**: Every transaction for taxes
3. **Use compliant platforms**: When needed
4. **Consult tax professional**: For significant activities

## Operational Risks

### Key Management

- Lost seed phrase = lost funds
- Compromised seed = stolen funds
- No recovery mechanism

### Phishing

- Fake websites
- Fake wallet popups
- Malicious token approvals
- Social engineering

### Human Error

- Sending to wrong address
- Wrong network selection
- Excessive slippage
- Forgetting about positions

### Protection

**Key Management:**
- Hardware wallet for significant amounts
- Secure seed phrase storage
- Test recoveries periodically

**Anti-Phishing:**
- Bookmark legitimate sites
- Verify URLs character by character
- Never share seed phrase
- Use hardware wallet (confirms on device)

**Error Prevention:**
- Double-check all transactions
- Test with small amounts first
- Understand before signing
- Revoke unnecessary approvals

## DeFi Insurance

### What DeFi Insurance Covers

- Smart contract failures
- Oracle failures
- Governance attacks
- Exchange/custodian hacks

### Insurance Providers

| Provider | Coverage Type |
|----------|---------------|
| Nexus Mutual | Smart contract, oracle |
| InsurAce | Multi-chain coverage |
| Unslashed | Validator, exchange |
| Risk Harbor | Algorithmic coverage |

### Limitations

- Coverage caps exist
- Claims require governance approval
- May not cover all exploit types
- Premium costs reduce yield

### Is Insurance Worth It?

Consider when:
- Large positions
- Higher-risk protocols
- Sleep-at-night factor

Not worth it when:
- Small positions (cost > benefit)
- Very short-term farming
- Already diversified adequately

## Building a Risk Framework

### Pre-Investment Checklist

Before entering any DeFi position:

- [ ] I understand how the protocol works
- [ ] Protocol has been audited (check auditor reputation)
- [ ] Protocol has been live 6+ months without incidents
- [ ] TVL is adequate ($50M+ for significant investment)
- [ ] Team is known/reputable
- [ ] Token approvals are appropriate (not unlimited)
- [ ] I have exit strategy planned
- [ ] Position size is appropriate for risk

### Risk Budget

Allocate positions by risk level:

| Risk Level | Max Allocation | Examples |
|------------|----------------|----------|
| Low | 40-60% | Major lending (Aave), stable LPs |
| Medium | 20-30% | Established DEX LPs, yield aggregators |
| High | 10-20% | New protocols, leveraged positions |
| Very High | 0-5% | Degen plays, new launches |

### Monitoring System

Set up alerts for:
- Health factor changes
- Price movements
- Protocol TVL changes
- Security incidents
- Social media warnings

### Incident Response Plan

Know what to do if:

**Protocol announces vulnerability:**
1. Don't panic sell (may cause losses)
2. Assess severity
3. Follow official instructions
4. Withdraw if necessary
5. Revoke approvals

**Protocol is hacked:**
1. Attempt withdrawal immediately
2. Revoke all approvals
3. Monitor for remediation
4. Document for taxes/insurance
5. Learn for next time

## Key Takeaways

- Every DeFi activity carries risk
- Smart contract bugs are the biggest technical risk
- Rug pulls are the biggest human risk
- Audits help but don't guarantee safety
- Diversification is essential
- Only invest what you can afford to lose completely
- Research, research, research

## Risk Management Commandments

1. **Never invest more than you can lose**
2. **Understand before investing**
3. **Diversify across protocols and chains**
4. **Check audits and track record**
5. **Start small and scale up**
6. **Monitor positions regularly**
7. **Have exit strategies**
8. **Stay paranoid** - suspicion saves funds

## Final Thoughts

DeFi risk management is not about avoiding risk entirely - it's about:
- Understanding what risks you're taking
- Getting compensated appropriately for those risks
- Sizing positions so no single failure is catastrophic
- Being prepared when things go wrong

The goal is to still be in the game after the next exploit. The survivors compound their gains while others start over.

Stay safe out there.
`
};
