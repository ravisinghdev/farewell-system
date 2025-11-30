-- Fix permissions for announcement_reactions

-- Enable RLS
ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "View announcement reactions" ON public.announcement_reactions;
DROP POLICY IF EXISTS "Manage own announcement reactions" ON public.announcement_reactions;
DROP POLICY IF EXISTS "Insert own reactions" ON public.announcement_reactions;
DROP POLICY IF EXISTS "Delete own reactions" ON public.announcement_reactions;

-- Policy for viewing reactions (anyone in the farewell can see them)
-- We use a more direct check if possible, or keep the subquery but ensure permissions are correct
CREATE POLICY "View announcement reactions" ON public.announcement_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = announcement_reactions.announcement_id
    AND public.is_farewell_member(a.farewell_id)
  )
);

-- Policy for inserting reactions (users can only react for themselves)
CREATE POLICY "Insert own reactions" ON public.announcement_reactions
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Policy for deleting reactions (users can only delete their own)
CREATE POLICY "Delete own reactions" ON public.announcement_reactions
FOR DELETE USING (
  auth.uid() = user_id
);

-- Grant permissions to authenticated users
GRANT ALL ON public.announcement_reactions TO authenticated;
GRANT ALL ON public.announcement_reactions TO service_role;

-- Ensure real-time is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reactions;
