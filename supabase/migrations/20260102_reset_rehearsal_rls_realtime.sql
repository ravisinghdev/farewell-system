-- 20260102_reset_rehearsal_rls_realtime.sql
-- COMPLETE RESET OF RLS POLICIES FOR REHEARSAL TABLES
-- Includes Realtime Enablement

BEGIN;

-- ============================================================================
-- 1. REHEARSAL SESSIONS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.rehearsal_sessions ENABLE ROW LEVEL SECURITY;

-- Add to Realtime Publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rehearsal_sessions;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "View sessions" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "Admin manage sessions" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "allow_service_role_all" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "allow_public_read" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "allow_public_write_debug" ON public.rehearsal_sessions;

-- POLICY 1: Service Role Full Access (Critical for Server Actions)
CREATE POLICY "service_role_manage_sessions" ON public.rehearsal_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- POLICY 2: Authenticated Users View All (Simplifies fetching)
CREATE POLICY "authenticated_view_sessions" ON public.rehearsal_sessions
    FOR SELECT
    TO authenticated
    USING (true);

-- POLICY 3: Members can View (Redundant with above, but good specific backup)
-- (Skipping to keep it simple as requested)

-- POLICY 4: Admins/Teachers Manage Access
CREATE POLICY "admin_manage_sessions" ON public.rehearsal_sessions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = rehearsal_sessions.farewell_id 
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher', 'organizer')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = rehearsal_sessions.farewell_id 
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher', 'organizer')
        )
    );


-- ============================================================================
-- 2. REHEARSAL ATTENDANCE (Associated Table)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.rehearsal_attendance ENABLE ROW LEVEL SECURITY;

-- Add to Realtime Publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rehearsal_attendance;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "View attendance" ON public.rehearsal_attendance;
DROP POLICY IF EXISTS "Manage attendance" ON public.rehearsal_attendance;
DROP POLICY IF EXISTS "service_role_manage_attendance" ON public.rehearsal_attendance;

-- POLICY 1: Service Role Full Access
CREATE POLICY "service_role_manage_attendance" ON public.rehearsal_attendance
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- POLICY 2: Authenticated View
CREATE POLICY "authenticated_view_attendance" ON public.rehearsal_attendance
    FOR SELECT
    TO authenticated
    USING (true);

-- POLICY 3: Self Check-in / Update
CREATE POLICY "user_manage_own_attendance" ON public.rehearsal_attendance
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- POLICY 4: Admin Manage
CREATE POLICY "admin_manage_attendance" ON public.rehearsal_attendance
    FOR ALL
    TO authenticated
    USING (
         EXISTS (
            SELECT 1 FROM public.rehearsal_sessions rs
            JOIN public.farewell_members fm ON rs.farewell_id = fm.farewell_id
            WHERE rs.id = rehearsal_attendance.session_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher', 'organizer')
        )
    );

COMMIT;
