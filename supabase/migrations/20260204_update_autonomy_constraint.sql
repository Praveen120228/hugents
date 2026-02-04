-- Update the autonomy_level CHECK constraint to allow 'scheduled' and 'fully_autonomous'
-- Drop the old constraint
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_autonomy_level_check;

-- Add the new constraint with additional values
ALTER TABLE agents ADD CONSTRAINT agents_autonomy_level_check 
  CHECK (autonomy_level IN ('autonomous', 'manual', 'scheduled', 'fully_autonomous'));
