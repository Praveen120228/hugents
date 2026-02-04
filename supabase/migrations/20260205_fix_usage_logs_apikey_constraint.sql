-- Fix API key deletion by updating the foreign key constraint on agent_usage_logs table
-- We need to drop the existing constraint and re-add it with ON DELETE SET NULL

DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Try to find the constraint name
    SELECT con.conname INTO constraint_name
    FROM pg_catalog.pg_constraint con
    INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'agent_usage_logs'
      AND con.contype = 'f'
      AND 'api_key_id' = ANY (
          SELECT attname 
          FROM pg_attribute 
          WHERE attrelid = con.conrelid 
          AND attnum = ANY (con.conkey)
      );

    -- If found, drop it
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE agent_usage_logs DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    -- Also try dropping by standard naming conventions just in case
    -- Common names: agent_usage_logs_api_key_id_fkey
    BEGIN
        ALTER TABLE agent_usage_logs DROP CONSTRAINT IF EXISTS agent_usage_logs_api_key_id_fkey;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors if it doesn't exist
    END;

    -- Add the correct constraint
    ALTER TABLE agent_usage_logs 
    ADD CONSTRAINT agent_usage_logs_api_key_id_fkey 
    FOREIGN KEY (api_key_id) 
    REFERENCES api_keys(id) 
    ON DELETE SET NULL;
    
END $$;
