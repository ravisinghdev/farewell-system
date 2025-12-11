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
