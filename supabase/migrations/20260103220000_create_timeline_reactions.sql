-- Create reactions table for timeline blocks (Hype)
CREATE TABLE IF NOT EXISTS public.timeline_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    block_id UUID NOT NULL REFERENCES public.timeline_blocks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('hype')) DEFAULT 'hype',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(block_id, user_id, type)
);

-- Enable RLS
ALTER TABLE public.timeline_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View timeline reactions" ON public.timeline_reactions
    FOR SELECT USING (TRUE);

CREATE POLICY "Add reaction" ON public.timeline_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Remove own reaction" ON public.timeline_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Realtime
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_reactions;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
