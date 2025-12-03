-- Force permissions and RLS for Events tables

-- farewell_event_details
grant all on table farewell_event_details to authenticated;
grant select on table farewell_event_details to anon;
grant all on table farewell_event_details to service_role;

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
grant all on table rehearsals to authenticated;
grant select on table rehearsals to anon;
grant all on table rehearsals to service_role;

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
grant all on table performances to authenticated;
grant select on table performances to anon;
grant all on table performances to service_role;

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
grant all on table decor_items to authenticated;
grant select on table decor_items to anon;
grant all on table decor_items to service_role;

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
grant all on table event_tasks to authenticated;
grant select on table event_tasks to anon;
grant all on table event_tasks to service_role;

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
