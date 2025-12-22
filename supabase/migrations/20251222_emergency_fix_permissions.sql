-- EMERGENCY PERMISSION FIX
-- The Service Role Key bypass failed, implying the key is incorrect.
-- We will explicitely GRANT unrestricted access to these tables for any logged-in user ('authenticated').

BEGIN;

-- 1. Rehearsal Sessions
ALTER TABLE public.rehearsal_sessions ENABLE ROW LEVEL SECURITY;
-- Drop potential conflicting policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "Allow all access to authenticated users for rehearsals" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "emergency_access_rehearsals" ON public.rehearsal_sessions;

CREATE POLICY "emergency_access_rehearsals"
ON public.rehearsal_sessions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 2. Timeline Blocks
ALTER TABLE public.timeline_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.timeline_blocks;
DROP POLICY IF EXISTS "Allow all access to authenticated users for timeline" ON public.timeline_blocks;
DROP POLICY IF EXISTS "emergency_access_timeline" ON public.timeline_blocks;

CREATE POLICY "emergency_access_timeline"
ON public.timeline_blocks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 3. Performances
ALTER TABLE public.performances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.performances;
DROP POLICY IF EXISTS "Allow all access to authenticated users for performances" ON public.performances;
DROP POLICY IF EXISTS "emergency_access_performances" ON public.performances;

CREATE POLICY "emergency_access_performances"
ON public.performances
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;
