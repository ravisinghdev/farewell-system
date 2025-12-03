-- Fix RLS policies for duties table

-- Enable RLS (just in case)
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (if any exist with these names)
DROP POLICY IF EXISTS "Admins can create duties" ON public.duties;
DROP POLICY IF EXISTS "Admins can update duties" ON public.duties;
DROP POLICY IF EXISTS "Everyone can view duties" ON public.duties;
DROP POLICY IF EXISTS "Assignees can update their duties" ON public.duties;

-- Policy: Everyone in the farewell can view duties
CREATE POLICY "Everyone can view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Policy: Admins can create duties
CREATE POLICY "Admins can create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  )
);

-- Policy: Admins can update duties
CREATE POLICY "Admins can update duties" ON public.duties
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  )
);

-- Policy: Assignees can update their duties
CREATE POLICY "Assignees can update their duties" ON public.duties
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.duty_assignments da
    WHERE da.duty_id = duties.id
    AND da.user_id = auth.uid()
  )
);

-- Grant permissions to authenticated users
GRANT ALL ON public.duties TO authenticated;
GRANT ALL ON public.duty_assignments TO authenticated;
GRANT ALL ON public.duty_receipts TO authenticated;

-- Fix RLS policies for duty_assignments table
ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage duty assignments" ON public.duty_assignments;
DROP POLICY IF EXISTS "Users can view their assignments" ON public.duty_assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON public.duty_assignments;

-- Policy: Admins can manage (insert, update, delete) duty assignments
CREATE POLICY "Admins can manage duty assignments" ON public.duty_assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_assignments.duty_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  )
);

-- Policy: Users can view their own assignments (or all in farewell if we want transparency, but let's stick to own + admins for now, or actually everyone in farewell usually needs to see who is doing what)
-- Let's allow everyone in the farewell to view assignments for transparency
CREATE POLICY "Everyone can view duty assignments" ON public.duty_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_assignments.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- Policy: Users can update their own assignments (e.g. status)
CREATE POLICY "Users can update their assignments" ON public.duty_assignments
FOR UPDATE USING (
  user_id = auth.uid()
);
