-- Add metadata column to rehearsals table (used by current codebase)
ALTER TABLE public.rehearsals
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
