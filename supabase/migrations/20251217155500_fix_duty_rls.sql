-- Enable RLS
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_receipts ENABLE ROW LEVEL SECURITY;

-- DUTIES POLICIES
-- Everyone in the farewell can view duties
CREATE POLICY "Farewell members can view duties" 
ON public.duties FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only admins can insert/update/delete duties
CREATE POLICY "Admins can manage duties" 
ON public.duties FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- DUTY ASSIGNMENTS POLICIES
-- Everyone can view assignments (to see who is doing what)
CREATE POLICY "Farewell members can view assignments" 
ON public.duty_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_assignments.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- Admins can manage assignments (assign/unassign)
CREATE POLICY "Admins can manage assignments" 
ON public.duty_assignments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_assignments.duty_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Assigned users can update their own assignment (e.g. status)
CREATE POLICY "Assigned users can update own assignment" 
ON public.duty_assignments FOR UPDATE 
USING (
  user_id = auth.uid()
);

-- DUTY RECEIPTS POLICIES
-- Admins and uploaders can view receipts
CREATE POLICY "Admins and uploaders can view receipts" 
ON public.duty_receipts FOR SELECT 
USING (
  uploader_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_receipts.duty_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Assigned users can upload receipts
CREATE POLICY "Assigned users can upload receipts" 
ON public.duty_receipts FOR INSERT 
WITH CHECK (
  uploader_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.duty_assignments da
    WHERE da.duty_id = duty_receipts.duty_id
    AND da.user_id = auth.uid()
  )
);
