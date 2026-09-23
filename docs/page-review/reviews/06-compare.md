# 06 — Compare (exchanges & wallets)

Scope: `/compare`, `/compare/:type/:id` (src/pages/Compare.tsx), src/data/exchanges.ts, src/data/wallets.ts, src/components/reviews/*, src/services/reviews.ts, src/components/AffiliateDisclosure.tsx.
Facts checked against public sources as of 2026-09-23 (web search; sources listed at the end). The last commit in the repo that touched the data files is 2026-01-02. No field in the data model records when a fact was last checked.

---

### /compare — src/pages/Compare.tsx (L62-442)

- **Purpose / target query:** "best crypto exchange", "crypto exchange comparison", "best crypto wallet / hardware wallet comparison".
- **Verdict:** Poor. The listing looks tidy, but paid placements are presented as rankings, the facts are stale, and the fields labelled "ratings/reviews" hold invented numbers.

**Up-to-date issues** (details per product in the fact table below)
- Stale fees: Kraken's taker fee shows 0.26% but is 0.40% at the entry tier (exchanges.ts:82-83). Binance.US shows 0.10% but is now 0% maker and 0.01-0.02% taker (exchanges.ts:142-143). Crypto.com shows 0.40/0.40 but is 0.25% maker / 0.50% taker (exchanges.ts:254-255). Coinbase Advanced changed its fee schedule on 2026-09-16 (exchanges.ts:359-360). Gemini's fee schedule has changed too, so re-check gemini.com/fees (exchanges.ts:194-195).
- Discontinued or renamed products:
  - Trezor Model T was removed from Trezor's shop on 2026-01-08 (wallets.ts:105-151).
  - Coinbase NFT marketplace was sunset on 2024-08-01, but `nft_marketplace: true` (exchanges.ts:37).
  - Gemini Earn is listed as "paused" (exchanges.ts:228) with `earn_program: true` (exchanges.ts:208). It ended in 2022-23 and users were repaid in 2024.
  - BlueWallet's Lightning service (LndHub) was sunset in April 2023, but "Lightning Network" is still listed as a supported chain and as a pro (wallets.ts:446, 469).
  - "Ledger Live" was renamed "Ledger Wallet" in October 2025 (wallets.ts:43).
  - "Coinbase Pro" survives as id `coinbase-pro` (exchanges.ts:347). That product shut down in 2023.
- Current products missing from the list: Trezor Safe 3, Safe 5 and Safe 7 (Safe 7 launched 2025-10-21 at $249). Ledger Nano Gen5 ($179, October 2025), Ledger Flex and Ledger Stax.
- Security incidents missing from the cons:
  - Trust Wallet's Chrome extension v2.68 was compromised on 2025-12-24/26, with about $7-8.5M stolen (users were reimbursed).
  - Ledger Connect Kit supply-chain attack (December 2023) and the Ledger Recover controversy (2023). Only the 2020 data breach is mentioned (wallets.ts:50).
- `sponsored.sponsor_since` dates are 2024 and `monthly_fee` values appear in client code (exchanges.ts:61-67, 121-127, 233-239). These look like placeholder data (see SEO/trust below).
- public/sitemap.xml:31 lists /compare with lastmod 2026-02-08. The detail URLs say 2026-09-10 (sitemap.xml:319+) even though the data has not changed since January. The lastmod values are not accurate.

**SEO issues**
- **The tab state lives only in `useState` (Compare.tsx:64).** The page never reads `?tab=`/`?type=`/`?filter=`. As a result:
  - The Header (Header.tsx:61-62), Footer (Footer.tsx:125), Learn.tsx:294 and InternalLinks.tsx:236-238, 318 all link to `/compare?tab=wallets`, `?type=wallets`, `?filter=fees` or `?filter=beginners`. Every one of them lands on the Exchanges tab.
  - Wallet content is never in the initial DOM, so crawlers never see it.
- Broken internal links:
  - `src/services/riskAssessment.ts:425` links to `/compare/wallets`, which matches no route and gives a 404.
  - `public/llms.txt:59` links to `/compare/tax-software`, which is also a 404. llms.txt:57 also promises "Coinbase vs Kraken vs Binance" content, which does not exist.
- The FAQPage schema (Compare.tsx:92-105) describes 3 Q&As that are **not rendered on the page**. Structured data must match visible content.
- Heading hierarchy: H1 "Compare Platforms" (L123-125) jumps straight to card H3s (L224, L353), with no H2. The H1 has no keyword. Something like "Best Crypto Exchanges & Wallets Compared (2026)" would work better.
- Title "Compare Crypto Exchanges & Wallets | Bitcoinvestments" is 53 characters, which is fine. It duplicates `PAGE_METADATA.compare` in src/lib/seo.ts:109, which Compare does not use (two sources of truth).
- No ItemList schema for the ranked list.

**GEO issues**
- There is no BLUF answer such as "Best overall / best for low fees / best for beginners". `getBestExchangeFor` and `getBestWalletFor` exist (exchanges.ts:514, wallets.ts:569) but are never used.
- No methodology for "Trust Score". Sponsors get 10/10, and nothing explains how the score is derived.
- No visible "last updated" date, author or reviewer, and no source links for fees.
- The SPA serves an empty index.html to non-JS crawlers and there is no prerender step (package.json:9 is plain `vite build`). The whole table, the verdicts and the FAQ need to be prerendered or generated statically.

**Static + DB**
- The listing renders fully from static data with no DB, which is good.
- `user_rating` and `review_count` (e.g. Coinbase 4.2 / 15,420; Trust Wallet 67,800) are hard-coded constants shown as "reviews" (Compare.tsx:250-253, 377-385). They do not come from `platform_reviews` and there is no source. **These are fabricated ratings presented as real user data**, which is a YMYL and trust problem.

**Uniqueness / content gaps**
- The page is a thin card grid with the same shape as any affiliate list. It has:
  - no head-to-head table
  - no US-availability or state data
  - no spread modelling (Robinhood and Uphold show "0.00%" fees and sort as cheapest, L183, although their cost is in the spread)
  - no worked fee example
  - no "who it's for"

**Bugs**
- **Paid placement is disguised as ranking.** Sponsored entries are force-sorted first regardless of the chosen sort (L169-176) and numbered "1, 2, 3" (L219-221). Under "Sort by Fees (Low to High)", Coinbase at 0.60% ranks #1. The badges say "Featured", "Recommended" or "Partner", and "Sponsored placement" appears only in a hover tooltip (L50-55). That tooltip is not keyboard- or screen-reader-accessible (no tabindex, role or aria). Meanwhile the "prominent" disclosure says affiliate relationships "do not influence our ratings" (AffiliateDisclosure.tsx:59-60). The page contradicts itself, and this is an FTC-disclosure risk.
- **Placeholder affiliate URLs are live.** Every `affiliate_url` contains a literal `AFFILIATE_ID` (exchanges.ts:15, 75, 135, 187, 247, 299, 352, 404; wallets.ts:14, 62, 110, 158). Compare.tsx:427, 527 and 772 link to them directly, with `rel="sponsored"` and an "Affiliate" badge. The env-driven `src/services/affiliate.ts` (tracking IDs via `VITE_*_AFFILIATE_ID`) and `AffiliateLink`/`trackAffiliateClick` are not used here, so clicks are neither tracked nor valid.
- `sponsored.monthly_fee` and `affiliate_commission` are shipped in the public JS bundle.
- Two different `SponsoredBadge` components exist, with different labels (Compare.tsx:19 and AffiliateDisclosure.tsx:141).
- a11y:
  - The sort `<select>` has no label (L195).
  - The tabs have no `role="tablist"` or `aria-selected` (L132-157).
  - Logos are never rendered, and `/images/exchanges/*` and `/images/wallets/*` do not exist in public/ (but they are used in schema, see below).

---

### /compare/:type/:id — src/pages/Compare.tsx (L66-89, 445-914)

- **Purpose / target query:** "<Coinbase> review", "<Kraken> fees", "<Ledger Nano X> review", "is <X> safe".
- **Verdict:** Poor. The schema is fabricated and violates Google's guidelines, the unknown-id path is a soft 404, the reviews UI cannot work on the static site, and several product facts are wrong.

**Up-to-date issues** — see the fact table. On the detail pages specifically:
- The "BTC Withdrawal: Free" label for Coinbase and Gemini (L638-640) hides network fees.
- The 'Fiat Withdrawal $25' for Crypto.com (exchanges.ts:259) looks wrong or is unverified.

**SEO issues**
- **Unknown id → soft 404** (L80-88):
  - It returns 200 with an inline "Platform Not Found" and no `<SEO>`. Robots stays `index, follow` from index.html:65, the canonical is left as whatever the previous page set (or `/`), and the title is not updated.
  - `/compare/foo/bar` (bad type) goes down the same path.
  - Fix: render `<NotFound/>` (NotFound.tsx:47-51 already sets noindex), or `<Navigate to="/404" replace/>`.
- **Product/SoftwareApplication `aggregateRating` uses fabricated numbers** (L447-454, L693-702, via SEO.tsx:536-622): `ratingValue: exchange.user_rating`, `ratingCount: exchange.review_count`.
  - These are hard-coded and do not match the visible reviews section, which shows "No Reviews Yet" without a DB and only real DB reviews with one.
  - This breaks Google's review-snippet rules: ratings must come from reviews that are visible and collected on the page, and must not be misleading. Manual-action risk.
  - The "self-serving review" rule (LocalBusiness/Organization rating itself) is **not** the problem here. These are third-party products. The problem is fabricated and invisible ratings.
- **Wrong schema types:**
  - Hardware wallets (Ledger, Trezor) are emitted as `SoftwareApplication` with `operatingSystem: 'Hardware Device'` (L679-683). They should be `Product` with `brand`, `offers` (price, USD, availability) and `sku`/`model`.
  - Exchanges as `Product` without `offers` or `review` are only valid for rich results because of the fake aggregateRating.
  - `image` points to non-existent `/images/exchanges/*.svg` and is relative, not absolute (L450).
- The meta description claims "Read 15,420 user reviews" (L484). That is false.
- Titles run over 60 characters: exchange titles are 64-75 characters (Coinbase Advanced 75), wallet titles 72-82 (Ledger Nano S Plus 82) (L483, L731). Suggested pattern: `${name} Review 2026: Fees & Safety` or `${name} Review: Price, Security, Coins`.
- The FAQPage schema (L464-477, L712-725) is not rendered visibly. The wallet "Is X secure" answer is grammatically broken when flags are false ("… with and open-source code").
- The breadcrumb has "Exchanges" and "Wallets" items pointing at `/compare`, the same URL as the previous crumb (L459, L707).
- The H1 is just the product name (L504, L766). Something like "Coinbase Review (Sept 2026)" would be better.
- `functions/api/sitemap.ts:61-80` hard-codes the id lists separately from src/data. That will drift, for example when Trezor Model T is removed or Safe 5 is added.

**GEO issues**
- A "review" page with no editorial review: one description sentence plus boolean grids. It has:
  - no verdict or BLUF
  - no "who it's for / not for"
  - no US-state availability
  - no fee sources or "last verified" date
  - no author
- The FAQ answers are templated from the same fields on every page.

**Static + DB**
- Without a DB:
  - `getReviews` and `getReviewStats` return empty/null (reviews.ts:52-54, 113-115), so ReviewSection shows "No Reviews Yet — Be the first…" (ReviewSection.tsx:161-178). A few centimetres above, the stats card says "15,420 Reviews" (Compare.tsx:558-561). The page contradicts itself.
  - "Write the First Review" leads to "Sign In" and then `/login`, which is `staticGuard` → ComingSoon under `STATIC_MODE = true` (App.tsx:185, ReviewForm.tsx:115-126). The page promises a feature that cannot work.
- With a DB:
  - Reads approved `platform_reviews` with sort and pagination, which is correct in principle. Errors are swallowed: `getReviews` returns `error` but ReviewSection ignores it (L32), so there is no error state.
  - **No `CREATE TABLE platform_reviews` exists in supabase/migrations.** Only RLS in `20260128000000_comprehensive_rls_security.sql:552-587` and indexes. The `increment_review_helpful` RPC called in reviews.ts:305 is not defined in any migration either.
  - The join `users!platform_reviews_user_id_fkey(email, …)` (reviews.ts:60) tries to send reviewers' **email addresses** to every visitor. `users` RLS only permits reading your own row (20241218_create_users_table.sql:32), so in practice other users show as "Anonymous User". Either way, emails are the wrong data to request.
  - SELECT is explicitly granted only to `authenticated` (migration :800). Anonymous reads depend on Supabase's default public-schema grants, so verify this.
  - The "Premium" badge on `verified_user` means "paid subscriber", not "verified user of this platform" (reviews.ts:175, ReviewCard.tsx:54-59). That is misleading in a review context.

**Uniqueness / content gaps** — see "Suggested unique content" below.

**Bugs**
- **"Load more" pagination is off by one.** `handleLoadMore` calls `setPage(prev+1)` and then `loadReviews(false)`, which reads the stale `page` from the closure (ReviewSection.tsx:69-72, 31). The first click re-fetches page 0, which duplicates reviews and triggers React duplicate-key warnings. `hasMore` is computed from the same stale value (L45).
- Double fetch on mount: the `sortBy` effect (L64-67) runs alongside `loadData` (L59-62).
- **ReviewCard renders a stray "0"**: `{(review.pros?.length || review.cons?.length) && …}` (ReviewCard.tsx:91). `submitReview` stores `[]` rather than null for empty lists (reviews.ts:186-187), so the expression is `0 && …` and React prints `0`.
- "Helpful" can be clicked once per page load by anyone, including logged-out users. The UI increments even when the call fails (ReviewCard.tsx:16-22, reviews.ts:296-326 always returns `error: null`). The fallback path does a read-modify-write that RLS will block for non-owners.
- `SponsoredBadge` tooltip a11y, as on the listing page. Star icons have no text alternative in ReviewSection's distribution (the numbers are present, but not tied to the stars).

---

### Fact verification table (verified 2026-09-23 unless noted; add a `last_verified` field per entry)

| Item | Repo says (file:line) | Current (Sept 2026) | Action |
|---|---|---|---|
| Kraken Pro fees | 0.16% / 0.26% (exchanges.ts:82-83) | 0.25% maker / 0.40% taker at $0-10K | Update |
| Kraken features | no US futures; "never been hacked" (exchanges.ts:91, 107) | US derivatives offered since 2025; US staking resumed after the SEC dropped its case in 2025 (verify) | Verify/update |
| Binance.US fees | 0.10% / 0.10% (exchanges.ts:142-143) | 0% maker; 0.01% taker on the Tier 0 pair, 0.02% on other pairs | Update |
| Binance.US status | "Regulatory concerns / parent legal issues" (exchanges.ts:173-176) | USD deposits and withdrawals restored in Feb 2025; SEC case dismissed in 2025 (verify); still excluded in some states | Rewrite cons with specifics and a state list (NEEDS-OWNER to confirm the list) |
| Binance.US debit card | `debit_card: true` (exchanges.ts:155) | No US Binance card known | Verify, likely false |
| Coinbase NFT | `nft_marketplace: true` (exchanges.ts:37) | Sunset 2024-08-01 | Set false |
| Coinbase fees | 0.40/0.60 (exchanges.ts:22-23) | These are the Advanced entry tier. Simple buys cost more (spread plus fee). Advanced fees revised 2026-09-16 | Model the "simple buy" cost separately; re-verify Advanced |
| Coinbase BTC withdrawal "Free" | exchanges.ts:24 | Network fee applies on-chain | Show "network fee" |
| Coinbase Advanced | separate entry id `coinbase-pro` (exchanges.ts:347) | Same account and product as Coinbase | Merge into the Coinbase page (a fees section) or 301 the old id |
| Gemini Earn | "paused" / `earn_program: true` (exchanges.ts:208, 228) | Discontinued; Gemini IPO'd on Nasdaq (GEMI) in Sept 2025 | Update |
| Gemini fees | 0.20/0.40 (exchanges.ts:194-195) | Fee pages changed in 2026; figures reported by third parties conflict | Re-verify on gemini.com/fees (NEEDS-OWNER) |
| Crypto.com HQ | "Hong Kong" (exchanges.ts:250) | Singapore HQ (founded in HK) | Update |
| Crypto.com fees | 0.40/0.40 (exchanges.ts:254-255) | Exchange 0.25% maker / 0.50% taker at the base tier; the app uses spread | Update |
| Crypto.com lending | `lending: true` (exchanges.ts:266) | Crypto credit/lending discontinued | Verify, likely false |
| Robinhood | 20 coins, no staking (exchanges.ts:317, 325, 341) | US ETH/SOL staking since July 2025 (not in CA, NY, WI and some other states); coin list much larger; Legend advanced charts; acquired Bitstamp | Update |
| Ledger Nano X / S Plus | 5,500 coins; "Ledger Live" (wallets.ts:17, 43, 65) | 15,000+ assets claimed; app renamed "Ledger Wallet" (Oct 2025); S Plus works with Android via USB OTG | Update |
| Ledger lineup | Nano X, S Plus only | Nano Gen5 ($179), Flex, Stax also current | Add |
| Trezor Model T | $219, current (wallets.ts:105-151) | Discontinued (removed from shop 2026-01-08; security updates continue) | Replace with Safe 5 / Safe 7 ($249, launched 2025-10-21); keep a "discontinued" note |
| Trezor One | current, $69 (wallets.ts:152-199) | Legacy; Safe 3 is the entry model | Verify availability; add Safe 3 |
| Trezor staking | `staking: false` (wallets.ts:127, 175) | Trezor Suite supports ETH/SOL/ADA staking (verify) | Update |
| MetaMask | "No Bitcoin support", EVM-only (wallets.ts:240-241) | Native BTC since 2025-12-15; Solana since 2025 | Update |
| Phantom | "Relatively new" (wallets.ts:289) | Launched 2021; now also Sui, Monad, etc. | Update |
| Trust Wallet | no HW support, open-source (wallets.ts:314, 324) | Chrome extension compromised Dec 2025 (~$7-8.5M, reimbursed); app is not fully open source; extension supports Ledger | Update cons and flags |
| Exodus | no extension, no dApp browser (wallets.ts:368, 383) | Exodus Web3 extension exists; NYSE American listed (EXOD) | Verify/update |
| Coinbase Wallet | name, "Limited Bitcoin support" (wallets.ts:392, 429) | Renamed "Base app" in July 2025 and **renamed back to Coinbase Wallet on 2026-09-10**; supports BTC, Solana and 10+ networks | Keep the name; update chains/cons; add a note on the rename history |
| BlueWallet | Lightning support (wallets.ts:446, 469) | Custodial Lightning (LndHub) sunset Apr 2023 | Remove or qualify |
| Sponsorships | Coinbase/Kraken/Gemini "Featured/Recommended/Partner" with monthly fees (exchanges.ts:61-67, 121-127, 233-239) | Unknown whether real contracts exist | **NEEDS-OWNER**: if they are not real, delete them. Showing fake sponsorships is misrepresentation |

---

### Recommended fixes (prioritised)

**P0**
1. **Remove fabricated ratings.**
   - Delete `user_rating` and `review_count` from the UI and schema, or replace them with real aggregates from `getReviewStats` (show only when `total_reviews >= N`).
   - Compare.tsx:250-253, 377-385, 451-452, 484, 558-561, 698-699, 732.
   - In `generateProductSchema`/`generateSoftwareSchema` calls, pass rating/count only from DB stats that are visible on the page. Otherwise emit an editorial `review` instead (author = named Person/Organization, `reviewRating` = your score, `positiveNotes`/`negativeNotes` from pros/cons).
2. **Unknown id → real 404.**
   - Compare.tsx:80-88: `return <NotFound />` (or `<Navigate to="/404" replace />`).
   - Also validate `type` ∈ {exchange, wallet}.
   - Consider a Cloudflare `_redirects`/function returning a real 404 for unknown ids, generated from the data.
3. **Fix the sponsorship presentation (FTC).**
   - Don't force sponsors to the top of user-chosen sorts, or label them visibly as "Sponsored" (not "Featured") with a separate "Sponsored" section above an honest ranked list.
   - Remove the rank numbers from sponsored rows.
   - Make the tooltip text always visible.
   - Change AffiliateDisclosure.tsx:59-60 to say placements are paid.
   - Remove `monthly_fee` and `affiliate_commission` from client data (exchanges.ts).
   - NEEDS-OWNER: confirm which sponsorships actually exist.
4. **Fix the placeholder affiliate links.** Route every "Visit/Buy" link through `createTrackedAffiliateLink`/`AffiliateLink` from src/services/affiliate.ts + AffiliateDisclosure.tsx, with env IDs. When an ID is missing, fall back to the plain `url` with no `sponsored` or "Affiliate" badge (Compare.tsx:427, 527, 772; data files). NEEDS-OWNER: the real affiliate IDs.
5. **Correct the stale facts** in the table above: exchanges.ts, wallets.ts. Replace Trezor Model T with Safe 5/Safe 7 and add Safe 3, Nano Gen5 and Flex. Add `last_verified: '2026-09-23'` and `sources: string[]` to the `Exchange`/`Wallet` types (src/types/index.ts) and render "Fees verified on <date>" on each card and detail page.

**P1**
6. Read the tab from the URL: `useSearchParams` in Compare.tsx:64 so `?tab=wallets` works (and accept the legacy `?type=wallets`). Or better, split into prerenderable routes `/compare/exchanges` and `/compare/wallets`. Fix riskAssessment.ts:425 and llms.txt:57-59.
7. Static-mode review UX: in ReviewSection, when `STATIC_MODE || !isSupabaseConfigured()`, hide "Write a Review" and "No reviews yet". Show "Community reviews coming soon" or omit the section entirely. Surface `error` from `getReviews`.
8. Fix the ReviewSection pagination (compute `nextPage = page + 1` and pass the offset explicitly), remove the double fetch, and fix ReviewCard.tsx:91 (`(review.pros?.length ?? 0) + (review.cons?.length ?? 0) > 0 && …`).
9. Reviews DB:
   - Add a migration creating `platform_reviews` (with a unique `(user_id, platform_type, platform_id)`) and the `increment_review_helpful` RPC (one vote per user via a `review_votes` table).
   - Stop selecting `users.email`. Add a public `display_name` on a profile view.
   - Rename the "Premium" badge.
10. Schema types: hardware wallets → `Product` with `brand`, `offers`, and absolute `image` URLs to real assets. Add logos to public/images or drop `image`. Render the FAQ Q&As visibly, or drop FAQPage. Fix the wallet FAQ grammar (Compare.tsx:715).
11. Shorten titles to under 60 characters, change the listing H1 to a keyword H1, add an H2 above the card lists, and fix breadcrumb intermediate URLs.
12. Generate `functions/api/sitemap.ts` EXCHANGES/WALLETS and `public/sitemap.xml` from src/data, with lastmod = `last_verified`.

**P2**
13. Prerender /compare and every detail page (e.g. vite-plugin-prerender or a build script emitting static HTML) so the table, verdicts and FAQ are visible to non-JS crawlers and LLMs.
14. Model the cost of spread-based platforms (Robinhood, Uphold, Coinbase simple, Crypto.com app) so the "Fees" sort isn't topped by 0% platforms that are expensive in practice.
15. a11y: label the selects, give the tabs `role="tablist"`/`aria-selected`, and make the sponsored tooltip focusable.

---

### Suggested unique comparison content
- **Head-to-head pages** (`/compare/coinbase-vs-kraken`, `/compare/ledger-vs-trezor`, `/compare/trezor-safe-5-vs-ledger-nano-x`) built from the data. `compareWallets()` already exists (wallets.ts:593) and is unused. Each page would have a diff table, a "pick X if… / pick Y if…" verdict and a shared FAQ.
- **"Best for" verdict block** at the top of /compare (BLUF): best for beginners, lowest cost for $100 / $1,000 / $10,000 buys, best for staking, best for US states with restrictions, best Bitcoin-only wallet, best budget hardware wallet. Wire it to `getBestExchangeFor`/`getBestWalletFor`, with a written reason and date.
- **Fee worked examples:** "Buying $500 of BTC by bank transfer and withdrawing it to a wallet costs:" with rows per exchange (trading fee + typical spread + withdrawal). It could be interactive, reusing the site's fee-calculator logic.
- **US availability matrix:** exchange × state restrictions (NY, TX, HI, etc.) and staking availability by state. This is high-intent, rarely done well, and good for citation. NEEDS-OWNER to maintain it.
- **Transparent Trust Score methodology** section: weighted criteria (regulation/licensing, proof of reserves, hack history, insurance, years operating), with each sub-score shown per exchange.
- **Hardware wallet spec table:** secure element (yes/no, open or closed), screen, connectivity (USB-C/BT/NFC), open-source firmware, Bitcoin-only edition, backup options (Shamir / Ledger Recovery Key), price and current model status, including "discontinued" notes for Model T and Nano S.
- **Incident log per product** (dated): Ledger 2020 leak and 2023 Connect Kit; Trust Wallet Dec 2025 extension; BlueWallet LndHub sunset. Readers get useful safety context and it strengthens E-E-A-T.

---

Sources (fact checks):
- [Kraken fee schedule](https://www.kraken.com/features/fee-schedule)
- [Binance.US fees](https://www.binance.us/fees)
- [The Block – Binance.US slashes fees](https://www.theblock.co/post/398477/binance-us-slashes-trading-fees-cryptocurrencies-bid-to-attract-users)
- [Binance.US restores USD (BusinessWire)](https://www.businesswire.com/news/home/20250218352407/en/Binance.US-Restores-USD-Deposits-Withdrawals-on-Platform)
- [Coinbase Advanced fees](https://help.coinbase.com/en/coinbase/trading-and-funding/advanced-trade/advanced-trade-fees)
- [Coinbase Advanced fee overhaul Sept 2026](https://cryptodaily.co.uk/2026/09/coinbase-advanced-fees-usdc-vip-tiers)
- [The Block – Base App renamed back to Coinbase Wallet](https://www.theblock.co/news/defi/2026-09-10-coinbase-rebrands-base-app-back-to-coinbase-wallet-after-just-over-a-year-as-social-experiment-falls-short-414115)
- [Trezor Safe 7 vs Model T](https://bitbo.io/tools/trezor-safe-7-vs-model-t/)
- [Trezor Safe 7 launch](https://tr.tradingview.com/news/chainwire:a19d30fa5094b:0-trezor-launches-trezor-safe-7-first-hardware-wallet-with-transparent-secure-element)
- [Ledger Nano Gen5 & Ledger Wallet](https://www.ledger.com/blog-introducing-ledger-nano-gen5-ledger-wallet)
- [CoinDesk – Nano Gen5 $179](https://www.coindesk.com/tech/2025/10/23/ledger-unveils-usd179-nano-gen5-built-for-identity-in-an-ai-driven-world)
- [MetaMask – Bitcoin](https://metamask.io/news/bitcoin-on-metamask-btc-wallet)
- [Robinhood staking](https://robinhood.com/us/en/support/articles/staking/)
- [BlueWallet sunsetting LndHub](https://bluewallet.io/sunsetting-lndhub/)
- [Trust Wallet v2.68 incident](https://trustwallet.com/blog/company/trust-wallet-browser-extension-v268-incident-community-update)
- [Crypto.com Exchange fees](https://crypto.com/exchange/document/fees-limits)
- [CNBC – Gemini Nasdaq debut](https://www.cnbc.com/2025/09/12/gemini-the-winklevoss-crypto-exchange-pops-in-nasdaq-debut.html)
- [Coinbase NFT sunset (via search summary; CoinDesk/Decrypt coverage)](https://www.coindesk.com/web3/2023/02/01/coinbase-nft-pauses-new-collection-drops-denies-shuttering-marketplace)
