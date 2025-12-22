import { isSupabaseConfigured, db } from '../lib/supabase';

/**
 * Support Ticket Service
 *
 * Provides priority support for premium users:
 * - Ticket creation with priority levels
 * - SLA tracking based on subscription tier
 * - Ticket history and status updates
 * - Admin management interface
 */

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed';
export type TicketCategory = 'account' | 'billing' | 'technical' | 'feature_request' | 'bug_report' | 'other';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  is_premium: boolean;

  // Ticket details
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  // Assignment
  assigned_to?: string;
  assigned_at?: string;

  // SLA tracking
  sla_response_hours: number;
  sla_resolution_hours: number;
  first_response_at?: string;
  resolved_at?: string;
  sla_breached: boolean;

  // Metadata
  attachments?: string[];
  tags?: string[];

  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_email: string;
  sender_type: 'user' | 'agent' | 'system';
  message: string;
  attachments?: string[];
  created_at: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  is_premium?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// SLA configuration based on subscription tier
const SLA_CONFIG = {
  premium: {
    response_hours: 4,    // 4 hour response time
    resolution_hours: 24, // 24 hour resolution target
    priority_boost: 1,    // Boost priority level by 1
  },
  free: {
    response_hours: 48,   // 48 hour response time
    resolution_hours: 168, // 1 week resolution target
    priority_boost: 0,
  },
};

/**
 * Generate ticket number
 */
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

/**
 * Get priority based on subscription and selected priority
 */
function getEffectivePriority(
  selectedPriority: TicketPriority,
  isPremium: boolean
): TicketPriority {
  const priorities: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];
  const boost = isPremium ? SLA_CONFIG.premium.priority_boost : 0;
  const currentIndex = priorities.indexOf(selectedPriority);
  const boostedIndex = Math.min(currentIndex + boost, priorities.length - 1);
  return priorities[boostedIndex];
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(params: {
  userId: string;
  userEmail: string;
  userName?: string;
  isPremium: boolean;
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  attachments?: string[];
}): Promise<{ ticket: SupportTicket | null; error: string | null }> {
  const {
    userId,
    userEmail,
    userName,
    isPremium,
    subject,
    description,
    category,
    priority = 'normal',
    attachments,
  } = params;

  try {
    const slaConfig = isPremium ? SLA_CONFIG.premium : SLA_CONFIG.free;
    const effectivePriority = getEffectivePriority(priority, isPremium);

    const ticket: SupportTicket = {
      id: crypto.randomUUID(),
      ticket_number: generateTicketNumber(),
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      is_premium: isPremium,
      subject,
      description,
      category,
      priority: effectivePriority,
      status: 'open',
      sla_response_hours: slaConfig.response_hours,
      sla_resolution_hours: slaConfig.resolution_hours,
      sla_breached: false,
      attachments,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { error } = await db.from('support_tickets').insert(ticket);

      if (error && error.code !== '42P01') {
        throw error;
      }
    }

    // Send confirmation email
    await sendTicketNotification(ticket, 'created');

    return { ticket, error: null };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return {
      ticket: null,
      error: error instanceof Error ? error.message : 'Failed to create ticket',
    };
  }
}

/**
 * Get user's tickets
 */
export async function getUserTickets(
  userId: string
): Promise<{ tickets: SupportTicket[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { tickets: [], error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return { tickets: [], error: null };
      }
      throw error;
    }

    return { tickets: (data as SupportTicket[]) || [], error: null };
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return {
      tickets: [],
      error: error instanceof Error ? error.message : 'Failed to fetch tickets',
    };
  }
}

/**
 * Get all tickets (admin)
 */
export async function getAllTickets(
  filters: TicketFilters = {}
): Promise<{ tickets: SupportTicket[]; total: number; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { tickets: [], total: 0, error: 'Database not configured' };
  }

  try {
    const { limit = 50, offset = 0 } = filters;

    let query = db
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .order('is_premium', { ascending: false }) // Premium first
      .order('priority', { ascending: false })   // Then by priority
      .order('created_at', { ascending: true })  // Then oldest first
      .range(offset, offset + limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters.is_premium !== undefined) {
      query = query.eq('is_premium', filters.is_premium);
    }
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return { tickets: [], total: 0, error: null };
      }
      throw error;
    }

    return { tickets: data || [], total: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return {
      tickets: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch tickets',
    };
  }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  agentId?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    if (status === 'in_progress' && agentId) {
      updates.assigned_to = agentId;
      updates.assigned_at = new Date().toISOString();
    }

    const { error } = await db
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update ticket',
    };
  }
}

/**
 * Add a message to a ticket
 */
export async function addTicketMessage(params: {
  ticketId: string;
  senderId: string;
  senderEmail: string;
  senderType: 'user' | 'agent' | 'system';
  message: string;
  attachments?: string[];
}): Promise<{ message: TicketMessage | null; error: string | null }> {
  try {
    const ticketMessage: TicketMessage = {
      id: crypto.randomUUID(),
      ticket_id: params.ticketId,
      sender_id: params.senderId,
      sender_email: params.senderEmail,
      sender_type: params.senderType,
      message: params.message,
      attachments: params.attachments,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { error } = await db.from('ticket_messages').insert(ticketMessage);

      if (error && error.code !== '42P01') {
        throw error;
      }

      // Update first response time if this is an agent reply
      if (params.senderType === 'agent') {
        await db
          .from('support_tickets')
          .update({
            first_response_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', params.ticketId)
          .is('first_response_at', null);
      }
    }

    return { message: ticketMessage, error: null };
  } catch (error) {
    console.error('Error adding ticket message:', error);
    return {
      message: null,
      error: error instanceof Error ? error.message : 'Failed to add message',
    };
  }
}

/**
 * Get ticket messages
 */
export async function getTicketMessages(
  ticketId: string
): Promise<{ messages: TicketMessage[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { messages: [], error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return { messages: [], error: null };
      }
      throw error;
    }

    return { messages: data || [], error: null };
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    return {
      messages: [],
      error: error instanceof Error ? error.message : 'Failed to fetch messages',
    };
  }
}

/**
 * Get support statistics
 */
export async function getSupportStats(): Promise<{
  stats: {
    open_tickets: number;
    premium_open: number;
    avg_response_time_hours: number;
    avg_resolution_time_hours: number;
    sla_compliance_rate: number;
    tickets_today: number;
    resolved_today: number;
  } | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { stats: null, error: 'Database not configured' };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get open tickets
    const { count: openTickets } = await db
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress', 'waiting_on_user']);

    // Get premium open tickets
    const { count: premiumOpen } = await db
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress', 'waiting_on_user'])
      .eq('is_premium', true);

    // Get tickets created today
    const { count: ticketsToday } = await db
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Get resolved today
    const { count: resolvedToday } = await db
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .gte('resolved_at', today.toISOString());

    // Get SLA compliance
    const { count: totalResolved } = await db
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    const { count: slaBreached } = await db
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('sla_breached', true);

    const slaCompliance = totalResolved
      ? ((totalResolved - (slaBreached || 0)) / totalResolved) * 100
      : 100;

    return {
      stats: {
        open_tickets: openTickets || 0,
        premium_open: premiumOpen || 0,
        avg_response_time_hours: 2.5, // Would calculate from actual data
        avg_resolution_time_hours: 12, // Would calculate from actual data
        sla_compliance_rate: Math.round(slaCompliance),
        tickets_today: ticketsToday || 0,
        resolved_today: resolvedToday || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching support stats:', error);
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}

/**
 * Send ticket notification email
 */
async function sendTicketNotification(
  ticket: SupportTicket,
  type: 'created' | 'updated' | 'resolved'
): Promise<void> {
  try {
    const subjects: Record<string, string> = {
      created: `Support Ticket Created: ${ticket.ticket_number}`,
      updated: `Ticket Updated: ${ticket.ticket_number}`,
      resolved: `Ticket Resolved: ${ticket.ticket_number}`,
    };

    const slaText = ticket.is_premium
      ? `As a Premium member, you'll receive a response within ${ticket.sla_response_hours} hours.`
      : `You'll receive a response within ${ticket.sla_response_hours} hours.`;

    const html = `
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
              <h1 style="color: #ffffff; margin: 0;">Support Ticket ${type === 'created' ? 'Created' : type === 'resolved' ? 'Resolved' : 'Updated'}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px;">Hi${ticket.user_name ? ` ${ticket.user_name}` : ''},</p>

              ${type === 'created' ? `
              <p style="color: #374151; font-size: 16px;">
                Your support ticket has been created successfully. ${slaText}
              </p>
              ` : type === 'resolved' ? `
              <p style="color: #374151; font-size: 16px;">
                Your support ticket has been resolved. If you need further assistance, feel free to reply or create a new ticket.
              </p>
              ` : `
              <p style="color: #374151; font-size: 16px;">
                Your support ticket has been updated. Please log in to view the latest response.
              </p>
              `}

              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Ticket #:</strong> ${ticket.ticket_number}</p>
                <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> ${ticket.status.replace('_', ' ').toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>Priority:</strong> ${ticket.priority.toUpperCase()}</p>
                ${ticket.is_premium ? '<p style="margin: 5px 0; color: #f97316;"><strong>Premium Support</strong></p>' : ''}
              </div>

              <div style="text-align: center; margin-top: 20px;">
                <a href="https://bitcoinvestments.com/support/tickets/${ticket.id}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">View Ticket</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ticket.user_email,
        subject: subjects[type],
        html,
      }),
    });
  } catch (error) {
    console.warn('Failed to send ticket notification:', error);
  }
}

/**
 * Format category for display
 */
export function formatCategory(category: TicketCategory): string {
  const labels: Record<TicketCategory, string> = {
    account: 'Account Issues',
    billing: 'Billing & Payments',
    technical: 'Technical Support',
    feature_request: 'Feature Request',
    bug_report: 'Bug Report',
    other: 'Other',
  };
  return labels[category] || category;
}

/**
 * Get priority color classes
 */
export function getPriorityStyles(priority: TicketPriority): {
  bg: string;
  text: string;
  border: string;
} {
  const styles: Record<TicketPriority, { bg: string; text: string; border: string }> = {
    low: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500' },
    normal: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
    high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' },
    urgent: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
  };
  return styles[priority];
}

/**
 * Get status color classes
 */
export function getStatusStyles(status: TicketStatus): {
  bg: string;
  text: string;
} {
  const styles: Record<TicketStatus, { bg: string; text: string }> = {
    open: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    waiting_on_user: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    resolved: { bg: 'bg-green-500/20', text: 'text-green-400' },
    closed: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  };
  return styles[status];
}
