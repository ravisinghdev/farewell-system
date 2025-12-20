"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

type ActionState = { success?: boolean; error?: string };

export async function updateDutyAction(
  dutyId: string,
  data: {
    title?: string;
    description?: string;
    priority?: string;
    deadline?: string;
    expense_limit?: number;
    location?: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("duties")
    .update({
      title: data.title,
      description: data.description,
      priority: data.priority,
      deadline: data.deadline,
      expense_limit: data.expense_limit,
      location: data.location,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dutyId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/[id]/duties`);
  return { success: true };
}

export async function deleteDutyAction(dutyId: string): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase.from("duties").delete().eq("id", dutyId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/[id]/duties`);
  return { success: true };
}
