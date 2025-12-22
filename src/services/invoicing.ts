import { supabase, isSupabaseConfigured, db } from '../lib/supabase';

/**
 * Invoicing Service
 *
 * Provides automated invoice generation for ad clients
 * Features:
 * - Invoice generation from ad campaign data
 * - PDF generation
 * - Invoice history tracking
 * - Email delivery integration
 */

export interface Invoice {
  id: string;
  invoice_number: string;
  advertiser_id: string;
  advertiser_name: string;
  advertiser_email: string;
  advertiser_address?: string;

  // Line items
  items: InvoiceItem[];

  // Amounts
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;

  // Status
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

  // Dates
  issue_date: string;
  due_date: string;
  paid_date?: string;

  // Payment
  payment_method?: string;
  payment_reference?: string;

  // Notes
  notes?: string;

  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  campaign_id?: string;
}

export interface InvoiceGenerationOptions {
  advertiserId: string;
  advertiserName: string;
  advertiserEmail: string;
  advertiserAddress?: string;
  campaigns: Array<{
    id: string;
    name: string;
    impressions: number;
    clicks: number;
    cpm?: number; // Cost per thousand impressions
    cpc?: number; // Cost per click
    flatRate?: number;
  }>;
  taxRate?: number;
  currency?: string;
  notes?: string;
  dueInDays?: number;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

/**
 * Calculate line items from campaigns
 */
function calculateLineItems(
  campaigns: InvoiceGenerationOptions['campaigns']
): InvoiceItem[] {
  return campaigns.map((campaign) => {
    let amount = 0;
    let description = campaign.name;

    if (campaign.flatRate) {
      amount = campaign.flatRate;
      description += ' (Flat Rate)';
    } else if (campaign.cpm && campaign.impressions) {
      amount = (campaign.impressions / 1000) * campaign.cpm;
      description += ` - ${campaign.impressions.toLocaleString()} impressions @ $${campaign.cpm}/CPM`;
    } else if (campaign.cpc && campaign.clicks) {
      amount = campaign.clicks * campaign.cpc;
      description += ` - ${campaign.clicks.toLocaleString()} clicks @ $${campaign.cpc}/click`;
    }

    return {
      description,
      quantity: 1,
      unit_price: amount,
      amount,
      campaign_id: campaign.id,
    };
  });
}

/**
 * Generate an invoice for ad campaigns
 */
export async function generateInvoice(
  options: InvoiceGenerationOptions
): Promise<{ invoice: Invoice | null; error: string | null }> {
  const {
    advertiserId,
    advertiserName,
    advertiserEmail,
    advertiserAddress,
    campaigns,
    taxRate = 0,
    currency = 'USD',
    notes,
    dueInDays = 30,
  } = options;

  if (campaigns.length === 0) {
    return { invoice: null, error: 'No campaigns provided for invoicing' };
  }

  try {
    const items = calculateLineItems(campaigns);
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const now = new Date();
    const dueDate = new Date(now.getTime() + dueInDays * 24 * 60 * 60 * 1000);

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoice_number: generateInvoiceNumber(),
      advertiser_id: advertiserId,
      advertiser_name: advertiserName,
      advertiser_email: advertiserEmail,
      advertiser_address: advertiserAddress,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_rate: taxRate,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency,
      status: 'draft',
      issue_date: now.toISOString(),
      due_date: dueDate.toISOString(),
      notes,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // Save to database if configured
    if (isSupabaseConfigured()) {
      const { error } = await db.from('invoices').insert({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        advertiser_id: invoice.advertiser_id,
        advertiser_name: invoice.advertiser_name,
        advertiser_email: invoice.advertiser_email,
        advertiser_address: invoice.advertiser_address,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax_rate: invoice.tax_rate,
        tax_amount: invoice.tax_amount,
        total: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        notes: invoice.notes,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
      });

      if (error && error.code !== '42P01') {
        console.error('Error saving invoice:', error);
        // Continue without saving to DB
      }
    }

    return { invoice, error: null };
  } catch (error) {
    console.error('Error generating invoice:', error);
    return {
      invoice: null,
      error: error instanceof Error ? error.message : 'Failed to generate invoice',
    };
  }
}

/**
 * Get all invoices for an advertiser
 */
export async function getAdvertiserInvoices(
  advertiserId: string
): Promise<{ invoices: Invoice[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { invoices: [], error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('advertiser_id', advertiserId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return { invoices: [], error: null };
      }
      throw error;
    }

    return { invoices: data || [], error: null };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      invoices: [],
      error: error instanceof Error ? error.message : 'Failed to fetch invoices',
    };
  }
}

/**
 * Get all invoices (admin)
 */
export async function getAllInvoices(): Promise<{
  invoices: Invoice[];
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { invoices: [], error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return { invoices: [], error: null };
      }
      throw error;
    }

    return { invoices: data || [], error: null };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      invoices: [],
      error: error instanceof Error ? error.message : 'Failed to fetch invoices',
    };
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: Invoice['status'],
  paymentInfo?: { method?: string; reference?: string }
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Database not configured' };
  }

  try {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paid') {
      updates.paid_date = new Date().toISOString();
      if (paymentInfo?.method) updates.payment_method = paymentInfo.method;
      if (paymentInfo?.reference) updates.payment_reference = paymentInfo.reference;
    }

    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to update invoice',
    };
  }
}

/**
 * Generate invoice HTML for PDF/email
 */
export function generateInvoiceHtml(invoice: Invoice): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #f97316; }
    .invoice-details { text-align: right; }
    .invoice-number { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-draft { background: #e5e7eb; color: #374151; }
    .status-sent { background: #dbeafe; color: #1d4ed8; }
    .status-paid { background: #dcfce7; color: #15803d; }
    .status-overdue { background: #fee2e2; color: #b91c1c; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { width: 45%; }
    .party-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; }
    .party-name { font-weight: bold; font-size: 16px; }
    .dates { display: flex; gap: 40px; margin-bottom: 40px; }
    .date-item { }
    .date-label { font-size: 12px; color: #6b7280; }
    .date-value { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .amount { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
    .notes { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 40px; }
    .notes-label { font-weight: bold; margin-bottom: 8px; }
    .footer { margin-top: 60px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">Bitcoin Investments</div>
      <div class="invoice-details">
        <div class="invoice-number">${invoice.invoice_number}</div>
        <div class="status status-${invoice.status}">${invoice.status.toUpperCase()}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-label">From</div>
        <div class="party-name">Bitcoin Investments LLC</div>
        <div>Advertising Services</div>
        <div>support@bitcoinvestments.com</div>
      </div>
      <div class="party">
        <div class="party-label">Bill To</div>
        <div class="party-name">${invoice.advertiser_name}</div>
        <div>${invoice.advertiser_email}</div>
        ${invoice.advertiser_address ? `<div>${invoice.advertiser_address}</div>` : ''}
      </div>
    </div>

    <div class="dates">
      <div class="date-item">
        <div class="date-label">Issue Date</div>
        <div class="date-value">${formatDate(invoice.issue_date)}</div>
      </div>
      <div class="date-item">
        <div class="date-label">Due Date</div>
        <div class="date-value">${formatDate(invoice.due_date)}</div>
      </div>
      ${invoice.paid_date ? `
      <div class="date-item">
        <div class="date-label">Paid Date</div>
        <div class="date-value">${formatDate(invoice.paid_date)}</div>
      </div>
      ` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (item) => `
          <tr>
            <td>${item.description}</td>
            <td class="amount">${formatCurrency(item.amount)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>${formatCurrency(invoice.subtotal)}</span>
      </div>
      ${invoice.tax_rate > 0 ? `
      <div class="totals-row">
        <span>Tax (${invoice.tax_rate}%)</span>
        <span>${formatCurrency(invoice.tax_amount)}</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>Total</span>
        <span>${formatCurrency(invoice.total)}</span>
      </div>
    </div>

    ${invoice.notes ? `
    <div class="notes">
      <div class="notes-label">Notes</div>
      <div>${invoice.notes}</div>
    </div>
    ` : ''}

    <div class="footer">
      <p>Thank you for advertising with Bitcoin Investments!</p>
      <p>Questions? Contact us at advertising@bitcoinvestments.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  invoice: Invoice
): Promise<{ success: boolean; error: string | null }> {
  try {
    const html = generateInvoiceHtml(invoice);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: invoice.advertiser_email,
        subject: `Invoice ${invoice.invoice_number} from Bitcoin Investments`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to send email' };
    }

    // Update invoice status to sent
    if (invoice.status === 'draft') {
      await updateInvoiceStatus(invoice.id, 'sent');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invoice',
    };
  }
}
