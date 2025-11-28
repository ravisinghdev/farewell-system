-- ==========================================
-- DANGER ZONE: RESET DATABASE
-- ==========================================
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TYPE DEFINITIONS
-- ==========================================
CREATE TYPE user_status AS ENUM ('online', 'offline', 'away', 'busy');
CREATE TYPE farewell_status AS ENUM ('active', 'archived');
CREATE TYPE farewell_role AS ENUM ('admin', 'student', 'guest');
CREATE TYPE join_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE channel_type AS ENUM ('dm', 'group', 'farewell', 'class');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE member_status AS ENUM ('active', 'muted', 'blocked', 'left', 'pending');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');
CREATE TYPE contribution_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE media_type AS ENUM ('image', 'video');
CREATE TYPE duty_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE notif_type AS ENUM ('message', 'mention', 'system', 'request', 'finance', 'duty');

-- ==========================================
-- 2. TABLE DEFINITIONS (No Policies yet)
-- ==========================================

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  status user_status DEFAULT 'offline',
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  public_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAREWELLS
CREATE TABLE IF NOT EXISTS public.farewells (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  section TEXT,
  date TIMESTAMPTZ,
  code TEXT UNIQUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  status farewell_status DEFAULT 'active',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAREWELL MEMBERS
CREATE TABLE IF NOT EXISTS public.farewell_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role farewell_role DEFAULT 'student',
  status join_status DEFAULT 'approved',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farewell_id, user_id)
);

-- FAREWELL JOIN REQUESTS
CREATE TABLE IF NOT EXISTS public.farewell_join_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status join_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farewell_id, user_id)
);

-- CHAT CHANNELS
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type channel_type NOT NULL DEFAULT 'dm',
  scope_id UUID,
  name TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES public.users(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT MEMBERS
CREATE TABLE IF NOT EXISTS public.chat_members (
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  status member_status DEFAULT 'active',
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT,
  type message_type DEFAULT 'text',
  file_url TEXT,
  reply_to_id UUID REFERENCES public.chat_messages(id),
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT REACTIONS
CREATE TABLE IF NOT EXISTS public.chat_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- CONTRIBUTIONS
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  transaction_id TEXT,
  screenshot_url TEXT,
  status contribution_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_by UUID REFERENCES public.users(id),
  category TEXT,
  receipt_url TEXT,
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALBUMS
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEDIA
CREATE TABLE IF NOT EXISTS public.media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type media_type NOT NULL,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SONG REQUESTS
CREATE TABLE IF NOT EXISTS public.song_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  artist TEXT,
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DUTIES
CREATE TABLE IF NOT EXISTS public.duties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status duty_status DEFAULT 'pending',
  assigned_to UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type notif_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POLLS
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POLL OPTIONS
CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL
);

-- POLL VOTES
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- TICKETS
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ticket_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  qr_code_url TEXT,
  is_scanned BOOLEAN DEFAULT FALSE,
  scanned_at TIMESTAMPTZ,
  scanned_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farewell_id, user_id)
);

-- CONFESSIONS
CREATE TABLE IF NOT EXISTS public.confessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. ENABLE RLS
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_farewell_member(_farewell_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_farewell_admin(_farewell_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_chat_member(_channel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE channel_id = _channel_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_chat_admin(_channel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE channel_id = _channel_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. RLS POLICIES (Updated to use functions)
-- ==========================================

-- USERS
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- FAREWELLS
CREATE POLICY "View farewells" ON public.farewells FOR SELECT USING (
  status = 'active' OR
  created_by = auth.uid() OR
  public.is_farewell_member(id)
);
CREATE POLICY "Create farewells" ON public.farewells FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Update farewells" ON public.farewells FOR UPDATE USING (created_by = auth.uid() OR public.is_farewell_admin(id));
CREATE POLICY "Delete farewells" ON public.farewells FOR DELETE USING (created_by = auth.uid());

-- FAREWELL MEMBERS
CREATE POLICY "View farewell members" ON public.farewell_members FOR SELECT USING (
  user_id = auth.uid() OR
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert farewell members" ON public.farewell_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id) OR
  EXISTS (SELECT 1 FROM public.farewells f WHERE f.id = farewell_id AND f.created_by = auth.uid())
);
CREATE POLICY "Update farewell members" ON public.farewell_members FOR UPDATE USING (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete farewell members" ON public.farewell_members FOR DELETE USING (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

-- FAREWELL JOIN REQUESTS
CREATE POLICY "View own requests" ON public.farewell_join_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view requests" ON public.farewell_join_requests FOR SELECT USING (public.is_farewell_admin(farewell_id));
CREATE POLICY "Create request" ON public.farewell_join_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update request" ON public.farewell_join_requests FOR UPDATE USING (public.is_farewell_admin(farewell_id));

-- CHAT CHANNELS
CREATE POLICY "View channels" ON public.chat_channels FOR SELECT USING (
  public.is_chat_member(id)
);
CREATE POLICY "Create channels" ON public.chat_channels FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Update channels" ON public.chat_channels FOR UPDATE USING (
  public.is_chat_admin(id)
);
CREATE POLICY "Delete channels" ON public.chat_channels FOR DELETE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.chat_members WHERE channel_id = id AND user_id = auth.uid() AND role = 'owner')
);

-- CHAT MEMBERS
CREATE POLICY "View chat members" ON public.chat_members FOR SELECT USING (
  user_id = auth.uid() OR
  public.is_chat_member(channel_id)
);
CREATE POLICY "Insert chat members" ON public.chat_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  public.is_chat_admin(channel_id) OR
  EXISTS (SELECT 1 FROM public.chat_channels cc WHERE cc.id = channel_id AND cc.created_by = auth.uid())
);
CREATE POLICY "Update chat members" ON public.chat_members FOR UPDATE USING (
  user_id = auth.uid() OR
  public.is_chat_admin(channel_id)
);
CREATE POLICY "Delete chat members" ON public.chat_members FOR DELETE USING (
  user_id = auth.uid() OR
  public.is_chat_admin(channel_id)
);

-- CHAT MESSAGES
CREATE POLICY "View messages" ON public.chat_messages FOR SELECT USING (
  public.is_chat_member(channel_id)
);
CREATE POLICY "Send messages" ON public.chat_messages FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  public.is_chat_member(channel_id)
);
CREATE POLICY "Update messages" ON public.chat_messages FOR UPDATE USING (
  user_id = auth.uid()
);
CREATE POLICY "Delete messages" ON public.chat_messages FOR DELETE USING (
  user_id = auth.uid() OR
  public.is_chat_admin(channel_id)
);

-- CHAT REACTIONS
CREATE POLICY "View reactions" ON public.chat_reactions FOR SELECT USING (
  public.is_chat_member((SELECT channel_id FROM public.chat_messages WHERE id = message_id))
);
CREATE POLICY "Manage reactions" ON public.chat_reactions FOR ALL USING (
  user_id = auth.uid()
);

-- CONTRIBUTIONS
CREATE POLICY "View contributions" ON public.contributions FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage contributions" ON public.contributions FOR ALL USING (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

-- EXPENSES
CREATE POLICY "View expenses" ON public.expenses FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage expenses" ON public.expenses FOR ALL USING (
  paid_by = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

-- ALBUMS
CREATE POLICY "View albums" ON public.albums FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage albums" ON public.albums FOR ALL USING (
  created_by = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

-- MEDIA
CREATE POLICY "View media" ON public.media FOR SELECT USING (
  public.is_farewell_member((SELECT farewell_id FROM public.albums WHERE id = album_id))
);
CREATE POLICY "Manage media" ON public.media FOR ALL USING (
  uploaded_by = auth.uid() OR
  public.is_farewell_admin((SELECT farewell_id FROM public.albums WHERE id = album_id))
);

-- SONG REQUESTS
CREATE POLICY "View songs" ON public.song_requests FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage songs" ON public.song_requests FOR ALL USING (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

-- DUTIES
CREATE POLICY "View duties" ON public.duties FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage duties" ON public.duties FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- NOTIFICATIONS
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- AUDIT LOGS
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT USING (
  public.is_farewell_admin(farewell_id)
);

-- POLLS
CREATE POLICY "View polls" ON public.polls FOR SELECT USING (TRUE);
CREATE POLICY "Manage polls" ON public.polls FOR ALL USING (
  created_by = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

-- POLL OPTIONS
CREATE POLICY "View options" ON public.poll_options FOR SELECT USING (TRUE);
CREATE POLICY "Manage options" ON public.poll_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.created_by = auth.uid())
);

-- POLL VOTES
CREATE POLICY "View votes" ON public.poll_votes FOR SELECT USING (TRUE);
CREATE POLICY "Vote" ON public.poll_votes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Change vote" ON public.poll_votes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Remove vote" ON public.poll_votes FOR DELETE USING (user_id = auth.uid());

-- TICKETS
CREATE POLICY "View own ticket" ON public.tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins scan tickets" ON public.tickets FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);

-- CONFESSIONS
CREATE POLICY "View approved confessions" ON public.confessions FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "View all confessions (Admin)" ON public.confessions FOR SELECT USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Submit confession" ON public.confessions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Manage confessions" ON public.confessions FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- ==========================================
-- 6. TRIGGERS & FUNCTIONS
-- ==========================================

-- User Updated At
CREATE OR REPLACE FUNCTION handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Auth User Sync
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Channel Last Message
CREATE OR REPLACE FUNCTION update_channel_last_message() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_channels SET last_message_at = NEW.created_at WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_sent AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE PROCEDURE update_channel_last_message();

-- ==========================================
-- 7. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_farewell_members_user_id ON public.farewell_members(user_id);

-- ==========================================
-- 8. ENABLE REALTIME
-- ==========================================
-- Add tables to the publication to enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.farewell_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- ==========================================
-- 9. GRANTS
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
