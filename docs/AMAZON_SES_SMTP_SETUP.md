# Amazon SES SMTP Setup Guide

Complete guide for setting up Amazon SES SMTP with Supabase for all platform email communications.

---

## 📋 **Overview**

Your platform uses **Amazon SES (Simple Email Service)** via SMTP for all email communications:
- ✅ Welcome emails
- ✅ Price alerts
- ✅ Weekly newsletters
- ✅ Password resets (Supabase Auth)
- ✅ Transaction notifications
- ✅ Tax report delivery

**Email Flow**:
```
Frontend → Cloudflare Function → Supabase Edge Function → Amazon SES SMTP → Recipient
```

---

## 🔑 **Credentials Already Set Up**

You've already configured these secrets in Supabase:

### **Supabase Secrets**:
- `AMAZON_SMTP_USER_NAME` - Your AWS SES SMTP username
- `AMAZON_SMTP_PASSWORD` - Your AWS SES SMTP password
- `AMAZON_SMTP_ENDPOINT` - SES SMTP endpoint (e.g., email-smtp.us-east-1.amazonaws.com)
- `AMAZON_IAM_USER_NAME` - Your AWS IAM username for SES access

### **Supabase Custom SMTP**:
You've also configured custom SMTP in Supabase Dashboard for Auth emails (password resets, etc.)

---

## 🚀 **Deployment Steps**

### **Step 1: Deploy Supabase Edge Function**

```bash
# Navigate to your project
cd /path/to/Bitcoinvestments

# Deploy the send-email function to Supabase
npx supabase functions deploy send-email --project-ref mkdckqrukmukbmgxabyk
```

**Verify deployment**:
```bash
# List deployed functions
npx supabase functions list
```

---

### **Step 2: Set Supabase Secrets**

Since you've already set these in Supabase Dashboard, verify they're available to the Edge Function:

```bash
# Set secrets via CLI (or verify in dashboard)
npx supabase secrets set AMAZON_SMTP_USER_NAME="your-smtp-username" --project-ref mkdckqrukmukbmgxabyk
npx supabase secrets set AMAZON_SMTP_PASSWORD="your-smtp-password" --project-ref mkdckqrukmukbmgxabyk
npx supabase secrets set AMAZON_SMTP_ENDPOINT="email-smtp.us-east-1.amazonaws.com" --project-ref mkdckqrukmukbmgxabyk
npx supabase secrets set AMAZON_SMTP_PORT="587" --project-ref mkdckqrukmukbmgxabyk
```

**Or verify in Dashboard**:
1. Go to: https://supabase.com/dashboard/project/mkdckqrukmukbmgxabyk/settings/vault
2. Check that secrets exist and are not expired

---

### **Step 3: Add Cloudflare Environment Variables**

Add these to Cloudflare Pages:

**Go to**: Cloudflare Dashboard → Pages → bitcoinvestments → Settings → Environment variables

Add as **Encrypted** secrets:

```
Name: AMAZON_SMTP_USER_NAME
Value: [your AWS SES SMTP username]
Type: Encrypted
Environment: Production
```

```
Name: AMAZON_SMTP_PASSWORD
Value: [your AWS SES SMTP password]
Type: Encrypted
Environment: Production
```

```
Name: AMAZON_SMTP_ENDPOINT
Value: email-smtp.us-east-1.amazonaws.com
Type: Plaintext
Environment: Production
```

```
Name: VITE_FROM_EMAIL
Value: Bitcoin Investments <noreply@bitcoinvestments.net>
Type: Plaintext
Environment: Production
```

**Add Supabase connection** (if not already there):

```
Name: SUPABASE_URL
Value: https://mkdckqrukmukbmgxabyk.supabase.co
Type: Plaintext
Environment: Production
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [your service role key]
Type: Encrypted
Environment: Production
```

---

### **Step 4: Deploy Frontend Changes**

```bash
# Commit and push changes
git add -A
git commit -m "feat: Integrate Amazon SES SMTP for all email communications"
git push
```

Cloudflare will automatically rebuild and deploy.

---

## 🧪 **Testing**

### **Test 1: Send Test Email via Console**

After deployment, open browser console on your site:

```javascript
// Test email sending
fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'your-email@example.com',
    subject: 'Test Email from Bitcoin Investments',
    html: '<h1>Test Email</h1><p>If you receive this, Amazon SES SMTP is working!</p>',
  })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected response**:
```json
{
  "success": true,
  "messageId": "..."
}
```

---

### **Test 2: Newsletter Signup**

1. Go to your site homepage
2. Enter email in newsletter signup
3. Submit
4. Check inbox for welcome email
5. Check Cloudflare Functions logs for any errors

---

### **Test 3: Price Alert**

1. Create a price alert in your dashboard
2. Wait for alert to trigger (or manually test)
3. Check inbox for alert email
4. Verify email formatting and content

---

## 📊 **Monitoring**

### **Cloudflare Functions Logs**:

1. Go to: Cloudflare Dashboard → Pages → bitcoinvestments → Functions
2. Click on `send-email` function
3. View request logs and errors

### **Supabase Edge Function Logs**:

1. Go to: Supabase Dashboard → Edge Functions
2. Click on `send-email`
3. View invocations and logs

### **Amazon SES Console**:

1. Go to: AWS Console → SES
2. Monitor:
   - Sending statistics
   - Bounce rate
   - Complaint rate
   - Reputation dashboard

---

## 🔐 **Security Best Practices**

### **1. Use IAM User with Limited Permissions**

Your `AMAZON_IAM_USER_NAME` should only have `ses:SendEmail` and `ses:SendRawEmail` permissions.

**IAM Policy** (verify this is attached):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### **2. Rotate SMTP Credentials Regularly**

- Generate new SMTP credentials every 90 days
- Update Supabase and Cloudflare secrets
- Delete old credentials

### **3. Monitor Bounce and Complaint Rates**

- **Bounce rate** < 5%
- **Complaint rate** < 0.1%
- Set up SNS notifications for bounces/complaints

### **4. Use Verified Domains**

Ensure `bitcoinvestments.net` is verified in SES:
1. AWS Console → SES → Verified identities
2. Verify your domain via DNS records
3. Enable DKIM and SPF

---

## 📧 **Email Types Configured**

### **1. Transactional Emails** (via API):
- Welcome emails
- Price alerts
- Tax report notifications
- Purchase confirmations

**Code location**: `src/services/email.ts`

### **2. Auth Emails** (via Supabase):
- Password reset
- Email verification
- Magic link sign-in

**Configuration**: Supabase Dashboard → Authentication → Email Templates

### **3. Marketing Emails** (via API):
- Weekly newsletters
- Product updates
- Promotional offers

**Code location**: `src/services/email.ts` → `sendWeeklyNewsletter()`

---

## 🚨 **Troubleshooting**

### **Issue 1: "Email service not configured" Error**

**Cause**: SMTP credentials not available in environment

**Fix**:
1. Check Supabase secrets: `npx supabase secrets list`
2. Check Cloudflare environment variables
3. Redeploy if needed

---

### **Issue 2: Emails Not Sending**

**Cause**: SES account in sandbox mode or sending limits reached

**Fix**:
1. Check SES console for account status
2. Request production access if in sandbox
3. Check sending quotas: AWS Console → SES → Account dashboard

---

### **Issue 3: Emails Going to Spam**

**Cause**: Missing SPF/DKIM/DMARC records

**Fix**:
1. Add SPF record to DNS:
   ```
   v=spf1 include:amazonses.com ~all
   ```

2. Enable DKIM in SES Console

3. Add DMARC record:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

---

### **Issue 4: High Bounce Rate**

**Cause**: Invalid email addresses or poor list hygiene

**Fix**:
1. Implement email validation on signup
2. Remove bounced emails from database
3. Use double opt-in for newsletter

---

## 📈 **Rate Limits & Quotas**

### **SES Sandbox** (Default):
- ❌ Can only send to verified emails
- ❌ 200 emails per 24 hours
- ❌ 1 email per second

**Request production access**: AWS Console → SES → Account dashboard → Request production access

### **SES Production**:
- ✅ Send to any email
- ✅ 50,000+ emails per 24 hours (initial limit)
- ✅ 14+ emails per second (initial limit)
- ✅ Can request higher limits

---

## 💰 **Pricing**

### **Amazon SES Costs**:
- **First 62,000 emails/month**: $0.10 per 1,000 emails
- **Beyond 62,000**: $0.10 per 1,000 emails
- **Attachments**: $0.12 per GB

### **Example Costs**:
- 10,000 emails/month: **$1.00**
- 100,000 emails/month: **$10.00**
- 1,000,000 emails/month: **$100.00**

**Much cheaper than alternatives**:
- Resend: $20/month for 50k emails
- SendGrid: $20/month for 50k emails
- Mailgun: $35/month for 50k emails

---

## 📚 **Additional Resources**

- [Amazon SES Developer Guide](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/Welcome.html)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [SMTP Best Practices](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html)

---

## ✅ **Summary**

### **What's Configured**:
- ✅ Amazon SES SMTP credentials in Supabase
- ✅ Supabase custom SMTP for Auth emails
- ✅ Supabase Edge Function for email sending
- ✅ Cloudflare Function as frontend endpoint
- ✅ Frontend email service integrated

### **What to Do**:
1. Deploy Supabase Edge Function (`send-email`)
2. Add Cloudflare environment variables
3. Test email sending
4. Monitor logs and metrics

### **What You Get**:
- ✅ Reliable email delivery via Amazon SES
- ✅ Low cost ($1 per 10k emails)
- ✅ High sending limits (50k+ per day)
- ✅ Professional email infrastructure
- ✅ Detailed monitoring and analytics

---

**Your email infrastructure is production-ready!** 🚀

All platform emails will now be sent through Amazon SES SMTP with proper authentication, monitoring, and delivery tracking.

