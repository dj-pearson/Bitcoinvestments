# Review 09: DeFi tools (/lending, /defi-yield, /hardware-wallet, /gas-optimizer)

**Cross-cutting summary:** All four routes are public and indexed. They are listed in `public/sitemap.xml:102,124,138,152`, and `/defi-yield` and `/gas-optimizer` have `changefreq daily`. None of them is covered by `staticGuard` (`src/App.tsx:224,229-231`). Three of the four show **fabricated numbers as if they were real**. `/defi-yield` and `/gas-optimizer` generate APYs, TVLs and gas prices with `Math.random()` on every load. `/lending` hardcodes APYs and invented "trust scores", and it shows its own affiliate commission to readers as a "bonus". This is a serious YMYL and trust problem. The site already has a working live gas service (`src/services/gasPrice.ts`, public RPC plus a CoinGecko proxy). `/gas-optimizer` does not use it; it uses the fake `gasOptimizer.ts`. All four pages promote premium tiers ($4.99 to $19.99/mo, "AI-powered predictions", "API access") and link to `/pricing`. `src/pages/Pricing.tsx` has no gas, DeFi or hardware-wallet plans (grep finds none), and nothing can be bought on the static site. None of the pages has FAQ or breadcrumb schema, a "last updated" date, a BLUF summary, internal links to guides, or prerenderable text.

---

### /lending — src/pages/LendingComparison.tsx + src/services/lendingComparison.ts
- **Purpose / target query:** "crypto lending rates", "best stablecoin interest", "Aave vs Compound vs Nexo".
- **Verdict:** Poor. Hardcoded, stale rates are presented as a live comparison, and the affiliate-commission figures are shown to users as bonuses.
- **Up-to-date issues:**
  - Every rate is a hardcoded demo constant with no date: `lendingComparison.ts:524-608` (for example Aave USDC 4.25%, Nexo USDC 8.0%, Nexo BTC 5.0%). The page imports only `DEMO_LENDING_PLATFORMS` / `DEMO_LENDING_RATES` (`LendingComparison.tsx:2-6,13`).
  - The file header comment still lists Celsius as a comparison platform (`lendingComparison.ts:4`). Celsius is bankrupt. It does not appear in the UI data. No defunct lender (Celsius, BlockFi, Voyager, Genesis) is shown as an option, but the page also never mentions those failures, which is the main risk context for CeFi lending.
  - The Nexo claims "Insured", "$375M insurance coverage" and "Licensed in multiple jurisdictions" (`lendingComparison.ts:508-510`) are unsourced. Nexo's availability differs by country: it left the US in 2022-23 and later announced a US return. The 8% USDC rate depends on loyalty tier and holding NEXO tokens, and the page does not say so. NEEDS-OWNER to verify.
  - Utilization rates for a CeFi lender (Nexo 85% / 70%, `:596,606`) are made up. CeFi platforms do not publish this figure.
  - `getBestStablecoinYields` includes BUSD and TUSD (`:430`). BUSD has been wound down and TUSD has lost its peg and been delisted in places.
  - Compound V3 is listed with a $500 CPA (`:492`) and Aave with a 10% revenue share (`:469-470`). Neither protocol runs an affiliate program like this, so these figures look invented. NEEDS-OWNER.
- **SEO issues:**
  - The rendered title "Crypto Lending Comparison - Compare Interest Rates | Bitcoinvestments" is 69 characters (`src/lib/seo.ts:363` plus the suffix from `SEO.tsx:109`). Limit is 60.
  - There is no tool, Dataset, FAQ or Breadcrumb schema. PageSEO is called without `isTool` or `faqs` (`LendingComparison.tsx:52`).
  - Outbound "links" are `<button>`s that call `window.open` (`:32,141-146,242-247,303-308`). Crawlers cannot follow them, there is no `rel="sponsored"`, and there is no `noopener`, which leaves the page open to reverse tabnabbing.
  - Heading levels: "Best Lending Rate" and "All Rates" are H3s placed directly under an H2 promo banner ("Earn While You Learn", `:66`). There is no H2 for the actual content.
  - No internal links at all.
- **GEO issues:** No answer-first summary (for example "Stablecoin supply rates on Aave/Compound typically range X-Y% as of <date>"). No methodology for the "Trust Score" (`:237-239,274-276`; values like 9.5/9.2/8.5 are arbitrary, `lendingComparison.ts:461,485,507`). No sources, no date, no FAQ. An LLM quoting this page would repeat fabricated "8.00% APY Nexo" as current fact.
- **Static + DB:**
  - The service has a full Supabase layer (`getCurrentRates`, `getRateHistory` and others, `:25-445`; tables exist in `supabase/migrations/202512220000000_create_advanced_monetization_features.sql:209,253`). The page never calls it, so DB reads are dead code.
  - The only DB call is `trackAffiliateClick` (`LendingComparison.tsx:20`), and it is not guarded by `isSupabaseConfigured()`. On the static site it sends a request to `placeholder.supabase.co` (`src/lib/supabase.ts:13`) and waits for it to fail before `window.open` runs. Because the call is no longer inside the user gesture, Safari and Firefox are likely to block the popup.
  - Even with a DB, the insert would fail: `platform_id` receives the string `'nexo'` / `'aave-v3'`, but the column is a UUID foreign key (migration line ~297).
- **Uniqueness / content gaps:** Three platforms, two of them hardcoded for most assets, is thin. It needs a CeFi-vs-DeFi risk explainer that covers the Celsius, BlockFi, Voyager and Genesis collapses (2022) and what "insured" does and does not mean. It also needs an LTV and liquidation explainer (the data already has `max_ltv` and `liquidation_threshold` but never displays them), plus a borrow-cost calculator.
- **Bugs:**
  - The "Best Lending Rate" and "Cheapest Borrowing Rate" cards are hardcoded to "8.00% APY / Nexo" and "5.50% APY / Compound V3" whatever the selected asset (`LendingComparison.tsx:138-139,154-155`, CTAs `platforms[2]`/`platforms[1]`). For ETH it shows Nexo at 8% although Nexo has no ETH rate in the data. For BTC it shows Compound at 5.5% although Compound has no BTC entry.
  - DAI and USDT (`:15`) have no rates, so the table body is empty with no empty-state message (`:189-192`).
  - "Earn up to ${affiliate_cpa_amount} bonus" (`:310-314`) shows the site's own CPA commission ($500/$1000) to users as their bonus. "Potential bonuses up to $5,000" (`:72-73`) has no basis. Both are misleading, and this is a potential FTC deceptive-advertising issue.
  - `hover:bg-gray-750` (`:195`) is not a Tailwind class.
  - The page uses dark-only styling (`bg-gray-900`) while the other three tools support light and dark themes.
- **Recommended fixes:**
  - **P0:** Delete the "$5,000" banner (`:62-76`) and the "Earn up to $X bonus" line (`:310-314`). Replace them with a plain affiliate disclosure. Remove the hardcoded best-rate cards (`:133-165`) or compute them from the data for the selected asset.
  - **P0:** Replace the demo rates with real data. The free, keyless DefiLlama Yields API (`https://yields.llama.fi/pools`, filtered by `project in [aave-v3, compound-v3, spark, morpho...]` and `symbol`) returns supply APY (`apyBase`, `apyReward`), TVL and a timestamp. Fetch it at build time into `src/data/lendingRates.json`, or in a Cloudflare Pages Function with caching like `functions/api/coingecko`. Show "Rates as of <timestamp>, source: DefiLlama". DefiLlama also has lend/borrow data (`/lendBorrow`). For CeFi (Nexo), show "variable, tier-dependent, see provider" instead of a number unless the owner keeps a dated value. NEEDS-OWNER for CeFi.
  - **P0:** Guard `trackAffiliateClick` with `isSupabaseConfigured()`, fire it without awaiting, and render real `<a href target="_blank" rel="sponsored noopener noreferrer">` links.
  - **P1:** Remove Trust Score or publish its methodology. Remove the made-up CeFi utilization values. Remove BUSD and TUSD from `:430`, and update the header comment at `:4`.
  - **P1:** Add a static content block with a BLUF, a "CeFi lender failures 2022" callout, an LTV/liquidation section, and 5-6 FAQs passed through `faqs`. Pass `isTool`. Shorten the title (for example "Crypto Lending Rates Compared" = 47 characters with the suffix). Link to `/learn/defi-basics`, `/learn/defi-risks` and `/staking-calculator`.
  - **P2:** Give an empty state for assets that have no rates, fix the heading hierarchy, and support the light theme.

---

### /defi-yield — src/pages/DeFiYield.tsx + src/services/defiYield.ts
- **Purpose / target query:** "best DeFi yields", "DeFi APY comparison", "impermanent loss calculator".
- **Verdict:** Poor. Every APY, TVL and IL figure in the pool table is `Math.random()` output, and the numbers change on every reload.
- **Up-to-date issues:**
  - The pool data is random: `defiYield.ts:278-286` (Aave), `:325-335` (Uniswap), `:362-364,397-399` (Lido, Rocket Pool), `:433-443` (Curve). It is generated once when the module loads (`:458`), and each pool is stamped `last_updated_at: new Date()`, which makes it look fresh.
  - Protocol TVLs are hardcoded snapshots (`:89` Aave $12.5B, `:133` Lido $32B, and others) with made-up `tvl_change_24h/7d`. The page adds them up into "Total TVL Tracked" (`DeFiYield.tsx:127-130`).
  - Lido is listed on `polygon` and `solana` (`defiYield.ts:132`). Lido on Solana was wound down in 2023, and Lido on Polygon has also been wound down.
  - Only Uniswap **V3** is listed (`:103`). Uniswap V4 launched in January 2025.
  - GMX is shown with no V1/V2 distinction (`:212-233`). GMX V1 was exploited in July 2025. Verify before listing.
  - The affiliate URLs `?ref=bitcoinvestments` for Aave, Lido and GMX (`:97,141,229`) are unlikely to be real referral programs; Aave has none. NEEDS-OWNER.
- **SEO issues:**
  - The H1 "DeFi Yield Aggregator" (`DeFiYield.tsx:103-105`) does not match the title "DeFi Yield Farming - Compare APY Rates" (`seo.ts:269`). The title is 57 characters, which is fine.
  - No tool, Dataset or FAQ schema (`:97`).
  - Affiliate `<a>` tags have no `rel="sponsored"` (`:182-186,583-587`).
  - The only internal link is `/pricing`. Link to `/learn/yield-farming`, `/learn/defi-risks`, `/learn/defi-basics` and `/staking-calculator`.
  - Sitemap `changefreq daily` signals live data that does not exist.
- **GEO issues:** There is no explanatory text beyond one sentence. The IL reference table (`defiYield.ts:640-649`) is correct (I checked it against the formula) and quotable, but it is hidden inside a modal. No date, no sources, no definition of APY vs APR or of base vs reward APY. Risk levels (`low` for all Aave and Curve pools) have no stated methodology.
- **Static + DB:** No DB is used, and none is needed. The page never breaks, but that is only because it runs entirely on random data. `trackAffiliateClick` only calls `console.log` (`defiYield.ts:715`).
- **Uniqueness / content gaps:** The pool table would be a useful tool if the data were real. The IL calculator is the one real feature and should be a visible section on the page, not a modal. Add "IL vs fees breakeven", an explainer on why high APYs are high (emissions, IL, depeg risk), and a stablecoin-vs-volatile risk matrix.
- **Bugs:**
  - `apy_total` is drawn independently of `apy_base + apy_reward` (`defiYield.ts:278-280,325-327,433-435`). A row can read "4.10% total, 6.20% base + 1.50% rewards" (`DeFiYield.tsx:310-314`).
  - "Protocols Tracked: 8" (`:116`), but Compound, Yearn and GMX have no pools. The type filters "Vaults" and "Yield Farms" (`:235-236`) and the chains Avalanche, BNB, Base and Solana (`defiYield.ts:25-28`) always return "No pools found".
  - Curve "3pool" is parsed as `token_a='3pool', token_b='DAI'` (`:427-431`).
  - Uniswap's 0.3% **swap** fee is stored as `withdrawal_fee: 0.3` (`:339`) and appears as a con, "0.3% withdrawal fee" (`:560`). That is factually wrong: LPs earn that fee rather than pay it.
  - "IL risk score" is a random 20-60% (`:335`) shown as a real percentage in the modal (`DeFiYield.tsx:576`).
  - `estimateImpermanentLoss` returns NaN below -100% (`defiYield.ts:633-634`). The slider caps at -90 so the UI is safe, but the exported function is not.
  - The modals have no `role="dialog"`, no Escape handling, no focus trap, and their × buttons have no `aria-label` (`DeFiYield.tsx:410,487`).
- **Recommended fixes:**
  - **P0:** Replace `generateDeFiPools()` with DefiLlama Yields (`https://yields.llama.fi/pools`, free, CORS-enabled, and it already includes `apy`, `apyBase`, `apyReward`, `tvlUsd`, `ilRisk`, `stablecoin`, `exposure`, `predictions`, `chain`, `project`). Either fetch client-side with a loading/error state, or snapshot at build time into `src/data/defiYields.json` so the table works with JavaScript disabled and can be prerendered. Show a "Data: DefiLlama, updated <time>" line. Get protocol TVL from `https://api.llama.fi/protocol/<slug>`. If fetching is not possible, delete the table and keep an honest static educational page with the IL calculator.
  - **P0:** Remove the premium upsell (`:348-375`) and the `DEFI_YIELD_PRICING` claims ("Real-time APY tracking", "API access"). They cannot be purchased.
  - **P1:** Make the IL calculator an inline section with its own H2. Add a fees-earned input (the `calculateImpermanentLoss` function already exists at `defiYield.ts:585`) and FAQ schema ("What is impermanent loss?", "Why are some DeFi APYs so high?"). Add `isTool`. Align the H1 with the title.
  - **P1:** Fix the protocol list: remove Lido on Polygon and Solana, add Uniswap V4, mark GMX V1/V2 status, and drop or verify the `?ref=` links (NEEDS-OWNER). Remove chain and type filter options that have no data.
  - **P2:** Add `rel="sponsored"` to affiliate links, accessible modals, and fix Uniswap's `withdrawal_fee`.

---

### /hardware-wallet — src/pages/HardwareWallet.tsx + src/services/hardwareWallet.ts
- **Purpose / target query (per meta):** "best hardware wallet", "Ledger vs Trezor". The page itself is an upsell for a "$14.99/mo Hardware Wallet Integration" tracker.
- **Verdict:** Poor. The meta promises a comparison guide, but the page is an upsell for a subscription that cannot be bought, with a stale product list.
- **Up-to-date issues:**
  - Product list (`hardwareWallet.ts:72-86`):
    - Trezor Model T ($219) was replaced by the Trezor Safe 5 in 2024 and is discontinued.
    - Trezor Model One has been superseded by the Safe 3. Check current availability.
    - Ledger Stax is listed at $279 (its launch price). It has sold for about $399 for some time.
    - Missing models: Ledger Flex, Trezor Safe 5, and any late-2025 releases (Ledger Nano Gen5, Trezor Safe 7). NEEDS-OWNER to confirm current models and prices.
    - The add-wallet modal offers only Ledger, Trezor, KeepKey and Coldcard (`HardwareWallet.tsx:459`). BitBox02, Keystone, Jade and Tangem are missing.
  - The feature list promises "Connect up to 2 hardware wallets" and "Real-time balance tracking" (`hardwareWallet.ts:34-40`). Web3 and wallet-connect features were removed from the site, and this is the same kind of feature.
  - Hardcoded BTC $45,000 and ETH $2,500 (`:309`), and block number 18,000,000 (`:342`).
- **SEO issues:**
  - The meta title and description say "Hardware Wallet Guide ... Compare Ledger, Trezor" (`seo.ts:297-299`), but the H1 is "Hardware Wallet Integration" with a PREMIUM badge (`HardwareWallet.tsx:132-137`). Search intent and page content do not match.
  - The rendered title is 61 characters.
  - No Product, ItemList or FAQ schema. No `rel="sponsored"` on the "Shop" links (`:364-368`).
  - The page never links to the existing wallet data and comparison pages (`src/data/wallets.ts`, `/compare`) or to `/learn/crypto-wallets-explained`.
- **GEO issues:** There is no guide content: no BLUF ("A hardware wallet keeps your private keys offline..."), no comparison table (price, screen, open-source firmware, secure element, Bluetooth, coin support), no buying-safety advice (buy direct, never accept pre-seeded devices), no date.
- **Static + DB:**
  - The service has no DB layer. Everything is module-level arrays (`hardwareWallet.ts:21-22`) that are lost on reload.
  - `subscription` is permanently `null` (`HardwareWallet.tsx:52`), so `hasAccess` is always false and the whole premium branch (`:186-341`) is unreachable dead code.
  - If that branch were enabled, it would show fabricated data. Balances are `Math.random()` (`hardwareWallet.ts:307-310`) and the portfolio total is $25k plus a random amount (`:372-373`). Transactions have random hashes and fake `0xaaa…/0xbbb…` counterparties (`:337-355`). The CSV "for tax reporting" export (`:426-477`) would export these invented transactions. That is dangerous.
  - `detectHardwareWallet` (`:137-173`) is simulated and never used.
- **Uniqueness / content gaps:** This should be a comparison and buying guide. It could reuse `src/data/wallets.ts`, which already holds Ledger and Trezor entries, but that file has its own stale Model T entry at `:106-108` and Model One at `:156`. Suggested sections: comparison table, "which one for you" (Bitcoin-only vs multi-coin, budget, Bluetooth yes/no), setup checklist, seed-phrase backup (metal plates), Ledger Recover controversy, and FAQs.
- **Bugs:**
  - In the dead branch, "Sync All" does nothing unless a wallet was first selected through "View Addresses" (`HardwareWallet.tsx:87-88`).
  - `URL.createObjectURL` is never revoked (`:109`).
  - Adding a wallet silently does nothing when logged out (`:384`).
  - The modal × buttons have no `aria-label` (`:401,450`).
- **Recommended fixes:**
  - **P0:** Rewrite the page as a static "Best Hardware Wallets (2026)" guide. Remove the premium upsell and the tracker UI, or move them behind `staticGuard`. Delete or quarantine the fake `syncWalletBalances`, `getTransactionHistory`, `getPortfolioSummary` and `exportWalletData`, because they fabricate financial records.
  - **P0:** Update the product list in `hardwareWallet.ts:68-89` and `src/data/wallets.ts` to current models and prices, with a "prices checked <date>" note. NEEDS-OWNER for affiliate IDs (`?r=bitcoinvestments`, `?offer_id=`) and final prices.
  - **P1:** Add ItemList/Product plus FAQPage and Breadcrumb schema, a visible "Last updated" date, and `rel="sponsored noopener"`. Align the H1 with the title ("Hardware Wallet Comparison"). Link to `/compare` and `/learn/crypto-wallets-explained`.
  - **P2:** If a tracker is ever built, use public, keyless read-only sources (mempool.space for BTC xpub/address balances, a public RPC for ETH balance) behind a real subscription and DB. Never use random fallbacks.

---

### /gas-optimizer — src/pages/GasOptimizer.tsx + src/services/gasOptimizer.ts (gasPrice.ts unused here)
- **Purpose / target query:** "ETH gas price now", "gas fee tracker", "cheapest time to send ETH".
- **Verdict:** Poor. The page shows random gas prices on a 30-second "live" refresh, while a real RPC-based service already exists in the repo.
- **Up-to-date issues:**
  - Gas values are random: `gasOptimizer.ts:117-125`. Ethereum is 25-45 gwei, well above typical 2025-26 mainnet base fees (usually low single-digit gwei or below after the gas-limit increases), and Polygon is 50-150 gwei.
  - Native prices are hardcoded (`:85-88`: ETH $2500, MATIC $0.85, AVAX $35, BNB $310).
  - MATIC was renamed POL (September 2024). Both `gasOptimizer.ts:21` and `gasPrice.ts:30-32` still use `MATIC` and CoinGecko id `matic-network`; the POL id is `polygon-ecosystem-token`.
  - **Post-Dencun L2 fees:** both services price L2 transactions as `gasPrice × gasUnits` (`gasOptimizer.ts:153-160`, `gasPrice.ts:170-177`). That leaves out the L1 data/blob fee that Arbitrum, Optimism and Base charge. Since EIP-4844 (March 2024) that fee is small but usually the largest part of an L2 fee.
  - The "Gas is typically lowest on weekends and between 2-6 AM UTC" heuristic (`GasOptimizer.tsx:414`, `gasOptimizer.ts:211-216`) comes from 2021-22 and is presented as a prediction.
  - Block number is hardcoded at 18,500,000 (`:260`).
- **SEO issues:**
  - The title is 68 characters (`seo.ts:283` plus the suffix).
  - SoftwareApplication schema is present (`isTool`, `GasOptimizer.tsx:104`), which is good. There is no FAQ or Breadcrumb schema.
  - The description claims "Real-time gas prices" (`seo.ts:285`), and `public/llms.txt:42` calls it an "Ethereum gas price tracker". Both are false today.
  - The only internal link is `/pricing`.
- **GEO issues:** No explanation of base fee vs priority fee, gwei, EIP-1559, or why L2s are cheaper. No sourced numbers or date. The tips section is three bullets.
- **Static + DB:** No DB. Alerts are an in-memory `Map` (`gasOptimizer.ts:76`) with no delivery mechanism. On the static site `user` is null, so "Create Alert" silently does nothing (`GasOptimizer.tsx:442`) even though the + button and modal open. "Email & push notifications" and "Transaction scheduling" (`gasOptimizer.ts:59-60`) cannot work. The premium upsell promises "AI-powered predictions" and "save up to 50%" (`GasOptimizer.tsx:268`); these are simulated with `Math.random()` confidence (`gasOptimizer.ts:186`).
- **Uniqueness / content gaps:** A real multi-chain fee table with USD cost per action (transfer, swap, bridge) side by side across L1 and L2s would be useful and differentiated. Also add an "L1 vs L2 cost" explainer and the Bitcoin fee rate (mempool.space `/api/v1/fees/recommended`, which is free and CORS-enabled). BTC is missing entirely, although the site is Bitcoin-focused.
- **Bugs:**
  - **Wrong cost math:** `estimateTransactionCost` maps any type other than `eth_transfer` or `uniswap_v3_swap` to `nft_mint_cost_usd` (`gasOptimizer.ts:373`). The "Token Transfer" (65k gas), "Stake" (120k) and "Deploy Contract" (1.5M) cards (`GasOptimizer.tsx:196-200`) all show the NFT-mint (150k gas) USD cost, while the gas figure under each card is correct.
  - A 30-second `setInterval(loadData)` (`:59`) sets `isLoading=true` (`:70`), which replaces the whole page with a spinner every 30 seconds and then shows new random numbers.
  - The wait-time label renders a double tilde, "~~2 minutes" (`:181` prepends "~" to strings that already start with "~" at `gasOptimizer.ts:421-428`).
  - Priority fee is modelled as a percentage of base fee (`:99-106`), which is not how EIP-1559 works.
  - The modal × buttons have no `aria-label` (`GasOptimizer.tsx:459,488`).
- **Recommended fixes:**
  - **P0:** Switch the page to `getAllGasPrices()` from `src/services/gasPrice.ts`. It already uses live `eth_gasPrice` and `eth_feeHistory` over publicnode RPC plus the `/api/coingecko` proxy (`functions/api/coingecko/[[path]].ts`), with caching and fallback. `GasPriceTracker` on the Dashboard already uses it. Treat the zero-value fallback (`gasPrice.ts:284-299`) as "unavailable" rather than "$0.00". Delete the random `getCurrentGasPrices`, `getGasPricePredictions` and `getGasPriceHistory` from `gasOptimizer.ts`.
  - **P0:** Fix `estimateTransactionCost` (`gasOptimizer.ts:364-381`) to compute `gasPrice × GAS_USAGE_ESTIMATES[type] × nativePrice` directly. Stop the loading flash by keeping existing data during background refresh (`GasOptimizer.tsx:70`).
  - **P0:** Remove the premium upsell, the "AI predictions" and "save up to 50%" claims, and the alerts UI, or show alerts behind `staticGuard` or a "coming soon" note. They cannot work without auth and a notification backend.
  - **P1:** Add the L2 L1-data fee. For OP Stack chains (Optimism, Base), call `GasPriceOracle.getL1Fee` at `0x420000000000000000000000000000000000000F`. For Arbitrum, use `eth_estimateGas` for a sample transaction, which includes the L1 component. Otherwise label L2 costs as "execution fee only, excludes L1 data fee". Rename MATIC to POL and change the CoinGecko id to `polygon-ecosystem-token`. Add BTC fees from mempool.space.
  - **P1:** Add a static explainer (gwei, base vs priority fee, why L2s are cheaper since Dencun) with FAQ schema and a "data source: public RPC, updated <time>" label. Shorten the title (for example "Live Gas Fee Tracker (ETH & L2s)"). Correct `llms.txt` and the meta description if live data is not shipped. Remove the "2-6 AM UTC" claim, or back it with real historical data (for example Etherscan gas oracle history). NEEDS-OWNER if an API key is required.
  - **P2:** Fix the double tilde, add modal accessibility, and link to `/learn/defi-basics` and `/calculators`.

---

### Suggested real data sources (all free and keyless, and usable from a Cloudflare Pages Function or at build time)
- **DefiLlama Yields** `https://yields.llama.fi/pools`: lending supply APY and pool APYs for /lending and /defi-yield.
- **DefiLlama** `https://api.llama.fi/protocol/{slug}` and `/protocols`: protocol TVL.
- **Public EVM RPC** (publicnode, already configured in `gasPrice.ts`): `eth_feeHistory`. OP Stack `GasPriceOracle` for the L1 data fee.
- **mempool.space** `/api/v1/fees/recommended`: BTC fees.
- **CoinGecko** via the existing `/api/coingecko` proxy: native token prices.
- Where the owner does not want runtime fetching, use a scheduled build step that writes dated JSON to `src/data/`, and show its "as of" date on the page.
