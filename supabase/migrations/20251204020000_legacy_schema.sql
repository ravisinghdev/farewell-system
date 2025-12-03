-- LEGACY QUOTES
CREATE TABLE IF NOT EXISTS public.legacy_quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEGACY VIDEOS
CREATE TABLE IF NOT EXISTS public.legacy_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_main BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEGACY GIFTS
CREATE TABLE IF NOT EXISTS public.legacy_gifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  gift_type TEXT NOT NULL, -- e.g., 'gift_box', 'flower', 'trophy'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEGACY THANK YOU NOTES
CREATE TABLE IF NOT EXISTS public.legacy_thank_you_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_name TEXT, -- e.g., "Teachers", "Organizers", or specific name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.legacy_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_thank_you_notes ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- QUOTES
CREATE POLICY "View quotes" ON public.legacy_quotes FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Create quotes" ON public.legacy_quotes FOR INSERT WITH CHECK (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage quotes" ON public.legacy_quotes FOR ALL USING (submitted_by = auth.uid() OR public.is_farewell_admin(farewell_id));

-- VIDEOS
CREATE POLICY "View videos" ON public.legacy_videos FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Create videos" ON public.legacy_videos FOR INSERT WITH CHECK (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage videos" ON public.legacy_videos FOR ALL USING (uploaded_by = auth.uid() OR public.is_farewell_admin(farewell_id));

-- GIFTS
CREATE POLICY "View gifts" ON public.legacy_gifts FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Create gifts" ON public.legacy_gifts FOR INSERT WITH CHECK (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage gifts" ON public.legacy_gifts FOR ALL USING (sender_id = auth.uid() OR public.is_farewell_admin(farewell_id));

-- THANK YOU NOTES
CREATE POLICY "View notes" ON public.legacy_thank_you_notes FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Create notes" ON public.legacy_thank_you_notes FOR INSERT WITH CHECK (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage notes" ON public.legacy_thank_you_notes FOR ALL USING (author_id = auth.uid() OR public.is_farewell_admin(farewell_id));

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.legacy_quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legacy_videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legacy_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legacy_thank_you_notes;
