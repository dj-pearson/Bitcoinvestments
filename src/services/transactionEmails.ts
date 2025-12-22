/**
 * Transaction Email Service
 *
 * Handles automated emails for:
 * - Subscription confirmations
 * - Payment receipts
 * - Subscription renewals
 * - Cancellation confirmations
 * - Failed payment notifications
 */

export type TransactionEmailType =
  | 'subscription_created'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'trial_ending'
  | 'subscription_upgraded'
  | 'subscription_downgraded';

export interface TransactionEmailData {
  userEmail: string;
  userName?: string;
  type: TransactionEmailType;
  data: Record<string, unknown>;
}

// Email templates
const EMAIL_TEMPLATES: Record<TransactionEmailType, (data: Record<string, unknown>) => { subject: string; html: string }> = {
  subscription_created: (data) => ({
    subject: 'Welcome to Bitcoin Investments Premium!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Premium!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                Hi${data.userName ? ` ${data.userName}` : ''},
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                Thank you for subscribing to Bitcoin Investments Premium! Your subscription is now active.
              </p>

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #111827; margin: 0 0 15px;">Subscription Details</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="color: #6b7280; padding: 5px 0;">Plan:</td>
                    <td style="color: #111827; font-weight: bold; text-align: right;">${data.planName || 'Premium'}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 5px 0;">Amount:</td>
                    <td style="color: #111827; font-weight: bold; text-align: right;">$${data.amount || '9.99'}/month</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 5px 0;">Next billing:</td>
                    <td style="color: #111827; font-weight: bold; text-align: right;">${data.nextBillingDate || 'N/A'}</td>
                  </tr>
                </table>
              </div>

              <h3 style="color: #111827; margin: 30px 0 15px;">What's included:</h3>
              <ul style="color: #374151; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;">Ad-free experience</li>
                <li style="margin-bottom: 8px;">Cloud portfolio sync</li>
                <li style="margin-bottom: 8px;">Email price alerts</li>
                <li style="margin-bottom: 8px;">Priority support</li>
              </ul>

              <div style="text-align: center; margin-top: 30px;">
                <a href="https://bitcoinvestments.com/profile" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Questions? Contact us at <a href="mailto:support@bitcoinvestments.com" style="color: #f97316;">support@bitcoinvestments.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }),

  subscription_renewed: (data) => ({
    subject: 'Your subscription has been renewed',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Subscription Renewed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px;">
                Hi${data.userName ? ` ${data.userName}` : ''}, your Bitcoin Investments Premium subscription has been successfully renewed.
              </p>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${data.amount}</p>
                <p style="margin: 5px 0;"><strong>Next billing:</strong> ${data.nextBillingDate}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Thank you for your continued support!</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }),

  subscription_cancelled: (data) => ({
    subject: 'Your subscription has been cancelled',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background-color: #6b7280; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Subscription Cancelled</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px;">
                Hi${data.userName ? ` ${data.userName}` : ''}, we're sorry to see you go.
              </p>
              <p style="color: #374151; font-size: 16px;">
                Your Premium subscription has been cancelled. You'll continue to have access to Premium features until <strong>${data.accessUntil}</strong>.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Changed your mind? You can resubscribe at any time from your profile page.
              </p>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://bitcoinvestments.com/pricing" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">Resubscribe</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }),

  payment_received: (data) => ({
    subject: `Payment Receipt - $${data.amount}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Payment Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px;">Thank you for your payment!</p>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="margin: 0 0 15px;">Receipt Details</h3>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${data.amount}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${data.date}</p>
                <p style="margin: 5px 0;"><strong>Description:</strong> ${data.description || 'Premium Subscription'}</p>
                ${data.receiptId ? `<p style="margin: 5px 0;"><strong>Receipt ID:</strong> ${data.receiptId}</p>` : ''}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }),

  payment_failed: (data) => ({
    subject: 'Payment Failed - Action Required',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background-color: #dc2626; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Payment Failed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px;">
                Hi${data.userName ? ` ${data.userName}` : ''}, we were unable to process your payment for your Premium subscription.
              </p>
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p style="color: #991b1b; margin: 0;"><strong>Reason:</strong> ${data.reason || 'Payment declined'}</p>
              </div>
              <p style="color: #374151; font-size: 16px;">
                Please update your payment method to continue enjoying Premium features.
              </p>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://bitcoinvestments.com/profile" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">Update Payment Method</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }),

  trial_ending: (data) => ({
    subject: 'Your trial ends soon',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Your Trial Ends ${data.daysLeft} Days</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px;">
                Hi${data.userName ? ` ${data.userName}` : ''}, your Premium trial is ending soon.
              </p>
              <p style="color: #374151; font-size: 16px;">
                Subscribe now to keep enjoying all Premium features.
              </p>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://bitcoinvestments.com/pricing" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">Subscribe Now</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }),

  subscription_upgraded: (data) => ({
    subject: 'Subscription Upgraded Successfully',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Subscription Upgraded!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px;">
                Hi${data.userName ? ` ${data.userName}` : ''}, your subscription has been upgraded to ${data.newPlan}!
              </p>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Previous plan:</strong> ${data.previousPlan}</p>
                <p style="margin: 5px 0;"><strong>New plan:</strong> ${data.newPlan}</p>
                <p style="margin: 5px 0;"><strong>New amount:</strong> $${data.newAmount}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }),

  subscription_downgraded: (data) => ({
    subject: 'Subscription Plan Changed',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background-color: #6b7280; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Plan Changed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px;">
                Hi${data.userName ? ` ${data.userName}` : ''}, your subscription plan has been changed.
              </p>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Previous plan:</strong> ${data.previousPlan}</p>
                <p style="margin: 5px 0;"><strong>New plan:</strong> ${data.newPlan}</p>
                <p style="margin: 5px 0;"><strong>Effective:</strong> ${data.effectiveDate}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }),
};

/**
 * Send a transaction email
 */
export async function sendTransactionEmail(
  emailData: TransactionEmailData
): Promise<{ success: boolean; error: string | null }> {
  try {
    const template = EMAIL_TEMPLATES[emailData.type];
    if (!template) {
      return { success: false, error: `Unknown email type: ${emailData.type}` };
    }

    const { subject, html } = template({
      ...emailData.data,
      userName: emailData.userName,
    });

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: emailData.userEmail,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to send email' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending transaction email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
