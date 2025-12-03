-- Add video_url to performances
alter table performances add column if not exists video_url text;

-- Create performance_votes table
create table if not exists performance_votes (
  id uuid default gen_random_uuid() primary key,
  performance_id uuid references performances(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(performance_id, user_id)
);

-- Enable RLS on performance_votes
alter table performance_votes enable row level security;

create policy "Enable read access for all users"
on performance_votes for select
using (true);

create policy "Enable insert for authenticated users"
on performance_votes for insert
with check (auth.uid() = user_id);

create policy "Enable delete for own votes"
on performance_votes for delete
using (auth.uid() = user_id);

-- Create storage bucket for performance videos
insert into storage.buckets (id, name, public)
values ('performance_videos', 'performance_videos', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Give public access to performance videos"
on storage.objects for select
using ( bucket_id = 'performance_videos' );

create policy "Enable upload for authenticated users"
on storage.objects for insert
with check (
  bucket_id = 'performance_videos'
  and auth.role() = 'authenticated'
);

create policy "Enable update for own videos"
on storage.objects for update
using (
  bucket_id = 'performance_videos'
  and auth.uid() = owner
);

create policy "Enable delete for own videos"
on storage.objects for delete
using (
  bucket_id = 'performance_videos'
  and auth.uid() = owner
);

-- Enable Realtime for votes
alter publication supabase_realtime add table performance_votes;
