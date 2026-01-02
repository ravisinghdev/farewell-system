-- Create payment_customers table
create table if not exists public.payment_customers (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  farewell_id uuid references public.farewells(id) on delete cascade,
  name text,
  email text,
  phone text,
  total_spent numeric default 0,
  last_payment_at timestamp with time zone,
  
  constraint payment_customers_pkey primary key (id)
);

-- Add unique constraint to avoid duplicates per farewell
create unique index if not exists idx_payment_customers_email_farewell on public.payment_customers(email, farewell_id);

-- Add refund columns to contributions
alter table public.contributions 
add column if not exists refund_status text check (refund_status in ('none', 'partial', 'full')) default 'none',
add column if not exists refund_amount numeric default 0,
add column if not exists customer_id uuid references public.payment_customers(id);

-- Enable RLS for customers
alter table public.payment_customers enable row level security;

create policy "Admins can view customers"
  on public.payment_customers
  for select
  using (
    exists (
      select 1 from public.farewell_members fr
      where fr.user_id = auth.uid()
      and fr.farewell_id = payment_customers.farewell_id
      and fr.role in ('admin', 'owner')
    )
  );
