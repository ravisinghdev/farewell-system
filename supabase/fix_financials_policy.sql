-- Fix RLS for farewell_financials table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewell_financials ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "View financials" ON public.farewell_financials;
DROP POLICY IF EXISTS "Manage financials" ON public.farewell_financials;

-- 3. Create View Policy (Members can view)
CREATE POLICY "View financials" ON public.farewell_financials FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);

-- 4. Create Manage Policy (Admins can manage - though usually managed by system triggers)
CREATE POLICY "Manage financials" ON public.farewell_financials FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- 5. Grant permissions just in case (though likely already granted)
GRANT ALL ON public.farewell_financials TO authenticated;
GRANT ALL ON public.farewell_financials TO service_role;
