import type { GuideSource } from './index';

export const cryptoWalletsExplainedGuide: GuideSource = {
  id: 'crypto-wallets-explained',
  title: 'Crypto Wallets Explained',
  seoTitle: 'Crypto Wallets Explained: Hot vs Cold',
  description:
    'Hot vs cold crypto wallets explained: how wallets and seed phrases work, current hardware wallet options, how to back up safely, and the threats to watch for.',
  summary:
    'A crypto wallet does not hold coins; it holds the private keys that let you move coins recorded on the blockchain. Hot (internet-connected) wallets are convenient for small amounts, cold wallets such as hardware devices are safer for savings, and whichever you use, the seed phrase backup is what really protects your funds.',
  category: 'Security',
  icon: '🔐',
  datePublished: '2026-01-02',
  dateModified: '2026-09-23',
  relatedGuides: ['how-to-buy-crypto', 'understanding-blockchain', 'common-crypto-mistakes'],
  relatedTools: [
    { label: 'Compare wallets', url: '/compare?tab=wallets', description: 'Software and hardware wallets side by side' },
    { label: 'Hardware wallet guide', url: '/hardware-wallet', description: 'Choosing and setting up a device' },
    { label: 'Scam database', url: '/scam-database', description: 'Known fake wallets and phishing sites' },
  ],
  faqs: [
    {
      question: 'Can I use more than one wallet?',
      answer:
        'Yes, and many people do: a hot wallet with a small spending balance and a hardware wallet for savings. Each wallet has its own seed phrase to back up.',
    },
    {
      question: 'What happens if my hardware wallet breaks or is lost?',
      answer:
        'Your coins are not on the device. Buy a new one (it can be a different brand that supports the same standard) and restore it with your seed phrase. Without the seed phrase, the funds cannot be recovered.',
    },
    {
      question: 'Can someone steal my crypto with just my address?',
      answer:
        'No. A receiving address is safe to share. Be aware that scammers can send tiny "dust" transactions from look-alike addresses so you copy the wrong one later (address poisoning), so always copy addresses from your wallet, not your history.',
    },
    {
      question: 'Should I keep crypto on an exchange or in my own wallet?',
      answer:
        'An exchange is simpler and fine for small amounts or active trading, but you rely on the company staying solvent and honest. A wallet you control removes that risk but makes you responsible for backups.',
    },
    {
      question: 'How do I know a wallet app is legitimate?',
      answer:
        'Get it from the developer\'s official website or verified app-store listing, check that it is widely used and ideally open source and audited, and be wary of wallets promoted through ads or direct messages.',
    },
  ],
  content: `
# Crypto Wallets Explained

A cryptocurrency wallet is your gateway to the blockchain - it stores your private keys and allows you to send, receive, and manage your digital assets. Understanding wallet types and security is crucial for protecting your investment.

## What is a Crypto Wallet?

### Not Actually a Wallet

Despite the name, crypto wallets don't actually store your cryptocurrency. Instead, they store:

- **Private Keys**: Secret codes that prove ownership of your crypto
- **Public Keys**: Your receiving addresses (like a bank account number)
- **Transaction History**: Record of all your crypto movements

Your actual cryptocurrency always lives on the blockchain. The wallet just gives you access to it.

### The Golden Rule

**"Not your keys, not your crypto"**

If you don't control the private keys, you don't truly own your cryptocurrency. This is why keeping crypto on exchanges long-term is risky.

## Types of Crypto Wallets

### 1. Hot Wallets (Internet-Connected)

#### Mobile Wallets

**Best for**: Daily transactions, convenience

**Popular Options:**
- **Trust Wallet**: User-friendly, supports many tokens
- **BlueWallet**: Bitcoin-focused, excellent UX
- **Exodus**: Beautiful design, built-in exchange

**Pros:**
- Easy to use
- Quick access
- Free
- Good for spending

**Cons:**
- Vulnerable to malware
- Depends on phone security
- Lost phone = lost access (if no backup)

**Security Tips:**
- Enable biometric authentication
- Write down seed phrase
- Only keep spending amounts
- Keep phone OS updated

#### Desktop Wallets

**Best for**: Home computer use, better security than mobile

**Popular Options:**
- **Electrum**: Bitcoin, advanced features
- **Exodus**: Multi-currency, elegant interface
- **Sparrow**: Bitcoin, strong coin-control features

**Pros:**
- More control than mobile
- Better for larger amounts
- Advanced features
- Free

**Cons:**
- Vulnerable to computer viruses
- Less portable
- Requires backups

#### Browser Extension Wallets

**Best for**: DeFi, NFTs, Web3 interactions

**Popular Options:**
- **MetaMask**: Most popular, Ethereum-focused
- **Phantom**: Solana ecosystem
- **Rabby**: Multi-chain, shows transaction previews

**Pros:**
- Easy DApp interaction
- Quick transactions
- Free

**Cons:**
- Browser vulnerabilities
- Phishing risk
- Limited to one device

### 2. Cold Wallets (Offline Storage)

#### Hardware Wallets

**Best for**: Long-term holding, large amounts

**Popular Options:**

Current lineups (list prices checked September 2026; they change often):

| Brand | Models | Approx. price range | Notes |
|---|---|---|---|
| **Ledger** | Nano S Plus, Nano X, Nano Gen5, Flex, Stax | ~$79–$399 | Secure element; closed-source firmware; Bluetooth on most models |
| **Trezor** | Safe 3, Safe 5, Safe 7 | ~$79–$249 | Open-source firmware with secure element; the older Model One and Model T have been discontinued |
| **BitBox** | BitBox02 (multi-coin or Bitcoin-only) | ~$150 | Swiss-made, open source |
| **Coldcard** | Mk4, Q | ~$150–$250 | Bitcoin-only, aimed at advanced users |

For a side-by-side view, see our [wallet comparison](/compare?tab=wallets) and [hardware wallet guide](/hardware-wallet).

**Pros:**
- Maximum security
- Offline storage
- Malware resistant
- Physical device control

**Cons:**
- Costs roughly $60–$400
- Can be lost or damaged
- Learning curve
- Need computer for setup

#### Paper Wallets (not recommended today)

A paper wallet is a single private key printed on paper. They were popular before hardware wallets existed; most security guidance now discourages them.

**What is it:**
- Private keys printed on paper
- QR codes for easy scanning
- Completely offline

**Pros:**
- Free
- Offline until used

**Cons:**
- Generating the key safely is hard (malicious generator sites, printer and computer malware)
- Spending usually means "sweeping" the whole balance into a hot wallet; partial spends can send the change to an address you don't control
- Easily damaged or lost, with no recovery
- A hardware wallet plus a written seed phrase gives the same offline protection with far fewer pitfalls

## Choosing the Right Wallet

### Decision Framework

#### For Beginners ($100-$1,000)
- Start with **exchange wallet** (Coinbase, Kraken)
- Then move to **mobile wallet** (Exodus, Trust Wallet)
- Keep learning before hardware wallet

#### For Regular Users ($1,000-$10,000)
- **Mobile wallet** for daily use (smaller amounts)
- **Hardware wallet** for savings (bulk of holdings)
- Spread across 2-3 wallets for redundancy

#### For Serious Investors ($10,000+)
- **Multiple hardware wallets** (different brands)
- **Multi-signature wallets** for maximum security
- Consider **professional custody** for very large amounts

### Wallet Comparison Table

| Type | Security | Convenience | Cost | Best For |
|------|----------|-------------|------|----------|
| Exchange | Medium | High | Free | Trading |
| Mobile | Medium | High | Free | Daily use |
| Desktop | Medium-High | Medium | Free | Home use |
| Hardware | Very High | Medium | ~$60–$400 | Holding |
| Paper | Medium (error-prone) | Very low | Free | Not recommended |

## Setting Up Your First Wallet

### Step 1: Download from Official Source

⚠️ **Critical**: Only download from official websites or app stores

**Verify:**
- Type the address yourself or use a bookmark; check the exact domain for typos (phishing sites use HTTPS too, so the padlock proves nothing)
- Don't install from search ads or links in messages
- Check the developer and download count in the app store
- For hardware wallets, buy only from the maker or an authorised reseller

### Step 2: Create New Wallet

1. Open app/device
2. Select "Create New Wallet"
3. Choose strong PIN/password
4. Enable biometric if available

### Step 3: Backup Your Seed Phrase

**This is THE MOST IMPORTANT STEP**

#### What is a Seed Phrase?

A 12-24 word recovery phrase that can restore your entire wallet. Whoever has these words controls your crypto.

#### How to Back Up Safely:

✓ **DO:**
- Write on paper (never digital)
- Use provided recovery sheet
- Store in fireproof safe
- Make 2-3 copies
- Store in different locations
- Consider metal backup for fire resistance

❌ **DON'T:**
- Screenshot or photo
- Store in cloud (Google Drive, iCloud)
- Email to yourself
- Save on computer
- Tell anyone
- Store where others can find

#### Example Secure Storage:

- **Copy 1**: Fireproof safe at home
- **Copy 2**: Safety deposit box
- **Copy 3**: Trusted family member's safe

### Step 4: Verify Backup

Most wallets ask you to verify by entering words in correct order. This ensures you wrote them down correctly.

### Step 5: Receive First Transaction

1. Find "Receive" or "Deposit" button
2. Copy your address
3. Verify address is correct (check first and last characters)
4. Send small test amount first
5. Wait for confirmation
6. Verify in wallet

## Advanced Security Practices

### Multi-Signature Wallets

Require multiple private keys to authorize transactions:

- **2-of-3**: Need 2 out of 3 keys
- **3-of-5**: Need 3 out of 5 keys
- Perfect for businesses or large holdings

**Recommended:**
- **Safe** (formerly Gnosis Safe) for Ethereum and EVM chains
- **Sparrow** or **Electrum** multisig for Bitcoin (or collaborative-custody services such as Unchained or Casa)

### Passphrase (25th Word)

Add extra word to seed phrase:
- Not part of standard 12-24 words
- Creates an entirely different wallet
- Protects you if someone finds your written seed phrase
- **If you forget the passphrase, the funds are gone**, so back it up separately from the seed

**Use case:**
- Under duress, give up standard wallet (with small amount)
- Keep real holdings in passphrase wallet

### Hardware Wallet Best Practices

1. **Buy Direct from Manufacturer**
   - Never buy from third parties
   - Check tamper-evident packaging

2. **Initialize Yourself**
   - Never use pre-configured device
   - Generate new seed phrase

3. **Verify Addresses**
   - Always confirm on device screen
   - Malware can change addresses on computer

4. **Keep Firmware Updated**
   - Check manufacturer website
   - Verify signatures

## Common Security Threats

### 1. Phishing Attacks

**What**: Fake websites/emails stealing credentials

**Prevention:**
- Bookmark official sites
- Check URLs carefully
- Never click email links
- Use hardware wallet
- Enable 2FA everywhere

### 2. Malware

**What**: Software that steals keys or changes addresses

**Prevention:**
- Use antivirus software
- Don't download suspicious files
- Keep OS updated
- Use hardware wallet for large amounts
- Verify addresses on multiple devices

### 3. Physical Theft

**What**: Someone stealing your device or backup

**Prevention:**
- Strong PIN/password
- Biometric authentication
- Decoy wallet with small amount
- Never tell anyone your holdings

### 4. Social Engineering

**What**: Tricking you into revealing information

**Prevention:**
- Never share seed phrase
- No one legitimate will ask for it
- Be skeptical of "support" contacts
- Don't discuss holdings publicly

### 5. SIM Swapping

**What**: Hackers steal your phone number to bypass 2FA

**Prevention:**
- Use authenticator apps, not SMS 2FA
- Add PIN to mobile account
- Use hardware security keys

## Emergency Preparedness

### If Your Device is Lost/Stolen

1. **Don't Panic** - Your crypto is safe if you have seed phrase
2. **Get new device**
3. **Download wallet app**
4. **Select "Restore from Seed"**
5. **Enter seed phrase**
6. **Transfer to new wallet** (optional, for extra security)

### If You Lose Your Seed Phrase

If you still have device access:
1. **Immediately transfer** to new wallet
2. **Generate new seed phrase**
3. **Back up properly this time**

If you lost both device and seed phrase:
- Your crypto is gone for good
- No company or service can recover it
- Chainalysis and others estimate that millions of bitcoin are already permanently lost this way

### Inheritance Planning

Make sure loved ones can access your crypto:

1. **Document Everything**
   - Wallet types
   - Location of seeds
   - Instructions

2. **Secure Storage**
   - Safe deposit box
   - Estate lawyer
   - Trust services

3. **Consider:**
   - Dead man's switch services
   - Shamir's Secret Sharing
   - Trusted executor

## Wallet Maintenance Checklist

### Monthly

✓ Update wallet apps
✓ Check for firmware updates (hardware wallets)
✓ Verify seed phrase backups still readable
✓ Review transactions for suspicious activity

### Quarterly

✓ Test wallet recovery (with small amount)
✓ Review security practices
✓ Check your password manager for reused or breached passwords (unique passwords matter more than rotating them)
✓ Check backup locations

### Yearly

✓ Consider upgrading hardware wallet
✓ Redistribute holdings if needed
✓ Update inheritance documentation
✓ Review and improve security setup

## Key Takeaways

✓ Your crypto wallet stores private keys, not the actual crypto

✓ "Not your keys, not your crypto" - control your own keys

✓ Hot wallets for convenience, cold wallets for security

✓ Hardware wallets are best for holdings over $1,000

✓ Seed phrase is everything - protect it with your life

✓ Never share your seed phrase or private keys with anyone

✓ Back up seed phrase on paper in multiple secure locations

✓ Use different wallets for different purposes

✓ Stay vigilant against phishing and scams

✓ Plan for inheritance and emergencies

## Next Steps

1. **Choose your wallet type** based on your needs and holdings
2. **Set up your wallet** following security best practices
3. **Backup your seed phrase** properly
4. **Start with a small amount** to get comfortable
5. **Learn about** [buying crypto](/learn/how-to-buy-crypto)
6. **Understand** [common mistakes](/learn/common-crypto-mistakes)
7. **Go deeper** on [how blockchains work](/learn/understanding-blockchain)

---

**Remember**: In crypto, you are your own bank. With great power comes great responsibility. Good security habits remove most of the ways people lose crypto, though no setup removes price risk.
`,
};
