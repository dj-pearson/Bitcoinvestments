# Supabase database

The schema is built by the files in `migrations/`, applied in file-name order
(`pnpm dlx supabase db push`, or `db reset` locally). The full procedure,
environment variables and go-live checklist are in
[`rebuild/REBUILD_GUIDE.md`](../rebuild/REBUILD_GUIDE.md).

- **Do not run `schema.sql`.** It is a legacy snapshot kept for reference.
  Running it before the migrations makes `20251223161809_remote_schema.sql`
  fail, because the enum types it creates already exist.
- `20260923000300_reconcile_schema.sql` must be applied before accounts are
  switched on (`VITE_ACCOUNTS_ENABLED=true`). It restores the sign-up trigger
  that creates `public.users` rows, adds the columns and tables the app uses,
  and records `app_meta.schema_version`, which the front end checks before it
  enables account pages.
- New migrations that the front end depends on should bump
  `app_meta.schema_version` (with `GREATEST`, so it never goes backwards) and
  `REQUIRED_SCHEMA_VERSION` in `src/hooks/useBackendStatus.ts` together.
- Every migration must be safe to replay on an empty database. Guard statements
  on tables another file creates, and prefer `IF NOT EXISTS` / `DROP … IF
  EXISTS` so a file can be re-run on a database that was partly changed by hand.

## Troubleshooting

- **Account pages say "Temporarily unavailable".** The schema check failed:
  the project is paused or unreachable, or `select value from app_meta where
  key = 'schema_version'` is missing or older than the build expects.
- **"new row violates row-level security policy".** Check the table's policies
  in `migrations/`; writes that only the server may make (payments,
  subscriptions, roles) go through the service role in `functions/api/`.
