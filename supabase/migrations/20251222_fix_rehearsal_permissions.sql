-- Force fix permissions by dropping old policies first
-- This ensures we don't get "policy already exists" errors

-- 1. Rehearsal Sessions
DROP POLICY IF EXISTS "Allow all access to authenticated users for rehearsals" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "Allow view for all authenticated" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "Allow create for authenticated" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.rehearsal_sessions;

ALTER TABLE public.rehearsal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to authenticated users for rehearsals"
ON public.rehearsal_sessions FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- 2. Timeline Blocks
DROP POLICY IF EXISTS "Allow all access to authenticated users for timeline" ON public.timeline_blocks;
DROP POLICY IF EXISTS "Allow view for all authenticated" ON public.timeline_blocks;

ALTER TABLE public.timeline_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to authenticated users for timeline"
ON public.timeline_blocks FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- 3. Performances
DROP POLICY IF EXISTS "Allow all access to authenticated users for performances" ON public.performances;
DROP POLICY IF EXISTS "Allow view for all authenticated" ON public.performances;

ALTER TABLE public.performances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to authenticated users for performances"
ON public.performances FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. Decor Items (Just in case)
DROP POLICY IF EXISTS "Allow all access to authenticated users for decor" ON public.decor_items;
ALTER TABLE public.decor_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to authenticated users for decor"
ON public.decor_items FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
