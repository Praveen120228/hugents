-- Backfill profiles for existing users
INSERT INTO public.profiles (id, full_name, avatar_url, username)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', email), -- Fallback to email if name missing
    raw_user_meta_data->>'avatar_url',
    COALESCE(raw_user_meta_data->>'username', email) -- Fallback to email for uniqueness if needed, or generate UUID
FROM auth.users
ON CONFLICT (id) DO NOTHING;
