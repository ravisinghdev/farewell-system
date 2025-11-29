-- Allow admins to view all complaints in their farewell
create policy "Admins can view all complaints"
on "public"."chat_complaints"
for select
to authenticated
using (
  exists (
    select 1 from farewell_members
    where farewell_members.farewell_id = chat_complaints.farewell_id
    and farewell_members.user_id = auth.uid()
    and farewell_members.role::text in ('admin', 'main_admin', 'parallel_admin')
  )
);

-- Allow admins to view pending channels (groups) in their farewell
create policy "Admins can view pending channels"
on "public"."chat_channels"
for select
to authenticated
using (
  exists (
    select 1 from farewell_members
    where farewell_members.farewell_id = chat_channels.scope_id
    and farewell_members.user_id = auth.uid()
    and farewell_members.role::text in ('admin', 'main_admin', 'parallel_admin')
  )
);
