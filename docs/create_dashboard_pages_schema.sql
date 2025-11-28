-- Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Timeline Events Table
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    icon TEXT DEFAULT 'calendar', -- e.g., 'calendar', 'music', 'star'
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Highlights Table
CREATE TABLE IF NOT EXISTS public.highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Policies (Viewable by members, editable by admins)

-- Announcements Policies
CREATE POLICY "Announcements viewable by members" ON public.announcements
    FOR SELECT USING (
        farewell_id IN (SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Announcements editable by admins" ON public.announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members 
            WHERE farewell_id = announcements.farewell_id 
            AND user_id = auth.uid() 
            AND role::text IN ('admin', 'main_admin')
        )
    );

-- Timeline Policies
CREATE POLICY "Timeline viewable by members" ON public.timeline_events
    FOR SELECT USING (
        farewell_id IN (SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Timeline editable by admins" ON public.timeline_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members 
            WHERE farewell_id = timeline_events.farewell_id 
            AND user_id = auth.uid() 
            AND role::text IN ('admin', 'main_admin')
        )
    );

-- Highlights Policies
CREATE POLICY "Highlights viewable by members" ON public.highlights
    FOR SELECT USING (
        farewell_id IN (SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Highlights editable by admins" ON public.highlights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members 
            WHERE farewell_id = highlights.farewell_id 
            AND user_id = auth.uid() 
            AND role::text IN ('admin', 'main_admin')
        )
    );

-- Grant permissions
GRANT ALL ON public.announcements TO authenticated;
GRANT ALL ON public.timeline_events TO authenticated;
GRANT ALL ON public.highlights TO authenticated;
GRANT ALL ON public.announcements TO service_role;
GRANT ALL ON public.timeline_events TO service_role;
GRANT ALL ON public.highlights TO service_role;
