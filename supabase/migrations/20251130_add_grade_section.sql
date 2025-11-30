-- Add new roles to farewell_role enum
ALTER TYPE farewell_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE farewell_role ADD VALUE IF NOT EXISTS 'junior';

-- Add grade and section columns to farewell_members table
ALTER TABLE farewell_members 
ADD COLUMN IF NOT EXISTS grade INTEGER,
ADD COLUMN IF NOT EXISTS section TEXT;
