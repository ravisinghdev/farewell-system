-- 20260102_fix_recursion_with_functions_v2.sql
-- COMPREHENSIVE FIX: Recursion + Service Role + Realtime

BEGIN;

-- 1. Create Helper Function (Bypass RLS)
-- Checks membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.has_role_in_farewell(_farewell_id UUID, _user_id UUID, _roles text[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = _user_id
    AND role::text = ANY(_roles)
    AND active = true
  );
END;
$$;

-- ============================================================================
-- 2. REHEARSAL SESSIONS
-- ============================================================================

ALTER TABLE public.rehearsal_sessions ENABLE ROW LEVEL SECURITY;

-- Clean State
DROP POLICY IF EXISTS "admin_manage_sessions" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "service_role_manage_sessions" ON public.rehearsal_sessions;
DROP POLICY IF EXISTS "authenticated_view_sessions" ON public.rehearsal_sessions;

-- POLICY A: Service Role (Critical for server actions using Service Key)
CREATE POLICY "service_role_manage_sessions" ON public.rehearsal_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- POLICY B: Authenticated View
CREATE POLICY "authenticated_view_sessions" ON public.rehearsal_sessions
    FOR SELECT TO authenticated USING (true);

-- POLICY C: Admin Manage (Using Recursion-Safe Function)
CREATE POLICY "admin_manage_sessions" ON public.rehearsal_sessions
    FOR ALL TO authenticated
    USING (
        public.has_role_in_farewell(
            farewell_id, 
            auth.uid(), 
            ARRAY['main_admin', 'parallel_admin', 'teacher', 'organizer']::text[]
        )
    )
    WITH CHECK (
        public.has_role_in_farewell(
            farewell_id, 
            auth.uid(), 
            ARRAY['main_admin', 'parallel_admin', 'teacher', 'organizer']::text[]
        )
    );

-- ============================================================================
-- 3. REHEARSAL ATTENDANCE
-- ============================================================================

ALTER TABLE public.rehearsal_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_attendance" ON public.rehearsal_attendance;
DROP POLICY IF EXISTS "service_role_manage_attendance" ON public.rehearsal_attendance;

-- POLICY A: Service Role
CREATE POLICY "service_role_manage_attendance" ON public.rehearsal_attendance
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- POLICY B: Admin Manage (Using Recursion-Safe Function via Session Lookup)
CREATE POLICY "admin_manage_attendance" ON public.rehearsal_attendance
    FOR ALL TO authenticated
    USING (
         EXISTS (
            SELECT 1 FROM public.rehearsal_sessions rs
            WHERE rs.id = rehearsal_attendance.session_id
            AND public.has_role_in_farewell(
                rs.farewell_id, 
                auth.uid(), 
                ARRAY['main_admin', 'parallel_admin', 'teacher', 'organizer']::text[]
            )
        )
    );

-- POLICY C: Self Manage (For Self Check-in)
CREATE POLICY "self_manage_attendance" ON public.rehearsal_attendance
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

COMMIT;

COMMIT;
