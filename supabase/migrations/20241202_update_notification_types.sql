-- Drop the existing check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated check constraint with all required types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'success', 'warning', 'error', 'announcement', 'finance'));
