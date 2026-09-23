/**
 * /influencer-verification: "How to vet a crypto influencer" guide.
 *
 * Editorial checklist only. The previous page showed invented performance
 * scores under real-looking social handles; that data and the paid
 * "transparency" product it advertised have been removed. Every enforcement
 * example below links to its primary source.
 */

import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { FaqSection, LastUpdated, Callout } from '../components/alerts/PageParts';
import type { FaqItem } from '../components/alerts/schema';
import { generateArticleSchema, generateHowToSchema } from '../lib/seo';

const LAST_UPDATED = '2026-09-23';
const PAGE_PATH = '/influencer-verification';
const PAGE_TITLE = 'How to Vet a Crypto Influencer';
const PAGE_DESCRIPTION =
  'A checklist for judging crypto influencers: paid-promotion disclosure rules, SEC anti-touting cases, how to check a track record, and pump-and-dump red flags.';

const STEPS = [
  {
    name: 'Look for a clear paid-promotion disclosure',
    text: 'If the post mentions a token, exchange or product, check whether the creator says they were paid, given tokens, or earn a referral fee. A clear disclosure is in the post or video itself, not hidden behind “more” or in a bio.',
  },
  {
    name: 'Ask what they get if you buy',
    text: 'Referral links, free tokens, paid Telegram or Discord groups and “advisor” roles are all compensation. Assume anyone promoting a small token may hold it and could sell into your buying.',
  },
  {
    name: 'Check the track record, including the misses',
    text: 'Scroll back months, use a web archive for deleted posts, and list every call with its date and price. A handful of highlighted winners tells you nothing without the losers.',
  },
  {
    name: 'Verify claimed profits independently',
    text: 'Screenshots of balances and profit charts are easy to fake or cherry-pick. A public wallet address proves only what that address holds, not that the person controls it or that it is their whole position.',
  },
  {
    name: 'Scan for red flags',
    text: 'Guaranteed returns, countdown urgency, “last chance before listing”, pressure to DM, private groups that charge for signals, and offers to recover lost funds are warning signs.',
  },
  {
    name: 'Check the project, not the personality',
    text: 'Search the token and team in regulator databases and scam lists, read the contract and token distribution, and ask whether you would still buy without the endorsement.',
  },
];

interface EnforcementCase {
  date: string;
  who: string;
  what: string;
  outcome: string;
  source: string;
  sourceLabel: string;
}

/** SEC and DOJ actions, checked against the agencies' own releases on LAST_UPDATED. */
const CASES: EnforcementCase[] = [
  {
    date: 'Nov 29, 2018',
    who: 'Floyd Mayweather Jr. and DJ Khaled',
    what: 'Promoted the Centra Tech ICO on social media without disclosing payments ($100,000 and $50,000 from Centra). The SEC’s first touting cases involving ICOs.',
    outcome: 'Settled: Mayweather paid about $614,775 and Khaled about $152,725 in disgorgement, penalties and interest, plus temporary promotion bans.',
    source: 'https://www.sec.gov/newsroom/press-releases/2018-268',
    sourceLabel: 'SEC press release 2018-268',
  },
  {
    date: 'Oct 3, 2022',
    who: 'Kim Kardashian',
    what: 'Posted about EthereumMax’s EMAX token on Instagram without disclosing she was paid $250,000.',
    outcome: 'Settled for $1.26 million in penalties, disgorgement and interest, and agreed not to promote crypto asset securities for three years.',
    source: 'https://www.sec.gov/newsroom/press-releases/2022-183',
    sourceLabel: 'SEC press release 2022-183',
  },
  {
    date: 'Dec 14, 2022',
    who: 'Eight social media stock promoters (stocks, not crypto)',
    what: 'Allegedly built followings on Twitter and Discord as successful traders, told followers they were buying or holding, then sold into the price rise — about $100 million in alleged profits.',
    outcome: 'Parallel SEC civil and DOJ criminal charges. The same playbook is common with small crypto tokens.',
    source: 'https://www.sec.gov/newsroom/press-releases/2022-221',
    sourceLabel: 'SEC press release 2022-221',
  },
  {
    date: 'Feb 17, 2023',
    who: 'Paul Pierce',
    what: 'Promoted EMAX on Twitter without disclosing he was paid more than $244,000 in tokens, and posted a screenshot showing holdings and profits much larger than his own.',
    outcome: 'Settled for $1.409 million in penalties, disgorgement and interest.',
    source: 'https://www.sec.gov/newsroom/press-releases/2023-34',
    sourceLabel: 'SEC press release 2023-34',
  },
  {
    date: 'Mar 22, 2023',
    who: 'Eight celebrities, including Lindsay Lohan and Jake Paul',
    what: 'Charged with touting Tron (TRX) and/or BitTorrent (BTT) without disclosing that they were paid, in the same action as Justin Sun and his companies.',
    outcome:
      'Six of the eight settled, paying more than $400,000 in total, without admitting or denying the findings. In March 2026 the SEC’s remaining claims against Sun and the Tron and BitTorrent foundations were dismissed, with Rainberry agreeing to a $10 million penalty over wash trading.',
    source: 'https://www.sec.gov/newsroom/press-releases/2023-59',
    sourceLabel: 'SEC press release 2023-59',
  },
  {
    date: 'Oct 9, 2024',
    who: 'Eighteen individuals and entities (DOJ, Boston)',
    what: 'Token founders and “market makers” charged over wash trading that faked volume for about 60 tokens. The FBI created its own token, NexFundAI, to catch the scheme.',
    outcome: 'Several defendants have since pleaded guilty. Fake volume is often what makes an influencer-promoted token look popular.',
    source: 'https://www.justice.gov/usao-ma/pr/eighteen-individuals-and-entities-charged-international-operation-targeting-widespread',
    sourceLabel: 'US Attorney’s Office, District of Massachusetts',
  },
];

const RED_FLAGS = [
  'Promises of guaranteed or “risk-free” returns, or specific price targets presented as certain.',
  'Urgency: “get in before it lists”, countdowns, “only a few spots left”.',
  'A small, newly launched token with most of the supply held by a few wallets.',
  'Coordinated posts from many accounts about the same token on the same day.',
  'Paid signal groups that show only winning trades.',
  'Requests to move the conversation to DMs, Telegram or WhatsApp.',
  'Anyone offering to recover lost crypto for an upfront fee (a common follow-on scam).',
  'Look-alike accounts: check the handle, join date and verification carefully — scammers impersonate well-known creators.',
];

const FAQS: FaqItem[] = [
  {
    question: 'Do crypto influencers have to disclose that they were paid?',
    answer:
      'In the US, the FTC’s Endorsement Guides say a material connection, such as payment, free products or a referral fee, must be disclosed clearly and conspicuously. Separately, Section 17(b) of the Securities Act requires anyone promoting a security to disclose the compensation they received; the SEC has used it against celebrities who promoted crypto tokens it considered securities.',
  },
  {
    question: 'Is “#ad” enough?',
    answer:
      'It can be, if people will actually see and understand it. The FTC’s 2023 update says the disclosure should be hard to miss: in the video itself for video content, and visible without clicking “more” on posts. It also says a platform’s built-in disclosure tool might not be adequate on its own.',
  },
  {
    question: 'How can I check an influencer’s track record?',
    answer:
      'Build your own list: every call they made, with the date, the price at the time and what happened next. Use a web archive to find deleted posts. Count the misses as well as the hits, and compare against simply holding bitcoin over the same period.',
  },
  {
    question: 'Does Bitcoinvestments verify or rate influencers?',
    answer:
      'No. We do not verify or score individual influencers. This page is a checklist you can apply yourself; it is general information, not investment or legal advice.',
  },
  {
    question: 'What is a crypto pump and dump?',
    answer:
      'Promoters buy a thinly traded token, hype it to their followers, and sell into the buying they created. The price then collapses, leaving late buyers with losses. Fake trading volume from wash trading is often used to make the token look popular.',
  },
  {
    question: 'Where can I report a misleading crypto promotion?',
    answer:
      'In the US you can submit a tip to the SEC at sec.gov/tcr, report deceptive advertising to the FTC at ReportFraud.ftc.gov, and report fraud losses to the FBI’s IC3 at ic3.gov. You can also report the account to the platform.',
  },
];

const linkClass = 'text-orange-600 dark:text-orange-400 underline';

export default function InfluencerVerification() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO
        pageKey="influencerVerification"
        urlPath={PAGE_PATH}
        faqs={FAQS}
        customSchema={[
          generateHowToSchema({
            name: PAGE_TITLE,
            description: PAGE_DESCRIPTION,
            steps: STEPS,
          }),
          generateArticleSchema({
            title: PAGE_TITLE,
            description: PAGE_DESCRIPTION,
            publishedDate: LAST_UPDATED,
            modifiedDate: LAST_UPDATED,
            url: PAGE_PATH,
          }),
        ]}
      />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-800 dark:text-gray-200">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="h-8 w-8 text-orange-500" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">How to Vet a Crypto Influencer</h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Before acting on a crypto influencer’s tip, check three things: whether they disclose being paid, whether
            their full track record (losers included) holds up, and whether the pitch shows pump-and-dump red flags.
            US regulators have made celebrities pay up to $1.4 million for promoting tokens without disclosing payment.
          </p>
          <div className="mt-3">
            <LastUpdated date={LAST_UPDATED} />
          </div>
        </header>

        <Callout title="We don’t rate influencers">
          This is a checklist you can apply yourself. We don’t verify, score or endorse individual creators. General
          information only, not investment or legal advice.
        </Callout>

        <section aria-labelledby="checklist-heading" className="mt-10">
          <h2 id="checklist-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">The six-step checklist</h2>
          <ol className="space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.name} className="flex gap-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{s.name}</h3>
                  <p className="mt-1">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="disclosure-heading" className="mt-12 space-y-4">
          <h2 id="disclosure-heading" className="text-2xl font-bold text-gray-900 dark:text-white">Disclosure rules: what the law expects</h2>
          <p>
            <strong>FTC Endorsement Guides (16 CFR Part 255).</strong> If there is a connection between a creator and
            a brand that the audience wouldn’t expect — payment, free products, a referral commission, an ownership
            stake — it must be disclosed clearly and conspicuously. The June 2023 update defines “clear and
            conspicuous”, says video disclosures belong in the video itself, and warns that a platform’s built-in
            “paid partnership” label may not be enough on its own.{' '}
            <a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking" target="_blank" rel="noopener noreferrer" className={linkClass}>
              FTC: Endorsement Guides FAQ <ExternalLink className="inline h-3 w-3" aria-hidden="true" />
            </a>
          </p>
          <p>
            <strong>SEC anti-touting rule (Securities Act Section 17(b)).</strong> Anyone who promotes a security in
            exchange for payment must disclose the nature, source and amount of that payment. The SEC has applied it to
            crypto tokens it considered securities, as the cases below show. Whether a particular token is a security is
            a legal question that has been contested, but the disclosure principle is a good test either way: if they
            won’t say what they were paid, discount what they say.
          </p>
        </section>

        <section aria-labelledby="cases-heading" className="mt-12">
          <h2 id="cases-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Enforcement cases worth knowing</h2>
          <div className="space-y-4">
            {CASES.map((c) => (
              <div key={c.source} className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{c.date}</p>
                <h3 className="font-semibold text-gray-900 dark:text-white">{c.who}</h3>
                <p className="mt-1">{c.what}</p>
                <p className="mt-1 text-gray-700 dark:text-gray-300"><strong>Outcome:</strong> {c.outcome}</p>
                <p className="mt-2 text-sm">
                  Source:{' '}
                  <a href={c.source} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {c.sourceLabel} <ExternalLink className="inline h-3 w-3" aria-hidden="true" />
                  </a>
                  {c.source.endsWith('2023-59') && (
                    <>
                      {' · '}
                      <a href="https://www.sec.gov/enforcement-litigation/litigation-releases/lr-26496" target="_blank" rel="noopener noreferrer" className={linkClass}>
                        LR-26496 <ExternalLink className="inline h-3 w-3" aria-hidden="true" />
                      </a>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            Settled cases were resolved without the defendants admitting or denying the findings. Charges are
            allegations unless a court has ruled.
          </p>
        </section>

        <section aria-labelledby="track-heading" className="mt-12 space-y-4">
          <h2 id="track-heading" className="text-2xl font-bold text-gray-900 dark:text-white">How to check a track record yourself</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Make a call log.</strong> For each recommendation, write down the date, the price then, and the price 30 and 90 days later.</li>
            <li><strong>Include deleted posts.</strong> Search a web archive of their profile; creators often delete calls that went badly.</li>
            <li><strong>Compare with a benchmark.</strong> Would simply holding bitcoin over the same period have done better?</li>
            <li><strong>Distrust screenshots.</strong> Balances and P&amp;L charts can be edited, borrowed or cherry-picked (the SEC found Paul Pierce posted a screenshot showing far larger holdings than his own).</li>
            <li><strong>Treat wallet claims carefully.</strong> A block explorer shows what an address holds, but not who controls it. A signed message from the address is stronger evidence than a screenshot.</li>
            <li><strong>Watch for survivorship bias.</strong> You mostly see creators whose calls happened to work; the many who were wrong stop posting.</li>
          </ul>
        </section>

        <section aria-labelledby="flags-heading" className="mt-12">
          <h2 id="flags-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Red flags</h2>
          <ul className="list-disc pl-6 space-y-2">
            {RED_FLAGS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pump-heading" className="mt-12 space-y-4">
          <h2 id="pump-heading" className="text-2xl font-bold text-gray-900 dark:text-white">How a pump and dump usually unfolds</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Accumulate:</strong> insiders buy a small, thinly traded token cheaply, sometimes before launch.</li>
            <li><strong>Manufacture interest:</strong> fake volume (wash trading) and coordinated posts make it look popular.</li>
            <li><strong>Pump:</strong> paid or affiliated influencers post price targets and urgency to their followers.</li>
            <li><strong>Dump:</strong> insiders sell into the buying they created; the price collapses and late buyers hold the loss.</li>
          </ol>
          <p>
            If you are being told to buy <em>now</em>, ask who is selling to you. Check a token’s holder distribution
            and liquidity before buying, and search our{' '}
            <Link to="/scam-database" className={linkClass}>scam database</Link>.
          </p>
        </section>

        <section aria-labelledby="report-heading" className="mt-12 space-y-2">
          <h2 id="report-heading" className="text-2xl font-bold text-gray-900 dark:text-white">Where to report a misleading promotion (US)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>SEC tips and complaints: <a href="https://www.sec.gov/tcr" target="_blank" rel="noopener noreferrer" className={linkClass}>sec.gov/tcr</a></li>
            <li>FTC (deceptive advertising): <a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener noreferrer" className={linkClass}>ReportFraud.ftc.gov</a></li>
            <li>FBI Internet Crime Complaint Center: <a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer" className={linkClass}>ic3.gov</a></li>
          </ul>
          <p>
            Related: <Link to="/report-scam" className={linkClass}>report a scam</Link>
            {' · '}
            <Link to="/learn/common-crypto-mistakes" className={linkClass}>common crypto mistakes</Link>
            {' · '}
            <Link to="/alert-bundles" className={linkClass}>set your own price alerts</Link>
          </p>
        </section>

        <FaqSection items={FAQS} />
      </article>
    </div>
  );
}
