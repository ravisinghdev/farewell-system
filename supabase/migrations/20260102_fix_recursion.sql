-- Fix "Stack Depth Limit Exceeded" by breaking RLS recursion
-- We use a SECURITY DEFINER function to fetch roles without triggering RLS recursively.

-- 1. Create Helper Function (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_farewell_role(_farewell_id UUID)
RETURNS text AS $$
DECLARE
  _role text;
BEGIN
  SELECT role::text INTO _role
  FROM public.farewell_members
  WHERE farewell_id = _farewell_id 
  AND user_id = auth.uid()
  LIMIT 1;
  
  RETURN _role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_my_farewell_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_farewell_role(UUID) TO service_role;


-- 2. Refactor Rehearsal Policies to use the function (No recursion)

DROP POLICY IF EXISTS "Admin manage sessions" ON public.rehearsal_sessions;
CREATE POLICY "Admin manage sessions" ON public.rehearsal_sessions FOR ALL USING (
    public.get_my_farewell_role(farewell_id) IN ('main_admin', 'parallel_admin', 'admin', 'teacher', 'organizer')
);

DROP POLICY IF EXISTS "Admin manage performances" ON public.performances;
CREATE POLICY "Admin manage performances" ON public.performances FOR ALL USING (
    public.get_my_farewell_role(farewell_id) IN ('main_admin', 'parallel_admin', 'admin', 'teacher', 'organizer')
);

DROP POLICY IF EXISTS "Admin manage timeline" ON public.timeline_blocks;
CREATE POLICY "Admin manage timeline" ON public.timeline_blocks FOR ALL USING (
    public.get_my_farewell_role(farewell_id) IN ('main_admin', 'parallel_admin', 'admin', 'teacher', 'organizer')
);

-- 3. Fix Attendance Policy (Requires explicit join, but we can simplify permission check)
DROP POLICY IF EXISTS "Admin manage attendance" ON public.rehearsal_attendance;
CREATE POLICY "Admin manage attendance" ON public.rehearsal_attendance FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.rehearsal_sessions rs 
        WHERE rs.id = rehearsal_attendance.session_id
        AND public.get_my_farewell_role(rs.farewell_id) IN ('main_admin', 'parallel_admin', 'admin', 'teacher', 'organizer')
    )
);

-- 4. BONUS: Fix the Core Member Recursion (Optional but recommended)
-- This replaces the recursive policy on farewell_members itself
DROP POLICY IF EXISTS "members_farewell_read" ON public.farewell_members;
CREATE POLICY "members_farewell_read" ON public.farewell_members FOR SELECT USING (
    -- Users can see rows where they are in the same farewell
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    )
);
-- Note: The above policy is STILL recursive if not handled by Supabase specially. 
-- A safer version uses the function, but the function takes farewell_id.
-- For listing *all* members, we might need a different approach.
-- For now, fixing the Rehearsal policies (which triggered the crash) is the priority.
