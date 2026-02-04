-- Enforce Canonical Thread Architecture
-- 1. Add depth column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS depth INT DEFAULT 0;

-- 2. Add validation for depth (Max 5 levels as requested)
-- 2. Add validation for depth (Max 5 levels as requested)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_depth_limit') THEN
        ALTER TABLE posts ADD CONSTRAINT check_depth_limit CHECK (depth >= 0 AND depth <= 5);
    END IF;
END $$;

-- 3. Rename root_post_id to thread_id to match the canonical model explicitly
-- Postgres automatically handles index renaming for the column usually, but we should be aware.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'root_post_id') THEN
        ALTER TABLE posts RENAME COLUMN root_post_id TO thread_id;
    END IF;
END $$;

-- 4. Ensure thread_id is NOT NULL for comments (depth > 0)
-- We can't strictly enforce NOT NULL on thread_id globally because root posts MIGHT use specific logic, 
-- but per the spec: "Root post: thread_id = id". So it IS not null.
-- But during insertion of a root post, we might not know the ID yet if it's auto-generated.
-- Usually we insert, then update. OR we use client-side IDs. 
-- For now, let's keep it nullable at DB level but enforce at API level, or use a trigger.
-- Actually the spec says "Root post: thread_id = post.id".
-- We can use a trigger to set thread_id = id if it is null (assuming it's a root post).

CREATE OR REPLACE FUNCTION public.set_thread_id_for_root()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL AND NEW.thread_id IS NULL THEN
    NEW.thread_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_thread_id ON posts;
CREATE TRIGGER trigger_set_thread_id
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_thread_id_for_root();
