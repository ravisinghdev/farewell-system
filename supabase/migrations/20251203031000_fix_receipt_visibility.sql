-- Comprehensive fix for receipt visibility and voting

-- 0. Ensure duty_id exists in receipt_votes (Fix for missing column error)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_votes' AND column_name = 'duty_id') THEN
        ALTER TABLE public.receipt_votes ADD COLUMN duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Backfill duty_id for existing votes
UPDATE public.receipt_votes rv
SET duty_id = dr.duty_id
FROM public.duty_receipts dr
WHERE rv.receipt_id = dr.id
AND rv.duty_id IS NULL;

-- Make it NOT NULL after backfill (optional, but good for integrity)
-- ALTER TABLE public.receipt_votes ALTER COLUMN duty_id SET NOT NULL;


-- 1. Ensure RLS is enabled
ALTER TABLE public.duty_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_votes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Everyone can view duty receipts" ON public.duty_receipts;
DROP POLICY IF EXISTS "Assignees can upload receipts" ON public.duty_receipts;
DROP POLICY IF EXISTS "Uploaders can update own receipts" ON public.duty_receipts;
DROP POLICY IF EXISTS "Uploaders can delete own receipts" ON public.duty_receipts;

DROP POLICY IF EXISTS "Everyone in farewell can view votes" ON public.receipt_votes;
DROP POLICY IF EXISTS "Members can vote" ON public.receipt_votes;
DROP POLICY IF EXISTS "Members can remove vote" ON public.receipt_votes;

-- 3. Policies for duty_receipts

-- VIEW: Everyone in the farewell can view receipts
CREATE POLICY "Everyone can view duty receipts" ON public.duty_receipts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_receipts.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- INSERT: Assignees can upload receipts
CREATE POLICY "Assignees can upload receipts" ON public.duty_receipts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.duty_assignments da
    WHERE da.duty_id = duty_receipts.duty_id
    AND da.user_id = auth.uid()
  )
);

-- UPDATE: Uploaders can update their own receipts
CREATE POLICY "Uploaders can update own receipts" ON public.duty_receipts
FOR UPDATE USING ( uploader_id = auth.uid() );

-- DELETE: Uploaders can delete their own receipts
CREATE POLICY "Uploaders can delete own receipts" ON public.duty_receipts
FOR DELETE USING ( uploader_id = auth.uid() );


-- 4. Policies for receipt_votes

-- VIEW: Everyone in the farewell can view votes
CREATE POLICY "Everyone in farewell can view votes" ON public.receipt_votes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = receipt_votes.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- INSERT: Members can vote (must be in the farewell)
CREATE POLICY "Members can vote" ON public.receipt_votes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = receipt_votes.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- DELETE: Members can remove their own vote
CREATE POLICY "Members can remove vote" ON public.receipt_votes
FOR DELETE USING (
  user_id = auth.uid()
);

-- 5. Grant permissions (Crucial for PostgREST)
GRANT ALL ON public.duty_receipts TO authenticated;
GRANT ALL ON public.receipt_votes TO authenticated;

-- 6. Force schema cache reload
NOTIFY pgrst, 'reload config';
