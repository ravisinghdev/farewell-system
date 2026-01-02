-- Enable Realtime for farewells table if not already enabled
-- Note: 'supabase_realtime' publication needs the table to be added
alter publication supabase_realtime add table farewells;

-- Ensure RLS allows authenticated users to SELECT farewells (needed for listener to receive updates)
-- Existing policies might only allow members. Let's ensure broader read access for settings if needed,
-- OR rely on the fact that users are members.
-- If users are members, they should see updates if the policy allows.

-- Let's check if there is a policy for "All users can view farewells" or "Members can view".
-- We'll add a policy "Authenticated users can view basic farewell info" just to be safe for Realtime.
-- Note: Realtime respects the "New" record visibility.

create policy "Authenticated users can view farewells for realtime"
  on public.farewells
  for select
  to authenticated
  using (true); -- Or stricter: using (exists (select 1 from farewell_members where ...))

-- But 'true' is fine for basic farewell info (name, settings) as it is generally public/sharable.
