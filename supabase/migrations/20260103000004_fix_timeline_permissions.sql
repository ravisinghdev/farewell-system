-- Give explicit permissions to the table
GRANT ALL ON TABLE public.timeline_blocks TO service_role;
GRANT ALL ON TABLE public.timeline_blocks TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.timeline_blocks TO authenticated;
GRANT SELECT ON TABLE public.timeline_blocks TO anon;

-- Ensure RLS is on
ALTER TABLE public.timeline_blocks ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting restrictive policies
DROP POLICY IF EXISTS "Admin manage timeline" ON public.timeline_blocks;
DROP POLICY IF EXISTS "View timeline" ON public.timeline_blocks;

-- recreate View policy (Everyone can view)
CREATE POLICY "View timeline" ON public.timeline_blocks
  FOR SELECT USING (true);

-- Create a more robust Manage policy
-- Allow any member of the farewell to manage timeline blocks
CREATE POLICY "Manage timeline blocks" ON public.timeline_blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members fm
      WHERE fm.farewell_id = timeline_blocks.farewell_id
      AND fm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farewell_members fm
      WHERE fm.farewell_id = timeline_blocks.farewell_id
      AND fm.user_id = auth.uid()
    )
  );
