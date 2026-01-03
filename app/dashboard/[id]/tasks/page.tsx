import { getTasksAction } from "@/app/actions/task-actions";
import { FreshTaskBoard } from "@/components/tasks/fresh-task-board";
import { createClient } from "@/lib/supabase/server";

export default async function EventTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farewellId = id;
  const tasks = await getTasksAction(farewellId);
  const supabase = await createClient(); // Use for auth check if needed

  return (
    <div className="h-full flex flex-col pt-2">
      {/* Background Decoration derived from sidebar idea */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />

      <FreshTaskBoard initialTasks={tasks} farewellId={farewellId} />
    </div>
  );
}
