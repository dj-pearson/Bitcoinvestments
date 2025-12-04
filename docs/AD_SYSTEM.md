# Self-Hosted Ad System Documentation

Bitcoin Investments includes a complete self-hosted advertising system that allows you to monetize your platform without relying on Google AdSense or other third-party networks.

## Features

### ✅ Complete Ad Management
- Create, edit, and delete ad campaigns
- Multiple ad zones (banner, sidebar, native, popup)
- Schedule ads with start/end dates
- Pause/resume campaigns on demand
- Real-time performance tracking

### ✅ Smart Ad Serving
- Automatic ad rotation based on performance (CTR)
- Impression tracking with visibility detection
- Click tracking with attribution
- Avoid showing same ad multiple times
- Target ads by page, device, or custom criteria

### ✅ Analytics & Reporting
- Impressions and clicks per campaign
- Click-through rate (CTR) calculation
- Revenue tracking (estimated)
- Platform-level performance breakdown
- Real-time dashboard

### ✅ Privacy & Consent
- Respects cookie consent preferences
- No ads for premium users
- No tracking of personal data
- GDPR compliant

## Architecture

### Database Schema

The system uses a single `advertisements` table with:
- Campaign details (name, advertiser, dates)
- Creative assets (image, CTA, alt text)
- Performance metrics (impressions, clicks)
- Targeting options (JSON field)
- Status management (active/paused/ended)

### Components

```
src/
├── services/
│   ├── ads.ts              # Ad serving logic
│   └── database.ts         # Database operations
├── components/
│   └── AdUnit.tsx          # Ad display components
└── pages/
    ├── AdManager.tsx       # Admin interface
    └── AffiliateStats.tsx  # Analytics (includes ads)
```

## Quick Start

### 1. Access Ad Manager

Navigate to `/ad-manager` (requires login)

### 2. Create Your First Ad

Click "Create Ad" and fill in:

**Required Fields:**
- **Campaign Name**: Internal identifier (e.g., "Coinbase Summer 2024")
- **Advertiser ID**: Unique ID for tracking (e.g., "coinbase-q2-2024")
- **Ad Zone**: Where the ad will appear
- **Image URL**: Link to your ad creative
- **Target URL**: Where clicks will go
- **Alt Text**: Accessibility description
- **Start/End Date**: Campaign duration

**Optional Fields:**
- **CTA Text**: Call-to-action button text
- **Status**: Active/Paused/Ended

### 3. Add Ads to Your Pages

```tsx
import { BannerAd, SidebarAd, NativeAd } from '../components/AdUnit';

function MyPage() {
  return (
    <div>
      {/* Top banner ad */}
      <BannerAd className="mb-6" />

      {/* Sidebar layout with ad */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Main content */}
        </div>
        <div>
          <SidebarAd />
        </div>
      </div>

      {/* Native ad in content */}
      <NativeAd className="my-8" />
    </div>
  );
}
```

## Ad Zones

### Banner (728x90 or 970x90)
- **Best for**: Top of page, high visibility
- **Recommended size**: 970x90 (desktop), 728x90 (mobile)
- **Typical CPM**: $2-5

**Usage:**
```tsx
<BannerAd />
```

### Sidebar (300x250 or 300x600)
- **Best for**: Right sidebar, persistent visibility
- **Recommended size**: 300x600 (half-page) or 300x250 (medium rectangle)
- **Typical CPM**: $1-3

**Usage:**
```tsx
<SidebarAd />
```

### Native (Flexible)
- **Best for**: In-content, looks like regular content
- **Recommended size**: Flexible, typically 600x400 max
- **Typical CPM**: $3-8 (higher engagement)

**Usage:**
```tsx
<NativeAd />
```

### Popup/Modal (550x480)
- **Best for**: High-value promotions, limited use
- **Recommended size**: 550x480
- **Typical CPM**: $5-15 (use sparingly to avoid annoying users)

**Note**: Popup ads require additional implementation

## Advanced Features

### Ad Targeting

Target ads by page, device, or custom criteria:

```typescript
// In Supabase, set the 'targeting' JSON field:
{
  "pages": ["/calculators", "/compare"],
  "device": "desktop",  // or "mobile"
  "custom": {
    "userType": "premium"
  }
}
```

### Ad Rotation Logic

The system automatically rotates ads based on:
1. **Performance**: Ads with higher CTR shown more often
2. **Freshness**: Avoid showing same ad repeatedly
3. **Targeting**: Only show ads matching criteria
4. **Status**: Only active ads with valid dates

### Impression Tracking

Impressions are counted when:
- Ad is 50%+ visible in viewport
- User views for at least 1 second
- Only counted once per session per ad

### Click Tracking

Clicks are tracked when:
- User clicks on ad image or CTA
- Opens in new tab (noopener, noreferrer)
- Increments click counter in database

## Revenue Optimization

### Best Practices

1. **Mix Ad Types**
   - Use 1 banner + 1 sidebar per page
   - Add native ads every 3-4 sections
   - Limit popups to entry/exit intent

2. **A/B Testing**
   - Create multiple variations
   - Track CTR for each
   - Keep winners, pause losers

3. **Seasonal Campaigns**
   - Black Friday deals
   - Tax season (January-April)
   - Bitcoin halving events
   - Major crypto conferences

4. **Strategic Placement**
   - Above the fold: 30-50% higher CTR
   - After valuable content: Better engagement
   - Mobile-optimized: 40%+ of traffic

### Pricing Models

You can sell ads using:

**CPM (Cost Per Mille)**
- Charge per 1,000 impressions
- Typical range: $1-10 CPM
- Best for brand awareness

**CPC (Cost Per Click)**
- Charge per click
- Typical range: $0.10-2.00 per click
- Best for performance marketing

**Flat Rate**
- Fixed monthly fee
- Typical range: $200-2,000/month
- Best for long-term partners

## Advertiser Outreach

### Finding Advertisers

1. **Crypto Exchanges**: Coinbase, Kraken, Gemini
2. **Wallet Providers**: Ledger, Trezor
3. **Tax Software**: CoinTracker, Koinly
4. **Educational Platforms**: Udemy courses, books
5. **Financial Services**: Crypto tax CPAs, advisors

### Sales Pitch Template

```
Subject: Advertising Opportunity on Bitcoin Investments

Hi [Name],

I run Bitcoin Investments, a crypto education platform with:
- 10,000+ monthly visitors
- 50,000+ page views
- Audience: US-based crypto investors (beginners to intermediate)

We offer self-hosted advertising that performs better than typical display ads:
- Native ads with 2-5% CTR (vs 0.1-0.5% industry average)
- Direct integration with our educational content
- Targeted placement on calculators, comparison pages, guides

Pricing:
- Banner ads: $500/month
- Sidebar ads: $300/month
- Native ads: $800/month

Interested in reaching crypto investors at the research stage?

Best,
[Your Name]
```

## Analytics & Reporting

### Key Metrics

**CTR (Click-Through Rate)**
```
CTR = (Clicks / Impressions) × 100
```
- Good CTR: 1-3%
- Excellent CTR: 3-5%+

**Fill Rate**
```
Fill Rate = (Impressions with Ads / Total Page Views) × 100
```
- Target: 80-95%

**eCPM (Effective CPM)**
```
eCPM = (Revenue / Impressions) × 1000
```
- Target: $2-5 for display, $5-10 for native

### Monthly Reporting

Generate reports showing:
- Total impressions and clicks
- CTR by campaign
- Top performing ad zones
- Revenue (estimated or actual)

Export data from Ad Manager or create custom reports using the database.

## Troubleshooting

### Ads Not Showing

1. **Check ad status**: Must be "active"
2. **Check dates**: Current date must be between start and end
3. **Check targeting**: Make sure current page matches targeting criteria
4. **Check user status**: Premium users don't see ads
5. **Check cookie consent**: Users who decline marketing cookies don't see ads

### Low CTR

1. **Improve creative**: Test different images and copy
2. **Better targeting**: Show relevant ads to right audience
3. **Ad fatigue**: Rotate ads more frequently
4. **Ad blindness**: Try native ads instead of banners
5. **Mobile optimization**: Ensure ads work on mobile

### High Bounce Rate

If ads increase bounce rate:
1. **Reduce popup frequency**: Only on exit intent
2. **Improve ad quality**: Ensure ads are relevant
3. **Limit ad density**: Don't overload pages
4. **Native ads only**: Remove aggressive display ads

## Legal & Compliance

### Requirements

1. **Disclosure**: Label all ads as "Sponsored" or "Advertisement"
2. **Privacy Policy**: Update to mention advertising
3. **Cookie Consent**: Ads respect user preferences
4. **FTC Guidelines**: Follow endorsement guidelines
5. **Terms of Service**: Include advertising terms

### Sample Ad Policy

```
We display advertisements from select partners to support our free content.

- All ads are clearly labeled as "Sponsored"
- We only partner with reputable crypto companies
- Premium members enjoy an ad-free experience
- We respect your cookie consent preferences
- We never sell your personal data to advertisers

You can opt out of personalized ads in your cookie settings.
```

## Advanced: Direct Deals

### Setting Up Direct Deals

1. **Advertiser reaches out** or you cold outreach
2. **Negotiate terms**: CPM, CPC, or flat rate
3. **Create campaign** in Ad Manager
4. **Invoice advertiser**: Use Stripe, PayPal, or wire
5. **Monthly reporting**: Send performance reports
6. **Optimize**: Improve CTR through testing

### Pricing Calculator

```
Expected Monthly Revenue =
  (Monthly Page Views × Fill Rate × eCPM) / 1000

Example:
50,000 page views × 80% fill rate × $3 eCPM = $120/month
```

### Scaling Revenue

With 100,000 monthly visitors:
- Display ads: $500-2,000/month
- Direct deals: $2,000-5,000/month
- Sponsored content: $1,000-3,000 per post
- **Total potential**: $3,500-10,000/month

## Next Steps

1. ✅ Create your first ad campaign
2. ✅ Add ad units to high-traffic pages
3. ✅ Monitor performance in Ad Manager
4. ✅ Reach out to potential advertisers
5. ✅ Optimize based on CTR data
6. ⏳ Scale to direct deals
7. ⏳ Add sponsored content options

---

**Questions?** Check the Bitcoin Investments documentation or open an issue on GitHub.
