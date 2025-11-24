-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);
