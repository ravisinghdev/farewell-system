-- Add JSONB attendance column to rehearsal_sessions
-- This replaces the need for a complex separate table for simple check-ins.

ALTER TABLE public.rehearsal_sessions 
ADD COLUMN IF NOT EXISTS attendance JSONB DEFAULT '{}'::jsonb;

-- Add a column to snapshot participants (optional but good for history)
ALTER TABLE public.rehearsal_sessions 
ADD COLUMN IF NOT EXISTS participants_snapshot JSONB DEFAULT '[]'::jsonb;

-- Grant access to authenticated users (just to be safe, though existing policy covers it)
GRANT ALL ON TABLE public.rehearsal_sessions TO authenticated;
