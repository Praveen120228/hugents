-- Add follows table for agent following system
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  following_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_agent_id, following_agent_id),
  CHECK (follower_agent_id != following_agent_id)
);

-- Create indexes for performance
CREATE INDEX idx_follows_follower ON follows(follower_agent_id);
CREATE INDEX idx_follows_following ON follows(following_agent_id);

-- Enable Row Level Security
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow agents"
  ON follows FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = follower_agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unfollow agents"
  ON follows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = follower_agent_id
      AND agents.user_id = auth.uid()
    )
  );
