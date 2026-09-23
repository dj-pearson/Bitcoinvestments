# Per-page review brief (READ-ONLY — do not edit any files in the repo)

Repo: /home/user/Bitcoinvestments — Bitcoinvestments.net, a crypto education + tools site for beginner/intermediate investors (25-55).
Stack: React 18 SPA + Vite + Tailwind, react-router routes in src/App.tsx, deployed on Cloudflare Pages. Supabase (Postgres) is the database; `src/lib/supabase.ts` exposes `isSupabaseConfigured()`. `src/config/staticMode.ts` has `STATIC_MODE = true` which swaps auth-gated routes for <ComingSoon/>. SEO via `src/components/SEO.tsx`, `src/components/PageSEO.tsx`, `src/lib/seo.ts` (PAGE_METADATA + schema helpers), `src/lib/index-pruning.ts`, `src/components/GEOContent.tsx`, `public/sitemap.xml`, `public/llms.txt`. Today is 2026-09-23. No network access to the live site or Supabase — review from code.

Owner's goals for every page:
1. **Up to date** — no stale years ("2024", "2025" as current), outdated fees/product facts, dead products (e.g. discontinued exchanges/wallets/services), stale "last updated" dates, removed features still referenced (Web3 wallet connect was removed), broken internal links to routes that don't exist in App.tsx.
2. **SEO / GEO best practices** — unique title (<60 chars) + meta description (<160), one H1, logical H2/H3, canonical, correct index/noindex, relevant JSON-LD (Article, FAQPage, HowTo, BreadcrumbList, Product/Review, SoftwareApplication/WebApplication for calculators, Dataset, etc.), internal links, image alt text. GEO (generative-engine optimisation): a BLUF answer-first summary, clear definitions, concrete facts/numbers with sources, FAQ blocks, "last updated" date visible, author/entity signals (E-E-A-T), content that an LLM could quote. Note the SPA serves an empty index.html to non-JS crawlers — flag what content on the page would need to be prerendered/static.
3. **Static baseline + database** — the page should render complete, useful content with no database (static data in src/data or in-file), AND when Supabase is available it should read/write the DB for dynamic parts (blog posts, scam reports, reviews, subscriptions, alerts, etc.) with graceful fallback, loading, empty and error states. Flag: pages that are blank/broken without DB; pages that show fake/mock/random data as if it were real (a trust and YMYL problem); DB calls that are never reached; features promising things that cannot work on the static site; missing fallback.
4. **Unique, informative experience** — is the page thin, templated, or duplicative of another page? What unique, genuinely useful information/tool would make it the best answer for its query? Be concrete (sections, data points, interactive bits).

Also note real bugs you see (crashes, wrong math, broken links, a11y issues).

## Output format (return this as your final message, markdown)
For EACH page/route in your scope:
### <route> — <file>
- **Purpose / target query:**
- **Verdict:** (Good / Needs work / Poor) one line
- **Up-to-date issues:** bullet list with file:line
- **SEO issues:** bullet list with file:line
- **GEO issues:**
- **Static + DB:** how it behaves with/without DB; issues with file:line
- **Uniqueness / content gaps:**
- **Bugs:**
- **Recommended fixes (prioritised P0/P1/P2):** each one concrete and implementable, naming the file(s) and what to change. Mark anything that needs owner input (e.g. real business data, legal text) as NEEDS-OWNER.

Keep it factual and concise — verify every claim by reading the code; do not guess. Cite file:line. Don't pad.
