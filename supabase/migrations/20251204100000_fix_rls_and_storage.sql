-- Fix RLS Policies for Resources

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "View templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Manage templates" ON public.resource_templates;
DROP POLICY IF EXISTS "View music" ON public.resource_music;
DROP POLICY IF EXISTS "Manage music" ON public.resource_music;
DROP POLICY IF EXISTS "View downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Manage downloads" ON public.resource_downloads;

-- Re-create Policies with proper permissions

-- TEMPLATES
CREATE POLICY "View templates" ON public.resource_templates 
  FOR SELECT USING (true); -- Allow all authenticated users to view

CREATE POLICY "Manage templates" ON public.resource_templates 
  FOR ALL USING (
    public.is_farewell_admin(farewell_id) OR 
    (select role from public.farewell_members where farewell_id = resource_templates.farewell_id and user_id = auth.uid()) in ('admin', 'main_admin', 'parallel_admin')
  );

-- MUSIC
CREATE POLICY "View music" ON public.resource_music 
  FOR SELECT USING (true);

CREATE POLICY "Manage music" ON public.resource_music 
  FOR ALL USING (
    public.is_farewell_admin(farewell_id) OR 
    (select role from public.farewell_members where farewell_id = resource_music.farewell_id and user_id = auth.uid()) in ('admin', 'main_admin', 'parallel_admin')
  );

-- DOWNLOADS
CREATE POLICY "View downloads" ON public.resource_downloads 
  FOR SELECT USING (true);

CREATE POLICY "Manage downloads" ON public.resource_downloads 
  FOR ALL USING (
    public.is_farewell_admin(farewell_id) OR 
    (select role from public.farewell_members where farewell_id = resource_downloads.farewell_id and user_id = auth.uid()) in ('admin', 'main_admin', 'parallel_admin')
  );


-- STORAGE SETUP
-- Create a new bucket for resources if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('farewell_resources', 'farewell_resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'farewell_resources' );

-- Allow public access to view resources (since the bucket is public)
CREATE POLICY "Public access to resources"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'farewell_resources' );

-- Allow admins (or uploader) to delete
CREATE POLICY "Users can delete their own resources"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'farewell_resources' AND auth.uid() = owner );
