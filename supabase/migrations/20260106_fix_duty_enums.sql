-- Add missing values to duty_status enum
DO $$
BEGIN
    ALTER TYPE public.duty_status ADD VALUE 'pending';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TYPE public.duty_status ADD VALUE 'in_progress';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
