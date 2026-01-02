import { getTaskByIdAction } from "@/app/actions/task-actions";
import { TaskDetailView } from "@/components/tasks/task-detail-view";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function TaskDetailPage(props: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const params = await props.params;
  const { id: farewellId, taskId } = params;

  const task = await getTaskByIdAction(farewellId, taskId);

  if (!task) {
    return notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <TaskDetailView task={task} farewellId={farewellId} currentUser={user} />
  );
}
