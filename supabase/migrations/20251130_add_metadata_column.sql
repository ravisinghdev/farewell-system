-- Add metadata column to contributions table
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
