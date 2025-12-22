-- Migration: Relax approve_contribution status check
-- Date: 2025-12-22
-- Description: Allows 'pending' and 'paid_pending_admin_verification' statuses to be directly approved.

CREATE OR REPLACE FUNCTION public.approve_contribution(
  _contribution_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _contribution RECORD;
  _farewell_id UUID;
  _amount NUMERIC;
  _user_id UUID;
  _admin_id UUID;
BEGIN
  _admin_id := auth.uid();

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

  -- RELAXED CHECK: Allow 'pending', 'verified', and the long Razorpay status
  IF _contribution.status NOT IN ('verified', 'paid_pending_admin_verification', 'pending') THEN
     RETURN jsonb_build_object('success', false, 'error', 'Contribution status ' || _contribution.status || ' gives no right to approve');
  END IF;

  _farewell_id := _contribution.farewell_id;
  _amount := _contribution.amount;
  _user_id := _contribution.user_id;

  -- 2. Verify Admin Permissions
  IF NOT public.is_farewell_admin(_farewell_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- 3. Update Contribution Status
  UPDATE public.contributions
  SET 
    status = 'approved',
    verified_by = _admin_id
  WHERE id = _contribution_id;

  -- 4. Create Ledger Entry
  INSERT INTO public.ledger (
    farewell_id,
    type,
    amount,
    category,
    reference_id,
    description,
    created_by
  ) VALUES (
    _farewell_id,
    'credit',
    _amount,
    'contribution',
    _contribution_id,
    'Contribution from ' || (SELECT full_name FROM public.users WHERE id = _user_id),
    _admin_id
  );

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
