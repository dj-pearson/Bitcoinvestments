/**
 * /hardware-wallet — Hardware wallet comparison guide (Ledger vs Trezor and
 * others), built from the dated data in src/data/wallets.ts.
 *
 * Replaces the old "Hardware Wallet Integration" premium tracker, which showed
 * random balances and fake transactions and sold a $14.99/mo plan that could
 * not be bought.
 */

import { Link } from 'react-router-dom';
import { Check, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { generateBreadcrumbSchema } from '../components/SEO';
import { AffiliateDisclosureBanner, OutboundLink } from '../components/AffiliateDisclosure';
import { FaqSection, SourcesList, VerifiedDate, type FaqItem } from '../components/compare/CompareBlocks';
import { SITE_URL, formatIsoDate } from '../components/compare/compareUtils';
import { wallets, getCurrentHardwareWallets, getWalletById, WALLETS_LAST_VERIFIED } from '../data/wallets';
import type { FactSource, Wallet } from '../types';

function priceOf(id: string): string {
  const w = getWalletById(id);
  return w?.price ? `$${w.price}` : '';
}

const FAQS: FaqItem[] = [
  {
    question: 'Is Ledger or Trezor better?',
    answer:
      'Neither is better for everyone. Trezor publishes its firmware as open source, so outside researchers can check it, and its Safe models now also have a secure element. Ledger keeps its secure-element firmware closed but has had certified secure elements for years and offers Bluetooth and NFC on more models. If you value auditability, choose Trezor; if you want the widest phone support and coin list, choose Ledger.',
  },
  {
    question: 'What is the best budget hardware wallet?',
    answer: `The Trezor Safe 3 (${priceOf('trezor-safe-3')} list price) gives you open-source firmware and a secure element for the least money. The Ledger Nano S Plus (${priceOf('ledger-nano-s-plus')} list price, often discounted) is the Ledger alternative, but has no Bluetooth.`,
  },
  {
    question: 'Do I need a hardware wallet?',
    answer:
      'If you hold more crypto than you would be comfortable losing from a hacked phone, computer or exchange account, yes. A hardware wallet keeps the private keys on a separate device and asks you to confirm every transaction on its own screen, so malware cannot quietly send your coins away.',
  },
  {
    question: 'What happens if I lose my hardware wallet?',
    answer:
      'Your coins are not on the device; they are on the blockchain. You can restore them on a new device (any brand that supports the same standard) using your recovery phrase. That is why the recovery phrase must be written down offline and stored safely, and why anyone who finds it can take your coins.',
  },
  {
    question: 'Are the Trezor Model T and Model One still sold?',
    answer:
      'No. Trezor removed both from its shop on 2026-01-08. They still receive security updates (the Model One gets critical fixes until at least 2036). The Safe 3, Safe 5 and Safe 7 replace them.',
  },
  {
    question: 'Is it safe to buy a hardware wallet from Amazon or eBay?',
    answer:
      'Buy from the manufacturer or an authorised reseller. Tampered and "pre-configured" devices sold second-hand are a known scam. Never use a device that arrives with a recovery phrase already printed or set up: a genuine wallet always has you create a new one.',
  },
];

const SETUP_STEPS = [
  'Buy directly from the manufacturer or an authorised reseller, and check the packaging for tampering.',
  'Set it up from scratch: the device must generate a new recovery phrase. Never accept one that came in the box.',
  'Write the recovery phrase on paper or a metal backup plate. Never type it into a phone, computer, cloud note or photo.',
  'Install the official app only (Ledger Wallet or Trezor Suite) from the official website, and update firmware only through it.',
  'Send a small test amount, then practise a restore before you move your savings.',
  'Always check the receiving address and amount on the device screen, not just on your computer.',
  'Consider a passphrase (a "25th word") for extra protection, but only if you can store it as safely as the phrase itself.',
  'Expect phishing: past customer-data leaks mean scammers email, text and even post fake "replacement" devices to owners.',
];

const OTHER_BRANDS: { name: string; summary: string }[] = [
  { name: 'Coldcard (Coinkite)', summary: 'Bitcoin-only, designed for air-gapped use with a microSD card. Popular with advanced Bitcoin savers and multisig setups.' },
  { name: 'BitBox02 (Shift Crypto, Switzerland)', summary: 'Open-source firmware with a secure chip, sold in multi-coin and Bitcoin-only editions.' },
  { name: 'Keystone', summary: 'Air-gapped device that signs via QR codes, with a large touchscreen; works with many software wallets.' },
  { name: 'Blockstream Jade', summary: 'Low-cost, open-source Bitcoin (and Liquid) wallet with a camera for QR-code air-gapped signing.' },
];

function yesNoCell(value: boolean) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-green-300"><Check className="w-4 h-4" aria-hidden="true" />Yes</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-gray-400"><X className="w-4 h-4" aria-hidden="true" />No</span>
  );
}

function productSchema(w: Wallet) {
  return {
    '@type': 'Product',
    name: w.name,
    url: `${SITE_URL}/compare/wallet/${w.id}`,
    brand: { '@type': 'Brand', name: w.brand },
    category: 'Cryptocurrency hardware wallet',
    ...(w.price
      ? {
          offers: {
            '@type': 'Offer',
            price: w.price.toFixed(2),
            priceCurrency: 'USD',
            url: w.url,
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Organization', name: w.brand },
          },
        }
      : {}),
  };
}

export default function HardwareWalletPage() {
  const current = getCurrentHardwareWallets();
  const discontinued = wallets.filter(w => w.type === 'hardware' && w.status === 'discontinued');

  const sources: FactSource[] = [];
  for (const w of [...current, ...discontinued]) {
    for (const s of w.sources) {
      if (!sources.some(existing => existing.url === s.url)) sources.push(s);
    }
  }

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Current hardware wallets compared',
      numberOfItems: current.length,
      itemListElement: current.map((w, i) => ({ '@type': 'ListItem', position: i + 1, item: productSchema(w) })),
    },
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Hardware wallet comparison', url: '/hardware-wallet' },
    ]),
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-10">
      <PageSEO pageKey="hardwareWallet" urlPath="/hardware-wallet" faqs={FAQS} customSchema={schema} />

      <header className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Hardware Wallet Comparison: Ledger vs Trezor (2026)
        </h1>
        <p className="text-lg text-gray-300">
          A hardware wallet keeps your private keys on a separate device and makes you approve every
          transaction on its own screen. For most people the Trezor Safe 3 ({priceOf('trezor-safe-3')} list)
          is the best value; choose the Ledger Nano Gen5 ({priceOf('ledger-nano-gen5')}) or Trezor Safe 7
          ({priceOf('trezor-safe-7')}) if you want Bluetooth for an iPhone. Below: every current Ledger and
          Trezor model side by side, what changed recently, and how to set one up safely.
        </p>
        <div className="mt-3">
          <VerifiedDate date={WALLETS_LAST_VERIFIED} />
        </div>
      </header>

      <AffiliateDisclosureBanner variant="compact" />

      <section aria-labelledby="table-heading" className="glass-card p-6">
        <h2 id="table-heading" className="text-2xl font-bold text-white mb-2">Current Ledger and Trezor models compared</h2>
        <p className="text-sm text-gray-400 mb-4">
          US list prices, cheapest first. Manufacturers often discount older models, so check the official store.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[860px]">
            <caption className="sr-only">Specifications of current hardware wallets</caption>
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th scope="col" className="py-2 pr-3 font-medium">Model</th>
                <th scope="col" className="py-2 pr-3 font-medium">List price</th>
                <th scope="col" className="py-2 pr-3 font-medium">Screen</th>
                <th scope="col" className="py-2 pr-3 font-medium">Connectivity</th>
                <th scope="col" className="py-2 pr-3 font-medium">Secure element</th>
                <th scope="col" className="py-2 pr-3 font-medium">Open-source firmware</th>
                <th scope="col" className="py-2 pr-3 font-medium">Bitcoin-only firmware</th>
                <th scope="col" className="py-2 pr-3 font-medium">Released</th>
                <th scope="col" className="py-2 font-medium">Where to buy</th>
              </tr>
            </thead>
            <tbody>
              {current.map(w => (
                <tr key={w.id} className="border-b border-white/5 align-top">
                  <th scope="row" className="py-3 pr-3 font-semibold text-white">
                    <Link to={`/compare/wallet/${w.id}`} className="underline hover:text-orange-300">{w.name}</Link>
                  </th>
                  <td className="py-3 pr-3 text-white">${w.price}</td>
                  <td className="py-3 pr-3 text-gray-300">{w.hardware?.screen}</td>
                  <td className="py-3 pr-3 text-gray-300">{w.hardware?.connectivity.join(', ')}</td>
                  <td className="py-3 pr-3 text-gray-300">{w.hardware?.secure_element}</td>
                  <td className="py-3 pr-3">{yesNoCell(Boolean(w.hardware?.open_source_firmware))}</td>
                  <td className="py-3 pr-3">{yesNoCell(Boolean(w.hardware?.bitcoin_only_edition))}</td>
                  <td className="py-3 pr-3 text-gray-300">{w.hardware ? formatIsoDate(w.hardware.released) : ''}</td>
                  <td className="py-3">
                    <OutboundLink
                      partnerId={w.affiliate_partner_id}
                      officialUrl={w.url}
                      name={w.name}
                      type="wallet"
                      className="text-orange-400 hover:text-orange-300 underline"
                    >
                      {w.brand} store
                    </OutboundLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="diff-heading" className="glass-card p-6">
        <h2 id="diff-heading" className="text-2xl font-bold text-white mb-4">Ledger vs Trezor: the differences that matter</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Ledger</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>Every model has a certified secure element; the firmware running on it is closed source.</li>
              <li>Bluetooth on Nano X, Nano Gen5, Flex and Stax; NFC on Gen5, Flex and Stax. The Nano S Plus is USB only.</li>
              <li>Managed with the Ledger Wallet app (renamed from Ledger Live in October 2025); widest coin support.</li>
              <li>Ledger Recover (2023), an optional paid seed-backup service, showed the firmware can export key shares if you consent.</li>
              <li>A 2020 customer-data leak still fuels phishing; a 2023 dApp library attack affected users of some websites, not the devices.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Trezor</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>Open-source firmware on every model, so independent researchers can audit it.</li>
              <li>The Safe 3, 5 and 7 add a secure element; the Safe 7 adds TROPIC01, an openly auditable secure element.</li>
              <li>Only the Safe 7 has Bluetooth, so it is the only Trezor that signs with an iPhone.</li>
              <li>Managed with Trezor Suite; ETH, SOL and ADA staking are built in. Bitcoin-only firmware is available.</li>
              <li>Older Model One and Model T have no secure element: seeds can be extracted with physical access unless you use a passphrase.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="choose-heading" className="glass-card p-6">
        <h2 id="choose-heading" className="text-2xl font-bold text-white mb-4">Which hardware wallet should you buy?</h2>
        <ul className="space-y-3 text-sm text-gray-300">
          <li><strong className="text-white">Tight budget:</strong> <Link className="underline text-orange-400" to="/compare/wallet/trezor-safe-3">Trezor Safe 3</Link> or <Link className="underline text-orange-400" to="/compare/wallet/ledger-nano-s-plus">Ledger Nano S Plus</Link>.</li>
          <li><strong className="text-white">Open source plus a touchscreen:</strong> <Link className="underline text-orange-400" to="/compare/wallet/trezor-safe-5">Trezor Safe 5</Link>.</li>
          <li><strong className="text-white">You mainly use an iPhone:</strong> <Link className="underline text-orange-400" to="/compare/wallet/ledger-nano-gen5">Ledger Nano Gen5</Link> or <Link className="underline text-orange-400" to="/compare/wallet/trezor-safe-7">Trezor Safe 7</Link> (both have Bluetooth).</li>
          <li><strong className="text-white">Lots of DeFi or NFT signing:</strong> a big screen helps you read what you sign: <Link className="underline text-orange-400" to="/compare/wallet/ledger-flex">Ledger Flex</Link> or <Link className="underline text-orange-400" to="/compare/wallet/ledger-stax">Ledger Stax</Link>.</li>
          <li><strong className="text-white">Bitcoin only:</strong> any Trezor Safe with Bitcoin-only firmware, or a Bitcoin-only device from the list below.</li>
        </ul>
      </section>

      {discontinued.length > 0 && (
        <section aria-labelledby="discontinued-heading" className="glass-card p-6">
          <h2 id="discontinued-heading" className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />
            Discontinued models
          </h2>
          <ul className="space-y-3 text-sm text-gray-300">
            {discontinued.map(w => (
              <li key={w.id}>
                <Link to={`/compare/wallet/${w.id}`} className="font-semibold text-white underline">{w.name}</Link>: {w.status_note}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="others-heading" className="glass-card p-6">
        <h2 id="others-heading" className="text-2xl font-bold text-white mb-2">Other hardware wallets worth knowing</h2>
        <p className="text-sm text-gray-400 mb-4">Not yet in our detailed, dated comparison, so no prices here; check each maker&apos;s site.</p>
        <ul className="grid md:grid-cols-2 gap-4 text-sm">
          {OTHER_BRANDS.map(b => (
            <li key={b.name} className="p-4 rounded-lg bg-white/5">
              <p className="font-semibold text-white mb-1">{b.name}</p>
              <p className="text-gray-300">{b.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="setup-heading" className="glass-card p-6">
        <h2 id="setup-heading" className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-400" aria-hidden="true" />
          How to buy and set up a hardware wallet safely
        </h2>
        <ol className="space-y-2 text-sm text-gray-300 list-decimal pl-5">
          {SETUP_STEPS.map(step => <li key={step}>{step}</li>)}
        </ol>
        <p className="text-sm text-gray-400 mt-4">
          More background: <Link to="/learn/crypto-wallets-explained" className="underline text-orange-400">crypto wallets explained</Link>,{' '}
          <Link to="/compare?tab=wallets" className="underline text-orange-400">all wallets compared</Link> and the{' '}
          <Link to="/scam-database" className="underline text-orange-400">scam database</Link>.
        </p>
      </section>

      <FaqSection faqs={FAQS} />

      <SourcesList sources={sources} date={WALLETS_LAST_VERIFIED} />
    </div>
  );
}
