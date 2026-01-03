-- 1. Create a helper function to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_farewell_member(_farewell_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = _user_id
  );
END;
$$;

-- 2. Replace the recursive policy with the safe function
DROP POLICY IF EXISTS "members_farewell_read" ON public.farewell_members;

CREATE POLICY "members_farewell_read"
ON public.farewell_members FOR SELECT
USING (
    public.is_farewell_member(farewell_id, auth.uid())
);
