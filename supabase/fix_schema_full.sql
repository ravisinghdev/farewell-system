-- FIX: Comprehensive Schema Repair for Rehearsals
-- This script safely adds all potentially missing columns and types.

-- 1. Ensure Types Exist
DO $$ BEGIN
    CREATE TYPE rehearsal_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE rehearsal_type AS ENUM ('dance', 'music', 'skit', 'anchor', 'general', 'technical', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE participation_role AS ENUM ('performer', 'coordinator', 'observer', 'instructor');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('pending', 'present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE segment_status AS ENUM ('pending', 'running', 'completed', 'skipped');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Repair Rehearsals Table
ALTER TABLE public.rehearsals ADD COLUMN IF NOT EXISTS rehearsal_type rehearsal_type DEFAULT 'general';
ALTER TABLE public.rehearsals ADD COLUMN IF NOT EXISTS status rehearsal_status DEFAULT 'scheduled';
ALTER TABLE public.rehearsals ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.rehearsals ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE public.rehearsals ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.rehearsals ADD COLUMN IF NOT EXISTS rehearsal_code TEXT UNIQUE;
ALTER TABLE public.rehearsals ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.rehearsals ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- 3. Repair Participants Table (if it exists)
CREATE TABLE IF NOT EXISTS public.rehearsal_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rehearsal_id UUID REFERENCES public.rehearsals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role participation_role DEFAULT 'performer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rehearsal_id, user_id)
);

ALTER TABLE public.rehearsal_participants ADD COLUMN IF NOT EXISTS attendance_status attendance_status DEFAULT 'pending';
ALTER TABLE public.rehearsal_participants ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
ALTER TABLE public.rehearsal_participants ADD COLUMN IF NOT EXISTS readiness_status JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.rehearsal_participants ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Repair Segments Table (if it exists)
CREATE TABLE IF NOT EXISTS public.rehearsal_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rehearsal_id UUID REFERENCES public.rehearsals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rehearsal_segments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.rehearsal_segments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 15;
ALTER TABLE public.rehearsal_segments ADD COLUMN IF NOT EXISTS start_time_offset_minutes INTEGER;
ALTER TABLE public.rehearsal_segments ADD COLUMN IF NOT EXISTS status segment_status DEFAULT 'pending';
ALTER TABLE public.rehearsal_segments ADD COLUMN IF NOT EXISTS assigned_users UUID[];


-- 5. Helper Function for Realtime
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rehearsals;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 6. FORCE PostgREST Schema Cache Reload
NOTIFY pgrst, 'reload config';
