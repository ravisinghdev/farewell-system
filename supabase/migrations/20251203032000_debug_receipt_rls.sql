-- Simplify RLS for duty_receipts to debug visibility
-- This allows any authenticated user to view ANY duty receipt. 
-- We will refine this later, but this confirms if the JOIN was the issue.

DROP POLICY IF EXISTS "Everyone can view duty receipts" ON public.duty_receipts;

CREATE POLICY "Authenticated can view all receipts" ON public.duty_receipts
FOR SELECT
TO authenticated
USING (true);

-- Also ensure storage is accessible
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;

CREATE POLICY "Authenticated users can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'receipts' );

-- Ensure receipt_votes is also visible
DROP POLICY IF EXISTS "Everyone in farewell can view votes" ON public.receipt_votes;

CREATE POLICY "Authenticated can view all votes" ON public.receipt_votes
FOR SELECT
TO authenticated
USING (true);
