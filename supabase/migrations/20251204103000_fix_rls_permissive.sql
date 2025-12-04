-- Fix RLS Policies to allow member uploads

-- Drop existing policies
DROP POLICY IF EXISTS "Manage templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Manage music" ON public.resource_music;
DROP POLICY IF EXISTS "Manage downloads" ON public.resource_downloads;

-- TEMPLATES
-- Allow any member to INSERT
CREATE POLICY "Insert templates" ON public.resource_templates 
  FOR INSERT WITH CHECK (
    public.is_farewell_member(farewell_id)
  );

-- Allow Admins or Owner to UPDATE/DELETE
CREATE POLICY "Update templates" ON public.resource_templates 
  FOR UPDATE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete templates" ON public.resource_templates 
  FOR DELETE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

-- MUSIC
CREATE POLICY "Insert music" ON public.resource_music 
  FOR INSERT WITH CHECK (
    public.is_farewell_member(farewell_id)
  );

CREATE POLICY "Update music" ON public.resource_music 
  FOR UPDATE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete music" ON public.resource_music 
  FOR DELETE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

-- DOWNLOADS
CREATE POLICY "Insert downloads" ON public.resource_downloads 
  FOR INSERT WITH CHECK (
    public.is_farewell_member(farewell_id)
  );

CREATE POLICY "Update downloads" ON public.resource_downloads 
  FOR UPDATE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete downloads" ON public.resource_downloads 
  FOR DELETE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );
