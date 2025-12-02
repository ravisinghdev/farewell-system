-- Create highlights bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('highlights', 'highlights', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects if not already (standard practice)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- Commented out to avoid permission errors if already enabled

-- Policy: Public can view highlights
DROP POLICY IF EXISTS "Public can view highlights" ON storage.objects;
CREATE POLICY "Public can view highlights"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'highlights');

-- Policy: Authenticated users can upload highlights
-- (We rely on frontend/backend logic to ensure only admins trigger this)
DROP POLICY IF EXISTS "Authenticated users can upload highlights" ON storage.objects;
CREATE POLICY "Authenticated users can upload highlights"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'highlights');

-- Policy: Users can update/delete their own uploads
DROP POLICY IF EXISTS "Users can manage own highlights" ON storage.objects;
CREATE POLICY "Users can manage own highlights"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'highlights' AND auth.uid() = owner);
