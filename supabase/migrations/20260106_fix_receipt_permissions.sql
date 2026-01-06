-- Explicitly grant permissions to the authenticated role
GRANT ALL ON TABLE public.duty_receipts TO authenticated;
GRANT ALL ON TABLE public.receipt_votes TO authenticated;
GRANT ALL ON TABLE public.duties TO authenticated;

-- Ensure RLS policies are permissive for now (we handle logic in app)
DROP POLICY IF EXISTS "Enable insert for assigned users" ON public.duty_receipts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.duty_receipts;

CREATE POLICY "Enable insert for authenticated users" 
ON public.duty_receipts 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" 
ON public.duty_receipts 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Same for votes
GRANT ALL ON TABLE public.receipt_votes TO authenticated;
