-- Add manual_start_time to override automatic calculation
ALTER TABLE public.timeline_blocks
ADD COLUMN IF NOT EXISTS manual_start_time TIMESTAMPTZ;
