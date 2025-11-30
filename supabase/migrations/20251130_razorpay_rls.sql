-- Ensure Razorpay columns exist (idempotent)
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Ensure method constraint includes razorpay
ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_method_check;
ALTER TABLE contributions ADD CONSTRAINT contributions_method_check 
CHECK (method IN ('upi', 'cash', 'bank_transfer', 'stripe', 'razorpay'));

-- Enable RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own contributions
CREATE POLICY "Users can insert their own contributions" 
ON contributions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to view their own contributions
CREATE POLICY "Users can view their own contributions" 
ON contributions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy to allow admins to view all contributions (assuming admin check logic or just relying on service role for admin actions)
-- For now, we'll add a policy that allows reading if the user is an admin in the farewell_members table
-- Note: This might be complex to implement in pure SQL without a helper function, 
-- so we often rely on the application logic or service role for admin dashboards.
-- But for basic user access, the above policies are sufficient.
