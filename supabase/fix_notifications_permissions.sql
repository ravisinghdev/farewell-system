-- ============================================
-- FIX: Notifications Permissions & Realtime
-- ============================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.push_subscriptions;

-- 3. Re-create Policies

-- SELECT: Users can see their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- UPDATE: Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- INSERT: Allow system/users to create notifications (needed for sending)
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PUSH SUBSCRIPTIONS
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 4. Ensure Realtime is Enabled
-- Note: ALTER PUBLICATION does not support IF EXISTS for tables directly in all versions, 
-- so we'll just try to add it. If it's already there, it might throw a warning or error depending on version,
-- but usually ADD is safer than DROP IF EXISTS which isn't standard syntax for publication tables.
-- A safer way is to just run ADD, and ignore if it complains it's already there, or remove and add.
-- Since we can't do conditional logic easily in standard SQL script without DO block:

DO $$
BEGIN
    -- Try to remove first to ensure clean slate (wrapped in try-catch effectively via DO block logic if we wanted, but simple SQL is better)
    -- Actually, let's just use the standard way. If it fails because it's already there, that's fine.
    -- But to be safe and avoid "relation already in publication" error:
    
    -- Remove if exists (manual check not possible easily in simple script, so we will just SET the list)
    -- ALTER PUBLICATION supabase_realtime SET TABLE public.notifications, public.announcements, public.announcement_reactions, public.push_subscriptions;
    -- The above is risky if we overwrite other tables.
    
    -- Best approach for this script: Just ADD. If it errors "already exists", it's fine.
    -- But the user wants a clean run.
    
    -- Let's try to drop it from publication first using standard syntax if possible, or just ignore.
    -- PostgreSQL doesn't have DROP TABLE IF EXISTS for publications.
    NULL;
END $$;

-- Re-runnable block for realtime
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if not exists
    END;
    
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
END $$;

-- 5. Verify
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('notifications', 'push_subscriptions');
