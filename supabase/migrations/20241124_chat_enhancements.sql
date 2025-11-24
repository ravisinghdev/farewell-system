-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.
