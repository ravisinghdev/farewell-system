-- ULTIMATE PERMISSION FIX
-- This script explicitly GRANTS permissions and resets RLS.

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Grant Table Permissions (CRUD)
GRANT ALL ON TABLE public.resource_templates TO authenticated;
GRANT ALL ON TABLE public.resource_music TO authenticated;
GRANT ALL ON TABLE public.resource_downloads TO authenticated;

GRANT SELECT ON TABLE public.resource_templates TO anon;
GRANT SELECT ON TABLE public.resource_music TO anon;
GRANT SELECT ON TABLE public.resource_downloads TO anon;

-- 3. Grant Sequence Permissions (Important for INSERTs with auto-increment IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Reset RLS Policies (Just to be absolutely sure)
ALTER TABLE public.resource_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;

-- Drop existing
DROP POLICY IF EXISTS "view_templates_policy" ON public.resource_templates;
DROP POLICY IF EXISTS "insert_templates_policy" ON public.resource_templates;
DROP POLICY IF EXISTS "update_templates_policy" ON public.resource_templates;
DROP POLICY IF EXISTS "delete_templates_policy" ON public.resource_templates;

-- Re-create Permissive Policies
CREATE POLICY "view_templates_policy" ON public.resource_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_templates_policy" ON public.resource_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_templates_policy" ON public.resource_templates FOR UPDATE TO authenticated USING (true); -- Allow all authenticated to update for now
CREATE POLICY "delete_templates_policy" ON public.resource_templates FOR DELETE TO authenticated USING (true); -- Allow all authenticated to delete for now

-- Same for Music
DROP POLICY IF EXISTS "view_music_policy" ON public.resource_music;
DROP POLICY IF EXISTS "insert_music_policy" ON public.resource_music;
DROP POLICY IF EXISTS "update_music_policy" ON public.resource_music;
DROP POLICY IF EXISTS "delete_music_policy" ON public.resource_music;

CREATE POLICY "view_music_policy" ON public.resource_music FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_music_policy" ON public.resource_music FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_music_policy" ON public.resource_music FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_music_policy" ON public.resource_music FOR DELETE TO authenticated USING (true);

-- Same for Downloads
DROP POLICY IF EXISTS "view_downloads_policy" ON public.resource_downloads;
DROP POLICY IF EXISTS "insert_downloads_policy" ON public.resource_downloads;
DROP POLICY IF EXISTS "update_downloads_policy" ON public.resource_downloads;
DROP POLICY IF EXISTS "delete_downloads_policy" ON public.resource_downloads;

CREATE POLICY "view_downloads_policy" ON public.resource_downloads FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_downloads_policy" ON public.resource_downloads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_downloads_policy" ON public.resource_downloads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_downloads_policy" ON public.resource_downloads FOR DELETE TO authenticated USING (true);
