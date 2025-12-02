-- Add contributions table to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'contributions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
  END IF;
END
$$;
