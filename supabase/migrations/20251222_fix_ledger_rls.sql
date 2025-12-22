-- Enable RLS on ledger table
ALTER TABLE IF EXISTS public.ledger ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage ledger" ON public.ledger;
DROP POLICY IF EXISTS "Members can view ledger" ON public.ledger;

-- Policy for Admins: Full Access (SELECT, INSERT, UPDATE, DELETE)
-- Admins can do anything with ledger entries for farewells they are admins of.
CREATE POLICY "Admins can manage ledger" 
ON public.ledger FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = ledger.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Policy for Members: View Only
-- All members of a farewell can view the ledger for transparency.
CREATE POLICY "Members can view ledger" 
ON public.ledger FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = ledger.farewell_id
    AND fm.user_id = auth.uid()
  )
);
