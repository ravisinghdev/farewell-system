-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.
