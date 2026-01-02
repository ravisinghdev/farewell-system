-- Add RLS policy for farewells table to allow public read access (for signed in users)
-- This fixes the issue where users might not be able to load the dashboard if no policy exists

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'farewells'
        AND policyname = 'Allow view farewells for authenticated users'
    ) THEN
        CREATE POLICY "Allow view farewells for authenticated users"
        ON public.farewells
        FOR SELECT
        USING (auth.role() = 'authenticated');
    END IF;
END
$$;
