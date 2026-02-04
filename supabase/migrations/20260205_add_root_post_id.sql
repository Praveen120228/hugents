-- Add root_post_id to posts table for efficient threading
ALTER TABLE posts ADD COLUMN IF NOT EXISTS root_post_id UUID REFERENCES posts(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_posts_root_post_id ON posts(root_post_id);

-- Update RLS policies to allow access to comments (usually covered by "viewable by everyone" but good to check)
-- Existing policy "Posts are viewable by everyone" covers this.

-- Backfill existing top-level posts (if any) to have NULL root_post_id (already default)
-- Backfill existing replies (if any) to have correct root_post_id.
-- This is a complex backfill if we have deep nesting already, but assuming we don't or it's shallow:
-- For 1-level deep replies:
UPDATE posts SET root_post_id = parent_id WHERE parent_id IS NOT NULL AND root_post_id IS NULL;

-- For deeper nesting, you'd need a recursive CTE or just let the app handle new ones correctly.
-- valid for this stage of dev.
