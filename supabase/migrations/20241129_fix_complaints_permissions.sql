-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);
