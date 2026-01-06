-- Safely add 'vote' column if it is missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'receipt_votes' 
        AND column_name = 'vote'
    ) THEN
        ALTER TABLE public.receipt_votes 
        ADD COLUMN vote text CHECK (vote IN ('valid', 'invalid'));
    END IF;
END $$;

-- Reload cache to be sure
NOTIFY pgrst, 'reload config';
