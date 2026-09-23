# 08 — Scam database cluster (/scam-database, /scam/:id, /report-scam)

**Short answer to the key question.** Without the DB, `/scam-database` has **no real content at all**. No static scam data exists: there is nothing in `src/data` and nothing in the page file. Every query goes to `https://placeholder.supabase.co` (src/lib/supabase.ts:12-15), fails, and comes back as `[]`/0. The page renders four stat tiles reading **0 / 0 / 0 / 0**, category buttons that filter an empty list, and "No scams found". Worse, any search shows a green **"No scams found matching your search!"** (ScamDatabase.tsx:503-513). That tells a user an address or site is clean when nothing was checked, which is a serious YMYL problem. With the DB, reads work for verified reports, but the RLS is broken (anyone can self-verify), the vote and trust-score plumbing never updates, and the sync/seed services are dead code full of invented "verified" entries. `/report-scam` is a dead end in static mode: `staticGuard` renders `<ComingSoon/>` (App.tsx:47-49, 184), yet two red "Report Scam" CTAs link to it.

---

### /scam-database — src/pages/ScamDatabase.tsx
- **Purpose / target query:** "crypto scam database", "is this wallet/website a scam", "crypto scam checker". High-intent YMYL queries.
- **Verdict:** **Poor.** In static mode the page is an empty shell whose schema and copy make false claims, and its search gives false "all clear" results.
- **Up-to-date issues:**
  - FAQ schema cites "the FBI's IC3 report for 2024 — the most recent full year of federal data" (SEO.tsx:686, 702). By 2026-09 the IC3 2025 annual report (normally published in April) is likely out. Verify the figures and update them. NEEDS-OWNER to confirm the numbers.
  - The `featureList` claims "Real-time scam alerts" (SEO.tsx:665). No such feature exists.
  - The FAQ says data comes "from CryptoScamDB, ChainAbuse" and that "our database tracks thousands of confirmed rug pulls" (SEO.tsx:680, 694). This is false: no sync is wired up (see Services). Also, CryptoScamDB's `api.cryptoscamdb.org` (cryptoScamDbSync.ts:221) is believed to be defunct. Verify.
  - public/llms.txt:6, 66 claims "over 1,000 verified reports" / "1,000+ community-verified crypto scam reports". This is false with no DB and unverified with one.
  - public/llms.txt:32 links `/learn/avoiding-scams`, but no such guide exists in src/data/guides (grep finds nothing), so the link 404s.
  - sitemap.xml:24-26 lists `lastmod 2026-02-08, changefreq daily` for a page that has no changing content in static mode.
- **SEO issues:**
  - The rendered title is 80 characters (ScamDatabase.tsx:236 plus the " | Bitcoinvestments" suffix, SEO.tsx:109). The description is 200 characters (ScamDatabase.tsx:237). Both are over the limits. The page also ignores `PAGE_METADATA.scamDatabase` (seo.ts:156-170), so the metadata is duplicated.
  - **Fabricated AggregateRating:** `ratingValue: '4.8'`, `ratingCount: stats?.totalReports || 1000` (SEO.tsx:646-652). Nobody rated anything, and with no DB the count falls back to a hardcoded 1000. This breaks Google's review-snippet policy and risks a manual action. Remove it.
  - **The FAQPage schema has no visible FAQ** (SEO.tsx:672-728, used at ScamDatabase.tsx:228). None of those Q&As are rendered on the page, which violates Google's structured-data guidelines.
  - A `WebSite` + `SearchAction` for a sub-page (SEO.tsx:787-806). Sitelinks searchbox only works for the site root and Google retired it in 2024, so this is harmless but useless. `?q=` result URLs are not in the faceted-noindex list (index-pruning.ts:83). Canonical strips the query, so the impact is low.
  - The `WebApplication` type is acceptable, but there is no `ItemList` of reports, no `BreadcrumbList`, and no `Dataset` (a `generateDatasetSchema` helper already exists at seo.ts:1347 but is unused).
  - Report cards are `<div onClick>` (ScamDatabase.tsx:609-613), not `<a href>`. Crawlers therefore cannot discover any `/scam/:id` URL, detail pages have no internal links, and the functions sitemap (functions/api/sitemap.ts:30) has no report URLs.
  - The heading hierarchy is fine (one H1 at :263, H2s at :528 and :557), but the CTA uses an H3 (:738) under no H2 context, and card H3s sit under "Recent Scam Reports".
  - There are no internal links to /learn guides on scam safety (for example the scam sections in `common-crypto-mistakes`, `defi-risks` and `crypto-wallets-explained`), even though seo.ts:1467 defines related links for `/scam-database`. They are not rendered here.
  - SPA: the H1 and intro are the only static text. Everything a crawler or LLM could quote is either behind a DB call or absent. Any static content added (see fixes) must be prerendered.
- **GEO issues:** No BLUF, no definitions of the scam types (the category tiles are just emoji plus a label, :44-53), no numbers with sources on the page, no visible FAQ, no "last updated" date, no author or methodology. There is also no statement of how reports are verified, and E-E-A-T for a site accusing others of fraud depends on exactly that. The "Trust %" figure has no explanation.
- **Static + DB:**
  - **No DB:** no `isSupabaseConfigured()` guard anywhere in the page or services. Each call fires a failing network request to placeholder.supabase.co. There are 6+ requests on mount, and `loadReports` runs twice on mount because of the two effects at :103-112. There is also a request for every keystroke of 2+ characters (`getSearchSuggestions`, :114-124 → scamDatabase.ts:170). All of them resolve to empty, and the UI shows zeros and an empty state with no "database unavailable" message. **The search banner says "No scams found matching your search!" in green** (:503-513) whenever `searchQuery` is non-empty and the results are empty, including when the DB is unreachable and even before the user presses Search. On a scam checker this is the worst possible failure mode.
  - **With DB:** `searchScamReports` correctly defaults to `status='verified'` (scamDatabase.ts:84-90) and paginates. Caveats:
    - `getCommunityStats` "Total Reports" is RLS-limited to verified and investigating rows for anon users (comprehensive_rls_security.sql:466-468), so Total ≈ Verified.
    - `totalVotes` downloads every vote id (scamCommunity.ts:415), which is unbounded and capped at the PostgREST 1000-row default.
    - `totalContributors` reads `scam_reporter_reputation`, but no code path ever writes to that table.
    - `upvotes`/`downvotes`/`trust_score` on cards are effectively always 0/0/50: the vote trigger `update_scam_vote_counts` is not `SECURITY DEFINER` (202512230000000…sql:86-111), so a voter's UPDATE of someone else's `scam_reports` row is filtered out by RLS and the counters never change. `calculate_trust_score()` (:120-155) is defined but never called by any trigger or code. So the "50% Trust" shown on every card (ScamDatabase.tsx:655-657) is a constant presented as a community metric.
  - `checkWalletAddress` uses exact array containment (scamDatabase.ts:427). EVM addresses differ by checksum case, so a lowercase paste of a checksummed stored address misses, and the page then shows the green "no scams" banner. Normalise to lowercase on both write and query.
- **Uniqueness / content gaps:** As shipped it is a thin, templated search UI with no content. To be the best answer it needs, as static and sourced content:
  - (a) A scam-type encyclopedia: pig butchering, wallet drainers/approval phishing, address poisoning, fake exchanges/apps, recovery scams, crypto-ATM/impersonation, rug pulls/honeypots, pump-and-dumps, fake airdrops. For each: how it works, red flags, and what to do.
  - (b) Notable documented cases with primary sources (DOJ/SEC/CFTC press releases, court filings), for example OneCoin, BitConnect, Thodex, Squid Game token, AnubisDAO, and the Inferno/Angel/Pink drainer-kit takedowns. NEEDS-OWNER/editorial to verify each against its source.
  - (c) "Check before you send" pointers to authoritative external checkers: Chainabuse, Etherscan labels, Scam Sniffer / revoke.cash, the FTC and IC3.
  - (d) A "Been scammed? What to do now" block: IC3, FTC reportfraud.ftc.gov, state regulator, exchange support, a recovery-scam warning, and revoking approvals.
  - (e) Sourced loss statistics with the year and a link.
  - (f) A visible FAQ that matches the schema.
- **Bugs:**
  - URL state round-trip is broken. `handleSearch` writes `?q=…&type=<searchType>` (:162), where type is `general`/`wallet`/…, but on load `type` is read as the **scam_type** filter (:74). Reloading or sharing a search URL therefore filters `scam_type='general'` and returns nothing. It also shows the green "no scams" banner because `searchQuery` is prefilled from `q` (:69) while `filters.query` is not.
  - `handleSuggestionClick` calls `handleSearch()` right after `setSearchType`/`setSearchQuery` (:173-179), so it searches with stale state (the previous query and type).
  - `handleSearch` with an empty query calls `setFilters` and then `loadReports()` immediately (:127-130), which is a stale double load.
  - Wallet/contract/website searches bypass the filters and pagination, and are overwritten if the filters effect fires.
  - The `min_trust_score`/`min_loss` filters are counted in `activeFilterCount` (:212-218) but have no UI.
  - A11y: the cards are clickable `div`s with no role, tabIndex or key handler (:609-613). The suggestion list has no combobox/listbox ARIA. `onKeyPress` is deprecated (:347). The search input has only a placeholder and no label.
  - `report.severity.toUpperCase()` / `scam_type.replace('_',' ')` (:624, 627) replace only the first underscore. That is fine for current types but inconsistent with `/_/g` elsewhere.
  - Admin route `/admin/scam-database` (App.tsx:159) mounts this same public component, which is hard-filtered to `verified`. There is no moderation queue, so pending reports can never be reviewed from the UI.
- **Recommended fixes:**
  - **P0** — Stop the false negative. Gate every call on `isSupabaseConfigured()` (in `scamDatabase.ts`/`scamCommunity.ts`, return `{error:'unavailable'}` early). In ScamDatabase.tsx:503-523, show the green state only when a real search completed without error. Otherwise show a neutral "We couldn't check this — use Chainabuse/Etherscan/…" message. Never say "No scams found" in any case: reword it to "No reports in our database — this does NOT mean it's safe".
  - **P0** — Remove `aggregateRating` from `generateScamDatabaseSchema` (SEO.tsx:646-652) and the "Real-time scam alerts" feature (:665). Remove the CryptoScamDB/ChainAbuse and "thousands of rug pulls" claims from the FAQ text (SEO.tsx:680, 694). Remove the "1,000+ verified reports" claims from public/llms.txt:6, 66 and fix the llms.txt:32 dead link.
  - **P0** — In static mode, hide the stat tiles (or hide them whenever every value is 0) and the "Report Scam" buttons (:565-571, :736-750). Alternatively point those buttons at external reporting (IC3, FTC, Chainabuse) until `/report-scam` works.
  - **P1** — Add a static content module `src/data/scamTypes.ts`: for each type, a definition, how it works, 4-6 red flags, a "what to do" section and source links. Add `src/data/notableScams.ts` with name, year, type, loss, jurisdiction, primary-source URL and status (charged/convicted/settled). Only include cases with a government or court source (NEEDS-OWNER editorial review). Render both as the page's default body (a crawlable H2 section per type, anchor links, a "Last updated" date and a methodology note), with DB reports as an additional "Community reports" section.
  - **P1** — Render the FAQ visibly (reuse the question text in `generateScamFAQSchema`) and keep the schema in sync. Update the IC3 figures to the latest year, with a visible source link. Add `BreadcrumbList` and an `ItemList` of the static scam types or cases. Use `Dataset` only if real rows exist.
  - **P1** — Fix the title to about 55 characters, for example "Crypto Scam Checker & Scam Types Database" (41 chars plus the suffix), and the description to 155 characters or less. Use `PAGE_METADATA.scamDatabase` instead of inline strings.
  - **P1** — Fix URL state: use a separate `mode` param for the search type, read `q` into `filters.query` on mount, and make the suggestion click pass explicit values to the search function.
  - **P1** — Make cards `<Link to={`/scam/${id}`}>` for crawlability and keyboard access.
  - **P2** — Lowercase address normalisation (write and query). Use a single mount effect. Add labels and ARIA to the search input and suggestions. Link to the related /learn guides using the seo.ts:1467 links.

---

### /scam/:id — src/pages/ScamReportDetail.tsx
- **Purpose / target query:** Long-tail "<domain/token> scam" queries. User-generated allegation pages.
- **Verdict:** **Poor.** It is unreachable in static mode and, with a DB, it publishes unvetted allegations as indexable Articles with followed links to scam sites.
- **Up-to-date issues:** None date-specific. The Twitter icon is used for all social links (:23, :537), which is cosmetic.
- **SEO issues:**
  - There is **no noindex logic at all**. Every report, including thin ones, is indexable with `Article` schema (SEO.tsx:732-784, used at :227-247). `dateModified` is set to `createdAt` (SEO.tsx:749), and the author is "Bitcoinvestments Community". Presenting user allegations as a publisher-authored Article is a YMYL/defamation risk.
  - The "Report Not Found" branch (:211-224) renders no `<SEO>`, so it inherits the index.html defaults, including `robots: index` and `canonical: /` (index.html:65, 97). This is a soft 404 with a wrong canonical. The loading state (:207-209) has the same problem.
  - The title `${report.title} - Crypto Scam Alert | Bitcoinvestments` has no length cap (:255). `seoDescription` (:250) can exceed 160 characters.
  - The status badge shows "PENDING"/"INVESTIGATING" (:311-313). Owners and admins can open non-verified reports (RLS select_own/select_admin), and `investigating` rows are public (comprehensive_rls_security.sql:468). These are indexable too.
- **GEO issues:** No BLUF ("what this is / what to do"). No provenance: the page never shows `source`, `verified_at` or `verified_by` even though those columns exist (migration :88-90, source column :6). The "Trust %" is unexplained. There is no "what to do if you interacted" guidance and no link to the relevant scam-type explainer.
- **Static + DB:**
  - **No DB:** the page is unreachable, because the list is empty and cards are not links. Direct visits trigger 3 failing requests and then show "Report Not Found" (indexable, as above). Vote, watchlist and dispute buttons navigate to `/login`, which is `ComingSoon` in static mode (App.tsx:185). Comments show "Sign in", which is also a dead end.
  - **With DB:** reads work. Comments join `users!user_id(email)` (scamDatabase.ts:390). Depending on `users` RLS this returns either null ("Anonymous") or **the commenter's email local part, which is shown publicly** (:681-684), a privacy leak. Vote counts never change (non-SECURITY-DEFINER trigger, see above), so a vote appears to do nothing. Dispute submission gives no success or error feedback (:171-176). The `disputes` tab is declared in state (:60) but never rendered.
  - **RLS holes (from the migrations):** `20260128000000_comprehensive_rls_security.sql` adds tighter scam policies (:466-505) but **never drops the original permissive ones** from `202512040000000…sql:224-247, 253-275`. Postgres ORs permissive policies, so the old ones still apply:
    - Any authenticated user can INSERT with `status='verified'` (`WITH CHECK (auth.uid() IS NOT NULL)`, :230-232). The client's `status:'pending'` (scamDatabase.ts:289) is not enforced.
    - A reporter can UPDATE their own report to `verified` (:234-238, no status restriction and no WITH CHECK).
    - Anyone can INSERT comments with `is_admin=true` or with another `user_id` (:263-265). The UI renders an "Admin" badge from that field (:687-691).
    - `scam_reporter_reputation` has `FOR ALL USING (true)` (202512230000000…sql:211-212), so any user can write any reputation row.
- **Uniqueness / content gaps:** Each page carries only as much value as the report behind it. It should show provenance (source, verified date, evidence count), a "defanged" URL, a block linking to the scam-type explainer, "what to do if you sent funds", and on-chain explorer links for the addresses (Etherscan/mempool.space).
- **Bugs:**
  - **Security:** `href={report.website_url}` (:473-476), the social links (:533-536) and the evidence links (:560-563) render user-supplied URLs as live, **followed** links to scam sites. The `rel` value is `noopener noreferrer` only, with no `nofollow ugc`. React 18 does not block `javascript:` URLs; it only warns. Combined with the RLS holes, any logged-in user can publish a verified report with a `javascript:` URL, which is stored XSS on click. The CSP allows `'unsafe-inline'` scripts (public/_headers).
  - Public display of `email_addresses` (:510-522) and the stored `phone_numbers` column are unverified PII about third parties.
  - `navigator.clipboard.writeText` is not awaited or caught (:180). The copy buttons have no aria-label (:494, :511). The dispute modal has no focus trap, Esc handler or `role="dialog"` (:664-666). The tabs lack `role="tab"`.
- **Recommended fixes:**
  - **P0** — New migration: `DROP POLICY` for the old scam_reports, comments and reputation policies. Add `WITH CHECK (status='pending' AND reported_by=auth.uid())` on insert. Change `update_own` so a user cannot change `status` (use a trigger or column GRANTs). Force `is_admin=false` for non-admins. Replace the `USING(true)` reputation policy with service-role only. Make `update_scam_vote_counts` and `update_dispute_count` `SECURITY DEFINER` with `SET search_path`, and add a trigger that calls `calculate_trust_score` (or drop "Trust %" from the UI).
  - **P0** — Render reported URLs defanged (`hxxps://example[.]com`) as plain text, not anchors. Allow links only through an `http(s)`-only validator for evidence. Add `rel="nofollow ugc noopener noreferrer"`. Stop displaying `email_addresses`, and do not select `users.email` in comments; use a display name instead.
  - **P0** — Add `noindex` to `<SEO>` on the not-found and loading branches and for any `status !== 'verified'`. Default report pages to `noindex` unless the report is verified **and** has 1 or more evidence links **and** a description of at least N words. Put the threshold in `index-pruning.ts` as a helper.
  - **P1** — Change the schema from a publisher `Article` to a neutral `WebPage` with `about`, and set `dateModified` from `updated_at`. Show visible provenance (source, verified date) and a legal disclaimer ("allegations submitted by users; not a finding of fact; dispute via…"). NEEDS-OWNER: legal wording and takedown/dispute process.
  - **P1** — Give dispute and comment feedback. Remove the unused `disputes` tab state or implement it. In static mode, hide vote, watchlist, dispute and comment controls instead of routing to ComingSoon.
  - **P2** — Add a11y to the dialog, tabs and copy buttons. Add explorer links for addresses. Cap the title and description lengths.

---

### /report-scam — src/pages/ReportScam.tsx (static-guarded)
- **Purpose / target query:** "report crypto scam", "how to report a bitcoin scam". Strong informational intent that is currently wasted.
- **Verdict:** **Poor.** In production it renders `ComingSoon` with no noindex and a homepage canonical, and the site still promotes it through two CTAs.
- **Up-to-date issues:** None in the form itself. `ComingSoon` suggests unrelated pages (Learn/Calculators/Compare/Prices) instead of real reporting channels.
- **SEO issues:**
  - `/report-scam` is in `NOINDEX_PATHS` (index-pruning.ts:22), but that is enforced only inside `<SEO>`. `ComingSoon` uses only `usePageTitle` (ComingSoon.tsx:6), so on a direct load the page keeps the index.html `robots: index` and `canonical: https://bitcoinvestments.net/` (index.html:65, 97). The usePageTitle.ts:16-17 comment ("every page reached by this hook is already path-noindexed") is wrong for static-guarded routes. robots.txt:44 explicitly `Allow: /report-scam`.
  - In non-static mode, `PageSEO` is rendered only on the form branch (ReportScam.tsx:212), not on the sign-in or submitted branches (:147-208). The `reportScam` metadata description is 169 characters (seo.ts:487-488). There are multiple H1s across branches, but only one per render.
  - The query "how to report a crypto scam" deserves an indexable page. The authed form page is not it.
- **GEO issues:** No content: no list of where to report (IC3, FTC, CFTC/SEC tips, state regulator, exchange, Chainabuse, or Action Fraud in the UK), no "what to collect" (tx hashes, addresses, screenshots), no recovery-scam warning.
- **Static + DB:** Static mode is a hard dead end (ComingSoon). With the DB, submission requires auth (`ProtectedRoute` plus the in-page `user` check at :99-102 and :144-166). `createScamReport` inserts directly from the browser (scamDatabase.ts:280-299). There is no validation of the URL scheme, address format or evidence links beyond `type="url"` on two inputs (:364, :523), and the RLS allows self-verification (see /scam/:id). `phone_numbers` is in state (:60) but never collected or sent. `estimated_loss_usd`/`victims_count` are self-reported with no bounds.
- **Could a public, no-auth path work?** Yes, and it is the right design for the static site:
  - **Option A (recommended): a Cloudflare Pages Function** `functions/api/scam-report.ts`. Validate with **Turnstile**, which is already allowed in the CSP: `script-src`/`frame-src https://challenges.cloudflare.com` (public/_headers). Use the existing `/api/*` rate-limit middleware (functions/api/_middleware.ts:23-54) and `functions/lib/validation.ts` for sanitisation. Then either (1) insert into `scam_reports` with the **service-role key** held server-side, forcing `status='pending'`, `source='user_reported'` and `reported_by=null`, or (2) with no DB, forward the report via the existing `functions/api/send-email.ts` mail path to a moderation inbox. The feature then works in STATIC_MODE without exposing an anon write surface.
  - **Option B: anon RLS insert** (`TO anon WITH CHECK (status='pending' AND reported_by IS NULL AND source='user_reported')`). This is feasible but has no bot protection or rate limiting beyond Supabase's defaults, so it is not recommended without Turnstile verification in front of it.
  - In either case, submissions must never auto-publish. Keep moderation, and add an admin pending queue, which is missing today (see the /scam-database admin-route note).
- **Uniqueness / content gaps:** Replace ComingSoon with a static "How to report a crypto scam" guide: BLUF, a step-by-step list of official channels with links, an evidence checklist, a "beware recovery scams" warning, and FAQ/HowTo schema. Put the optional community-report form (Option A) below it.
- **Bugs:** `phone_numbers` is never sent. There is no client validation of wallet address formats or `http(s)` scheme. `canProceed` returns a string or boolean mix (:88-91, harmless). "Report Another" resets the form without `website_url`/`blockchain`/etc., leaving them `undefined` (:188-197). That is fine functionally but inconsistent.
- **Recommended fixes:**
  - **P0** — Replace `staticGuard(<ProtectedRoute>…)` at App.tsx:184 with a static `ReportScamGuide` page that renders `<SEO>` (index, a proper title of 60 characters or less and a description of 160 or less, plus HowTo/FAQPage/BreadcrumbList schema) listing IC3/FTC/SEC/CFTC/state-regulator/exchange/Chainabuse channels. Remove `/report-scam` from `NOINDEX_PATHS` once it has real content. NEEDS-OWNER: jurisdictions to cover.
  - **P0** — Until then, make `ComingSoon` render `<SEO noindex>` (or have `usePageTitle` also set `robots: noindex` and remove the canonical) so static-guarded routes stop inheriting `index` plus a homepage canonical.
  - **P1** — Implement `functions/api/scam-report.ts` (Turnstile + rate limit + validation + a service-role insert as `pending`, or an email fallback). Point the form at it without requiring login. Validate URLs (`http(s)` only), EVM/BTC/SOL address formats and bounded numbers, and store `phone_numbers` only if moderation needs it (never display it).
  - **P1** — Add an admin moderation queue: status filter `pending`, calling `verifyScamReport` (scamDatabase.ts:328).

---

### Services — scamDatabase.ts, scamCommunity.ts, cryptoScamDbSync.ts, chainAbuseSync.ts
- **No `isSupabaseConfigured()` guard in any of them.** Every call hits the placeholder host. Add early returns.
- **`cryptoScamDbSync.ts` and `chainAbuseSync.ts` are dead code.** Nothing in src or functions imports them (grep). If they were ever run:
  - They insert rows as `status:'verified'` (cryptoScamDbSync.ts:160; chainAbuseSync.ts:128 and every seed row).
  - `getComprehensiveSampleData` holds about 25 **invented** "verified" reports with made-up domains (`coinbase-pro-trading.net`, `binance-careers-portal.com`, `tesla-btc-event.com`, …) and fabricated victim counts and losses (for example chainAbuseSync.ts:251-266: "1567 victims, $234,000"). `seedComprehensiveData` adds **random upvotes and trust scores** (chainAbuseSync.ts:737-739). `getSampleCryptoScamDBData` uses placeholder addresses such as `0xaaaa1111bbbb…` (cryptoScamDbSync.ts:~509).
  - Publishing these as verified reports would be fake data presented as real, and possibly defamatory toward whoever owns those domains.
  - `api.cryptoscamdb.org` is believed defunct, and neither it nor `api.chainabuse.com` is in the CSP `connect-src` (public/_headers), so both fetches would fail from the browser anyway. ChainAbuse also needs an API key, which must not ship in the client.
  - **Fix (P1):** delete the seed and sample generators. If syncing is wanted, move it to a scheduled Pages Function or Supabase Edge Function using the service role, importing as `source='chainabuse'` with `status='pending'` or a clearly labelled "third-party reported" status, and linking back to the source record.
- `getSearchSuggestions` issues a DB query on every keystroke with no debounce (ScamDatabase.tsx:114-124; scamDatabase.ts:170-175). Debounce by about 250 ms.
- `getCommunityStats` (scamCommunity.ts:405-431) fetches all vote ids. Use `count:'exact', head:true`.

---

### Cross-cutting YMYL note
The site accuses named domains and addresses of fraud. Before any report is public, the owner needs: a verification standard (what "verified" means), visible provenance on each report, a dispute/takedown process with a contact, a disclaimer that community reports are allegations, and `nofollow ugc` plus defanged links. NEEDS-OWNER: legal review. Until the RLS is fixed, "verified" carries no meaning because users can set it themselves.
