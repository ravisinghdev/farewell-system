-- Add location column to timeline_events
ALTER TABLE public.timeline_events ADD COLUMN IF NOT EXISTS location TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
