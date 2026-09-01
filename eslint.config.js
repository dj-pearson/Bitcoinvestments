import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'

/**
 * Lint policy
 *
 * CI runs `pnpm run lint` and fails on errors, so the split below matters:
 *
 *   error   — something is wrong or will break: unused code, hook-order
 *             violations, unscoped case declarations.
 *   warn    — tech debt worth burning down, but not a defect. Reported on every
 *             run and visible in CI output without gating a merge.
 *
 * The rules demoted to `warn` each have a comment saying why and what it would
 * take to promote them back to `error`. They were previously errors, but with
 * CI unable to install dependencies nothing enforced them — so they accumulated
 * into several hundred findings that would have blocked every build.
 */
export default defineConfig([
  globalIgnores(['dist', 'test-reports', 'rebuild']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Conventional escape hatches. `ignoreRestSiblings` matters here: the
      // codebase uses the rest-sibling omit pattern to strip custom options off
      // a `RequestInit` (see src/lib/apiClient.ts), where the named bindings are
      // unused by design. An underscore prefix marks a deliberately unused
      // binding everywhere else.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // ~130 sites, mostly Supabase row shapes and third-party payloads that
      // need real interfaces written for them. Each is a small typing task, not
      // a defect. Promote to `error` once the count reaches zero.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Fast Refresh ergonomics, not correctness: these fire on files that
      // export a component alongside a constant or hook (AuthContext exporting
      // both AuthProvider and useAuth, for example), which is a deliberate and
      // common colocation.
      'react-refresh/only-export-components': 'warn',

      // The React Compiler lint rules are new and fire on legitimate patterns
      // this codebase uses throughout — notably `setState` inside a data-loading
      // effect. Worth working through deliberately rather than in a bulk edit
      // that risks changing fetch behaviour.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  {
    // Node-side code: Cloudflare Functions, cron workers and the local testing
    // tools run outside the browser and legitimately use Node globals.
    files: ['functions/**/*.ts', 'workers/**/*.ts', 'tools/**/*.ts', 'scripts/**/*.{ts,js}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  eslintConfigPrettier,
])
