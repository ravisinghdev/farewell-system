-- Enable RLS on audit_logs (ensure it is enabled)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create audit logs (for their own actions)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view their own audit logs (if needed)
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs
FOR SELECT
USING (user_id = auth.uid());

-- Allow admins to view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = audit_logs.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);
