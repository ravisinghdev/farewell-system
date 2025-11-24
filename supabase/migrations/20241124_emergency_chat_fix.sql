-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
