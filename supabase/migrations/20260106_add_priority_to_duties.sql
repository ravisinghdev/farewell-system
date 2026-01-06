-- Add priority column to duties table
ALTER TABLE duties 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

-- Add check constraint for priority values
ALTER TABLE duties 
ADD CONSTRAINT duties_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));
