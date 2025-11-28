-- Rename 'emoji' column to 'reaction' to match application code
ALTER TABLE public.chat_reactions RENAME COLUMN emoji TO reaction;

-- Verify the change (optional, just for confirmation)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'chat_reactions';
