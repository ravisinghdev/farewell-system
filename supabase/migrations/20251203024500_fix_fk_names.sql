-- Explicitly name foreign key constraints to match PostgREST hints

-- 1. duty_assignments -> users
ALTER TABLE public.duty_assignments
DROP CONSTRAINT IF EXISTS duty_assignments_user_id_fkey;

ALTER TABLE public.duty_assignments
ADD CONSTRAINT duty_assignments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. duty_updates -> users
ALTER TABLE public.duty_updates
DROP CONSTRAINT IF EXISTS duty_updates_user_id_fkey;

ALTER TABLE public.duty_updates
ADD CONSTRAINT duty_updates_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
