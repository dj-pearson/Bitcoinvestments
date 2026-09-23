/**
 * Accounts switch
 *
 * The site ships as a static content site. Accounts (sign-in, profile, the
 * dashboards behind a login, the admin panel) are turned on by ONE build
 * variable, so the owner can flip it in the Cloudflare Pages build settings
 * without a code change:
 *
 *   VITE_ACCOUNTS_ENABLED=true
 *
 * It is read at build time (Vite inlines `import.meta.env.VITE_*`), so it must
 * be set as a Cloudflare Pages *build* environment variable, not only in
 * wrangler.toml [vars] (those reach Pages Functions at runtime, not the Vite
 * build). The same applies to VITE_SUPABASE_URL and
 * VITE_SUPABASE_PUBLISHABLE_KEY.
 *
 * Turning the switch on is necessary but not sufficient: every account route
 * also goes through <FeatureGate> (src/components/FeatureGate.tsx), which
 * checks that Supabase is configured and that the database reports the schema
 * version this build needs (src/hooks/useBackendStatus.ts). If either check
 * fails the route shows the feature's "coming soon" page instead of a broken
 * screen. See rebuild/REBUILD_GUIDE.md for the go-live checklist.
 */
export const ACCOUNTS_ENABLED = import.meta.env.VITE_ACCOUNTS_ENABLED === 'true';

/**
 * Kept for the existing call sites (Header, App, AuthContext). True while
 * accounts are off: no auth provider, no session UI, gated routes render
 * ComingSoon, and the header shows the static-mode call to action.
 */
export const STATIC_MODE = import.meta.env.VITE_ACCOUNTS_ENABLED !== 'true';
