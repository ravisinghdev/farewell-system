"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { checkIsAdmin } from "@/lib/auth/roles";

export async function updateFarewellBudgetAction(
  farewellId: string,
  amount: number
) {
  const user = await getCurrentUserWithRole(farewellId);

  if (!user) return { error: "Not authenticated" };

  const isAdmin = user.role === "main_admin" || user.role === "parallel_admin";

  if (!isAdmin) return { error: "Unauthorized: Admin access required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("farewells")
    .update({ budget_goal: amount })
    .eq("id", farewellId);

  if (error) {
    console.error("Error updating budget:", error);
    return { error: "Failed to update budget" };
  }

  revalidatePath(`/dashboard/${farewellId}/contributions`);
  return { success: true };
}

export async function assignMemberContributionAction(
  farewellId: string,
  userId: string,
  amount: number
) {
  const user = await getCurrentUserWithRole(farewellId);

  if (!user) return { error: "Not authenticated" };

  const isAdmin =
    user.role === "main_admin" ||
    user.role === "parallel_admin" ||
    user.role === "admin";

  if (!isAdmin) return { error: "Unauthorized: Admin access required" };

  // Use admin client to update another user's row in farewell_members
  const { error } = await supabaseAdmin
    .from("farewell_members")
    .update({ assigned_amount: amount })
    .eq("farewell_id", farewellId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error assigning contribution:", error);
    return { error: "Failed to assign contribution" };
  }

  revalidatePath(`/dashboard/${farewellId}/contributions`);
  return { success: true };
}

export async function getFarewellBudgetDetailsAction(farewellId: string) {
  const supabase = await createClient();

  const { data: farewell, error: fError } = await supabase
    .from("farewells")
    .select("budget_goal")
    .eq("id", farewellId)
    .single();

  if (fError) return { error: "Failed to fetch farewell" };

  const { data: members, error: mError } = await supabase
    .from("farewell_members")
    .select("user_id, assigned_amount, users(full_name, email)")
    .eq("farewell_id", farewellId);

  if (mError) return { error: "Failed to fetch members" };

  return {
    budgetGoal: farewell.budget_goal,
    members: members.map((m: any) => ({
      userId: m.user_id,
      name: Array.isArray(m.users) ? m.users[0]?.full_name : m.users?.full_name,
      email: Array.isArray(m.users) ? m.users[0]?.email : m.users?.email,
      assignedAmount: m.assigned_amount,
    })),
  };
}

export async function getMyAssignedAmountAction(farewellId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    console.log("getMyAssignedAmountAction: No user ID");
    return 0;
  }

  // Use admin client to ensure we can read the assigned amount regardless of RLS
  const { data: member, error } = await supabaseAdmin
    .from("farewell_members")
    .select("assigned_amount")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("getMyAssignedAmountAction Error:", error);
    return 0;
  }

  if (!member) {
    console.log("getMyAssignedAmountAction: Member not found");
    return 0;
  }

  console.log(
    "getMyAssignedAmountAction: Found amount",
    member.assigned_amount
  );
  return member.assigned_amount || 0;
}

export async function distributeBudgetEquallyAction(
  farewellId: string,
  totalAmount: number
) {
  const user = await getCurrentUserWithRole(farewellId);

  if (!user) return { error: "Not authenticated" };

  const isAdmin =
    user.role === "main_admin" ||
    user.role === "parallel_admin" ||
    user.role === "admin";

  if (!isAdmin) return { error: "Unauthorized: Admin access required" };

  const supabase = await createClient();

  // 1. Update total budget goal
  const { error: budgetError } = await supabase
    .from("farewells")
    .update({ budget_goal: totalAmount })
    .eq("id", farewellId);

  if (budgetError) {
    console.error("Error updating budget goal:", budgetError);
    return { error: "Failed to update budget goal" };
  }

  // 2. Get all members count
  const { count, error: countError } = await supabase
    .from("farewell_members")
    .select("*", { count: "exact", head: true })
    .eq("farewell_id", farewellId);

  if (countError || count === null || count === 0) {
    return { error: "Failed to fetch members count" };
  }

  // 3. Calculate share
  const share = Math.ceil(totalAmount / count);

  // 4. Update all members
  const { error: updateError } = await supabaseAdmin
    .from("farewell_members")
    .update({ assigned_amount: share })
    .eq("farewell_id", farewellId);

  if (updateError) {
    console.error("Error distributing budget:", updateError);
    return { error: "Failed to distribute budget" };
  }

  revalidatePath(`/dashboard/${farewellId}/contributions`);
  return { success: true, share };
}
