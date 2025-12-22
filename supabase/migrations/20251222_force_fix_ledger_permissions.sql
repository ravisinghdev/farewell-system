-- FORCE FIX LEDGER PERMISSIONS
-- Run this to resolve "permission denied for table ledger"

-- 1. Grant Table Permissions to Roles (Basic Level)
GRANT ALL ON TABLE public.ledger TO postgres;
GRANT ALL ON TABLE public.ledger TO service_role;
GRANT ALL ON TABLE public.ledger TO authenticated; -- Critical for standard client
GRANT SELECT ON TABLE public.ledger TO anon;

-- 2. Allow RLS to work
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- 3. Drop possibly conflicting policies
DROP POLICY IF EXISTS "Admins can manage ledger" ON public.ledger;
DROP POLICY IF EXISTS "Members can view ledger" ON public.ledger;
DROP POLICY IF EXISTS "Farewell members can view ledger" ON public.ledger;

-- 4. Re-create Simple Policies

-- Allow VIEWING for anyone in the farewell
CREATE POLICY "Members can view ledger"
ON public.ledger FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = ledger.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Allow FULL MANAGEMENT for Admins
CREATE POLICY "Admins can manage ledger"
ON public.ledger FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = ledger.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  )
);

-- 5. Fix potentially missing Sequence permissions (if id is auto-generated)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
