-- 20251222_create_performance_schema.sql

-- 1. ENUMS (Idempotent creation)
DO $$ BEGIN
    CREATE TYPE performance_status AS ENUM ('draft', 'rehearsing', 'ready', 'locked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE performance_type AS ENUM ('dance', 'solo', 'duet', 'group', 'skit', 'band', 'special_act', 'anchor_segment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stage_role AS ENUM ('lead_coordinator', 'backup_coordinator', 'performer', 'stage_manager', 'light_sound_tech');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PERFORMANCES (Source of Truth)
-- Table likely exists from previous generic events schema, so we ALTER it to add new "Next-Gen" columns.
CREATE TABLE IF NOT EXISTS public.performances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add new columns
DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS type performance_type DEFAULT 'group';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS risk_level risk_level DEFAULT 'low';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 300;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS stage_requirements JSONB DEFAULT '{}'::jsonb;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS sequence_order INTEGER;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS lead_coordinator_id UUID REFERENCES public.users(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS backup_coordinator_id UUID REFERENCES public.users(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS audit_logs JSONB DEFAULT '[]'::jsonb;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable RLS
ALTER TABLE public.performances ENABLE ROW LEVEL SECURITY;

-- 3. PERFORMANCE PERFORMERS (The Cast)
-- This is a new table for strict linking of users to acts.
CREATE TABLE IF NOT EXISTS public.performance_performers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    performance_id UUID NOT NULL REFERENCES public.performances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role stage_role NOT NULL DEFAULT 'performer',
    is_backup BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(performance_id, user_id)
);

ALTER TABLE public.performance_performers ENABLE ROW LEVEL SECURITY;

-- 4. REHEARSAL SESSIONS (Scheduling)
-- New table to replace generic 'rehearsals' if it existed, or co-exist as the "Pro" version.
CREATE TABLE IF NOT EXISTS public.rehearsal_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    performance_id UUID REFERENCES public.performances(id) ON DELETE CASCADE, -- Nullable for 'General Rehearsal'
    title TEXT, -- Optional override
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    venue TEXT,
    goal TEXT, -- e.g. "Blocking", "Tech Run"
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rehearsal_sessions ENABLE ROW LEVEL SECURITY;

-- 5. REHEARSAL ATTENDANCE
CREATE TABLE IF NOT EXISTS public.rehearsal_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.rehearsal_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('present', 'late', 'absent', 'excused')) DEFAULT 'absent',
    check_in_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

ALTER TABLE public.rehearsal_attendance ENABLE ROW LEVEL SECURITY;

-- 6. TIMELINE BLOCKS (Stage Mode)
CREATE TABLE IF NOT EXISTS public.timeline_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('performance', 'buffer', 'announcement', 'break')) NOT NULL,
    performance_id UUID REFERENCES public.performances(id) ON DELETE SET NULL,
    title TEXT, -- Fallback or custom title
    start_time_projected TIMESTAMPTZ,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL,
    color_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.timeline_blocks ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES

-- Performances Policy
-- Drop existing policies to avoid conflicts or stale permissions
DROP POLICY IF EXISTS "View performances" ON public.performances;
DROP POLICY IF EXISTS "Admin manage performances" ON public.performances;
DROP POLICY IF EXISTS "Coordinator update own performance" ON public.performances;

CREATE POLICY "View performances" ON public.performances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = performances.farewell_id 
            AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin manage performances" ON public.performances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = performances.farewell_id 
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher')
        )
    );

CREATE POLICY "Coordinator update own performance" ON public.performances
    FOR UPDATE USING (
        auth.uid() = lead_coordinator_id OR auth.uid() = backup_coordinator_id
    )
    WITH CHECK (
        is_locked = FALSE -- Cannot edit if locked
    );

-- Performers Policy
DROP POLICY IF EXISTS "View performers" ON public.performance_performers;
CREATE POLICY "View performers" ON public.performance_performers
    FOR SELECT USING (TRUE); -- Visible to all authenticated

DROP POLICY IF EXISTS "Admin manage performers" ON public.performance_performers;
CREATE POLICY "Admin manage performers" ON public.performance_performers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.performances p
            JOIN public.farewell_members fm ON fm.farewell_id = p.farewell_id
            WHERE p.id = performance_performers.performance_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin')
        )
    );

-- Rehearsal Sessions Policy
DROP POLICY IF EXISTS "View sessions" ON public.rehearsal_sessions;
CREATE POLICY "View sessions" ON public.rehearsal_sessions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admin manage sessions" ON public.rehearsal_sessions;
CREATE POLICY "Admin manage sessions" ON public.rehearsal_sessions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.farewell_members fm 
        WHERE fm.farewell_id = rehearsal_sessions.farewell_id 
        AND fm.user_id = auth.uid()
        AND fm.role IN ('main_admin', 'parallel_admin')
    )
);

-- Timeline Policy
DROP POLICY IF EXISTS "View timeline" ON public.timeline_blocks;
CREATE POLICY "View timeline" ON public.timeline_blocks FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admin manage timeline" ON public.timeline_blocks;
CREATE POLICY "Admin manage timeline" ON public.timeline_blocks FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.farewell_members fm 
        WHERE fm.farewell_id = timeline_blocks.farewell_id 
        AND fm.user_id = auth.uid()
        AND fm.role IN ('main_admin', 'parallel_admin')
    )
);

-- 8. REALTIME PUBLICATION
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.performances;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_blocks;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rehearsal_sessions;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
