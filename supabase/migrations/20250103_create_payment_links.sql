-- Create payment_links table
create table if not exists public.payment_links (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  amount numeric not null,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  farewell_id uuid references public.farewells(id) on delete cascade,
  created_by uuid references auth.users(id),
  slug text, -- Optional custom slug for vanity URLs
  
  constraint payment_links_pkey primary key (id)
);

-- Enable RLS
alter table public.payment_links enable row level security;

-- Policies
create policy "Public can view active payment links"
  on public.payment_links
  for select
  using (status = 'active');

create policy "Admins can manage payment links"
  on public.payment_links
  for all
  using (
    exists (
      select 1 from public.farewell_members fr 
      where fr.user_id = auth.uid()
      and fr.farewell_id = payment_links.farewell_id
      and fr.role in ('admin', 'owner')
    )
  );
