-- Add active column to farewell_members table
ALTER TABLE farewell_members 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
