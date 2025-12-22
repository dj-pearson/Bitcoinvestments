-- Create support tickets table for priority support system

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,

    -- Ticket details
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('account', 'billing', 'technical', 'feature_request', 'bug_report', 'other')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed')),

    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ,

    -- SLA tracking
    sla_response_hours INTEGER NOT NULL DEFAULT 48,
    sla_resolution_hours INTEGER NOT NULL DEFAULT 168,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    sla_breached BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    attachments JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ticket messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_email TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_is_premium ON support_tickets(is_premium);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

-- Composite index for admin queue sorting (premium first, then priority, then oldest)
CREATE INDEX IF NOT EXISTS idx_support_tickets_queue ON support_tickets(is_premium DESC, priority DESC, created_at ASC) WHERE status IN ('open', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
    ON support_tickets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users can create tickets"
    ON support_tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own open tickets
CREATE POLICY "Users can update own open tickets"
    ON support_tickets
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'open');

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
    ON support_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin', 'support')
        )
    );

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
    ON support_tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin', 'support')
        )
    );

-- Users can view messages for their tickets
CREATE POLICY "Users can view own ticket messages"
    ON ticket_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = ticket_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
    );

-- Users can add messages to their tickets
CREATE POLICY "Users can add messages to own tickets"
    ON ticket_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = ticket_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
    );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
    ON ticket_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin', 'support')
        )
    );

-- Admins can add messages to any ticket
CREATE POLICY "Admins can add messages"
    ON ticket_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin', 'support')
        )
    );

-- Function to check SLA breach
CREATE OR REPLACE FUNCTION check_ticket_sla()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if response SLA is breached
    IF NEW.first_response_at IS NULL
       AND NEW.created_at + (NEW.sla_response_hours || ' hours')::INTERVAL < NOW() THEN
        NEW.sla_breached := true;
    END IF;

    -- Check if resolution SLA is breached
    IF NEW.resolved_at IS NULL
       AND NEW.status NOT IN ('resolved', 'closed')
       AND NEW.created_at + (NEW.sla_resolution_hours || ' hours')::INTERVAL < NOW() THEN
        NEW.sla_breached := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check SLA on updates
CREATE TRIGGER check_sla_on_update
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION check_ticket_sla();

-- Add comments for documentation
COMMENT ON TABLE support_tickets IS 'Support tickets with priority handling for premium users';
COMMENT ON TABLE ticket_messages IS 'Messages/replies on support tickets';
COMMENT ON COLUMN support_tickets.is_premium IS 'Premium users get faster SLA (4h response vs 48h)';
COMMENT ON COLUMN support_tickets.sla_breached IS 'True if response or resolution SLA was breached';
