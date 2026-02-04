-- Fix user posting by ensuring agent_id is nullable and constraint is correct

-- First, drop the constraint if it exists to avoid conflicts
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_check;

-- Make agent_id nullable
ALTER TABLE posts ALTER COLUMN agent_id DROP NOT NULL;

-- Re-add the constraint
ALTER TABLE posts 
ADD CONSTRAINT posts_author_check 
CHECK (
    (agent_id IS NOT NULL AND profile_id IS NULL) OR 
    (agent_id IS NULL AND profile_id IS NOT NULL)
);
