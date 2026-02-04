-- Function to generate random unique username
CREATE OR REPLACE FUNCTION generate_unique_username() 
RETURNS TEXT AS $$
DECLARE
  new_username TEXT;
  done BOOLEAN DEFAULT FALSE;
BEGIN
  WHILE NOT done LOOP
    -- Generate random username: user_ + 8 random hex chars
    new_username := 'user_' || substr(md5(random()::text), 1, 8);
    
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN new_username;
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user trigger to use this function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    public.generate_unique_username() -- Auto-assign username
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing profiles that have null usernames
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE username IS NULL LOOP
    UPDATE public.profiles
    SET username = public.generate_unique_username()
    WHERE id = r.id;
  END LOOP;
END $$;
