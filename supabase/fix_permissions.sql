-- FIX: Permissions and RLS Policies
-- Run this if you see "permission denied" errors.

-- 1. Grant Permissions to App Roles
GRANT ALL ON TABLE public.rehearsals TO postgres, service_role;
GRANT ALL ON TABLE public.rehearsal_participants TO postgres, service_role;
GRANT ALL ON TABLE public.rehearsal_segments TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rehearsals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rehearsal_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rehearsal_segments TO authenticated;

-- 2. Ensure RLS is Enabled
ALTER TABLE public.rehearsals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehearsal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehearsal_segments ENABLE ROW LEVEL SECURITY;

-- 3. Re-apply Policies (Drop first to avoid duplicates)

-- REHEARSALS
DROP POLICY IF EXISTS "View rehearsals for farewell members" ON public.rehearsals;
CREATE POLICY "View rehearsals for farewell members" ON public.rehearsals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = rehearsals.farewell_id 
            AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Manage rehearsals for admins" ON public.rehearsals;
CREATE POLICY "Manage rehearsals for admins" ON public.rehearsals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = rehearsals.farewell_id 
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher')
        )
    );

-- PARTICIPANTS
DROP POLICY IF EXISTS "View participants for farewell members" ON public.rehearsal_participants;
CREATE POLICY "View participants for farewell members" ON public.rehearsal_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_participants.rehearsal_id
            AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Manage participants for admins" ON public.rehearsal_participants;
CREATE POLICY "Manage participants for admins" ON public.rehearsal_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_participants.rehearsal_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher')
        )
    );

-- SEGMENTS
DROP POLICY IF EXISTS "View segments for farewell members" ON public.rehearsal_segments;
CREATE POLICY "View segments for farewell members" ON public.rehearsal_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_segments.rehearsal_id
            AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Manage segments for admins" ON public.rehearsal_segments;
CREATE POLICY "Manage segments for admins" ON public.rehearsal_segments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_segments.rehearsal_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher')
        )
    );

-- RELOAD CONFIG
NOTIFY pgrst, 'reload config';
