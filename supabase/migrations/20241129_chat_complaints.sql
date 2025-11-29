-- Create chat_complaints table
create table if not exists public.chat_complaints (
  id uuid not null default gen_random_uuid(),
  farewell_id uuid not null references farewells(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  primary key (id)
);

-- RLS
alter table public.chat_complaints enable row level security;

create policy "Users can view their own complaints"
on public.chat_complaints for select
using (auth.uid() = user_id);

create policy "Farewell admins can view complaints"
on public.chat_complaints for select
using (
  exists (
    select 1 from farewell_members fm
    where fm.farewell_id = chat_complaints.farewell_id
    and fm.user_id = auth.uid()
    and fm.role::text in ('main_admin', 'parallel_admin')
  )
);

create policy "Users can create complaints"
on public.chat_complaints for insert
with check (auth.uid() = user_id);

create policy "Admins can update complaints"
on public.chat_complaints for update
using (
  exists (
    select 1 from farewell_members fm
    where fm.farewell_id = chat_complaints.farewell_id
    and fm.user_id = auth.uid()
    and fm.role::text in ('main_admin', 'parallel_admin')
  )
);
