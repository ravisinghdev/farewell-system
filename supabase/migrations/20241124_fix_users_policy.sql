-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
