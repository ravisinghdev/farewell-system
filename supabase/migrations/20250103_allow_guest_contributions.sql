-- Make user_id nullable for guest payments
alter table public.contributions alter column user_id drop not null;

-- Add guest details
alter table public.contributions add column if not exists guest_name text;
alter table public.contributions add column if not exists guest_email text;
