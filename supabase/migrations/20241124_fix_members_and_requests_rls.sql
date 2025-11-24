-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;
