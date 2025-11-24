-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;
