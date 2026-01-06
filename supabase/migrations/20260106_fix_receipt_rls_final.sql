-- Comprehensive RLS Policy Fix for Receipts and Votes

-- 1. Duty Receipts
ALTER TABLE public.duty_receipts ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.duty_receipts;
DROP POLICY IF EXISTS "Enable insert for assigned users" ON public.duty_receipts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.duty_receipts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.duty_receipts;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.duty_receipts;

-- Create Permissive Policies for Authenticated Users
CREATE POLICY "Allow Select for Authenticated" ON public.duty_receipts
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow Insert for Authenticated" ON public.duty_receipts
FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Update for Authenticated" ON public.duty_receipts
FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');

CREATE POLICY "Allow Delete for Authenticated" ON public.duty_receipts
FOR DELETE TO authenticated USING (auth.role() = 'authenticated');


-- 2. Receipt Votes
ALTER TABLE public.receipt_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.receipt_votes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.receipt_votes;
DROP POLICY IF EXISTS "Allow all for authenticated votes" ON public.receipt_votes;

CREATE POLICY "Allow Select for Authenticated" ON public.receipt_votes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow Insert for Authenticated" ON public.receipt_votes
FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Update for Authenticated" ON public.receipt_votes
FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');

CREATE POLICY "Allow Delete for Authenticated" ON public.receipt_votes
FOR DELETE TO authenticated USING (auth.role() = 'authenticated');
