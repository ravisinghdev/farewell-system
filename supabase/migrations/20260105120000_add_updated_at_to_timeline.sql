-- Add updated_at to timeline_blocks
ALTER TABLE public.timeline_blocks 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger function if it doesn't exist (usually common, but defining ensures safety)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger
DROP TRIGGER IF EXISTS update_timeline_blocks_updated_at ON public.timeline_blocks;

CREATE TRIGGER update_timeline_blocks_updated_at
    BEFORE UPDATE ON public.timeline_blocks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
