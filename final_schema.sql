-- FAREWELL SYSTEM - FINAL CONSOLIDATED SCHEMA (v3.0)
-- Comprehensive Database Definition
-- Generated: 2025-12-26
-- 
-- Includes: Auth extensions, Finance (Ledger), Duties, Tasks, Chat, Gallery, Notifications, Audit, Highlights, Timeline.

-- 1. CLEANUP (Reset Public Schema)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For gen_random_uuid()

-- 3. ENUMS
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'parallel_admin', 'main_admin', 'admin', 'organizer'); -- Merged 'admin/organizer' from variations
CREATE TYPE contribution_status AS ENUM ('pending', 'verified', 'rejected', 'approved');
CREATE TYPE payment_method AS ENUM ('upi', 'cash', 'bank_transfer');
CREATE TYPE duty_status AS ENUM ('unassigned', 'partially_assigned', 'fully_assigned', 'over_assigned', 'completed_pending_verification', 'approved', 'paid', 'archived', 'pending', 'in_progress', 'completed'); -- Combined old/new
CREATE TYPE join_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE task_status AS ENUM ('planned', 'in_progress', 'waiting', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE highlight_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected', 'partially_approved');
CREATE TYPE payment_mode AS ENUM ('online', 'offline');

-- 4. CORE TABLES

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
  code TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- FAREWELL MEMBERS
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

-- 5. FINANCE SYSTEM

-- CONTRIBUTIONS
CREATE TABLE public.contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method payment_method NOT NULL,
  transaction_id TEXT,
  screenshot_url TEXT,
  status contribution_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- EXPENSES
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid_by UUID REFERENCES public.users(id),
  category TEXT,
  receipt_url TEXT,
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- PAYMENT LEDGER (Central Financial Source)
CREATE TABLE public.payment_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    reference_id UUID, 
    reference_type TEXT NOT NULL, -- 'duty_payment', 'manual_adjustment'
    credit_amount NUMERIC(10, 2) DEFAULT 0,
    debit_amount NUMERIC(10, 2) DEFAULT 0,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_ledger ENABLE ROW LEVEL SECURITY;

-- 6. DUTY SYSTEM (New Professional System)

-- DUTIES
CREATE TABLE public.duties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    min_assignees INTEGER NOT NULL DEFAULT 1,
    max_assignees INTEGER NOT NULL DEFAULT 1,
    status duty_status NOT NULL DEFAULT 'unassigned',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;

-- DUTY ASSIGNMENTS
CREATE TABLE public.duty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duty_id UUID NOT NULL REFERENCES public.duties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(duty_id, user_id)
);
ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;

-- DUTY CLAIMS
CREATE TABLE public.duty_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duty_id UUID NOT NULL REFERENCES public.duties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    claimed_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    proof_url TEXT,
    status claim_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.duty_claims ENABLE ROW LEVEL SECURITY;

-- DUTY VOTES
CREATE TABLE public.duty_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duty_id UUID NOT NULL REFERENCES public.duties(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES public.duty_claims(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vote BOOLEAN NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(duty_id, voter_id)
);
ALTER TABLE public.duty_votes ENABLE ROW LEVEL SECURITY;

-- PAYMENT RECEIPTS
CREATE TABLE public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duty_id UUID NOT NULL REFERENCES public.duties(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES public.duty_claims(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payment_mode payment_mode NOT NULL,
    claimed_amount NUMERIC(10, 2) NOT NULL,
    approved_amount NUMERIC(10, 2) NOT NULL,
    deducted_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    deduction_reason TEXT,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    transaction_ref TEXT,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- 7. TASK SYSTEM

-- TASKS
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'planned',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- TASK ASSIGNMENTS
CREATE TABLE public.task_assignments (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- TASK COMMENTS
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- TASK ATTACHMENTS
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- TASK ACTIVITY LOG
CREATE TABLE public.task_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.task_activity_log ENABLE ROW LEVEL SECURITY;

-- 8. COMMUNICATIONS & ENGAGEMENT

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    call_to_action_label TEXT,
    call_to_action_link TEXT,
    call_to_action_type TEXT DEFAULT 'primary',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ANNOUNCEMENT READS
CREATE TABLE public.announcement_reads (
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (announcement_id, user_id)
);
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- HIGHLIGHTS
CREATE TABLE public.highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  status highlight_status DEFAULT 'pending',
  tags TEXT[],
  admin_notes TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- HIGHLIGHT REACTIONS
CREATE TABLE public.highlight_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(highlight_id, user_id, type)
);
ALTER TABLE public.highlight_reactions ENABLE ROW LEVEL SECURITY;

-- HIGHLIGHT COMMENTS
CREATE TABLE public.highlight_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
ALTER TABLE public.highlight_comments ENABLE ROW LEVEL SECURITY;

-- TIMELINE EVENTS
CREATE TABLE public.timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  icon TEXT DEFAULT 'calendar',
  location TEXT, -- Ensure this is here
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;


-- 9. SOCIAL & EXTRAS

-- CHAT
CREATE TABLE public.chat_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('group', 'dm')),
  name TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_members (
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  reply_to UUID REFERENCES public.chat_messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- GALLERY (Using unified media? or separate?)
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
  type TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- SONGS
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

-- AUDIT
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, 
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- 10. FUNCTIONS & TRIGGERS

-- Handle New User
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

-- Sync Farewell Claims (Crucial for RBAC)
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

-- 11. RLS POLICIES (Consolidated & Simplified)

-- USERS
CREATE POLICY "Public profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Self update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- FAREWELL MEMBERS
CREATE POLICY "View members" ON public.farewell_members FOR SELECT USING (true);
CREATE POLICY "Self Join" ON public.farewell_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TASKS (Admins manage, Members view)
CREATE POLICY "View Tasks" ON public.tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.farewell_members fm WHERE fm.farewell_id = tasks.farewell_id AND fm.user_id = auth.uid())
);
CREATE POLICY "Manage Tasks" ON public.tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farewell_members fm WHERE fm.farewell_id = tasks.farewell_id AND fm.user_id = auth.uid() AND fm.role IN ('admin', 'main_admin', 'teacher', 'organizer'))
);

-- DUTIES
CREATE POLICY "View Duties" ON public.duties FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.farewell_members fm WHERE fm.farewell_id = duties.farewell_id AND fm.user_id = auth.uid())
);
CREATE POLICY "Manage Duties" ON public.duties FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farewell_members fm WHERE fm.farewell_id = duties.farewell_id AND fm.user_id = auth.uid() AND fm.role IN ('admin', 'main_admin', 'teacher'))
);

-- FINANCE
CREATE POLICY "View Ledger" ON public.payment_ledger FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.farewell_members fm WHERE fm.farewell_id = payment_ledger.farewell_id AND fm.user_id = auth.uid())
);

-- CHAT
CREATE POLICY "View Messages" ON public.chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_members cm WHERE cm.channel_id = chat_messages.channel_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Send Messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.highlights;
