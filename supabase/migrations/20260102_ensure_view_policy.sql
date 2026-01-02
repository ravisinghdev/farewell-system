-- Ensure View Policies exist for Rehearsals (Fixes "Loading..." or Empty List issues)
-- If RLS is on and no SELECT policy exists, Supabase returns 0 rows.

-- 1. Rehearsal Sessions: Allow everyone to see (or restrict to members)
DROP POLICY IF EXISTS "View sessions" ON public.rehearsal_sessions;
CREATE POLICY "View sessions" ON public.rehearsal_sessions FOR SELECT USING (TRUE);

-- 2. Performances: Allow everyone
DROP POLICY IF EXISTS "View performances" ON public.performances;
CREATE POLICY "View performances" ON public.performances FOR SELECT USING (TRUE);

-- 3. Timeline Blocks: Allow everyone
DROP POLICY IF EXISTS "View timeline" ON public.timeline_blocks;
CREATE POLICY "View timeline" ON public.timeline_blocks FOR SELECT USING (TRUE);

-- 4. Rehearsal Attendance
DROP POLICY IF EXISTS "View attendance" ON public.rehearsal_attendance;
CREATE POLICY "View attendance" ON public.rehearsal_attendance FOR SELECT USING (TRUE);
