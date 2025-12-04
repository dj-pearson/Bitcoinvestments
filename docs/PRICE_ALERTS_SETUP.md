# Price Alerts System Setup Guide

This guide explains how to set up and deploy the automated price alert notification system.

## Overview

The price alert system consists of:

1. **Frontend UI** (`src/components/PriceAlerts.tsx`) - Users create alerts
2. **Database** (Supabase `price_alerts` table) - Stores alert configurations
3. **API Function** (`functions/api/check-price-alerts.ts`) - Checks prices and sends emails
4. **Cron Worker** (`workers/price-alerts-cron.ts`) - Runs on schedule

## How It Works

```
Every 5 minutes:
┌─────────────────┐
│ Cron Worker     │
│ (Scheduled)     │
└────────┬────────┘
         │ Triggers
         ▼
┌─────────────────┐
│ API Function    │
│ Check Alerts    │
└────────┬────────┘
         │
         ├─→ Fetch active alerts from Supabase
         ├─→ Get current prices from CoinGecko
         ├─→ Check if conditions met
         ├─→ Send email via Resend
         └─→ Mark alert as triggered
```

## Prerequisites

- ✅ Cloudflare account with Pages deployed
- ✅ Supabase project set up
- ✅ Resend account with API key
- ✅ Database tables created (from `supabase/schema.sql`)

## Step 1: Deploy the API Function

The API function is already in your repository at `functions/api/check-price-alerts.ts`.

When you deploy to Cloudflare Pages, it will automatically be available at:
```
https://your-domain.com/api/check-price-alerts
```

### Environment Variables Required

Set these in **Cloudflare Dashboard → Pages → Settings → Environment Variables**:

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `SUPABASE_URL` | Plain text | `https://xxx.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | `eyJhbGc...` | Service role key (has admin access) |
| `RESEND_API_KEY` | Secret | `re_...` | Your Resend API key |
| `FROM_EMAIL` | Plain text | `alerts@yourdomain.com` | Email address to send from |

## Step 2: Test the API Function Manually

Before setting up the cron job, test the function manually:

```bash
# Replace with your actual values
curl -X POST https://your-domain.com/api/check-price-alerts \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "checked": 5,
  "triggered": 2,
  "results": [...]
}
```

## Step 3: Deploy the Cron Worker

### Option A: Using Wrangler CLI (Recommended)

1. Install Wrangler if you haven't:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy the cron worker:
   ```bash
   wrangler deploy --config wrangler-cron.toml
   ```

4. Set required secrets:
   ```bash
   # Set Supabase service role key
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler-cron.toml
   # Paste your key when prompted

   # Set your Pages URL
   wrangler secret put PAGES_URL --config wrangler-cron.toml
   # Example: https://bitcoinvestments.net
   ```

### Option B: Using Cloudflare Dashboard

1. Go to **Cloudflare Dashboard → Workers & Pages**
2. Click **Create Application → Create Worker**
3. Name it `price-alerts-cron`
4. Replace the default code with contents from `workers/price-alerts-cron.ts`
5. Go to **Settings → Triggers → Cron Triggers**
6. Add cron schedule: `*/5 * * * *` (every 5 minutes)
7. Go to **Settings → Variables**
8. Add environment variables:
   - `PAGES_URL`: Your Cloudflare Pages URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Step 4: Verify It's Working

### Check Worker Logs

1. Go to **Cloudflare Dashboard → Workers & Pages**
2. Click on `price-alerts-cron`
3. Go to **Logs** tab (Real-time logs)
4. Wait for the next scheduled run (every 5 minutes)
5. Look for log messages like:
   ```
   Running scheduled price alert check...
   Price alert check completed: {"checked": 5, "triggered": 2}
   ```

### Check Database

Query your `price_alerts` table to see triggered alerts:

```sql
SELECT 
  id, 
  symbol, 
  target_price, 
  condition,
  is_active,
  triggered_at 
FROM price_alerts 
WHERE triggered_at IS NOT NULL
ORDER BY triggered_at DESC;
```

### Check Email Delivery

1. Go to **Resend Dashboard → Emails**
2. Look for recently sent price alert emails
3. Check delivery status and open rates

## Customizing the Schedule

Edit `wrangler-cron.toml` to change how often alerts are checked:

```toml
[triggers]
crons = ["*/5 * * * *"]  # Every 5 minutes (recommended)
```

Common schedules:
- `*/5 * * * *` - Every 5 minutes (recommended for price alerts)
- `*/15 * * * *` - Every 15 minutes (more conservative)
- `0 * * * *` - Every hour (for less time-sensitive alerts)
- `*/1 * * * *` - Every minute (use with caution - may hit rate limits)

After changing, redeploy:
```bash
wrangler deploy --config wrangler-cron.toml
```

## Rate Limits & Best Practices

### CoinGecko API Limits
- **Free tier**: ~50 calls/minute
- **Pro tier**: 500 calls/minute

With current implementation:
- Batches all cryptocurrency IDs into one request
- Typical run uses 1-2 API calls
- Safe to run every 5 minutes

### Resend Email Limits
- **Free tier**: 100 emails/day, 3,000/month
- **Pro tier**: 50,000 emails/month ($20)

Estimate your usage:
```
Daily emails = (Active alerts × Trigger probability × Checks per day)
Example: 100 alerts × 0.05 (5% trigger rate) × 288 (checks/day) = ~1,440 emails/day
```

### Optimization Tips

1. **Batch Processing**: Already implemented - one price fetch per unique cryptocurrency

2. **Smart Scheduling**: Adjust cron frequency based on:
   - High volatility = Check every 5 minutes
   - Low volatility = Check every 15-30 minutes

3. **Alert Limits**: Consider limiting alerts per user:
   ```sql
   -- Add to your users table
   ALTER TABLE users ADD COLUMN max_price_alerts INTEGER DEFAULT 10;
   ```

4. **Cooldown Period**: Prevent alert spam:
   ```sql
   -- Only check alerts not triggered in last hour
   WHERE (triggered_at IS NULL OR triggered_at < NOW() - INTERVAL '1 hour')
   ```

## Monitoring & Debugging

### View Recent Runs

Check worker execution history:
```bash
wrangler tail price-alerts-cron
```

### Manual Trigger (for testing)

Trigger the worker manually without waiting for cron:
```bash
curl https://price-alerts-cron.your-subdomain.workers.dev \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

### Common Issues

#### 1. No alerts being triggered

**Check:**
- Are there active alerts in the database?
- Are the target prices realistic?
- Check CoinGecko API status

**Debug query:**
```sql
SELECT 
  symbol,
  target_price,
  condition,
  is_active
FROM price_alerts 
WHERE is_active = true;
```

#### 2. Emails not sending

**Check:**
- Resend API key is set correctly
- FROM_EMAIL domain is verified in Resend
- Check Resend dashboard for error logs
- Verify user emails are valid

**Test email manually:**
```bash
curl https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "alerts@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

#### 3. Worker not running

**Check:**
- Cron trigger is configured in Cloudflare Dashboard
- Worker is deployed successfully
- Environment variables are set

**View scheduled triggers:**
```bash
wrangler triggers list --config wrangler-cron.toml
```

## Cost Breakdown

All costs are for production scale (1,000 active alerts):

### Cloudflare Workers
- **Free tier**: 100,000 requests/day
- **Usage**: ~288 cron runs/day = **FREE**
- **Paid**: $5/month for 10M requests (only if needed)

### Supabase
- **Free tier**: 50,000 monthly active users
- **Usage**: Price alerts queries are minimal = **FREE**
- **Paid**: $25/month for Pro (only if scaling beyond free tier)

### CoinGecko
- **Free tier**: 50 calls/minute
- **Usage**: 1-2 calls per check = **FREE**
- **Paid**: $129/month for Pro (only for high-frequency trading apps)

### Resend
- **Free tier**: 3,000 emails/month
- **Usage**: Depends on trigger rate
- **Paid**: $20/month for 50,000 emails

**Total Monthly Cost**: $0 - $45 depending on scale

## Advanced Features (Future Enhancements)

### 1. Alert History
Track all alert triggers for user analytics:
```sql
CREATE TABLE price_alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES price_alerts(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  target_price DECIMAL,
  actual_price DECIMAL,
  condition VARCHAR(10)
);
```

### 2. Multi-Condition Alerts
Allow users to set multiple conditions:
- Price crosses above AND RSI > 70
- 24h volume increase > 50%
- Price changes > 10% in 1 hour

### 3. Notification Channels
Add SMS, Discord, Telegram notifications:
```typescript
interface NotificationChannel {
  type: 'email' | 'sms' | 'discord' | 'telegram';
  value: string; // email, phone, webhook URL, etc.
}
```

### 4. Smart Alerts
AI-powered price predictions and anomaly detection:
- "Notify me if BTC price is unusual"
- "Alert on whale movements"
- "Notify on sentiment shifts"

## Support & Troubleshooting

If you need help:

1. Check Worker logs in Cloudflare Dashboard
2. Check API function logs in Pages Dashboard
3. Verify all environment variables are set
4. Test each component individually
5. Check Resend and Supabase dashboards for errors

For more help:
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Docs](https://supabase.com/docs)
- [Resend Docs](https://resend.com/docs)

---

Last updated: December 2024

