-- ==========================================
-- CONTRIBUTION SYSTEM UPDATE
-- ==========================================

-- 1. Update Contribution Status Enum
-- We need to drop the constraint if it exists or alter the type.
-- Since we can't easily alter enums in a transaction block sometimes, we'll handle it carefully.
-- For this script, we will assume we can just add values or recreate.
-- Safer approach: Rename old type, create new one, update columns, drop old type.

ALTER TYPE contribution_status RENAME TO contribution_status_old;
CREATE TYPE contribution_status AS ENUM (
  'pending',
  'awaiting_payment',
  'paid_pending_admin_verification',
  'verified',
  'approved',
  'rejected',
  'mismatch_error'
);

ALTER TABLE public.contributions ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.contributions 
  ALTER COLUMN status TYPE contribution_status 
  USING status::text::contribution_status;

ALTER TABLE public.contributions ALTER COLUMN status SET DEFAULT 'pending'::contribution_status;

DROP TYPE contribution_status_old;

-- 2. Create Farewell Financials Table
CREATE TABLE IF NOT EXISTS public.farewell_financials (
  farewell_id UUID PRIMARY KEY REFERENCES public.farewells(id) ON DELETE CASCADE,
  total_collected NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  contribution_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.farewell_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View financials" ON public.farewell_financials FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);

-- 3. Update Ledger Entries
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS audit_hash TEXT;
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id);

-- 4. Atomic Approval Function
CREATE OR REPLACE FUNCTION public.approve_contribution(
  _contribution_id UUID,
  _admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  _contribution RECORD;
  _farewell_id UUID;
  _amount NUMERIC;
  _user_id UUID;
  _ledger_id UUID;
  _new_balance NUMERIC;
BEGIN
  -- 1. Lock the contribution row
  SELECT * INTO _contribution 
  FROM public.contributions 
  WHERE id = _contribution_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contribution not found');
  END IF;

  IF _contribution.status = 'approved' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already approved');
  END IF;

  IF _contribution.status NOT IN ('verified', 'paid_pending_admin_verification') THEN
     RETURN jsonb_build_object('success', false, 'error', 'Contribution not in verifiable state');
  END IF;

  _farewell_id := _contribution.farewell_id;
  _amount := _contribution.amount;
  _user_id := _contribution.user_id;

  -- 2. Update Contribution Status
  UPDATE public.contributions
  SET 
    status = 'approved',
    verified_by = _admin_id
  WHERE id = _contribution_id;

  -- 3. Create Ledger Entry
  INSERT INTO public.ledger_entries (
    farewell_id,
    user_id,
    amount,
    type,
    approved_by,
    audit_hash,
    meta
  ) VALUES (
    _farewell_id,
    _user_id,
    _amount,
    'contribution',
    _admin_id,
    md5(CONCAT(_farewell_id, _user_id, _amount, NOW())), -- Simple hash for demo
    jsonb_build_object('contribution_id', _contribution_id, 'method', _contribution.method)
  ) RETURNING id INTO _ledger_id;

  -- 4. Update Financials
  INSERT INTO public.farewell_financials (farewell_id, total_collected, balance, contribution_count)
  VALUES (_farewell_id, _amount, _amount, 1)
  ON CONFLICT (farewell_id) DO UPDATE SET
    total_collected = farewell_financials.total_collected + EXCLUDED.total_collected,
    balance = farewell_financials.balance + EXCLUDED.balance,
    contribution_count = farewell_financials.contribution_count + 1,
    last_updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'ledger_id', _ledger_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
