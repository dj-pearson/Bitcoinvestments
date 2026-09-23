import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Lock, AlertTriangle } from 'lucide-react';
import type { Wallet } from '../../types';
import { wallets, compareWallets, getDefaultWalletRival } from '../../data/wallets';
import { SEO, generateBreadcrumbSchema, generateFAQSchema } from '../SEO';
import { ReviewSection } from '../reviews';
import { AffiliateDisclosureBanner, OutboundLink } from '../AffiliateDisclosure';
import { FaqSection, HeadToHeadTable, SourcesList, VerifiedDate, type FaqItem } from './CompareBlocks';
import { walletSchema } from './schema';
import { clampDescription, formatIsoDate, formatMonthYear, pickTitle } from './compareUtils';
import { cn } from '../../lib/utils';

const SECURITY_LABELS: Record<keyof Wallet['security_features'], string> = {
  seed_phrase_backup: 'Recovery phrase backup',
  pin_protection: 'PIN protection',
  passphrase_support: 'Passphrase (25th word)',
  secure_element: 'Secure element chip',
  open_source: 'Open-source code',
  multi_sig: 'Multisig support',
  biometric_auth: 'Biometric unlock',
  two_factor_auth: 'Two-factor authentication',
};

const FEATURE_LABELS: Record<keyof Wallet['features'], string> = {
  built_in_exchange: 'Built-in swap / buy',
  staking: 'Staking',
  nft_support: 'NFTs',
  defi_access: 'DeFi / dApps',
  browser_extension: 'Browser extension',
  mobile_app: 'Mobile app',
  desktop_app: 'Desktop app',
  hardware_wallet_support: 'Hardware wallet signing',
};

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function buildFaqs(wallet: Wallet): FaqItem[] {
  const protections = [
    wallet.security_features.secure_element ? 'a secure element chip' : null,
    wallet.security_features.pin_protection ? 'PIN protection' : null,
    wallet.security_features.passphrase_support ? 'optional passphrase support' : null,
    wallet.security_features.seed_phrase_backup ? 'a recovery-phrase backup' : null,
  ].filter((p): p is string => Boolean(p));
  const incidents = wallet.incidents?.length
    ? ` ${wallet.brand} has had ${wallet.incidents.length} company-level incident${wallet.incidents.length === 1 ? '' : 's'} affecting customers (listed on this page); none let attackers take keys from the devices themselves.`
    : '';
  const faqs: FaqItem[] = [
    {
      question: `Is ${wallet.name} safe?`,
      answer: `${wallet.name} is a ${wallet.type} wallet with ${joinList(protections) || 'standard protections'}. Its code is ${wallet.security_features.open_source ? 'open source, so outside researchers can audit it' : 'not fully open source, so you rely more on the company'}.${incidents} ${wallet.type === 'hardware' ? 'Buy only from the manufacturer or an authorised reseller and never use a device that arrives with a recovery phrase already set.' : 'As a hot wallet it is best for spending money; keep savings on a hardware wallet.'}`,
    },
    {
      question: `How much does ${wallet.name} cost?`,
      answer: wallet.price
        ? `${wallet.status === 'discontinued' ? 'Its last list price was' : 'The list price is'} $${wallet.price} (USD), a one-time purchase with no subscription.${wallet.price_note ? ` ${wallet.price_note}` : ''}`
        : `${wallet.name} is free to download. Swaps and purchases inside the app include provider fees or spreads, and network fees apply to every transaction.`,
    },
    {
      question: `Which coins does ${wallet.name} support?`,
      answer: `${wallet.assets_label}, including networks such as ${joinList(wallet.supported_chains.slice(0, 5))}. Check the official supported-assets list before sending a coin.`,
    },
  ];
  if (wallet.status === 'discontinued' && wallet.status_note) {
    faqs.push({ question: `Is ${wallet.name} discontinued?`, answer: wallet.status_note });
  }
  return faqs;
}

export function WalletDetail({ wallet }: { wallet: Wallet }) {
  const defaultRival = getDefaultWalletRival(wallet);
  const [rivalId, setRivalId] = useState(defaultRival?.id ?? '');
  const comparison = rivalId ? compareWallets(wallet.id, rivalId) : null;
  const faqs = buildFaqs(wallet);
  const verifiedMonth = formatMonthYear(wallet.last_verified);
  const isHardware = wallet.type === 'hardware';

  const title = pickTitle(
    isHardware
      ? [`${wallet.name} Review 2026: Price & Security`, `${wallet.name} Review: Price & Security`, `${wallet.name} Review 2026`, `${wallet.name} Review`]
      : [`${wallet.name} Review 2026: Safety & Features`, `${wallet.name} Review: Safety & Features`, `${wallet.name} Review 2026`, `${wallet.name} Review`]
  );
  const description = clampDescription(
    isHardware
      ? `${wallet.name} review, checked ${verifiedMonth}: $${wallet.price} list price, ${wallet.hardware?.connectivity.join('/')}, ${wallet.security_features.open_source ? 'open-source firmware' : 'closed-source firmware'}, ${wallet.security_features.secure_element ? 'secure element' : 'no secure element'}, pros, cons and incidents.`
      : `${wallet.name} review, checked ${verifiedMonth}: free ${wallet.type} wallet for ${joinList(wallet.supported_chains.slice(0, 3))}. Security, features, pros and cons, and how it compares.`
  );

  const schema = [
    walletSchema(wallet),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Compare', url: '/compare' },
      { name: 'Wallets', url: '/compare?tab=wallets' },
      { name: wallet.name, url: `/compare/wallet/${wallet.id}` },
    ]),
    generateFAQSchema(faqs),
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <SEO
        title={title}
        description={description}
        keywords={[wallet.name, `${wallet.name} review`, `is ${wallet.name} safe`, `${wallet.type} wallet`, 'crypto wallet comparison']}
        modifiedTime={wallet.last_verified}
        schema={schema}
      />

      <Link to="/compare?tab=wallets" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        All wallets
      </Link>

      <header className="glass-card p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={cn(
                'px-3 py-1 rounded text-sm font-medium',
                isHardware ? 'bg-orange-500/20 text-orange-300' : wallet.type === 'software' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
              )}>
                {wallet.type.toUpperCase()} WALLET
              </span>
              {wallet.status === 'discontinued' && (
                <span className="px-3 py-1 rounded text-sm font-medium bg-red-500/20 text-red-300">DISCONTINUED</span>
              )}
              {wallet.price ? (
                <span className="text-xl font-bold text-orange-400">
                  ${wallet.price} <span className="text-xs font-normal text-gray-400">{wallet.status === 'discontinued' ? 'last list price' : 'list price'}</span>
                </span>
              ) : (
                <span className="text-lg text-green-400 font-medium">Free</span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{wallet.name} Review ({verifiedMonth})</h1>
            <p className="text-gray-200 mb-3"><strong>Verdict:</strong> {wallet.best_for}</p>
            <p className="text-gray-400 mb-3">{wallet.description}</p>
            {wallet.price_note && <p className="text-xs text-gray-400 mb-3">{wallet.price_note}</p>}
            <VerifiedDate date={wallet.last_verified} />
          </div>
          <OutboundLink
            partnerId={wallet.affiliate_partner_id}
            officialUrl={wallet.url}
            name={wallet.name}
            type="wallet"
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-center"
          >
            {isHardware ? `${wallet.brand} official store` : `Get ${wallet.name}`}
          </OutboundLink>
        </div>
      </header>

      {wallet.status === 'discontinued' && wallet.status_note && (
        <div role="note" className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-100 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <p>{wallet.status_note}</p>
        </div>
      )}

      <AffiliateDisclosureBanner variant="compact" />

      {wallet.hardware && (
        <section aria-labelledby="specs-heading" className="glass-card p-6">
          <h2 id="specs-heading" className="text-2xl font-bold text-white mb-4">{wallet.name} specs</h2>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-400">Screen</dt><dd className="text-white">{wallet.hardware.screen}</dd></div>
            <div><dt className="text-gray-400">Connectivity</dt><dd className="text-white">{wallet.hardware.connectivity.join(', ')}</dd></div>
            <div><dt className="text-gray-400">Secure element</dt><dd className="text-white">{wallet.hardware.secure_element}</dd></div>
            <div><dt className="text-gray-400">Firmware</dt><dd className="text-white">{wallet.hardware.open_source_firmware ? 'Open source' : 'Closed source (secure-element apps)'}</dd></div>
            <div><dt className="text-gray-400">Bitcoin-only firmware</dt><dd className="text-white">{wallet.hardware.bitcoin_only_edition ? 'Available' : 'Not offered'}</dd></div>
            <div><dt className="text-gray-400">Backup options</dt><dd className="text-white">{wallet.hardware.backup_options}</dd></div>
            <div><dt className="text-gray-400">Released</dt><dd className="text-white">{formatIsoDate(wallet.hardware.released)}</dd></div>
            <div><dt className="text-gray-400">Assets</dt><dd className="text-white">{wallet.assets_label}</dd></div>
          </dl>
          <p className="text-xs text-gray-400 mt-4">
            See every current model side by side in our{' '}
            <Link to="/hardware-wallet" className="underline hover:text-white">hardware wallet comparison</Link>.
          </p>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <section aria-labelledby="security-heading" className="glass-card p-6">
          <h2 id="security-heading" className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-400" aria-hidden="true" />
            Security
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {(Object.keys(SECURITY_LABELS) as (keyof Wallet['security_features'])[]).map(key => {
              const value = wallet.security_features[key];
              return (
                <li key={key} className="flex items-center gap-2 text-sm">
                  {value ? <Check className="w-4 h-4 text-green-400" aria-hidden="true" /> : <X className="w-4 h-4 text-red-400" aria-hidden="true" />}
                  <span className={value ? 'text-gray-300' : 'text-gray-500'}>
                    {SECURITY_LABELS[key]}<span className="sr-only">: {value ? 'yes' : 'no'}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="features-heading" className="glass-card p-6">
          <h2 id="features-heading" className="text-2xl font-bold text-white mb-4">Features</h2>
          <ul className="grid grid-cols-2 gap-3">
            {(Object.keys(FEATURE_LABELS) as (keyof Wallet['features'])[]).map(key => {
              const value = wallet.features[key];
              return (
                <li key={key} className="flex items-center gap-2 text-sm">
                  {value ? <Check className="w-4 h-4 text-green-400" aria-hidden="true" /> : <X className="w-4 h-4 text-red-400" aria-hidden="true" />}
                  <span className={value ? 'text-gray-300' : 'text-gray-500'}>
                    {FEATURE_LABELS[key]}<span className="sr-only">: {value ? 'yes' : 'no'}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-gray-300 mt-4">
            <span className="text-gray-400">Networks: </span>{wallet.supported_chains.join(', ')}
          </p>
          <p className="text-sm text-gray-300 mt-2">
            <span className="text-gray-400">Ease of use (editorial): </span>{wallet.ease_of_use}/10
          </p>
        </section>
      </div>

      <section aria-labelledby="proscons-heading" className="glass-card p-6">
        <h2 id="proscons-heading" className="text-2xl font-bold text-white mb-4">Pros and cons</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-green-400 mb-3">Pros</h3>
            <ul className="space-y-2">
              {wallet.pros.map(pro => (
                <li key={pro} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />{pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-400 mb-3">Cons</h3>
            <ul className="space-y-2">
              {wallet.cons.map(con => (
                <li key={con} className="flex items-start gap-2 text-sm text-gray-300">
                  <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />{con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {wallet.incidents && wallet.incidents.length > 0 && (
        <section aria-labelledby="incidents-heading" className="glass-card p-6">
          <h2 id="incidents-heading" className="text-2xl font-bold text-white mb-2">Security incidents ({wallet.brand})</h2>
          <p className="text-sm text-gray-400 mb-4">Company-level events that affected customers of this brand, newest first.</p>
          <ol className="space-y-3">
            {[...wallet.incidents].reverse().map(incident => (
              <li key={incident.date + incident.summary.slice(0, 20)} className="text-sm text-gray-300">
                <time dateTime={incident.date} className="font-semibold text-white">{formatIsoDate(incident.date)}: </time>
                {incident.summary}
                {incident.url && (
                  <>
                    {' '}
                    <a href={incident.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">
                      Source<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="h2h-heading" className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <h2 id="h2h-heading" className="text-2xl font-bold text-white">
            {wallet.name} vs {comparison?.wallet2.name ?? '…'}
          </h2>
          <label className="flex flex-col text-sm text-gray-400 gap-1">
            Compare with
            <select
              value={rivalId}
              onChange={e => setRivalId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              {wallets.filter(w => w.id !== wallet.id).map(w => (
                <option key={w.id} value={w.id}>{w.name}{w.status === 'discontinued' ? ' (discontinued)' : ''}</option>
              ))}
            </select>
          </label>
        </div>
        {comparison && (
          <>
            <HeadToHeadTable
              names={[comparison.wallet1.name, comparison.wallet2.name]}
              rows={comparison.rows}
              caption={`${comparison.wallet1.name} compared with ${comparison.wallet2.name}`}
            />
            <p className="text-xs text-gray-400 mt-3">
              Shaded rows differ. Read the full{' '}
              <Link to={`/compare/wallet/${comparison.wallet2.id}`} className="underline hover:text-white">
                {comparison.wallet2.name} review
              </Link>.
            </p>
          </>
        )}
      </section>

      <FaqSection faqs={faqs} title={`${wallet.name} FAQ`} />

      <SourcesList sources={wallet.sources} date={wallet.last_verified} />

      <section aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-2xl font-bold text-white mb-4">Reader reviews</h2>
        <ReviewSection platformType="wallet" platformId={wallet.id} platformName={wallet.name} />
      </section>

      <p className="text-xs text-gray-500">
        Information only, not financial advice. Facts checked {formatIsoDate(wallet.last_verified)}.{' '}
        New to self-custody? Read{' '}
        <Link to="/learn/crypto-wallets-explained" className="underline hover:text-white">crypto wallets explained</Link>.
      </p>
    </div>
  );
}
