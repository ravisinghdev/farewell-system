"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";
import { logAudit } from "@/lib/audit-logger";
import { isFarewellAdmin } from "@/lib/auth/roles-server";
import { createSystemNotification } from "./notifications";
import {
  Duty,
  DutyAssignment,
  DutyReceipt,
  ReceiptVote,
  DutyStatus,
} from "@/types/duties";

// Types are imported for internal use but not re-exported to avoid build issues
// import { Duty, DutyAssignment, DutyReceipt, ReceiptVote, DutyStatus } from "@/types/duties";

// --- Fetch Actions ---

export async function getDutiesAction(farewellId: string): Promise<Duty[]> {
  const supabase = await createClient();

  // 1. Fetch Duties + Assignments
  const { data: dutiesData, error: dutiesError } = await supabase
    .from("duties")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (dutiesError) {
    console.error("Error fetching duties:", dutiesError);
    return [];
  }

  // 2. Fetch Nested Data Manually (Robustness)
  const dutyIds = dutiesData.map((d) => d.id);
  let receiptsMap: Record<string, DutyReceipt[]> = {};
  let assignmentsMap: Record<string, DutyAssignment[]> = {};

  if (dutyIds.length > 0) {
    // 2a. Fetch Receipts
    const { data: receiptsData } = await supabase
      .from("duty_receipts")
      .select(
        `
        *,
        uploader:users!duty_receipts_uploader_id_fkey(full_name, avatar_url)
      `
      )
      .in("duty_id", dutyIds);

    // 2b. Fetch Assignments
    const { data: assignmentsData } = await supabase
      .from("duty_assignments")
      .select(
        `
        *,
        user:users!duty_assignments_user_id_fkey(full_name, avatar_url, email)
      `
      )
      .in("duty_id", dutyIds);

    if (assignmentsData) {
      assignmentsData.forEach((a) => {
        if (!assignmentsMap[a.duty_id]) assignmentsMap[a.duty_id] = [];
        assignmentsMap[a.duty_id].push(a as any);
      });
    }

    if (receiptsData && receiptsData.length > 0) {
      // 2c. Fetch Votes
      const receiptIds = receiptsData.map((r) => r.id);
      let votesMap: Record<string, ReceiptVote[]> = {};

      const { data: votesData } = await supabase
        .from("receipt_votes")
        .select(
          `
          *,
          voter:users!receipt_votes_voter_id_fkey(full_name, avatar_url)
        `
        )
        .in("receipt_id", receiptIds);

      if (votesData) {
        votesData.forEach((v) => {
          if (!votesMap[v.receipt_id]) votesMap[v.receipt_id] = [];
          votesMap[v.receipt_id].push(v as any);
        });
      }

      receiptsData.forEach((r) => {
        const receiptWithVotes = { ...r, votes: votesMap[r.id] || [] };
        if (!receiptsMap[r.duty_id]) receiptsMap[r.duty_id] = [];
        receiptsMap[r.duty_id].push(receiptWithVotes as any);
      });
    }
  }

  // 3. Merge and Map to UI Type
  return (dutiesData as any[]).map((d) => ({
    id: d.id,
    farewell_id: d.farewell_id,
    title: d.title,
    description: d.description,
    category: d.category || "General",
    min_assignees: 1,
    max_assignees: 1,
    status: d.status as DutyStatus,
    created_at: d.created_at,
    updated_at: d.updated_at,
    receipts: receiptsMap[d.id] || [],
    assignments: assignmentsMap[d.id] || [],
    // Legacy mapping if needed
    expense_type: d.expense_type,
    expected_amount: d.expected_amount,
    final_amount: d.final_amount,
    deadline: d.deadline,
    priority: d.priority,
  })) as Duty[];
}

// --- Write Actions ---

export async function createDutyAction(
  farewellId: string,
  data: {
    title: string;
    description: string;
    expense_type: "none" | "reimbursable" | "advance";
    expected_amount: number;
    deadline?: string;
    category?: string;
    priority?: "low" | "medium" | "high";
  }
): Promise<ActionState<Duty>> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  // Check Admin Permission
  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) {
    return { error: "Only admins can create duties." };
  }

  const { data: duty, error } = await supabase
    .from("duties")
    .insert({
      farewell_id: farewellId,
      title: data.title,
      description: data.description,
      expense_type: data.expense_type,
      expected_amount: data.expected_amount,
      deadline: data.deadline || null,
      category: data.category,
      priority: data.priority || "medium",
      status: "pending",
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

export async function uploadDutyReceiptAction(
  farewellId: string,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const dutyId = formData.get("dutyId") as string;
  const amount = Number(formData.get("amount"));
  const paymentMode = formData.get("paymentMode") as string;
  const file = formData.get("file") as File;

  if (!file || !dutyId || !amount) return { error: "Missing required fields" };

  // Upload Image
  const fileExt = file.name.split(".").pop();
  const fileName = `${dutyId}/${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(fileName, file);

  if (uploadError) return { error: "Failed to upload receipt image" };

  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(fileName);

  // Create Receipt
  const { data: receipt, error } = await supabase
    .from("duty_receipts")
    .insert({
      duty_id: dutyId,
      uploader_id: userId,
      amount_paid: amount,
      payment_mode: paymentMode,
      image_url: publicUrl,
      status: "pending_vote",
    })
    .select()
    .single();

  if (error) {
    console.error("Upload Receipt Error:", error);
    return { error: error.message };
  }
  console.log("Upload Receipt Success:", receipt);

  // Update Duty Status -> Voting
  await supabase.from("duties").update({ status: "voting" }).eq("id", dutyId);

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

export async function castReceiptVoteAction(
  farewellId: string,
  receiptId: string,
  vote: "valid" | "invalid",
  comment?: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const { error } = await supabase.from("receipt_votes").insert({
    receipt_id: receiptId,
    voter_id: userId,
    user_id: userId, // Legacy or Required field
    vote,
    comment,
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already voted." };
    return { error: error.message };
  }

  // Check if we have enough votes to move to Admin Review?
  // Logic: If > 3 'valid' votes, auto-move to admin_review.
  // Using Admin client to count votes securely
  const { count } = await supabaseAdmin
    .from("receipt_votes")
    .select("*", { count: "exact", head: true })
    .eq("receipt_id", receiptId)
    .eq("vote", "valid");

  if ((count || 0) >= 2) {
    // Find duty_id from receipt
    const { data: receipt } = await supabaseAdmin
      .from("duty_receipts")
      .select("duty_id")
      .eq("id", receiptId)
      .single();
    if (receipt) {
      await supabaseAdmin
        .from("duties")
        .update({ status: "admin_review" })
        .eq("id", receipt.duty_id);
    }
  }

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function approveDutyReceiptAction(
  farewellId: string,
  receiptId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  // 1. Mark Receipt Approved
  const { error: rError } = await supabase
    .from("duty_receipts")
    .update({ status: "approved" })
    .eq("id", receiptId);

  if (rError) return { error: rError.message };

  // 2. Lock Duty (Approved, Final Amount)
  // Fetch receipt amount first
  const { data: receipt } = await supabase
    .from("duty_receipts")
    .select("*")
    .eq("id", receiptId)
    .single();

  if (receipt) {
    await supabase
      .from("duties")
      .update({
        status: "approved",
        final_amount: receipt.amount_paid,
      })
      .eq("id", receipt.duty_id);

    // Notify user
    await createSystemNotification(
      receipt.uploader_id,
      farewellId,
      "Expense Approved",
      "Your expense has been approved by admin.",
      "finance",
      `/dashboard/${farewellId}/duties`
    );
  }

  await logAudit({
    farewellId,
    action: "approve_receipt",
    targetId: receiptId,
    targetType: "receipt",
  });

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function rejectDutyReceiptAction(
  farewellId: string,
  receiptId: string,
  reason: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("duty_receipts")
    .update({ status: "rejected" })
    .eq("id", receiptId);

  if (error) return { error: error.message };

  // Set duty back to 'pending_receipt' (or keep as is? usually re-upload needed)
  // We assume workflow -> back to pending_receipt
  const { data: receipt } = await supabase
    .from("duty_receipts")
    .select("duty_id, uploader_id")
    .eq("id", receiptId)
    .single();
  if (receipt) {
    await supabase
      .from("duties")
      .update({ status: "pending_receipt" })
      .eq("id", receipt.duty_id);

    await createSystemNotification(
      receipt.uploader_id,
      farewellId,
      "Expense Rejected",
      `Your expense was rejected: ${reason}`,
      "finance",
      `/dashboard/${farewellId}/duties`
    );
  }

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

// --- Legacy / Helper Wrappers ---

export async function assignDutiesAction(
  farewellId: string,
  dutyId: string,
  userIds: string[]
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  const assignments = userIds.map((uid) => ({
    duty_id: dutyId,
    user_id: uid,
  }));

  const { error } = await supabase.from("duty_assignments").insert(assignments);
  if (error) return { error: error.message };

  await supabase
    .from("duties")
    .update({ status: "in_progress" }) // Move to In Progress
    .eq("id", dutyId);

  // Notify Assignees
  // Fetch duty title for message
  const { data: duty } = await supabase
    .from("duties")
    .select("title")
    .eq("id", dutyId)
    .single();

  if (duty) {
    await Promise.all(
      userIds.map((uid) =>
        createSystemNotification(
          uid,
          farewellId,
          "New Duty Assigned",
          `You have been assigned to: ${duty.title}`,
          "duty",
          `/dashboard/${farewellId}/duties`
        )
      )
    );
  }

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function unassignDutyAction(
  farewellId: string,
  dutyId: string,
  userIdToRemove: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  await supabase
    .from("duty_assignments")
    .delete()
    .eq("duty_id", dutyId)
    .eq("user_id", userIdToRemove);

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function deleteDutyAction(
  farewellId: string,
  dutyId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);
  if (!isAdmin) return { error: "Unauthorized" };

  await supabase.from("duties").delete().eq("id", dutyId);

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function updateDutyAction(
  dutyId: string,
  farewellId: string,
  updates: any
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const isAdmin = await isFarewellAdmin(farewellId, userId);

  // Check if assignee
  let isAssignee = false;
  if (!isAdmin) {
    const { data: assignment } = await supabase
      .from("duty_assignments")
      .select("id")
      .eq("duty_id", dutyId)
      .eq("user_id", userId)
      .single();
    isAssignee = !!assignment;
  }

  if (!isAdmin && !isAssignee) {
    return {
      error:
        "Unauthorized: You must be an admin or assignee to edit this duty.",
    };
  }

  const { error } = await supabase
    .from("duties")
    .update(updates)
    .eq("id", dutyId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}

export async function getFarewellMembersAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farewell_members")
    .select(
      `
      user_id,
      role,
      user:users(id, full_name, avatar_url, email)
    `
    )
    .eq("farewell_id", farewellId);

  if (error) {
    console.error("Error fetching farewell members:", error);
    return [];
  }

  return data;
}
