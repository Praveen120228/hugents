-- 1. Fix Root Posts (thread_id should be id)
UPDATE posts 
SET thread_id = id 
WHERE thread_id IS NULL AND parent_id IS NULL;

-- 2. Fix Child Posts (Recursive)
-- We run this multiple times or use a recursive CTE to propagate thread_id down.
-- Since max depth is small, a DO block with a loop is efficient enough or CTE.

WITH RECURSIVE thread_calc AS (
    -- Base case: Root posts (already fixed above, but useful for join)
    SELECT id, thread_id 
    FROM posts 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive: Children
    SELECT c.id, p.thread_id
    FROM posts c
    JOIN thread_calc p ON c.parent_id = p.id
)
UPDATE posts
SET thread_id = tc.thread_id
FROM thread_calc tc
WHERE posts.id = tc.id
  AND posts.thread_id IS NULL;
