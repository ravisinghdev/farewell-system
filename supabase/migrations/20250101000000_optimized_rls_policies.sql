-- ============================================================
-- FAREWELL SYSTEM - OPTIMIZED RLS POLICIES
-- This script removes all existing RLS policies and creates
-- new, optimized ones to prevent timeout and recursion errors
-- ============================================================

-- ============================================================
-- STEP 1: DROP ALL EXISTING RLS POLICIES
-- ============================================================

-- Drop policies for contributions table
DROP POLICY IF EXISTS "contributions_select_own" ON contributions;
DROP POLICY IF EXISTS "contributions_select_admin" ON contributions;
DROP POLICY IF EXISTS "contributions_insert_own" ON contributions;
DROP POLICY IF EXISTS "contributions_update_admin" ON contributions;
DROP POLICY IF EXISTS "contributions_delete_admin" ON contributions;
DROP POLICY IF EXISTS "Users can view their own contributions" ON contributions;
DROP POLICY IF EXISTS "Admins can view all contributions" ON contributions;
DROP POLICY IF EXISTS "Users can create their own contributions" ON contributions;
DROP POLICY IF EXISTS "Admins can update contributions" ON contributions;
DROP POLICY IF EXISTS "Admins can delete contributions" ON contributions;

-- Drop policies for highlights table
DROP POLICY IF EXISTS "highlights_select_all" ON highlights;
DROP POLICY IF EXISTS "highlights_insert_own" ON highlights;
DROP POLICY IF EXISTS "highlights_update_admin" ON highlights;
DROP POLICY IF EXISTS "highlights_delete_admin" ON highlights;
DROP POLICY IF EXISTS "Users can view highlights" ON highlights;
DROP POLICY IF EXISTS "Users can create highlights" ON highlights;
DROP POLICY IF EXISTS "Admins can update highlights" ON highlights;
DROP POLICY IF EXISTS "Admins can delete highlights" ON highlights;

-- Drop policies for users table
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Drop policies for farewells table
DROP POLICY IF EXISTS "farewells_select_member" ON farewells;
DROP POLICY IF EXISTS "farewells_update_admin" ON farewells;
DROP POLICY IF EXISTS "Members can view their farewells" ON farewells;
DROP POLICY IF EXISTS "Admins can update farewells" ON farewells;

-- Drop policies for farewell_members table
DROP POLICY IF EXISTS "members_select_own" ON farewell_members;
DROP POLICY IF EXISTS "members_insert_admin" ON farewell_members;
DROP POLICY IF EXISTS "Users can view farewell members" ON farewell_members;
DROP POLICY IF EXISTS "Admins can manage members" ON farewell_members;

-- ============================================================
-- STEP 2: ENSURE RLS IS ENABLED
-- ============================================================

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farewells ENABLE ROW LEVEL SECURITY;
ALTER TABLE farewell_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: CREATE OPTIMIZED RLS POLICIES
-- ============================================================

-- ------------------------------------------------------------
-- USERS TABLE - Simple public read, own update
-- ------------------------------------------------------------

-- Everyone can view user profiles (PUBLIC READ)
CREATE POLICY "users_public_read"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "users_own_update"
  ON users FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ------------------------------------------------------------
-- FAREWELLS TABLE - Member-based access
-- ------------------------------------------------------------

-- Users can view farewells they are members of
CREATE POLICY "farewells_member_read"
  ON farewells FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = farewells.id
        AND farewell_members.user_id = auth.uid()
    )
  );

-- Admins can update farewells (role check without recursion)
CREATE POLICY "farewells_admin_update"
  ON farewells FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = farewells.id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'teacher', 'organizer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = farewells.id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'teacher', 'organizer')
    )
  );

-- ------------------------------------------------------------
-- FAREWELL_MEMBERS TABLE - Self and admin access
-- ------------------------------------------------------------

-- Users can view members of farewells they belong to
CREATE POLICY "members_farewell_read"
  ON farewell_members FOR SELECT
  USING (
    farewell_id IN (
      SELECT farewell_id FROM farewell_members
      WHERE user_id = auth.uid()
    )
  );

-- Admins can insert/update/delete members
CREATE POLICY "members_admin_write"
  ON farewell_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members fm
      WHERE fm.farewell_id = farewell_members.farewell_id
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'teacher', 'organizer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farewell_members fm
      WHERE fm.farewell_id = farewell_members.farewell_id
        AND fm.user_id = auth.uid()
        AND fm.role IN ('admin', 'teacher', 'organizer')
    )
  );

-- ------------------------------------------------------------
-- CONTRIBUTIONS TABLE - Own and admin access
-- ------------------------------------------------------------

-- Users can view their own contributions
CREATE POLICY "contributions_own_read"
  ON contributions FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all contributions for their farewells
CREATE POLICY "contributions_admin_read"
  ON contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'teacher', 'organizer', 'treasurer')
    )
  );

-- Users can create their own contributions
CREATE POLICY "contributions_own_insert"
  ON contributions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
    )
  );

-- Admins can update contributions
CREATE POLICY "contributions_admin_update"
  ON contributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'teacher', 'organizer', 'treasurer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'teacher', 'organizer', 'treasurer')
    )
  );

-- Admins can delete contributions
CREATE POLICY "contributions_admin_delete"
  ON contributions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = contributions.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'teacher', 'organizer')
    )
  );

-- ------------------------------------------------------------
-- HIGHLIGHTS TABLE - Public read, admin write
-- ------------------------------------------------------------

-- All members can view approved highlights
CREATE POLICY "highlights_member_read"
  ON highlights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
    )
  );

-- Users can create highlights for their farewells
CREATE POLICY "highlights_member_insert"
  ON highlights FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
    )
  );

-- Admins can update highlights
CREATE POLICY "highlights_admin_update"
  ON highlights FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'teacher', 'organizer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'teacher', 'organizer')
    )
  );

-- Admins can delete highlights
CREATE POLICY "highlights_admin_delete"
  ON highlights FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM farewell_members
      WHERE farewell_members.farewell_id = highlights.farewell_id
        AND farewell_members.user_id = auth.uid()
        AND farewell_members.role IN ('admin', 'teacher', 'organizer')
    )
  );

-- ============================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- (Only if they don't exist)
-- ============================================================

-- Index for faster farewell_members lookups
CREATE INDEX IF NOT EXISTS idx_farewell_members_user_id 
  ON farewell_members(user_id);

CREATE INDEX IF NOT EXISTS idx_farewell_members_farewell_id 
  ON farewell_members(farewell_id);

CREATE INDEX IF NOT EXISTS idx_farewell_members_role 
  ON farewell_members(role);

-- Index for contributions
CREATE INDEX IF NOT EXISTS idx_contributions_user_id 
  ON contributions(user_id);

CREATE INDEX IF NOT EXISTS idx_contributions_farewell_id 
  ON contributions(farewell_id);

CREATE INDEX IF NOT EXISTS idx_contributions_status 
  ON contributions(status);

-- Index for highlights
CREATE INDEX IF NOT EXISTS idx_highlights_farewell_id 
  ON highlights(farewell_id);

CREATE INDEX IF NOT EXISTS idx_highlights_user_id 
  ON highlights(user_id);

-- Index for users
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id 
  ON users(auth_user_id);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Show all active policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('contributions', 'highlights', 'users', 'farewells', 'farewell_members')
ORDER BY tablename, policyname;
