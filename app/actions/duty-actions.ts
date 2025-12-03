"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";
import { logAudit } from "@/lib/audit-logger";
import { isFarewellAdmin } from "@/lib/auth/roles-server";

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
    expenseLimit: number;
    deadline?: string;
  }
): Promise<ActionState> {
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
      expense_limit: data.expenseLimit,
      deadline: data.deadline,
      created_by: userId,
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
  return { success: true };
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
  }));

  const { error } = await supabase.from("duty_assignments").insert(assignments);

  if (error) {
    if (error.code === "23505") return { error: "Some users already assigned" };
    return { error: error.message };
  }

  await logAudit({
    farewellId,
    action: "assign_duty",
    targetId: dutyId,
    targetType: "duty",
    metadata: { assigned_user_ids: userIds },
  });

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

  const { error } = await supabase
    .from("duty_receipts")
    .update({
      status: "approved",
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq("id", receiptId);

  if (error) return { error: error.message };

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

  revalidatePath(`/dashboard/${farewellId}/duties`);
  return { success: true };
}
