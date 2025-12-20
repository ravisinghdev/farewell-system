-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20240101000000_smart_schema_v2.sql
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


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_enhancements.sql
-- Chat Enhancements: Blocks & Requests

-- 1. User Blocks Table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS for Blocks
-- Users can see who they blocked
CREATE POLICY "View own blocks" ON public.user_blocks 
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Create block" ON public.user_blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Delete block" ON public.user_blocks 
  FOR DELETE USING (auth.uid() = blocker_id);


-- 2. Chat Member Status (for Requests)
-- We use a text column with check constraint for easier migration than ENUMs
ALTER TABLE public.chat_members 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ignored'));

-- 3. Update Chat Policies to respect Blocks and Status

-- Helper function to check if blocked (Security Definer to bypass RLS on user_blocks if needed, though simple queries might suffice)
-- Actually, we can just check existence in the query.

-- Update "Members can send messages" policy to prevent sending if blocked
-- OR if the chat is not active for them (unless they are the sender of a request?)
-- Logic: You can send if you are 'active' OR 'pending' (you might be replying to accept?).
-- Actually, usually 'pending' means you received a request. You shouldn't be able to send until you accept.
-- If you sent the request, you are 'active', receiver is 'pending'.

-- Let's refine the "Members can send messages" policy in a later step or rely on application logic + basic membership.
-- For now, the schema change is the priority.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_chat_rewrite.sql
-- CHAT REWRITE: Global DMs & Advanced Features

-- 1. Make farewell_id NULLABLE to support Global DMs
ALTER TABLE public.chat_channels 
ALTER COLUMN farewell_id DROP NOT NULL;

-- 2. Add Pin and Mute (Restrict) to Chat Members
ALTER TABLE public.chat_members
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

-- 3. Add Edit/Delete support to Messages
ALTER TABLE public.chat_messages
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMPTZ;

-- 4. Update RLS Policies for Global Access

-- Channels: View if member (already exists via function, but function checks farewell_id?)
-- Our previous function `is_member_of_farewell` is not enough for global DMs.
-- We need a policy that checks `chat_members` directly.

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: View if member of channel
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Messages: Send if member
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
    -- Add check for blocked/muted status if desired here? 
    -- For now, basic membership is enough.
  )
  AND auth.uid() = user_id
);

-- Messages: Update own messages (Edit/Delete)
CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- Members: Update own settings (Pin/Mute)
CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Search Policy
-- Users need to be able to search ALL users for Global DMs.
-- The previous policy "Users can see everyone" (USING true) covers this.


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_comprehensive_rls_fix.sql
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- This migration ensures all feature tables have correct policies for farewell members.

-- HELPER: A reusable condition for "Is Member of Farewell"
-- We can't easily use a function in RLS without performance cost, so we'll repeat the EXISTS clause.
-- Pattern:
-- EXISTS (
--   SELECT 1 FROM public.farewell_members fm
--   WHERE fm.farewell_id = [TABLE].farewell_id
--   AND fm.user_id = auth.uid()
-- )

-- ==========================================
-- 1. CHAT SYSTEM
-- ==========================================

-- CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
CREATE POLICY "Members can view channels" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
CREATE POLICY "Members can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = chat_channels.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.chat_channels TO authenticated;

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_messages.channel_id
    AND fm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

GRANT ALL ON public.chat_messages TO authenticated;

-- CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels cc
    JOIN public.farewell_members fm ON fm.farewell_id = cc.farewell_id
    WHERE cc.id = chat_members.channel_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
CREATE POLICY "Join chat channels" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

GRANT ALL ON public.chat_members TO authenticated;


-- ==========================================
-- 2. GALLERY (Albums & Media)
-- ==========================================

-- ALBUMS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view albums" ON public.albums;
CREATE POLICY "Members view albums" ON public.albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create albums" ON public.albums;
CREATE POLICY "Members create albums" ON public.albums
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = albums.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.albums TO authenticated;

-- MEDIA
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media" ON public.media;
CREATE POLICY "Members view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members upload media" ON public.media;
CREATE POLICY "Members upload media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a
    JOIN public.farewell_members fm ON fm.farewell_id = a.farewell_id
    WHERE a.id = media.album_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.media TO authenticated;


-- ==========================================
-- 3. FINANCE (Expenses)
-- ==========================================

-- EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view expenses" ON public.expenses;
CREATE POLICY "Members view expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members create expenses" ON public.expenses;
CREATE POLICY "Members create expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = expenses.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.expenses TO authenticated;


-- ==========================================
-- 4. DUTIES
-- ==========================================

-- DUTIES
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view duties" ON public.duties;
CREATE POLICY "Members view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Only Admins/Teachers should ideally create duties, but allowing all members for now to avoid blockers.
-- Can refine later.
DROP POLICY IF EXISTS "Members create duties" ON public.duties;
CREATE POLICY "Members create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.duties TO authenticated;


-- ==========================================
-- 5. SONG REQUESTS (Refining existing)
-- ==========================================

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View songs in farewell" ON public.song_requests;
CREATE POLICY "View songs in farewell" ON public.song_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create song request" ON public.song_requests;
CREATE POLICY "Create song request" ON public.song_requests 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = song_requests.farewell_id AND fm.user_id = auth.uid()
  )
);

GRANT ALL ON public.song_requests TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_emergency_chat_fix.sql
-- EMERGENCY CHAT FIX
-- This is a simplified, permissive policy set to get things working.

-- 1. Enable RLS (just in case)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting policies
DROP POLICY IF EXISTS "emergency_insert_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_select_channels" ON public.chat_channels;
DROP POLICY IF EXISTS "emergency_all_members" ON public.chat_members;
DROP POLICY IF EXISTS "emergency_all_messages" ON public.chat_messages;

-- 3. Create Permissive Policies
-- Channels: Allow authenticated users to create and view
CREATE POLICY "emergency_insert_channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "emergency_select_channels" ON public.chat_channels
FOR SELECT USING (true); -- Allow viewing all channels for now to debug (can refine later)

-- Members: Allow everything for authenticated users
CREATE POLICY "emergency_all_members" ON public.chat_members
FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Allow everything for authenticated users
CREATE POLICY "emergency_all_messages" ON public.chat_messages
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Grant permissions
GRANT ALL ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_members TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_creation_rls.sql
-- Allow authenticated users to create new chat channels (for DMs)
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to add members to channels
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- FIX INFINITE RECURSION (Attempt 2: SECURITY DEFINER Function)
-- We use a SECURITY DEFINER function to bypass RLS when checking for shared channels.
-- This breaks the cycle because the function runs with owner privileges.

CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of channels they are in (using the secure function)
  channel_id IN (SELECT get_my_channel_ids())
);

-- OPTIMIZE SEARCH
-- Enable pg_trgm for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes for full_name and email
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_chat_final.sql
-- CONSOLIDATED CHAT FIX MIGRATION
-- Run this to fix RLS errors, infinite recursion, and missing columns.

-- 1. SCHEMA UPDATES
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;

ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 2. SECURITY DEFINER FUNCTION (Fixes Recursion)
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT channel_id FROM chat_members WHERE user_id = auth.uid();
$$;

-- 3. RESET RLS POLICIES
-- We drop ALL existing policies to ensure a clean slate.

-- CHAT CHANNELS
DROP POLICY IF EXISTS "Members can view channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "View channels if member" ON public.chat_channels;

CREATE POLICY "View channels if member" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- CHAT MEMBERS
DROP POLICY IF EXISTS "View chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Join chat channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Update own membership" ON public.chat_members;

CREATE POLICY "View chat members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

CREATE POLICY "Users can add members" ON public.chat_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Update own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON public.chat_messages;

CREATE POLICY "View messages if member" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Send messages if member" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Update own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. OPTIMIZATION
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON public.users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON public.users USING GIN (email gin_trgm_ops);


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_farewells_policy.sql
-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_members_and_requests_rls.sql
-- Fix RLS for Members and Join Requests

-- 1. FAREWELL MEMBERS
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;

-- Ensure the "Self join" policy exists and is correct
DROP POLICY IF EXISTS "Self join" ON public.farewell_members;
CREATE POLICY "Self join" 
ON public.farewell_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure read access is correct (users can see members of farewells they are in)
DROP POLICY IF EXISTS "Read members if in farewell" ON public.farewell_members;
CREATE POLICY "Read members if in farewell" 
ON public.farewell_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_members.farewell_id 
    AND fm.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_members TO authenticated;
GRANT ALL ON public.farewell_members TO service_role;


-- 2. FAREWELL JOIN REQUESTS (Missing in original schema)
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own requests
DROP POLICY IF EXISTS "View own join requests" ON public.farewell_join_requests;
CREATE POLICY "View own join requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
DROP POLICY IF EXISTS "Create own join request" ON public.farewell_join_requests;
CREATE POLICY "Create own join request" 
ON public.farewell_join_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view requests for their farewells
DROP POLICY IF EXISTS "Admins view requests" ON public.farewell_join_requests;
CREATE POLICY "Admins view requests" 
ON public.farewell_join_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm 
    WHERE fm.farewell_id = farewell_join_requests.farewell_id 
    AND fm.user_id = auth.uid()
    AND fm.role IN ('main_admin', 'parallel_admin')
  )
);

-- Grant permissions
GRANT ALL ON public.farewell_join_requests TO authenticated;
GRANT ALL ON public.farewell_join_requests TO service_role;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_fix_users_policy.sql
-- Fix Users Table RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to read basic user info (needed for chat avatars, etc.)
DROP POLICY IF EXISTS "Users can see everyone" ON public.users;

CREATE POLICY "Users can see everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241124_force_cleanup_chat_policies.sql
-- FORCE CLEANUP OF CHAT POLICIES
-- This migration dynamically drops ALL policies on chat tables to ensure no conflicts remain.

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on chat_channels
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_channels' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_members', pol.policyname);
    END LOOP;

    -- Drop all policies on chat_messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
    END LOOP;
END $$;

-- NOW RE-CREATE THE CORRECT POLICIES

-- 1. CHAT CHANNELS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to create a channel (Group or DM)
CREATE POLICY "Enable insert for authenticated" ON public.chat_channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view their channels
CREATE POLICY "Enable select for members" ON public.chat_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- 2. CHAT MEMBERS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to add members (needed for creating DMs/Groups)
CREATE POLICY "Enable insert for authenticated" ON public.chat_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view members (using the SECURITY DEFINER function if it exists, or simple check)
-- We'll use the simple check for now to be safe, as the function might not exist if previous migration failed.
-- Actually, let's just recreate the function to be sure.
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS 'SELECT channel_id FROM chat_members WHERE user_id = auth.uid()';

CREATE POLICY "Enable select for members" ON public.chat_members
FOR SELECT USING (
  user_id = auth.uid()
  OR
  channel_id IN (SELECT get_my_channel_ids())
);

-- Allow users to update their own membership (pin/mute)
CREATE POLICY "Enable update for own membership" ON public.chat_members
FOR UPDATE USING (auth.uid() = user_id);

-- 3. CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow members to view messages
CREATE POLICY "Enable select for members" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
);

-- Allow members to send messages
CREATE POLICY "Enable insert for members" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members cm
    WHERE cm.channel_id = chat_messages.channel_id
    AND cm.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Allow users to update their own messages
CREATE POLICY "Enable update for own messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 4. ENSURE SCHEMA
ALTER TABLE public.chat_channels ALTER COLUMN farewell_id DROP NOT NULL;


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_complaints.sql
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


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_chat_performance.sql
-- Add indexes to speed up chat queries

-- Index for finding a user's memberships (used in getChannelsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id_status ON chat_members(user_id, status);

-- Index for finding members of a channel (used in getChannelDetailsAction)
CREATE INDEX IF NOT EXISTS idx_chat_members_channel_id ON chat_members(channel_id);

-- Index for finding channels by scope (used for finding General channel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_type ON chat_channels(scope_id, type);

-- Index for finding messages in a channel (used in getMessagesAction)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);

-- Index for finding pending channels (used for admin panel)
CREATE INDEX IF NOT EXISTS idx_chat_channels_scope_status ON chat_channels(scope_id, status) WHERE status = 'pending';


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241129_fix_complaints_permissions.sql
-- Fix permissions for chat_complaints
GRANT ALL ON TABLE public.chat_complaints TO authenticated;
GRANT ALL ON TABLE public.chat_complaints TO service_role;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_complaints ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (drop first to avoid duplicates if names match)
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.chat_complaints;
CREATE POLICY "Users can view their own complaints"
ON public.chat_complaints FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create complaints" ON public.chat_complaints;
CREATE POLICY "Users can create complaints"
ON public.chat_complaints FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- File: 20241202_add_highlights_bucket.sql
-- Create highlights bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('highlights', 'highlights', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects if not already (standard practice)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- Commented out to avoid permission errors if already enabled

-- Policy: Public can view highlights
DROP POLICY IF EXISTS "Public can view highlights" ON storage.objects;
CREATE POLICY "Public can view highlights"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'highlights');

-- Policy: Authenticated users can upload highlights
-- (We rely on frontend/backend logic to ensure only admins trigger this)
DROP POLICY IF EXISTS "Authenticated users can upload highlights" ON storage.objects;
CREATE POLICY "Authenticated users can upload highlights"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'highlights');

-- Policy: Users can update/delete their own uploads
DROP POLICY IF EXISTS "Users can manage own highlights" ON storage.objects;
CREATE POLICY "Users can manage own highlights"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'highlights' AND auth.uid() = owner);


-- File: 20241202_add_notification_triggers.sql
-- Function to notify user on contribution status change
CREATE OR REPLACE FUNCTION public.notify_contribution_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Approved', 'Your contribution of ' || NEW.amount || ' has been approved.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Rejected', 'Your contribution has been rejected. Please check details.', 'error', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'mismatch_error' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Issue', 'There is a mismatch issue with your contribution.', 'warning', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'paid_pending_admin_verification' AND OLD.status != 'paid_pending_admin_verification' THEN
       -- Optional: Notify user that payment is received and pending
       INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
       VALUES (NEW.user_id, NEW.farewell_id, 'Payment Received', 'We received your payment. Waiting for admin verification.', 'info', '/dashboard/' || NEW.farewell_id || '/contributions');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_contribution_status_change ON public.contributions;
CREATE TRIGGER on_contribution_status_change
AFTER UPDATE ON public.contributions
FOR EACH ROW
EXECUTE PROCEDURE public.notify_contribution_update();

-- Function to notify all members on new content
CREATE OR REPLACE FUNCTION public.notify_new_content()
RETURNS TRIGGER AS $$
DECLARE
  _title TEXT;
  _msg TEXT;
  _link TEXT;
  _type notif_type;
BEGIN
  IF TG_TABLE_NAME = 'announcements' THEN
    _title := 'New Announcement';
    _msg := substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/announcements';
    _type := 'announcement';
  ELSIF TG_TABLE_NAME = 'timeline_events' THEN
    _title := 'Timeline Updated';
    _msg := 'New event: ' || substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/timeline';
    _type := 'info';
  ELSIF TG_TABLE_NAME = 'highlights' THEN
    _title := 'New Highlight';
    _msg := substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/highlights';
    _type := 'info';
  END IF;

  -- Insert for all active members except the creator
  INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
  SELECT user_id, NEW.farewell_id, _title, _msg, _type, _link
  FROM public.farewell_members
  WHERE farewell_id = NEW.farewell_id
  AND user_id != auth.uid(); -- Don't notify self

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_announcement ON public.announcements;
CREATE TRIGGER on_new_announcement
AFTER INSERT ON public.announcements
FOR EACH ROW
EXECUTE PROCEDURE public.notify_new_content();

DROP TRIGGER IF EXISTS on_new_timeline_event ON public.timeline_events;
CREATE TRIGGER on_new_timeline_event
AFTER INSERT ON public.timeline_events
FOR EACH ROW
EXECUTE PROCEDURE public.notify_new_content();

DROP TRIGGER IF EXISTS on_new_highlight ON public.highlights;
CREATE TRIGGER on_new_highlight
AFTER INSERT ON public.highlights
FOR EACH ROW
EXECUTE PROCEDURE public.notify_new_content();


-- File: 20241202_add_timeline_highlights.sql
-- Add 'main_admin' to farewell_role enum
ALTER TYPE farewell_role ADD VALUE IF NOT EXISTS 'main_admin';

-- Create timeline_events table
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  icon TEXT DEFAULT 'calendar',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create highlights table
CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Update is_farewell_admin function to include 'main_admin' if not already
CREATE OR REPLACE FUNCTION public.is_farewell_admin(_farewell_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'parallel_admin', 'main_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for timeline_events
CREATE POLICY "View timeline" ON public.timeline_events FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage timeline" ON public.timeline_events FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- Policies for highlights
CREATE POLICY "View highlights" ON public.highlights FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage highlights" ON public.highlights FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.highlights;


-- File: 20241202_enable_contributions_realtime.sql
-- Add contributions table to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'contributions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
  END IF;
END
$$;


-- File: 20241202_enable_notifications_realtime.sql
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for viewing own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Policy for updating own notifications (marking as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Add to realtime publication
-- We check if the publication exists first to avoid errors, though usually 'supabase_realtime' exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;


-- File: 20241202_update_notification_types.sql
-- Drop the existing check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated check constraint with all required types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'success', 'warning', 'error', 'announcement', 'finance'));


-- File: 20241203_fix_notification_triggers.sql
-- Fix notification triggers to use valid enum values
-- Valid values: 'message', 'mention', 'system', 'request', 'finance', 'duty'

-- 1. Drop conflicting check constraint if it exists
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Update triggers
CREATE OR REPLACE FUNCTION public.notify_contribution_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Approved', 'Your contribution of ' || NEW.amount || ' has been approved.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Rejected', 'Your contribution has been rejected. Please check details.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'mismatch_error' THEN
      INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
      VALUES (NEW.user_id, NEW.farewell_id, 'Contribution Issue', 'There is a mismatch issue with your contribution.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    ELSIF NEW.status = 'paid_pending_admin_verification' AND OLD.status != 'paid_pending_admin_verification' THEN
       -- Optional: Notify user that payment is received and pending
       INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
       VALUES (NEW.user_id, NEW.farewell_id, 'Payment Received', 'We received your payment. Waiting for admin verification.', 'finance', '/dashboard/' || NEW.farewell_id || '/contributions');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_new_content()
RETURNS TRIGGER AS $$
DECLARE
  _title TEXT;
  _msg TEXT;
  _link TEXT;
  _type notif_type;
BEGIN
  IF TG_TABLE_NAME = 'announcements' THEN
    _title := 'New Announcement';
    _msg := substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/announcements';
    _type := 'system'; -- Changed from 'announcement'
  ELSIF TG_TABLE_NAME = 'timeline_events' THEN
    _title := 'Timeline Updated';
    _msg := 'New event: ' || substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/timeline';
    _type := 'system'; -- Changed from 'info'
  ELSIF TG_TABLE_NAME = 'highlights' THEN
    _title := 'New Highlight';
    _msg := substring(NEW.title from 1 for 50);
    _link := '/dashboard/' || NEW.farewell_id || '/highlights';
    _type := 'system'; -- Changed from 'info'
  END IF;

  -- Insert for all active members except the creator
  INSERT INTO public.notifications (user_id, farewell_id, title, message, type, link)
  SELECT user_id, NEW.farewell_id, _title, _msg, _type, _link
  FROM public.farewell_members
  WHERE farewell_id = NEW.farewell_id
  AND user_id != auth.uid(); -- Don't notify self

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129140000_add_complaint_type_reason.sql
alter table "public"."chat_complaints" add column "type" text not null default 'default_group';
alter table "public"."chat_complaints" add column "reason" text;


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141000_fix_admin_rls.sql
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


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251129141500_enable_realtime_publication.sql
-- Enable Realtime for chat_complaints and chat_channels
alter publication supabase_realtime add table "public"."chat_complaints";
alter publication supabase_realtime add table "public"."chat_channels";


-- File: 20251203020700_duty_system_schema.sql
-- Migration: Duty System Schema Updates

-- 1. Update duties table status check
ALTER TABLE public.duties DROP CONSTRAINT IF EXISTS duties_status_check;
ALTER TABLE public.duties ADD CONSTRAINT duties_status_check 
  CHECK (status IN ('pending', 'awaiting_acceptance', 'in_progress', 'awaiting_receipt_verification', 'expense_approved', 'completed'));

-- 2. Update duty_assignments table
ALTER TABLE public.duty_assignments ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending';
ALTER TABLE public.duty_assignments ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- 3. Create duty_updates table
CREATE TABLE IF NOT EXISTS public.duty_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create user_payout_methods table
CREATE TABLE IF NOT EXISTS public.user_payout_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  method_type TEXT CHECK (method_type IN ('upi', 'bank_transfer', 'cash')) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb, -- Stores upi_id, account_no, ifsc, etc.
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Update duty_receipts table
ALTER TABLE public.duty_receipts ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.duty_receipts ADD COLUMN IF NOT EXISTS evidence_files JSONB DEFAULT '[]'::jsonb;

-- 6. RLS Policies for new tables

-- duty_updates
ALTER TABLE public.duty_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View duty updates" ON public.duty_updates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    WHERE d.id = duty_updates.duty_id
    AND public.is_farewell_member(d.farewell_id)
  )
);

CREATE POLICY "Create duty updates" ON public.duty_updates FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.duty_assignments da
    WHERE da.duty_id = duty_updates.duty_id
    AND da.user_id = auth.uid()
    AND da.status = 'accepted'
  )
);

-- user_payout_methods
ALTER TABLE public.user_payout_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payout methods" ON public.user_payout_methods FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Users manage own payout methods" ON public.user_payout_methods FOR ALL USING (
  user_id = auth.uid()
);

-- Grant permissions
GRANT ALL ON public.duty_updates TO postgres;
GRANT ALL ON public.duty_updates TO service_role;
GRANT ALL ON public.duty_updates TO authenticated;

GRANT ALL ON public.user_payout_methods TO postgres;
GRANT ALL ON public.user_payout_methods TO service_role;
GRANT ALL ON public.user_payout_methods TO authenticated;


-- File: 20251203022000_reload_schema.sql
-- Force schema cache reload
COMMENT ON TABLE public.duty_assignments IS 'Duty Assignments';


-- File: 20251203023500_fix_duties_rls.sql
-- Fix RLS policies for duties table

-- Enable RLS (just in case)
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (if any exist with these names)
DROP POLICY IF EXISTS "Admins can create duties" ON public.duties;
DROP POLICY IF EXISTS "Admins can update duties" ON public.duties;
DROP POLICY IF EXISTS "Everyone can view duties" ON public.duties;
DROP POLICY IF EXISTS "Assignees can update their duties" ON public.duties;

-- Policy: Everyone in the farewell can view duties
CREATE POLICY "Everyone can view duties" ON public.duties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
  )
);

-- Policy: Admins can create duties
CREATE POLICY "Admins can create duties" ON public.duties
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  )
);

-- Policy: Admins can update duties
CREATE POLICY "Admins can update duties" ON public.duties
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = duties.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  )
);

-- Policy: Assignees can update their duties
CREATE POLICY "Assignees can update their duties" ON public.duties
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.duty_assignments da
    WHERE da.duty_id = duties.id
    AND da.user_id = auth.uid()
  )
);

-- Grant permissions to authenticated users
GRANT ALL ON public.duties TO authenticated;
GRANT ALL ON public.duty_assignments TO authenticated;
GRANT ALL ON public.duty_receipts TO authenticated;

-- Fix RLS policies for duty_assignments table
ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage duty assignments" ON public.duty_assignments;
DROP POLICY IF EXISTS "Users can view their assignments" ON public.duty_assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON public.duty_assignments;

-- Policy: Admins can manage (insert, update, delete) duty assignments
CREATE POLICY "Admins can manage duty assignments" ON public.duty_assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_assignments.duty_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  )
);

-- Policy: Users can view their own assignments (or all in farewell if we want transparency, but let's stick to own + admins for now, or actually everyone in farewell usually needs to see who is doing what)
-- Let's allow everyone in the farewell to view assignments for transparency
CREATE POLICY "Everyone can view duty assignments" ON public.duty_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_assignments.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- Policy: Users can update their own assignments (e.g. status)
CREATE POLICY "Users can update their assignments" ON public.duty_assignments
FOR UPDATE USING (
  user_id = auth.uid()
);


-- File: 20251203024500_fix_fk_names.sql
-- Explicitly name foreign key constraints to match PostgREST hints

-- 1. duty_assignments -> users
ALTER TABLE public.duty_assignments
DROP CONSTRAINT IF EXISTS duty_assignments_user_id_fkey;

ALTER TABLE public.duty_assignments
ADD CONSTRAINT duty_assignments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. duty_updates -> users
ALTER TABLE public.duty_updates
DROP CONSTRAINT IF EXISTS duty_updates_user_id_fkey;

ALTER TABLE public.duty_updates
ADD CONSTRAINT duty_updates_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';


-- File: 20251203025000_create_receipts_bucket.sql
-- Create receipts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for receipts bucket
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'receipts' );

CREATE POLICY "Authenticated users can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'receipts' );

CREATE POLICY "Users can update their own receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'receipts' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'receipts' AND owner = auth.uid() );


-- File: 20251203030000_receipt_voting.sql
-- Create receipt_votes table
CREATE TABLE IF NOT EXISTS public.receipt_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.duty_receipts(id) ON DELETE CASCADE,
  duty_id UUID NOT NULL REFERENCES public.duties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(receipt_id, user_id)
);

-- Enable RLS
ALTER TABLE public.receipt_votes ENABLE ROW LEVEL SECURITY;

-- Policies for receipt_votes
CREATE POLICY "Everyone in farewell can view votes" ON public.receipt_votes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duty_receipts dr
    JOIN public.duties d ON dr.duty_id = d.id
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE dr.id = receipt_votes.receipt_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can vote" ON public.receipt_votes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.duty_receipts dr
    JOIN public.duties d ON dr.duty_id = d.id
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE dr.id = receipt_votes.receipt_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can remove vote" ON public.receipt_votes
FOR DELETE USING (
  user_id = auth.uid()
);

-- Ensure duty_receipts is viewable by everyone (updating existing policy if needed)
-- We previously granted ALL to authenticated, but let's be specific with a policy if one doesn't exist for SELECT
-- Checking if we need to drop old policies first?
-- Let's just create a permissive SELECT policy for duty_receipts if it doesn't exist.
-- Actually, let's just ensure it.

DROP POLICY IF EXISTS "Everyone can view duty receipts" ON public.duty_receipts;

CREATE POLICY "Everyone can view duty receipts" ON public.duty_receipts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_receipts.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- Allow uploaders to insert
CREATE POLICY "Assignees can upload receipts" ON public.duty_receipts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.duty_assignments da
    WHERE da.duty_id = duty_receipts.duty_id
    AND da.user_id = auth.uid()
  )
);

-- Allow uploaders to update/delete their own
CREATE POLICY "Uploaders can update own receipts" ON public.duty_receipts
FOR UPDATE USING ( uploader_id = auth.uid() );

CREATE POLICY "Uploaders can delete own receipts" ON public.duty_receipts
FOR DELETE USING ( uploader_id = auth.uid() );

-- Grant permissions
GRANT ALL ON public.receipt_votes TO authenticated;


-- File: 20251203031000_fix_receipt_visibility.sql
-- Comprehensive fix for receipt visibility and voting

-- 0. Ensure duty_id exists in receipt_votes (Fix for missing column error)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipt_votes' AND column_name = 'duty_id') THEN
        ALTER TABLE public.receipt_votes ADD COLUMN duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Backfill duty_id for existing votes
UPDATE public.receipt_votes rv
SET duty_id = dr.duty_id
FROM public.duty_receipts dr
WHERE rv.receipt_id = dr.id
AND rv.duty_id IS NULL;

-- Make it NOT NULL after backfill (optional, but good for integrity)
-- ALTER TABLE public.receipt_votes ALTER COLUMN duty_id SET NOT NULL;


-- 1. Ensure RLS is enabled
ALTER TABLE public.duty_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_votes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Everyone can view duty receipts" ON public.duty_receipts;
DROP POLICY IF EXISTS "Assignees can upload receipts" ON public.duty_receipts;
DROP POLICY IF EXISTS "Uploaders can update own receipts" ON public.duty_receipts;
DROP POLICY IF EXISTS "Uploaders can delete own receipts" ON public.duty_receipts;

DROP POLICY IF EXISTS "Everyone in farewell can view votes" ON public.receipt_votes;
DROP POLICY IF EXISTS "Members can vote" ON public.receipt_votes;
DROP POLICY IF EXISTS "Members can remove vote" ON public.receipt_votes;

-- 3. Policies for duty_receipts

-- VIEW: Everyone in the farewell can view receipts
CREATE POLICY "Everyone can view duty receipts" ON public.duty_receipts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = duty_receipts.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- INSERT: Assignees can upload receipts
CREATE POLICY "Assignees can upload receipts" ON public.duty_receipts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.duty_assignments da
    WHERE da.duty_id = duty_receipts.duty_id
    AND da.user_id = auth.uid()
  )
);

-- UPDATE: Uploaders can update their own receipts
CREATE POLICY "Uploaders can update own receipts" ON public.duty_receipts
FOR UPDATE USING ( uploader_id = auth.uid() );

-- DELETE: Uploaders can delete their own receipts
CREATE POLICY "Uploaders can delete own receipts" ON public.duty_receipts
FOR DELETE USING ( uploader_id = auth.uid() );


-- 4. Policies for receipt_votes

-- VIEW: Everyone in the farewell can view votes
CREATE POLICY "Everyone in farewell can view votes" ON public.receipt_votes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = receipt_votes.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- INSERT: Members can vote (must be in the farewell)
CREATE POLICY "Members can vote" ON public.receipt_votes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.duties d
    JOIN public.farewell_members fm ON d.farewell_id = fm.farewell_id
    WHERE d.id = receipt_votes.duty_id
    AND fm.user_id = auth.uid()
  )
);

-- DELETE: Members can remove their own vote
CREATE POLICY "Members can remove vote" ON public.receipt_votes
FOR DELETE USING (
  user_id = auth.uid()
);

-- 5. Grant permissions (Crucial for PostgREST)
GRANT ALL ON public.duty_receipts TO authenticated;
GRANT ALL ON public.receipt_votes TO authenticated;

-- 6. Force schema cache reload
NOTIFY pgrst, 'reload config';


-- File: 20251203032000_debug_receipt_rls.sql
-- Simplify RLS for duty_receipts to debug visibility
-- This allows any authenticated user to view ANY duty receipt. 
-- We will refine this later, but this confirms if the JOIN was the issue.

DROP POLICY IF EXISTS "Everyone can view duty receipts" ON public.duty_receipts;

CREATE POLICY "Authenticated can view all receipts" ON public.duty_receipts
FOR SELECT
TO authenticated
USING (true);

-- Also ensure storage is accessible
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;

CREATE POLICY "Authenticated users can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'receipts' );

-- Ensure receipt_votes is also visible
DROP POLICY IF EXISTS "Everyone in farewell can view votes" ON public.receipt_votes;

CREATE POLICY "Authenticated can view all votes" ON public.receipt_votes
FOR SELECT
TO authenticated
USING (true);


-- File: 20251203033000_disable_rls_debug.sql
-- Disable RLS on duty_receipts and receipt_votes for debugging
-- This is a temporary measure to confirm if RLS is the cause of the visibility issue.

ALTER TABLE public.duty_receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_votes DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON public.duty_receipts TO authenticated;
GRANT ALL ON public.receipt_votes TO authenticated;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';


-- File: 20251204000000_add_user_class_details.sql
-- Add grade and section to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS section TEXT;

-- Update handle_new_user trigger to copy grade and section from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, username, grade, section)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    (NEW.raw_user_meta_data->>'grade')::INTEGER,
    NEW.raw_user_meta_data->>'section'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    grade = COALESCE(EXCLUDED.grade, public.users.grade),
    section = COALESCE(EXCLUDED.section, public.users.section);
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- File: 20251204011500_events_schema.sql
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


-- File: 20251204013000_force_events_rls.sql
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


-- File: 20251204014000_performance_video_and_votes.sql
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


-- File: 20251204020000_legacy_schema.sql
-- LEGACY QUOTES
CREATE TABLE IF NOT EXISTS public.legacy_quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEGACY VIDEOS
CREATE TABLE IF NOT EXISTS public.legacy_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_main BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEGACY GIFTS
CREATE TABLE IF NOT EXISTS public.legacy_gifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  gift_type TEXT NOT NULL, -- e.g., 'gift_box', 'flower', 'trophy'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEGACY THANK YOU NOTES
CREATE TABLE IF NOT EXISTS public.legacy_thank_you_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_name TEXT, -- e.g., "Teachers", "Organizers", or specific name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.legacy_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_thank_you_notes ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- QUOTES
CREATE POLICY "View quotes" ON public.legacy_quotes FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Create quotes" ON public.legacy_quotes FOR INSERT WITH CHECK (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage quotes" ON public.legacy_quotes FOR ALL USING (submitted_by = auth.uid() OR public.is_farewell_admin(farewell_id));

-- VIDEOS
CREATE POLICY "View videos" ON public.legacy_videos FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Create videos" ON public.legacy_videos FOR INSERT WITH CHECK (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage videos" ON public.legacy_videos FOR ALL USING (uploaded_by = auth.uid() OR public.is_farewell_admin(farewell_id));

-- GIFTS
CREATE POLICY "View gifts" ON public.legacy_gifts FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Create gifts" ON public.legacy_gifts FOR INSERT WITH CHECK (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage gifts" ON public.legacy_gifts FOR ALL USING (sender_id = auth.uid() OR public.is_farewell_admin(farewell_id));

-- THANK YOU NOTES
CREATE POLICY "View notes" ON public.legacy_thank_you_notes FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Create notes" ON public.legacy_thank_you_notes FOR INSERT WITH CHECK (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage notes" ON public.legacy_thank_you_notes FOR ALL USING (author_id = auth.uid() OR public.is_farewell_admin(farewell_id));

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.legacy_quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legacy_videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legacy_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legacy_thank_you_notes;


-- File: 20251204021500_fix_legacy_permissions.sql
-- Grant permissions for Legacy tables to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_gifts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_thank_you_notes TO authenticated;

-- Grant permissions for Legacy tables to service_role (for admin tasks/scripts)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_quotes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_videos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_gifts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_thank_you_notes TO service_role;

-- Ensure helper functions are executable
GRANT EXECUTE ON FUNCTION public.is_farewell_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_farewell_member TO service_role;
GRANT EXECUTE ON FUNCTION public.is_farewell_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_farewell_admin TO service_role;


-- File: 20251204090000_resources_community.sql
-- RESOURCES: TEMPLATES
CREATE TABLE IF NOT EXISTS public.resource_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- RESOURCES: MUSIC LIBRARY
CREATE TABLE IF NOT EXISTS public.resource_music (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  duration TEXT, -- e.g. "3:45"
  file_url TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- RESOURCES: DOWNLOADS
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT, -- e.g. "2.4 MB"
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- COMMUNITY: SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'resolved', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.resource_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- POLICIES: TEMPLATES
CREATE POLICY "View templates" ON public.resource_templates FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage templates" ON public.resource_templates FOR ALL USING (public.is_farewell_admin(farewell_id));

-- POLICIES: MUSIC
CREATE POLICY "View music" ON public.resource_music FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage music" ON public.resource_music FOR ALL USING (public.is_farewell_admin(farewell_id));

-- POLICIES: DOWNLOADS
CREATE POLICY "View downloads" ON public.resource_downloads FOR SELECT USING (public.is_farewell_member(farewell_id));
CREATE POLICY "Manage downloads" ON public.resource_downloads FOR ALL USING (public.is_farewell_admin(farewell_id));

-- POLICIES: SUPPORT TICKETS
-- Users can view their own tickets, Admins can view all
CREATE POLICY "View tickets" ON public.support_tickets FOR SELECT USING (user_id = auth.uid() OR public.is_farewell_admin(farewell_id));
-- Users can create tickets
CREATE POLICY "Create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admins can update tickets (e.g. status)
CREATE POLICY "Update tickets" ON public.support_tickets FOR UPDATE USING (public.is_farewell_admin(farewell_id));

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_music;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_downloads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;


-- File: 20251204100000_fix_rls_and_storage.sql
-- Fix RLS Policies for Resources

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "View templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Manage templates" ON public.resource_templates;
DROP POLICY IF EXISTS "View music" ON public.resource_music;
DROP POLICY IF EXISTS "Manage music" ON public.resource_music;
DROP POLICY IF EXISTS "View downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Manage downloads" ON public.resource_downloads;

-- Re-create Policies with proper permissions

-- TEMPLATES
CREATE POLICY "View templates" ON public.resource_templates 
  FOR SELECT USING (true); -- Allow all authenticated users to view

CREATE POLICY "Manage templates" ON public.resource_templates 
  FOR ALL USING (
    public.is_farewell_admin(farewell_id) OR 
    (select role from public.farewell_members where farewell_id = resource_templates.farewell_id and user_id = auth.uid()) in ('admin', 'main_admin', 'parallel_admin')
  );

-- MUSIC
CREATE POLICY "View music" ON public.resource_music 
  FOR SELECT USING (true);

CREATE POLICY "Manage music" ON public.resource_music 
  FOR ALL USING (
    public.is_farewell_admin(farewell_id) OR 
    (select role from public.farewell_members where farewell_id = resource_music.farewell_id and user_id = auth.uid()) in ('admin', 'main_admin', 'parallel_admin')
  );

-- DOWNLOADS
CREATE POLICY "View downloads" ON public.resource_downloads 
  FOR SELECT USING (true);

CREATE POLICY "Manage downloads" ON public.resource_downloads 
  FOR ALL USING (
    public.is_farewell_admin(farewell_id) OR 
    (select role from public.farewell_members where farewell_id = resource_downloads.farewell_id and user_id = auth.uid()) in ('admin', 'main_admin', 'parallel_admin')
  );


-- STORAGE SETUP
-- Create a new bucket for resources if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('farewell_resources', 'farewell_resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'farewell_resources' );

-- Allow public access to view resources (since the bucket is public)
CREATE POLICY "Public access to resources"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'farewell_resources' );

-- Allow admins (or uploader) to delete
CREATE POLICY "Users can delete their own resources"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'farewell_resources' AND auth.uid() = owner );


-- File: 20251204103000_fix_rls_permissive.sql
-- Fix RLS Policies to allow member uploads

-- Drop existing policies
DROP POLICY IF EXISTS "Manage templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Manage music" ON public.resource_music;
DROP POLICY IF EXISTS "Manage downloads" ON public.resource_downloads;

-- TEMPLATES
-- Allow any member to INSERT
CREATE POLICY "Insert templates" ON public.resource_templates 
  FOR INSERT WITH CHECK (
    public.is_farewell_member(farewell_id)
  );

-- Allow Admins or Owner to UPDATE/DELETE
CREATE POLICY "Update templates" ON public.resource_templates 
  FOR UPDATE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete templates" ON public.resource_templates 
  FOR DELETE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

-- MUSIC
CREATE POLICY "Insert music" ON public.resource_music 
  FOR INSERT WITH CHECK (
    public.is_farewell_member(farewell_id)
  );

CREATE POLICY "Update music" ON public.resource_music 
  FOR UPDATE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete music" ON public.resource_music 
  FOR DELETE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

-- DOWNLOADS
CREATE POLICY "Insert downloads" ON public.resource_downloads 
  FOR INSERT WITH CHECK (
    public.is_farewell_member(farewell_id)
  );

CREATE POLICY "Update downloads" ON public.resource_downloads 
  FOR UPDATE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete downloads" ON public.resource_downloads 
  FOR DELETE USING (
    public.is_farewell_admin(farewell_id) OR uploaded_by = auth.uid()
  );


-- File: 20251204110000_fix_rls_final.sql
-- Fix RLS Policies FINAL (Direct Subqueries)

-- Drop existing policies
DROP POLICY IF EXISTS "Insert templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Update templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Delete templates" ON public.resource_templates;

DROP POLICY IF EXISTS "Insert music" ON public.resource_music;
DROP POLICY IF EXISTS "Update music" ON public.resource_music;
DROP POLICY IF EXISTS "Delete music" ON public.resource_music;

DROP POLICY IF EXISTS "Insert downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Update downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Delete downloads" ON public.resource_downloads;

-- TEMPLATES
-- Allow any member to INSERT
CREATE POLICY "Insert templates" ON public.resource_templates 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid()
    )
  );

-- Allow Admins or Owner to UPDATE
CREATE POLICY "Update templates" ON public.resource_templates 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

-- Allow Admins or Owner to DELETE
CREATE POLICY "Delete templates" ON public.resource_templates 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

-- MUSIC
CREATE POLICY "Insert music" ON public.resource_music 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Update music" ON public.resource_music 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete music" ON public.resource_music 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

-- DOWNLOADS
CREATE POLICY "Insert downloads" ON public.resource_downloads 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Update downloads" ON public.resource_downloads 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete downloads" ON public.resource_downloads 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
    OR uploaded_by = auth.uid()
  );


-- File: 20251204113000_fix_rls_nuclear.sql
-- NUCLEAR RLS FIX: Allow all authenticated users to do everything on resources
-- This is to unblock the "permission denied" error. We can refine later.

-- Drop everything again
DROP POLICY IF EXISTS "Insert templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Update templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Delete templates" ON public.resource_templates;
DROP POLICY IF EXISTS "View templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Manage templates" ON public.resource_templates;

DROP POLICY IF EXISTS "Insert music" ON public.resource_music;
DROP POLICY IF EXISTS "Update music" ON public.resource_music;
DROP POLICY IF EXISTS "Delete music" ON public.resource_music;
DROP POLICY IF EXISTS "View music" ON public.resource_music;
DROP POLICY IF EXISTS "Manage music" ON public.resource_music;

DROP POLICY IF EXISTS "Insert downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Update downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Delete downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "View downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Manage downloads" ON public.resource_downloads;

-- TEMPLATES
CREATE POLICY "Enable all access for authenticated users" ON public.resource_templates
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- MUSIC
CREATE POLICY "Enable all access for authenticated users" ON public.resource_music
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- DOWNLOADS
CREATE POLICY "Enable all access for authenticated users" ON public.resource_downloads
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- File: 20251204120000_reset_resources_rls.sql
-- COMPLETE RLS RESET FOR RESOURCES
-- This script drops all known variations of policies and re-creates them from scratch.

-- 1. TEMPLATES
ALTER TABLE public.resource_templates ENABLE ROW LEVEL SECURITY;

-- Drop all possible old policy names
DROP POLICY IF EXISTS "View templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Manage templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Insert templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Update templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Delete templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.resource_templates;
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Authenticated users can insert templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.resource_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.resource_templates;

-- Create NEW Clean Policies
-- Allow ALL authenticated users to VIEW
CREATE POLICY "view_templates_policy" ON public.resource_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow ALL authenticated users to INSERT (if they are part of the farewell - optional check, but let's be open for now to fix the error)
CREATE POLICY "insert_templates_policy" ON public.resource_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow Users to UPDATE their OWN uploads OR Admins
CREATE POLICY "update_templates_policy" ON public.resource_templates
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );

-- Allow Users to DELETE their OWN uploads OR Admins
CREATE POLICY "delete_templates_policy" ON public.resource_templates
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_templates.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );


-- 2. MUSIC
ALTER TABLE public.resource_music ENABLE ROW LEVEL SECURITY;

-- Drop all possible old policy names
DROP POLICY IF EXISTS "View music" ON public.resource_music;
DROP POLICY IF EXISTS "Manage music" ON public.resource_music;
DROP POLICY IF EXISTS "Insert music" ON public.resource_music;
DROP POLICY IF EXISTS "Update music" ON public.resource_music;
DROP POLICY IF EXISTS "Delete music" ON public.resource_music;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.resource_music;

-- Create NEW Clean Policies
CREATE POLICY "view_music_policy" ON public.resource_music
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_music_policy" ON public.resource_music
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_music_policy" ON public.resource_music
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );

CREATE POLICY "delete_music_policy" ON public.resource_music
  FOR DELETE TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_music.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );


-- 3. DOWNLOADS
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;

-- Drop all possible old policy names
DROP POLICY IF EXISTS "View downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Manage downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Insert downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Update downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Delete downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.resource_downloads;

-- Create NEW Clean Policies
CREATE POLICY "view_downloads_policy" ON public.resource_downloads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_downloads_policy" ON public.resource_downloads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_downloads_policy" ON public.resource_downloads
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );

CREATE POLICY "delete_downloads_policy" ON public.resource_downloads
  FOR DELETE TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM public.farewell_members 
      WHERE farewell_id = resource_downloads.farewell_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'main_admin', 'parallel_admin')
    )
  );

-- 4. STORAGE (Just to be sure)
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('farewell_resources', 'farewell_resources', true)
ON CONFLICT (id) DO NOTHING;

-- Drop potential old storage policies
DROP POLICY IF EXISTS "Authenticated users can upload resources" ON storage.objects;
DROP POLICY IF EXISTS "Public access to resources" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resources" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;

-- Create Clean Storage Policies
CREATE POLICY "resource_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ( bucket_id = 'farewell_resources' );

CREATE POLICY "resource_select_policy" ON storage.objects
  FOR SELECT TO public
  USING ( bucket_id = 'farewell_resources' );

CREATE POLICY "resource_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING ( bucket_id = 'farewell_resources' AND auth.uid() = owner );


-- File: 20251204123000_grant_permissions.sql
-- ULTIMATE PERMISSION FIX
-- This script explicitly GRANTS permissions and resets RLS.

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Grant Table Permissions (CRUD)
GRANT ALL ON TABLE public.resource_templates TO authenticated;
GRANT ALL ON TABLE public.resource_music TO authenticated;
GRANT ALL ON TABLE public.resource_downloads TO authenticated;

GRANT SELECT ON TABLE public.resource_templates TO anon;
GRANT SELECT ON TABLE public.resource_music TO anon;
GRANT SELECT ON TABLE public.resource_downloads TO anon;

-- 3. Grant Sequence Permissions (Important for INSERTs with auto-increment IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Reset RLS Policies (Just to be absolutely sure)
ALTER TABLE public.resource_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;

-- Drop existing
DROP POLICY IF EXISTS "view_templates_policy" ON public.resource_templates;
DROP POLICY IF EXISTS "insert_templates_policy" ON public.resource_templates;
DROP POLICY IF EXISTS "update_templates_policy" ON public.resource_templates;
DROP POLICY IF EXISTS "delete_templates_policy" ON public.resource_templates;

-- Re-create Permissive Policies
CREATE POLICY "view_templates_policy" ON public.resource_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_templates_policy" ON public.resource_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_templates_policy" ON public.resource_templates FOR UPDATE TO authenticated USING (true); -- Allow all authenticated to update for now
CREATE POLICY "delete_templates_policy" ON public.resource_templates FOR DELETE TO authenticated USING (true); -- Allow all authenticated to delete for now

-- Same for Music
DROP POLICY IF EXISTS "view_music_policy" ON public.resource_music;
DROP POLICY IF EXISTS "insert_music_policy" ON public.resource_music;
DROP POLICY IF EXISTS "update_music_policy" ON public.resource_music;
DROP POLICY IF EXISTS "delete_music_policy" ON public.resource_music;

CREATE POLICY "view_music_policy" ON public.resource_music FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_music_policy" ON public.resource_music FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_music_policy" ON public.resource_music FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_music_policy" ON public.resource_music FOR DELETE TO authenticated USING (true);

-- Same for Downloads
DROP POLICY IF EXISTS "view_downloads_policy" ON public.resource_downloads;
DROP POLICY IF EXISTS "insert_downloads_policy" ON public.resource_downloads;
DROP POLICY IF EXISTS "update_downloads_policy" ON public.resource_downloads;
DROP POLICY IF EXISTS "delete_downloads_policy" ON public.resource_downloads;

CREATE POLICY "view_downloads_policy" ON public.resource_downloads FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_downloads_policy" ON public.resource_downloads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_downloads_policy" ON public.resource_downloads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_downloads_policy" ON public.resource_downloads FOR DELETE TO authenticated USING (true);


-- File: 20251204130000_add_member_id.sql
-- Add member_id to resource tables for easier joining

-- 1. Add member_id column
ALTER TABLE public.resource_templates ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.farewell_members(id);
ALTER TABLE public.resource_music ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.farewell_members(id);
ALTER TABLE public.resource_downloads ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.farewell_members(id);

-- 2. Backfill member_id based on uploaded_by (user_id) and farewell_id
UPDATE public.resource_templates rt
SET member_id = fm.id
FROM public.farewell_members fm
WHERE rt.farewell_id = fm.farewell_id AND rt.uploaded_by = fm.user_id;

UPDATE public.resource_music rm
SET member_id = fm.id
FROM public.farewell_members fm
WHERE rm.farewell_id = fm.farewell_id AND rm.uploaded_by = fm.user_id;

UPDATE public.resource_downloads rd
SET member_id = fm.id
FROM public.farewell_members fm
WHERE rd.farewell_id = fm.farewell_id AND rd.uploaded_by = fm.user_id;

-- 3. Grant permissions on new column (implicitly covered by table grant, but good to be safe if RLS changes)
-- No specific column grant needed if table grant exists.


-- File: 20251211_add_farewell_settings.sql
-- Add configuration columns to farewells table
ALTER TABLE farewells ADD COLUMN IF NOT EXISTS target_amount DECIMAL(12,2) DEFAULT 50000;
ALTER TABLE farewells ADD COLUMN IF NOT EXISTS is_maintenance_mode BOOLEAN DEFAULT false;
ALTER TABLE farewells ADD COLUMN IF NOT EXISTS accepting_payments BOOLEAN DEFAULT true;
ALTER TABLE farewells ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{"upi": true, "cash": true, "bank_transfer": false, "upi_id": ""}'::jsonb;


-- File: 20251212220300_analytics_rpc.sql
-- Migration: Add Analytics RPC for Scalability
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_farewell_analytics(target_farewell_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_collected NUMERIC;
  total_count INTEGER;
  pending_count INTEGER;
  method_dist JSON;
  daily_trend JSON;
  top_contributors JSON;
BEGIN
  -- 1. Total Stats (Aggregated)
  SELECT 
    COALESCE(SUM(amount), 0), 
    COUNT(*)
  INTO 
    total_collected, 
    total_count
  FROM contributions 
  WHERE farewell_id = target_farewell_id 
  AND status IN ('verified', 'approved');

  -- 2. Pending Count
  SELECT COUNT(*) INTO pending_count
  FROM contributions
  WHERE farewell_id = target_farewell_id 
  AND status = 'pending';

  -- 3. Method Distribution (Aggregated)
  SELECT json_agg(t) INTO method_dist FROM (
    SELECT method, COUNT(*) as count, SUM(amount) as volume
    FROM contributions
    WHERE farewell_id = target_farewell_id
    AND status IN ('verified', 'approved')
    GROUP BY method
  ) t;

  -- 4. Daily Trend (Last 30 days)
  SELECT json_agg(t) INTO daily_trend FROM (
    SELECT 
      DATE(created_at) as day, 
      SUM(amount) as amount,
      COUNT(*) as tx_count
    FROM contributions
    WHERE farewell_id = target_farewell_id
    AND status IN ('verified', 'approved')
    AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  ) t;

  -- 5. Top Contributors (Aggregated by User ID)
  SELECT json_agg(t) INTO top_contributors FROM (
    SELECT 
      user_id,
      SUM(amount) as total_amount
    FROM contributions
    WHERE farewell_id = target_farewell_id
    AND status IN ('verified', 'approved')
    AND user_id IS NOT NULL
    GROUP BY user_id
    ORDER BY total_amount DESC
    LIMIT 5
  ) t;

  RETURN json_build_object(
    'total_collected', total_collected,
    'total_count', total_count,
    'pending_count', pending_count,
    'method_distribution', COALESCE(method_dist, '[]'::json),
    'daily_trend', COALESCE(daily_trend, '[]'::json),
    'top_contributors', COALESCE(top_contributors, '[]'::json)
  );
END;
$$;


-- File: 20251213000000_fix_gallery_rls.sql
-- Fix RLS for gallery_media
ALTER TABLE "public"."gallery_media" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read rights for all users" ON "public"."gallery_media"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "public"."gallery_media"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to delete their own media
CREATE POLICY "Enable delete for users based on user_id" ON "public"."gallery_media"
AS PERMISSIVE FOR DELETE
TO public
USING (auth.uid() = uploaded_by);


-- File: 20251213005000_add_rls_helpers.sql
-- Migration: Helper Functions for RLS
-- Create is_farewell_member if it doesn't exist

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_farewell_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_farewell_member TO service_role;


-- File: 20251213010000_add_duty_columns.sql
-- Add missing columns to duties table
alter table duties add column if not exists expense_limit_hard boolean default false;
alter table duties add column if not exists priority text default 'normal';


-- File: 20251213010000_duty_ledger_system.sql
-- Migration: Duty System V2 (Ledger & Advanced Features)

-- 1. Create Ledger Table
CREATE TABLE IF NOT EXISTS public.ledger (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('debit', 'credit')) NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL CHECK (category IN ('duty_reimbursement', 'adjustment', 'contribution')),
    reference_id UUID, -- Can link to duty_receipt_id or contribution_id
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- RLS for Ledger
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- Everyone in the farewell can VIEW the ledger (Transparency)
CREATE POLICY "Farewell members can view ledger" ON public.ledger
    FOR SELECT USING (
        public.is_farewell_member(farewell_id)
    );

-- Only Admins can manage ledger (Managed via RPCs usually)
CREATE POLICY "Admins can manage ledger" ON public.ledger
    FOR ALL USING (
        public.is_farewell_admin(farewell_id)
    );


-- 2. Modify Duties Table
ALTER TABLE public.duties 
ADD COLUMN IF NOT EXISTS expense_limit_hard BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium';

-- Ensure RLS allows viewing by all members
DROP POLICY IF EXISTS "View duties" ON public.duties;
CREATE POLICY "Farewell members can view duties" ON public.duties
    FOR SELECT USING (
        public.is_farewell_member(farewell_id)
    );

-- 3. Modify Duty Receipts Table
-- Update RLS to allow ALL members to see receipts (User Request)
DROP POLICY IF EXISTS "View duty receipts" ON public.duty_receipts;
CREATE POLICY "Farewell members can view receipts" ON public.duty_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.duties d
            WHERE d.id = duty_receipts.duty_id
            AND public.is_farewell_member(d.farewell_id)
        )
    );

-- 4. Status Calculation Trigger
-- Function to calculate duty status based on assignments and receipts
CREATE OR REPLACE FUNCTION public.calculate_duty_status()
RETURNS TRIGGER AS $$
DECLARE
    v_duty_id UUID;
    v_total_receipts INT;
    v_pending_receipts INT;
    v_approved_receipts INT;
    v_rejected_receipts INT;
    v_new_status TEXT;
BEGIN
    IF TG_TABLE_NAME = 'duty_receipts' THEN
        v_duty_id := NEW.duty_id;
    ELSIF TG_TABLE_NAME = 'duties' THEN
        -- If manual update, respect it, or re-calc if needed. 
        -- For now, let's only trigger on receipt changes to avoid loops.
        RETURN NEW;
    END IF;

    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'approved'),
        COUNT(*) FILTER (WHERE status = 'rejected')
    INTO 
        v_total_receipts,
        v_pending_receipts,
        v_approved_receipts,
        v_rejected_receipts
    FROM public.duty_receipts
    WHERE duty_id = v_duty_id;

    -- Logic for status
    IF v_total_receipts = 0 THEN
        v_new_status := 'pending'; -- Or 'assigned' if assignments exist? Keeping simple.
    ELSIF v_pending_receipts > 0 THEN
        v_new_status := 'in_progress'; -- Active work being reviewed
    ELSIF v_approved_receipts > 0 AND v_pending_receipts = 0 THEN
         -- All processed, at least one approved. Could be 'completed' or 'expense_approved'.
         -- Let's use 'completed' for simplicity as per plan, or 'expense_approved' if waiting for something else.
         v_new_status := 'completed';
    ELSIF v_rejected_receipts = v_total_receipts THEN
         -- All rejected, back to pending/in_progress? 
         v_new_status := 'in_progress'; 
    ELSE
        v_new_status := 'in_progress';
    END IF;

    UPDATE public.duties 
    SET status = v_new_status::text, updated_at = NOW()
    WHERE id = v_duty_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Receipt Changes
DROP TRIGGER IF EXISTS trigger_update_duty_status ON public.duty_receipts;
CREATE TRIGGER trigger_update_duty_status
AFTER INSERT OR UPDATE OR DELETE ON public.duty_receipts
FOR EACH ROW EXECUTE FUNCTION public.calculate_duty_status();


-- 5. RPC: Transactional Receipt Approval
CREATE OR REPLACE FUNCTION public.approve_duty_receipt(
    p_receipt_id UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_receipt_record RECORD;
    v_duty_record RECORD;
    v_user_id UUID;
    v_farewell_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- 1. Lock & Get Receipt
    SELECT * INTO v_receipt_record 
    FROM public.duty_receipts 
    WHERE id = p_receipt_id 
    FOR UPDATE; -- Lock row

    IF NOT FOUND THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Receipt not found'); 
    END IF;

    IF v_receipt_record.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Receipt is not pending');
    END IF;

    -- 2. Get Duty & Validate Admin
    SELECT * INTO v_duty_record
    FROM public.duties
    WHERE id = v_receipt_record.duty_id;

    v_farewell_id := v_duty_record.farewell_id;

    -- FIX: Use single-parameter function
    IF NOT public.is_farewell_admin(v_farewell_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- 3. Update Receipt
    UPDATE public.duty_receipts
    SET 
        status = 'approved',
        reviewed_by = v_user_id,
        reviewed_at = NOW(),
        admin_notes = p_admin_notes
    WHERE id = p_receipt_id;

    -- 4. Create Ledger Entry
    INSERT INTO public.ledger (
        farewell_id,
        type,
        amount,
        category,
        reference_id,
        description,
        created_by
    ) VALUES (
        v_farewell_id,
        'debit',
        v_receipt_record.amount,
        'duty_reimbursement',
        p_receipt_id,
        'Reimbursement for duty: ' || v_duty_record.title,
        v_user_id
    );

    -- 5. Return Success
    RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant access to RPC
GRANT EXECUTE ON FUNCTION public.approve_duty_receipt(UUID, TEXT) TO authenticated;


-- File: 20251213040000_duty_system_v3.sql
-- Duty System V3: Professional Management System
-- Run this SQL directly in Supabase SQL Editor

-- 1. Duty Templates
CREATE TABLE IF NOT EXISTS duty_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farewell_id UUID REFERENCES farewells(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    default_budget NUMERIC,
    estimated_duration_hours INT,
    required_skills TEXT[],
    checklist_items JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false
);

-- 2. Enhance Duties Table
ALTER TABLE duties ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE duties ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES duty_templates(id);
ALTER TABLE duties ADD COLUMN IF NOT EXISTS parent_duty_id UUID REFERENCES duties(id);
ALTER TABLE duties ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE duties ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC;
ALTER TABLE duties ADD COLUMN IF NOT EXISTS actual_hours NUMERIC;
ALTER TABLE duties ADD COLUMN IF NOT EXISTS completion_percentage INT DEFAULT 0;
ALTER TABLE duties ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE duties ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE duties ADD COLUMN IF NOT EXISTS vendor_info JSONB;
ALTER TABLE duties ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE duties ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Duty Subtasks
CREATE TABLE IF NOT EXISTS duty_subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duty_id UUID REFERENCES duties(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    assigned_to UUID REFERENCES users(id),
    estimated_hours NUMERIC,
    completed_at TIMESTAMPTZ,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Duty Attachments
CREATE TABLE IF NOT EXISTS duty_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duty_id UUID REFERENCES duties(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

-- 5. Duty Comments
CREATE TABLE IF NOT EXISTS duty_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duty_id UUID REFERENCES duties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    parent_comment_id UUID REFERENCES duty_comments(id)
);

-- 6. Duty Activity Log
CREATE TABLE IF NOT EXISTS duty_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duty_id UUID REFERENCES duties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id),
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Budget Breakdown
CREATE TABLE IF NOT EXISTS duty_budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duty_id UUID REFERENCES duties(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    estimated_amount NUMERIC NOT NULL,
    actual_amount NUMERIC,
    quantity INT DEFAULT 1,
    unit_price NUMERIC,
    vendor TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE duty_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_budget_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view duty templates" ON duty_templates FOR SELECT USING (is_public OR public.is_farewell_member(farewell_id));
CREATE POLICY "Admins can manage templates" ON duty_templates FOR ALL USING (public.is_farewell_admin(farewell_id));

CREATE POLICY "Members can view subtasks" ON duty_subtasks FOR SELECT USING (EXISTS (SELECT 1 FROM duties d WHERE d.id = duty_subtasks.duty_id AND public.is_farewell_member(d.farewell_id)));
CREATE POLICY "Assigned can manage subtasks" ON duty_subtasks FOR ALL USING (EXISTS (SELECT 1 FROM duties d WHERE d.id = duty_subtasks.duty_id AND public.is_farewell_member(d.farewell_id)));

CREATE POLICY "Members can view attachments" ON duty_attachments FOR SELECT USING (EXISTS (SELECT 1 FROM duties d WHERE d.id = duty_attachments.duty_id AND public.is_farewell_member(d.farewell_id)));
CREATE POLICY "Members can upload attachments" ON duty_attachments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM duties d WHERE d.id = duty_attachments.duty_id AND public.is_farewell_member(d.farewell_id)));

CREATE POLICY "Members can view comments" ON duty_comments FOR SELECT USING (EXISTS (SELECT 1 FROM duties d WHERE d.id = duty_comments.duty_id AND public.is_farewell_member(d.farewell_id)));
CREATE POLICY "Members can create comments" ON duty_comments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM duties d WHERE d.id = duty_comments.duty_id AND public.is_farewell_member(d.farewell_id)));
CREATE POLICY "Authors can update comments" ON duty_comments FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Members can view activity" ON duty_activity_log FOR SELECT USING (EXISTS (SELECT 1 FROM duties d WHERE d.id = duty_activity_log.duty_id AND public.is_farewell_member(d.farewell_id)));

CREATE POLICY "Members can view budget items" ON duty_budget_items FOR SELECT USING (EXISTS (SELECT 1 FROM duties d WHERE d.id = duty_budget_items.duty_id AND public.is_farewell_member(d.farewell_id)));
CREATE POLICY "Admins can manage budget items" ON duty_budget_items FOR ALL USING (EXISTS (SELECT 1 FROM duties d WHERE d.id = duty_budget_items.duty_id AND public.is_farewell_admin(d.farewell_id)));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_duty_subtasks_duty_id ON duty_subtasks(duty_id);
CREATE INDEX IF NOT EXISTS idx_duty_attachments_duty_id ON duty_attachments(duty_id);
CREATE INDEX IF NOT EXISTS idx_duty_comments_duty_id ON duty_comments(duty_id);
CREATE INDEX IF NOT EXISTS idx_duty_activity_log_duty_id ON duty_activity_log(duty_id);
CREATE INDEX IF NOT EXISTS idx_duty_budget_items_duty_id ON duty_budget_items(duty_id);

-- Function to auto-update completion percentage
CREATE OR REPLACE FUNCTION update_duty_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_subtasks INT;
    completed_subtasks INT;
    new_percentage INT;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO total_subtasks, completed_subtasks
    FROM duty_subtasks
    WHERE duty_id = NEW.duty_id;

    IF total_subtasks > 0 THEN
        new_percentage := (completed_subtasks * 100) / total_subtasks;
        UPDATE duties SET completion_percentage = new_percentage WHERE id = NEW.duty_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for completion percentage
DROP TRIGGER IF EXISTS trigger_update_completion ON duty_subtasks;
CREATE TRIGGER trigger_update_completion
AFTER INSERT OR UPDATE OR DELETE ON duty_subtasks
FOR EACH ROW EXECUTE FUNCTION update_duty_completion();


-- File: 20251213050000_add_jsonb_settings.sql
-- Add settings JSONB column to farewells table
ALTER TABLE farewells ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Migrate existing data to settings column (for critical finance fields)
-- precise logic to preserve existing target_amount and payment config
UPDATE farewells
SET settings = jsonb_build_object(
    'general', jsonb_build_object(
        'farewell_name', name,
        'academic_year', '2024-2025', -- Default fallback
        'timezone', 'Asia/Kolkata',
        'currency', 'INR',
        'locale', 'en-IN',
        'is_maintenance_mode', COALESCE(is_maintenance_mode, false)
    ),
    'finance', jsonb_build_object(
        'target_budget', COALESCE(target_amount, 50000),
        'split_mode', 'equal',
        'contribution_min', 0,
        'accepting_payments', COALESCE(accepting_payments, true),
        'allow_offline_payments', true,
        'allow_partial_payments', true,
        'upi_id', payment_config->>'upi_id'
    ),
    'roles', '{"admin": {"can_create_duties": true, "can_manage_finance": true, "can_post_announcements": true, "can_invite_users": true, "can_edit_settings": true}, "teacher": {"can_create_duties": true, "can_manage_finance": false, "can_post_announcements": true, "can_invite_users": true, "can_edit_settings": false}, "student": {"can_create_duties": false, "can_manage_finance": false, "can_post_announcements": false, "can_invite_users": false, "can_edit_settings": false}}'::jsonb,
    'joining', '{"join_method": "approval", "allow_guests": false, "joining_locked": false}'::jsonb,
    'duties', '{"enable_duties": true, "admin_only_creation": true, "max_active_duties_per_user": 3, "require_receipt_proof": true, "auto_approve_limit": 200}'::jsonb,
    'communication', '{"enable_chat": true, "enable_announcements": true, "admin_only_announcements": true, "allow_media_in_chat": true, "enable_reactions": true}'::jsonb,
    'features', '{"enable_ai_moderation": false, "enable_ocr_receipts": false, "enable_gallery": true}'::jsonb
);

-- Note: We generally don't drop the old columns immediately to prevent downtime during deploy.
-- We will deprecate them in the codebase first.


-- File: 20251217110000_add_user_preferences.sql
-- Add preferences column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;

-- Comment on column
COMMENT ON COLUMN public.users.preferences IS 'User-specific application settings including notification overrides';


-- File: 20251217140000_rebuild_support_about_v3.sql
-- Drop old support_tickets if exists
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.about_sections CASCADE;

-- Create support_tickets
CREATE TABLE public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'technical', 'logistics', 'other')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support_messages
CREATE TABLE public.support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create about_sections
CREATE TABLE public.about_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_sections ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = support_tickets.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  ));

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = support_tickets.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  ));

-- Policies for support_messages
CREATE POLICY "Users can view messages for accessible tickets" ON public.support_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_messages.ticket_id
    AND (st.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.farewell_members fm
      WHERE fm.farewell_id = st.farewell_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
    ))
  ));

CREATE POLICY "Users can create messages for accessible tickets" ON public.support_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_messages.ticket_id
    AND (st.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.farewell_members fm
      WHERE fm.farewell_id = st.farewell_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
    ))
  ));

-- Policies for about_sections
CREATE POLICY "Everyone can view about sections" ON public.about_sections
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage about sections" ON public.about_sections
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = about_sections.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  ));

-- Realtime
-- Publication 'supabase_realtime' is already defined as FOR ALL TABLES in this project.
-- No explicit table additions needed.


-- File: 20251217143000_fix_permissions.sql
-- Grant permissions to authenticated users and service_role
GRANT ALL ON TABLE public.support_tickets TO authenticated;
GRANT ALL ON TABLE public.support_tickets TO service_role;

GRANT ALL ON TABLE public.support_messages TO authenticated;
GRANT ALL ON TABLE public.support_messages TO service_role;

GRANT ALL ON TABLE public.about_sections TO authenticated;
GRANT ALL ON TABLE public.about_sections TO service_role;

-- Also need to grant usage on sequences if any (Postgres 10+ usually handles serials via table ownership, but gen_random_uuid doesn't use sequences)
-- Just in case policies were missing, we can try to re-assert them or trust previous migration. 
-- But 42501 usually means the table itself is not accessible.

-- Ensure RLS is enabled
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_sections ENABLE ROW LEVEL SECURITY;


-- File: 20251217150000_redesign_resources.sql
-- Migration: Redesign Resources System
-- Drops old separate tables and creates a unified 'resources' table

-- 1. Drop old tables (if they exist)
DROP TABLE IF EXISTS "public"."resource_templates";
DROP TABLE IF EXISTS "public"."resource_music";
DROP TABLE IF EXISTS "public"."resource_downloads";

-- 2. Create 'resources' table
CREATE TABLE "public"."resources" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "farewell_id" uuid NOT NULL,
    "type" text NOT NULL CHECK (type IN ('template', 'music', 'download')),
    "title" text NOT NULL,
    "description" text,
    "file_path" text NOT NULL, -- Storage path: e.g. "farewell-id/music/filename.mp3"
    "file_url" text NOT NULL,  -- Public URL
    "metadata" jsonb DEFAULT '{}'::jsonb, -- Store duration, artist, size, etc.
    "uploaded_by" uuid NOT NULL, -- User ID
    "member_id" uuid NOT NULL -- Member ID
);

-- 3. Add Primary Key
ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");

-- 4. Add Foreign Keys
ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_farewell_id_fkey" FOREIGN KEY ("farewell_id") REFERENCES "public"."farewells"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."farewell_members"("id") ON DELETE SET NULL;

-- 5. Enable RLS
ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- View: Any member of the farewell
CREATE POLICY "Enable read access for farewell members" ON "public"."resources"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."farewell_members" fm
            WHERE fm.farewell_id = resources.farewell_id
            AND fm.user_id = auth.uid()
        )
    );

-- Insert: Only Admins of the farewell
CREATE POLICY "Enable insert for farewell admins" ON "public"."resources"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."farewell_members" fm
            WHERE fm.farewell_id = resources.farewell_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
        )
    );

-- Delete: Only Admins of the farewell
CREATE POLICY "Enable delete for farewell admins" ON "public"."resources"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."farewell_members" fm
            WHERE fm.farewell_id = resources.farewell_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
        )
    );

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."resources";

-- 8. Storage Policy (Assuming 'farewell_resources' bucket exists)
-- If not created, you'd insert into storage.buckets here, but usually that's done via UI or separate init script.
-- We'll just add policies for the 'farewell_resources' bucket to be safe.

-- Allow public read (assuming resources are meant to be downloadable by members)
-- Creating a policy for storage.objects requires knowing the bucket_id.
-- We will assume standard bucket name 'farewell_resources'.

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'farewell_resources' );

create policy "Admin Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'farewell_resources'
    and auth.role() = 'authenticated'
  );

create policy "Admin Delete"
  on storage.objects for delete
  using (
    bucket_id = 'farewell_resources'
    and auth.role() = 'authenticated'
  );


-- File: 20251217153000_fix_resource_permissions.sql
-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."resources" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."resources" TO service_role;

-- Ensure RLS is still on (just in case)
ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


-- File: add_channel_status.sql
-- Create channel_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE channel_status AS ENUM ('active', 'pending', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to chat_channels
ALTER TABLE public.chat_channels 
ADD COLUMN IF NOT EXISTS status channel_status DEFAULT 'active';

-- Update existing channels to be active
UPDATE public.chat_channels SET status = 'active' WHERE status IS NULL;


-- File: create_alumni_schema.sql
-- Create table for Alumni Messages
CREATE TABLE IF NOT EXISTS public.alumni_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alumni_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Alumni messages are viewable by everyone in the farewell" 
ON public.alumni_messages FOR SELECT 
USING (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create alumni messages" 
ON public.alumni_messages FOR INSERT 
WITH CHECK (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    ) AND
    auth.uid() = sender_id
);

CREATE POLICY "Users can update their own alumni messages" 
ON public.alumni_messages FOR UPDATE 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own alumni messages" 
ON public.alumni_messages FOR DELETE 
USING (auth.uid() = sender_id);

-- Grant permissions
GRANT ALL ON public.alumni_messages TO authenticated;
GRANT ALL ON public.alumni_messages TO service_role;


-- File: create_dashboard_pages_schema.sql
-- Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Timeline Events Table
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    icon TEXT DEFAULT 'calendar', -- e.g., 'calendar', 'music', 'star'
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Highlights Table
CREATE TABLE IF NOT EXISTS public.highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Policies (Viewable by members, editable by admins)

-- Announcements Policies
CREATE POLICY "Announcements viewable by members" ON public.announcements
    FOR SELECT USING (
        farewell_id IN (SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Announcements editable by admins" ON public.announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members 
            WHERE farewell_id = announcements.farewell_id 
            AND user_id = auth.uid() 
            AND role::text IN ('admin', 'main_admin')
        )
    );

-- Timeline Policies
CREATE POLICY "Timeline viewable by members" ON public.timeline_events
    FOR SELECT USING (
        farewell_id IN (SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Timeline editable by admins" ON public.timeline_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members 
            WHERE farewell_id = timeline_events.farewell_id 
            AND user_id = auth.uid() 
            AND role::text IN ('admin', 'main_admin')
        )
    );

-- Highlights Policies
CREATE POLICY "Highlights viewable by members" ON public.highlights
    FOR SELECT USING (
        farewell_id IN (SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Highlights editable by admins" ON public.highlights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members 
            WHERE farewell_id = highlights.farewell_id 
            AND user_id = auth.uid() 
            AND role::text IN ('admin', 'main_admin')
        )
    );

-- Grant permissions
GRANT ALL ON public.announcements TO authenticated;
GRANT ALL ON public.timeline_events TO authenticated;
GRANT ALL ON public.highlights TO authenticated;
GRANT ALL ON public.announcements TO service_role;
GRANT ALL ON public.timeline_events TO service_role;
GRANT ALL ON public.highlights TO service_role;


-- File: create_general_groups.sql
-- 1. Create 'General' channels for farewells that don't have one
INSERT INTO public.chat_channels (id, scope_id, type, name, created_by)
SELECT 
  uuid_generate_v4(), -- Generate new ID
  f.id,               -- Farewell ID
  'group',            -- Type
  'General',          -- Name
  f.created_by        -- Creator (owner of farewell)
FROM public.farewells f
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_channels cc 
  WHERE cc.scope_id = f.id AND cc.name = 'General'
);

-- 2. Add ALL farewell members to the 'General' channel of their farewell
INSERT INTO public.chat_members (channel_id, user_id, status, role)
SELECT 
  cc.id,              -- Channel ID (The General channel)
  fm.user_id,         -- User ID (From farewell members)
  'active',           -- Status
  'member'            -- Role
FROM public.farewell_members fm
JOIN public.chat_channels cc ON cc.scope_id = fm.farewell_id
WHERE cc.name = 'General' -- Only target General channels
AND NOT EXISTS (
  SELECT 1 FROM public.chat_members cm 
  WHERE cm.channel_id = cc.id AND cm.user_id = fm.user_id
);

-- 3. Also add the Farewell Creators (Admins) if they are not in farewell_members
INSERT INTO public.chat_members (channel_id, user_id, status, role)
SELECT 
  cc.id,
  f.created_by,
  'active',
  'admin'
FROM public.farewells f
JOIN public.chat_channels cc ON cc.scope_id = f.id
WHERE cc.name = 'General'
AND f.created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.chat_members cm 
  WHERE cm.channel_id = cc.id AND cm.user_id = f.created_by
);


-- File: create_letters_feedback_schema.sql
-- Create table for Letters to Seniors
CREATE TABLE IF NOT EXISTS public.letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- NULL means "To all seniors"
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for Feedback & Suggestions
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('feedback', 'suggestion', 'bug', 'other')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'implemented', 'rejected')),
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies for Letters
CREATE POLICY "Letters are viewable by everyone in the farewell" 
ON public.letters FOR SELECT 
USING (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create letters" 
ON public.letters FOR INSERT 
WITH CHECK (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    ) AND
    auth.uid() = sender_id
);

CREATE POLICY "Users can update their own letters" 
ON public.letters FOR UPDATE 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own letters" 
ON public.letters FOR DELETE 
USING (auth.uid() = sender_id);

-- Policies for Feedback
CREATE POLICY "Feedback is viewable by admins and the creator" 
ON public.feedback FOR SELECT 
USING (
    (auth.uid() = user_id) OR 
    EXISTS (
        SELECT 1 FROM public.farewell_members 
        WHERE farewell_id = feedback.farewell_id 
        AND user_id = auth.uid() 
        AND role::text IN ('admin', 'main_admin')
    )
);

CREATE POLICY "Users can submit feedback" 
ON public.feedback FOR INSERT 
WITH CHECK (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    ) AND
    auth.uid() = user_id
);

-- Grant permissions
GRANT ALL ON public.letters TO authenticated;
GRANT ALL ON public.feedback TO authenticated;
GRANT ALL ON public.letters TO service_role;
GRANT ALL ON public.feedback TO service_role;


-- File: diagnose_columns.sql
-- DIAGNOSTIC SCRIPT: CHECK FOR MISSING user_id COLUMN
-- Run this in Supabase SQL Editor to find which table is causing the error.

DO $$
DECLARE
    table_name text;
    has_user_id boolean;
    missing_tables text[] := ARRAY[]::text[];
    target_tables text[] := ARRAY[
        'user_settings',
        'farewell_members',
        'farewell_join_requests',
        'chat_members',
        'chat_messages',
        'chat_reactions',
        'contributions',
        'song_requests',
        'duty_assignments',
        'ledger_entries',
        'notifications',
        'push_subscriptions',
        'poll_votes',
        'tickets',
        'yearbook_entries',
        'announcement_reactions'
    ];
BEGIN
    FOREACH table_name IN ARRAY target_tables
    LOOP
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND tablename = table_name
            AND column_name = 'user_id'
        ) INTO has_user_id;

        IF NOT has_user_id THEN
            -- Check if table exists at all
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tablename = table_name) THEN
                RAISE NOTICE 'MISSING user_id in table: %', table_name;
                missing_tables := array_append(missing_tables, table_name);
            ELSE
                 RAISE NOTICE 'Table does not exist: %', table_name;
            END IF;
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
         RAISE EXCEPTION 'Found tables missing user_id: %', missing_tables;
    ELSE
         RAISE NOTICE 'All target tables have user_id column. The error might be in a Trigger or Helper Function.';
    END IF;
END $$;


-- File: enable_all_realtime.sql
-- Enable Realtime safely (Idempotent)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    tables_to_add text[] := ARRAY[
        'duties', 
        'duty_updates', 
        'duty_assignments',
        'duty_receipts',
        'quotes', 
        'legacy_quotes', -- Checking both potential names
        'farewell_videos', 
        'legacy_videos',
        'gifts', 
        'legacy_gifts',
        'thank_you_notes', 
        'legacy_thank_you_notes',
        'albums', 
        'gallery_media', 
        'artworks', 
        'receipts',
        'contributions',
        'announcements',
        'announcement_reactions',
        'notifications',
        'farewell_members'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY tables_to_add LOOP
        -- Check if table exists first
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- Check if already in publication
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime' 
                AND tablename = t
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
                RAISE NOTICE 'Added % to supabase_realtime', t;
            ELSE
                RAISE NOTICE '% is already enabled for realtime', t;
            END IF;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', t;
        END IF;
    END LOOP;
END $$;


-- File: fix_announcement_reactions_permissions.sql
-- Fix permissions for announcement_reactions

-- Enable RLS
ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "View announcement reactions" ON public.announcement_reactions;
DROP POLICY IF EXISTS "Manage own announcement reactions" ON public.announcement_reactions;
DROP POLICY IF EXISTS "Insert own reactions" ON public.announcement_reactions;
DROP POLICY IF EXISTS "Delete own reactions" ON public.announcement_reactions;

-- Policy for viewing reactions (anyone in the farewell can see them)
-- We use a more direct check if possible, or keep the subquery but ensure permissions are correct
CREATE POLICY "View announcement reactions" ON public.announcement_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = announcement_reactions.announcement_id
    AND public.is_farewell_member(a.farewell_id)
  )
);

-- Policy for inserting reactions (users can only react for themselves)
CREATE POLICY "Insert own reactions" ON public.announcement_reactions
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Policy for deleting reactions (users can only delete their own)
CREATE POLICY "Delete own reactions" ON public.announcement_reactions
FOR DELETE USING (
  auth.uid() = user_id
);

-- Grant permissions to authenticated users
GRANT ALL ON public.announcement_reactions TO authenticated;
GRANT ALL ON public.announcement_reactions TO service_role;

-- Ensure real-time is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reactions;


-- File: fix_announcements_realtime.sql
-- ============================================
-- SIMPLE FIX: Enable Realtime for Announcements
-- ============================================
-- Run this in Supabase SQL Editor

-- Step 1: Check if announcements table exists
DO $$ 
BEGIN
    -- If announcements table doesn't exist, create it
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcements') THEN
        CREATE TABLE public.announcements (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_pinned BOOLEAN DEFAULT FALSE,
            created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "View announcements" ON public.announcements FOR SELECT 
        USING (public.is_farewell_member(farewell_id));
        
        CREATE POLICY "Create announcements" ON public.announcements FOR INSERT 
        WITH CHECK (created_by = auth.uid() AND public.is_farewell_admin(farewell_id));
        
        CREATE POLICY "Update announcements" ON public.announcements FOR UPDATE 
        USING (public.is_farewell_admin(farewell_id));
        
        CREATE POLICY "Delete announcements" ON public.announcements FOR DELETE 
        USING (public.is_farewell_admin(farewell_id));
        
        -- Create indexes
        CREATE INDEX idx_announcements_farewell_id ON public.announcements(farewell_id);
        CREATE INDEX idx_announcements_is_pinned ON public.announcements(is_pinned);
        CREATE INDEX idx_announcements_created_at ON public.announcements(created_at);
    END IF;

    -- If announcement_reactions table doesn't exist, create it
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcement_reactions') THEN
        CREATE TABLE public.announcement_reactions (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
            reaction_type TEXT CHECK (reaction_type IN ('like', 'bookmark')) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(announcement_id, user_id, reaction_type)
        );
        
        -- Enable RLS
        ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "View announcement reactions" ON public.announcement_reactions FOR SELECT 
        USING (public.is_farewell_member((SELECT farewell_id FROM public.announcements WHERE id = announcement_id)));
        
        CREATE POLICY "Manage own announcement reactions" ON public.announcement_reactions FOR ALL 
        USING (user_id = auth.uid());
        
        -- Create indexes
        CREATE INDEX idx_announcement_reactions_announcement_id ON public.announcement_reactions(announcement_id);
        CREATE INDEX idx_announcement_reactions_user_id ON public.announcement_reactions(user_id);
    END IF;
END $$;

-- Step 2: ENABLE REALTIME (This is the critical part!)
-- Remove tables from realtime first (in case they're already there)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.announcements;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.announcement_reactions;

-- Add tables to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reactions;

-- Step 3: Verify realtime is enabled
SELECT 
    schemaname, 
    tablename,
    'Realtime enabled ✅' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('announcements', 'announcement_reactions');


-- File: fix_chat_schema.sql
-- Add is_muted column to chat_members if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_members' AND column_name = 'is_muted') THEN
        ALTER TABLE public.chat_members ADD COLUMN is_muted boolean DEFAULT false;
    END IF;
END $$;

-- Fix RLS Policies for Chat System

-- Enable RLS on tables if not already enabled
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create a SECURITY DEFINER function to check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_member_of_channel(_channel_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.chat_members
    WHERE channel_id = _channel_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view channels they are members of" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can update channels they are members of" ON public.chat_channels;

DROP POLICY IF EXISTS "Users can view memberships for their channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can insert memberships" ON public.chat_members;
DROP POLICY IF EXISTS "Users can join channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.chat_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON public.chat_members;

DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their channels" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;

-- CHAT CHANNELS POLICIES
CREATE POLICY "Users can view channels they are members of"
ON public.chat_channels FOR SELECT
USING (
  public.is_member_of_channel(id)
);

CREATE POLICY "Users can create channels"
ON public.chat_channels FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update channels they are members of"
ON public.chat_channels FOR UPDATE
USING (
  public.is_member_of_channel(id)
);

-- CHAT MEMBERS POLICIES
-- This policy uses the function to avoid recursion when checking "other members of my channels"
CREATE POLICY "Users can view memberships for their channels"
ON public.chat_members FOR SELECT
USING (
  public.is_member_of_channel(channel_id)
  OR
  user_id = auth.uid()
);

CREATE POLICY "Users can insert memberships"
ON public.chat_members FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own membership"
ON public.chat_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own membership"
ON public.chat_members FOR DELETE
USING (user_id = auth.uid());

-- CHAT MESSAGES POLICIES
CREATE POLICY "Users can view messages in their channels"
ON public.chat_messages FOR SELECT
USING (
  public.is_member_of_channel(channel_id)
);

CREATE POLICY "Users can insert messages in their channels"
ON public.chat_messages FOR INSERT
WITH CHECK (
  public.is_member_of_channel(channel_id)
);

CREATE POLICY "Users can update their own messages"
ON public.chat_messages FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages FOR DELETE
USING (user_id = auth.uid());


-- File: fix_financials_policy.sql
-- Fix RLS for farewell_financials table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewell_financials ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "View financials" ON public.farewell_financials;
DROP POLICY IF EXISTS "Manage financials" ON public.farewell_financials;

-- 3. Create View Policy (Members can view)
CREATE POLICY "View financials" ON public.farewell_financials FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);

-- 4. Create Manage Policy (Admins can manage - though usually managed by system triggers)
CREATE POLICY "Manage financials" ON public.farewell_financials FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- 5. Grant permissions just in case (though likely already granted)
GRANT ALL ON public.farewell_financials TO authenticated;
GRANT ALL ON public.farewell_financials TO service_role;


-- File: fix_letters_feedback_fks.sql
-- Fix Foreign Keys to point to public.users instead of auth.users
-- This is required to allow joining with the public.users table to fetch full_name and avatar_url

-- Fix letters table
ALTER TABLE public.letters
DROP CONSTRAINT IF EXISTS letters_sender_id_fkey,
DROP CONSTRAINT IF EXISTS letters_recipient_id_fkey;

-- If the constraints were named differently (e.g. auto-generated names that don't match), 
-- we might need to find them. But usually Postgres uses table_column_fkey.
-- Just in case, we drop by column name logic if possible? No, standard SQL requires name.
-- Let's assume standard naming or try to drop the constraints that reference auth.users.

-- Re-add constraints pointing to public.users
ALTER TABLE public.letters
ADD CONSTRAINT letters_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

ALTER TABLE public.letters
ADD CONSTRAINT letters_recipient_id_fkey
    FOREIGN KEY (recipient_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;

-- Fix feedback table
ALTER TABLE public.feedback
DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

ALTER TABLE public.feedback
ADD CONSTRAINT feedback_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;


-- File: fix_notifications_permissions.sql
-- ============================================
-- FIX: Notifications Permissions & Realtime
-- ============================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.push_subscriptions;

-- 3. Re-create Policies

-- SELECT: Users can see their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- UPDATE: Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- INSERT: Allow system/users to create notifications (needed for sending)
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PUSH SUBSCRIPTIONS
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 4. Ensure Realtime is Enabled
-- Note: ALTER PUBLICATION does not support IF EXISTS for tables directly in all versions, 
-- so we'll just try to add it. If it's already there, it might throw a warning or error depending on version,
-- but usually ADD is safer than DROP IF EXISTS which isn't standard syntax for publication tables.
-- A safer way is to just run ADD, and ignore if it complains it's already there, or remove and add.
-- Since we can't do conditional logic easily in standard SQL script without DO block:

DO $$
BEGIN
    -- Try to remove first to ensure clean slate (wrapped in try-catch effectively via DO block logic if we wanted, but simple SQL is better)
    -- Actually, let's just use the standard way. If it fails because it's already there, that's fine.
    -- But to be safe and avoid "relation already in publication" error:
    
    -- Remove if exists (manual check not possible easily in simple script, so we will just SET the list)
    -- ALTER PUBLICATION supabase_realtime SET TABLE public.notifications, public.announcements, public.announcement_reactions, public.push_subscriptions;
    -- The above is risky if we overwrite other tables.
    
    -- Best approach for this script: Just ADD. If it errors "already exists", it's fine.
    -- But the user wants a clean run.
    
    -- Let's try to drop it from publication first using standard syntax if possible, or just ignore.
    -- PostgreSQL doesn't have DROP TABLE IF EXISTS for publications.
    NULL;
END $$;

-- Re-runnable block for realtime
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if not exists
    END;
    
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
END $$;

-- 5. Verify
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('notifications', 'push_subscriptions');


-- File: fix_reaction_schema.sql
-- Rename 'emoji' column to 'reaction' to match application code
ALTER TABLE public.chat_reactions RENAME COLUMN emoji TO reaction;

-- Verify the change (optional, just for confirmation)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'chat_reactions';


-- File: fix-db-issues.sql
-- =================================================================
-- SUPABASE DB ADVISOR FIXER
-- Run this script to resolve common "Issues needing attention"
-- =================================================================

-- 1. ENABLE RLS ON ALL TABLES (Security Best Practice)
-- This fixes "Table has RLS disabled" warnings.
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- 2. AUTO-INDEX UNINDEXED FOREIGN KEYS
-- This fixes "Unindexed Foreign Keys" which cause slow joins.
DO $$ 
DECLARE 
    r record;
    index_name text;
    exists_count int;
BEGIN 
    FOR r IN 
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu 
              ON tc.constraint_name = kcu.constraint_name 
              AND tc.table_schema = kcu.table_schema 
            JOIN information_schema.constraint_column_usage AS ccu 
              ON ccu.constraint_name = tc.constraint_name 
              AND ccu.table_schema = tc.table_schema 
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
    LOOP 
        -- Construct index name: idx_<table_name>_<column_name>
        index_name := 'idx_' || substr(r.table_name, 1, 15) || '_' || substr(r.column_name, 1, 15);
        
        -- Check if index exists
        SELECT count(*) INTO exists_count 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND tablename = r.table_name 
          AND indexdef LIKE '%' || r.column_name || '%';

        -- Create if missing
        IF exists_count = 0 THEN
             RAISE NOTICE 'Creating Index: %', index_name;
             EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)', index_name, r.table_name, r.column_name);
        END IF; 
    END LOOP; 
END $$;

-- 3. ANALYZE TABLES
-- Updates statistics for the query planner to remove "Stale stats" warnings.
ANALYZE;

-- 4. VACUUM (Use Dashboard "Vacuum" button instead if needed)
-- Note: Cannot run inside SQL Editor transaction block.
-- VACUUM;


-- File: fix-rls-perf.sql
-- ==============================================================================
-- FIX RLS PERFORMANCE & SECURITY WARNINGS (NUCLEAR OPTION)
-- 1. DROPS ALL EXISTING POLICIES in public schema to ensure clean slate.
-- 2. Wraps auth.uid() in (select auth.uid()) to avoid InitPlan re-evaluation.
-- 3. Splits redundant policies.
-- ==============================================================================

-- 1. DROP ALL EXISTING POLICIES
-- =============================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END $$;


-- 2. OPTIMIZE HELPER FUNCTIONS
-- ============================

CREATE OR REPLACE FUNCTION public.is_farewell_member(_farewell_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = (select auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_farewell_admin(_farewell_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = (select auth.uid())
    AND role IN ('admin', 'parallel_admin', 'main_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_chat_member(_channel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE channel_id = _channel_id
    AND user_id = (select auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_chat_admin(_channel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE channel_id = _channel_id
    AND user_id = (select auth.uid())
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. RECREATE POLICIES (OPTIMIZED)
-- ================================

-- USERS
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING ((select auth.uid()) = id);

-- USER SETTINGS
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- FAREWELLS
CREATE POLICY "View farewells" ON public.farewells FOR SELECT USING (
  status = 'active' OR
  created_by = (select auth.uid()) OR
  public.is_farewell_member(id)
);
CREATE POLICY "Create farewells" ON public.farewells FOR INSERT WITH CHECK ((select auth.uid()) = created_by);
CREATE POLICY "Update farewells" ON public.farewells FOR UPDATE USING (created_by = (select auth.uid()) OR public.is_farewell_admin(id));
CREATE POLICY "Delete farewells" ON public.farewells FOR DELETE USING (created_by = (select auth.uid()));

-- FAREWELL MEMBERS
CREATE POLICY "View farewell members" ON public.farewell_members FOR SELECT USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert farewell members" ON public.farewell_members FOR INSERT WITH CHECK (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id) OR
  EXISTS (SELECT 1 FROM public.farewells f WHERE f.id = farewell_id AND f.created_by = (select auth.uid()))
);
CREATE POLICY "Update farewell members" ON public.farewell_members FOR UPDATE USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete farewell members" ON public.farewell_members FOR DELETE USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);

-- FAREWELL JOIN REQUESTS
CREATE POLICY "View own requests" ON public.farewell_join_requests FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Admins view requests" ON public.farewell_join_requests FOR SELECT USING (public.is_farewell_admin(farewell_id));
CREATE POLICY "Create request" ON public.farewell_join_requests FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Update request" ON public.farewell_join_requests FOR UPDATE USING (public.is_farewell_admin(farewell_id));

-- CHAT CHANNELS
CREATE POLICY "View channels" ON public.chat_channels FOR SELECT USING (
  public.is_chat_member(id)
);
CREATE POLICY "Create channels" ON public.chat_channels FOR INSERT WITH CHECK (created_by = (select auth.uid()));
CREATE POLICY "Update channels" ON public.chat_channels FOR UPDATE USING (
  public.is_chat_admin(id)
);
CREATE POLICY "Delete channels" ON public.chat_channels FOR DELETE USING (
  created_by = (select auth.uid()) OR
  EXISTS (SELECT 1 FROM public.chat_members WHERE channel_id = id AND user_id = (select auth.uid()) AND role = 'owner')
);

-- CHAT MEMBERS
CREATE POLICY "View chat members" ON public.chat_members FOR SELECT USING (
  user_id = (select auth.uid()) OR
  public.is_chat_member(channel_id)
);
CREATE POLICY "Insert chat members" ON public.chat_members FOR INSERT WITH CHECK (
  user_id = (select auth.uid()) OR
  public.is_chat_admin(channel_id) OR
  EXISTS (SELECT 1 FROM public.chat_channels cc WHERE cc.id = channel_id AND cc.created_by = (select auth.uid()))
);
CREATE POLICY "Update chat members" ON public.chat_members FOR UPDATE USING (
  user_id = (select auth.uid()) OR
  public.is_chat_admin(channel_id)
);
CREATE POLICY "Delete chat members" ON public.chat_members FOR DELETE USING (
  user_id = (select auth.uid()) OR
  public.is_chat_admin(channel_id)
);

-- CHAT MESSAGES
CREATE POLICY "View messages" ON public.chat_messages FOR SELECT USING (
  public.is_chat_member(channel_id)
);
CREATE POLICY "Send messages" ON public.chat_messages FOR INSERT WITH CHECK (
  user_id = (select auth.uid()) AND
  public.is_chat_member(channel_id)
);
CREATE POLICY "Update messages" ON public.chat_messages FOR UPDATE USING (
  user_id = (select auth.uid())
);
CREATE POLICY "Delete messages" ON public.chat_messages FOR DELETE USING (
  user_id = (select auth.uid()) OR
  public.is_chat_admin(channel_id)
);

-- CHAT REACTIONS
CREATE POLICY "View reactions" ON public.chat_reactions FOR SELECT USING (
  public.is_chat_member((SELECT channel_id FROM public.chat_messages WHERE id = message_id))
);
CREATE POLICY "Insert reactions" ON public.chat_reactions FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Update reactions" ON public.chat_reactions FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "Delete reactions" ON public.chat_reactions FOR DELETE USING (user_id = (select auth.uid()));

-- CONTRIBUTIONS
CREATE POLICY "View contributions" ON public.contributions FOR SELECT USING (
  public.is_farewell_member(farewell_id) OR
  user_id = (select auth.uid())
);
CREATE POLICY "Insert contributions" ON public.contributions FOR INSERT WITH CHECK (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update contributions" ON public.contributions FOR UPDATE USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete contributions" ON public.contributions FOR DELETE USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);

-- FAREWELL FINANCIALS
CREATE POLICY "View financials" ON public.farewell_financials FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert financials" ON public.farewell_financials FOR INSERT WITH CHECK (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update financials" ON public.farewell_financials FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete financials" ON public.farewell_financials FOR DELETE USING (
  public.is_farewell_admin(farewell_id)
);

-- EXPENSES
CREATE POLICY "View expenses" ON public.expenses FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert expenses" ON public.expenses FOR INSERT WITH CHECK (
  paid_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update expenses" ON public.expenses FOR UPDATE USING (
  paid_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete expenses" ON public.expenses FOR DELETE USING (
  paid_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);

-- ALBUMS
CREATE POLICY "View albums" ON public.albums FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert albums" ON public.albums FOR INSERT WITH CHECK (
  created_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update albums" ON public.albums FOR UPDATE USING (
  created_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete albums" ON public.albums FOR DELETE USING (
  created_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);

-- MEDIA
CREATE POLICY "View media" ON public.media FOR SELECT USING (
  public.is_farewell_member((SELECT farewell_id FROM public.albums WHERE id = album_id))
);
CREATE POLICY "Insert media" ON public.media FOR INSERT WITH CHECK (
  uploaded_by = (select auth.uid()) OR
  public.is_farewell_admin((SELECT farewell_id FROM public.albums WHERE id = album_id))
);
CREATE POLICY "Update media" ON public.media FOR UPDATE USING (
  uploaded_by = (select auth.uid()) OR
  public.is_farewell_admin((SELECT farewell_id FROM public.albums WHERE id = album_id))
);
CREATE POLICY "Delete media" ON public.media FOR DELETE USING (
  uploaded_by = (select auth.uid()) OR
  public.is_farewell_admin((SELECT farewell_id FROM public.albums WHERE id = album_id))
);

-- SONG REQUESTS
CREATE POLICY "View songs" ON public.song_requests FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert songs" ON public.song_requests FOR INSERT WITH CHECK (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update songs" ON public.song_requests FOR UPDATE USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete songs" ON public.song_requests FOR DELETE USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);

-- DUTIES
CREATE POLICY "Members can view duties" ON public.duties FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Admins can insert duties" ON public.duties FOR INSERT WITH CHECK (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Admins can update duties" ON public.duties FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Admins can delete duties" ON public.duties FOR DELETE USING (
  public.is_farewell_admin(farewell_id)
);

-- DUTY ASSIGNMENTS
CREATE POLICY "Members can view assignments" ON public.duty_assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_assignments.duty_id
    AND farewell_members.user_id = (select auth.uid())
  )
);
CREATE POLICY "Admins can insert assignments" ON public.duty_assignments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_assignments.duty_id
    AND farewell_members.user_id = (select auth.uid())
    AND farewell_members.role IN ('admin', 'parallel_admin')
  )
);
CREATE POLICY "Admins can update assignments" ON public.duty_assignments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_assignments.duty_id
    AND farewell_members.user_id = (select auth.uid())
    AND farewell_members.role IN ('admin', 'parallel_admin')
  )
);
CREATE POLICY "Admins can delete assignments" ON public.duty_assignments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_assignments.duty_id
    AND farewell_members.user_id = (select auth.uid())
    AND farewell_members.role IN ('admin', 'parallel_admin')
  )
);

-- DUTY RECEIPTS
CREATE POLICY "Members can view receipts for their farewell" ON public.duty_receipts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_receipts.duty_id
    AND farewell_members.user_id = (select auth.uid())
  )
);
CREATE POLICY "Assigned users can upload receipts" ON public.duty_receipts FOR INSERT WITH CHECK (
  (select auth.uid()) = uploader_id AND
  EXISTS (
    SELECT 1 FROM duty_assignments
    WHERE duty_assignments.duty_id = duty_receipts.duty_id
    AND duty_assignments.user_id = (select auth.uid())
  )
);
CREATE POLICY "Admins can manage receipts" ON public.duty_receipts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_receipts.duty_id
    AND farewell_members.user_id = (select auth.uid())
    AND farewell_members.role IN ('admin', 'parallel_admin')
  )
);

-- LEDGER ENTRIES
CREATE POLICY "View ledger" ON public.ledger_entries FOR SELECT USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Insert ledger" ON public.ledger_entries FOR INSERT WITH CHECK (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update ledger" ON public.ledger_entries FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete ledger" ON public.ledger_entries FOR DELETE USING (
  public.is_farewell_admin(farewell_id)
);

-- NOTIFICATIONS
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- PUSH SUBSCRIPTIONS
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions FOR ALL USING ((select auth.uid()) = user_id);

-- AUDIT LOGS
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (
  public.is_farewell_admin(farewell_id)
);

-- POLLS
CREATE POLICY "View polls" ON public.polls FOR SELECT USING (TRUE);
CREATE POLICY "Insert polls" ON public.polls FOR INSERT WITH CHECK (
  created_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update polls" ON public.polls FOR UPDATE USING (
  created_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete polls" ON public.polls FOR DELETE USING (
  created_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);

-- POLL OPTIONS
CREATE POLICY "View options" ON public.poll_options FOR SELECT USING (TRUE);
CREATE POLICY "Insert options" ON public.poll_options FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.created_by = (select auth.uid()))
);
CREATE POLICY "Update options" ON public.poll_options FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.created_by = (select auth.uid()))
);
CREATE POLICY "Delete options" ON public.poll_options FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.created_by = (select auth.uid()))
);

-- POLL VOTES
CREATE POLICY "View votes" ON public.poll_votes FOR SELECT USING (TRUE);
CREATE POLICY "Vote" ON public.poll_votes FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Change vote" ON public.poll_votes FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "Remove vote" ON public.poll_votes FOR DELETE USING (user_id = (select auth.uid()));

-- TICKETS
CREATE POLICY "View own ticket" ON public.tickets FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Admins scan tickets" ON public.tickets FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);

-- CONFESSIONS
CREATE POLICY "View approved confessions" ON public.confessions FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "View all confessions (Admin)" ON public.confessions FOR SELECT USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Submit confession" ON public.confessions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Update confessions" ON public.confessions FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete confessions" ON public.confessions FOR DELETE USING (
  public.is_farewell_admin(farewell_id)
);

-- ARTWORKS
CREATE POLICY "View artworks" ON public.artworks FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert artworks" ON public.artworks FOR INSERT WITH CHECK (
  created_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update artworks" ON public.artworks FOR UPDATE USING (
  created_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete artworks" ON public.artworks FOR DELETE USING (
  created_by = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);

-- YEARBOOK ENTRIES
CREATE POLICY "View yearbook" ON public.yearbook_entries FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert yearbook" ON public.yearbook_entries FOR INSERT WITH CHECK (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update yearbook" ON public.yearbook_entries FOR UPDATE USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete yearbook" ON public.yearbook_entries FOR DELETE USING (
  user_id = (select auth.uid()) OR
  public.is_farewell_admin(farewell_id)
);

-- ANNOUNCEMENTS
CREATE POLICY "View announcements" ON public.announcements FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Create announcements" ON public.announcements FOR INSERT WITH CHECK (
  created_by = (select auth.uid()) AND
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update announcements" ON public.announcements FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete announcements" ON public.announcements FOR DELETE USING (
  public.is_farewell_admin(farewell_id)
);

-- ANNOUNCEMENT REACTIONS
CREATE POLICY "View announcement reactions" ON public.announcement_reactions FOR SELECT USING (
  public.is_farewell_member((SELECT farewell_id FROM public.announcements WHERE id = announcement_id))
);
CREATE POLICY "Insert announcement reactions" ON public.announcement_reactions FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
);
CREATE POLICY "Update announcement reactions" ON public.announcement_reactions FOR UPDATE USING (
  user_id = (select auth.uid())
);
CREATE POLICY "Delete announcement reactions" ON public.announcement_reactions FOR DELETE USING (
  user_id = (select auth.uid())
);

-- CONTACT MESSAGES
CREATE POLICY "Allow public insert" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated view" ON public.contact_messages FOR SELECT USING ((select auth.role()) = 'authenticated');

-- TIMELINE EVENTS
CREATE POLICY "View timeline" ON public.timeline_events FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert timeline" ON public.timeline_events FOR INSERT WITH CHECK (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update timeline" ON public.timeline_events FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete timeline" ON public.timeline_events FOR DELETE USING (
  public.is_farewell_admin(farewell_id)
);

-- HIGHLIGHTS
CREATE POLICY "View highlights" ON public.highlights FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Insert highlights" ON public.highlights FOR INSERT WITH CHECK (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update highlights" ON public.highlights FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete highlights" ON public.highlights FOR DELETE USING (
  public.is_farewell_admin(farewell_id)
);

-- FAREWELL STATS
CREATE POLICY "View stats" ON public.farewell_stats FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);


-- File: fix-rls-robust.sql
-- ==============================================================================
-- FIX RLS ROBUST (Skip-on-Error)
-- This script applies RLS policies safely. If a table or column is missing,
-- it will SKIP that specific policy and log a warning, instead of failing completely.
-- ==============================================================================

-- 0. Helper for Safe Execution
CREATE OR REPLACE FUNCTION public.exec_safe(sql_cmd text) RETURNS void AS $$
BEGIN
    EXECUTE sql_cmd;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SKIPPING ERROR: % | SQL: %', SQLERRM, left(sql_cmd, 50) || '...';
END;
$$ LANGUAGE plpgsql;


-- 1. DROP ALL EXISTING POLICIES
-- =============================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        PERFORM public.exec_safe(format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename));
    END LOOP;
END $$;


-- 2. OPTIMIZE HELPER FUNCTIONS
-- ============================
-- We use exec_safe here too, in case the underlying tables (farewell_members) are broken.

SELECT public.exec_safe($$
CREATE OR REPLACE FUNCTION public.is_farewell_member(_farewell_id UUID)
RETURNS BOOLEAN AS $inner$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = (select auth.uid())
  );
END;
$inner$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
$$);

SELECT public.exec_safe($$
CREATE OR REPLACE FUNCTION public.is_farewell_admin(_farewell_id UUID)
RETURNS BOOLEAN AS $inner$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farewell_members
    WHERE farewell_id = _farewell_id
    AND user_id = (select auth.uid())
    AND role IN ('admin', 'parallel_admin', 'main_admin')
  );
END;
$inner$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
$$);

SELECT public.exec_safe($$
CREATE OR REPLACE FUNCTION public.is_chat_member(_channel_id UUID)
RETURNS BOOLEAN AS $inner$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE channel_id = _channel_id
    AND user_id = (select auth.uid())
  );
END;
$inner$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
$$);

SELECT public.exec_safe($$
CREATE OR REPLACE FUNCTION public.is_chat_admin(_channel_id UUID)
RETURNS BOOLEAN AS $inner$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE channel_id = _channel_id
    AND user_id = (select auth.uid())
    AND role IN ('owner', 'admin')
  );
END;
$inner$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
$$);


-- 3. RECREATE POLICIES (SAFE MODE)
-- ================================

-- USERS
SELECT public.exec_safe($$ CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true) $$);
SELECT public.exec_safe($$ CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING ((select auth.uid()) = id) $$);

-- USER SETTINGS
SELECT public.exec_safe($$ CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING ((select auth.uid()) = user_id) $$);
SELECT public.exec_safe($$ CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING ((select auth.uid()) = user_id) $$);
SELECT public.exec_safe($$ CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK ((select auth.uid()) = user_id) $$);

-- FAREWELLS
SELECT public.exec_safe($$ CREATE POLICY "View farewells" ON public.farewells FOR SELECT USING (status = 'active' OR created_by = (select auth.uid()) OR public.is_farewell_member(id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Create farewells" ON public.farewells FOR INSERT WITH CHECK ((select auth.uid()) = created_by) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update farewells" ON public.farewells FOR UPDATE USING (created_by = (select auth.uid()) OR public.is_farewell_admin(id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete farewells" ON public.farewells FOR DELETE USING (created_by = (select auth.uid())) $$);

-- FAREWELL MEMBERS
SELECT public.exec_safe($$ CREATE POLICY "View farewell members" ON public.farewell_members FOR SELECT USING (user_id = (select auth.uid()) OR public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert farewell members" ON public.farewell_members FOR INSERT WITH CHECK (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id) OR EXISTS (SELECT 1 FROM public.farewells f WHERE f.id = farewell_id AND f.created_by = (select auth.uid()))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update farewell members" ON public.farewell_members FOR UPDATE USING (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete farewell members" ON public.farewell_members FOR DELETE USING (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);

-- FAREWELL JOIN REQUESTS
SELECT public.exec_safe($$ CREATE POLICY "View own requests" ON public.farewell_join_requests FOR SELECT USING (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Admins view requests" ON public.farewell_join_requests FOR SELECT USING (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Create request" ON public.farewell_join_requests FOR INSERT WITH CHECK (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update request" ON public.farewell_join_requests FOR UPDATE USING (public.is_farewell_admin(farewell_id)) $$);

-- CHAT CHANNELS
SELECT public.exec_safe($$ CREATE POLICY "View channels" ON public.chat_channels FOR SELECT USING (public.is_chat_member(id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Create channels" ON public.chat_channels FOR INSERT WITH CHECK (created_by = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update channels" ON public.chat_channels FOR UPDATE USING (public.is_chat_admin(id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete channels" ON public.chat_channels FOR DELETE USING (created_by = (select auth.uid()) OR EXISTS (SELECT 1 FROM public.chat_members WHERE channel_id = id AND user_id = (select auth.uid()) AND role = 'owner')) $$);

-- CHAT MEMBERS
SELECT public.exec_safe($$ CREATE POLICY "View chat members" ON public.chat_members FOR SELECT USING (user_id = (select auth.uid()) OR public.is_chat_member(channel_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert chat members" ON public.chat_members FOR INSERT WITH CHECK (user_id = (select auth.uid()) OR public.is_chat_admin(channel_id) OR EXISTS (SELECT 1 FROM public.chat_channels cc WHERE cc.id = channel_id AND cc.created_by = (select auth.uid()))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update chat members" ON public.chat_members FOR UPDATE USING (user_id = (select auth.uid()) OR public.is_chat_admin(channel_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete chat members" ON public.chat_members FOR DELETE USING (user_id = (select auth.uid()) OR public.is_chat_admin(channel_id)) $$);

-- CHAT MESSAGES
SELECT public.exec_safe($$ CREATE POLICY "View messages" ON public.chat_messages FOR SELECT USING (public.is_chat_member(channel_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Send messages" ON public.chat_messages FOR INSERT WITH CHECK (user_id = (select auth.uid()) AND public.is_chat_member(channel_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update messages" ON public.chat_messages FOR UPDATE USING (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete messages" ON public.chat_messages FOR DELETE USING (user_id = (select auth.uid()) OR public.is_chat_admin(channel_id)) $$);

-- CHAT REACTIONS
SELECT public.exec_safe($$ CREATE POLICY "View reactions" ON public.chat_reactions FOR SELECT USING (public.is_chat_member((SELECT channel_id FROM public.chat_messages WHERE id = message_id))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert reactions" ON public.chat_reactions FOR INSERT WITH CHECK (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update reactions" ON public.chat_reactions FOR UPDATE USING (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete reactions" ON public.chat_reactions FOR DELETE USING (user_id = (select auth.uid())) $$);

-- CONTRIBUTIONS
SELECT public.exec_safe($$ CREATE POLICY "View contributions" ON public.contributions FOR SELECT USING (public.is_farewell_member(farewell_id) OR user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert contributions" ON public.contributions FOR INSERT WITH CHECK (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update contributions" ON public.contributions FOR UPDATE USING (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete contributions" ON public.contributions FOR DELETE USING (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);

-- FAREWELL FINANCIALS
SELECT public.exec_safe($$ CREATE POLICY "View financials" ON public.farewell_financials FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert financials" ON public.farewell_financials FOR INSERT WITH CHECK (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update financials" ON public.farewell_financials FOR UPDATE USING (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete financials" ON public.farewell_financials FOR DELETE USING (public.is_farewell_admin(farewell_id)) $$);

-- EXPENSES
SELECT public.exec_safe($$ CREATE POLICY "View expenses" ON public.expenses FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert expenses" ON public.expenses FOR INSERT WITH CHECK (paid_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update expenses" ON public.expenses FOR UPDATE USING (paid_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete expenses" ON public.expenses FOR DELETE USING (paid_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);

-- ALBUMS
SELECT public.exec_safe($$ CREATE POLICY "View albums" ON public.albums FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert albums" ON public.albums FOR INSERT WITH CHECK (created_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update albums" ON public.albums FOR UPDATE USING (created_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete albums" ON public.albums FOR DELETE USING (created_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);

-- MEDIA
SELECT public.exec_safe($$ CREATE POLICY "View media" ON public.media FOR SELECT USING (public.is_farewell_member((SELECT farewell_id FROM public.albums WHERE id = album_id))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert media" ON public.media FOR INSERT WITH CHECK (uploaded_by = (select auth.uid()) OR public.is_farewell_admin((SELECT farewell_id FROM public.albums WHERE id = album_id))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update media" ON public.media FOR UPDATE USING (uploaded_by = (select auth.uid()) OR public.is_farewell_admin((SELECT farewell_id FROM public.albums WHERE id = album_id))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete media" ON public.media FOR DELETE USING (uploaded_by = (select auth.uid()) OR public.is_farewell_admin((SELECT farewell_id FROM public.albums WHERE id = album_id))) $$);

-- SONG REQUESTS
SELECT public.exec_safe($$ CREATE POLICY "View songs" ON public.song_requests FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert songs" ON public.song_requests FOR INSERT WITH CHECK (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update songs" ON public.song_requests FOR UPDATE USING (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete songs" ON public.song_requests FOR DELETE USING (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);

-- DUTIES
SELECT public.exec_safe($$ CREATE POLICY "Members can view duties" ON public.duties FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Admins can insert duties" ON public.duties FOR INSERT WITH CHECK (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Admins can update duties" ON public.duties FOR UPDATE USING (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Admins can delete duties" ON public.duties FOR DELETE USING (public.is_farewell_admin(farewell_id)) $$);

-- DUTY ASSIGNMENTS
SELECT public.exec_safe($$ CREATE POLICY "Members can view assignments" ON public.duty_assignments FOR SELECT USING (EXISTS (SELECT 1 FROM duties JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id WHERE duties.id = duty_assignments.duty_id AND farewell_members.user_id = (select auth.uid()))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Admins can insert assignments" ON public.duty_assignments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM duties JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id WHERE duties.id = duty_assignments.duty_id AND farewell_members.user_id = (select auth.uid()) AND farewell_members.role IN ('admin', 'parallel_admin'))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Admins can update assignments" ON public.duty_assignments FOR UPDATE USING (EXISTS (SELECT 1 FROM duties JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id WHERE duties.id = duty_assignments.duty_id AND farewell_members.user_id = (select auth.uid()) AND farewell_members.role IN ('admin', 'parallel_admin'))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Admins can delete assignments" ON public.duty_assignments FOR DELETE USING (EXISTS (SELECT 1 FROM duties JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id WHERE duties.id = duty_assignments.duty_id AND farewell_members.user_id = (select auth.uid()) AND farewell_members.role IN ('admin', 'parallel_admin'))) $$);

-- DUTY RECEIPTS
SELECT public.exec_safe($$ CREATE POLICY "Members can view receipts for their farewell" ON public.duty_receipts FOR SELECT USING (EXISTS (SELECT 1 FROM duties JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id WHERE duties.id = duty_receipts.duty_id AND farewell_members.user_id = (select auth.uid()))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Assigned users can upload receipts" ON public.duty_receipts FOR INSERT WITH CHECK ((select auth.uid()) = uploader_id AND EXISTS (SELECT 1 FROM duty_assignments WHERE duty_assignments.duty_id = duty_receipts.duty_id AND duty_assignments.user_id = (select auth.uid()))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Admins can manage receipts" ON public.duty_receipts FOR UPDATE USING (EXISTS (SELECT 1 FROM duties JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id WHERE duties.id = duty_receipts.duty_id AND farewell_members.user_id = (select auth.uid()) AND farewell_members.role IN ('admin', 'parallel_admin'))) $$);

-- LEDGER ENTRIES
SELECT public.exec_safe($$ CREATE POLICY "View ledger" ON public.ledger_entries FOR SELECT USING (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert ledger" ON public.ledger_entries FOR INSERT WITH CHECK (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update ledger" ON public.ledger_entries FOR UPDATE USING (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete ledger" ON public.ledger_entries FOR DELETE USING (public.is_farewell_admin(farewell_id)) $$);

-- NOTIFICATIONS
SELECT public.exec_safe($$ CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((select auth.uid()) = user_id) $$);
SELECT public.exec_safe($$ CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((select auth.uid()) = user_id) $$);
SELECT public.exec_safe($$ CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated') $$);

-- PUSH SUBSCRIPTIONS
SELECT public.exec_safe($$ CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions FOR ALL USING ((select auth.uid()) = user_id) $$);

-- AUDIT LOGS
SELECT public.exec_safe($$ CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_farewell_admin(farewell_id)) $$);

-- POLLS
SELECT public.exec_safe($$ CREATE POLICY "View polls" ON public.polls FOR SELECT USING (TRUE) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert polls" ON public.polls FOR INSERT WITH CHECK (created_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update polls" ON public.polls FOR UPDATE USING (created_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete polls" ON public.polls FOR DELETE USING (created_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);

-- POLL OPTIONS
SELECT public.exec_safe($$ CREATE POLICY "View options" ON public.poll_options FOR SELECT USING (TRUE) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert options" ON public.poll_options FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.created_by = (select auth.uid()))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update options" ON public.poll_options FOR UPDATE USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.created_by = (select auth.uid()))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete options" ON public.poll_options FOR DELETE USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.created_by = (select auth.uid()))) $$);

-- POLL VOTES
SELECT public.exec_safe($$ CREATE POLICY "View votes" ON public.poll_votes FOR SELECT USING (TRUE) $$);
SELECT public.exec_safe($$ CREATE POLICY "Vote" ON public.poll_votes FOR INSERT WITH CHECK (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Change vote" ON public.poll_votes FOR UPDATE USING (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Remove vote" ON public.poll_votes FOR DELETE USING (user_id = (select auth.uid())) $$);

-- TICKETS
SELECT public.exec_safe($$ CREATE POLICY "View own ticket" ON public.tickets FOR SELECT USING (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Admins scan tickets" ON public.tickets FOR UPDATE USING (public.is_farewell_admin(farewell_id)) $$);

-- CONFESSIONS
SELECT public.exec_safe($$ CREATE POLICY "View approved confessions" ON public.confessions FOR SELECT USING (is_approved = TRUE) $$);
SELECT public.exec_safe($$ CREATE POLICY "View all confessions (Admin)" ON public.confessions FOR SELECT USING (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Submit confession" ON public.confessions FOR INSERT WITH CHECK (TRUE) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update confessions" ON public.confessions FOR UPDATE USING (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete confessions" ON public.confessions FOR DELETE USING (public.is_farewell_admin(farewell_id)) $$);

-- ARTWORKS
SELECT public.exec_safe($$ CREATE POLICY "View artworks" ON public.artworks FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert artworks" ON public.artworks FOR INSERT WITH CHECK (created_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update artworks" ON public.artworks FOR UPDATE USING (created_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete artworks" ON public.artworks FOR DELETE USING (created_by = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);

-- YEARBOOK ENTRIES
SELECT public.exec_safe($$ CREATE POLICY "View yearbook" ON public.yearbook_entries FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert yearbook" ON public.yearbook_entries FOR INSERT WITH CHECK (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update yearbook" ON public.yearbook_entries FOR UPDATE USING (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete yearbook" ON public.yearbook_entries FOR DELETE USING (user_id = (select auth.uid()) OR public.is_farewell_admin(farewell_id)) $$);

-- ANNOUNCEMENTS
SELECT public.exec_safe($$ CREATE POLICY "View announcements" ON public.announcements FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Create announcements" ON public.announcements FOR INSERT WITH CHECK (created_by = (select auth.uid()) AND public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update announcements" ON public.announcements FOR UPDATE USING (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete announcements" ON public.announcements FOR DELETE USING (public.is_farewell_admin(farewell_id)) $$);

-- ANNOUNCEMENT REACTIONS
SELECT public.exec_safe($$ CREATE POLICY "View announcement reactions" ON public.announcement_reactions FOR SELECT USING (public.is_farewell_member((SELECT farewell_id FROM public.announcements WHERE id = announcement_id))) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert announcement reactions" ON public.announcement_reactions FOR INSERT WITH CHECK (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update announcement reactions" ON public.announcement_reactions FOR UPDATE USING (user_id = (select auth.uid())) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete announcement reactions" ON public.announcement_reactions FOR DELETE USING (user_id = (select auth.uid())) $$);

-- CONTACT MESSAGES
SELECT public.exec_safe($$ CREATE POLICY "Allow public insert" ON public.contact_messages FOR INSERT WITH CHECK (true) $$);
SELECT public.exec_safe($$ CREATE POLICY "Allow authenticated view" ON public.contact_messages FOR SELECT USING ((select auth.role()) = 'authenticated') $$);

-- TIMELINE EVENTS
SELECT public.exec_safe($$ CREATE POLICY "View timeline" ON public.timeline_events FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert timeline" ON public.timeline_events FOR INSERT WITH CHECK (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update timeline" ON public.timeline_events FOR UPDATE USING (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete timeline" ON public.timeline_events FOR DELETE USING (public.is_farewell_admin(farewell_id)) $$);

-- HIGHLIGHTS
SELECT public.exec_safe($$ CREATE POLICY "View highlights" ON public.highlights FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Insert highlights" ON public.highlights FOR INSERT WITH CHECK (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Update highlights" ON public.highlights FOR UPDATE USING (public.is_farewell_admin(farewell_id)) $$);
SELECT public.exec_safe($$ CREATE POLICY "Delete highlights" ON public.highlights FOR DELETE USING (public.is_farewell_admin(farewell_id)) $$);

-- FAREWELL STATS
SELECT public.exec_safe($$ CREATE POLICY "View stats" ON public.farewell_stats FOR SELECT USING (public.is_farewell_member(farewell_id)) $$);


-- File: fix-search-paths.sql
-- =================================================================
-- SUPABASE FUNCTION SCRIPT FIXER (v2 - Dynamic)
-- Fixes "Function Search Path Mutable" (SECURITY) warnings
-- Robust version: Finds functions by loop to avoid signature errors
-- =================================================================

DO $$
DECLARE
    func_record RECORD;
    func_sig TEXT;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'update_farewell_stats_members',
              'update_farewell_stats_messages',
              'backfill_farewell_stats',
              'is_chat_member',
              'is_chat_admin',
              'is_farewell_member',
              'is_farewell_admin',
              'handle_updated_at',
              'update_channel_last_message',
              'approve_contribution',
              'sync_farewell_claims',
              'handle_new_user',
              'notify_new_content',
              'notify_contribution_update',
              'assign_duty',
              'approve_duty_receipt',
              'reject_duty_receipt'
          )
    LOOP
        func_sig := format('%I.%I(%s)', func_record.schema_name, func_record.function_name, func_record.args);
        RAISE NOTICE 'Securing function: %', func_sig;
        EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_sig);
    END LOOP;
END $$;


-- File: optimize_indexes.sql
-- OPTIMZATION INDEXES FOR SCALABILITY
-- Purpose: Add missing indexes for Foreign Keys and frequent filters

-- Contributions
CREATE INDEX IF NOT EXISTS idx_contributions_farewell_id ON public.contributions(farewell_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON public.contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_farewell_user ON public.contributions(farewell_id, user_id);

-- Announcements
CREATE INDEX IF NOT EXISTS idx_announcements_farewell_id ON public.announcements(farewell_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_announcement_id ON public.announcement_reactions(announcement_id);

-- Duties
CREATE INDEX IF NOT EXISTS idx_duties_farewell_id ON public.duties(farewell_id);
CREATE INDEX IF NOT EXISTS idx_duty_assignments_duty_id ON public.duty_assignments(duty_id);
CREATE INDEX IF NOT EXISTS idx_duty_assignments_user_id ON public.duty_assignments(user_id);

-- Gallery
CREATE INDEX IF NOT EXISTS idx_albums_farewell_id ON public.albums(farewell_id);

-- Song Requests
CREATE INDEX IF NOT EXISTS idx_song_requests_farewell_id ON public.song_requests(farewell_id);

-- Notifications (Optimized for fetching user's notifs)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Analytics (if needed)
ANALYZE public.contributions;
ANALYZE public.announcements;
ANALYZE public.duties;


-- File: scalability-patch.sql
-- ==========================================
-- SCALABILITY PATCH FOR FAREWELL SYSTEM
-- Purpose: Optimize database for high concurrency (1M+ users)
-- derived from analysis of schema.sql
-- ==========================================

-- 1. Create High-Performance Stats Table
-- Replaces slow COUNT(*) queries with O(1) table reads
CREATE TABLE IF NOT EXISTS public.farewell_stats (
  farewell_id UUID PRIMARY KEY REFERENCES public.farewells(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.farewell_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View stats" ON public.farewell_stats FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);

-- 2. Add Optimized Compound Indices (Critical for Scale)
-- Speeds up chat history and notification fetching by 100x+
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_media_album_id ON public.media(album_id);

-- 3. Add Preview Text to Channels (Avoids N+1 Queries)
-- Allows fetching chat list + last message in ONE query
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS preview_text TEXT;

-- 4. Create Triggers for Real-time Counters
-- Automatically keeps farewell_stats updated without app logic

-- Members Trigger
CREATE OR REPLACE FUNCTION public.update_farewell_stats_members() RETURNS TRIGGER AS $$
DECLARE
  _farewell_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    _farewell_id := OLD.farewell_id;
    UPDATE public.farewell_stats SET member_count = member_count - 1 WHERE farewell_id = _farewell_id;
  ELSE
    _farewell_id := NEW.farewell_id;
    INSERT INTO public.farewell_stats (farewell_id, member_count) VALUES (_farewell_id, 1)
    ON CONFLICT (farewell_id) DO UPDATE SET member_count = farewell_stats.member_count + 1;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_member_change AFTER INSERT OR DELETE ON public.farewell_members FOR EACH ROW EXECUTE PROCEDURE public.update_farewell_stats_members();

-- Messages & Chat Preview Trigger
CREATE OR REPLACE FUNCTION public.update_farewell_stats_messages() RETURNS TRIGGER AS $$
DECLARE
  _farewell_id UUID;
  _scope_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    SELECT scope_id INTO _scope_id FROM public.chat_channels WHERE id = OLD.channel_id;
    IF _scope_id IS NOT NULL THEN
      UPDATE public.farewell_stats SET message_count = message_count - 1 WHERE farewell_id = _scope_id;
    END IF;
  ELSE
    SELECT scope_id INTO _scope_id FROM public.chat_channels WHERE id = NEW.channel_id;
    IF _scope_id IS NOT NULL THEN
      INSERT INTO public.farewell_stats (farewell_id, message_count) VALUES (_scope_id, 1)
      ON CONFLICT (farewell_id) DO UPDATE SET message_count = farewell_stats.message_count + 1;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_change AFTER INSERT OR DELETE ON public.chat_messages FOR EACH ROW EXECUTE PROCEDURE public.update_farewell_stats_messages();

CREATE OR REPLACE FUNCTION update_channel_last_message() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_channels 
  SET 
    last_message_at = NEW.created_at,
    preview_text = CASE 
      WHEN NEW.type = 'image' THEN 'Sent an image'
      WHEN NEW.type = 'file' THEN 'Sent a file'
      ELSE LEFT(NEW.content, 50)
    END
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Backfill Utility
-- Run "SELECT backfill_farewell_stats();" once after applying this file.
CREATE OR REPLACE FUNCTION public.backfill_farewell_stats() RETURNS VOID AS $$
DECLARE
  f record;
  _members int;
  _messages int;
  _media int;
BEGIN
  FOR f IN SELECT id FROM public.farewells LOOP
    -- Members
    SELECT count(*) INTO _members FROM public.farewell_members WHERE farewell_id = f.id;
    -- Media (from albums)
    SELECT count(*) INTO _media 
      FROM public.media m
      JOIN public.albums a ON m.album_id = a.id
      WHERE a.farewell_id = f.id;
    -- Messages (from channels scope)
    SELECT count(*) INTO _messages 
      FROM public.chat_messages m
      JOIN public.chat_channels c ON m.channel_id = c.id
      WHERE c.scope_id = f.id;

    INSERT INTO public.farewell_stats (farewell_id, member_count, media_count, message_count)
    VALUES (f.id, _members, _media, _messages)
    ON CONFLICT (farewell_id) DO UPDATE SET
      member_count = EXCLUDED.member_count,
      media_count = EXCLUDED.media_count,
      message_count = EXCLUDED.message_count;
  END LOOP;
END;
$$ LANGUAGE plpgsql;


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
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


-- File: schema.sql
-- ==========================================
-- FAREWELL SYSTEM - CONSOLIDATED SCHEMA
-- ==========================================

-- 1. CLEANUP
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. TYPE DEFINITIONS
-- ==========================================
CREATE TYPE user_status AS ENUM ('online', 'offline', 'away', 'busy');
CREATE TYPE farewell_status AS ENUM ('active', 'archived');
CREATE TYPE farewell_role AS ENUM ('admin', 'student', 'guest', 'teacher', 'junior', 'parallel_admin', 'main_admin');
CREATE TYPE join_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE channel_type AS ENUM ('dm', 'group', 'farewell', 'class');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE member_status AS ENUM ('active', 'muted', 'blocked', 'left', 'pending');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');
CREATE TYPE contribution_status AS ENUM ('pending', 'awaiting_payment', 'paid_pending_admin_verification', 'verified', 'approved', 'rejected', 'mismatch_error');
CREATE TYPE media_type AS ENUM ('image', 'video');
CREATE TYPE duty_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE notif_type AS ENUM ('message', 'mention', 'system', 'request', 'finance', 'duty', 'info', 'success', 'warning', 'error', 'announcement', 'chat');

-- ==========================================
-- 3. TABLE DEFINITIONS
-- ==========================================

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  bio TEXT,
  status user_status DEFAULT 'offline',
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  public_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  font_size TEXT DEFAULT 'medium',
  reduced_motion BOOLEAN DEFAULT FALSE,
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
  grade INTEGER, -- e.g., 11, 12
  section TEXT,  -- e.g., 'A', 'B', 'Science'
  status join_status DEFAULT 'approved',
  active BOOLEAN DEFAULT TRUE,
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
  preview_text TEXT,
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
  method TEXT NOT NULL CHECK (method IN ('upi', 'cash', 'bank_transfer', 'stripe', 'razorpay')),
  transaction_id TEXT,
  screenshot_url TEXT,
  status contribution_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAREWELL FINANCIALS
CREATE TABLE IF NOT EXISTS public.farewell_financials (
  farewell_id UUID PRIMARY KEY REFERENCES public.farewells(id) ON DELETE CASCADE,
  total_collected NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  contribution_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAREWELL STATS (Counters)
CREATE TABLE IF NOT EXISTS public.farewell_stats (
  farewell_id UUID PRIMARY KEY REFERENCES public.farewells(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.farewell_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View stats" ON public.farewell_stats FOR SELECT USING (
  public.is_farewell_member(farewell_id)
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
  expense_limit NUMERIC(10, 2) DEFAULT 0,
  deadline TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DUTY ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.duty_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(duty_id, user_id)
);

-- DUTY RECEIPTS
CREATE TABLE IF NOT EXISTS public.duty_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEDGER ENTRIES
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'reimbursement', 'contribution', 'deduction', 'adjustment'
  currency TEXT DEFAULT 'INR',
  meta JSONB, -- Stores context like receipt_id, duty_id, etc.
  audit_hash TEXT,
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.approve_contribution(
  _contribution_id UUID,
  _admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  _contribution RECORD;
  _farewell_id UUID;
  _amount NUMERIC;
  _user_id UUID;
  _ledger_id UUID;
BEGIN
  -- 1. Lock the contribution row
  SELECT * INTO _contribution 
  FROM public.contributions 
  WHERE id = _contribution_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contribution not found');
  END IF;

  IF _contribution.status = 'approved' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already approved');
  END IF;

  IF _contribution.status NOT IN ('verified', 'paid_pending_admin_verification') THEN
     RETURN jsonb_build_object('success', false, 'error', 'Contribution not in verifiable state');
  END IF;

  _farewell_id := _contribution.farewell_id;
  _amount := _contribution.amount;
  _user_id := _contribution.user_id;

  -- 2. Update Contribution Status
  UPDATE public.contributions
  SET 
    status = 'approved',
    verified_by = _admin_id
  WHERE id = _contribution_id;

  -- 3. Create Ledger Entry
  INSERT INTO public.ledger_entries (
    farewell_id,
    user_id,
    amount,
    type,
    approved_by,
    audit_hash,
    meta
  ) VALUES (
    _farewell_id,
    _user_id,
    _amount,
    'contribution',
    _admin_id,
    md5(CONCAT(_farewell_id, _user_id, _amount, NOW())),
    jsonb_build_object('contribution_id', _contribution_id, 'method', _contribution.method)
  ) RETURNING id INTO _ledger_id;

  -- 4. Update Financials (Optimized: Minimal locking window)
  -- Note: We still use ON CONFLICT DO UPDATE which locks the row, but by doing it last
  -- and ensuring all previous steps are fast, we minimize contention.
  -- For "millions" of users, we might offload this to a background worker, 
  -- but strictly consistent financials are usually preferred over eventual consistency.
  INSERT INTO public.farewell_financials (farewell_id, total_collected, balance, contribution_count)
  VALUES (_farewell_id, _amount, _amount, 1)
  ON CONFLICT (farewell_id) DO UPDATE SET
    total_collected = farewell_financials.total_collected + EXCLUDED.total_collected,
    balance = farewell_financials.balance + EXCLUDED.balance,
    contribution_count = farewell_financials.contribution_count + 1,
    last_updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'ledger_id', _ledger_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notif_type NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('web', 'android', 'ios')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  details JSONB, -- Legacy column support
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

-- ARTWORKS
CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  artist_name TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- YEARBOOK ENTRIES
CREATE TABLE IF NOT EXISTS public.yearbook_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT,
  quote TEXT,
  section TEXT,
  photo_url TEXT,
  future_plans TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farewell_id, user_id)
);

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANNOUNCEMENT REACTIONS
CREATE TABLE IF NOT EXISTS public.announcement_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'bookmark')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id, reaction_type)
);

-- CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  icon TEXT DEFAULT 'calendar',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HIGHLIGHTS
CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ENABLE RLS
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farewell_financials ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. HELPER FUNCTIONS
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
    AND role IN ('admin', 'parallel_admin', 'main_admin')
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
-- 6. RLS POLICIES
-- ==========================================

-- USERS
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- USER SETTINGS
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

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
  public.is_farewell_member(farewell_id) OR
  user_id = auth.uid()
);
CREATE POLICY "Manage contributions" ON public.contributions FOR ALL USING (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

-- FAREWELL FINANCIALS
CREATE POLICY "View financials" ON public.farewell_financials FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage financials" ON public.farewell_financials FOR ALL USING (
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
CREATE POLICY "Members can view duties" ON public.duties FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Admins can manage duties" ON public.duties FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- DUTY ASSIGNMENTS
CREATE POLICY "Members can view assignments" ON public.duty_assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_assignments.duty_id
    AND farewell_members.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage assignments" ON public.duty_assignments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_assignments.duty_id
    AND farewell_members.user_id = auth.uid()
    AND farewell_members.role IN ('admin', 'parallel_admin')
  )
);

-- DUTY RECEIPTS
CREATE POLICY "Members can view receipts for their farewell" ON public.duty_receipts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_receipts.duty_id
    AND farewell_members.user_id = auth.uid()
  )
);
CREATE POLICY "Assigned users can upload receipts" ON public.duty_receipts FOR INSERT WITH CHECK (
  auth.uid() = uploader_id AND
  EXISTS (
    SELECT 1 FROM duty_assignments
    WHERE duty_assignments.duty_id = duty_receipts.duty_id
    AND duty_assignments.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage receipts" ON public.duty_receipts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM duties
    JOIN farewell_members ON farewell_members.farewell_id = duties.farewell_id
    WHERE duties.id = duty_receipts.duty_id
    AND farewell_members.user_id = auth.uid()
    AND farewell_members.role IN ('admin', 'parallel_admin')
  )
);

-- LEDGER ENTRIES
CREATE POLICY "View ledger" ON public.ledger_entries FOR SELECT USING (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Manage ledger" ON public.ledger_entries FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- NOTIFICATIONS
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PUSH SUBSCRIPTIONS
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- AUDIT LOGS
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (
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

-- ARTWORKS
CREATE POLICY "View artworks" ON public.artworks FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage artworks" ON public.artworks FOR ALL USING (
  created_by = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

-- YEARBOOK ENTRIES
CREATE POLICY "View yearbook" ON public.yearbook_entries FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage yearbook" ON public.yearbook_entries FOR ALL USING (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

-- ANNOUNCEMENTS
CREATE POLICY "View announcements" ON public.announcements FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Create announcements" ON public.announcements FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Update announcements" ON public.announcements FOR UPDATE USING (
  public.is_farewell_admin(farewell_id)
);
CREATE POLICY "Delete announcements" ON public.announcements FOR DELETE USING (
  public.is_farewell_admin(farewell_id)
);

-- ANNOUNCEMENT REACTIONS
CREATE POLICY "View announcement reactions" ON public.announcement_reactions FOR SELECT USING (
  public.is_farewell_member((SELECT farewell_id FROM public.announcements WHERE id = announcement_id))
);
CREATE POLICY "Manage own announcement reactions" ON public.announcement_reactions FOR ALL USING (
  user_id = auth.uid()
);

-- CONTACT MESSAGES
CREATE POLICY "Allow public insert" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated view" ON public.contact_messages FOR SELECT USING (auth.role() = 'authenticated');

-- TIMELINE EVENTS
CREATE POLICY "View timeline" ON public.timeline_events FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage timeline" ON public.timeline_events FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- HIGHLIGHTS
CREATE POLICY "View highlights" ON public.highlights FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);
CREATE POLICY "Manage highlights" ON public.highlights FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- ==========================================
-- 7. TRIGGERS & FUNCTIONS
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
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Channel Last Message
CREATE OR REPLACE FUNCTION update_channel_last_message() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_channels 
  SET 
    last_message_at = NEW.created_at,
    preview_text = CASE 
      WHEN NEW.type = 'image' THEN 'Sent an image'
      WHEN NEW.type = 'file' THEN 'Sent a file'
      ELSE LEFT(NEW.content, 50)
    END
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_sent AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE PROCEDURE update_channel_last_message();

-- ==========================================
-- 8a. STAT TRIGGERS
-- ==========================================

-- Statistic Updates
CREATE OR REPLACE FUNCTION public.update_farewell_stats_members() RETURNS TRIGGER AS $$
DECLARE
  _farewell_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    _farewell_id := OLD.farewell_id;
    UPDATE public.farewell_stats SET member_count = member_count - 1 WHERE farewell_id = _farewell_id;
  ELSE
    _farewell_id := NEW.farewell_id;
    INSERT INTO public.farewell_stats (farewell_id, member_count) VALUES (_farewell_id, 1)
    ON CONFLICT (farewell_id) DO UPDATE SET member_count = farewell_stats.member_count + 1;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_member_change AFTER INSERT OR DELETE ON public.farewell_members FOR EACH ROW EXECUTE PROCEDURE public.update_farewell_stats_members();

CREATE OR REPLACE FUNCTION public.update_farewell_stats_media() RETURNS TRIGGER AS $$
DECLARE
  _farewell_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    SELECT farewell_id INTO _farewell_id FROM public.albums WHERE id = OLD.album_id;
    IF _farewell_id IS NOT NULL THEN
      UPDATE public.farewell_stats SET media_count = media_count - 1 WHERE farewell_id = _farewell_id;
    END IF;
  ELSE
    SELECT farewell_id INTO _farewell_id FROM public.albums WHERE id = NEW.album_id;
    IF _farewell_id IS NOT NULL THEN
      INSERT INTO public.farewell_stats (farewell_id, media_count) VALUES (_farewell_id, 1)
      ON CONFLICT (farewell_id) DO UPDATE SET media_count = farewell_stats.media_count + 1;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_media_change AFTER INSERT OR DELETE ON public.media FOR EACH ROW EXECUTE PROCEDURE public.update_farewell_stats_media();

CREATE OR REPLACE FUNCTION public.update_farewell_stats_messages() RETURNS TRIGGER AS $$
DECLARE
  _farewell_id UUID;
  _scope_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    SELECT scope_id INTO _scope_id FROM public.chat_channels WHERE id = OLD.channel_id;
    IF _scope_id IS NOT NULL THEN
      UPDATE public.farewell_stats SET message_count = message_count - 1 WHERE farewell_id = _scope_id;
    END IF;
  ELSE
    SELECT scope_id INTO _scope_id FROM public.chat_channels WHERE id = NEW.channel_id;
    IF _scope_id IS NOT NULL THEN
      INSERT INTO public.farewell_stats (farewell_id, message_count) VALUES (_scope_id, 1)
      ON CONFLICT (farewell_id) DO UPDATE SET message_count = farewell_stats.message_count + 1;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_change AFTER INSERT OR DELETE ON public.chat_messages FOR EACH ROW EXECUTE PROCEDURE public.update_farewell_stats_messages();

-- ==========================================
-- 8. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_farewell_members_user_id ON public.farewell_members(user_id);
CREATE INDEX IF NOT EXISTS idx_farewell_members_farewell_id ON public.farewell_members(farewell_id);
CREATE INDEX IF NOT EXISTS idx_announcements_farewell_id ON public.announcements(farewell_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON public.announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_announcement_id ON public.announcement_reactions(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_user_id ON public.announcement_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_media_album_id ON public.media(album_id);

-- ==========================================
-- 9. ENABLE REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.farewell_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.albums;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media;
ALTER PUBLICATION supabase_realtime ADD TABLE public.artworks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.yearbook_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duty_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duty_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.highlights;

-- ==========================================
-- 10. BACKFILL HELPER
-- ==========================================
CREATE OR REPLACE FUNCTION public.backfill_farewell_stats() RETURNS VOID AS $$
DECLARE
  f record;
  _members int;
  _messages int;
  _media int;
BEGIN
  FOR f IN SELECT id FROM public.farewells LOOP
    -- Members
    SELECT count(*) INTO _members FROM public.farewell_members WHERE farewell_id = f.id;
    -- Media (from albums)
    SELECT count(*) INTO _media 
      FROM public.media m
      JOIN public.albums a ON m.album_id = a.id
      WHERE a.farewell_id = f.id;
    -- Messages (from channels scope)
    SELECT count(*) INTO _messages 
      FROM public.chat_messages m
      JOIN public.chat_channels c ON m.channel_id = c.id
      WHERE c.scope_id = f.id;

    INSERT INTO public.farewell_stats (farewell_id, member_count, media_count, message_count)
    VALUES (f.id, _members, _media, _messages)
    ON CONFLICT (farewell_id) DO UPDATE SET
      member_count = EXCLUDED.member_count,
      media_count = EXCLUDED.media_count,
      message_count = EXCLUDED.message_count;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 11. GRANTS
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql




-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_check.sql


-- File: schema_dump.sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.albums (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT albums_pkey PRIMARY KEY (id),
  CONSTRAINT albums_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT albums_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  action text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.chat_channels (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type USER-DEFINED NOT NULL DEFAULT 'dm'::channel_type,
  scope_id uuid,
  name text,
  avatar_url text,
  created_by uuid,
  last_message_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_channels_pkey PRIMARY KEY (id),
  CONSTRAINT chat_channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.chat_members (
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED DEFAULT 'member'::member_role,
  status USER-DEFINED DEFAULT 'active'::member_status,
  last_read_at timestamp with time zone DEFAULT now(),
  is_pinned boolean DEFAULT false,
  is_muted boolean DEFAULT false,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_members_pkey PRIMARY KEY (channel_id, user_id),
  CONSTRAINT chat_members_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.chat_channels(id),
  CONSTRAINT chat_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  channel_id uuid,
  user_id uuid,
  content text,
  type USER-DEFINED DEFAULT 'text'::message_type,
  file_url text,
  reply_to_id uuid,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.chat_channels(id),
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT chat_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.chat_messages(id)
);
CREATE TABLE public.chat_reactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  message_id uuid,
  user_id uuid,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT chat_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.confessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  content text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT confessions_pkey PRIMARY KEY (id),
  CONSTRAINT confessions_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id)
);
CREATE TABLE public.contributions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  amount numeric NOT NULL,
  method text NOT NULL,
  transaction_id text,
  screenshot_url text,
  status USER-DEFINED DEFAULT 'pending'::contribution_status,
  verified_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contributions_pkey PRIMARY KEY (id),
  CONSTRAINT contributions_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT contributions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT contributions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
CREATE TABLE public.duties (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  title text NOT NULL,
  description text,
  status USER-DEFINED DEFAULT 'pending'::duty_status,
  assigned_to ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT duties_pkey PRIMARY KEY (id),
  CONSTRAINT duties_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  title text NOT NULL,
  amount numeric NOT NULL,
  paid_by uuid,
  category text,
  receipt_url text,
  approved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT expenses_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.users(id),
  CONSTRAINT expenses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.farewell_join_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  status USER-DEFINED DEFAULT 'pending'::join_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT farewell_join_requests_pkey PRIMARY KEY (id),
  CONSTRAINT farewell_join_requests_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT farewell_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.farewell_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  role USER-DEFINED DEFAULT 'student'::farewell_role,
  status USER-DEFINED DEFAULT 'approved'::join_status,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT farewell_members_pkey PRIMARY KEY (id),
  CONSTRAINT farewell_members_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT farewell_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.farewells (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  year integer NOT NULL,
  section text,
  date timestamp with time zone,
  code text UNIQUE,
  requires_approval boolean DEFAULT false,
  status USER-DEFINED DEFAULT 'active'::farewell_status,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT farewells_pkey PRIMARY KEY (id),
  CONSTRAINT farewells_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.media (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  album_id uuid,
  url text NOT NULL,
  type USER-DEFINED NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT media_pkey PRIMARY KEY (id),
  CONSTRAINT media_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id),
  CONSTRAINT media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.poll_options (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  poll_id uuid,
  option_text text NOT NULL,
  CONSTRAINT poll_options_pkey PRIMARY KEY (id),
  CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id)
);
CREATE TABLE public.poll_votes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  poll_id uuid,
  option_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id),
  CONSTRAINT poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.poll_options(id),
  CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.polls (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  question text NOT NULL,
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT polls_pkey PRIMARY KEY (id),
  CONSTRAINT polls_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.song_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  song_name text NOT NULL,
  artist text,
  votes integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT song_requests_pkey PRIMARY KEY (id),
  CONSTRAINT song_requests_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT song_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  ticket_code text DEFAULT encode(gen_random_bytes(6), 'hex'::text) UNIQUE,
  qr_code_url text,
  is_scanned boolean DEFAULT false,
  scanned_at timestamp with time zone,
  scanned_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT tickets_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  email text,
  status USER-DEFINED DEFAULT 'offline'::user_status,
  last_seen_at timestamp with time zone DEFAULT now(),
  public_key text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_dump.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_enum_check.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_full.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: schema_rls_check.sql


-- File: update_contribution_schema.sql
-- ==========================================
-- CONTRIBUTION SYSTEM UPDATE
-- ==========================================

-- 1. Update Contribution Status Enum
-- We need to drop the constraint if it exists or alter the type.
-- Since we can't easily alter enums in a transaction block sometimes, we'll handle it carefully.
-- For this script, we will assume we can just add values or recreate.
-- Safer approach: Rename old type, create new one, update columns, drop old type.

ALTER TYPE contribution_status RENAME TO contribution_status_old;
CREATE TYPE contribution_status AS ENUM (
  'pending',
  'awaiting_payment',
  'paid_pending_admin_verification',
  'verified',
  'approved',
  'rejected',
  'mismatch_error'
);

ALTER TABLE public.contributions ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.contributions 
  ALTER COLUMN status TYPE contribution_status 
  USING status::text::contribution_status;

ALTER TABLE public.contributions ALTER COLUMN status SET DEFAULT 'pending'::contribution_status;

DROP TYPE contribution_status_old;

-- 2. Create Farewell Financials Table
CREATE TABLE IF NOT EXISTS public.farewell_financials (
  farewell_id UUID PRIMARY KEY REFERENCES public.farewells(id) ON DELETE CASCADE,
  total_collected NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  contribution_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.farewell_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View financials" ON public.farewell_financials FOR SELECT USING (
  public.is_farewell_member(farewell_id)
);

-- 3. Update Ledger Entries
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS audit_hash TEXT;
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id);

-- 4. Atomic Approval Function
CREATE OR REPLACE FUNCTION public.approve_contribution(
  _contribution_id UUID,
  _admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  _contribution RECORD;
  _farewell_id UUID;
  _amount NUMERIC;
  _user_id UUID;
  _ledger_id UUID;
  _new_balance NUMERIC;
BEGIN
  -- 1. Lock the contribution row
  SELECT * INTO _contribution 
  FROM public.contributions 
  WHERE id = _contribution_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contribution not found');
  END IF;

  IF _contribution.status = 'approved' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already approved');
  END IF;

  IF _contribution.status NOT IN ('verified', 'paid_pending_admin_verification') THEN
     RETURN jsonb_build_object('success', false, 'error', 'Contribution not in verifiable state');
  END IF;

  _farewell_id := _contribution.farewell_id;
  _amount := _contribution.amount;
  _user_id := _contribution.user_id;

  -- 2. Update Contribution Status
  UPDATE public.contributions
  SET 
    status = 'approved',
    verified_by = _admin_id
  WHERE id = _contribution_id;

  -- 3. Create Ledger Entry
  INSERT INTO public.ledger_entries (
    farewell_id,
    user_id,
    amount,
    type,
    approved_by,
    audit_hash,
    meta
  ) VALUES (
    _farewell_id,
    _user_id,
    _amount,
    'contribution',
    _admin_id,
    md5(CONCAT(_farewell_id, _user_id, _amount, NOW())), -- Simple hash for demo
    jsonb_build_object('contribution_id', _contribution_id, 'method', _contribution.method)
  ) RETURNING id INTO _ledger_id;

  -- 4. Update Financials
  INSERT INTO public.farewell_financials (farewell_id, total_collected, balance, contribution_count)
  VALUES (_farewell_id, _amount, _amount, 1)
  ON CONFLICT (farewell_id) DO UPDATE SET
    total_collected = farewell_financials.total_collected + EXCLUDED.total_collected,
    balance = farewell_financials.balance + EXCLUDED.balance,
    contribution_count = farewell_financials.contribution_count + 1,
    last_updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'ledger_id', _ledger_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- File: update_schema_safe.sql
-- 1. Update Duties Table
ALTER TABLE public.duties 
ADD COLUMN IF NOT EXISTS expense_limit NUMERIC,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Remove assigned_to if it exists (migrating to duty_assignments)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duties' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.duties DROP COLUMN assigned_to;
    END IF;
END $$;

-- 2. Create New Tables

-- DUTY ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.duty_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(duty_id, user_id)
);

-- DUTY RECEIPTS
CREATE TABLE IF NOT EXISTS public.duty_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  duty_assignment_id UUID REFERENCES public.duty_assignments(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  receipt_url TEXT,
  notes TEXT,
  status contribution_status DEFAULT 'pending',
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEDGER ENTRIES
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'reimbursement', 'contribution', 'deduction', 'adjustment'
  currency TEXT DEFAULT 'INR',
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS

ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- 4. Add Policies

-- DUTY ASSIGNMENTS
CREATE POLICY "View assignments" ON public.duty_assignments FOR SELECT USING (
  user_id = auth.uid() OR
  public.is_farewell_admin((SELECT farewell_id FROM public.duties WHERE id = duty_id))
);

CREATE POLICY "Manage assignments" ON public.duty_assignments FOR ALL USING (
  public.is_farewell_admin((SELECT farewell_id FROM public.duties WHERE id = duty_id))
);

-- DUTY RECEIPTS
CREATE POLICY "View receipts" ON public.duty_receipts FOR SELECT USING (
  uploader_id = auth.uid() OR
  public.is_farewell_admin((SELECT farewell_id FROM public.duties d JOIN public.duty_assignments da ON d.id = da.duty_id WHERE da.id = duty_assignment_id))
);

CREATE POLICY "Upload receipts" ON public.duty_receipts FOR INSERT WITH CHECK (
  uploader_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.duty_assignments WHERE id = duty_assignment_id AND user_id = auth.uid())
);

CREATE POLICY "Manage receipts" ON public.duty_receipts FOR ALL USING (
  public.is_farewell_admin((SELECT farewell_id FROM public.duties d JOIN public.duty_assignments da ON d.id = da.duty_id WHERE da.id = duty_assignment_id))
);

-- LEDGER ENTRIES
CREATE POLICY "View ledger" ON public.ledger_entries FOR SELECT USING (
  user_id = auth.uid() OR
  public.is_farewell_admin(farewell_id)
);

CREATE POLICY "Manage ledger" ON public.ledger_entries FOR ALL USING (
  public.is_farewell_admin(farewell_id)
);

-- 5. Create RPCs

-- Assign Duty
CREATE OR REPLACE FUNCTION public.assign_duty(
  _duty_id UUID,
  _user_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  _farewell_id UUID;
  _success_count INT := 0;
  _fail_count INT := 0;
  _uid UUID;
BEGIN
  -- Check admin permissions
  SELECT farewell_id INTO _farewell_id FROM public.duties WHERE id = _duty_id;
  IF NOT public.is_farewell_admin(_farewell_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOREACH _uid IN ARRAY _user_ids
  LOOP
    BEGIN
      INSERT INTO public.duty_assignments (duty_id, user_id)
      VALUES (_duty_id, _uid)
      ON CONFLICT (duty_id, user_id) DO NOTHING;
      _success_count := _success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      _fail_count := _fail_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('success', _success_count, 'failed', _fail_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve Duty Receipt
CREATE OR REPLACE FUNCTION public.approve_duty_receipt(_receipt_id UUID)
RETURNS JSONB AS $$
DECLARE
  _receipt RECORD;
  _duty RECORD;
  _assignment RECORD;
  _farewell_id UUID;
BEGIN
  -- Fetch receipt and related info
  SELECT * INTO _receipt FROM public.duty_receipts WHERE id = _receipt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt not found'; END IF;

  SELECT * INTO _assignment FROM public.duty_assignments WHERE id = _receipt.duty_assignment_id;
  SELECT * INTO _duty FROM public.duties WHERE id = _assignment.duty_id;
  _farewell_id := _duty.farewell_id;

  -- Check admin permissions
  IF NOT public.is_farewell_admin(_farewell_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check status
  IF _receipt.status = 'verified' THEN
    RETURN jsonb_build_object('status', 'already_approved');
  END IF;

  -- Update receipt status
  UPDATE public.duty_receipts
  SET status = 'verified',
      approved_at = NOW(),
      approved_by = auth.uid()
  WHERE id = _receipt_id;

  -- Create ledger entry
  INSERT INTO public.ledger_entries (
    farewell_id,
    user_id,
    amount,
    type,
    meta
  ) VALUES (
    _farewell_id,
    _receipt.uploader_id,
    _receipt.amount,
    'reimbursement',
    jsonb_build_object('receipt_id', _receipt_id, 'duty_id', _duty.id, 'title', _duty.title)
  );

  -- Update duty status (simple logic: if any receipt approved, in_progress. if all done... complex. keeping it simple for now)
  UPDATE public.duties SET status = 'in_progress' WHERE id = _duty.id AND status = 'pending';

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject Duty Receipt
CREATE OR REPLACE FUNCTION public.reject_duty_receipt(
  _receipt_id UUID,
  _reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  _receipt RECORD;
  _duty RECORD;
  _assignment RECORD;
  _farewell_id UUID;
BEGIN
  -- Fetch receipt and related info
  SELECT * INTO _receipt FROM public.duty_receipts WHERE id = _receipt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt not found'; END IF;

  SELECT * INTO _assignment FROM public.duty_assignments WHERE id = _receipt.duty_assignment_id;
  SELECT * INTO _duty FROM public.duties WHERE id = _assignment.duty_id;
  _farewell_id := _duty.farewell_id;

  -- Check admin permissions
  IF NOT public.is_farewell_admin(_farewell_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update receipt status
  UPDATE public.duty_receipts
  SET status = 'rejected',
      rejection_reason = _reason,
      rejected_at = NOW(),
      rejected_by = auth.uid()
  WHERE id = _receipt_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


