-- Add Razorpay columns to contributions table
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Update the check constraint for method if it exists
-- Note: Supabase/Postgres doesn't support ALTER TYPE ... ADD VALUE inside a transaction block easily if it's an enum, 
-- but if it's a text column with a check constraint, we can drop and re-add it.
-- If it is an ENUM type:
-- ALTER TYPE contribution_method ADD VALUE IF NOT EXISTS 'razorpay';

-- If it is a check constraint:
ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_method_check;
ALTER TABLE contributions ADD CONSTRAINT contributions_method_check 
CHECK (method IN ('upi', 'cash', 'bank_transfer', 'stripe', 'razorpay'));
