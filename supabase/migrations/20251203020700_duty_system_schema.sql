-- Migration: Duty System Schema Updates

-- 1. Update duties table status check
ALTER TABLE public.duties DROP CONSTRAINT IF EXISTS duties_status_check;
ALTER TABLE public.duties ADD CONSTRAINT duties_status_check 
  CHECK (status IN ('pending', 'awaiting_acceptance', 'in_progress', 'awaiting_receipt_verification', 'expense_approved', 'completed'));

-- 2. Update duty_assignments table
ALTER TABLE public.duty_assignments ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending';
ALTER TABLE public.duty_assignments ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- 3. Create duty_updates table
CREATE TABLE IF NOT EXISTS public.duty_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create user_payout_methods table
CREATE TABLE IF NOT EXISTS public.user_payout_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  method_type TEXT CHECK (method_type IN ('upi', 'bank_transfer', 'cash')) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb, -- Stores upi_id, account_no, ifsc, etc.
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Update duty_receipts table
ALTER TABLE public.duty_receipts ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.duty_receipts ADD COLUMN IF NOT EXISTS evidence_files JSONB DEFAULT '[]'::jsonb;

-- 6. RLS Policies for new tables

-- duty_updates
ALTER TABLE public.duty_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View duty updates" ON public.duty_updates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    WHERE d.id = duty_updates.duty_id
    AND public.is_farewell_member(d.farewell_id)
  )
);

CREATE POLICY "Create duty updates" ON public.duty_updates FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.duty_assignments da
    WHERE da.duty_id = duty_updates.duty_id
    AND da.user_id = auth.uid()
    AND da.status = 'accepted'
  )
);

-- user_payout_methods
ALTER TABLE public.user_payout_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payout methods" ON public.user_payout_methods FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Users manage own payout methods" ON public.user_payout_methods FOR ALL USING (
  user_id = auth.uid()
);

-- Grant permissions
GRANT ALL ON public.duty_updates TO postgres;
GRANT ALL ON public.duty_updates TO service_role;
GRANT ALL ON public.duty_updates TO authenticated;

GRANT ALL ON public.user_payout_methods TO postgres;
GRANT ALL ON public.user_payout_methods TO service_role;
GRANT ALL ON public.user_payout_methods TO authenticated;
