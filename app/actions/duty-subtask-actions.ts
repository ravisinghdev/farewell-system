"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";
import { logAudit } from "@/lib/audit-logger";

export async function createSubtaskAction(
  dutyId: string,
  farewellId: string,
  data: {
    title: string;
    description?: string;
    assignedTo?: string;
    estimatedHours?: number;
  }
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase.from("duty_subtasks").insert({
    duty_id: dutyId,
    title: data.title,
    description: data.description,
    assigned_to: data.assignedTo,
    estimated_hours: data.estimatedHours,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/duties`);
  // Also revalidate the specific duty page if needed
  revalidatePath(`/dashboard/${farewellId}/duties/${dutyId}`);

  return { success: true };
}

export async function updateSubtaskStatusAction(
  subtaskId: string,
  farewellId: string,
  status: "pending" | "in_progress" | "completed"
): Promise<ActionState> {
  const supabase = await createClient();

  // We rely on the DB trigger `update_duty_completion` to update the parent duty percentage
  const { error } = await supabase
    .from("duty_subtasks")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", subtaskId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function deleteSubtaskAction(
  subtaskId: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("duty_subtasks")
    .delete()
    .eq("id", subtaskId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}
