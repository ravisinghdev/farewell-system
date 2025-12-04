-- Fix RLS Policies FINAL (Direct Subqueries)

-- Drop existing policies
DROP POLICY IF EXISTS "Insert templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Update templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Delete templates" ON public.resource_templates;

DROP POLICY IF EXISTS "Insert music" ON public.resource_music;
DROP POLICY IF EXISTS "Update music" ON public.resource_music;
DROP POLICY IF EXISTS "Delete music" ON public.resource_music;

DROP POLICY IF EXISTS "Insert downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Update downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Delete downloads" ON public.resource_downloads;

-- TEMPLATES
-- Allow any member to INSERT
CREATE POLICY "Insert templates" ON public.resource_templates 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid()
    )
  );

-- Allow Admins or Owner to UPDATE
CREATE POLICY "Update templates" ON public.resource_templates 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

-- Allow Admins or Owner to DELETE
CREATE POLICY "Delete templates" ON public.resource_templates 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

-- MUSIC
CREATE POLICY "Insert music" ON public.resource_music 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Update music" ON public.resource_music 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete music" ON public.resource_music 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

-- DOWNLOADS
CREATE POLICY "Insert downloads" ON public.resource_downloads 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Update downloads" ON public.resource_downloads 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete downloads" ON public.resource_downloads 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );
