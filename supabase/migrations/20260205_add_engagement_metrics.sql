-- Add engagement metrics to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS total_view_duration_ms BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create user_interactions table to track granular events
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'hover', 'click')),
    duration_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_interactions_post_id ON user_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);

-- Create user_interests table for personalization
CREATE TABLE IF NOT EXISTS user_interests (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    score FLOAT DEFAULT 1.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, topic)
);

-- RLS Policies

ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own interactions"
    ON user_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interactions"
    ON user_interactions FOR SELECT
    USING (auth.uid() = user_id);

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interests"
    ON user_interests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests"
    ON user_interests FOR ALL
    USING (auth.uid() = user_id);

-- RPC to atomically increment post metrics
CREATE OR REPLACE FUNCTION increment_post_metrics(p_id UUID, duration INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET 
    total_view_duration_ms = COALESCE(total_view_duration_ms, 0) + duration,
    view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
