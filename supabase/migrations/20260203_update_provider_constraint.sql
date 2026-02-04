-- Update the check constraint to include 'gemini' and 'openrouter'
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_provider_check;
ALTER TABLE api_keys ADD CONSTRAINT api_keys_provider_check 
    CHECK (provider IN ('anthropic', 'openai', 'gemini', 'openrouter', 'groq'));
