-- 0. Create Helper Function to avoid recursion
create or replace function public.check_farewell_admin(lookup_farewell_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.farewell_members
    where farewell_id = lookup_farewell_id
    and user_id = auth.uid()
    and role in ('admin', 'main_admin', 'parallel_admin')
  );
end;
$$;

-- 1. Create payment_links table (If not exists, though usually handled by other migrations, this ensures structure)
create table if not exists public.payment_links (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  amount numeric not null,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  farewell_id uuid references public.farewells(id) on delete cascade,
  created_by uuid references auth.users(id),
  slug text,
  
  constraint payment_links_pkey primary key (id)
);

-- Enable RLS for payment_links
alter table public.payment_links enable row level security;

drop policy if exists "Public can view active payment links" on public.payment_links;
create policy "Public can view active payment links"
  on public.payment_links
  for select
  using (status = 'active');

drop policy if exists "Admins can manage payment links" on public.payment_links;
create policy "Admins can manage payment links"
  on public.payment_links
  for all
  using (
    public.check_farewell_admin(farewell_id)
  );

-- 2. Update contributions table for Payment Links
alter table public.contributions
add column if not exists payment_link_id uuid references public.payment_links(id);

create index if not exists idx_contributions_payment_link_id on public.contributions(payment_link_id);

-- 3. Update contributions table for Guest Payments
alter table public.contributions alter column user_id drop not null;
alter table public.contributions add column if not exists guest_name text;
alter table public.contributions add column if not exists guest_email text;

-- 4. Create payment_customers table
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

create unique index if not exists idx_payment_customers_email_farewell on public.payment_customers(email, farewell_id);

-- Enable RLS for customers
alter table public.payment_customers enable row level security;

drop policy if exists "Admins can view customers" on public.payment_customers;
create policy "Admins can view customers"
  on public.payment_customers
  for select
  using (
    public.check_farewell_admin(farewell_id)
  );

-- 6. GRANT PERMISSIONS
grant all on public.payment_links to postgres, service_role, authenticated;
grant select on public.payment_links to anon;

grant all on public.payment_customers to postgres, service_role, authenticated;

-- Grant execute on the helper function
grant execute on function public.check_farewell_admin(uuid) to authenticated, service_role, anon;

-- 5. Add Refunds support to contributions
alter table public.contributions 
add column if not exists refund_status text check (refund_status in ('none', 'partial', 'full')) default 'none',
add column if not exists refund_amount numeric default 0,
add column if not exists customer_id uuid references public.payment_customers(id);
