"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Real implementation for Payment System Features

// 1. Assign Money (Admin) -> Create Ledger Entry (Credit/Allocation)
export async function assignMoneyAction(
  farewellId: string,
  userId: string,
  amount: number
) {
  const supabase = await createClient();

  // Verify Admin (Add permission check here if needed)

  const { error } = await supabase.from("ledger_entries").insert({
    farewell_id: farewellId,
    user_id: userId,
    amount: amount,
    type: "allocation", // Using 'allocation' to represent assigned budget/money
    currency: "INR",
    meta: { description: "Admin assigned money" },
  });

  if (error) {
    console.error("Error assigning money:", error);
    return { error: "Failed to assign money" };
  }

  revalidatePath(`/dashboard/${farewellId}/admin/payments`);
  return { success: true };
}

// 2. Select Payment Amount (User) -> Create Contribution Request
export async function requestPaymentAction(
  farewellId: string,
  userId: string,
  amount: number
) {
  const supabase = await createClient();

  // Check available balance from allocation (Optional but good validation)
  // For now, we just create the request as 'pending'

  const { error } = await supabase.from("contributions").insert({
    farewell_id: farewellId,
    user_id: userId,
    amount: amount,
    method: "cash", // Or 'transfer', simplifying to 'cash' for internal payout tracking
    status: "pending", // Waiting for admin verification
    transaction_id: `REQ-${Date.now()}`,
  });

  if (error) {
    console.error("Error requesting payment:", error);
    return { error: "Failed to request payment" };
  }

  revalidatePath(`/dashboard/${farewellId}/contributions`);
  return { success: true };
}

// 3. Verify Payment (Admin) -> Approve Contribution
export async function verifyPaymentAction(
  contributionId: string,
  farewellId: string
) {
  const supabase = await createClient();

  // Verify Admin

  const { error } = await supabase
    .from("contributions")
    .update({ status: "verified" })
    .eq("id", contributionId);

  if (error) {
    console.error("Error verifying payment:", error);
    return { error: "Failed to verify payment" };
  }

  revalidatePath(`/dashboard/${farewellId}/admin/payments`);
  return { success: true };
}

// Stub for getPayoutMethodsAction (still needed for build until fully replaced)
export async function getPayoutMethodsAction() {
  return [];
}

export async function addPayoutMethodAction(type: string, details: any) {
  return { success: true };
}

export async function deletePayoutMethodAction(id: string) {
  return { success: true };
}

// 4. Get Farewell Members (Helper for Admin UI)
export async function getFarewellMembersAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farewell_members")
    .select("user_id, users(id, full_name, email)")
    .eq("farewell_id", farewellId);

  if (error) return [];

  return data.map((d: any) => ({
    id: d.users.id,
    name: d.users.full_name,
    email: d.users.email,
  }));
}

// 5. Get Pending Contributions (Helper for Admin UI)
export async function getPendingContributionsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contributions")
    .select("*, users(full_name)")
    .eq("farewell_id", farewellId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}
