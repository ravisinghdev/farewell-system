-- Create channel_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE channel_status AS ENUM ('active', 'pending', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to chat_channels
ALTER TABLE public.chat_channels 
ADD COLUMN IF NOT EXISTS status channel_status DEFAULT 'active';

-- Update existing channels to be active
UPDATE public.chat_channels SET status = 'active' WHERE status IS NULL;
