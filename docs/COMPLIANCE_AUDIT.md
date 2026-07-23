# Compliance Audit — Legal Documents, GDPR/CCPA & ADA/WCAG

**Date:** July 23, 2026
**Scope:** Required legal pages (Privacy, Terms, Disclaimer, Accessibility), GDPR /
UK GDPR / ePrivacy / CCPA-CPRA compliance, and ADA / WCAG 2.1 Level AA accessibility.
**Application:** React + Vite + TypeScript SPA on Cloudflare Pages, Supabase backend.

> **Disclaimer:** This is an engineering compliance review, not legal advice. Several
> items (registered legal entity name/address, governing law, definitive retention
> periods, DPA/processor agreements) require sign-off from qualified legal counsel
> before relying on them.

---

## 1. Executive summary

The site already had a strong *foundation*: dedicated Privacy, Terms, Disclaimer and
Accessibility pages, a cookie consent banner, and an unusually complete accessibility
component library (skip links, route announcer, focus manager, accessibility settings
widget, accessible table/icon primitives).

However, the audit found that several of these mechanisms were **cosmetic or
over-stated**, creating real regulatory exposure:

- **The cookie banner did not actually control any tracking.** Google Analytics loaded
  unconditionally in `<head>` before consent, and Plausible loaded on every production
  page load. The banner's analytics/marketing toggles only wrote to `localStorage` and
  `console.log`ged — nothing read that choice. This is the core ePrivacy/GDPR failure.
- **There was no way to withdraw consent** after the first choice (GDPR Art. 7(3)).
- **The Privacy Policy was missing** most mandatory GDPR Art. 13 disclosures and all CCPA
  opt-out disclosures.
- **The Accessibility Statement claimed full WCAG 2.1 AA conformance on every criterion**
  while the shipped code demonstrably failed several — itself the most common trigger for
  ADA demand letters.

The high- and medium-priority items have been remediated in this change set (Section 2).
Remaining lower-priority and systemic items are tracked as a roadmap in Section 4.

---

## 2. Changes made in this audit

### GDPR / ePrivacy — consent now actually gates tracking

| # | Change | Files |
|---|--------|-------|
| 1 | Google Analytics now uses **Consent Mode v2** with all storage `denied` by default; consent is only granted after the user opts in. A returning visitor's saved choice is restored before the first hit. `anonymize_ip` enabled. | `index.html` |
| 2 | New **central consent module** — single source of truth for reading/writing consent, updating Google Consent Mode, and broadcasting changes. | `src/lib/consent.ts` (new) |
| 3 | Cookie banner rewritten to **persist real choices and apply them** (Google consent update + Plausible load), instead of `console.log`. Default is analytics/marketing **off**. | `src/components/CookieConsent.tsx` |
| 4 | **Plausible is no longer loaded, and no events are sent, without analytics consent**; it initializes (or re-initializes) when consent is granted. | `src/services/analytics.ts`, `src/components/AnalyticsProvider.tsx` |
| 5 | **"Cookie Preferences" control** added to the footer and Privacy Policy so consent can be **withdrawn as easily as it was given** (Art. 7(3)). | `src/components/Layout/Footer.tsx`, `src/pages/Privacy.tsx`, `src/lib/consent.ts` |
| 6 | Ad **impression/click tracking gated behind marketing consent**. | `src/components/Advertisement.tsx` |
| 7 | Newsletter forms now include a **privacy-policy notice/link at the point of collection** (Art. 13). | `src/components/Newsletter.tsx` |

### Legal documents

| # | Change | Files |
|---|--------|-------|
| 8 | **Privacy Policy substantially expanded** to add: named data controller + contact; a legal-basis table (GDPR Art. 6); a cookie table naming Google Analytics/Plausible; data-retention periods; international-transfer safeguards (SCCs/UK IDTA); right to lodge a complaint with a supervisory authority; and a CCPA/CPRA section with a "Do Not Sell or Share" notice + GPC acknowledgement. | `src/pages/Privacy.tsx` |
| 9 | **"Last updated" dates fixed** to a real constant on Privacy and Terms/Disclaimer (were a live `new Date()` clock that always showed "today"). | `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` |
| 10 | Fixed the cookie-banner link that pointed to a non-existent `/legal/terms` route (now `/terms`). | `src/components/CookieConsent.tsx` |
| 11 | Renewed the expired `security.txt` (`Expires` was 2025-12-31) and removed the broken `Encryption:` pointer to a missing PGP key. | `public/.well-known/security.txt` |

### ADA / WCAG 2.1 AA

| # | Change | Criterion | Files |
|---|--------|-----------|-------|
| 12 | **Accessibility Statement made honest** — changed from "conforms" to "**partially conformant / actively remediating**", marked the genuinely-failing success criteria as *In Progress*, softened the unsubstantiated AT-testing claim, and fixed the always-today "Last reviewed" date. | Statement integrity | `src/pages/Accessibility.tsx` |
| 13 | Cookie banner given **dialog semantics** (`role="dialog"`, `aria-modal`, labelled/described), a **focus trap**, initial focus, focus restore, and Escape handling. Its toggles are now real `role="switch"` controls with accessible names (were unnamed buttons). | 4.1.2, 2.1.1, 2.4.3 | `src/components/CookieConsent.tsx` |
| 14 | `SessionExpiredModal` given `role="dialog"`/`aria-modal`/labelled + Escape + backdrop `aria-hidden`. | 4.1.2, 2.1.2 | `src/components/SessionExpiredModal.tsx` |
| 15 | Header user-account menu was **hover-only** (keyboard/touch users could not open it); added click + Escape handling. | 2.1.1 | `src/components/Layout/Header.tsx` |
| 16 | Global search input had **no accessible name** (placeholder only); added `aria-label` + `type="search"`. | 3.3.2, 4.1.2 | `src/components/GlobalSearch.tsx` |
| 17 | Newsletter email inputs given accessible labels. | 3.3.2 | `src/components/Newsletter.tsx` |
| 18 | Pricing page **heading hierarchy** fixed (h1 → h3 skip); added section-level `h2`s. | 1.3.1 | `src/pages/Pricing.tsx` |
| 19 | Low-contrast footer text (`text-gray-500/600` on dark) lifted to `text-gray-400`. | 1.4.3 | `src/components/Layout/Footer.tsx`, `src/components/Newsletter.tsx` |

All changes pass `tsc -b`, `eslint` (no new errors), and a production `vite build`.

---

## 3. What was already compliant (kept as-is)

- **Legal pages exist and are routed/linked:** Privacy, Terms, Disclaimer, Accessibility,
  all present in the footer's Legal section.
- **Affiliate disclosure** is clear and labelled; ads use `rel="sponsored noopener"` and
  are suppressed for premium users.
- **Security headers** (`public/_headers`): strong CSP, HSTS with preload, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Accessibility infrastructure** is genuinely good: skip links with matching targets,
  `role`-correct landmarks, polite route announcer, focus manager, accessibility settings
  widget honoring `prefers-reduced-motion`/`prefers-contrast`, `.sr-only`/`:focus-visible`
  utilities, `<html lang="en">`, and a zoom-friendly viewport meta (no `user-scalable=no`).
- `KeyboardShortcutsHelp`, `AccessibilityWidget`, `ConfirmationDialog` are exemplary
  accessible dialogs and were used as the template for the fixes above.
- **No Facebook Pixel / AdSense / Hotjar / Mixpanel** — the third-party tracking surface is
  limited to GA + Plausible.

---

## 4. Remaining roadmap (not yet addressed)

These are lower-priority or systemic items that should be scheduled. None are believed to be
active data leaks, but they are needed for a clean bill of health.

### Legal / privacy
- **Fill in the registered legal entity name and postal address** in the Privacy Policy and
  Terms (currently "available on request"). Confirm the **governing law / jurisdiction** in
  Terms with counsel.
- Confirm **actual data-retention periods** and processor list with the business; the values
  in the policy are reasonable defaults, not verified facts.
- Ensure **Data Processing Agreements (DPAs)** are on file with Google, Supabase, Cloudflare,
  Stripe, and the email provider.
- Consider a **standalone Cookie Policy** page (currently a detailed section within Privacy).
- Implement **actual GPC signal handling** in code (`navigator.globalPrivacyControl`) to
  auto-apply an opt-out, to fully back the CCPA statement.

### Accessibility (systemic)
- **Audit remaining `fixed inset-0` overlays/modals** (~20: `PortfolioShareModal`,
  `UpgradePrompt`, `EnrollmentPrompt`, `EarlyAccess`, `WalletImport`, `TransactionImport`,
  etc.) and wrap them with the existing `FocusManager` + dialog semantics.
- **Systemic contrast sweep** of remaining `text-gray-500`/`text-gray-600` body text on dark
  backgrounds across pages/components (Header submenu descriptions, form hints, table labels).
- **Click-handlers on non-interactive elements** (`div onClick` without role/tabindex/keydown)
  — e.g. `VideoLibrary` cards, `ScamReportDetail`. Adopt the `AccessibleTable` keyboard pattern.
- Add **arrow-key roving** between menu items in the header dropdowns (currently Tab-only).
- Wire **automated a11y testing into CI** — add `eslint-plugin-jsx-a11y` and `jest-axe` or a
  Playwright + axe check so regressions are caught (the existing `src/lib/a11y-testing.ts` is
  dev-console only).

### Verification
- Run a full **screen-reader pass** (NVDA/VoiceOver) and an **axe DevTools scan** on the
  deployed site, then update the Accessibility Statement's success-criteria table from
  observed results rather than assumptions.
- Re-test the consent flow end-to-end in the browser: confirm **no `_ga`/`_ga_*` cookies are
  set and no GA/Plausible network calls fire before "Accept"**, and that "Reject" keeps them
  off. (Verified in code; recommended to confirm live.)

---

## 5. Regulation cross-reference

| Requirement | Regulation | Status after this change |
|---|---|---|
| Prior consent before non-essential cookies | ePrivacy Art. 5(3) | **Fixed** — Consent Mode default-denied + gated Plausible |
| Lawful basis documented | GDPR Art. 6 / 13(1)(c) | **Fixed** — legal-basis table in Privacy |
| Consent withdrawable as easily as given | GDPR Art. 7(3) | **Fixed** — footer/Privacy "Cookie Preferences" |
| Info provided at point of collection | GDPR Art. 13 | **Fixed** — newsletter privacy notice |
| Retention periods | GDPR Art. 13(2)(a) | **Fixed (values to confirm)** |
| International transfer safeguards | GDPR Art. 44–49 | **Fixed** — SCC/UK IDTA disclosure |
| Right to complain to supervisory authority | GDPR Art. 13(2)(d) | **Fixed** |
| Named controller + contact | GDPR Art. 13(1)(a) | **Partial** — email done; postal address TBC |
| "Do Not Sell/Share" + opt-out | CCPA/CPRA §1798.135 | **Fixed (GPC code TBD)** |
| Honor GPC signal | CCPA/CPRA | **Stated; code implementation TBD** |
| WCAG 2.1 AA conformance claim accuracy | ADA / Statement integrity | **Fixed** — now honest/partial |
| Keyboard operability | WCAG 2.1.1 | **Improved** — key blockers fixed; sweep ongoing |
| Name/Role/Value on controls | WCAG 4.1.2 | **Improved** — banner/search/modal fixed |
| Contrast (minimum) | WCAG 1.4.3 | **Improved** — footer fixed; full sweep pending |
