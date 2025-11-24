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
