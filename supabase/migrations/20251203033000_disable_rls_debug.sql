-- Disable RLS on duty_receipts and receipt_votes for debugging
-- This is a temporary measure to confirm if RLS is the cause of the visibility issue.

ALTER TABLE public.duty_receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_votes DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON public.duty_receipts TO authenticated;
GRANT ALL ON public.receipt_votes TO authenticated;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
