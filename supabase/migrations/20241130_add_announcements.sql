-- Add Announcements and Announcement Reactions Tables
-- This migration adds support for announcements with reactions (likes, bookmarks)

-- ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANNOUNCEMENT REACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.announcement_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'bookmark')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id, reaction_type)
);

-- ENABLE RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;

-- ANNOUNCEMENTS RLS POLICIES
CREATE POLICY "View announcements" ON public.announcements FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);

CREATE POLICY "Create announcements" ON public.announcements FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  public.is_farewell_admin(farewell_id)
);

CREATE POLICY "Update announcements" ON public.announcements FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);

CREATE POLICY "Delete announcements" ON public.announcements FOR DELETE USING (
  public.is_farewell_admin(farewell_id)
);

-- ANNOUNCEMENT REACTIONS RLS POLICIES
CREATE POLICY "View announcement reactions" ON public.announcement_reactions FOR SELECT USING (
  public.is_farewell_member((SELECT farewell_id FROM public.announcements WHERE id = announcement_id))
);

CREATE POLICY "Manage own announcement reactions" ON public.announcement_reactions FOR ALL USING (
  user_id = auth.uid()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_announcements_farewell_id ON public.announcements(farewell_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON public.announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_announcement_id ON public.announcement_reactions(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_user_id ON public.announcement_reactions(user_id);

-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reactions;
