"use server";

import { createClient } from "@/utils/supabase/server";
import { ActionState } from "@/types/custom";

interface JoinData {
  status: "joined" | "pending";
  farewellId?: string;
}

export async function requestJoinFarewellAction(
  farewellId: string
): Promise<ActionState<JoinData>> {
  const supabase = await createClient();

  // 1. current user
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) {
    return { error: "Not authenticated" };
  }
  const userId = claimsData.claims.sub;

  // safety: ensure user not already in a farewell
  const { data: existingMember } = await supabase
    .from("farewell_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    return {
      error: "You are already part of a farewell.",
    };
  }

  // check farewell config
  const { data: farewell, error: farewellError } = await supabase
    .from("farewells")
    .select("id, requires_approval")
    .eq("id", farewellId)
    .maybeSingle();

  if (farewellError || !farewell) {
    return { error: "Farewell not found." };
  }

  // auto-join
  if (!farewell.requires_approval) {
    const { error: insertError } = await supabase
      .from("farewell_members")
      .insert({
        farewell_id: farewell.id,
        user_id: userId,
        role: "student",
        status: "approved", // Changed from active: true to status: 'approved'
      });

    if (insertError) {
      // Handle unique constraint violation (already a member)
      if (insertError.code === "23505") {
        return {
          success: true,
          data: { status: "joined", farewellId: farewell.id },
        };
      }

      console.error(
        "requestJoinFarewellAction insert member error:",
        insertError
      );
      return { error: "Failed to join farewell." };
    }

    return {
      success: true,
      data: { status: "joined", farewellId: farewell.id },
    };
  }

  // approval required → create join request
  const { data: existingRequest } = await supabase
    .from("farewell_join_requests")
    .select("id, status")
    .eq("user_id", userId)
    .eq("farewell_id", farewell.id)
    .maybeSingle();

  if (existingRequest && existingRequest.status === "pending") {
    return {
      success: true,
      data: { status: "pending", farewellId: farewell.id },
      error: "Your join request is already pending approval.", // Optional info
    };
  }

  const { error: reqError } = await supabase
    .from("farewell_join_requests")
    .insert({
      user_id: userId,
      farewell_id: farewell.id,
      status: "pending",
    });

  if (reqError) {
    console.error("requestJoinFarewellAction create request error:", reqError);
    return { error: "Failed to submit join request." };
  }

  return {
    success: true,
    data: { status: "pending", farewellId: farewell.id },
  };
}

// ✅ Form-compatible server action (void-return, FormData-based)
export async function joinFarewellFormAction(
  formData: FormData
): Promise<void> {
  const farewellId = formData.get("farewellId") as string | null;
  if (!farewellId) return;

  await requestJoinFarewellAction(farewellId);
  // redirect logic is handled by your post-login / routing system
}
