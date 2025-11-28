-- Fix Foreign Keys to point to public.users instead of auth.users
-- This is required to allow joining with the public.users table to fetch full_name and avatar_url

-- Fix letters table
ALTER TABLE public.letters
DROP CONSTRAINT IF EXISTS letters_sender_id_fkey,
DROP CONSTRAINT IF EXISTS letters_recipient_id_fkey;

-- If the constraints were named differently (e.g. auto-generated names that don't match), 
-- we might need to find them. But usually Postgres uses table_column_fkey.
-- Just in case, we drop by column name logic if possible? No, standard SQL requires name.
-- Let's assume standard naming or try to drop the constraints that reference auth.users.

-- Re-add constraints pointing to public.users
ALTER TABLE public.letters
ADD CONSTRAINT letters_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

ALTER TABLE public.letters
ADD CONSTRAINT letters_recipient_id_fkey
    FOREIGN KEY (recipient_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;

-- Fix feedback table
ALTER TABLE public.feedback
DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

ALTER TABLE public.feedback
ADD CONSTRAINT feedback_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;
