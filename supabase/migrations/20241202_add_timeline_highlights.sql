-- Add 'main_admin' to farewell_role enum
ALTER TYPE farewell_role ADD VALUE IF NOT EXISTS 'main_admin';

-- Create timeline_events table
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  icon TEXT DEFAULT 'calendar',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create highlights table
CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Update is_farewell_admin function to include 'main_admin' if not already
CREATE OR REPLACE FUNCTION public.is_farewell_admin(_farewell_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'parallel_admin', 'main_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for timeline_events
CREATE POLICY "View timeline" ON public.timeline_events FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage timeline" ON public.timeline_events FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- Policies for highlights
CREATE POLICY "View highlights" ON public.highlights FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage highlights" ON public.highlights FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.highlights;
