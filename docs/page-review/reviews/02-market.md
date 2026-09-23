# 02 — Market pages review (/dashboard, /prices, /charts, /coin/:id)

## Cross-cutting findings (these affect all four routes)

**What happens when CoinGecko fails**
- **The client hides failures.** `getTopCryptocurrencies`, `getGlobalMarketData`, `getTrendingCryptocurrencies` and `getSimplePrices` catch every error and return `[]`, `null` or `{}` (src/services/coingecko.ts:173-177, 333-336, 366-369, 301-304). As a result, the `catch` blocks in Dashboard.tsx:61 and Charts.tsx:67 never run, and neither page shows an error or empty-state message. See each route for what the user sees.
- **The cache lives only in memory.** `dataCache` is a Map (coingecko.ts:19), so a cold page load has no last-known-good data. `getCryptocurrencyById`, `getHistoricalData` and `searchCryptocurrencies` call `rateLimitedFetch(url)` without a cacheKey (coingecko.ts:190, 213, 238) and are never cached. The 429/network cache fallback (coingecko.ts:119-141) therefore never helps charts or coin pages.
- **Refresh is a no-op for 5 minutes.** A cache hit returns before any network call (coingecko.ts:89-106, CACHE_DURATION 5 min), so the Dashboard "Refresh" button (Dashboard.tsx:148-155) re-reads the same cached data.
- `getCryptocurrencyById` puts the raw `id` into the query string without encoding: `ids=${id}` (coingecko.ts:188). Use `encodeURIComponent`.
- **Proxy (functions/api/coingecko/[[path]].ts):**
  - It is an open proxy: any path and query string is forwarded to CoinGecko with the site's API key attached (lines 74-107). Anyone can spend the quota. Add an allowlist (`coins/markets`, `coins/*/market_chart`, `global`, `search`, `search/trending`, `simple/price`, `coins/*/ohlc`).
  - It sets `Cache-Control: public, max-age=N` on every response, including 429 and 5xx (lines 126-136). It also passes `cf.cacheTtl` + `cacheEverything` (113-117), so an error from upstream may be cached at the edge. Use `cacheTtlByStatus` (200-299 only) and `no-store` for non-2xx.
  - `COINGECKO_CACHE` KV is declared (line 12) but never used. It is the obvious place for a last-good snapshot: on a 429 or 5xx, serve the stored copy with `X-Data-Stale: true`.
- `setDataDelay` / "free-tier delayed data" (coingecko.ts:24-54) is only called from `src/hooks/useDataDelay.ts`, and no .tsx file uses that hook. It is dead code in static mode, which is fine, but nothing on the page says what the data delay actually is. The client cache is 5 min and the edge cache 2 min (proxy line 46), so data can be up to about 7 min old.

**SPA / crawler baseline**
- The raw `index.html` served for every route has `<link rel="canonical" href="https://bitcoinvestments.net/">` (index.html:97) and `robots index` (index.html:65). A non-JS crawler therefore sees /dashboard, /charts, /prices and every /coin/* as duplicates of the home page. Only the client-side SEO.tsx fixes this (SEO.tsx:241-249). These routes need prerendering (see per-route notes), or at minimum a per-route canonical and title injected at build or edge time.

**GasPriceTracker (rendered on /dashboard and /prices)**
- **The CSP blocks every gas RPC call.** src/services/gasPrice.ts:23-71 fetches `https://*.publicnode.com`, but `connect-src` in public/_headers:7 does not list publicnode. Each call falls back to zeros (gasPrice.ts:282-299). The compact widget then shows "<0.01 gwei" for Ethereum, Polygon, Arbitrum, Optimism and BSC (GasPriceTracker.tsx:418-443; formatGasPrice gasPrice.ts:364-366). This fallback is presented as real data, which is a trust problem.
- Polygon is still labelled `MATIC` / `matic-network` (gasPrice.ts:30-32; icon GasPriceTracker.tsx:32). The token migrated to POL in Sept 2024, so the correct values are symbol `POL` and CoinGecko id `polygon-ecosystem-token`.
- The widget polls 7 chains × (eth_gasPrice + eth_feeHistory + price) every 30 s (GasPriceTracker.tsx:44, 76-80). The compact view only shows 5 chains (slice(0,5), line 418).
- The refresh button has no aria-label (GasPriceTracker.tsx:405-414).

**PortfolioTracker (rendered on /dashboard and /prices)**
- **Without auth or DB it works from localStorage.** With STATIC_MODE on, nobody can log in, so `getCurrentUser()` returns null (src/services/auth.ts:435-440) and every read and write goes to localStorage key `bitcoin_investments_portfolio` (src/services/portfolio.ts:30-55, 129, 194-209, 356-358). The Supabase path (portfolio.ts:63-125) cannot be reached in static mode. That is acceptable, but the UI never says that data is stored only in this browser (PortfolioTracker.tsx:112-117).
- **A failed price refresh is shown as success.** `getSimplePrices` returns `{}` on failure and never throws, so `updatePortfolioPrices` always "succeeds". It sets `updated_at = now` and writes to localStorage (portfolio.ts:542-559) even when no price was updated. The header then shows "Updated HH:MM" (PortfolioTracker.tsx:211). A newly added holding keeps `current_price = purchasePrice` (portfolio.ts:319), so it shows 0.00% P/L as if that were live.
- `updatePortfolioPrices` calls `saveLocalPortfolio` unconditionally (portfolio.ts:559), which also writes DB users' portfolios into localStorage.
- **The 11th asset fails silently.** Free-tier `maxAssets: 10` (src/services/subscriptionLimits.ts:17). `addHolding` then throws `AssetLimitError` (portfolio.ts:272-277), but `handleSubmit` has no try/catch (PortfolioTracker.tsx:407-420). The result is an unhandled rejection: no toast, and the modal stays open. Premium cannot be bought in static mode either.
- **The "performance" chart is mislabelled.** `getPortfolioPerformance` plots cumulative cost (sum of `total_value` at purchase) at each transaction date, then jumps to today's value (portfolio.ts:633-684). The chart labels this "Portfolio Value" (src/components/charts/PortfolioChart.tsx:96), but it is not a value history.
- The "Add holding" form does not validate negative or zero amounts or prices (PortfolioTracker.tsx:402-414; only checks for empty).
- There is no way to remove a single holding. The only delete removes the whole portfolio (PortfolioTracker.tsx:88-94).
- **A11y:**
  - `<label>`s are not tied to their inputs (no htmlFor/id; lines 446, 514, 530, 546).
  - The modal has no `role="dialog"`, `aria-modal`, focus trap or Esc handling (431-432).
  - The close button has no aria-label (435-440), and neither does the compact "+" button (139-144).

**PriceAlerts / TechnicalIndicators**
- `PriceAlerts` is rendered only on Profile.tsx:555, an auth-gated page, so it is not on any route in this scope.
- `TechnicalIndicators` is not imported by any page. It is dead code, yet /charts metadata and llms.txt promise "technical analysis indicators" (see /charts).

---

### /dashboard — src/pages/Dashboard.tsx
- **Purpose / target query:** "crypto prices today", "cryptocurrency market dashboard", "crypto market cap". The page combines a price table, market stats, a BTC chart, a local portfolio, the Fear & Greed index, gas prices and trending coins.
- **Verdict:** Needs work. The live widgets are useful, but the page is thin as a document, fails silently, and contains one widget showing wrong data.
- **Up-to-date issues:**
  - The FAQ schema says prices are "refreshed every few seconds from major exchanges" (Dashboard.tsx:121-123). That is false: nothing refreshes automatically, and data is cached for 5 min client-side plus 2 min at the edge.
  - "Active Cryptos 10,000+" is hardcoded (Dashboard.tsx:192-195), even though `/global` returns `active_cryptocurrencies` (coingecko.ts:315) and the real figure is much higher.
  - The gas widget shows Polygon as MATIC (see cross-cutting).
  - public/sitemap.xml:46 lastmod is 2026-09-10, which is fine.
- **SEO issues:**
  - Title is "Cryptocurrency Market Dashboard | Bitcoinvestments" (51 chars), which is OK. The description is 172 chars, over the 160 limit (src/lib/seo.ts:62-63).
  - Heading order is wrong. H1 (line 145) is followed by H3s inside PriceChart ("Bitcoin Price", PriceChart.tsx:257) and PortfolioTracker (PortfolioTracker.tsx:114/209) before the only H2, "Top Cryptocurrencies" (line 225). The sidebar uses H3 "Trending" and "Quick Actions" (381, 408) with no H2 parent.
  - **Coin rows are not links.** They are `<tr onClick>` and `<div onClick>` elements (Dashboard.tsx:249-252, 311-314), so crawlers cannot discover /coin/* pages, and they are not keyboard-focusable. Trending items (384-400) do not link anywhere.
  - Schema is `SoftwareApplication` + `FAQPage` (109-132). There is no Dataset or ItemList for the table, and no BreadcrumbList as JSON-LD (the Breadcrumbs component uses microdata only).
  - The FAQ in the schema is not visible on the page. Google requires FAQ content to be visible, so this is a policy risk.
- **GEO issues:**
  - There is no BLUF summary, no "Data from CoinGecko, updated HH:MM" attribution or timestamp, no definitions (market cap, dominance, 24h change), and no visible FAQ.
  - Nothing on the page is quotable without JS. Prerender at least the H1, an intro paragraph, the methodology/source note, the FAQ, and a static snapshot of the top-20 table (name, symbol, rank; prices can be omitted or timestamped).
- **Static + DB:**
  - The page does not need a DB. The portfolio uses localStorage (see cross-cutting).
  - When CoinGecko fails:
    - The stats grid disappears entirely (the `globalData &&` guard, line 160).
    - The table renders an empty `<tbody>`/list with no message (238-355).
    - The "Trending" card renders a heading with an empty list (377-404).
    - The BTC chart shows "Failed to load chart" (PriceChart.tsx:223-237).
    - The gas widget shows zeros (see cross-cutting).
  - No error banner, no retry that actually refetches, and no stale-data notice.
- **Uniqueness / content gaps:**
  - Only 20 coins are shown. There is no 7d change, volume, circulating supply or sparkline.
  - The "View all prices" link (357-363) goes to /prices, which is the same component showing the same 20 coins.
  - There is no explanatory content, which is what would make this page better than CoinGecko or CoinMarketCap for beginners. Examples: "what moves the market today" using the F&G value and BTC dominance, and a beginner glossary panel.
- **Bugs:**
  - Refresh does nothing for 5 min (cross-cutting).
  - `price_change_percentage_24h.toFixed` (278, 343) will throw if CoinGecko returns null for a coin. The ErrorBoundary catches it, but the whole page is lost.
  - The search input has no label or aria-label (228-234).
  - An empty search shows nothing, with no "no results" state.
  - The dashboard renders `ChartSkeleton` only while `loading && !cryptos.length` (202), but PriceChart fetches on its own anyway.
- **Recommended fixes:**
  - **P0:** Add `*.publicnode.com` to CSP `connect-src` in public/_headers, or proxy RPC through a Pages Function. In GasPriceTracker, render "Unavailable" instead of "<0.01 gwei" when `gasPrice.average === 0 && !lastUpdated` (make `getGasPriceForChain` return an `error: true` flag).
  - **P0:** Show error and empty states in Dashboard.tsx. Track `failed` when the arrays come back empty or null and render "Market data is temporarily unavailable (CoinGecko). Retry." Make Refresh bypass the cache: add a `force` param to `rateLimitedFetch` or call `clearCache()` before `fetchData`.
  - **P0:** Replace row `onClick` with `<Link to={`/coin/${id}`}>` wrapping the name cell (or the whole row via a stretched link), and link trending items.
  - **P1:** Correct the FAQ copy: "Prices come from CoinGecko and refresh every 2–5 minutes." Render the FAQ visibly (reuse the GEOContent/FAQ component). Trim the description in seo.ts:63 to under 160 chars.
  - **P1:** Add a visible "Source: CoinGecko · Updated {time}" line, and use `globalData.active_cryptocurrencies` instead of "10,000+".
  - **P1:** Prerender /dashboard with a static intro, FAQ and a top-20 snapshot. Add JSON-LD `ItemList` of the top coins linking to /coin/{id}.
  - **P1:** Wrap `addHolding` in try/catch in PortfolioTracker.tsx and toast on `AssetLimitError`. Add a "Stored only in this browser" note. Only set `updated_at` when at least one price was returned (portfolio.ts:545-558). Rename the "Portfolio Value" line to "Amount invested", or remove the chart.
  - **P2:** Fix heading levels (make section titles H2). Add a per-holding delete, input validation (>0) and dialog a11y. Rename MATIC to POL in gasPrice.ts.

### /prices — src/pages/Dashboard.tsx (duplicate)
- **Purpose / target query:** "crypto prices", which is probably the highest-volume query of the four routes.
- **Verdict:** Poor. The URL is a byte-identical duplicate of /dashboard.
- **Up-to-date issues:** Same as /dashboard.
- **SEO issues:**
  - App.tsx:245 renders `<Dashboard/>` at /prices. `shouldNoindex` returns true for /prices (src/lib/index-pruning.ts:48-50, 76-78), so the page is `noindex, follow`. SEO.tsx:111 then emits a self-canonical to `/prices` and a `SoftwareApplication` schema whose `url` is `/dashboard` (Dashboard.tsx:114). The noindex, self-canonical and schema URL disagree with each other.
  - For non-JS crawlers the raw HTML says index with canonical "/" (index.html:65, 97).
  - /prices is not in public/sitemap.xml or functions/api/sitemap.ts, which is consistent with the noindex.
  - The page's own `RelatedPages currentPath="/dashboard"` (Dashboard.tsx:437) and "View all prices → /prices" (359) create a self-loop.
- **GEO issues:** Same as /dashboard.
- **Static + DB:** Same as /dashboard.
- **Uniqueness / content gaps:** None; it is a pure duplicate. The owner has two choices:
  - (a) 301 it to /dashboard.
  - (b) Make /prices the real "all crypto prices" page, with top 100–250, pagination, sortable columns, 7d/30d change, and links to /coin/*. It would be indexable, with its own title "Crypto Prices Today: Top 100 by Market Cap". /dashboard would then become the personal page (portfolio, F&G, gas).
- **Bugs:** The "View all prices" link promises more coins than the page delivers.
- **Recommended fixes:**
  - **P0 (quick):** Add `/prices /dashboard 301` to public/_redirects and remove the route at App.tsx:245. Alternatively, keep the route but pass `url="https://bitcoinvestments.net/dashboard"` to SEO so the canonical points to /dashboard. Change the "View all prices" link text or target.
  - **P1 (better, NEEDS-OWNER decision):** Build a dedicated `src/pages/Prices.tsx` using `getTopCryptocurrencies(100, page)` with sortable columns and `<Link>` rows. Remove `/prices` from `CONDITIONAL_INDEX_PATHS`, add it to the sitemap, add a PAGE_METADATA.prices entry and an ItemList schema, and prerender a snapshot.

### /charts — src/pages/Charts.tsx
- **Purpose / target query:** "bitcoin price chart", "crypto chart comparison", "compare BTC vs ETH performance".
- **Verdict:** Needs work. The comparison tool is decent, but the page overpromises (indicators), is not shareable, and fails silently.
- **Up-to-date issues:**
  - The meta description promises "technical analysis tools … and indicators" (seo.ts:79-80), and llms.txt:13 says "technical analysis indicators". None are rendered; `TechnicalIndicators` is unused.
  - The FAQ timeframes are "24 hours, 7 days, 30 days, 90 days, and 1 year" (Charts.tsx:125). The chart actually offers 24H/7D/14D/1M/3M/6M/1Y (PriceChart.tsx:196-203).
  - public/sitemap.xml:53 lastmod is 2026-02-08.
- **SEO issues:**
  - Title "Cryptocurrency Price Charts & Analysis | Bitcoinvestments" is 57 chars; the description is 161 chars (1 over the limit).
  - Headings go H1 (141) → H3 only ("Popular" 242, "Chart Tips" 284, and the PriceChart H3). There is no H2.
  - The FAQ schema (118-127) is not visible on the page.
  - The selected coin and comparison set live in React state only (11-26). There is no `?coin=` / `?compare=btc,eth` URL, so a chart cannot be shared or bookmarked and there is no landing URL for "ETH vs SOL chart".
  - "Popular" items are buttons, not links to /coin/*.
- **GEO issues:**
  - No BLUF, no explanation of what "normalized" means (only a tip, line 296), no data source or timestamp, and no example insight such as "BTC +x% vs ETH +y% over 30 days" that an LLM could quote.
  - Prerender needed: H1, intro, how-to-read-a-chart section, and FAQ.
- **Static + DB:**
  - No DB is involved.
  - When CoinGecko fails:
    - The "Popular" panel renders a heading with nothing under it (Charts.tsx:239-280).
    - Search failures are only logged (80-81). The user sees no results, with no message.
    - PriceChart shows an error box.
    - ComparisonChart uses `Promise.all` (ComparisonChart.tsx:95), so one bad coin (e.g. 429 on the 3rd fetch) fails the whole comparison.
  - The /charts page opens with 2 comparison fetches + 1 price fetch + top-10 + search, none of them cached (no cacheKey on `getHistoricalData`). This invites 429s.
- **Uniqueness / content gaps:**
  - The page could stand out with a performance summary table under the comparison: % change, max drawdown and volatility per coin for the selected period (computable from the `prices` already fetched).
  - Other additions: a "vs DCA" overlay linking to the DCA calculator, a BTC halving markers option, and the unused TechnicalIndicators (RSI/MA). Either render them or remove the claims.
- **Bugs:**
  - "Add up to 8" (Charts.tsx:121, 300) is not enforced in `selectCrypto` (88-99).
  - The Charts page colour list has 6 entries (91) versus 8 in ComparisonChart, so the 7th coin reuses BTC's orange.
  - Toggling Normalized/Absolute refetches every series, because `normalize` is in the effect deps (ComparisonChart.tsx:83).
  - Series alignment uses `slice(0, minLength)` (ComparisonChart.tsx:98-114). This truncates the newest points of the longer series and misaligns dates. Use `slice(-minLength)` or align by timestamp.
  - The y-axis tick formatter uses `maximumFractionDigits: num < 1 ? 2 : 0` (PriceChart.tsx:189), so sub-cent coins (SHIB, PEPE) show every tick as "$0.00".
  - The volume tooltip always prints billions `(volume/1e9).toFixed(2)B` (PriceChart.tsx:343), so small caps show "$0.00B".
  - A11y:
    - The search input has no label (175-182).
    - The mode toggle lacks `aria-pressed` (149-168).
    - The search dropdown has no listbox/combobox semantics or keyboard navigation.
    - The period selector uses `role="tablist"`/`tab` without tabpanels or arrow-key handling (PriceChart.tsx:277-296).
- **Recommended fixes:**
  - **P0:** Either render `TechnicalIndicators` for the selected coin, or change seo.ts:79-80 and public/llms.txt:13 to drop "technical analysis/indicators". Fix the FAQ timeframes to match PriceChart.
  - **P1:** Sync state to the URL (`useSearchParams`: `?coin=ethereum`, `?compare=bitcoin,ethereum&days=30`). Canonical stays /charts.
  - **P1:** Add a cacheKey to `getHistoricalData` (coingecko.ts:238). Switch ComparisonChart to `Promise.allSettled` and drop failed series with a notice. Remove `normalize` from the fetch deps and normalize in a `useMemo`.
  - **P1:** Visible intro/BLUF, "How to read these charts" H2, visible FAQ, and a source/timestamp line. Prerender these.
  - **P2:** Enforce the max of 8 coins. Share the 8-colour palette. Fix the y-axis and volume formatters for small values. Make "Popular" items link to /coin/{id}. Fix heading levels and a11y.

### /coin/:id — src/pages/CoinDetail.tsx
- **Purpose / target query:** "{coin} price", "{coin} price chart", "{symbol} market cap", "{coin} all-time high".
- **Verdict:** Poor for SEO. Every coin page is the same template filled only with API numbers. There is no unique text, schema or FAQ, and invalid IDs become soft-404s.
- **Up-to-date issues:** No stale text, because there is no text. The meta description includes the live price at render time (line 78). That goes stale in SERP snippets, and small prices print as "$0" because `toLocaleString()` defaults to 3 decimal places.
- **SEO issues:**
  - The title `${name} (${SYM}) Price, Chart & Stats | Bitcoinvestments` is about 53 chars for Bitcoin, but longer names exceed 60.
  - No JSON-LD at all: no BreadcrumbList, FAQPage, or Dataset/FinancialProduct/ExchangeRateSpecification. `<SEO>` is called without `schema` (76-86).
  - SEO is not rendered in the loading or error branches (42-70). A bad ID such as /coin/foo keeps the index.html defaults (index, canonical "/") or the previous page's meta, and returns HTTP 200 with "Cryptocurrency not found." That is a soft 404, and it is indexable.
  - **Duplicate breadcrumbs.** Layout renders global `<Breadcrumbs>` (src/components/Layout/Layout.tsx:21). /coin is not in DYNAMIC_ROUTES (src/hooks/useBreadcrumbs.ts:56-90), so it builds "Home › Coin › Avalanche 2". The "Coin" crumb links to `/coin`, which has no route and goes to the NotFound catch-all (App.tsx:250). The label comes from the slug (useBreadcrumbs.ts:95-101) rather than the coin name. CoinDetail then adds a second, different breadcrumb nav "Dashboard / {name}" (CoinDetail.tsx:89-93).
  - Headings: H1 (101) → H3 in PriceChart → H3 "Supply Information" / "All-Time Records" / "Tools & Resources" (192, 242, 281). There is no H2.
  - Discoverability:
    - No /coin/* URLs are in public/sitemap.xml or functions/api/sitemap.ts.
    - The only crawlable internal link is the footer's /coin/bitcoin (src/components/Layout/Footer.tsx:187).
    - Dashboard rows use onClick (see /dashboard).
- **GEO issues:**
  - Nothing an LLM can quote besides numbers: no "What is {coin}?" description, no category, launch year, consensus mechanism, supply model, key risks, official links, or "last updated" timestamp.
  - `getCryptocurrencyById` uses `/coins/markets` (coingecko.ts:188), which has no description. `/coins/{id}` provides `description.en`, `links`, `categories`, `genesis_date` and `hashing_algorithm`.
  - Prerender needed: for the top ~50 coins, generate static HTML at build time with name, a curated description, FAQ, and a data snapshot with date.
- **Static + DB:**
  - No DB is involved.
  - When CoinGecko fails, the whole page is replaced by "Failed to load cryptocurrency data." plus a back link (59-69). There is no static fallback: no curated coin profile, and no cached data, since there is no cacheKey (coingecko.ts:190).
  - A 429 from rapid navigation between coins will show the error page.
- **Uniqueness / content gaps:**
  - This is a thin, templated page repeated for any valid CoinGecko ID, potentially thousands of URLs. That scale combined with thinness is a classic quality risk.
  - Recommendations:
    - A static curated profile file, `src/data/coins.ts`, for the top ~25–50 coins. Fields: plain-English summary (BLUF), what it is used for, supply model (e.g. BTC 21M cap, ETH no cap post-Merge), consensus, launch date, main risks, how to buy (link /compare), how to store (link /compare wallets), relevant guide links (src/data/guides/what-is-bitcoin.ts → /learn/what-is-bitcoin), and 4–6 FAQs.
    - Only index coins that have a curated profile; noindex the rest.
    - Add a "{coin} vs BTC" performance line and a DCA "if you had invested $100/month" widget pre-filled for the coin.
- **Bugs:**
  - Vol/MCap divides by `market_cap` (158). New or illiquid coins with `market_cap` 0 print "Infinity%" or "NaN%".
  - `market_cap_change_percentage_24h.toFixed`, `price_change_percentage_24h.toFixed`, `ath_change_percentage.toFixed` and `atl_change_percentage.toFixed` (117, 145, 253, 269) throw on nulls, which CoinGecko returns for some coins. Likewise `circulating_supply.toLocaleString()` (197), `high_24h`/`low_24h` (168-184), and `new Date(null)` → "1/1/1970" for missing ATH dates (255, 271).
  - The ATL change uses `toFixed(2)` with no thousands separators (269), so large gains print as "+8000000.00%".
  - The `id` is not URL-encoded (coingecko.ts:188).
  - The "DCA Calculator — Plan your {SYM} investment" link goes to /calculators without preselecting the coin (283-295).
- **Recommended fixes:**
  - **P0:** Render `<SEO noindex title="Coin not found" />` in the error/not-found branch. Show a proper not-found state that suggests search/popular coins. Also render a minimal `<SEO>` with name derived from the id during loading.
  - **P0:** Remove the in-page breadcrumb (CoinDetail.tsx:89-93) and add a DYNAMIC_ROUTES entry for `/^\/coin\/([^/]+)$/` in useBreadcrumbs.ts. Set parent to `{label:'Prices', path:'/dashboard'}` and use the coin name as the label, so the dead `/coin` crumb goes away. Emit BreadcrumbList JSON-LD via the `schema` prop.
  - **P0:** Null-guard all numeric fields. Use a `fmtPct(v)` helper that returns "—" for null or non-finite values, and guard `market_cap > 0` for Vol/MCap.
  - **P1:** Create `src/data/coins.ts` with curated profiles for the top coins (NEEDS-OWNER for editorial review). Render BLUF, "What is {coin}", key facts table, FAQ (visible, plus FAQPage schema) and guide links. Noindex coins without a profile by passing `noindex` to SEO.tsx. Add those coin URLs to public/sitemap.xml and functions/api/sitemap.ts.
  - **P1:** Switch to or add `/coins/{id}?localization=false&tickers=false&community_data=false&developer_data=false` for description, links and genesis date. Add a cacheKey. Add the endpoint to the proxy allowlist. On API failure, fall back to the curated static profile rather than a blank error.
  - **P1:** Remove the live price from the meta description ("Track {name} ({SYM}) price, market cap, supply and all-time high. Plain-English guide, FAQ and chart.") and keep it under 160 chars. Cap the title at 60, e.g. drop "& Stats" when the name is long.
  - **P1:** Prerender the curated coin pages at build time (e.g. vite-plugin-prerender / a small Puppeteer script over the coins.ts list) so the static HTML carries the H1, description, FAQ, canonical and schema.
  - **P2:** Change H3 section titles to H2. Pass `?coin={id}` to the DCA calculator link. Add "Updated {time} · Source: CoinGecko".

---

## Summary of top priorities (whole scope)
1. **P0 (trust):** The gas widget shows fabricated "<0.01 gwei" values because the CSP blocks the publicnode RPCs (public/_headers:7, src/services/gasPrice.ts:282-299).
2. **P0:** CoinGecko failures are silent everywhere. Services return empty values (coingecko.ts:173-177 etc.), pages show blank sections, and the portfolio shows "Updated" with stale prices. Add error states. Harden the proxy with an allowlist, no caching of errors, and a KV last-good snapshot.
3. **P0:** /prices duplicates /dashboard, with conflicting noindex, self-canonical and schema URL. 301 it or build a real prices page.
4. **P0:** /coin/:id problems: soft-404s, a dead "/coin" breadcrumb link, duplicate breadcrumbs, and crashes on null fields.
5. **P1 (content):** Coin pages have zero unique content. Build curated coin profiles plus FAQ and schema, index only those, link them from the dashboard table, and prerender them.
6. **P1:** /charts promises indicators that do not exist (seo.ts:79-80, llms.txt:13). Its FAQ copy is inaccurate and the Dashboard FAQ "refreshed every few seconds" claim is false. llms.txt:15 "across multiple exchanges" is not true of the localStorage-only portfolio.
