# Review 10: Analytics / trading pages

Scope: `/social-trading`, `/onchain-analytics`, `/whale-tracking`, `/trading-indicators`, `/multi-exchange`. Read-only review, based on the code.

## Cross-cutting findings (apply to all 5 routes)

- **All 5 routes are indexable, promoted, and behind no guard.**
  - `src/App.tsx:225-226,235-238`: none of them is wrapped in `staticGuard`.
  - None is in `NOINDEX_PATHS` (`src/lib/index-pruning.ts:30-52`).
  - All 5 are in `public/sitemap.xml:109,116,131,145,160`, with `changefreq daily/weekly` and lastmod `2026-02-08`.
  - They sit in the main nav: `src/components/Layout/Header.tsx:87,95,103-110`.
  - 3 are in `public/llms.txt:43-46`, and several are in the related-link lists in `src/lib/seo.ts:1449-1520` and `src/components/InternalLinks.tsx:249`.
- **"Premium" paths can never be reached on the static site.** Every premium check reads `profile.subscription_status` (`src/services/subscriptionLimits.ts:1203-1211`), and login/signup are `staticGuard`'d. The upsells ("Subscribe Now", "Start Pro Trial", "Upgrade Now") promise products nobody can buy. They link to `/pricing` or have no handler at all.
- **Only one of the 5 pages uses real data** (`/trading-indicators`, from CoinGecko). The other 4 show hard-coded or `Math.random()` data with no "demo" label. This is the main YMYL and trust problem.
- **None of the services these pages call talks to Supabase:**
  - `socialTrading.ts` and `onchainAnalytics.ts` import `db` and have full CRUD, but the pages never call those functions.
  - `whaleTracking.ts` and `multiExchange.ts` are 100% mock and have no DB code.
- **The `ComingSoon` page (`src/pages/ComingSoon.tsx:5-6`) has no `SEO`/noindex.** Wrapping a route in `staticGuard` alone leaves a thin "Coming Soon" page indexable. Any route gated this way must also be added to `NOINDEX_PATHS`.
- **Dead duplicate code:**
  - `src/components/TechnicalIndicators.tsx` (which uses `services/technicalIndicators.ts`) and `src/components/ExchangeConnections.tsx` (which uses `services/exchangeConnections.ts`) are not imported anywhere.
  - `technicalIndicators.ts` and `tradingIndicators.ts` are two parallel indicator libraries. The one without length guards is the one in use.
- **Loading spinners hide the SEO.** `/whale-tracking`, `/trading-indicators` and `/multi-exchange` return a full-screen spinner before `<PageSEO>` renders (`WhaleTracking.tsx:92-98`, `TradingIndicators.tsx:179-185`, `MultiExchange.tsx:114-120`). While loading, the previous route's title/meta/canonical stay in place, and prerender snapshots may capture only a spinner.
- **No GEO basics on any of the 5 pages:** no BLUF summary, no visible "last updated" date, no author/E-E-A-T, no visible FAQ. The site also has no guide on technical analysis, on-chain metrics, whales or copy trading (`src/data/guides/`). That is a real content gap these pages could fill.

---

### /social-trading — src/pages/SocialTrading.tsx (+ src/services/socialTrading.ts)
- **Purpose / target query:** "copy trading crypto", "social trading". The page presents itself as a live marketplace where you copy traders for $9.99–$19.99/mo.
- **Verdict:** Poor. The whole page is made up. It shows fake traders, fake returns, fake "verified" badges and fake platform stats as if they were real. This is the most serious page in this scope.
- **Up-to-date issues:**
  - Hard-coded platform stats: "1,250+ Published Portfolios", "$2.5M+ Assets Under Copy", "8,500+ Active Copiers", "145% Avg Top 10 Return" (`SocialTrading.tsx:72-89`). No product exists, so these numbers describe nothing.
  - No dates anywhere, so returns labelled "All-time return" have no period (`:237`).
- **SEO issues:**
  - Title "Social Trading - Copy Top Crypto Traders | Bitcoinvestments" is 58 chars, which is fine.
  - The description promises "replicate winning trading strategies automatically" (`src/lib/seo.ts:375-378`). That is false, and it is a performance-promise claim.
  - Only a WebPage schema is emitted. There is no BreadcrumbList.
  - Indexed, in the sitemap (`public/sitemap.xml:145`) and in the nav (`Header.tsx:110`).
- **GEO issues:** No definitions, no risk explanation, no sources or dates. The only prose is "How Copy Trading Works" (`:91-117`), and it describes this site's non-existent product.
- **Static + DB:**
  - The page renders `DEMO_PUBLISHED_PORTFOLIOS` directly (`SocialTrading.tsx:15`; `socialTrading.ts:590-681`).
  - None of the Supabase functions (`getPublishedPortfolios`, `followPortfolio`, `subscribeToCopyPortfolio`… at `socialTrading.ts:42-583`) is called anywhere in the app. The only importer is this page.
  - The Following / My Portfolios tabs only change the tab styling (`:12,119-153`). The grid always shows the same demo list.
  - These buttons have no handlers: "Publish My Portfolio", "Learn More", "Follow" and "Subscribe & Copy" (`:283-288,376-383`).
  - The modal shows "[Performance Chart Placeholder]" and "[Pie Chart Placeholder]" (`:357,363`).
- **Trust / legal:**
  - Invented traders are shown with returns of +145.5%, +285.2% and +450.8%, win rates, Sharpe ratios and "verified" checkmarks (`socialTrading.ts:597-676`; `SocialTrading.tsx:219-223`).
  - They sit next to prices and "When they trade, you trade" (`:113`).
  - Fabricated performance and user-count claims used to sell a subscription are a likely FTC Act §5 deceptive-advertising problem.
  - Paid copy-trading of allocations may also count as investment-adviser or signal activity that needs registration. **NEEDS-OWNER** (legal review).
- **Uniqueness / content gaps:** As a tool it adds nothing. As content, a sober explainer would be useful and is missing from the site. It could cover what copy trading is, where it really exists (exchange-native copy trading), fees, survivorship bias, drawdown risk, regulatory status by region, and a checklist for judging a trader's track record.
- **Bugs:**
  - Drawdown renders as "--25.3%". The data stores negative values (`max_drawdown_percent: -25.3`, `socialTrading.ts:605`) and the UI adds another minus (`SocialTrading.tsx:253,348`).
  - Returns are always prefixed "+" (`:235,335`), so a negative return would show as "+-x%".
  - The creator share of 20% vs platform 80% (`socialTrading.ts:27-29`) contradicts the "earn" marketing tone. It is not a bug, but worth noting.
  - `hover:bg-gray-750` is not a Tailwind class (`:209`), so there is no hover state.
  - Cards are clickable `<div>`s with no keyboard or role support (`:206-210`).
  - The modal has no `role="dialog"`, no Escape handling, no focus trap, and the close "×" has no `aria-label` (`:296-326`).
- **Recommendation: (c) now, then (b).**
- **Recommended fixes:**
  - **P0:** Stop showing fake traders and stats today.
    - Wrap the route in `staticGuard` in `src/App.tsx:225`.
    - Add `/social-trading` to `NOINDEX_PATHS` in `src/lib/index-pruning.ts`.
    - Remove it from `public/sitemap.xml:144-149` and `Header.tsx:110`.
    - Delete `DEMO_PUBLISHED_PORTFOLIOS` / `getDemoLeaderboard` (`socialTrading.ts:586-694`) and the hard-coded hero stats (`SocialTrading.tsx:71-89`).
  - **P1:** Replace the page with an educational "Copy Trading Explained: How It Works, Real Risks, Costs" page. Give it a BLUF, a risks section, a "how to vet a trader" checklist, a FAQ (visible, plus FAQPage schema), Article schema and a visible "Last updated". Link to `/learn/risk-management` and `/compare`, then re-index it. Any named platforms, fees or regional availability are **NEEDS-OWNER** (must be verified and current).
  - **P2:** Build the real product only when auth and DB are live and legal has signed off. At that point, read from `getPublishedPortfolios` with loading, empty and error states, and never mix in demo rows.

### /onchain-analytics — src/pages/OnChainAnalytics.tsx (+ src/services/onchainAnalytics.ts)
- **Purpose / target query:** "bitcoin on-chain analytics", "active addresses", "MVRV", "exchange netflow".
- **Verdict:** Poor. Every number is `Math.random()` noise, presented as data "aggregated from industry-leading providers".
- **Up-to-date issues:**
  - The base values in `generateDemoMetrics` (`onchainAnalytics.ts:596-619`) are static, era-less guesses: difficulty 65T, hash rate "450M" with no unit, stablecoin supply $130B, DeFi TVL $85B. They look stale, and they are the same for every asset.
  - The table dates are `new Date()` minus N days, so the made-up series always looks current.
- **SEO issues:**
  - Title "On-Chain Analytics - Blockchain Data Analysis | Bitcoinvestments" is 63 chars, which is over 60 (`seo.ts:255-257`).
  - The description promises "holder distribution, and smart contract interactions". Neither exists.
  - Only a WebPage schema is emitted. There is no Dataset/WebApplication schema, and a Dataset schema would be wrong anyway while the data is random.
  - The `llms.txt:46` entry tells LLMs this is a real data tool.
- **GEO issues:** None of the 22 metrics is explained. A definition (e.g. "MVRV = market cap / realized cap; >3.5 historically near tops") is exactly what LLMs quote, and there are none.
- **Static + DB:**
  - The page calls only `generateDemoMetrics` (`OnChainAnalytics.tsx:19,143`).
  - The Supabase functions `getMetrics`, `getLatestMetric` and `getOnChainDashboardData` (`onchainAnalytics.ts:183-580`) are never used.
  - Every value is random (`onchainAnalytics.ts:625,637-639`), including the 24h, 7d and 30d change figures, which are not derived from the series.
  - `data_source: 'demo'` is set (`:641`) but never displayed.
  - The "Data Sources: Glassnode, Santiment, IntoTheBlock, CryptoQuant, Blockchain.com" block (`OnChainAnalytics.tsx:327-340`) is a false attribution to real companies.
  - The Pro tier at $29.99/mo (`:94`), the "Upgrade Now" button (no handler, `:95`) and the "PRO FEATURE" cards cannot be bought.
- **Uniqueness / content gaps:** Real, free, keyless public sources exist (all CORS-enabled):
  - mempool.space API: hashrate, difficulty, difficulty adjustment ETA, fee rates, block data.
  - blockchain.info charts API with `cors=true`: unique addresses, transaction count.
  - Coin Metrics Community API: `AdrActCnt`, `TxCnt`, `CapMVRVCur` for BTC/ETH.
  - DefiLlama: stablecoin supply, DeFi TVL.

  A small real dashboard, where each metric has a plain-English definition, a "what it's historically signalled" note and a source link, would be unusual and useful for a beginner audience.
- **Bugs:**
  - "Latest" is actually the oldest point. The generator pushes oldest→newest (`onchainAnalytics.ts:622-644`), but the page treats `metrics[0]` as latest (`OnChainAnalytics.tsx:69`) and the table shows `metrics.slice(0,10)`, the 10 oldest days (`:266`).
  - The timeframe buttons (`:122-135`) only change a label. The page always generates 30 days (`:19`).
  - The summary cards call `generateDemoMetrics` during render (`:143`), so the numbers change on every re-render, for example when a timeframe button is clicked.
  - BTC/ETH/SOL/DOGE all get identical base values, and `chain: 'bitcoin'` is hard-coded (`onchainAnalytics.ts:634`).
  - The metric count is wrong: `Object.keys(FREE_METRICS).length + 15` gives "18+", but 22 metrics are defined (`:90`).
  - The chart area is a placeholder: "Chart visualization would appear here" (`:244`).
  - Emoji icons have no text alternative (`:294,305,316`).
- **Recommendation: (a) fix with real public data.** Keep it noindexed until that is done.
- **Recommended fixes:**
  - **P0:**
    - Add `/onchain-analytics` to `NOINDEX_PATHS` and remove it from `sitemap.xml:130-135` and `llms.txt:46` until real data ships.
    - Delete the false "Data Sources" block (`:327-340`) and the Pro upsell and cards (`:83-101,291-325`).
    - Delete `generateDemoMetrics` from any user-facing path.
  - **P1:** Rewrite as a BTC-first free dashboard.
    - Create `src/services/onchainPublic.ts` that fetches the mempool.space, Coin Metrics Community and DefiLlama sources listed above, cached, with loading, error and "data unavailable" states and no synthetic fallback.
    - Show 6–8 metrics with value, as-of timestamp, source link and a 1–2 sentence definition. Render a real chart; the site already has chart components.
    - Put a static educational baseline (definitions + FAQ) in the page file so it renders with no network.
    - Add Article/FAQPage schema and a visible "Last updated". Shorten the title to under 60 characters, e.g. "Bitcoin On-Chain Metrics Explained".
  - **P2:** Once Supabase exists, the existing `on_chain_metrics` table functions can cache the fetched series server-side. Alerts and dashboards only after auth is live.

### /whale-tracking — src/pages/WhaleTracking.tsx (+ src/services/whaleTracking.ts)
- **Purpose / target query:** "crypto whale tracker", "whale alert", "bitcoin whale transactions".
- **Verdict:** Poor. The page shows fabricated transactions attributed to real, named public companies, timestamped "30 minutes ago", with explorer links that don't work.
- **Up-to-date issues:**
  - Stale embedded prices: ETH is about $2,400 (10,000 ETH = $24M) and BTC $43,000 (1,000 BTC = $43M) (`whaleTracking.ts:32-34`). Block heights are 18,500,000 (ETH) and 820,000 (BTC), which are late-2023 values (`:32-36`). The timestamps are `Date.now()` minus minutes, so all of this looks live.
  - Entity names are outdated. "MicroStrategy" (`:25`) has rebranded as Strategy, and "Marathon Digital" (`:26`) as MARA Holdings. **NEEDS-OWNER** to confirm current names.
- **SEO issues:**
  - Title "Whale Tracking - Monitor Large Crypto Transactions | Bitcoinvestments" is 68 chars, over the limit (`seo.ts:227-230`).
  - The description promises "Get alerts when whales move". No alert feature works.
  - Two FAQ answers are sent in FAQPage JSON-LD but are **not visible on the page** (`WhaleTracking.tsx:107-116`). That breaks Google's structured-data policy.
  - A SoftwareApplication schema with `price: 0` (`seo.ts:613-616`) contradicts the $19.99/mo upsell.
- **GEO issues:** No definition of a whale threshold, no explanation of why exchange inflow and outflow matter, no caveats (exchange wallet reshuffles, custodial movements), no sources.
- **Static + DB:**
  - The service is entirely mock and has no Supabase code at all (`whaleTracking.ts:18-274`).
  - `getUserWhaleAlerts` makes up alerts ("Triggered: 5x") for any logged-in user (`:186-235`). `createWhaleAlert` and `trackWallet` pretend to save (`:179,246`).
  - The "+" add-alert button has no handler (`WhaleTracking.tsx:276-281`).
  - The "24h delayed" free tier only shifts the fake timestamps by 24h (`whaleTracking.ts:97-104`). The UI shows only `toLocaleTimeString()` (`WhaleTracking.tsx:236`), so the delay is invisible.
- **Trust / legal:** These rows are invented but read as fact:
  - "MicroStrategy → Binance Hot Wallet: 500 BTC exchange_deposit" (`whaleTracking.ts:33`). It implies a named listed company is selling BTC.
  - "Marathon Digital → Binance 15: 1,000 BTC" (`:34`).
  - Mis-chained transfers: BTC sent to an Ethereum `0x…` address (`:33,34`) and ETH sent to a `bc1…` address (`:35`).
  - Several address labels look wrong or unverifiable:
    - `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`, labelled "Marathon Digital", is the widely used documentation example address.
    - The 0x Protocol exchange-proxy contract is labelled a "smart money" whale holding $180M.
    - The balances are hard-coded, not fetched.

  This combines misinformation and reputational/legal exposure.
- **Uniqueness / content gaps:** Genuinely useful, keyless options:
  - A curated list of **verified** large-holder addresses (exchange cold wallets, ETFs where published, known treasuries), with **live** balances from the mempool.space `/api/address/:addr` endpoint (CORS-enabled, no key). Each should have an explorer link and a "last verified" date.
  - A guide on how to track whales yourself, covering Arkham, mempool.space, Etherscan and Whale Alert, and how to read exchange flows.
  - A caveats section (see GEO issues above).
- **Bugs:**
  - The tx hashes are placeholders (`'0x1234...abcd'`, `whaleTracking.ts:32-36`), but `href={https://etherscan.io/tx/${tx.tx_hash}}` builds broken links. It also points Bitcoin transactions to Etherscan (`WhaleTracking.tsx:238-245`).
  - `formatAmount` for negative values returns `$-24000000` because all thresholds fail (`WhaleTracking.tsx:85-90,166`). This will surface as soon as net flow is negative.
  - `useEffect` depends on `hasAccess` and `selectedChain` but `loadData` is not memoised, which causes lint warnings (`:57-59`).
  - The external-link icon has no accessible name (`:238-245`).
  - The wallet list shows "Free tier: Top 10 wallets only" but slices to 5 (`:311,331`).
- **Recommendation: (b) convert to an honest educational page with a small real, keyless data widget.** Noindex until the fabricated data is removed.
- **Recommended fixes:**
  - **P0:**
    - Delete `mockTransactions`, `mockWhaleWallets` and the mock alerts from `whaleTracking.ts`, and remove the transactions/activity/alerts panels from `WhaleTracking.tsx:154-335`.
    - Until the replacement ships, add `/whale-tracking` to `NOINDEX_PATHS` and pull it from `sitemap.xml:115-120` and `llms.txt:43`.
    - Remove the premium upsell (`:337-371`).
  - **P1:** Rebuild as "Bitcoin Whale Tracker: Largest Wallets & How to Track Them".
    - Put a static list in `src/data/whaleWallets.ts` (address, entity, source, last-verified date). **NEEDS-OWNER** to verify each attribution.
    - Fetch live balances from mempool.space, with loading and error states. Link each address to mempool.space.
    - Add a visible FAQ (matching the JSON-LD), a BLUF, a "why exchange flows matter" section with caveats, and a "Last updated" date.
    - Shorten the title to under 60 characters.
  - **P2:** Real-time alerts need a server-side worker (a Cloudflare Worker/cron with Whale Alert or a node provider) plus Supabase storage. Build only after auth ships.

### /trading-indicators — src/pages/TradingIndicators.tsx (+ services/tradingIndicators.ts, services/technicalIndicators.ts)
- **Purpose / target query:** "bitcoin RSI", "crypto technical indicators", "BTC MACD".
- **Verdict:** Needs work. This is the only page in scope using real market data (CoinGecko OHLC, `tradingIndicators.ts:46-65`), and it refuses to fall back to synthetic data (`TradingIndicators.tsx:114-128`). Good. But the chart is drawn wrong, one timeframe crashes, and almost every indicator is locked or never rendered.
- **Up-to-date issues:**
  - The `TRADING_INDICATORS_PRICING` premium list (`subscriptionLimits.ts:1357-1367`) advertises Ichimoku, custom indicators, multi-timeframe analysis and alerts. None of these is implemented.
  - "Start Pro Trial" (`TradingIndicators.tsx:477`): no trial exists.
- **SEO issues:**
  - Title length is fine (53).
  - The description claims "Professional… custom indicators" (`seo.ts:241-244`).
  - There is no H2 content beyond "Indicators". The chart card uses H3 without a parent H2 (`:336`).
  - No SoftwareApplication/WebApplication or FAQ schema.
  - PageSEO is not rendered while loading (`:179-185`).
- **GEO issues:** No explanation of what RSI/MACD/Bollinger mean, their default periods, how to read them or their limits. The page shows "signals" with "Strength: X%" (`:446`) and no disclaimer that these are not advice.
- **Static + DB:** No DB is needed or used, which is fine. Without network the page shows an honest error with Retry (`:209-226`), but it then has no static educational content at all.
- **Uniqueness / content gaps:**
  - A free, real "Bitcoin RSI / MACD today" readout (current RSI value + zone, MACD crossover state, price vs Bollinger bands, SMA 50 position), with plain-English interpretation and a timestamp, is a strong query match.
  - The code already computes these values; they are just hidden behind a paywall nobody can pay.
  - Add an asset selector (ETH, SOL) and explainer sections.
- **Bugs:**
  - **The candles have no price position.** Each candle column is `flex … justify-end`, and its height is only wick + body + wick (`TradingIndicators.tsx:351-377`), so every candle sits on the baseline. The chart shows candle *size*, not price *level*. Add a bottom spacer of `toPixels(candle.low - priceFloor)`.
  - **The 3M timeframe crashes the page into its error state.**
    - CoinGecko returns 4-day candles for 90 days, about 23 candles (`tradingIndicators.ts:29`).
    - `loadData` calls `calculateMACD(data)` without a length check (`TradingIndicators.tsx:104`).
    - That calls `calculateEMA(data, 26)`, which reads `data[25].timestamp` → TypeError (`tradingIndicators.ts:106-111`).
    - The result is "Could not load live price data: Cannot read properties of undefined". (`technicalIndicators.ts:106` has the guard this version lacks.)
  - SMA (50) is selected by default and is the only free indicator (`:79`; `tradingIndicators.ts:524-529`), but no SMA line is ever drawn. MACD and BB are computed and discarded (`_macdValues`, `_bbValues`, `:81-82`). EMA and Stochastic toggles render nothing. So the indicator list is mostly non-functional.
  - The RSI panel's axis labels "70/50/30" are spread top/middle/bottom (`:389-393`), while the bars are scaled 0–100% (`:402`). The labels are wrong; the top of the scale is 100.
  - The Settings gear button has no handler and no `aria-label` (`:345-347`).
  - The header row doesn't wrap on mobile (5 timeframe buttons + price, `:230-264`).
- **Recommendation: (a) keep and fix with the real public data it already uses.** It stays indexed.
- **Recommended fixes:**
  - **P0:**
    - Fix candle positioning (`TradingIndicators.tsx:357-377`).
    - Guard `calculateEMA`/`calculateMACD` for short series in `tradingIndicators.ts:102-126,181-227`, returning `[]`. Alternatively, only compute indicators whose `INDICATOR_MIN_CANDLES` are met in `loadData`.
    - Change "Start Pro Trial" and the upsell (`:455-486`, `:304-318`) so they no longer offer an unbuyable product.
  - **P1:**
    - Unlock the indicators for everyone while `STATIC_MODE` is on: make `hasAccess || STATIC_MODE` feed `getAvailableIndicators`.
    - Render the SMA/EMA/BB overlays and a MACD panel.
    - Add a "Current readings" card (RSI value + zone, MACD state, BB position, as-of time, "Source: CoinGecko") with a one-line plain-English meaning each, plus a "not financial advice" note next to the signals.
    - Add static explainer sections (what each indicator is, formula, default settings, common mistakes) and a visible FAQ with FAQPage and WebApplication schema. Render the SEO and static copy outside the `isLoading` early return.
  - **P2:**
    - Consolidate on one indicator library: delete `technicalIndicators.ts` and the unused `components/TechnicalIndicators.tsx`, or port its guards.
    - Add an asset selector.
    - Remove `generateMockChartData` from the production bundle (`tradingIndicators.ts:538-557`), for example by moving it to a test fixture.

### /multi-exchange — src/pages/MultiExchange.tsx (+ services/multiExchange.ts, services/exchangeConnections.ts)
- **Purpose / target query:** "crypto portfolio tracker multiple exchanges", "connect Coinbase Binance Kraken portfolio".
- **Verdict:** Poor. On the static site it is just a paywall ad for a feature that cannot work. Behind the paywall is a mock that would ask for API secrets, pretend to connect, and show made-up holdings as the user's own.
- **Up-to-date issues:**
  - `SupportedExchange` still includes `'ftx'` (bankrupt since 2022) and `'huobi'` (rebranded HTX) (`src/types/premiumFeatures.ts:662,771`). `mockExchangeBalances.ftx` also remains (`multiExchange.ts:33`), as does `EXCHANGES.ftx` (`exchangeConnections.ts:171-181`).
  - The mock prices are stale: BTC about $43,000 and ETH about $2,400 (`multiExchange.ts:20-29,39-41`; `exchangeConnections.ts:736,756`).
  - The KuCoin and Binance listings need a check of current US availability. **NEEDS-OWNER.**
- **SEO issues:**
  - Title "Multi-Exchange Portfolio - Track All Accounts | Bitcoinvestments" is 63 chars, over the limit (`seo.ts:310-313`).
  - The description promises "Connect and track all your … exchange accounts". Nothing can connect.
  - The page is only an upsell, which makes it thin content, yet it is indexed, in the sitemap (`:160`) and in the nav twice (`Header.tsx:87,95`).
- **GEO issues:** Nothing quotable. There is no guidance on read-only API keys, the risks of sharing keys, or alternatives.
- **Static + DB:**
  - `hasAccess` is always false on the static site, so users see only the upsell and a "Manual Portfolio Entry → /dashboard" link (`MultiExchange.tsx:142-182,331-345`).
  - `multiExchange.ts` is fully mocked:
    - `getConnectedExchanges` returns three made-up "connected" exchanges for any user id (`:46-96`).
    - `connectExchange` waits 1s and returns success without storing anything (`:101-125`).
    - The holdings are hard-coded.
  - A paying user would therefore see someone else's made-up portfolio labelled as their own.
- **Security:** `exchangeConnections.ts` (only used by the unused `components/ExchangeConnections.tsx`) has several problems:
  - It "encrypts" API secrets in the browser with a key derived from `userId` plus hard-coded salts (`exchangeConnections.ts:616-664`). Anyone who can read the row and knows the user id can decrypt it.
  - It lists Binance permissions including "Enable spot & margin trading" and KuCoin "Trade" (`:137,167`). The UI's own "Only use read-only API keys" note (`MultiExchange.tsx:451`) contradicts this.
  - Its `fetchExchangeBalances` is also mocked (`:726-740`).
  - Private exchange APIs can't be called from the browser anyway (CORS and secret exposure).
- **Uniqueness / content gaps:**
  - This duplicates the Dashboard `PortfolioTracker` (`src/pages/Dashboard.tsx:215-218`).
  - A good honest alternative is a guide: "How to track crypto across multiple exchanges safely". It would cover read-only keys, CSV export and import, and tax-software aggregators. It could be combined with the existing manual tracker, where holdings are grouped by exchange, stored locally and priced via CoinGecko.
- **Bugs:**
  - KuCoin requires a passphrase (`premiumFeatures.ts:769`), but the modal has no passphrase field (`MultiExchange.tsx:405-462`).
  - The form `<label>`s are not associated with their inputs (no `htmlFor`/`id`, `:407-446`).
  - The modal has no dialog role, Escape handling or focus trap.
  - The hide-balance toggle and the disconnect buttons have no `aria-label` (`:192-194,284-289`).
  - The "PREMIUM" badge is always shown (`:133-135`).
  - `useEffect` depends only on `user?.id` (`:68-70`).
- **Recommendation: (c) gate behind ComingSoon + noindex.** Optionally fold a manual multi-exchange view into the Dashboard tracker later.
- **Recommended fixes:**
  - **P0:**
    - Wrap `/multi-exchange` in `staticGuard` (`App.tsx:235`) and add it to `NOINDEX_PATHS`.
    - Remove it from `sitemap.xml:159-164` and `Header.tsx:87,95`.
    - Remove `ftx` from `SupportedExchange`, `SUPPORTED_EXCHANGES`, `mockExchangeBalances` and `EXCHANGES`.
  - **P1:**
    - Delete or quarantine the unused `components/ExchangeConnections.tsx` and the client-side credential "encryption" in `services/exchangeConnections.ts`.
    - Any future key storage must be server-side (a Supabase Edge Function or Cloudflare Worker with a KMS/secret key) and read-only. Document that before re-enabling.
    - Make `multiExchange.ts` read from Supabase, and return `[]` rather than mock rows when no DB is configured.
  - **P2:** Optionally publish a static guide at this URL, or a `/learn` guide on tracking holdings across exchanges and API-key safety, and link it to `/dashboard`'s tracker. The product itself waits on auth and a server-side key vault. **NEEDS-OWNER** decision on whether to build it at all.

---

## Summary table

| Route | Real data? | Recommendation | Priority action |
|---|---|---|---|
| /social-trading | No: fake traders, returns, stats, verified badges | (c) now → (b) educational copy-trading guide | P0: gate + noindex, delete demo data |
| /onchain-analytics | No: `Math.random`, false "Glassnode…" attribution | (a) real keyless public APIs + definitions | P0: noindex + remove false sources |
| /whale-tracking | No: fabricated tx naming MicroStrategy/Marathon, broken explorer links | (b) educational + verified wallets with live mempool.space balances | P0: delete fabricated tx, noindex |
| /trading-indicators | Yes (CoinGecko OHLC) | (a) fix bugs, unlock indicators, add explainers | P0: candle positioning, 3M crash |
| /multi-exchange | No: mock "connected" exchanges; unsafe client-side key crypto (dead code) | (c) ComingSoon + noindex | P0: gate, remove FTX, remove from nav |
