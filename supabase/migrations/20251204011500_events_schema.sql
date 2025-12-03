-- Enable RLS on all tables
-- farewell_event_details
create table if not exists farewell_event_details (
  id uuid default gen_random_uuid() primary key,
  farewell_id uuid references farewells(id) on delete cascade not null,
  event_date date,
  event_time time,
  venue text,
  agenda jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(farewell_id)
);

alter table farewell_event_details enable row level security;

drop policy if exists "Enable read access for all users" on farewell_event_details;
create policy "Enable read access for all users"
on farewell_event_details for select
using (true);

drop policy if exists "Enable insert/update for admins" on farewell_event_details;
create policy "Enable insert/update for admins"
on farewell_event_details for all
using (
  exists (
    select 1 from farewell_members
    where farewell_members.farewell_id = farewell_event_details.farewell_id
    and farewell_members.user_id = auth.uid()
    and farewell_members.role in ('admin', 'main_admin', 'parallel_admin')
  )
);

-- rehearsals
create table if not exists rehearsals (
  id uuid default gen_random_uuid() primary key,
  farewell_id uuid references farewells(id) on delete cascade not null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  venue text,
  notes text,
  created_at timestamptz default now()
);

alter table rehearsals enable row level security;

drop policy if exists "Enable read access for all users" on rehearsals;
create policy "Enable read access for all users"
on rehearsals for select
using (true);

drop policy if exists "Enable all access for admins" on rehearsals;
create policy "Enable all access for admins"
on rehearsals for all
using (
  exists (
    select 1 from farewell_members
    where farewell_members.farewell_id = rehearsals.farewell_id
    and farewell_members.user_id = auth.uid()
    and farewell_members.role in ('admin', 'main_admin', 'parallel_admin')
  )
);

-- performances
create table if not exists performances (
  id uuid default gen_random_uuid() primary key,
  farewell_id uuid references farewells(id) on delete cascade not null,
  title text not null,
  type text not null, -- Dance, Song, Skit, etc.
  performers text[], -- Array of names
  duration text,
  status text default 'proposed', -- proposed, approved, rejected
  created_at timestamptz default now()
);

alter table performances enable row level security;

drop policy if exists "Enable read access for all users" on performances;
create policy "Enable read access for all users"
on performances for select
using (true);

drop policy if exists "Enable insert for all users" on performances;
create policy "Enable insert for all users"
on performances for insert
with check (true);

drop policy if exists "Enable update/delete for admins" on performances;
create policy "Enable update/delete for admins"
on performances for all
using (
  exists (
    select 1 from farewell_members
    where farewell_members.farewell_id = performances.farewell_id
    and farewell_members.user_id = auth.uid()
    and farewell_members.role in ('admin', 'main_admin', 'parallel_admin')
  )
);

-- decor_items
create table if not exists decor_items (
  id uuid default gen_random_uuid() primary key,
  farewell_id uuid references farewells(id) on delete cascade not null,
  item_name text not null,
  category text not null, -- Stage, Entrance, Table, etc.
  quantity integer default 1,
  status text default 'planned', -- planned, purchased, arranged
  notes text,
  created_at timestamptz default now()
);

alter table decor_items enable row level security;

drop policy if exists "Enable read access for all users" on decor_items;
create policy "Enable read access for all users"
on decor_items for select
using (true);

drop policy if exists "Enable all access for admins" on decor_items;
create policy "Enable all access for admins"
on decor_items for all
using (
  exists (
    select 1 from farewell_members
    where farewell_members.farewell_id = decor_items.farewell_id
    and farewell_members.user_id = auth.uid()
    and farewell_members.role in ('admin', 'main_admin', 'parallel_admin')
  )
);

-- event_tasks
create table if not exists event_tasks (
  id uuid default gen_random_uuid() primary key,
  farewell_id uuid references farewells(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo', -- todo, in_progress, done
  priority text default 'medium', -- low, medium, high
  assigned_to uuid references users(id),
  due_date timestamptz,
  created_at timestamptz default now()
);

alter table event_tasks enable row level security;

drop policy if exists "Enable read access for all users" on event_tasks;
create policy "Enable read access for all users"
on event_tasks for select
using (true);

drop policy if exists "Enable all access for admins" on event_tasks;
create policy "Enable all access for admins"
on event_tasks for all
using (
  exists (
    select 1 from farewell_members
    where farewell_members.farewell_id = event_tasks.farewell_id
    and farewell_members.user_id = auth.uid()
    and farewell_members.role in ('admin', 'main_admin', 'parallel_admin')
  )
);

-- Enable Realtime
-- alter publication supabase_realtime add table farewell_event_details;
-- alter publication supabase_realtime add table rehearsals;
-- alter publication supabase_realtime add table performances;
-- alter publication supabase_realtime add table decor_items;
-- alter publication supabase_realtime add table event_tasks;
