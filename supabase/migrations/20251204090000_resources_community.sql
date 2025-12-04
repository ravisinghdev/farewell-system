-- RESOURCES: TEMPLATES
CREATE TABLE IF NOT EXISTS public.resource_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- RESOURCES: MUSIC LIBRARY
CREATE TABLE IF NOT EXISTS public.resource_music (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  duration TEXT, -- e.g. "3:45"
  file_url TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- RESOURCES: DOWNLOADS
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT, -- e.g. "2.4 MB"
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- COMMUNITY: SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'resolved', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.resource_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- POLICIES: TEMPLATES
CREATE POLICY "View templates" ON public.resource_templates FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage templates" ON public.resource_templates FOR ALL USING (public.is_farewell_admin(farewell_id));

-- POLICIES: MUSIC
CREATE POLICY "View music" ON public.resource_music FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage music" ON public.resource_music FOR ALL USING (public.is_farewell_admin(farewell_id));

-- POLICIES: DOWNLOADS
CREATE POLICY "View downloads" ON public.resource_downloads FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage downloads" ON public.resource_downloads FOR ALL USING (public.is_farewell_admin(farewell_id));

-- POLICIES: SUPPORT TICKETS
-- Users can view their own tickets, Admins can view all
CREATE POLICY "View tickets" ON public.support_tickets FOR SELECT USING (user_id = auth.uid() OR public.is_farewell_admin(farewell_id));
-- Users can create tickets
CREATE POLICY "Create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admins can update tickets (e.g. status)
CREATE POLICY "Update tickets" ON public.support_tickets FOR UPDATE USING (public.is_farewell_admin(farewell_id));

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_music;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_downloads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
