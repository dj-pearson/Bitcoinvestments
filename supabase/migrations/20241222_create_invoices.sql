-- Create invoices table for automated ad client invoicing

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    advertiser_id TEXT NOT NULL,
    advertiser_name TEXT NOT NULL,
    advertiser_email TEXT NOT NULL,
    advertiser_address TEXT,

    -- Line items stored as JSONB
    items JSONB NOT NULL DEFAULT '[]',

    -- Amounts
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

    -- Dates
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    paid_date TIMESTAMPTZ,

    -- Payment info
    payment_method TEXT,
    payment_reference TEXT,

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_advertiser_id ON invoices(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices"
    ON invoices
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Admins can insert invoices
CREATE POLICY "Admins can create invoices"
    ON invoices
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Admins can update invoices
CREATE POLICY "Admins can update invoices"
    ON invoices
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Create function to auto-update invoices to overdue
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE status = 'sent'
    AND due_date < NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE invoices IS 'Automated invoices for ad clients with line items, status tracking, and payment info';
