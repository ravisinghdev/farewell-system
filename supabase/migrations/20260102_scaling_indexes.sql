-- Optimizing for "Millions of Traffic" with Safety Checks

-- 1. Middleware Auth Check (CRITICAL)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='farewell_members' AND column_name='user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_farewell_members_user_status ON public.farewell_members(user_id, status);
    END IF;
END $$;

-- 2. Dashboard Stats Aggregation (CRITICAL)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contributions' AND column_name='farewell_id') THEN
        CREATE INDEX IF NOT EXISTS idx_contributions_farewell_verified ON public.contributions(farewell_id, status) WHERE status = 'verified';
    END IF;
END $$;

-- 3. Timeline Loading
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='timeline_events' AND column_name='farewell_id') THEN
        CREATE INDEX IF NOT EXISTS idx_timeline_events_farewell_date ON public.timeline_events(farewell_id, event_date);
    END IF;
END $$;

-- 4. Chat & Media Counts
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_channels' AND column_name='farewell_id') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_channels_farewell ON public.chat_channels(farewell_id);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='albums' AND column_name='farewell_id') THEN
        CREATE INDEX IF NOT EXISTS idx_albums_farewell ON public.albums(farewell_id);
    END IF;
END $$;

-- 5. Announcements by Farewell (Ordered)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='announcements' AND column_name='farewell_id') THEN
        CREATE INDEX IF NOT EXISTS idx_announcements_farewell_pinned ON public.announcements(farewell_id, is_pinned DESC, created_at DESC);
    END IF;
END $$;

-- 6. Recent Transactions
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contributions' AND column_name='farewell_id') THEN
        CREATE INDEX IF NOT EXISTS idx_contributions_farewell_created ON public.contributions(farewell_id, created_at DESC);
    END IF;
END $$;
