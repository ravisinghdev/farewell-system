-- FIX: Ensure column exists and reload schema cache

-- 1. Ensure the Type exists
DO $$ BEGIN
    CREATE TYPE rehearsal_type AS ENUM ('dance', 'music', 'skit', 'anchor', 'general', 'technical', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure the Column exists (Safe Add)
DO $$ BEGIN
    ALTER TABLE public.rehearsals ADD COLUMN rehearsal_type rehearsal_type DEFAULT 'general';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 3. FORCE PostgREST Schema Cache Reload
NOTIFY pgrst, 'reload config';
