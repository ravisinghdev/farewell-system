-- Ensure the Foreign Key Constraint exists on receipt_votes.receipt_id
DO $$
BEGIN
    -- Check if the constraint exists by name (Postgres default naming convention or explicit)
    -- Typically: receipt_votes_receipt_id_fkey
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'receipt_votes_receipt_id_fkey'
    ) THEN
        -- If fetching the FK info failed before, it's safer to try adding it.
        -- We won't drop the column, just alter it to ensure reference.
        -- But ALTER TABLE ... ADD CONSTRAINT is the standard way.
        ALTER TABLE public.receipt_votes
        ADD CONSTRAINT receipt_votes_receipt_id_fkey
        FOREIGN KEY (receipt_id)
        REFERENCES public.duty_receipts(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Force reload schema cache
NOTIFY pgrst, 'reload config';
