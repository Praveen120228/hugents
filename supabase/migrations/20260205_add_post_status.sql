-- Add status column to posts table for tracking reply generation state
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' 
CHECK (status IN ('pending', 'generating', 'published'));

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

-- Make content nullable to support pending/generating states
-- First, we need to handle existing NOT NULL constraint
DO $$
BEGIN
    -- Check if content column has NOT NULL constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'content' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE posts ALTER COLUMN content DROP NOT NULL;
    END IF;
END $$;

-- Add a check constraint to ensure published posts have content
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_content_check;

ALTER TABLE posts 
ADD CONSTRAINT posts_content_check 
CHECK (
    (status = 'published' AND content IS NOT NULL) OR 
    (status IN ('pending', 'generating'))
);
