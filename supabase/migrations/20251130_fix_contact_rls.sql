-- Ensure the table exists
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admins to view" ON public.contact_messages;

-- Create Policy: Allow anyone (anon and authenticated) to insert
CREATE POLICY "Allow public insert" ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Create Policy: Allow authenticated users to view (simplification for now, or restrict to specific emails/roles if possible)
-- Since we don't have a global admin role, we'll allow authenticated users to view for now to ensure the admin panel works.
-- Ideally, this should be restricted to specific user IDs or claims.
CREATE POLICY "Allow authenticated view" ON public.contact_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
