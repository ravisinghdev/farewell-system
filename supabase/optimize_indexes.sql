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
