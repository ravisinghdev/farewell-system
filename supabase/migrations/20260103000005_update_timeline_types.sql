-- Drop the old restricted constraint
ALTER TABLE public.timeline_blocks
DROP CONSTRAINT IF EXISTS timeline_blocks_type_check;

-- Add the new constraint with all supported types
ALTER TABLE public.timeline_blocks
ADD CONSTRAINT timeline_blocks_type_check
CHECK (type IN ('performance', 'buffer', 'announcement', 'break', 'speech', 'other'));
