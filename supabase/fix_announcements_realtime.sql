-- ============================================
-- SIMPLE FIX: Enable Realtime for Announcements
-- ============================================
-- Run this in Supabase SQL Editor

-- Step 1: Check if announcements table exists
DO $$ 
BEGIN
    -- If announcements table doesn't exist, create it
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcements') THEN
        CREATE TABLE public.announcements (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_pinned BOOLEAN DEFAULT FALSE,
            created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "View announcements" ON public.announcements FOR SELECT 
        USING (public.is_farewell_member(farewell_id));
        
        CREATE POLICY "Create announcements" ON public.announcements FOR INSERT 
        WITH CHECK (created_by = auth.uid() AND public.is_farewell_admin(farewell_id));
        
        CREATE POLICY "Update announcements" ON public.announcements FOR UPDATE 
        USING (public.is_farewell_admin(farewell_id));
        
        CREATE POLICY "Delete announcements" ON public.announcements FOR DELETE 
        USING (public.is_farewell_admin(farewell_id));
        
        -- Create indexes
        CREATE INDEX idx_announcements_farewell_id ON public.announcements(farewell_id);
        CREATE INDEX idx_announcements_is_pinned ON public.announcements(is_pinned);
        CREATE INDEX idx_announcements_created_at ON public.announcements(created_at);
    END IF;

    -- If announcement_reactions table doesn't exist, create it
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcement_reactions') THEN
        CREATE TABLE public.announcement_reactions (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
            reaction_type TEXT CHECK (reaction_type IN ('like', 'bookmark')) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(announcement_id, user_id, reaction_type)
        );
        
        -- Enable RLS
        ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "View announcement reactions" ON public.announcement_reactions FOR SELECT 
        USING (public.is_farewell_member((SELECT farewell_id FROM public.announcements WHERE id = announcement_id)));
        
        CREATE POLICY "Manage own announcement reactions" ON public.announcement_reactions FOR ALL 
        USING (user_id = auth.uid());
        
        -- Create indexes
        CREATE INDEX idx_announcement_reactions_announcement_id ON public.announcement_reactions(announcement_id);
        CREATE INDEX idx_announcement_reactions_user_id ON public.announcement_reactions(user_id);
    END IF;
END $$;

-- Step 2: ENABLE REALTIME (This is the critical part!)
-- Remove tables from realtime first (in case they're already there)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.announcements;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.announcement_reactions;

-- Add tables to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reactions;

-- Step 3: Verify realtime is enabled
SELECT 
    schemaname, 
    tablename,
    'Realtime enabled ✅' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('announcements', 'announcement_reactions');
