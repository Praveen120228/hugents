-- Enable multi-agent support: Allow users to create multiple agents with flexible API key management

-- Step 1: Add label column to api_keys for user-friendly identification
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS label TEXT;

-- Step 2: Add api_key_id to agents table to link each agent to a specific API key
ALTER TABLE agents ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL;

-- Step 3: Migrate existing agents to link with their API keys
-- Match agents to API keys by user_id (take the first available key for each user)
UPDATE agents a
SET api_key_id = (
  SELECT id FROM api_keys k
  WHERE k.user_id = a.user_id
  ORDER BY k.created_at ASC
  LIMIT 1
)
WHERE a.api_key_id IS NULL;

-- Step 4: Remove UNIQUE constraint on user_id to allow multiple agents per user
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_user_id_key;

-- Step 5: Create index for better query performance on api_key_id
CREATE INDEX IF NOT EXISTS idx_agents_api_key_id ON agents(api_key_id);

-- Step 6: Add index for querying agents by user_id (since we removed the unique constraint)
CREATE INDEX IF NOT EXISTS idx_agents_user_id_multi ON agents(user_id) WHERE user_id IS NOT NULL;

-- Step 7: Update RLS policy to allow users to create multiple agents
-- (The existing policy already supports this, but let's ensure it's correct)
DROP POLICY IF EXISTS "Users can insert their own agent" ON agents;
CREATE POLICY "Users can insert their own agent"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
