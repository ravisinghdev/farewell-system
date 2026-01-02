"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateReceiptAction } from "./payment-actions"; // Forward reference, will implement payment actions next

import { logDutyActivity } from "./duty-actions";
import { createNotificationAction } from "./notification-actions";

export async function submitDutyClaimAction(data: {
  duty_id: string;
  claimed_amount: number;
  description: string;
  proof_url: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("duty_claims").insert({
    duty_id: data.duty_id,
    user_id: user.id,
    claimed_amount: data.claimed_amount,
    description: data.description,
    proof_url: data.proof_url,
    status: "pending",
  });

  if (error) {
    console.error("Error submitting claim:", error);
    throw new Error("Failed to submit claim");
  }

  // Log Activity
  await logDutyActivity(
    data.duty_id,
    "claim",
    `Submitted claim for ₹${data.claimed_amount}`,
    { amount: data.claimed_amount, proof: data.proof_url }
  );

  // Update duty status
  await supabase
    .from("duties")
    .update({ status: "completed_pending_verification" })
    .eq("id", data.duty_id);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function castDutyVoteAction(
  dutyId: string,
  vote: boolean,
  note: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if already voted
  const { data: existingVote } = await supabase
    .from("duty_votes")
    .select("id, vote")
    .eq("duty_id", dutyId)
    .eq("voter_id", user.id)
    .single();

  if (existingVote) {
    // Update
    const { error } = await supabase
      .from("duty_votes")
      .update({ vote, note, created_at: new Date().toISOString() }) // touch timestamp
      .eq("id", existingVote.id);

    if (error) throw new Error("Failed to update vote");

    // Log Activity (only if vote changed?) - Log every vote update for transparency
    await logDutyActivity(
      dutyId,
      "vote",
      `Updated vote to ${vote ? "Approve" : "Reject"}`,
      { note }
    );
  } else {
    // Insert
    const { error } = await supabase.from("duty_votes").insert({
      duty_id: dutyId,
      voter_id: user.id,
      vote,
      note,
    });

    if (error) throw new Error("Failed to cast vote");

    await logDutyActivity(
      dutyId,
      "vote",
      `Voted ${vote ? "Approve" : "Reject"}`,
      { note }
    );
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// Helper to check admin role (duplicated to avoid circular imports if moved to utils, or just keep self-contained)
async function checkAdminRole(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  if (
    !member ||
    !["main_admin", "parallel_admin", "admin", "teacher"].includes(member.role)
  ) {
    throw new Error("Permission denied: Admin role required.");
  }

  return user;
}

export async function adminApproveClaimAction(data: {
  claim_id: string;
  duty_id: string;
  claimant_id: string;
  approved_amount: number;
  deduction_reason?: string;
  payment_mode: "online" | "offline"; // If online, might trigger payout API. If offline, records it.
  notes: string;
}) {
  const supabase = await createClient();

  // Security Check: Need farewell_id
  const { data: duty } = await supabase
    .from("duties")
    .select("title, farewell_id")
    .eq("id", data.duty_id)
    .single();
  if (!duty) throw new Error("Duty not found");

  await checkAdminRole(duty.farewell_id);

  const {
    data: { user },
  } = await supabase.auth.getUser(); // Admin
  if (!user) throw new Error("Unauthorized");

  // 1. Calculate Deduction
  // We need original claim amount
  const { data: claim } = await supabase
    .from("duty_claims")
    .select("claimed_amount")
    .eq("id", data.claim_id)
    .single();
  if (!claim) throw new Error("Claim not found");

  const deducted_amount = claim.claimed_amount - data.approved_amount;

  // 2. Update Claim Status
  const updateResult = await supabase
    .from("duty_claims")
    .update({
      status: deducted_amount > 0 ? "partially_approved" : "approved",
    })
    .eq("id", data.claim_id);

  if (updateResult.error) throw new Error("Failed to update claim status");

  // 3. Generate Receipt & Ledger Entry
  // We delegate to payment-actions to ensure consistency, passing 'true' for 'isDutyPayment' context if needed
  // Actually, we can just call generateReceipt here directly or via helper.

  // Call the payment generation logic
  await generateReceiptAction({
    duty_id: data.duty_id,
    claim_id: data.claim_id,
    user_id: data.claimant_id,
    payment_mode: data.payment_mode,
    claimed_amount: claim.claimed_amount,
    approved_amount: data.approved_amount,
    deducted_amount,
    deduction_reason: data.deduction_reason || "",
    notes: data.notes,
  });

  // Moved import to top
  // Log Activity (Verification/Approval)
  await logDutyActivity(
    data.duty_id,
    "verify",
    `Approved claim: ₹${data.approved_amount} (Deducted: ₹${deducted_amount})`,
    {
      claimed: claim.claimed_amount,
      approved: data.approved_amount,
      deduction_reason: data.deduction_reason,
    }
  );

  if (duty) {
    await createNotificationAction(
      data.claimant_id,
      "Claim Approved & Paid",
      `Your claim for "${duty.title}" has been approved for ₹${data.approved_amount}. Check your receipt.`,
      `/dashboard/${duty.farewell_id}/duties/${data.duty_id}?tab=claims`
    );
  }

  // 4. Update Duty Status
  await supabase
    .from("duties")
    .update({ status: "paid" })
    .eq("id", data.duty_id);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getVotesAction(dutyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("duty_votes")
    .select("*, voter:voter_id(full_name, avatar_url)")
    .eq("duty_id", dutyId);
  return data || [];
}
