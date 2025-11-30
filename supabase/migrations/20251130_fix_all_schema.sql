-- 1. Add metadata to contributions (Fixes Razorpay error)
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Add active to farewell_members (Fixes assignment error)
ALTER TABLE farewell_members 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 3. Add grade/section and roles (Fixes People pages)
ALTER TYPE farewell_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE farewell_role ADD VALUE IF NOT EXISTS 'junior';

ALTER TABLE farewell_members 
ADD COLUMN IF NOT EXISTS grade INTEGER,
ADD COLUMN IF NOT EXISTS section TEXT;

-- 4. Reload schema cache (CRITICAL: Fixes 'Could not find column in schema cache')
NOTIFY pgrst, 'reload config';
