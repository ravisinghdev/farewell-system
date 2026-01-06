-- Migration to fix permissions for timeline_reactions
-- Timestamp: 20260105083000

-- Grant access to authenticated users and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_reactions TO authenticated;
GRANT ALL ON public.timeline_reactions TO service_role;

-- Allow public read access (if needed for anon users, e.g. public share pages)
GRANT SELECT ON public.timeline_reactions TO anon;

-- Ensure RLS is enabled
ALTER TABLE public.timeline_reactions ENABLE ROW LEVEL SECURITY;

-- Re-apply the view policy to be sure
DROP POLICY IF EXISTS "View timeline reactions" ON public.timeline_reactions;
CREATE POLICY "View timeline reactions" ON public.timeline_reactions FOR SELECT USING (true);
