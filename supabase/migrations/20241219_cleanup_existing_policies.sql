-- Cleanup existing policies and triggers that may conflict with migrations
-- This ensures migrations can run cleanly by dropping ALL existing policies and triggers

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies from all tables in the public schema
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    -- Drop all triggers from all tables in the public schema
    FOR r IN (
        SELECT event_object_schema, event_object_table, trigger_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
            r.trigger_name, r.event_object_schema, r.event_object_table);
    END LOOP;
END $$;

-- This migration will allow subsequent migrations to recreate these policies and triggers

