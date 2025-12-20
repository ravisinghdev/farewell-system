-- Manually fixing the missing FK for duty_receipts
-- Run this in your Supabase SQL Editor

ALTER TABLE duty_receipts
DROP CONSTRAINT IF EXISTS duty_receipts_uploader_id_fkey;

ALTER TABLE duty_receipts
ADD CONSTRAINT duty_receipts_uploader_id_fkey
FOREIGN KEY (uploader_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Reload schema cache to ensure PostgREST picks it up
NOTIFY pgrst, 'reload config';
