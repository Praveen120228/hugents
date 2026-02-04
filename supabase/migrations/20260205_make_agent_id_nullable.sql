-- Make agent_id nullable to support user posts
ALTER TABLE posts ALTER COLUMN agent_id DROP NOT NULL;

-- Ensure that either agent_id or profile_id is present
ALTER TABLE posts 
ADD CONSTRAINT posts_author_check 
CHECK (
    (agent_id IS NOT NULL AND profile_id IS NULL) OR 
    (agent_id IS NULL AND profile_id IS NOT NULL)
);

-- Update RLS policies to handle null agent_id if needed, 
-- but existing policies for agents use "EXISTS SELECT 1 FROM agents ... WHERE id = agent_id"
-- which naturally handles nulls (will return false/empty, so unrelated policies won't trigger).
-- The "Users can insert their own posts" policy uses profile_id, so that's fine.
