-- Add member_id to resource tables for easier joining

-- 1. Add member_id column
ALTER TABLE public.resource_templates ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.farewell_members(id);
ALTER TABLE public.resource_music ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.farewell_members(id);
ALTER TABLE public.resource_downloads ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.farewell_members(id);

-- 2. Backfill member_id based on uploaded_by (user_id) and farewell_id
UPDATE public.resource_templates rt
SET member_id = fm.id
FROM public.farewell_members fm
WHERE rt.farewell_id = fm.farewell_id AND rt.uploaded_by = fm.user_id;

UPDATE public.resource_music rm
SET member_id = fm.id
FROM public.farewell_members fm
WHERE rm.farewell_id = fm.farewell_id AND rm.uploaded_by = fm.user_id;

UPDATE public.resource_downloads rd
SET member_id = fm.id
FROM public.farewell_members fm
WHERE rd.farewell_id = fm.farewell_id AND rd.uploaded_by = fm.user_id;

-- 3. Grant permissions on new column (implicitly covered by table grant, but good to be safe if RLS changes)
-- No specific column grant needed if table grant exists.
