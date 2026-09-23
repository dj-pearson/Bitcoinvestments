import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Globe, Smartphone, Shield, ExternalLink } from 'lucide-react';
import type { Exchange } from '../../types';
import {
  exchanges,
  estimateBuyCost,
  compareExchanges,
  getDefaultExchangeRival,
} from '../../data/exchanges';
import { SEO, generateBreadcrumbSchema, generateFAQSchema } from '../SEO';
import { ReviewSection } from '../reviews';
import { AffiliateDisclosureBanner, SponsoredBadge, OutboundLink } from '../AffiliateDisclosure';
import { FaqSection, HeadToHeadTable, SourcesList, VerifiedDate, type FaqItem } from './CompareBlocks';
import { exchangeReviewSchema } from './schema';
import { clampDescription, formatIsoDate, formatMonthYear, pct, pickTitle, usd } from './compareUtils';
import { cn } from '../../lib/utils';

const FEATURE_LABELS: Record<keyof Exchange['features'], string> = {
  spot_trading: 'Spot trading',
  margin_trading: 'Margin trading',
  futures_trading: 'Futures',
  staking: 'Staking',
  lending: 'Lend out your crypto',
  debit_card: 'Debit card',
  earn_program: 'Rewards / Earn',
  nft_marketplace: 'NFT marketplace',
  advanced_charts: 'Advanced charts',
  api_access: 'API access',
};

function networkFeeLabel(value: number | undefined, unit: string): string {
  if (value === undefined) return 'Network fee (shown before you confirm)';
  return `${value} ${unit} + network fee`;
}

function fiatFeeLabel(value: number | undefined): string {
  if (value === undefined) return 'Varies by method';
  return value === 0 ? 'Free by bank transfer' : `$${value}`;
}

function buildFaqs(exchange: Exchange): FaqItem[] {
  const c100 = estimateBuyCost(exchange, 100);
  const c1000 = estimateBuyCost(exchange, 1000);
  const safetyCons = exchange.cons.filter(c => /breach|hack|leak|settle|penalt|guilty|sued|froze|Attorney|suspend/i.test(c));
  return [
    {
      question: `Is ${exchange.name} safe?`,
      answer: `${exchange.name} gets ${exchange.trust_score}/10 on our editorial score (regulation ${exchange.editorial.regulation}/3, security ${exchange.editorial.security}/3, transparency ${exchange.editorial.transparency}/2, cost clarity ${exchange.editorial.costs}/2).${safetyCons.length ? ` Worth knowing: ${safetyCons.join('; ')}.` : ''} No exchange is as safe as holding your own keys, so move savings to a hardware wallet.`,
    },
    {
      question: `What are ${exchange.name}'s fees?`,
      answer: `${exchange.fee_notes} In our model a $100 buy costs about ${usd(c100.total)} and a $1,000 buy about ${usd(c1000.total)} (${exchange.buy_cost.label.toLowerCase()}), before withdrawal network fees.`,
    },
    {
      question: `Is ${exchange.name} available in my state or country?`,
      answer: exchange.availability,
    },
    {
      question: `Who is ${exchange.name} best for?`,
      answer: `${exchange.best_for} It is not ideal for: ${exchange.not_for.charAt(0).toLowerCase()}${exchange.not_for.slice(1)}`,
    },
  ];
}

export function ExchangeDetail({ exchange }: { exchange: Exchange }) {
  const defaultRival = getDefaultExchangeRival(exchange);
  const [rivalId, setRivalId] = useState(defaultRival?.id ?? '');
  const comparison = rivalId ? compareExchanges(exchange.id, rivalId) : null;

  const c100 = estimateBuyCost(exchange, 100);
  const c1000 = estimateBuyCost(exchange, 1000);
  const faqs = buildFaqs(exchange);
  const verifiedMonth = formatMonthYear(exchange.last_verified);

  const title = pickTitle([
    `${exchange.name} Review 2026: Fees & Safety`,
    `${exchange.name} Review: Fees & Safety`,
    `${exchange.name} Review 2026`,
    `${exchange.name} Review`,
  ]);
  const description = clampDescription(
    `${exchange.name} review, verified ${verifiedMonth}: ${pct(exchange.fees.taker_fee)} taker fee, a $1,000 buy costs about ${usd(c1000.total)}, editorial score ${exchange.trust_score}/10, pros, cons and who it suits.`
  );

  const schema = [
    exchangeReviewSchema(exchange),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Compare', url: '/compare' },
      { name: 'Exchanges', url: '/compare?tab=exchanges' },
      { name: exchange.name, url: `/compare/exchange/${exchange.id}` },
    ]),
    generateFAQSchema(faqs),
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <SEO
        title={title}
        description={description}
        keywords={[exchange.name, `${exchange.name} review`, `${exchange.name} fees`, `is ${exchange.name} safe`, 'crypto exchange comparison']}
        modifiedTime={exchange.last_verified}
        schema={schema}
      />

      <Link to="/compare?tab=exchanges" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        All exchanges
      </Link>

      <header className="glass-card p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{exchange.name} Review ({verifiedMonth})</h1>
              {exchange.sponsored?.is_sponsored && <SponsoredBadge />}
            </div>
            <p className="text-gray-200 mb-3">
              <strong>Verdict:</strong> {exchange.best_for} Not ideal for {exchange.not_for.charAt(0).toLowerCase()}{exchange.not_for.slice(1)}
            </p>
            <p className="text-gray-400 mb-4">{exchange.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-2"><Globe className="w-4 h-4" aria-hidden="true" />HQ: {exchange.country}</span>
              <span>Est. {exchange.year_established}</span>
              {exchange.mobile_app && (
                <span className="flex items-center gap-2"><Smartphone className="w-4 h-4" aria-hidden="true" />Mobile app</span>
              )}
              <VerifiedDate date={exchange.last_verified} />
            </div>
          </div>
          <OutboundLink
            partnerId={exchange.affiliate_partner_id}
            officialUrl={exchange.url}
            name={exchange.name}
            type="exchange"
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-center"
          >
            Visit {exchange.name}
          </OutboundLink>
        </div>
      </header>

      {exchange.sponsored?.is_sponsored && (
        <p className="text-sm text-purple-200 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <strong>Sponsored:</strong> {exchange.name} has a paid placement on this site. It does not change the
          editorial score, the facts on this page, or where it appears when you sort the comparison.
        </p>
      )}

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 text-center flex flex-col-reverse">
          <dt className="text-sm text-gray-400 mt-1">
            <Link to="/compare#methodology-heading" className="underline hover:text-white">Our editorial score</Link>
          </dt>
          <dd className="flex items-center justify-center gap-2 text-3xl font-bold text-white">
            <Shield className="w-6 h-6 text-green-400" aria-hidden="true" />{exchange.trust_score}<span className="text-base text-gray-400">/10</span>
          </dd>
        </div>
        <div className="glass-card p-6 text-center flex flex-col-reverse">
          <dt className="text-sm text-gray-400 mt-1">Taker fee (entry tier)</dt>
          <dd className="text-3xl font-bold text-white">{pct(exchange.fees.taker_fee)}</dd>
        </div>
        <div className="glass-card p-6 text-center flex flex-col-reverse">
          <dt className="text-sm text-gray-400 mt-1">Cost of a $1,000 buy</dt>
          <dd className="text-3xl font-bold text-white">{usd(c1000.total)}</dd>
        </div>
        <div className="glass-card p-6 text-center flex flex-col-reverse">
          <dt className="text-sm text-gray-400 mt-1">Assets</dt>
          <dd className="text-lg font-bold text-white">{exchange.assets_label}</dd>
        </div>
      </dl>

      <AffiliateDisclosureBanner variant="compact" />

      <section aria-labelledby="fees-heading" className="glass-card p-6">
        <h2 id="fees-heading" className="text-2xl font-bold text-white mb-2">{exchange.name} fees</h2>
        <p className="text-sm text-gray-300 mb-4">{exchange.fee_notes}</p>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div><dt className="text-xs text-gray-400">Maker fee</dt><dd className="text-lg font-bold text-white">{pct(exchange.fees.maker_fee)}</dd></div>
          <div><dt className="text-xs text-gray-400">Taker fee</dt><dd className="text-lg font-bold text-white">{pct(exchange.fees.taker_fee)}</dd></div>
          <div><dt className="text-xs text-gray-400">USD deposit</dt><dd className="text-sm font-semibold text-white">{fiatFeeLabel(exchange.fees.deposit_fee_fiat)}</dd></div>
          <div><dt className="text-xs text-gray-400">BTC withdrawal</dt><dd className="text-sm font-semibold text-white">{networkFeeLabel(exchange.fees.withdrawal_fee_btc, 'BTC')}</dd></div>
          <div><dt className="text-xs text-gray-400">ETH withdrawal</dt><dd className="text-sm font-semibold text-white">{networkFeeLabel(exchange.fees.withdrawal_fee_eth, 'ETH')}</dd></div>
          <div><dt className="text-xs text-gray-400">USD withdrawal</dt><dd className="text-sm font-semibold text-white">{fiatFeeLabel(exchange.fees.withdrawal_fee_fiat)}</dd></div>
        </dl>
        <a
          href={exchange.fees_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 underline"
        >
          Official {exchange.name} fee page <ExternalLink className="w-3 h-3" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </section>

      <section aria-labelledby="cost-heading" className="glass-card p-6">
        <h2 id="cost-heading" className="text-2xl font-bold text-white mb-2">What a $100 and $1,000 buy cost on {exchange.name}</h2>
        <p className="text-sm text-gray-300 mb-4">{exchange.buy_cost.label}. {exchange.buy_cost.note}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Worked cost examples for {exchange.name}</caption>
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th scope="col" className="py-2 pr-4 font-medium">Buy</th>
                <th scope="col" className="py-2 pr-4 font-medium">Fee</th>
                <th scope="col" className="py-2 pr-4 font-medium">Spread</th>
                <th scope="col" className="py-2 pr-4 font-medium">Flat fee</th>
                <th scope="col" className="py-2 font-medium">Total cost</th>
              </tr>
            </thead>
            <tbody>
              {[{ amount: 100, c: c100 }, { amount: 1000, c: c1000 }].map(({ amount, c }) => (
                <tr key={amount} className="border-b border-white/5">
                  <th scope="row" className="py-2 pr-4 text-white">${amount.toLocaleString('en-US')}</th>
                  <td className="py-2 pr-4 text-gray-300">{usd(c.fee)}</td>
                  <td className="py-2 pr-4 text-gray-300">{usd(c.spread)}</td>
                  <td className="py-2 pr-4 text-gray-300">{usd(c.flat)}</td>
                  <td className="py-2 text-white font-semibold">{usd(c.total)} ({pct(c.pct)})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Excludes withdrawal network fees. See how every exchange compares in the{' '}
          <Link to="/compare?sort=cost1000" className="underline hover:text-white">cost comparison</Link>.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <section aria-labelledby="proscons-heading" className="glass-card p-6">
          <h2 id="proscons-heading" className="text-2xl font-bold text-white mb-4">Pros and cons</h2>
          <h3 className="text-sm font-medium text-green-400 mb-2">Pros</h3>
          <ul className="space-y-2 mb-4">
            {exchange.pros.map(pro => (
              <li key={pro} className="flex items-start gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />{pro}
              </li>
            ))}
          </ul>
          <h3 className="text-sm font-medium text-red-400 mb-2">Cons</h3>
          <ul className="space-y-2">
            {exchange.cons.map(con => (
              <li key={con} className="flex items-start gap-2 text-sm text-gray-300">
                <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />{con}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="features-heading" className="glass-card p-6">
          <h2 id="features-heading" className="text-2xl font-bold text-white mb-4">Features and availability</h2>
          <ul className="grid grid-cols-2 gap-3 mb-4">
            {(Object.keys(FEATURE_LABELS) as (keyof Exchange['features'])[]).map(key => {
              const value = exchange.features[key];
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
          <p className="text-sm text-gray-300"><span className="text-gray-400">Availability: </span>{exchange.availability}</p>
          <p className="text-sm text-gray-300 mt-2"><span className="text-gray-400">Fiat currencies: </span>{exchange.supported_fiat.join(', ')}</p>
        </section>
      </div>

      <section aria-labelledby="score-heading" className="glass-card p-6">
        <h2 id="score-heading" className="text-2xl font-bold text-white mb-2">Our editorial score: {exchange.trust_score}/10</h2>
        <p className="text-sm text-gray-400 mb-4">
          An editorial judgement against our{' '}
          <Link to="/compare" className="underline hover:text-white">published methodology</Link>, not a user rating.
          Sponsorship does not affect it.
        </p>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><dt className="text-gray-400">Regulation</dt><dd className="text-white font-semibold">{exchange.editorial.regulation}/3</dd></div>
          <div><dt className="text-gray-400">Security record</dt><dd className="text-white font-semibold">{exchange.editorial.security}/3</dd></div>
          <div><dt className="text-gray-400">Transparency</dt><dd className="text-white font-semibold">{exchange.editorial.transparency}/2</dd></div>
          <div><dt className="text-gray-400">Cost clarity</dt><dd className="text-white font-semibold">{exchange.editorial.costs}/2</dd></div>
        </dl>
      </section>

      <section aria-labelledby="h2h-heading" className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <h2 id="h2h-heading" className="text-2xl font-bold text-white">
            {exchange.name} vs {comparison?.exchange2.name ?? '…'}
          </h2>
          <label className="flex flex-col text-sm text-gray-400 gap-1">
            Compare with
            <select
              value={rivalId}
              onChange={e => setRivalId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              {exchanges.filter(e => e.id !== exchange.id).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </label>
        </div>
        {comparison && (
          <HeadToHeadTable
            names={[comparison.exchange1.name, comparison.exchange2.name]}
            rows={comparison.rows}
            caption={`${comparison.exchange1.name} compared with ${comparison.exchange2.name}`}
          />
        )}
        {comparison && (
          <p className="text-xs text-gray-400 mt-3">
            Shaded rows differ. Read the full{' '}
            <Link to={`/compare/exchange/${comparison.exchange2.id}`} className="underline hover:text-white">
              {comparison.exchange2.name} review
            </Link>.
          </p>
        )}
      </section>

      <FaqSection faqs={faqs} title={`${exchange.name} FAQ`} />

      <SourcesList sources={exchange.sources} date={exchange.last_verified} />

      <section aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className={cn('text-2xl font-bold text-white mb-4')}>Reader reviews</h2>
        <ReviewSection platformType="exchange" platformId={exchange.id} platformName={exchange.name} />
      </section>

      <p className="text-xs text-gray-500">
        Information only, not financial advice. Facts checked {formatIsoDate(exchange.last_verified)}.
      </p>
    </div>
  );
}
