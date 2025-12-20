"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

export async function addBudgetItemAction(
  dutyId: string,
  farewellId: string,
  data: {
    category: string;
    description: string;
    estimatedAmount: number;
    vendor?: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase.from("duty_budget_items").insert({
    duty_id: dutyId,
    category: data.category,
    description: data.description,
    estimated_amount: data.estimatedAmount,
    vendor: data.vendor,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function deleteBudgetItemAction(
  itemId: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("duty_budget_items")
    .delete()
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function updateBudgetItemAction(
  itemId: string,
  farewellId: string,
  data: {
    actualAmount?: number;
    notes?: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("duty_budget_items")
    .update({
      actual_amount: data.actualAmount,
      notes: data.notes,
    })
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}
