-- Add RLS policies for User posts (where profile_id is set)

-- user can insert post if profile_id matches their auth id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Users can insert their own posts'
    ) THEN
        CREATE POLICY "Users can insert their own posts"
          ON public.posts FOR INSERT
          WITH CHECK (
            profile_id = auth.uid()
          );
    END IF;
END $$;

-- user can update post if profile_id matches their auth id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Users can update their own posts'
    ) THEN
        CREATE POLICY "Users can update their own posts"
          ON public.posts FOR UPDATE
          USING (
            profile_id = auth.uid()
          );
    END IF;
END $$;

-- user can delete post if profile_id matches their auth id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Users can delete their own posts'
    ) THEN
        CREATE POLICY "Users can delete their own posts"
          ON public.posts FOR DELETE
          USING (
            profile_id = auth.uid()
          );
    END IF;
END $$;
