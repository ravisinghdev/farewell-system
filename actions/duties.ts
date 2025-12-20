"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- Helper: Create Notification ---
async function createNotification(
  supabase: any,
  userId: string,
  farewellId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    farewell_id: farewellId,
    title,
    message,
    type,
    link,
  });
}

// --- Fetch Duties ---
export async function getDutiesAction(farewellId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("duties")
    .select(
      `
      *,
      duty_assignments (
        id,
        user_id,
        status,
        responded_at,
        users!duty_assignments_user_id_fkey (
          full_name,
          avatar_url
        )
      ),
      duty_receipts (
        id,
        amount,
        status,
        created_at,
        image_url,
        evidence_files,
        notes,
        items,
        uploader_id,
        receipt_votes (
          id,
          user_id
        )
      )
    `
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching duties:", error);
    return [];
  }

  return data || [];
}

// --- Create Duty ---
export async function createDutyAction(
  farewellId: string,
  title: string,
  description: string,
  expenseLimit?: number,
  deadline?: string
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) throw new Error("Unauthorized");
  const userId = claimsData.claims.sub;

  const { data, error } = await supabase
    .from("duties")
    .insert({
      farewell_id: farewellId,
      title,
      description,
      expense_limit: expenseLimit,
      deadline,
      created_by: userId,
      status: "pending",
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating duty:", error);
    throw new Error("Failed to create duty");
  }

  return data;
}

// --- Assign Duty ---
export async function assignDutyAction(dutyId: string, userIds: string[]) {
  const supabase = await createClient();

  // Get duty details for notification
  const { data: duty } = (await supabase
    .from("duties")
    .select("title, farewell_id")
    .eq("id", dutyId)
    .single()) as { data: any; error: any };

  if (!duty) throw new Error("Duty not found");

  // Create assignments
  const assignments = userIds.map((userId) => ({
    duty_id: dutyId,
    user_id: userId,
    status: "pending",
  }));

  const { data, error } = await supabase
    .from("duty_assignments")
    .insert(assignments as any)
    .select();

  if (error) {
    console.error("Error assigning duty:", error);
    throw new Error("Failed to assign duty");
  }

  // Update duty status
  const dutyQuery = supabase.from("duties") as any;
  await dutyQuery.update({ status: "awaiting_acceptance" }).eq("id", dutyId);

  // Notify users
  for (const userId of userIds) {
    await createNotification(
      supabase,
      userId,
      duty.farewell_id,
      "New Duty Assigned",
      `You have been assigned to duty: ${duty.title}`,
      "duty",
      `/dashboard/${duty.farewell_id}/duties/${dutyId}`
    );
  }

  return data;
}

// --- Respond to Assignment ---
export async function respondToAssignmentAction(
  dutyId: string,
  accept: boolean
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) throw new Error("Unauthorized");
  const userId = claimsData.claims.sub;
  const userEmail = claimsData.claims.email;

  const status = accept ? "accepted" : "rejected";

  // Use 'as any' on the query builder to bypass strict type checking if needed
  const query = supabase.from("duty_assignments") as any;
  const { error } = await query
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq("duty_id", dutyId)
    .eq("user_id", userId);

  if (error) throw new Error("Failed to update assignment status");

  if (accept) {
    const dutyQuery = supabase.from("duties") as any;
    const { error: updateError } = await dutyQuery
      .update({ status: "in_progress" })
      .eq("id", dutyId);

    if (updateError) {
      console.error("Failed to update duty status:", updateError);
    }
  }

  // Notify creator/admin
  const { data: duty } = (await supabase
    .from("duties")
    .select("created_by, title, farewell_id")
    .eq("id", dutyId)
    .single()) as { data: any; error: any };

  if (duty && duty.created_by) {
    await createNotification(
      supabase,
      duty.created_by,
      duty.farewell_id,
      `Duty Assignment ${accept ? "Accepted" : "Declined"}`,
      `${userEmail} has ${accept ? "accepted" : "declined"} the duty: ${
        duty.title
      }`,
      "duty",
      `/dashboard/${duty.farewell_id}/duties/${dutyId}`
    );
  }

  return { success: true };
}

// --- Post Duty Update ---
export async function postDutyUpdateAction(
  dutyId: string,
  content: string,
  attachments: string[] = []
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) throw new Error("Unauthorized");
  const userId = claimsData.claims.sub;

  const { data, error } = await supabase
    .from("duty_updates")
    .insert({
      duty_id: dutyId,
      user_id: userId,
      content,
      attachments,
    } as any)
    .select()
    .single();

  if (error) throw new Error("Failed to post update");

  return data;
}

// --- Submit Expense ---
export async function submitDutyExpenseAction(
  dutyId: string,
  amount: number,
  items: any[],
  evidenceFiles: string[],
  notes?: string
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) throw new Error("Unauthorized");
  const userId = claimsData.claims.sub;

  const { data, error } = await supabase
    .from("duty_receipts")
    .insert({
      duty_id: dutyId,
      uploader_id: userId,
      amount,
      items,
      evidence_files: evidenceFiles,
      notes,
      status: "pending",
    } as any)
    .select()
    .single();

  if (error) throw new Error("Failed to submit expense");

  const dutyQuery = supabase.from("duties") as any;
  await dutyQuery
    .update({ status: "awaiting_receipt_verification" })
    .eq("id", dutyId);

  // Notify admins (simplified: notify creator for now, ideally all admins)
  const { data: duty } = (await supabase
    .from("duties")
    .select("created_by, title, farewell_id")
    .eq("id", dutyId)
    .single()) as { data: any; error: any };

  if (duty && duty.created_by) {
    await createNotification(
      supabase,
      duty.created_by,
      duty.farewell_id,
      "Expense Submitted",
      `New expense claim of ₹${amount} for duty: ${duty.title}`,
      "finance",
      `/dashboard/${duty.farewell_id}/duties/${dutyId}`
    );
  }

  return data;
}

// --- Verify Expense ---
export async function verifyDutyExpenseAction(
  receiptId: string,
  approved: boolean,
  reason?: string
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) throw new Error("Unauthorized");
  const userId = claimsData.claims.sub;

  const status = approved ? "approved" : "rejected";

  // 1. Update the target receipt
  const { data: receipt, error } = (await supabase
    .from("duty_receipts")
    .update({
      status,
      admin_notes: reason,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    } as any)
    .eq("id", receiptId)
    .select()
    .single()) as { data: any; error: any };

  if (error) throw new Error("Failed to verify expense");

  const { data: duty } = (await supabase
    .from("duties")
    .select("title, farewell_id")
    .eq("id", receipt.duty_id)
    .single()) as { data: any; error: any };

  // 2. If approved, handle competitive logic
  if (approved) {
    // Update duty status
    const dutyQuery = supabase.from("duties") as any;
    await dutyQuery
      .update({ status: "expense_approved" })
      .eq("id", receipt.duty_id);

    // Reject other pending receipts for this duty
    await supabase
      .from("duty_receipts")
      .update({
        status: "rejected",
        admin_notes: "Another receipt was approved for this duty.",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq("duty_id", receipt.duty_id)
      .neq("id", receiptId)
      .eq("status", "pending");
  }

  // Notify uploader of the target receipt
  if (receipt.uploader_id && duty) {
    await createNotification(
      supabase,
      receipt.uploader_id,
      duty.farewell_id,
      `Expense ${approved ? "Approved" : "Rejected"}`,
      `Your expense claim for ${duty.title} was ${
        approved ? "approved" : "rejected"
      }. ${reason ? `Reason: ${reason}` : ""}`,
      "finance",
      `/dashboard/${duty.farewell_id}/duties/${receipt.duty_id}`
    );
  }

  // Notify others if their receipts were auto-rejected
  if (approved) {
    const { data: rejectedReceipts } = (await supabase
      .from("duty_receipts")
      .select("uploader_id")
      .eq("duty_id", receipt.duty_id)
      .eq("status", "rejected")
      .neq("id", receiptId)) as { data: any[] | null; error: any };

    if (rejectedReceipts) {
      for (const rejected of rejectedReceipts) {
        if (
          rejected.uploader_id &&
          rejected.uploader_id !== receipt.uploader_id
        ) {
          await createNotification(
            supabase,
            rejected.uploader_id,
            duty.farewell_id,
            "Expense Rejected",
            `Your expense claim for ${duty.title} was rejected because another receipt was approved.`,
            "finance",
            `/dashboard/${duty.farewell_id}/duties/${receipt.duty_id}`
          );
        }
      }
    }
  }

  return receipt;
}

export async function voteOnReceiptAction(receiptId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) throw new Error("Unauthorized");
  const userId = claimsData.claims.sub;

  // Get receipt details to find duty_id and uploader
  const { data: receipt } = await supabase
    .from("duty_receipts")
    .select("duty_id, uploader_id")
    .eq("id", receiptId)
    .single();

  if (!receipt) throw new Error("Receipt not found");

  // Check if vote exists
  const { data: existingVote } = await supabase
    .from("receipt_votes")
    .select("id")
    .eq("receipt_id", receiptId)
    .eq("user_id", userId)
    .single();

  if (existingVote) {
    // Remove vote
    await supabase.from("receipt_votes").delete().eq("id", existingVote.id);
    return { voted: false };
  } else {
    // Add vote
    await supabase.from("receipt_votes").insert({
      receipt_id: receiptId,
      duty_id: receipt.duty_id,
      user_id: userId,
    });

    // Notify uploader if it's not their own vote
    if (receipt.uploader_id && receipt.uploader_id !== userId) {
      const { data: duty } = await supabase
        .from("duties")
        .select("title, farewell_id")
        .eq("id", receipt.duty_id)
        .single();

      if (duty) {
        await createNotification(
          supabase,
          receipt.uploader_id,
          duty.farewell_id,
          "New Vote on Receipt",
          `Someone voted on your receipt for ${duty.title}`,
          "duty",
          `/dashboard/${duty.farewell_id}/duties/${receipt.duty_id}`
        );
      }
    }

    return { voted: true };
  }
}

// --- Request Completion ---
export async function requestDutyCompletionAction(dutyId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const userEmail = claimsData?.claims?.email;

  await postDutyUpdateAction(
    dutyId,
    "REQUESTED COMPLETION: I have finished this task."
  );

  const { data: duty } = (await supabase
    .from("duties")
    .select("created_by, title, farewell_id")
    .eq("id", dutyId)
    .single()) as { data: any; error: any };

  if (duty && duty.created_by) {
    await createNotification(
      supabase,
      duty.created_by,
      duty.farewell_id,
      "Completion Requested",
      `${userEmail} has requested completion for duty: ${duty.title}`,
      "duty",
      `/dashboard/${duty.farewell_id}/duties/${dutyId}`
    );
  }

  return { success: true };
}

// --- Approve Completion ---
export async function approveDutyCompletionAction(dutyId: string) {
  const supabase = await createClient();

  const dutyQuery = supabase.from("duties") as any;
  const { error } = await dutyQuery
    .update({ status: "completed" })
    .eq("id", dutyId);

  if (error) throw new Error("Failed to complete duty");

  // Notify assignees
  const { data: assignments } = await supabase
    .from("duty_assignments")
    .select("user_id")
    .eq("duty_id", dutyId);
  const { data: duty } = (await supabase
    .from("duties")
    .select("title, farewell_id")
    .eq("id", dutyId)
    .single()) as { data: any; error: any };

  if (assignments && duty) {
    for (const assignment of assignments) {
      await createNotification(
        supabase,
        assignment.user_id,
        duty.farewell_id,
        "Duty Completed",
        `The duty ${duty.title} has been marked as completed.`,
        "duty",
        `/dashboard/${duty.farewell_id}/duties/${dutyId}`
      );
    }
  }

  return { success: true };
}

// Alias for backward compatibility if needed, or just use approveDutyCompletionAction
export const completeDutyAction = approveDutyCompletionAction;
