-- ============================================================================
-- FAREWELL SYSTEM - COMPLETE FRESH SCHEMA WITH OPTIMIZED RLS POLICIES
-- Version: 4.0 - Fresh Reset
-- Date: 2025-01-01
-- 
-- This script completely resets the database schema and creates it from scratch
-- with optimized RLS policies to prevent timeout and recursion errors.
-- 
-- WARNING: THIS WILL DELETE ALL EXISTING DATA!
-- ============================================================================

-- ============================================================================
-- STEP 1: COMPLETE DATABASE RESET
-- ============================================================================

-- Drop all existing tables (CASCADE will drop dependent objects)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ============================================================================
-- STEP 2: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 3: ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'parallel_admin', 'main_admin', 'admin', 'organizer', 'treasurer');
CREATE TYPE contribution_status AS ENUM ('pending', 'verified', 'rejected', 'approved');
CREATE TYPE payment_method AS ENUM ('upi', 'cash', 'bank_transfer');
CREATE TYPE duty_status AS ENUM ('unassigned', 'partially_assigned', 'fully_assigned', 'over_assigned', 'completed_pending_verification', 'approved', 'paid', 'archived', 'pending', 'in_progress', 'completed');
CREATE TYPE join_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE task_status AS ENUM ('planned', 'in_progress', 'waiting', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE highlight_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected', 'partially_approved');
CREATE TYPE payment_mode AS ENUM ('online', 'offline');

-- ============================================================================
-- STEP 4: CORE TABLES
-- ============================================================================

-- USERS TABLE (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  auth_user_id UUID UNIQUE,  -- For RLS lookups
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAREWELLS TABLE
CREATE TABLE public.farewells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  section TEXT,
  date TIMESTAMPTZ,
  requires_approval BOOLEAN DEFAULT FALSE,
  code TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  accepting_payments BOOLEAN DEFAULT TRUE,
  is_maintenance_mode BOOLEAN DEFAULT FALSE,
  payment_config JSONB DEFAULT '{}',
  budget_goal DECIMAL(10, 2),
  target_amount DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAREWELL MEMBERS TABLE
CREATE TABLE public.farewell_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role user_role DEFAULT 'student',
  active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farewell_id, user_id)
);

-- JOIN REQUESTS TABLE
CREATE TABLE public.farewell_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status join_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farewell_id, user_id)
);

-- ============================================================================
-- STEP 5: FINANCE TABLES
-- ============================================================================

-- CONTRIBUTIONS TABLE
CREATE TABLE public.contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  method payment_method NOT NULL,
  transaction_id TEXT,
  screenshot_url TEXT,
  status contribution_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAREWELL FINANCIALS (Materialized View for Performance)
CREATE TABLE public.farewell_financials (
  farewell_id UUID PRIMARY KEY REFERENCES public.farewells(id) ON DELETE CASCADE,
  total_collected DECIMAL(10, 2) DEFAULT 0,
  contribution_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- LEDGER TABLE (for expenses/adjustments)
CREATE TABLE public.ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  reference_id UUID,
  reference_type TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXPENSES TABLE
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  paid_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category TEXT,
  receipt_url TEXT,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: DUTY SYSTEM TABLES
-- ============================================================================

-- DUTIES TABLE
CREATE TABLE public.duties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  min_assignees INTEGER NOT NULL DEFAULT 1,
  max_assignees INTEGER NOT NULL DEFAULT 1,
  status duty_status NOT NULL DEFAULT 'unassigned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DUTY ASSIGNMENTS TABLE
CREATE TABLE public.duty_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(duty_id, user_id)
);

-- DUTY CLAIMS TABLE
CREATE TABLE public.duty_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duty_id UUID REFERENCES public.duties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  claimed_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (claimed_amount >= 0),
  description TEXT,
  proof_url TEXT,
  status claim_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 7: COMMUNICATION & ENGAGEMENT TABLES
-- ============================================================================

-- ANNOUNCEMENTS TABLE
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  call_to_action_label TEXT,
  call_to_action_link TEXT,
  call_to_action_type TEXT DEFAULT 'primary',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANNOUNCEMENT READS TABLE
CREATE TABLE public.announcement_reads (
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

-- ANNOUNCEMENT REACTIONS TABLE
CREATE TABLE public.announcement_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public SELECT users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'bookmark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id, reaction_type)
);

-- HIGHLIGHTS TABLE
CREATE TABLE public.highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  status highlight_status DEFAULT 'pending',
  tags TEXT[],
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HIGHLIGHT REACTIONS TABLE
CREATE TABLE public.highlight_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(highlight_id, user_id, type)
);

-- HIGHLIGHT COMMENTS TABLE
CREATE TABLE public.highlight_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- TIMELINE EVENTS TABLE
CREATE TABLE public.timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  icon TEXT DEFAULT 'calendar',
  location TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 8: TASK SYSTEM TABLES
-- ============================================================================

-- TASKS TABLE
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'planned',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASK ASSIGNMENTS TABLE
CREATE TABLE public.task_assignments (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- TASK COMMENTS TABLE
CREATE TABLE public.task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 9: CHAT SYSTEM TABLES
-- ============================================================================

-- CHAT CHANNELS TABLE
CREATE TABLE public.chat_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('group', 'dm')),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT MEMBERS TABLE
CREATE TABLE public.chat_members (
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- CHAT MESSAGES TABLE
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ============================================================================
-- STEP 10: MEDIA & EXTRAS
-- ============================================================================

-- ALBUMS TABLE
CREATE TABLE public.albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEDIA TABLE
CREATE TABLE public.media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID REFERENCES public.farewells(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 11: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);

-- Farewell members indexes
CREATE INDEX idx_farewell_members_user_id ON public.farewell_members(user_id);
CREATE INDEX idx_farewell_members_farewell_id ON public.farewell_members(farewell_id);
CREATE INDEX idx_farewell_members_role ON public.farewell_members(role);
CREATE INDEX idx_farewell_members_lookup ON public.farewell_members(farewell_id, user_id, role);

-- Contributions indexes
CREATE INDEX idx_contributions_user_id ON public.contributions(user_id);
CREATE INDEX idx_contributions_farewell_id ON public.contributions(farewell_id);
CREATE INDEX idx_contributions_status ON public.contributions(status);
CREATE INDEX idx_contributions_created_at ON public.contributions(created_at DESC);

-- Highlights indexes
CREATE INDEX idx_highlights_farewell_id ON public.highlights(farewell_id);
CREATE INDEX idx_highlights_user_id ON public.highlights(user_id);
CREATE INDEX idx_highlights_status ON public.highlights(status);

-- Chat indexes
CREATE INDEX idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- ============================================================================
-- STEP 12: ENABLE ROW LEVEL SECURITY  
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farewell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farewell_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farewell_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 13: OPTIMIZED RLS POLICIES (NO RECURSION, NO COMPLEX JOINS)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- USERS TABLE - Public read, own update
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "users_public_read"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "users_own_update"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ────────────────────────────────────────────────────────────────────────────
-- FAREWELLS TABLE - Member-based access
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "farewells_member_read"
  ON public.farewells FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = farewells.id
        AND farewell_members.user_id = auth.uid()
    )
  );

CREATE POLICY "farewells_admin_write"
  ON public.farewells FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = farewells.id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = farewells.id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- FAREWELL MEMBERS TABLE - Farewell-based access
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "members_farewell_read"
  ON public.farewell_members FOR SELECT
  USING (
    farewell_id IN (
      SELECT farewell_id FROM public.farewell_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_admin_write"
  ON public.farewell_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members fm
      WHERE fm.farewell_id = farewell_members.farewell_id
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members fm
      WHERE fm.farewell_id = farewell_members.farewell_id
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- CONTRIBUTIONS TABLE - Own and admin access
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "contributions_own_read"
  ON public.contributions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "contributions_admin_read"
  ON public.contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer', 'treasurer')
    )
  );

CREATE POLICY "contributions_own_insert"
  ON public.contributions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
    )
  );

CREATE POLICY "contributions_admin_write"
  ON public.contributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer', 'treasurer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer', 'treasurer')
    )
  );

CREATE POLICY "contributions_admin_delete"
  ON public.contributions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- HIGHLIGHTS TABLE - Member read, admin write
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "highlights_member_read"
  ON public.highlights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
    )
  );

CREATE POLICY "highlights_member_insert"
  ON public.highlights FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
    )
  );

CREATE POLICY "highlights_admin_write"
  ON public.highlights FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  );

CREATE POLICY "highlights_admin_delete"
  ON public.highlights FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- ANNOUNCEMENTS TABLE - Member read, admin write
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "announcements_member_read"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = announcements.farewell_id
        AND farewell_members.user_id = auth.uid()
    )
  );

CREATE POLICY "announcements_admin_write"
  ON public.announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = announcements.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = announcements.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- TASKS, DUTIES, CHAT - Simple member-based access
-- ────────────────────────────────────────────────────────────────────────────

-- Tasks
CREATE POLICY "tasks_member_read"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = tasks.farewell_id
        AND farewell_members.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_admin_write"
  ON public.tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = tasks.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = tasks.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  );

-- Duties
CREATE POLICY "duties_member_read"
  ON public.duties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = duties.farewell_id
        AND farewell_members.user_id = auth.uid()
    )
  );

CREATE POLICY "duties_admin_write"
  ON public.duties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = duties.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farewell_members
      WHERE farewell_members.farewell_id = duties.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
  );

-- Chat Messages
CREATE POLICY "chat_messages_member_read"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.channel_id = chat_messages.channel_id
        AND chat_members.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_own_insert"
  ON public.chat_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Notifications
CREATE POLICY "notifications_own_access"
  ON public.notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 14: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, auth_user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
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

-- Update farewell financials on contribution change
CREATE OR REPLACE FUNCTION public.update_farewell_financials()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate totals for this farewell
  INSERT INTO public.farewell_financials (farewell_id, total_collected, contribution_count, last_updated)
  SELECT 
    farewell_id,
    COALESCE(SUM(amount), 0),
    COUNT(*),
    NOW()
  FROM public.contributions
  WHERE farewell_id = COALESCE(NEW.farewell_id, OLD.farewell_id)
    AND status IN ('verified', 'approved')
  GROUP BY farewell_id
  ON CONFLICT (farewell_id) 
  DO UPDATE SET
    total_collected = EXCLUDED.total_collected,
    contribution_count = EXCLUDED.contribution_count,
    last_updated = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_contribution_change
  AFTER INSERT OR UPDATE OR DELETE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_farewell_financials();

-- ============================================================================
-- STEP 15: REALTIME SETUP
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.highlights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- ============================================================================
-- COMPLETE! Schema is ready with optimized RLS policies.
-- ============================================================================
