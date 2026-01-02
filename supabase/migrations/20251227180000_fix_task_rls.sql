-- Fix Infinite Recursion by decoupling policies

-- 1. Drop existing potentially problematic policies
DROP POLICY IF EXISTS "View Tasks" ON public.tasks;
DROP POLICY IF EXISTS "Manage Tasks" ON public.tasks;
DROP POLICY IF EXISTS "View Task Assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Manage Task Assignments" ON public.task_assignments;

-- 2. Create simplified Policies for TASKS
-- Instead of complex checks, we rely on Farewell Membership directly.
CREATE POLICY "View Tasks" ON public.tasks 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.farewell_members 
        WHERE farewell_members.farewell_id = tasks.farewell_id 
        AND farewell_members.user_id = auth.uid()
    )
);

CREATE POLICY "Manage Tasks" ON public.tasks 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.farewell_members 
        WHERE farewell_members.farewell_id = tasks.farewell_id 
        AND farewell_members.user_id = auth.uid() 
        AND farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
);

-- 3. Create simplified Policies for TASK ASSIGNMENTS
-- Prevent recursion: Do NOT query 'tasks' table here if possible, or use a simplified join.
-- If we need to check if user has access to the task, we can check farewell_id via the task, but that requires joining tasks.
-- To avoid recursion, ensure 'View Tasks' doesn't query 'task_assignments'. It currently doesn't (it queries farewell_members).

-- This policy allows users to see assignments if they are members of the farewell (derived via task)
-- Optimization: Add farewell_id to task_assignments to avoid joining tasks? No, that's denormalization.
-- Standard fix: explicitly check farewell_members for the task's farewell_id by joining tasks, but cast purely.
-- OR simple allow: public access to assignments if you are authenticated? No, data leak.

CREATE POLICY "View Task Assignments" ON public.task_assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        JOIN public.farewell_members ON public.tasks.farewell_id = public.farewell_members.farewell_id
        WHERE public.tasks.id = task_assignments.task_id
        AND public.farewell_members.user_id = auth.uid()
    )
);

CREATE POLICY "Manage Task Assignments" ON public.task_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        JOIN public.farewell_members ON public.tasks.farewell_id = public.farewell_members.farewell_id
        WHERE public.tasks.id = task_assignments.task_id
        AND public.farewell_members.user_id = auth.uid()
        AND public.farewell_members.role IN ('admin', 'main_admin', 'teacher', 'organizer')
    )
);
-- Note: If "View Tasks" queries "task_assignments" (e.g. to filter by 'my tasks'), that causes recursion with "View Task Assignments" querying "tasks".
-- My previous getTasksAction code *removed* the server-side filtering logic for assignees in the query itself to avoid this, but if I added it back or if the user added it, that's the cause.
-- The policy "View Tasks" above DOES NOT query task_assignments. So it should be safe.

-- 4. Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
