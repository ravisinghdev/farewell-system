-- Enable Realtime safely (Idempotent)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    tables_to_add text[] := ARRAY[
        'duties', 
        'duty_updates', 
        'duty_assignments',
        'duty_receipts',
        'quotes', 
        'legacy_quotes', -- Checking both potential names
        'farewell_videos', 
        'legacy_videos',
        'gifts', 
        'legacy_gifts',
        'thank_you_notes', 
        'legacy_thank_you_notes',
        'albums', 
        'gallery_media', 
        'artworks', 
        'receipts',
        'contributions',
        'announcements',
        'announcement_reactions',
        'notifications',
        'farewell_members'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY tables_to_add LOOP
        -- Check if table exists first
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- Check if already in publication
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime' 
                AND tablename = t
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
                RAISE NOTICE 'Added % to supabase_realtime', t;
            ELSE
                RAISE NOTICE '% is already enabled for realtime', t;
            END IF;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', t;
        END IF;
    END LOOP;
END $$;
