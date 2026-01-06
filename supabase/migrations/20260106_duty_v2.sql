-- 1. Drop Task System
DROP TABLE IF EXISTS public.task_attachments CASCADE;
DROP TABLE IF EXISTS public.task_activity_log CASCADE;
DROP TABLE IF EXISTS public.task_comments CASCADE;
DROP TABLE IF EXISTS public.task_assignments CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TYPE IF EXISTS public.task_status CASCADE;
DROP TYPE IF EXISTS public.task_priority CASCADE;

-- 2. Update Duty Status Enum (Safe Add)
-- This block ensures we add values only if they don't exist
DO $$
BEGIN
    ALTER TYPE public.duty_status ADD VALUE 'pending_receipt';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TYPE public.duty_status ADD VALUE 'voting';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TYPE public.duty_status ADD VALUE 'admin_review';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TYPE public.duty_status ADD VALUE 'approved';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TYPE public.duty_status ADD VALUE 'rejected';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TYPE public.duty_status ADD VALUE 'completed';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Update Duties Table Structure
ALTER TABLE public.duties ADD COLUMN IF NOT EXISTS expense_type text DEFAULT 'none';
ALTER TABLE public.duties ADD COLUMN IF NOT EXISTS expected_amount numeric DEFAULT 0;
ALTER TABLE public.duties ADD COLUMN IF NOT EXISTS final_amount numeric DEFAULT 0;
ALTER TABLE public.duties ADD COLUMN IF NOT EXISTS deadline timestamptz;

-- 4. Create Receipts Table
CREATE TABLE IF NOT EXISTS public.duty_receipts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    duty_id uuid REFERENCES public.duties(id) ON DELETE CASCADE,
    uploader_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    image_url text NOT NULL,
    amount_paid numeric NOT NULL,
    payment_mode text CHECK (payment_mode IN ('upi', 'cash', 'online', 'card')),
    status text DEFAULT 'pending_vote' CHECK (status IN ('pending_vote', 'approved', 'rejected')),
    created_at timestamptz DEFAULT now()
);

-- 5. Create Votes Table
CREATE TABLE IF NOT EXISTS public.receipt_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    receipt_id uuid REFERENCES public.duty_receipts(id) ON DELETE CASCADE,
    voter_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    vote text CHECK (vote IN ('valid', 'invalid')),
    comment text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(receipt_id, voter_id)
);

-- 6. Enable RLS
ALTER TABLE public.duty_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_votes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON public.duty_receipts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for assigned users" ON public.duty_receipts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.receipt_votes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.receipt_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Refresh Cache
NOTIFY pgrst, 'reload config';
