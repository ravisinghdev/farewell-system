"use server";

import { supabaseAdmin } from "@/utils/supabase/admin"; // service-role client
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ActionState } from "@/types/custom";

/**
 * We assume only main_admin / parallel_admin (in farewell_members.role)
 * can approve join requests for that farewell.
 */
export async function approveJoinRequestAction(
  requestId: string
): Promise<ActionState> {
  const supabase = await createClient();

  // 1. Identify the current user
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) {
    return { error: "Not authenticated" };
  }

  const currentUserId = claimsData.claims.sub;

  // 2. Load the join request
  const { data: request, error: reqError } = await supabaseAdmin
    .from("farewell_join_requests")
    .select("id, user_id, farewell_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (reqError || !request) {
    return { error: "Join request not found" };
  }

  if (request.status !== "pending") {
    return { error: "Request is not pending" };
  }

  // 3. Check if current user is an admin of that farewell
  const { data: adminMember, error: memberError } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", request.farewell_id)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (memberError || !adminMember) {
    return { error: "You are not part of this farewell" };
  }

  if (
    adminMember.role !== "main_admin" &&
    adminMember.role !== "parallel_admin"
  ) {
    return { error: "Forbidden: only admins can approve join requests" };
  }

  // 4. Approve: create membership + update request
  const { error: memberInsertError } = await supabaseAdmin
    .from("farewell_members")
    .insert({
      farewell_id: request.farewell_id,
      user_id: request.user_id,
      role: "student",
      status: "approved", // Changed from active: true to status: 'approved'
    });

  if (memberInsertError) {
    console.error(
      "approveJoinRequestAction memberInsertError:",
      memberInsertError
    );
    return { error: "Failed to create membership" };
  }

  const { error: updateReqError } = await supabaseAdmin
    .from("farewell_join_requests")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", request.id);

  if (updateReqError) {
    console.error("approveJoinRequestAction updateReqError:", updateReqError);
    return { error: "Failed to update join request" };
  }

  // Optionally: insert notification for that user

  return { success: true };
}

export async function rejectJoinRequestAction(
  requestId: string
): Promise<ActionState> {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) {
    return { error: "Not authenticated" };
  }

  const currentUserId = claimsData.claims.sub;

  const { data: request, error: reqError } = await supabaseAdmin
    .from("farewell_join_requests")
    .select("id, user_id, farewell_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (reqError || !request) {
    return { error: "Join request not found" };
  }

  if (request.status !== "pending") {
    return { error: "Request is not pending" };
  }

  const { data: adminMember, error: memberError } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", request.farewell_id)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (memberError || !adminMember) {
    return { error: "You are not part of this farewell" };
  }

  if (
    adminMember.role !== "main_admin" &&
    adminMember.role !== "parallel_admin"
  ) {
    return { error: "Forbidden: only admins can reject join requests" };
  }

  const { error: updateReqError } = await supabaseAdmin
    .from("farewell_join_requests")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", request.id);

  if (updateReqError) {
    console.error("rejectJoinRequestAction updateReqError:", updateReqError);
    return { error: "Failed to update join request" };
  }

  return { success: true };
}

export async function createFarewellAction(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const year = Number(formData.get("year"));
  const section = formData.get("section") as string;
  const requiresApproval = formData.get("requiresApproval") === "on";

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return;

  const userId = claimsData.claims.sub;

  // 1. Create Farewell
  const { data: farewell, error: createError } = await supabase
    .from("farewells")
    .insert({
      name,
      section,
      year,
      created_by: userId,
      requires_approval: requiresApproval,
    })
    .select()
    .single();

  if (createError) {
    console.error("Failed to create farewell:", createError);
    return;
  }

  // 2. Add Creator as Admin
  const { error: memberError } = await supabase
    .from("farewell_members")
    .insert({
      farewell_id: farewell.id,
      user_id: userId,
      role: "admin",
      status: "approved",
    });

  if (memberError) {
    console.error("Failed to add creator as admin:", memberError);
    // Should probably delete the farewell or retry
  }

  redirect("/dashboard");
}
