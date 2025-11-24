-- Fix RLS for Farewells Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.farewells ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public read farewells" ON public.farewells;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farewells;

-- 3. Re-create the Public Read Policy explicitly
-- This allows anyone (authenticated or anonymous) to read farewells
CREATE POLICY "Public read farewells" 
ON public.farewells 
FOR SELECT 
USING (true);

-- 4. Grant permissions to authenticated users (standard practice)
GRANT SELECT ON public.farewells TO authenticated;
GRANT SELECT ON public.farewells TO anon;
