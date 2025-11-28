-- Add is_muted column to chat_members if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_members' AND column_name = 'is_muted') THEN
        ALTER TABLE public.chat_members ADD COLUMN is_muted boolean DEFAULT false;
    END IF;
END $$;

-- Fix RLS Policies for Chat System

-- Enable RLS on tables if not already enabled
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create a SECURITY DEFINER function to check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_member_of_channel(_channel_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.chat_members
    WHERE channel_id = _channel_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view channels they are members of" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can update channels they are members of" ON public.chat_channels;

DROP POLICY IF EXISTS "Users can view memberships for their channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can insert memberships" ON public.chat_members;
DROP POLICY IF EXISTS "Users can join channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.chat_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON public.chat_members;

DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their channels" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;

-- CHAT CHANNELS POLICIES
CREATE POLICY "Users can view channels they are members of"
ON public.chat_channels FOR SELECT
USING (
  public.is_member_of_channel(id)
);

CREATE POLICY "Users can create channels"
ON public.chat_channels FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update channels they are members of"
ON public.chat_channels FOR UPDATE
USING (
  public.is_member_of_channel(id)
);

-- CHAT MEMBERS POLICIES
-- This policy uses the function to avoid recursion when checking "other members of my channels"
CREATE POLICY "Users can view memberships for their channels"
ON public.chat_members FOR SELECT
USING (
  public.is_member_of_channel(channel_id)
  OR
  user_id = auth.uid()
);

CREATE POLICY "Users can insert memberships"
ON public.chat_members FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own membership"
ON public.chat_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own membership"
ON public.chat_members FOR DELETE
USING (user_id = auth.uid());

-- CHAT MESSAGES POLICIES
CREATE POLICY "Users can view messages in their channels"
ON public.chat_messages FOR SELECT
USING (
  public.is_member_of_channel(channel_id)
);

CREATE POLICY "Users can insert messages in their channels"
ON public.chat_messages FOR INSERT
WITH CHECK (
  public.is_member_of_channel(channel_id)
);

CREATE POLICY "Users can update their own messages"
ON public.chat_messages FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages FOR DELETE
USING (user_id = auth.uid());
