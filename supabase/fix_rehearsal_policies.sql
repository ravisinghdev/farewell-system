-- Fix RLS Policies for Rehearsals to include 'admin' role
-- And ensure 'student' and others can view properly.

-- 1. Rehearsals Management
DROP POLICY IF EXISTS "Manage rehearsals for admins" ON public.rehearsals;
CREATE POLICY "Manage rehearsals for admins" ON public.rehearsals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = rehearsals.farewell_id 
            AND fm.user_id = auth.uid()
            AND fm.role IN ('admin', 'main_admin', 'parallel_admin', 'teacher') -- Added 'admin'
        )
    );

-- 2. Participants Management
DROP POLICY IF EXISTS "Manage participants for admins" ON public.rehearsal_participants;
CREATE POLICY "Manage participants for admins" ON public.rehearsal_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_participants.rehearsal_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('admin', 'main_admin', 'parallel_admin', 'teacher') -- Added 'admin'
        )
    );

-- 3. Segments Management
DROP POLICY IF EXISTS "Manage segments for admins" ON public.rehearsal_segments;
CREATE POLICY "Manage segments for admins" ON public.rehearsal_segments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_segments.rehearsal_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('admin', 'main_admin', 'parallel_admin', 'teacher') -- Added 'admin'
        )
    );

-- Ensure View policies are correct (Reprinting to be safe/sure they exist)
DROP POLICY IF EXISTS "View rehearsals for farewell members" ON public.rehearsals;
CREATE POLICY "View rehearsals for farewell members" ON public.rehearsals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = rehearsals.farewell_id 
            AND fm.user_id = auth.uid()
        )
    );

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
