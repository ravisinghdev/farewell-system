"use server";

import { createClient } from "@/utils/supabase/server";

export async function getPayoutMethodsAction() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) throw new Error("Unauthorized");
  const userId = claimsData.claims.sub;

  const { data, error } = await supabase
    .from("user_payout_methods")
    .select("*")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false });

  if (error) {
    console.error("Error fetching payout methods:", error);
    throw new Error("Failed to fetch payout methods");
  }

  return data;
}

export async function addPayoutMethodAction(
  methodType: "upi" | "bank_transfer" | "cash",
  details: any
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) throw new Error("Unauthorized");
  const userId = claimsData.claims.sub;

  // If this is the first method, make it primary
  const { count } = await supabase
    .from("user_payout_methods")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const isPrimary = count === 0;

  const { data, error } = await supabase
    .from("user_payout_methods")
    .insert({
      user_id: userId,
      method_type: methodType,
      details,
      is_primary: isPrimary,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error adding payout method:", error);
    throw new Error("Failed to add payout method");
  }

  return data;
}

export async function deletePayoutMethodAction(id: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) throw new Error("Unauthorized");
  const userId = claimsData.claims.sub;

  const { error } = await supabase
    .from("user_payout_methods")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error("Failed to delete payout method");

  return { success: true };
}
