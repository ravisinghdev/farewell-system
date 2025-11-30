-- 1. Update Duties Table
ALTER TABLE public.duties 
ADD COLUMN IF NOT EXISTS expense_limit NUMERIC,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Remove assigned_to if it exists (migrating to duty_assignments)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duties' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.duties DROP COLUMN assigned_to;
    END IF;
END $$;

-- 2. Create New Tables

-- DUTY ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.duty_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(duty_id, user_id)
);

-- DUTY RECEIPTS
CREATE TABLE IF NOT EXISTS public.duty_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  duty_assignment_id UUID REFERENCES public.duty_assignments(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  receipt_url TEXT,
  notes TEXT,
  status contribution_status DEFAULT 'pending',
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEDGER ENTRIES
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'reimbursement', 'contribution', 'deduction', 'adjustment'
  currency TEXT DEFAULT 'INR',
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS

ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- 4. Add Policies

-- DUTY ASSIGNMENTS
CREATE POLICY "View assignments" ON public.duty_assignments FOR SELECT USING (
  user_id = auth.uid() OR
  public.is_farewell_admin((SELECT farewell_id FROM public.duties WHERE id = duty_id))
);

CREATE POLICY "Manage assignments" ON public.duty_assignments FOR ALL USING (
  public.is_farewell_admin((SELECT farewell_id FROM public.duties WHERE id = duty_id))
);

-- DUTY RECEIPTS
CREATE POLICY "View receipts" ON public.duty_receipts FOR SELECT USING (
  uploader_id = auth.uid() OR
  public.is_farewell_admin((SELECT farewell_id FROM public.duties d JOIN public.duty_assignments da ON d.id = da.duty_id WHERE da.id = duty_assignment_id))
);

CREATE POLICY "Upload receipts" ON public.duty_receipts FOR INSERT WITH CHECK (
  uploader_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.duty_assignments WHERE id = duty_assignment_id AND user_id = auth.uid())
);

CREATE POLICY "Manage receipts" ON public.duty_receipts FOR ALL USING (
  public.is_farewell_admin((SELECT farewell_id FROM public.duties d JOIN public.duty_assignments da ON d.id = da.duty_id WHERE da.id = duty_assignment_id))
);

-- LEDGER ENTRIES
CREATE POLICY "View ledger" ON public.ledger_entries FOR SELECT USING (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

CREATE POLICY "Manage ledger" ON public.ledger_entries FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- 5. Create RPCs

-- Assign Duty
CREATE OR REPLACE FUNCTION public.assign_duty(
  _duty_id UUID,
  _user_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  _farewell_id UUID;
  _success_count INT := 0;
  _fail_count INT := 0;
  _uid UUID;
BEGIN
  -- Check admin permissions
  SELECT farewell_id INTO _farewell_id FROM public.duties WHERE id = _duty_id;
  IF NOT public.is_farewell_admin(_farewell_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOREACH _uid IN ARRAY _user_ids
  LOOP
    BEGIN
      INSERT INTO public.duty_assignments (duty_id, user_id)
      VALUES (_duty_id, _uid)
      ON CONFLICT (duty_id, user_id) DO NOTHING;
      _success_count := _success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      _fail_count := _fail_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('success', _success_count, 'failed', _fail_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve Duty Receipt
CREATE OR REPLACE FUNCTION public.approve_duty_receipt(_receipt_id UUID)
RETURNS JSONB AS $$
DECLARE
  _receipt RECORD;
  _duty RECORD;
  _assignment RECORD;
  _farewell_id UUID;
BEGIN
  -- Fetch receipt and related info
  SELECT * INTO _receipt FROM public.duty_receipts WHERE id = _receipt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt not found'; END IF;

  SELECT * INTO _assignment FROM public.duty_assignments WHERE id = _receipt.duty_assignment_id;
  SELECT * INTO _duty FROM public.duties WHERE id = _assignment.duty_id;
  _farewell_id := _duty.farewell_id;

  -- Check admin permissions
  IF NOT public.is_farewell_admin(_farewell_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check status
  IF _receipt.status = 'verified' THEN
    RETURN jsonb_build_object('status', 'already_approved');
  END IF;

  -- Update receipt status
  UPDATE public.duty_receipts
  SET status = 'verified',
      approved_at = NOW(),
      approved_by = auth.uid()
  WHERE id = _receipt_id;

  -- Create ledger entry
  INSERT INTO public.ledger_entries (
    farewell_id,
    user_id,
    amount,
    type,
    meta
  ) VALUES (
    _farewell_id,
    _receipt.uploader_id,
    _receipt.amount,
    'reimbursement',
    jsonb_build_object('receipt_id', _receipt_id, 'duty_id', _duty.id, 'title', _duty.title)
  );

  -- Update duty status (simple logic: if any receipt approved, in_progress. if all done... complex. keeping it simple for now)
  UPDATE public.duties SET status = 'in_progress' WHERE id = _duty.id AND status = 'pending';

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject Duty Receipt
CREATE OR REPLACE FUNCTION public.reject_duty_receipt(
  _receipt_id UUID,
  _reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  _receipt RECORD;
  _duty RECORD;
  _assignment RECORD;
  _farewell_id UUID;
BEGIN
  -- Fetch receipt and related info
  SELECT * INTO _receipt FROM public.duty_receipts WHERE id = _receipt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt not found'; END IF;

  SELECT * INTO _assignment FROM public.duty_assignments WHERE id = _receipt.duty_assignment_id;
  SELECT * INTO _duty FROM public.duties WHERE id = _assignment.duty_id;
  _farewell_id := _duty.farewell_id;

  -- Check admin permissions
  IF NOT public.is_farewell_admin(_farewell_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update receipt status
  UPDATE public.duty_receipts
  SET status = 'rejected',
      rejection_reason = _reason,
      rejected_at = NOW(),
      rejected_by = auth.uid()
  WHERE id = _receipt_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
