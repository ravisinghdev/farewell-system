-- Fix "null value in column rehearsal_id" error
-- It seems 'rehearsal_sessions' has a column 'rehearsal_id' that shouldn't be there (or should be nullable).
-- We make it nullable to allow inserts that don't provide it.

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rehearsal_sessions' AND column_name='rehearsal_id') THEN
        -- Try to drop NOT NULL constraint
        ALTER TABLE public.rehearsal_sessions ALTER COLUMN rehearsal_id DROP NOT NULL;
    END IF;
END $$;
