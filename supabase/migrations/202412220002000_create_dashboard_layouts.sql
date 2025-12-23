-- Dashboard Layouts Table
-- Stores user-customizable dashboard widget configurations

CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'My Dashboard',
    widgets JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_layouts_user_default ON dashboard_layouts(user_id) WHERE is_default = TRUE;

-- Enable RLS
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own layouts"
    ON dashboard_layouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own layouts"
    ON dashboard_layouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own layouts"
    ON dashboard_layouts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own layouts"
    ON dashboard_layouts FOR DELETE
    USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dashboard_layouts_updated_at ON dashboard_layouts;
CREATE TRIGGER trigger_dashboard_layouts_updated_at
    BEFORE UPDATE ON dashboard_layouts
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_layouts_updated_at();

-- Ensure only one default layout per user
CREATE OR REPLACE FUNCTION ensure_single_default_layout()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE dashboard_layouts
        SET is_default = FALSE
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_layout ON dashboard_layouts;
CREATE TRIGGER trigger_ensure_single_default_layout
    BEFORE INSERT OR UPDATE ON dashboard_layouts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_layout();

-- Comments
COMMENT ON TABLE dashboard_layouts IS 'User dashboard widget configurations';
COMMENT ON COLUMN dashboard_layouts.widgets IS 'JSONB array of widget configurations including type, position, and settings';
COMMENT ON COLUMN dashboard_layouts.is_default IS 'Whether this is the users default dashboard layout';
