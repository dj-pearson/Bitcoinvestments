# Email Setup - Simplified Guide

Since Supabase Edge Functions require additional permissions, here's a simpler approach.

---

## 🎯 **Option 1: Use MailChannels (FREE for Cloudflare)**

MailChannels is free for all Cloudflare Workers/Pages users and requires minimal setup.

### **What I've Already Done**:
- ✅ Created `/api/send-email` Cloudflare Function
- ✅ Configured to use MailChannels API
- ✅ Updated frontend email service

### **What You Need to Do**:

#### **Step 1: Add SPF Record to DNS**

Add this TXT record to your domain (`bitcoinvestments.net`):

```
Type: TXT
Name: @
Value: v=spf1 a mx include:relay.mailchannels.net ~all
```

This tells email providers that MailChannels is authorized to send emails for your domain.

#### **Step 2: Add DKIM Records (Optional but Recommended)**

MailChannels will provide DKIM keys when you set up domain authentication.

1. Go to: https://console.mailchannels.com/
2. Sign up with your Cloudflare account
3. Add your domain
4. Copy the DKIM TXT records
5. Add them to your DNS

#### **Step 3: Test**

```javascript
// Test in browser console after deployment
fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'your-email@example.com',
    subject: 'Test from Bitcoin Investments',
    html: '<h1>Success!</h1><p>MailChannels is working!</p>',
  })
})
  .then(r => r.json())
  .then(console.log);
```

---

## 🎯 **Option 2: Use Resend API (Easiest)**

If you prefer a managed service, Resend is the easiest option.

### **Step 1: Get API Key**

1. Sign up at: https://resend.com
2. Verify your domain
3. Get your API key

**Free tier**: 100 emails/day, 3,000 emails/month

### **Step 2: Update Frontend**

The code is already set up for Resend. Just need to update the email service:

```typescript
// In src/services/email.ts, change:
const EMAIL_API_URL = '/api/send-email';  // Current (MailChannels)

// To use Resend directly:
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: options.from,
    to: [options.to],
    subject: options.subject,
    html: options.html,
  }),
});
```

### **Step 3: Add to Environment**

Add to Cloudflare environment variables:
```
VITE_RESEND_API_KEY=re_xxxxx
```

---

## 🎯 **Option 3: Keep Amazon SES (Supabase Auth Only)**

Your Amazon SES SMTP is already configured in Supabase for **Auth emails** (password resets, etc.). This works automatically!

**What Works**:
- ✅ Password reset emails
- ✅ Email verification
- ✅ Magic link sign-in

**What Doesn't Work**:
- ❌ Transactional emails (price alerts, newsletters)
- ❌ Welcome emails
- ❌ Custom notifications

**Solution**: Use MailChannels (Option 1) or Resend (Option 2) for transactional emails.

---

## 💡 **Recommended Setup**

### **Best for Most Users**:

1. **Auth Emails** → Amazon SES (via Supabase) ✅ Already configured
2. **Transactional Emails** → MailChannels (free) + DNS setup
3. **Marketing Emails** → MailChannels or upgrade to Resend

### **Costs**:
- **MailChannels**: FREE (up to 10k emails/day on Cloudflare)
- **Resend**: $0 (3k emails/month), then $20/month (50k emails)
- **Amazon SES**: Already configured for auth (no action needed)

---

## 🚀 **Quick Start (MailChannels)**

### **1. Add SPF Record**

Go to your DNS provider and add:

```
Type: TXT
Host: @
Value: v=spf1 a mx include:relay.mailchannels.net ~all
TTL: Auto
```

### **2. Deploy**

The code is already deployed! Just need DNS.

### **3. Test**

```bash
# After DNS propagates (5-60 minutes), test:
curl -X POST https://bitcoinvestments.net/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your@email.com","subject":"Test","html":"<p>Works!</p>"}'
```

---

## 📊 **Feature Comparison**

| Feature | MailChannels | Resend | Amazon SES |
|---------|-------------|---------|------------|
| Cost | FREE | $0-$20/mo | $0.10/1k |
| Setup | DNS only | API key | Complex |
| Emails/day | 10,000 | 100-unlimited | 50,000+ |
| Auth emails | ❌ | ✅ | ✅ Configured |
| Transactional | ✅ | ✅ | ⚠️ (needs Edge Functions) |
| Deliverability | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## ✅ **Summary**

**Current Status**:
- ✅ Amazon SES configured in Supabase (Auth emails working)
- ✅ Cloudflare Function created for transactional emails
- ✅ Frontend integrated
- ⏳ Need DNS configuration OR Resend API key

**Recommendation**:
1. Add SPF record for MailChannels (FREE, 5 min setup)
2. Test with curl or browser console
3. Done! All emails will work

---

**Choose MailChannels for free, unlimited emails with minimal setup!** 🚀

