-- Fix missing foreign key for duty_receipts.uploader_id
-- Error: "Searched for a foreign key relationship between 'duty_receipts' and 'users' using the hint 'uploader_id'..."

DO $$ 
BEGIN
    -- Check if constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'duty_receipts_uploader_id_fkey'
    ) THEN
        ALTER TABLE duty_receipts
        ADD CONSTRAINT duty_receipts_uploader_id_fkey
        FOREIGN KEY (uploader_id)
        REFERENCES users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Force schema cache reload just in case
NOTIFY pgrst, 'reload config';
