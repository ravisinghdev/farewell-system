"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { isFarewellAdmin } from "@/lib/auth/roles-server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export interface Transaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  description: string | null;
  status:
    | "pending"
    | "verified"
    | "approved"
    | "rejected"
    | "paid_pending_admin_verification";
  created_at: string;
  created_by: string;
  user: {
    full_name: string;
    avatar_url: string;
    email?: string;
  } | null; // Allow null
  metadata?: any;
  method?: string; // Standardized field
  transaction_id?: string; // Standardized field
}

/**
 * Helper to safely extract user from Supabase response
 * Supabase sometimes returns arrays for 1:1 relations depending on query syntax
 */
function extractUser(
  u: any
): { full_name: string; avatar_url: string; email?: string } | null {
  if (!u) return null;
  if (Array.isArray(u)) {
    return u[0] || null;
  }
  return u;
}

async function validateAdmin(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Use admin client to check role and avoid RLS recursion
  const { data: member } = await supabaseAdmin
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  const isAdmin =
    member?.role === "admin" ||
    member?.role === "parallel_admin" ||
    member?.role === "main_admin";

  if (!isAdmin) throw new Error("Unauthorized: Admin access required");

  // Return admin client for subsequent queries to avoid RLS recursion
  return { supabase: supabaseAdmin, user };
}

export async function updatePaymentConfigAction(
  farewellId: string,
  newConfig: { auto_verify?: boolean; upi?: boolean; upi_id?: string | null }
) {
  const { supabase } = await validateAdmin(farewellId);

  // 1. Fetch existing config
  const { data: farewell } = await supabase
    .from("farewells")
    .select("payment_config")
    .eq("id", farewellId)
    .single();

  const currentConfig = (farewell?.payment_config as any) || {};

  // 2. Merge config
  const updatedConfig = {
    ...currentConfig,
    ...newConfig,
  };

  // 3. Update
  const { error } = await supabase
    .from("farewells")
    .update({ payment_config: updatedConfig })
    .eq("id", farewellId);

  if (error) {
    console.error("Update payment config error:", error);
    throw new Error("Failed to update payment settings");
  }

  revalidatePath(`/dashboard/${farewellId}/contributions/manage`);
  revalidatePath(`/dashboard/${farewellId}/contributions/payment`);
  return { success: true };
}

export async function getUnifiedTransactions(
  farewellId: string,
  limit = 50,
  offset = 0
) {
  try {
    const { supabase } = await validateAdmin(farewellId);

    // 1. Fetch Contributions
    const { data: contributions, error: contribError } = await supabase
      .from("contributions")
      .select(
        `
        id, amount, created_at, status, method, transaction_id, 
        user:users!user_id(full_name, avatar_url, email)
      `
      )
      .eq("farewell_id", farewellId)
      .range(offset, offset + limit)
      .order("created_at", { ascending: false });

    if (contribError) throw contribError;

    // 2. Fetch Ledger
    const { data: ledger, error: ledgerError } = await supabase
      .from("ledger")
      .select(
        `
        id, amount, created_at, type, category, description,
        user:users!created_by(full_name, avatar_url)
      `
      )
      .eq("farewell_id", farewellId)
      .range(offset, offset + limit)
      .order("created_at", { ascending: false });

    if (ledgerError) throw ledgerError;

    // 3. Unify
    const unified: Transaction[] = [
      ...(contributions || []).map((c: any) => ({
        id: c.id,
        type: "credit" as const,
        category: "contribution",
        amount: c.amount,
        description: `Contribution via ${
          c.method?.replace(/_/g, " ") || "unknown"
        }`,
        status: c.status,
        created_at: c.created_at,
        created_by: extractUser(c.user)?.full_name || "Unknown",
        user: extractUser(c.user),
        metadata: {
          method: c.method,
          transaction_id: c.transaction_id,
        },
        method: c.method,
        transaction_id: c.transaction_id,
      })),
      ...(ledger || []).map((l: any) => ({
        id: l.id,
        type: l.type as "credit" | "debit",
        category: l.category,
        amount: l.amount,
        description: l.description,
        status: "approved" as const,
        created_at: l.created_at,
        created_by: extractUser(l.user)?.full_name || "System",
        user: extractUser(l.user),
        metadata: {},
      })),
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { success: true, data: unified.slice(0, limit) };
  } catch (error: any) {
    console.error("getUnifiedTransactions error:", error);
    return { success: false, error: error.message };
  }
}

export async function approveContribution(
  farewellId: string,
  contributionId: string
) {
  try {
    const { supabase } = await validateAdmin(farewellId);

    // Call the fixed RPC
    const { data, error } = await supabase.rpc("approve_contribution", {
      _contribution_id: contributionId,
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.error);

    revalidatePath(`/dashboard/${farewellId}/contributions/manage`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectContribution(
  farewellId: string,
  contributionId: string
) {
  try {
    const { supabase, user } = await validateAdmin(farewellId);
    const { error } = await supabase
      .from("contributions")
      .update({ status: "rejected", verified_by: user.id })
      .eq("id", contributionId);

    if (error) throw error;
    revalidatePath(`/dashboard/${farewellId}/contributions/manage`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyContribution(
  farewellId: string,
  contributionId: string
) {
  try {
    const { supabase, user } = await validateAdmin(farewellId);
    const { error } = await supabase
      .from("contributions")
      .update({ status: "verified", verified_by: user.id })
      .eq("id", contributionId);

    if (error) throw error;
    revalidatePath(`/dashboard/${farewellId}/contributions/manage`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPendingContributions(farewellId: string) {
  try {
    const { supabase } = await validateAdmin(farewellId);
    const { data, error } = await supabase
      .from("contributions")
      .select(
        `
        id, amount, created_at, status, method, transaction_id, 
        user:users!user_id(full_name, avatar_url, email)
      `
      )
      .eq("farewell_id", farewellId)
      .in("status", ["pending", "verified", "paid_pending_admin_verification"])
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Normalize to Transaction interface
    const normalize: Transaction[] = (data || []).map((c: any) => ({
      id: c.id,
      amount: c.amount,
      type: "credit",
      category: "contribution",
      description: `Contribution via ${
        c.method?.replace(/_/g, " ") || "unknown"
      }`,
      status: c.status,
      created_at: c.created_at,
      created_by: extractUser(c.user)?.full_name || "Unknown",
      user: extractUser(c.user),
      metadata: {
        method: c.method,
        transaction_id: c.transaction_id,
      },
      method: c.method,
      transaction_id: c.transaction_id,
    }));

    return { success: true, data: normalize };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
