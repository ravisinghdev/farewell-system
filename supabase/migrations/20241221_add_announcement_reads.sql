-- Create a table to track which users have read which announcements
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, announcement_id)
);

-- Enable RLS
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own read status
CREATE POLICY "Users can mark announcements as read" 
ON public.announcement_reads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own read status
CREATE POLICY "Users can view their own read status" 
ON public.announcement_reads FOR SELECT 
USING (auth.uid() = user_id);

-- Notify schema reload
NOTIFY pgrst, 'reload config';
