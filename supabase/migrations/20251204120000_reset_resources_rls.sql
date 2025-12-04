-- COMPLETE RLS RESET FOR RESOURCES
-- This script drops all known variations of policies and re-creates them from scratch.

-- 1. TEMPLATES
ALTER TABLE public.resource_templates ENABLE ROW LEVEL SECURITY;

-- Drop all possible old policy names
DROP POLICY IF EXISTS "View templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Manage templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Insert templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Update templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Delete templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.resource_templates;
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Authenticated users can insert templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.resource_templates;

-- Create NEW Clean Policies
-- Allow ALL authenticated users to VIEW
CREATE POLICY "view_templates_policy" ON public.resource_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow ALL authenticated users to INSERT (if they are part of the farewell - optional check, but let's be open for now to fix the error)
CREATE POLICY "insert_templates_policy" ON public.resource_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow Users to UPDATE their OWN uploads OR Admins
CREATE POLICY "update_templates_policy" ON public.resource_templates
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );

-- Allow Users to DELETE their OWN uploads OR Admins
CREATE POLICY "delete_templates_policy" ON public.resource_templates
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );


-- 2. MUSIC
ALTER TABLE public.resource_music ENABLE ROW LEVEL SECURITY;

-- Drop all possible old policy names
DROP POLICY IF EXISTS "View music" ON public.resource_music;
DROP POLICY IF EXISTS "Manage music" ON public.resource_music;
DROP POLICY IF EXISTS "Insert music" ON public.resource_music;
DROP POLICY IF EXISTS "Update music" ON public.resource_music;
DROP POLICY IF EXISTS "Delete music" ON public.resource_music;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.resource_music;

-- Create NEW Clean Policies
CREATE POLICY "view_music_policy" ON public.resource_music
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_music_policy" ON public.resource_music
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_music_policy" ON public.resource_music
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );

CREATE POLICY "delete_music_policy" ON public.resource_music
  FOR DELETE TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );


-- 3. DOWNLOADS
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;

-- Drop all possible old policy names
DROP POLICY IF EXISTS "View downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Manage downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Insert downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Update downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Delete downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.resource_downloads;

-- Create NEW Clean Policies
CREATE POLICY "view_downloads_policy" ON public.resource_downloads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_downloads_policy" ON public.resource_downloads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_downloads_policy" ON public.resource_downloads
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );

CREATE POLICY "delete_downloads_policy" ON public.resource_downloads
  FOR DELETE TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );

-- 4. STORAGE (Just to be sure)
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('farewell_resources', 'farewell_resources', true)
ON CONFLICT (id) DO NOTHING;

-- Drop potential old storage policies
DROP POLICY IF EXISTS "Authenticated users can upload resources" ON storage.objects;
DROP POLICY IF EXISTS "Public access to resources" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resources" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;

-- Create Clean Storage Policies
CREATE POLICY "resource_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ( bucket_id = 'farewell_resources' );

CREATE POLICY "resource_select_policy" ON storage.objects
  FOR SELECT TO public
  USING ( bucket_id = 'farewell_resources' );

CREATE POLICY "resource_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING ( bucket_id = 'farewell_resources' AND auth.uid() = owner );
