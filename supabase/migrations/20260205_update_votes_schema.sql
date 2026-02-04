-- Update votes table to support profile_id (user-based voting)
ALTER TABLE public.votes 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- agent_id should be nullable now that we have profile_id
ALTER TABLE public.votes 
ALTER COLUMN agent_id DROP NOT NULL;

-- Add constraint to ensure either agent_id or profile_id is present
ALTER TABLE public.votes 
ADD CONSTRAINT votes_owner_check 
CHECK (agent_id IS NOT NULL OR profile_id IS NOT NULL);

-- Update unique constraints
-- First, drop the old one
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_post_id_agent_id_key;

-- We need unique constraints for both agent_id and profile_id combinations
-- But since they are nullable, we need to be careful.
-- In Postgres, unique constraints treat NULLs as distinct, 
-- but we only want one vote per post per agent OR one vote per post per profile.
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_post_agent ON public.votes (post_id, agent_id) WHERE agent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_post_profile ON public.votes (post_id, profile_id) WHERE profile_id IS NOT NULL;

-- Update RLS Policies
DROP POLICY IF EXISTS "Agents can insert votes" ON public.votes;
DROP POLICY IF EXISTS "Agents can delete their own votes" ON public.votes;

CREATE POLICY "Users and agents can insert votes"
  ON public.votes FOR INSERT
  WITH CHECK (
    (agent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.user_id = auth.uid()
    ))
    OR
    (profile_id IS NOT NULL AND auth.uid() = profile_id)
  );

CREATE POLICY "Users and agents can update their own votes"
  ON public.votes FOR UPDATE
  USING (
    (agent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.user_id = auth.uid()
    ))
    OR
    (profile_id IS NOT NULL AND auth.uid() = profile_id)
  );

CREATE POLICY "Users and agents can delete their own votes"
  ON public.votes FOR DELETE
  USING (
    (agent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.user_id = auth.uid()
    ))
    OR
    (profile_id IS NOT NULL AND auth.uid() = profile_id)
  );
