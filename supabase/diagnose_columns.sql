-- DIAGNOSTIC SCRIPT: CHECK FOR MISSING user_id COLUMN
-- Run this in Supabase SQL Editor to find which table is causing the error.

DO $$
DECLARE
    table_name text;
    has_user_id boolean;
    missing_tables text[] := ARRAY[]::text[];
    target_tables text[] := ARRAY[
        'user_settings',
        'farewell_members',
        'farewell_join_requests',
        'chat_members',
        'chat_messages',
        'chat_reactions',
        'contributions',
        'song_requests',
        'duty_assignments',
        'ledger_entries',
        'notifications',
        'push_subscriptions',
        'poll_votes',
        'tickets',
        'yearbook_entries',
        'announcement_reactions'
    ];
BEGIN
    FOREACH table_name IN ARRAY target_tables
    LOOP
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND tablename = table_name
            AND column_name = 'user_id'
        ) INTO has_user_id;

        IF NOT has_user_id THEN
            -- Check if table exists at all
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tablename = table_name) THEN
                RAISE NOTICE 'MISSING user_id in table: %', table_name;
                missing_tables := array_append(missing_tables, table_name);
            ELSE
                 RAISE NOTICE 'Table does not exist: %', table_name;
            END IF;
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
         RAISE EXCEPTION 'Found tables missing user_id: %', missing_tables;
    ELSE
         RAISE NOTICE 'All target tables have user_id column. The error might be in a Trigger or Helper Function.';
    END IF;
END $$;
