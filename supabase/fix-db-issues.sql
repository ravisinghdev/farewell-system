-- =================================================================
-- SUPABASE DB ADVISOR FIXER
-- Run this script to resolve common "Issues needing attention"
-- =================================================================

-- 1. ENABLE RLS ON ALL TABLES (Security Best Practice)
-- This fixes "Table has RLS disabled" warnings.
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- 2. AUTO-INDEX UNINDEXED FOREIGN KEYS
-- This fixes "Unindexed Foreign Keys" which cause slow joins.
DO $$ 
DECLARE 
    r record;
    index_name text;
    exists_count int;
BEGIN 
    FOR r IN 
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu 
              ON tc.constraint_name = kcu.constraint_name 
              AND tc.table_schema = kcu.table_schema 
            JOIN information_schema.constraint_column_usage AS ccu 
              ON ccu.constraint_name = tc.constraint_name 
              AND ccu.table_schema = tc.table_schema 
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
    LOOP 
        -- Construct index name: idx_<table_name>_<column_name>
        index_name := 'idx_' || substr(r.table_name, 1, 15) || '_' || substr(r.column_name, 1, 15);
        
        -- Check if index exists
        SELECT count(*) INTO exists_count 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND tablename = r.table_name 
          AND indexdef LIKE '%' || r.column_name || '%';

        -- Create if missing
        IF exists_count = 0 THEN
             RAISE NOTICE 'Creating Index: %', index_name;
             EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)', index_name, r.table_name, r.column_name);
        END IF; 
    END LOOP; 
END $$;

-- 3. ANALYZE TABLES
-- Updates statistics for the query planner to remove "Stale stats" warnings.
ANALYZE;

-- 4. VACUUM (Use Dashboard "Vacuum" button instead if needed)
-- Note: Cannot run inside SQL Editor transaction block.
-- VACUUM;
