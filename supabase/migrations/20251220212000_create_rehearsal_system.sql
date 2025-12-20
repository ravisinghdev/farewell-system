-- 20251220212000_create_rehearsal_system.sql
-- Create Enum Types
DO $$ BEGIN
    CREATE TYPE rehearsal_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rehearsal_type AS ENUM ('dance', 'music', 'skit', 'anchor', 'general', 'technical', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE participation_role AS ENUM ('performer', 'coordinator', 'observer', 'instructor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('pending', 'present', 'absent', 'late', 'excused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE segment_status AS ENUM ('pending', 'running', 'completed', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Rehearsals Table
CREATE TABLE IF NOT EXISTS public.rehearsals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID REFERENCES public.farewells(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    venue TEXT,
    rehearsal_type rehearsal_type DEFAULT 'general',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status rehearsal_status DEFAULT 'scheduled',
    is_locked BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    rehearsal_code TEXT UNIQUE -- For QR check-in
);

-- Enable RLS
ALTER TABLE public.rehearsals ENABLE ROW LEVEL SECURITY;

-- Create Rehearsal Participants Table
CREATE TABLE IF NOT EXISTS public.rehearsal_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rehearsal_id UUID REFERENCES public.rehearsals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role participation_role DEFAULT 'performer',
    attendance_status attendance_status DEFAULT 'pending',
    check_in_time TIMESTAMPTZ,
    readiness_status JSONB DEFAULT '{}'::jsonb, -- { costume: bool, props: bool, music: bool, practice: 'ready'|'partial' }
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rehearsal_id, user_id)
);

ALTER TABLE public.rehearsal_participants ENABLE ROW LEVEL SECURITY;

-- Create Rehearsal Segments Table
CREATE TABLE IF NOT EXISTS public.rehearsal_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rehearsal_id UUID REFERENCES public.rehearsals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    start_time_offset_minutes INTEGER, -- relative start time
    status segment_status DEFAULT 'pending',
    assigned_users UUID[], -- Array of UUIDs for quick assignment
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rehearsal_segments ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES --

-- 1. Rehearsals
DROP POLICY IF EXISTS "View rehearsals for farewell members" ON public.rehearsals;
CREATE POLICY "View rehearsals for farewell members" ON public.rehearsals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = rehearsals.farewell_id 
            AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Manage rehearsals for admins" ON public.rehearsals;
CREATE POLICY "Manage rehearsals for admins" ON public.rehearsals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farewell_members fm 
            WHERE fm.farewell_id = rehearsals.farewell_id 
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher')
        )
    );

-- 2. Participants
DROP POLICY IF EXISTS "View participants for farewell members" ON public.rehearsal_participants;
CREATE POLICY "View participants for farewell members" ON public.rehearsal_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_participants.rehearsal_id
            AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Update own readiness" ON public.rehearsal_participants;
CREATE POLICY "Update own readiness" ON public.rehearsal_participants
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Manage participants for admins" ON public.rehearsal_participants;
CREATE POLICY "Manage participants for admins" ON public.rehearsal_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_participants.rehearsal_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher')
        )
    );

-- 3. Segments
DROP POLICY IF EXISTS "View segments for farewell members" ON public.rehearsal_segments;
CREATE POLICY "View segments for farewell members" ON public.rehearsal_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_segments.rehearsal_id
            AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Manage segments for admins" ON public.rehearsal_segments;
CREATE POLICY "Manage segments for admins" ON public.rehearsal_segments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.rehearsals r
            JOIN public.farewell_members fm ON fm.farewell_id = r.farewell_id
            WHERE r.id = rehearsal_segments.rehearsal_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('main_admin', 'parallel_admin', 'teacher')
        )
    );

-- REALTIME CONFIGURATION
-- This usually requires replica identity or publication modification.
-- Assuming standard Supabase setup where we can add tables to the publication.

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rehearsals;
EXCEPTION
    WHEN duplicate_object THEN null; -- already in publication
    WHEN undefined_object THEN null; -- publication might not exist
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rehearsal_participants;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rehearsal_segments;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;
