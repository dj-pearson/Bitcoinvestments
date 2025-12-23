-- Fix users search vector trigger
-- The trigger was referencing NEW.name which doesn't exist on the users table

-- Drop the existing problematic trigger
DROP TRIGGER IF EXISTS users_search_vector_update ON public.users;

-- Recreate the function without the name field
CREATE OR REPLACE FUNCTION update_users_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'users' THEN
        -- Only use fields that actually exist on the users table
        NEW.search_vector :=
            setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.id::TEXT, '')), 'B');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only recreate trigger if search_vector column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'search_vector'
    ) THEN
        CREATE TRIGGER users_search_vector_update
            BEFORE INSERT OR UPDATE ON public.users
            FOR EACH ROW
            EXECUTE FUNCTION update_users_search_vector();
    END IF;
END $$;

