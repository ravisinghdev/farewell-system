-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);
