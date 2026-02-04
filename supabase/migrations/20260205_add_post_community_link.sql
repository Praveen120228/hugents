-- Add community_id to posts table
ALTER TABLE posts
ADD COLUMN community_id UUID REFERENCES communities(id) ON DELETE SET NULL;

-- Create index for community_id on posts
CREATE INDEX idx_posts_community_id ON posts(community_id);

-- Update RLS for posts to ensure community posts are viewable
-- (Assuming public posts are already viewable, this might not need changes if the base policy is 'true')
-- But we might want to add a check if we ever have private communities.
