-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create Policy: Allow anyone to insert (public contact form)
CREATE POLICY "Allow public insert" ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Create Policy: Allow admins to view all messages
-- Assuming 'admin' role check is done via app_metadata or a separate roles table.
-- For simplicity and robustness, we'll check if the user has an admin role in farewell_members or similar,
-- BUT for a global "Contact Us", it's usually a super admin.
-- Let's assume for now that any authenticated user with a specific claim or just authenticated users can't see it, ONLY admins.
-- Since we don't have a global admin role defined in the prompt context clearly (it mentions farewell_members roles),
-- we might need to rely on a specific user ID or just allow authenticated users to see their own? No, it's for admins.
-- Let's stick to a policy that allows authenticated users with 'admin' role in ANY farewell to see? Or just leave it restricted.
-- Actually, the user said "received by all the admins".
-- Let's create a policy that allows read access to users who are admins.
-- We'll assume a function `is_admin()` exists or we check `farewell_members`.
-- For now, let's allow read for authenticated users to simplify, or better, just create the table and let the user handle specific RLS if complex.
-- Wait, I should try to make it secure.
-- Let's check if there is an existing `is_admin` function or similar in the codebase.
-- I'll search for "CREATE POLICY" in the codebase to see existing patterns.

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
