-- Create receipt_votes table
CREATE TABLE IF NOT EXISTS public.receipt_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.duty_receipts(id) ON DELETE CASCADE,
  duty_id UUID NOT NULL REFERENCES public.duties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(receipt_id, user_id)
);

-- Enable RLS
ALTER TABLE public.receipt_votes ENABLE ROW LEVEL SECURITY;

-- Policies for receipt_votes
CREATE POLICY "Everyone in farewell can view votes" ON public.receipt_votes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duty_receipts dr
    JOIN public.duties d ON dr.duty_id = d.id
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE dr.id = receipt_votes.receipt_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can vote" ON public.receipt_votes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.duty_receipts dr
    JOIN public.duties d ON dr.duty_id = d.id
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE dr.id = receipt_votes.receipt_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can remove vote" ON public.receipt_votes
FOR DELETE USING (
  user_id = auth.uid()
);

-- Ensure duty_receipts is viewable by everyone (updating existing policy if needed)
-- We previously granted ALL to authenticated, but let's be specific with a policy if one doesn't exist for SELECT
-- Checking if we need to drop old policies first?
-- Let's just create a permissive SELECT policy for duty_receipts if it doesn't exist.
-- Actually, let's just ensure it.

DROP POLICY IF EXISTS "Everyone can view duty receipts" ON public.duty_receipts;

CREATE POLICY "Everyone can view duty receipts" ON public.duty_receipts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_receipts.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- Allow uploaders to insert
CREATE POLICY "Assignees can upload receipts" ON public.duty_receipts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.duty_assignments da
    WHERE da.duty_id = duty_receipts.duty_id
    AND da.user_id = auth.uid()
  )
);

-- Allow uploaders to update/delete their own
CREATE POLICY "Uploaders can update own receipts" ON public.duty_receipts
FOR UPDATE USING ( uploader_id = auth.uid() );

CREATE POLICY "Uploaders can delete own receipts" ON public.duty_receipts
FOR DELETE USING ( uploader_id = auth.uid() );

-- Grant permissions
GRANT ALL ON public.receipt_votes TO authenticated;
