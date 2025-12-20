"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";
import { logAudit } from "@/lib/audit-logger";
import { isFarewellAdmin } from "@/lib/auth/roles-server";
import { createSystemNotification } from "./notifications";

export interface Duty {
  id: string;
  farewell_id: string;
  title: string;
  description: string | null;
  expense_limit: number;
  deadline: string | null;
  status: "pending" | "in_progress" | "completed";
  created_by: string;
  created_at: string;
  updated_at: string;
  priority?: "low" | "medium" | "high";
  expense_limit_hard?: boolean;
  category?: string;
  location?: string;
  estimated_hours?: number;
  assignments?: DutyAssignment[];
  receipts?: DutyReceipt[];
}

export interface DutyAssignment {
  id: string;
  duty_id: string;
  user_id: string;
  assigned_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

export interface DutyReceipt {
  id: string;
  duty_id: string;
  uploader_id: string;
  amount: number;
  image_url: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  uploader?: {
    full_name: string;
    avatar_url: string;
  };
}

export async function getDutiesAction(farewellId: string): Promise<Duty[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("duties")
    .select(
      `
      *,
      assignments:duty_assignments(
        *,
        user:users!user_id(full_name, avatar_url, email)
      ),
      receipts:duty_receipts(
        *,
        uploader:users!uploader_id(full_name, avatar_url)
      )
    `
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching duties:", error);
    return [];
  }

  return data as unknown as Duty[];
}

export async function createDutyAction(
  farewellId: string,
  data: {
    title: string;
    description: string;
    expense_limit: number;
    deadline?: string;
    priority?: "low" | "medium" | "high";
    expense_limit_hard?: boolean;
    category?: string;
    location?: string;
    estimated_hours?: number | null;
  }
): Promise<ActionState<Duty>> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  const { data: duty, error } = await supabase
    .from("duties")
    .insert({
      farewell_id: farewellId,
      title: data.title,
      description: data.description,
      expense_limit: data.expense_limit,
      deadline: data.deadline,
      created_by: userId,
      priority: data.priority || "medium",
      expense_limit_hard: data.expense_limit_hard || false,
      category: data.category,
      location: data.location,
      estimated_hours: data.estimated_hours,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAudit({
    farewellId,
    action: "create_duty",
    targetId: duty.id,
    targetType: "duty",
    metadata: { title: data.title },
  });

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true, data: duty as unknown as Duty };
}

export async function assignDutiesAction(
  farewellId: string,
  dutyId: string,
  userIds: string[]
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  const assignments = userIds.map((uid) => ({
    duty_id: dutyId,
    user_id: uid,
    status: "accepted", // Auto-accept to skip acceptance step
  }));

  const { error } = await supabase.from("duty_assignments").insert(assignments);

  if (error) {
    if (error.code === "23505") return { error: "Some users already assigned" };
    return { error: error.message };
  }

  // Auto-transition duty to in_progress since assignments are auto-accepted
  await supabase
    .from("duties")
    .update({ status: "in_progress" })
    .eq("id", dutyId)
    .eq("status", "pending");

  await logAudit({
    farewellId,
    action: "assign_duty",
    targetId: dutyId,
    targetType: "duty",
    metadata: { assigned_user_ids: userIds },
  });

  // Notify assigned users
  // Get Duty Title for notification
  const { data: duty } = await supabase
    .from("duties")
    .select("title, farewell_id")
    .eq("id", dutyId)
    .single();
  if (duty) {
    for (const uid of userIds) {
      await createSystemNotification(
        uid,
        farewellId,
        "New Duty Assigned",
        `You have been assigned to: ${duty.title}. You can start submitting expenses now.`,
        "duty",
        `/dashboard/${farewellId}/duties/${dutyId}`
      );
    }
  }

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

// Accept or Reject Duty Assignment
export async function respondToAssignmentAction(
  dutyId: string,
  accept: boolean
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  // Get the assignment
  const { data: assignment, error: fetchError } = await supabase
    .from("duty_assignments")
    .select("*, duties(farewell_id, title)")
    .eq("duty_id", dutyId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !assignment) {
    return { error: "Assignment not found" };
  }

  const newStatus = accept ? "accepted" : "rejected";

  // Update assignment status
  const { error: updateError } = await supabase
    .from("duty_assignments")
    .update({ status: newStatus })
    .eq("duty_id", dutyId)
    .eq("user_id", userId);

  if (updateError) return { error: updateError.message };

  // If accepted, update duty status to in_progress if it was pending
  if (accept) {
    const { error: dutyUpdateError } = await supabase
      .from("duties")
      .update({ status: "in_progress" })
      .eq("id", dutyId)
      .eq("status", "pending");

    if (dutyUpdateError) {
      console.error("Failed to update duty status:", dutyUpdateError);
    }
  }

  // Log audit
  await logAudit({
    farewellId: (assignment.duties as any).farewell_id,
    action: accept ? "accept_duty" : "reject_duty",
    targetId: dutyId,
    targetType: "duty",
    metadata: { assignment_id: assignment.id },
  });

  // Send notification to admins
  const farewellId = (assignment.duties as any).farewell_id;
  const dutyTitle = (assignment.duties as any).title;

  await createSystemNotification(
    userId,
    farewellId,
    accept ? "Duty Accepted" : "Duty Declined",
    accept ? `You accepted: ${dutyTitle}` : `You declined: ${dutyTitle}`,
    "duty",
    `/dashboard/${farewellId}/duties/${dutyId}`
  );

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function updateDutyStatusAction(
  farewellId: string,
  dutyId: string,
  status: "pending" | "in_progress" | "completed"
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("duties")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", dutyId);

  if (error) return { error: error.message };

  await logAudit({
    farewellId,
    action: "update_duty_status",
    targetId: dutyId,
    targetType: "duty",
    metadata: { status },
  });

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function uploadDutyReceiptAction(
  farewellId: string,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const dutyId = formData.get("dutyId") as string;
  const amount = Number(formData.get("amount"));
  const notes = formData.get("notes") as string;
  const file = formData.get("file") as File;

  if (!file || !dutyId || !amount) return { error: "Missing required fields" };

  const fileExt = file.name.split(".").pop();
  const fileName = `${dutyId}/${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(fileName, file);

  // Validate Assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from("duty_assignments")
    .select("id")
    .eq("duty_id", dutyId)
    .eq("user_id", userId)
    .single();

  if (assignmentError || !assignment) {
    return { error: "You are not assigned to this duty." };
  }

  if (uploadError) return { error: "Failed to upload receipt image" };

  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(fileName);

  const { data: receipt, error } = await supabase
    .from("duty_receipts")
    .insert({
      duty_id: dutyId,
      uploader_id: userId,
      amount,
      notes,
      image_url: publicUrl,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAudit({
    farewellId,
    action: "upload_receipt",
    targetId: receipt.id,
    targetType: "receipt",
    metadata: { amount, dutyId },
  });

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function approveDutyReceiptAction(
  farewellId: string,
  receiptId: string,
  adminNotes?: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  /* 
     CALLING RPC for Transactional Approval 
     Reference: 20251213010000_duty_ledger_system.sql
  */
  const { data: rpcData, error } = await supabase.rpc("approve_duty_receipt", {
    p_receipt_id: receiptId,
    p_admin_notes: adminNotes || null,
  });

  if (error) return { error: error.message };

  // RPC returns { success: boolean, error?: string }
  // We need to cast or check it. Supabase RPC returns `any` often, or typed if we had types.
  const result = rpcData as any;
  if (!result.success) {
    return { error: result.error || "Approval failed" };
  }

  await logAudit({
    farewellId,
    action: "approve_receipt",
    targetId: receiptId,
    targetType: "receipt",
  });

  // Notify Uploader
  // Need to fetch receipt details first or depend on what we know?
  // We only have receiptId.
  const { data: receipt } = await supabase
    .from("duty_receipts")
    .select("uploader_id, sections:duties(title)")
    .eq("id", receiptId)
    .single();
  // Note: sections:duties(...) join might fail if not set up, using query
  // But we know dutyId... wait, we don't have dutyId in args here easily, passed via client?
  // We can fetch it.
  if (receipt && receipt.uploader_id) {
    // @ts-ignore
    const dutyTitle = receipt.sections?.title || "Duty";
    await createSystemNotification(
      receipt.uploader_id,
      farewellId,
      "Expense Approved",
      `Your expense for ${dutyTitle} has been approved.`,
      "finance",
      `/dashboard/${farewellId}/duties`
    );
  }

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function rejectDutyReceiptAction(
  farewellId: string,
  receiptId: string,
  adminNotes?: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("duty_receipts")
    .update({
      status: "rejected",
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq("id", receiptId);

  if (error) return { error: error.message };

  await logAudit({
    farewellId,
    action: "reject_receipt",
    targetId: receiptId,
    targetType: "receipt",
  });

  // Notify Uploader
  const { data: receiptRec } = await supabase
    .from("duty_receipts")
    .select("uploader_id, duties(title)")
    .eq("id", receiptId)
    .single();
  if (receiptRec && receiptRec.uploader_id) {
    // @ts-ignore
    const dutyTitle = receiptRec.duties?.title || "Duty";
    await createSystemNotification(
      receiptRec.uploader_id,
      farewellId,
      "Expense Rejected",
      `Your expense for ${dutyTitle} was rejected.${
        adminNotes ? ` Reason: ${adminNotes}` : ""
      }`,
      "finance",
      `/dashboard/${farewellId}/duties`
    );
  }

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function getLedgerAction(farewellId: string) {
  const supabase = await createClient();

  // Note: RLS allows all farewell members to view
  const { data, error } = await supabase
    .from("ledger")
    .select(
      `
      *,
      created_by_user:users!created_by(full_name, avatar_url)
    `
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ledger:", error);
    return [];
  }

  return data;
}

// Unassign a user from a duty
export async function unassignDutyAction(
  farewellId: string,
  dutyId: string,
  userIdToRemove: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("duty_assignments")
    .delete()
    .eq("duty_id", dutyId)
    .eq("user_id", userIdToRemove);

  if (error) return { error: error.message };

  await logAudit({
    farewellId,
    action: "unassign_duty",
    targetId: dutyId,
    targetType: "duty",
    metadata: { removed_user_id: userIdToRemove },
  });

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}
