-- SMART SCHEMA 2.1 (Enhanced)
-- Comprehensive Database Definition for Farewell Management System
-- Includes: Auth, Finance, Chat, Gallery, Duties, Notifications, Audit, Realtime

-- 1. CLEANUP (For development reset)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'parallel_admin', 'main_admin');
CREATE TYPE contribution_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE payment_method AS ENUM ('upi', 'cash', 'bank_transfer');
CREATE TYPE duty_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE join_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');

-- 3. CORE TABLES

-- USERS (Extends Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- FAREWELLS
CREATE TABLE public.farewells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  section TEXT,
  date TIMESTAMPTZ,
  requires_approval BOOLEAN DEFAULT FALSE,
  code TEXT UNIQUE, -- For joining via code
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- FAREWELL MEMBERS (The Pivot Table)
CREATE TABLE public.farewell_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'student',
  active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farewell_id, user_id)
);
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- JOIN REQUESTS
CREATE TABLE public.farewell_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status join_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farewell_id, user_id)
);
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- 4. FINANCE SYSTEM (Double Entry Ledger)

-- CONTRIBUTIONS (Money In)
CREATE TABLE public.contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method payment_method NOT NULL,
  transaction_id TEXT, -- UPI Ref ID
  screenshot_url TEXT,
  status contribution_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- EXPENSES (Money Out)
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid_by UUID REFERENCES public.users(id), -- Who initially paid (for reimbursement)
  category TEXT,
  receipt_url TEXT,
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 5. CHAT SYSTEM

CREATE TABLE public.chat_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('group', 'dm')),
  name TEXT, -- Null for DMs
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_members (
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(), -- Read receipts
  PRIMARY KEY (channel_id, user_id)
);
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT, -- 'image', 'video', 'audio'
  reply_to UUID REFERENCES public.chat_messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 6. GALLERY

CREATE TABLE public.albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image', 'video'
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- 7. DUTIES

CREATE TABLE public.duties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status duty_status DEFAULT 'pending',
  assigned_to UUID[], -- Array of User IDs for simplicity in display
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

-- 8. SYSTEM INTELLIGENCE (Advanced)

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., 'update_budget', 'delete_member'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- SONG REQUESTS
CREATE TABLE public.song_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  artist TEXT,
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

-- 9. TRIGGERS & FUNCTIONS

-- Sync Auth User to Public User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync Farewell Roles to Custom Claims (The "Smart" Auth)
CREATE OR REPLACE FUNCTION public.sync_farewell_claims()
RETURNS TRIGGER AS $$
DECLARE
  user_farewells JSONB;
  current_metadata JSONB;
BEGIN
  -- Fetch all farewell memberships for the user
  SELECT jsonb_object_agg(farewell_id, role)
  INTO user_farewells
  FROM public.farewell_members
  WHERE user_id = NEW.user_id AND active = true;

  -- Get current metadata
  SELECT raw_app_meta_data INTO current_metadata
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Update app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(current_metadata, '{}'::jsonb) || 
    jsonb_build_object('farewells', COALESCE(user_farewells, '{}'::jsonb))
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_farewell_member_change
  AFTER INSERT OR UPDATE ON public.farewell_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_farewell_claims();

-- 10. RLS POLICIES (The "Smart" Security)

-- Users: Read all, Update self
CREATE POLICY "Users can see everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Farewells: Public read (for joining)
CREATE POLICY "Public read farewells" ON public.farewells FOR SELECT USING (true);

-- Farewell Members: Read if in farewell, Self insert (joining)
CREATE POLICY "Read members if in farewell" ON public.farewell_members 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members fm 
      WHERE fm.farewell_id = farewell_members.farewell_id AND fm.user_id = auth.uid()
    )
  );
-- Allow system to insert (handled by API usually, but good for testing)
CREATE POLICY "Self join" ON public.farewell_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contributions: View own, Admins view all
CREATE POLICY "View own contributions" ON public.contributions 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view all contributions" ON public.contributions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members fm 
      WHERE fm.farewell_id = contributions.farewell_id 
      AND fm.user_id = auth.uid() 
      AND fm.role IN ('main_admin', 'parallel_admin')
    )
  );
CREATE POLICY "Create own contribution" ON public.contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: View own
CREATE POLICY "View own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Song Requests: View all in farewell, Create own
CREATE POLICY "View songs in farewell" ON public.song_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members fm 
      WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
    )
  );
CREATE POLICY "Create song request" ON public.song_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. REALTIME CONFIGURATION
-- Enable Realtime for Chat, Notifications, and Song Requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_requests;

-- 12. SEED DATA
INSERT INTO public.farewells (name, year, section, requires_approval)
VALUES ('Class of 2024 Farewell', 2024, 'A', false);
