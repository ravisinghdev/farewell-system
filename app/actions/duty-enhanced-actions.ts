"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ========== SUBTASKS ==========

export async function createSubtaskAction(
  dutyId: string,
  data: {
    title: string;
    description?: string;
    assignedTo?: string;
    estimatedHours?: number;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase.from("duty_subtasks").insert({
    duty_id: dutyId,
    title: data.title,
    description: data.description,
    assigned_to: data.assignedTo,
    estimated_hours: data.estimatedHours,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/[id]/duties/${dutyId}`);
  return { success: true };
}

export async function updateSubtaskStatusAction(
  subtaskId: string,
  status: "pending" | "in_progress" | "completed"
) {
  const supabase = await createClient();

  const updateData: any = { status };
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("duty_subtasks")
    .update(updateData)
    .eq("id", subtaskId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteSubtaskAction(subtaskId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("duty_subtasks")
    .delete()
    .eq("id", subtaskId);

  if (error) return { error: error.message };
  return { success: true };
}

// ========== COMMENTS ==========

export async function createCommentAction(
  dutyId: string,
  content: string,
  mentions: string[] = []
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return { error: "Not authenticated" };

  const { error } = await supabase.from("duty_comments").insert({
    duty_id: dutyId,
    user_id: userData.user.id,
    content,
    mentions,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/[id]/duties/${dutyId}`);
  return { success: true };
}

export async function getDutyCommentsAction(dutyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("duty_comments")
    .select("*, users:user_id(full_name, avatar_url)")
    .eq("duty_id", dutyId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data || [];
}

// ========== ATTACHMENTS ==========

export async function createAttachmentAction(
  dutyId: string,
  data: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    description?: string;
  }
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return { error: "Not authenticated" };

  const { error } = await supabase.from("duty_attachments").insert({
    duty_id: dutyId,
    file_name: data.fileName,
    file_url: data.fileUrl,
    file_size: data.fileSize,
    file_type: data.fileType,
    description: data.description,
    uploaded_by: userData.user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/[id]/duties/${dutyId}`);
  return { success: true };
}

export async function getDutyAttachmentsAction(dutyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("duty_attachments")
    .select("*, users:uploaded_by(full_name, avatar_url)")
    .eq("duty_id", dutyId)
    .order("uploaded_at", { ascending: false });

  if (error) return [];
  return data || [];
}

// ========== ACTIVITY LOG ==========

export async function logDutyActivity(
  dutyId: string,
  actionType: string,
  details: any = {}
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return;

  await supabase.from("duty_activity_log").insert({
    duty_id: dutyId,
    user_id: userData.user.id,
    action_type: actionType,
    details,
  });
}

export async function getDutyActivityAction(dutyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("duty_activity_log")
    .select("*, users:user_id(full_name, avatar_url)")
    .eq("duty_id", dutyId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data || [];
}

// ========== BUDGET ITEMS ==========

export async function createBudgetItemAction(
  dutyId: string,
  data: {
    category: string;
    description: string;
    estimatedAmount: number;
    quantity: number;
    unitPrice: number;
    vendor?: string;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase.from("duty_budget_items").insert({
    duty_id: dutyId,
    category: data.category,
    description: data.description,
    estimated_amount: data.estimatedAmount,
    quantity: data.quantity,
    unit_price: data.unitPrice,
    vendor: data.vendor,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/[id]/duties/${dutyId}`);
  return { success: true };
}

export async function getDutyBudgetItemsAction(dutyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("duty_budget_items")
    .select("*")
    .eq("duty_id", dutyId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data || [];
}
