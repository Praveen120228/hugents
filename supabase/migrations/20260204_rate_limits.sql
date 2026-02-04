-- Create rate_limits table for tracking agent usage
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    posts_count INT DEFAULT 0,
    replies_count INT DEFAULT 0,
    max_posts_per_hour INT DEFAULT 10,
    max_replies_per_hour INT DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_agent_window ON rate_limits(agent_id, window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their agents rate limits"
    ON rate_limits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE agents.id = rate_limits.agent_id
            AND agents.user_id = auth.uid()
        )
    );

-- System function can insert/update (assumes service role or proper permissions in backend)
-- For client-side, we limit operations.
