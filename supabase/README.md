# Supabase Database Setup

This directory contains the database schema and migrations for Bitcoinvestments.

## Quick Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor (left sidebar)
3. Click "New Query"
4. Copy the entire contents of `schema.sql` and paste it into the editor
5. Click "Run" to execute the schema
6. Verify tables were created by checking the "Table Editor" section

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
npx supabase login

# Link your project (replace with your project reference)
npx supabase link --project-ref <your-project-ref>

# Push the schema to your remote database
npx supabase db push
```

## Schema Overview

The database includes the following tables:

### Core Tables
- **users** - User profiles extending Supabase Auth (with preferences, subscription status, referral codes)
- **portfolios** - User cryptocurrency portfolios
- **holdings** - Individual cryptocurrency holdings within portfolios
- **transactions** - Transaction history (buy, sell, transfers, staking)
- **price_alerts** - User-configured price alerts

### Content & Marketing
- **articles** - Educational content and blog posts
- **newsletter_subscribers** - Email newsletter subscribers
- **advertisements** - Self-hosted ad campaigns

### Analytics
- **affiliate_clicks** - Affiliate link tracking and conversion data

## Features Included

### Security
- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access their own data
- Public read access for published content (articles, active ads)

### Performance
- Indexes on frequently queried columns
- Optimized for user lookups, portfolio queries, and content retrieval

### Functions
- `update_updated_at_column()` - Auto-updates timestamps
- `increment_ad_impressions()` - Track ad impressions
- `increment_ad_clicks()` - Track ad clicks
- `generate_referral_code()` - Generate unique referral codes

### Triggers
- Automatic timestamp updates on users, portfolios, holdings, and articles

## Environment Variables

Make sure your `.env` file has the following variables set:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

You can find these in your Supabase project settings under "API".

## Testing the Setup

After running the schema, test the connection by trying to:

1. Create a user account through your app
2. Check if the user appears in the `users` table
3. Try adding a portfolio to verify RLS policies are working
4. Check if price alerts and other user-specific features work

## Regenerating Types

If you modify the schema, regenerate the TypeScript types:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

Or update the types manually in `src/types/database.ts`.

## Troubleshooting

### "relation already exists" errors
If you see errors about tables already existing, you can:
1. Drop all tables manually in the Supabase dashboard
2. Or use `DROP TABLE IF EXISTS` statements before recreating

### RLS policy issues
If users can't access their data:
1. Check that RLS is enabled on the table
2. Verify the user is authenticated (`auth.uid()` returns a value)
3. Review the specific policy rules in the schema

### Migration conflicts
If you need to reset the database:
1. Go to Database > Tables in Supabase dashboard
2. Delete all custom tables (keep `auth.users` and other system tables)
3. Re-run the schema.sql file
