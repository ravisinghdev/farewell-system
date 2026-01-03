-- Create a table to track "Gateway Sessions" or Orders
create table public.payment_orders (
  id uuid default gen_random_uuid() primary key,
  farewell_id uuid references public.farewells(id) not null,
  user_id uuid references auth.users(id), -- Nullable for guest checkout if needed later
  amount decimal(10,2) not null,
  currency text default 'INR',
  status text default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  gateway_provider text default 'internal', -- 'internal', 'razorpay', etc.
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.payment_orders enable row level security;

-- Policies
create policy "Users can view their own orders"
  on public.payment_orders for select
  using (auth.uid() = user_id);

create policy "Users can create their own orders"
  on public.payment_orders for insert
  with check (auth.uid() = user_id);

-- Grant permissions
grant all on public.payment_orders to authenticated;
grant select on public.payment_orders to anon;
