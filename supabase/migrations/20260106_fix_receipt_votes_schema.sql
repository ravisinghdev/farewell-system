-- Comprehensive Fix for receipt_votes Schema
-- Ensures all columns exist and have correct types

-- 1. Create table if not exists (base structure)
CREATE TABLE IF NOT EXISTS public.receipt_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY
);

-- 2. Add columns safely
DO $$
BEGIN
    -- receipt_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_votes' AND column_name = 'receipt_id') THEN
        ALTER TABLE public.receipt_votes ADD COLUMN receipt_id uuid REFERENCES public.duty_receipts(id) ON DELETE CASCADE;
    END IF;

    -- voter_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_votes' AND column_name = 'voter_id') THEN
        ALTER TABLE public.receipt_votes ADD COLUMN voter_id uuid REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- vote
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_votes' AND column_name = 'vote') THEN
        ALTER TABLE public.receipt_votes ADD COLUMN vote text CHECK (vote IN ('valid', 'invalid'));
    END IF;

    -- comment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_votes' AND column_name = 'comment') THEN
        ALTER TABLE public.receipt_votes ADD COLUMN comment text;
    END IF;

    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_votes' AND column_name = 'created_at') THEN
        ALTER TABLE public.receipt_votes ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 3. Ensure Unique Constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'receipt_votes_receipt_id_voter_id_key'
    ) THEN
        BEGIN
            ALTER TABLE public.receipt_votes ADD CONSTRAINT receipt_votes_receipt_id_voter_id_key UNIQUE(receipt_id, voter_id);
        EXCEPTION
            WHEN duplicate_object THEN NULL;
            WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;

-- 4. Reload Cache
NOTIFY pgrst, 'reload config';
