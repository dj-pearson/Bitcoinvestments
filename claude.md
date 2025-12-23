# Bitcoin Investments - Claude Build Guide

## Build Command

```bash
npm run build
```

This command runs TypeScript compilation and Vite build:
- `tsc -b` - TypeScript compiler in build mode
- `vite build` - Vite production build

## Current Build Status

### ✅ Fixed Issues
- Removed unused imports and variables across multiple files
- Fixed syntax errors in React components
- Stubbed out NFT Portfolio service calls for non-existent tables
- Made XLSX export functionality optional (requires `npm install xlsx`)
- Fixed import issues in:
  - `src/components/SponsoredContent/NativeAd.tsx`
  - `src/pages/AdvertiserDashboard.tsx`
  - `src/pages/DeveloperPortal.tsx`
  - `src/pages/InfluencerVerification.tsx`
  - `src/pages/LendingComparison.tsx`
  - `src/pages/OnChainAnalytics.tsx`
  - `src/pages/SocialTrading.tsx`

### ⚠️ Remaining Issues

The build currently fails due to TypeScript errors in service files that reference Supabase tables that don't exist in the database schema yet. These tables are defined in migrations but haven't been applied.

#### Affected Services:
1. **`src/services/influencerVerification.ts`** - References tables:
   - `verified_influencers`
   - `influencer_verification_requests`
   - `influencer_performance_snapshots`
   - `influencer_trade_claims`
   - `influencer_transparency_subscriptions`

2. **`src/services/lendingComparison.ts`** - References tables:
   - `lending_platforms`
   - `lending_rates`
   - `lending_rate_history`
   - `lending_referrals`

3. **`src/services/onchainAnalytics.ts`** - References tables:
   - `onchain_analytics_subscriptions`
   - `onchain_metrics`
   - `onchain_alerts`
   - `onchain_dashboards`

4. **`src/services/socialTrading.ts`** - References tables:
   - `published_portfolios`
   - `portfolio_followers`
   - `copy_trading_subscriptions`
   - `copy_trade_executions`
   - `published_portfolio_history`
   - `creator_earnings`

5. **`src/services/nftPortfolio.ts`** - References tables:
   - `nft_portfolio_subscriptions`
   - `nft_price_alerts`

## Solutions

### Option 1: Run Migrations (Recommended for Production)

Apply the Supabase migrations to create the required tables:

```bash
# If using Supabase CLI locally
supabase db push

# Or run specific migrations
supabase migration apply
```

After running migrations, regenerate TypeScript types:

```bash
# Generate types from your Supabase schema
supabase gen types typescript --local > src/types/database.types.ts
```

### Option 2: Stub Out Service Calls (Quick Fix for Development)

I've partially stubbed out some service calls, but more need to be done. To complete this:

1. Comment out all Supabase `.from()` calls in the affected services
2. Return demo data or throw "Not implemented" errors
3. Add `// TODO: Enable once migration is run` comments

Example pattern:
```typescript
export async function getFunction(): Promise<Type> {
  // TODO: Enable once migration is run
  return DEMO_DATA; // or throw new Error('Not implemented - migration required');
  
  /*
  const { data, error } = await supabase
    .from('non_existent_table')
    .select('*');
  
  if (error) throw error;
  return data;
  */
}
```

### Option 3: Install Missing Dependencies

For XLSX exports to work:

```bash
npm install xlsx @types/xlsx
```

Then uncomment the XLSX code in `src/services/premiumExport.ts`.

## Development Workflow

1. **Local Development**:
   ```bash
   npm run dev
   ```

2. **Type Checking**:
   ```bash
   npm run type-check
   # or
   tsc --noEmit
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```

4. **Preview Production Build**:
   ```bash
   npm run preview
   ```

## Migration Files

The following migrations define the new monetization tables:

- `supabase/migrations/20251222_create_sponsored_content.sql` - Sponsored content system
- `supabase/migrations/20251222_create_advanced_monetization_features.sql` - Advanced features

These migrations need to be applied to your Supabase instance before the TypeScript types will be available.

## Next Steps

To get the build working:

1. **Immediate**: Run the migrations on your Supabase instance
2. **Then**: Regenerate TypeScript types from the updated schema  
3. **Finally**: Run `npm run build` again

OR

1. **Quick Fix**: Complete stubbing out all Supabase calls in the affected services
2. **Use demo data** for development until migrations are ready
3. **Build will succeed** but features won't be functional until migrations are applied

## Environment Variables

Ensure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

For Cloudflare Pages deployment:

1. Build succeeds: `npm run build`
2. Output directory: `dist/`
3. Build command: `npm run build`
4. Node version: 18 or higher

---

**Note**: The monetization features are currently in development. Demo data is available for UI testing, but full functionality requires database migrations to be applied.

