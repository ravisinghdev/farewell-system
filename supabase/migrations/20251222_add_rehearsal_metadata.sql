-- Add metadata column to rehearsal_sessions for flexible storage (like pairings)
ALTER TABLE public.rehearsal_sessions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
