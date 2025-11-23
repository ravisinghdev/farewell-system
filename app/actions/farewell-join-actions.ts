// app/actions/farewell-join-actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";

// your existing result type
interface JoinFarewellResult {
  status: "joined" | "pending" | "error";
  farewellId?: string;
  message?: string;
}

// existing core logic (already in your file)
export async function requestJoinFarewellAction(
  farewellId: string
): Promise<JoinFarewellResult> {
  const supabase = await createClient();

  // 1. current user
  const { data: userResp, error: userError } = await supabase.auth.getUser();
  if (userError || !userResp?.user) {
    return { status: "error", message: "Not authenticated" };
  }
  const user = userResp.user;

  // safety: ensure user not already in a farewell
  const { data: existingMember } = await supabase
    .from("farewell_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return {
      status: "error",
      message: "You are already part of a farewell.",
    };
  }

  // check farewell config
  const { data: farewell, error: farewellError } = await supabase
    .from("farewells")
    .select("id, requires_approval")
    .eq("id", farewellId)
    .maybeSingle();

  if (farewellError || !farewell) {
    return { status: "error", message: "Farewell not found." };
  }

  // auto-join
  if (!farewell.requires_approval) {
    const { error: insertError } = await supabase
      .from("farewell_members")
      .insert({
        farewell_id: farewell.id,
        user_id: user.id,
        role: "student",
        active: true,
      });

    if (insertError) {
      console.error(
        "requestJoinFarewellAction insert member error:",
        insertError
      );
      return { status: "error", message: "Failed to join farewell." };
    }

    return { status: "joined", farewellId: farewell.id };
  }

  // approval required → create join request
  const { data: existingRequest } = await supabase
    .from("farewell_join_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("farewell_id", farewell.id)
    .maybeSingle();

  if (existingRequest && existingRequest.status === "pending") {
    return {
      status: "pending",
      farewellId: farewell.id,
      message: "Your join request is already pending approval.",
    };
  }

  const { error: reqError } = await supabase
    .from("farewell_join_requests")
    .insert({
      user_id: user.id,
      farewell_id: farewell.id,
      status: "pending",
    });

  if (reqError) {
    console.error("requestJoinFarewellAction create request error:", reqError);
    return { status: "error", message: "Failed to submit join request." };
  }

  return { status: "pending", farewellId: farewell.id };
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
