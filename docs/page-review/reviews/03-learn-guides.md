# Review 03 — /learn, /start, /learn/:guideId, src/data/guides/*

Scope: `src/pages/Learn.tsx`, `src/pages/GuideDetail.tsx`, and all 12 guides in `src/data/guides/`. Everything below was checked in code; I didn't guess. Paths are relative to the repo root.

## Cross-cutting findings (these apply to every guide)

1. **An unknown guideId is a soft 404, not a real one.** `GuideDetail.tsx:12-20` returns `<Navigate to="/learn" replace />`. So `/learn/anything` renders the indexable `/learn` page with status 200. No noindex is set and no 404 is shown. This matters because many dead guide URLs are published:
   - `public/llms.txt:26-32` links to 7 guide slugs that don't exist: `buying-first-bitcoin`, `wallet-security`, `dca-strategy`, `choosing-exchange`, `understanding-fees`, `crypto-taxes`, `avoiding-scams`. AI crawlers get sent to `/learn`.
   - `src/services/riskAssessment.ts:467` links to `/learn/defi`, which doesn't exist. The real slug is `defi-basics`.
2. **Every guide page has two H1s.** GuideDetail renders `<h1>{guide.title}</h1>` at `GuideDetail.tsx:93`. Every guide's markdown also starts with `# Title` (line 9 in each file). The markdown `h1` renderer at `GuideDetail.tsx:121` outputs a second `<h1>`. In `crypto-wallets-explained` the two H1s even differ (`:3` "Crypto Wallets Explained" vs `:9` "Crypto Wallets Explained: Complete Security Guide").
3. **Guides have no author, published date, updated date or reviewer.** The `GuideContent` interface (`src/data/guides/index.ts:14-22`) has no date or author fields.
   - `generateArticleSchema` is called without `publishedDate`, `modifiedDate`, `author` or `image` (`GuideDetail.tsx:57-61`). The Article JSON-LD therefore has no `datePublished` or `dateModified`, and the author is only the Organization.
   - `image` falls back to the relative path `/og-image.png` (`SEO.tsx:413`), not an absolute URL.
   - The page shows no "Last updated" line.
   - `public/sitemap.xml` claims `lastmod 2026-09-01` for all guides, but nothing on the page backs that up. For YMYL content (tax, finance) this is the biggest E-E-A-T gap.
4. **No FAQPage or HowTo schema anywhere.** Two guides already have FAQ sections (`how-to-buy-crypto.ts:320-343`, `crypto-wallets-explained.ts:411-439`). `how-to-buy-crypto` is a numbered HowTo. `generateFAQSchema` and `generateHowToSchema` exist in `SEO.tsx:466,498` but are never used for guides.
5. **Read times are inflated 2–3×.** I counted words and divided by 230 words per minute:

   | Guide | Words | Estimated | Declared |
   |---|---|---|---|
   | yield-farming | 1,423 | 6 min | 20 min |
   | defi-basics | 1,272 | 6 min | 18 min |
   | defi-risks | 1,443 | 6 min | 17 min |
   | risk-management | 1,374 | 6 min | 16 min |
   | crypto-taxes-basics | 2,406 | 10 min | 16 min |
   | dca-strategies | 1,128 | 5 min | 15 min |
   | portfolio-rebalancing | 1,253 | 5 min | 14 min |
   | crypto-wallets-explained | 1,609 | 7 min | 12 min |
   | what-is-bitcoin | 803 | 3 min | 8 min |

   `readTime` is hand-typed. It should be computed from `content`.
6. **Internal links are weak.**
   - 6 of 12 guides have **zero** internal links: dca-strategies, portfolio-rebalancing, risk-management, defi-basics, yield-farming, defi-risks.
   - common-crypto-mistakes has only 1.
   - Several guides say "read our next guide" or "our DeFi risks guide" without linking it: `defi-basics.ts:298,365`, `yield-farming.ts:401`.
   - No guide links to the site's own tools: `/calculators`, `/backtesting`, `/dca-automation`, `/rebalancing-alerts`, `/scam-database`, `/staking-calculator`, `/defi-yield`, `/glossary`, `/compare`.
   - GuideDetail's "Continue Learning" (`GuideDetail.tsx:225-265`) is 3 hard-coded generic cards (/learn, /calculators, /compare). It never links to related guides.
7. **Markdown links cause a full page reload.** The markdown `a` renderer uses a plain `<a href>` for internal paths (`GuideDetail.tsx:138-147`), so `/learn/...` links reload the whole SPA. They should use `<Link>` when `href` starts with `/`.
8. **Fenced code blocks render with inline-code styling.** In react-markdown 10, a fenced block with no language has no `className`, so `GuideDetail.tsx:166-176` treats it as inline and gives `<code>` the inline pill style inside a `<pre>`. Affected:
   - `portfolio-rebalancing.ts:155-173`
   - `risk-management.ts:105-111`
   - `defi-basics.ts:66-73`
   - `yield-farming.ts:201-203`
9. **No static prerender.** All guide text is in JS bundles (`src/data/guides/*.ts`). Crawlers that don't run JS get the empty `index.html`. Guides are the most valuable content to prerender to static HTML: `/learn`, all 12 `/learn/:id` pages, their meta, the JSON-LD, and the full article body.
10. **Missing cornerstone topics as of Sept 2026.** No guide mentions any of these:
    - the April 2024 halving (block reward is now 3.125 BTC; next halving expected around 2028)
    - US spot Bitcoin ETFs (Jan 2024) or spot ETH ETFs (Jul 2024), which are now the most common way 25–55 year-olds get exposure
    - the GENIUS Act (stablecoin law, signed July 2025)
    - the 2025 change in SEC posture

    I searched for `halving`, `ETF`, `IBIT` and `GENIUS` across `src/data/guides`: no matches.
11. **Static + DB:** Guides are 100% static. They render fully without Supabase, which is good. There is no DB layer for guide metadata, updates or feedback, which is acceptable for now. The only DB call is `getPublishedArticles` on `/learn` (see below).

---

### /learn — src/pages/Learn.tsx
- **Purpose / target query:** Hub for "learn crypto investing", "crypto guides for beginners" and "free crypto course".
- **Verdict:** Needs work. It's a clean card grid, but thin on hub content (no intro or learning path) and has two broken or dead UI paths.
- **Up-to-date issues:**
  - `Learn.tsx:191`: "Join 10,000+ investors" is unverified social proof. The same claim is in `Newsletter.tsx:132`. NEEDS-OWNER: a real number, or remove it.
- **SEO issues:**
  - `Learn.tsx:54`: the title is "Learn Crypto Investing - Free Guides & Courses | Bitcoinvestments", about 65 characters (over 60). It also ignores `PAGE_METADATA.learn` (`src/lib/seo.ts:124`), which has different copy. Two sources of truth.
  - Schema is only a BreadcrumbList (`Learn.tsx:46-49`). It needs CollectionPage + ItemList of the guides and courses.
  - No canonical override. `SEO` derives it from `location.pathname`, so on `/start` the canonical is `/start` (see /start below).
  - Emoji icons (`Learn.tsx:95,164`) aren't `aria-hidden`. Category filter buttons (`:138`) have no `aria-pressed`.
- **GEO issues:** No BLUF intro. No "start here" learning path, no definitions and no FAQ. The page has a single one-line subtitle, so an LLM has nothing to quote.
- **Static + DB:**
  - Without DB, `getPublishedArticles` returns `[]` (`src/services/database.ts:508`) and the "Latest Articles" section is hidden. That's graceful.
  - Bug: the loading skeleton (`Learn.tsx:202-212`) sits inside `articles.length > 0 &&` (`:199`), so it can never render. That's dead code.
  - With DB, there's no error state. It just logs to the console.
- **Uniqueness / content gaps:**
  - Add an ordered "Beginner path" (1 What is Bitcoin → 2 Blockchain → 3 Wallets → 4 How to buy → 5 Mistakes → 6 Taxes) with estimated total time.
  - Add a "What changed in 2025–26" box: ETFs, halving, 1099-DA, GENIUS Act.
  - Add a short FAQ block ("Is crypto a good investment for beginners?", "How much should I start with?") with FAQPage schema.
  - Add a link to `/glossary`.
- **Bugs:**
  - `Learn.tsx:294`: the "Wallet Guide" card links to `/compare?type=wallets`. `Compare.tsx:64` ignores query params and always opens the exchanges tab, so the card lands on the wrong content. The same bad link is in `src/components/InternalLinks.tsx:238,318`.
  - Dead skeleton (above).
- **Recommended fixes:**
  - **P0:** Point the Wallet Guide card to `/learn/crypto-wallets-explained`, or make `Compare` read `?type=` into `activeTab` (`useSearchParams`).
  - **P1:** Use `PAGE_METADATA.learn` (keep it under 60 characters). Add CollectionPage + ItemList schema from `getAllGuides()` and `getAllCourses()`. Add a BLUF intro paragraph, a beginner path section and a FAQ + FAQPage.
  - **P1:** Prerender `/learn` to static HTML.
  - **P2:** Move the skeleton outside the length check, or drop it. Add `aria-pressed` to the filters and `aria-hidden` to the emojis.
  - **NEEDS-OWNER:** the "10,000+" subscriber claim.

### /start — src/pages/Learn.tsx (alias)
- **Purpose / target query:** Presumably "where to start with crypto". It currently has no unique purpose.
- **Verdict:** Poor. It's a pure duplicate of `/learn` (`App.tsx:244`).
- **Up-to-date issues:** Same as /learn.
- **SEO issues:**
  - Noindexed via `CONDITIONAL_INDEX_PATHS` (`src/lib/index-pruning.ts:49`), so it isn't a duplicate-indexing risk today.
  - But the canonical self-references `/start` (`SEO.tsx` builds it from `location.pathname`), while the breadcrumb schema says `/learn` (`Learn.tsx:48`). That's inconsistent.
  - It isn't in the sitemap and nothing in `src` links to `/start`, so it's an orphan.
- **GEO issues:** None beyond /learn.
- **Static + DB:** Same as /learn.
- **Uniqueness / content gaps:** It either earns its own page or goes away.
- **Bugs:** None beyond /learn.
- **Recommended fixes:**
  - **P1:** Pick one:
    - (a) Redirect `/start` to `/learn` with a 301: add `/start /learn 301` to `public/_redirects`, and change the route to `<Navigate to="/learn" replace />`.
    - (b) Build a real "Start Here" page: a 5-step checklist, a "which path are you on?" quiz (saver, trader, DeFi), links to the beginner course and the first 3 guides. Give it its own title, description and HowTo schema, and remove it from `CONDITIONAL_INDEX_PATHS`.

    Option (a) is the minimal fix.

### /learn/:guideId — src/pages/GuideDetail.tsx
- **Purpose / target query:** Individual evergreen guides (per-guide queries are listed below).
- **Verdict:** Needs work. The rendering is decent, but it has the soft-404, double-H1 and no-date/author problems, and several guides contain stale or wrong facts.
- **Up-to-date issues:** Per guide, below.
- **SEO issues:**
  - Soft 404 (`:12-20`).
  - Double H1 (`:93` + `:121`).
  - Article schema has no dates, author or absolute image (`:57-61`).
  - No FAQPage or HowTo.
  - `publishedTime` and `modifiedTime` aren't passed to `SEO` (`:48-68`), so the `article:*` OG tags are missing.
  - `keywords` includes the full title (`:51`).
  - Titles over 60 characters once " | Bitcoinvestments" (18 characters) is appended:

    | Guide | Title length |
    |---|---|
    | defi-risks | 84 |
    | portfolio-rebalancing | 81 |
    | dca-strategies | 77 |
    | defi-basics | 69 |
    | yield-farming | 69 |
    | risk-management | 67 |
    | crypto-taxes-basics | 61 |

  - Descriptions are all under 160 characters, but several are thin or generic:
    - `common-crypto-mistakes.ts:4` (56 characters)
    - `how-to-buy-crypto.ts:4` (75)
    - `crypto-wallets-explained.ts:4` (76)
- **GEO issues:**
  - `blufSummary` is just the meta description (`:54`).
  - No visible "Key facts / TL;DR" box at the top.
  - Numbers are mostly unsourced: DeFi loss stats, "95% of day traders", "lump sum beats DCA 2/3 of the time", "more crypto lost to seed phrases than hacks".
  - Several guides use fabricated first-person anecdotes presented as real (below).
- **Static + DB:** Fully static and works without DB. The Newsletter component is the only dynamic part (reviewed elsewhere). Share uses `alert()` (`:37`), which should be a toast.
- **Uniqueness / content gaps:** Guides don't link to each other or to site tools. There's no related-guides block, no "next in series" for the DeFi 3-part and Trading 3-part series, and no prev/next.
- **Bugs:** Soft 404. Double H1. Internal links reload the page (`:138-147`). Code-block styling (`:166-176`). `ul`/`ol` use `list-inside` (`:149,154`), which breaks the layout of multi-line items.
- **Recommended fixes:**
  - **P0:** When `!guide`, render `<NotFound />`, which already sets `noindex` (`src/pages/NotFound.tsx:47-51`), instead of `<Navigate>`. Optionally add a `public/_redirects` 301 for the 7 legacy slugs from `llms.txt` to real guides:

    | Legacy slug | Redirect to |
    |---|---|
    | buying-first-bitcoin | how-to-buy-crypto |
    | wallet-security | crypto-wallets-explained |
    | dca-strategy | dca-strategies |
    | crypto-taxes | crypto-taxes-basics |
    | avoiding-scams | common-crypto-mistakes or /scam-database |
    | choosing-exchange | /compare |
    | understanding-fees | /compare |

    Then fix `public/llms.txt:25-32` to list the 12 real guides. Fix `src/services/riskAssessment.ts:467` (`/learn/defi` → `/learn/defi-basics`).
  - **P0:** Remove the duplicate H1. Either strip a leading `# ` line from `guide.content`, or map markdown `h1` to `h2`.
  - **P1:** Add fields to `GuideContent`: `author` (NEEDS-OWNER: a named author or reviewer with credentials; for the tax guide ideally a CPA/EA reviewer), `datePublished`, `dateModified`, and optional `faqs[]` and `howToSteps[]`.
    - Render "By X · Reviewed by Y · Updated <date>" under the H1.
    - Pass the dates and author to `generateArticleSchema` and `SEO`. Use the absolute `https://bitcoinvestments.net/og-image.png`.
    - Emit `generateFAQSchema` when `faqs` is present and `generateHowToSchema` for how-to-buy-crypto.
  - **P1:** Compute `readTime = Math.ceil(words/230)` in `getGuide`/`getAllGuides` instead of the hand-typed values.
  - **P1:** Add `relatedGuides: string[]` and `relatedTools: {label,url}[]` to each guide, and render them in "Continue Learning". Add in-body links (see per-guide fixes). Render internal markdown links with `<Link>`.
  - **P1:** Shorten `title` to under 42 characters (so under 60 with the suffix), or add an `seoTitle` field.
  - **P2:** Code blocks: detect via the `node` parent being a `pre`, or override `pre`. Use `list-outside pl-6`. Replace `alert` with a toast.
  - **P1:** Prerender all 12 guide routes.

---

## Per-guide content review (facts as of 2026-09-23)

### what-is-bitcoin.ts ("what is bitcoin")
- `:51`: "grown from worthless to over $40,000+ per coin" is stale. BTC traded above $100k in 2025. Replace it with a dated statement ("as of <date>, ~$X; all-time high $Y on <date>") or a live price component.
- `:53`: "Countries have made it legal tender (El Salvador, Central African Republic)" is outdated. CAR repealed its Bitcoin law in 2023. El Salvador amended its Bitcoin Law in Jan 2025 (IMF deal), making acceptance voluntary. It needs a rewrite.
- Missing:
  - halving (the supply schedule, April 2024 halving to 3.125 BTC, next around 2028)
  - spot Bitcoin ETFs (Jan 2024) as an alternative to self-custody
  - how many BTC are mined so far (~19.9M)
- `:86`: fine. `:87` "Exchange wallets (least secure): Coinbase, Kraken" is fine.
- At about 800 words this is thin for the site's most important head term. Add a FAQ ("Who created Bitcoin?", "How many bitcoins are left?", "What is the halving?", "Can I buy a fraction?", "Is Bitcoin legal in the US?") with FAQPage schema.
- Links: 2 internal. Add `/learn/understanding-blockchain`, `/calculators`, `/glossary` and `/learn/common-crypto-mistakes`.

### understanding-blockchain.ts ("how does blockchain work")
- The best-written guide: balanced, current and accurate. Minor points:
  - `:162`: "Ethereum around 15–30 TPS" is fine for L1.
  - `:164`: "fees have exceeded $50" is fine as history. Add that since Dencun (Mar 2024) L2 fees are usually cents.
- Missing: the Bitcoin halving and supply schedule. It would also fit under PoW.
- Links: 3, all valid. Add `/glossary` and `/learn/what-is-bitcoin`.

### crypto-taxes-basics.ts ("crypto taxes US") — YMYL, highest-stakes page
- It's largely current: Notice 2014-21, Rev. Rul. 2023-14, Rev. Proc. 2024-28, and 1099-DA from the 2025 tax year with basis reporting from 2026.
- Updates needed:
  - `:65`: "$19,000 per recipient for 2025" should say the exclusion is $19,000 for both 2025 and 2026, or give the current-year figure.
  - `:104`: per-wallet/account basis tracking took effect Jan 1, 2025. Say so plainly. The Rev. Proc. 2024-28 safe-harbour allocation deadline has passed.
  - `:154`: switch to present tense. The first 1099-DAs (gross proceeds for 2025) were issued in early 2026, and basis reporting applies to covered assets acquired from 2026. Also say that the DeFi/"front-end" broker rule was repealed via the Congressional Review Act in 2025, so DeFi activity is not on a 1099-DA.
  - `:71`: "currently up to 37%" is still correct (2025 legislation made the rates permanent). Consider stating the tax year.
  - `:120-122`: the wash-sale statement is still accurate, but date it ("as of <date>").
  - `:204`: add the UK annual exempt amount (£3,000).
- Needs a named reviewer (NEEDS-OWNER: CPA/EA) and a visible "Tax year covered / updated" line. This matters more here than on any other page.
- `:227`: the `/calculators?type=tax` link is valid (`Calculators.tsx:14-26` parses `type`).
- Add an FAQ ("Do I pay tax if I don't cash out?", "Is transferring between wallets taxable?", "What is Form 1099-DA?") with FAQPage schema. Link to `/tax-reports` only if it's live (it's `staticGuard`ed in STATIC_MODE, so don't link it now).

### how-to-buy-crypto.ts ("how to buy crypto/bitcoin")
- `:45,160`: "Coinbase 1.49%" is outdated. Coinbase simple-trade pricing is now spread plus a variable fee. Verify current rates (NEEDS-OWNER/verify) or link to `/compare` instead of hard-coding.
- `:44,55`: "insured" / "insurance" is misleading. Crypto balances aren't FDIC-insured. Say "USD balances may be FDIC pass-through insured; crypto is not".
- `:47`: "Sign-up bonus: Often offers $10 in Bitcoin" is unverifiable and dated. Remove it.
- `:50`: "Kraken 0.16%-0.26%" is outdated. The Kraken Pro base tier is 0.25% maker / 0.40% taker. Verify.
- `:63-66`: the comparison table (asset counts, the Binance.US "Good" security rating) is undated. Binance.US lost USD rails in 2023 and restored them in 2025. Link `/compare` instead or date the table.
- `:92`: Authy is fine but dated (the desktop app ended in 2024).
- `:199`: "Trezor Model T" is discontinued and replaced by the Trezor Safe 3 and Safe 5.
- `:266`: "**TaxBit**: IRS-approved calculations" is **false**. There's no IRS approval of tax software, and TaxBit exited the consumer market in 2023. **P0: remove.**
- `:223`: "Ethereum: 12 confirmations" is pre-Merge thinking. Say "~13 min to finality; exchanges vary".
- Missing:
  - Spot Bitcoin/ETH ETFs via a brokerage or IRA (the biggest omission for a 25–55 audience)
  - Buying via PayPal, Venmo, Cash App or Robinhood
  - 1099-DA (link the tax guide)
- The FAQ section `:320-343` is ready for FAQPage. The steps are ready for HowTo schema.
- Links: 3, all valid. Add `/compare`, `/calculators`, `/learn/dca-strategies`, `/scam-database`.

### crypto-wallets-explained.ts ("crypto wallet types / hot vs cold")
- `:114`: "Trezor Model T ($219)" is discontinued. Replace with Safe 3 / Safe 5. Verify Ledger prices and lineup (Nano X, Flex, Stax).
- `:68`: "Wasabi: enhanced privacy". The default zkSNACKs coinjoin coordinator shut down in June 2024. Qualify or remove.
- `:88`: "Coinbase Wallet" was rebranded to the Base app in 2025. Verify the current name.
- `:261`: "Gnosis Safe" was renamed "Safe" in 2022.
- `:136-155,184`: paper wallets rated "High" security and recommended is outdated practice. Most guidance now discourages them (single-address, sweep and change pitfalls). Downgrade the rating.
- `:401`: "Update passwords quarterly" contradicts NIST 800-63B. Say "use a password manager with unique passwords".
- `:9`: the markdown H1 differs from the `title` at `:3`.
- The FAQ `:411-439` is ready for FAQPage.
- Links: 2. Add `/compare` (wallets tab once fixed), `/hardware-wallet`, `/learn/understanding-blockchain`.

### common-crypto-mistakes.ts ("common crypto mistakes")
- **Fabricated anecdotes** ("James", "Sarah", "Mike", "Tom", "Lisa", "Kevin", "Rachel", "David", "Chris", "Emma" at `:17,56,118,165,202,241,280,326,371,416`) are presented as real stories with dollar amounts. That's a trust and YMYL problem. **P1:** label them "Illustrative example" or replace them with real, cited incidents (Mt. Gox, FTX, the 2020 Twitter giveaway hack).
- `:56`: "0.5 BTC ($20,000)" implies BTC at $40k. Stale.
- `:202-204`: the Lisa story ($60k → $30k → "recovered to $65,000") uses stale prices, and "$15,000 in missed gains" can't be derived because no quantity is given. It's wrong or unverifiable maths.
- `:446-449` has a maths error. It says "0.25% fee per trade (buy + sell)", then "100 trades × 0.5% = 50%". At 0.25% per trade, 100 trades is 25%. If 0.5% is the round-trip fee, it should say 50 round trips. **P1: fix.**
- `:26,422`: "More crypto is lost this way than through hacks" and "95% of day traders lose money" are unsourced. Cite them or soften them.
- `:88`: "No legitimate giveaways exist" is too absolute. Say "unsolicited 'send X get 2X' giveaways are always scams".
- `:379`: "Exchanges report to IRS" is now true via Form 1099-DA (2025+). Link `/learn/crypto-taxes-basics`.
- `:272` suggests 5–10% of the portfolio in crypto while risk-management gives no overall cap. Make them consistent.
- The title promises 10 mistakes and there are 10, plus bonus mistakes. The description (`:4`, 56 characters) is too short.
- Links: 1. Add `/scam-database`, `/learn/crypto-taxes-basics`, `/learn/how-to-buy-crypto`, `/learn/risk-management`, `/calculators`.

### dca-strategies.ts ("advanced DCA strategies")
- `:92-98`: the Fear & Greed bands overlap (25, 45, 55 and 75 each sit in two bands). `:117` then labels 55 as "Greed", while the table's 45–55 band is "Neutral". Make the bands half-open (0–24, 25–44, 45–55, 56–75, 76–100) and fix the example.
- `:84-86`: "At 200-day MA" is undefined. Give a band (±5%).
- `:161-164`: dip-buy sizes drop at the −50% trigger ($800 → $600) with no explanation. Explain it or fix it.
- `:131`: "lump sum beats DCA about 2/3 of the time" is unsourced (it's Vanguard 2012 research on stocks and bonds, not crypto). Cite it and caveat it.
- Zero internal links, even though the site has `/calculators` (DCA), `/backtesting` and `/dca-automation`. **P1:** add them. This guide should embed or link the DCA calculator and backtester with real BTC history.
- There's no basic "What is DCA" guide, yet `llms.txt` advertises `/learn/dca-strategy` ("DCA Strategy Explained"). Consider a beginner DCA guide, which is a high-volume query.

### portfolio-rebalancing.ts ("crypto portfolio rebalancing")
- `:250`: "Blockfolio/FTX (check current status)". FTX collapsed in Nov 2022 and Blockfolio is dead. **P0: remove.**
- `:255-256`: "Binance Portfolio Rebalancing" isn't available to US users. Verify whether Shrimpy is still operating (NEEDS-OWNER/verify).
- `:115-120`: the threshold example is internally inconsistent. 52% triggers ">10% from 60%" but 68% doesn't. At an absolute ±10 points (50–70), neither triggers. At a relative ±10% (54–66), both trigger. Pick one definition and fix the rows.
- Mention that the wash-sale rule doesn't apply to crypto (see the tax guide) in the TLH section (`:208-215`).
- Zero internal links. Add `/rebalancing-alerts`, `/learn/crypto-taxes-basics`, `/learn/risk-management`, `/calculators`.
- `:219`: "crypto IRA". Also mention that spot BTC/ETH ETFs in a regular IRA are now an option.

### risk-management.ts ("crypto risk management")
- `:212,214`: "MKR" and "DAI". MakerDAO rebranded to Sky (SKY/USDS) in 2024–25. Update or note it.
- `:50`: "Bitcoin's historical max DD is ~85%". The 2011 drawdown was ~93%. Qualify it ("~77–86% in each cycle since 2014").
- `:29-33`: regulatory risk is generic. Add the 2025 US context: the GENIUS Act, the SEC dropping major exchange cases, and market-structure legislation pending (verify status).
- `:257-259`: "Options (where available)". US-listed options on spot Bitcoin ETFs (e.g. IBIT) have existed since Nov 2024. Mention them as the retail-accessible hedge.
- Zero internal links. Add `/calculators`, `/backtesting`, `/learn/portfolio-rebalancing`, `/learn/dca-strategies`, `/learn/defi-risks`.

### defi-basics.ts ("what is DeFi")
- `:105,159`: "dYdX: Ethereum L2" is outdated. dYdX v4 is its own Cosmos app-chain (since 2023).
- `:127`: "Aave … stable rates". Aave has deprecated stable-rate borrowing.
- `:129,140`: "MakerDAO / DAI" is now Sky / USDS (DAI still exists).
- `:141`: "FRAX" listed as algorithmic is outdated. Frax moved to full collateralisation in 2023. Use a historical example instead: UST/Terra, which collapsed in 2022.
- `:139`: "Fiat-backed | Held in bank reserves | USDC, USDT" is misleading (reserves are mostly T-bills). Add the GENIUS Act (July 2025) as the US stablecoin framework.
- `:236-242`: the gas cost table is stale. Post-Dencun, Ethereum L1 swaps are often under ~$1–5 in 2025–26, and Arbitrum is under $0.05. Date it or make it live (the site has `/gas-optimizer`).
- `:266`: "Want insured deposits" (CeFi) is misleading. Crypto isn't FDIC-insured.
- `:188-191`: verify InsurAce and Unslashed are still operating.
- `:33-36`: "Layer 2 - Protocols / Layer 3 - Applications" clashes with the standard meaning of L2/L3 used in understanding-blockchain. Rename it to "protocol layer / app layer".
- Zero internal links, despite "We'll cover this in the Yield Farming guide" (`:298`) and "our next guide" (`:365`). **P1:** link `/learn/yield-farming`, `/learn/defi-risks`, `/defi-yield`, `/gas-optimizer`, `/learn/understanding-blockchain`.

### yield-farming.ts ("yield farming guide")
- `:216-220`: **wrong APY maths.** I recomputed it:

  | APR | Weekly compounding (table) | Weekly compounding (correct) | Daily compounding (table) | Daily compounding (correct) |
  |---|---|---|---|---|
  | 50% | 63.16% | 64.48% | 64.87% | 64.82% |
  | 100% | 159.27% | 169.26% | 171.46% (correct) | 171.46% |

  **P1: fix.**
- `:246`: "MATIC" is now POL (Sept 2024).
- `:64`: "Aave USDC Current APY: 3%" is undated. Say "e.g." or make it live.
- `:334`: "Flash loans … Risk-free if done correctly" is misleading for a retail audience. Remove it.
- `:403`: "Sustainable yields in DeFi are typically 5-20% for stable strategies" overstates it. Stablecoin lending has mostly been in the low-to-mid single digits. Soften it and date it.
- The impermanent-loss table (`:163-170`) and the example (`:155-159`) are correct (I verified them against 2√r/(1+r)−1).
- Zero internal links (`:401` mentions the DeFi risks guide without a link). Add `/learn/defi-risks`, `/learn/defi-basics`, `/defi-yield`, `/staking-calculator`, `/learn/crypto-taxes-basics` (DeFi tax treatment).

### defi-risks.ts ("DeFi risks")
- `:17-19`: loss stats stop at 2023 and are unsourced. Add 2024 and 2025 with a cited source (Chainalysis, DeFiLlama hacks dashboard or Immunefi). The 2025 figures should include the major exploits. NEEDS-OWNER/verify the numbers.
- `:263-268`: "Current Landscape: US SEC increasingly active … Sanctions compliance (Tornado Cash)" is **stale**. In 2025 the SEC dropped most crypto enforcement cases. Treasury delisted Tornado Cash in March 2025 after the Fifth Circuit's Van Loon ruling (Nov 2024). The GENIUS Act was signed in July 2025. **P0: rewrite this section with dates.**
- `:343-346`: verify Unslashed and Risk Harbor still offer cover.
- `:46`: "Integer overflow" is largely mitigated since Solidity 0.8 (2020). Say so.
- Zero internal links. This is the natural place to link `/scam-database`, `/report-scam` (only when live), `/learn/common-crypto-mistakes`, `/learn/yield-farming`, `/learn/crypto-wallets-explained`, `/learn/crypto-taxes-basics`.

---

## Prioritised fix list (summary)

**P0**
1. `GuideDetail.tsx:18-20`: render `<NotFound/>` (noindex) for an unknown guideId instead of `<Navigate to="/learn">`. Add 301s in `public/_redirects` for the 7 legacy slugs, rewrite `public/llms.txt:25-32` to the real 12 guides, and fix `src/services/riskAssessment.ts:467` (`/learn/defi` → `/learn/defi-basics`).
2. `GuideDetail.tsx:121`: remove the double H1 (map markdown `h1` to `h2`, or strip the leading `# ` line).
3. Remove false or dead product claims:
   - `how-to-buy-crypto.ts:266` (TaxBit "IRS-approved")
   - `portfolio-rebalancing.ts:250` (Blockfolio/FTX)
4. Rewrite the stale regulatory sections:
   - `defi-risks.ts:263-268`
   - `what-is-bitcoin.ts:51-53` ($40k price, El Salvador/CAR legal tender)
5. `Learn.tsx:294` (+ `InternalLinks.tsx:238,318`): the "Wallet Guide" link lands on the exchanges tab. Fix the link, or make `Compare` honour `?type=`.

**P1**
6. Add `author`, `reviewedBy`, `datePublished` and `dateModified` to `GuideContent`. Show a byline and "Updated" date. Pass them into the Article schema and OG tags, with an absolute image URL. (NEEDS-OWNER: named author or reviewer; a CPA/EA for the tax guide.)
7. Add FAQPage (how-to-buy, wallets, taxes, what-is-bitcoin) and HowTo (how-to-buy) schema via the existing generators.
8. Compute `readTime` from the word count. The current values are 2–3× too high.
9. Add related-guide and tool links to every guide, plus a data-driven "Continue Learning". Render internal links with `<Link>`.
10. Fix the maths and consistency errors:
    - `yield-farming.ts:219-220`
    - `common-crypto-mistakes.ts:446-449`, `:202-204`
    - `portfolio-rebalancing.ts:115-120`
    - `dca-strategies.ts:92-98`, `:117`
11. Refresh product facts:
    - Trezor Model T → Safe 3/5 (`crypto-wallets-explained.ts:114`, `how-to-buy-crypto.ts:199`)
    - Coinbase and Kraken fees and "insured" (`how-to-buy-crypto.ts:44-66,160`)
    - dYdX, Aave stable rates, MakerDAO/DAI → Sky/USDS, FRAX (`defi-basics.ts`)
    - MKR (`risk-management.ts:212`)
    - MATIC → POL (`yield-farming.ts:246`)
    - Wasabi, Gnosis Safe → Safe, Coinbase Wallet (`crypto-wallets-explained.ts`)
    - gas table (`defi-basics.ts:236-242`)
12. Add the missing 2024–26 facts:
    - halving (what-is-bitcoin, understanding-blockchain)
    - spot BTC/ETH ETFs (what-is-bitcoin, how-to-buy-crypto, risk-management, portfolio-rebalancing)
    - GENIUS Act (defi-basics, defi-risks, risk-management)
    - 1099-DA present tense and DeFi broker rule repeal (crypto-taxes-basics:154, common-crypto-mistakes:379)
    - 2026 gift exclusion (crypto-taxes-basics:65)
13. Label the illustrative anecdotes in `common-crypto-mistakes.ts`, or replace them with real cited cases. Source or soften the unsourced statistics.
14. `/start`: 301 to `/learn`, or build a genuine "Start Here" page.
15. Shorten the 7 guide titles that go over 60 characters with the suffix. Use `PAGE_METADATA.learn` on `/learn`. Add CollectionPage + ItemList schema, a BLUF intro, a beginner path and a FAQ to `/learn`.
16. Prerender `/learn` and all `/learn/:id` routes to static HTML.

**P2**
17. Code-block rendering and `list-inside` in `GuideDetail.tsx:149-176`. Replace the `alert()` share fallback. Fix the dead skeleton at `Learn.tsx:202`. Add `aria-pressed` and `aria-hidden`.
18. Wallet-guide hygiene: soften the paper-wallet recommendation and drop the quarterly password rotation advice.
19. NEEDS-OWNER: substantiate or remove "10,000+ investors" (`Learn.tsx:191`, `Newsletter.tsx:132`).
