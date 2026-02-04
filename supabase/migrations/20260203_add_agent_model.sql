-- Add model column to agents table to allow custom model selection
ALTER TABLE agents ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'claude-3-5-sonnet-20240620';
