"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { checkIsAdmin } from "@/lib/auth/roles";

export async function recordCashPaymentAction(
  farewellId: string,
  userId: string,
  amount: number
) {
  const user = await getCurrentUserWithRole(farewellId);
  if (!user) return { error: "Not authenticated" };

  const isAdmin = checkIsAdmin(user.role);
  if (!isAdmin) return { error: "Unauthorized" };

  const supabase = await createClient();

  // 1. Create contribution record
  const { error: contributionError } = await supabaseAdmin
    .from("contributions")
    .insert({
      farewell_id: farewellId,
      user_id: userId,
      amount: amount,
      method: "cash",
      status: "verified",
      verified_by: user.id,
      transaction_id: `CASH-${Date.now()}`, // Generate a pseudo-ID for cash
    });

  if (contributionError) {
    console.error("Error recording cash payment:", contributionError);
    return { error: "Failed to record payment" };
  }

  // 2. Update member's assigned amount (optional, but good to keep in sync if needed,
  // or maybe we just track contributions against assigned amount.
  // The prompt says "they have to taget user and after successful addition the repective user also get the receipt".
  // The receipt is generated from the contribution record, so that's covered.

  revalidatePath(`/dashboard/${farewellId}/budget`);
  revalidatePath(`/dashboard/${farewellId}/contributions`);

  return { success: true };
}
