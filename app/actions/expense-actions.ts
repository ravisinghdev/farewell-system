"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  paid_by: string | null;
  receipt_url: string | null;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
  } | null;
};

export async function getExpensesAction(farewellId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      users:paid_by (
        full_name,
        email
      )
    `
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching expenses:", error);
    return { error: "Failed to fetch expenses" };
  }

  return { expenses: data as Expense[] };
}

export async function createExpenseAction(
  farewellId: string,
  data: {
    title: string;
    amount: number;
    category: string;
    paid_by?: string;
  }
) {
  const user = await getCurrentUserWithRole(farewellId);
  if (!user) return { error: "Not authenticated" };

  const isAdmin =
    user.role === "main_admin" ||
    user.role === "parallel_admin" ||
    user.role === "admin";

  if (!isAdmin) return { error: "Unauthorized" };

  const supabase = await createClient();

  const { error } = await supabase.from("expenses").insert({
    farewell_id: farewellId,
    title: data.title,
    amount: data.amount,
    category: data.category,
    paid_by: data.paid_by || user.id,
    approved_by: user.id, // Auto-approve if added by admin
  });

  if (error) {
    console.error("Error creating expense:", error);
    return { error: "Failed to create expense" };
  }

  revalidatePath(`/dashboard/${farewellId}/budget`);
  return { success: true };
}

export async function deleteExpenseAction(
  farewellId: string,
  expenseId: string
) {
  const user = await getCurrentUserWithRole(farewellId);
  if (!user) return { error: "Not authenticated" };

  const isAdmin =
    user.role === "main_admin" ||
    user.role === "parallel_admin" ||
    user.role === "admin";

  if (!isAdmin) return { error: "Unauthorized" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("farewell_id", farewellId);

  if (error) {
    console.error("Error deleting expense:", error);
    return { error: "Failed to delete expense" };
  }

  revalidatePath(`/dashboard/${farewellId}/budget`);
  return { success: true };
}
