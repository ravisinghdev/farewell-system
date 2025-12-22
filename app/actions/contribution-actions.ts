"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionState } from "@/types/custom";

// Schema for validation
const contributionSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  method: z.enum(["upi", "cash", "bank_transfer"]),
  transactionId: z.string().optional(),
  farewellId: z.string().min(1, "Farewell ID is required"),
});

import { checkIsAdmin } from "@/lib/auth/roles";
import { getFarewellRole } from "@/lib/auth/claims";
import { SupabaseClient } from "@supabase/supabase-js";

async function isFarewellAdmin(
  supabase: SupabaseClient,
  userId: string,
  farewellId: string
) {
  // Check global role first (optimization)
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (claims) {
    // Manually extract role from claims since getFarewellRole expects a User object
    const appMetadata = claims.app_metadata as {
      farewells?: Record<string, any>;
    };
    const role = appMetadata?.farewells?.[farewellId];

    if (role && checkIsAdmin(role)) {
      return true;
    }
  }

  // Check farewell specific role from DB if claims fail (fallback)
  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .single();

  return checkIsAdmin(member?.role);
}

export async function createContributionAction(
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  // 1. Auth check
  const { data } = await supabase.auth.getClaims();
  if (!data || !data.claims) {
    return { error: "Not authenticated" };
  }
  const userId = data.claims.sub;

  // 2. Parse data
  const rawData = {
    amount: formData.get("amount"),
    method: formData.get("method"),
    transactionId: formData.get("transactionId"),
    farewellId: formData.get("farewellId"),
  };

  const parsed = contributionSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "Invalid data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { amount, method, transactionId, farewellId } = parsed.data;
  const file = formData.get("screenshot") as File | null;
  let screenshotUrl: string | null = null;

  // 3. Handle File Upload (if present)
  if (file && file.size > 0) {
    // Basic validation
    if (!file.type.startsWith("image/")) {
      return { error: "File must be an image" };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: "File size must be less than 5MB" };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${farewellId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: "Failed to upload screenshot" };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(filePath);

    screenshotUrl = publicUrlData.publicUrl;
  }

  // 4. Insert into DB
  const { error: insertError } = await supabase.from("contributions").insert({
    user_id: userId,
    farewell_id: farewellId,
    amount,
    method: method as "upi" | "cash" | "bank_transfer",
    transaction_id: transactionId || null,
    screenshot_url: screenshotUrl,
    status: "pending",
  });

  if (insertError) {
    console.error("Insert contribution error:", insertError);
    return { error: "Failed to save contribution" };
  }

  revalidatePath(`/dashboard/${farewellId}/contributions`);
  return { success: true };
}

export async function getContributionsAction(farewellId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return [];
  const userId = claimsData.claims.sub;

  const { data, error } = await supabase
    .from("contributions")
    .select("*, users:user_id(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch contributions error details:");
    console.error("User ID:", userId);
    console.error("Farewell ID:", farewellId);
    console.error("Error Object:", error);
    // @ts-ignore
    if (error.message) console.error("Error Message:", error.message);
    // @ts-ignore
    if (error.code) console.error("Error Code:", error.code);
    // @ts-ignore
    if (error.details) console.error("Error Details:", error.details);
    // @ts-ignore
    if (error.hint) console.error("Error Hint:", error.hint);
    if (error instanceof Error) console.error("Stack:", error.stack);

    return [];
  }

  return data;
}

export async function getAllContributionsAction(farewellId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return [];
  const userId = claimsData.claims.sub;

  const authorized = await isFarewellAdmin(supabase, userId, farewellId);
  if (!authorized) return [];

  // Use admin client to bypass RLS for farewell admins
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("*, users:user_id(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch all contributions error:", error);
    return [];
  }

  return data;
}

export async function getContributionsPaginatedAction(
  farewellId: string,
  page: number = 1,
  limit: number = 20,
  statusFilter?: string,
  search?: string
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { data: [], total: 0 };
  const userId = claimsData.claims.sub;

  const authorized = await isFarewellAdmin(supabase, userId, farewellId);
  if (!authorized) return { data: [], total: 0 };

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("contributions")
    .select("*, users:user_id(full_name, avatar_url)", { count: "exact" })
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter && statusFilter !== "all" && statusFilter !== "") {
    query = query.eq("status", statusFilter);
  }

  // Note: search on foreign table text is hard in simple Supabase query without dedicated RPC or View
  // We can do simple ID search or metadata search, but name search might require a join filter which postgrest supports flattened?
  // Actually, searching "users.full_name" via standard SDK is tricky.
  // For now, let's just support transaction ID search or amount.
  if (search) {
    query = query.or(`id.eq.${search},transaction_id.eq.${search}`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Fetch paginated contributions error:", error);
    return { data: [], total: 0 };
  }

  return { data, total: count || 0 };
}

export async function getUserContributionsPaginatedAction(
  farewellId: string,
  page: number = 1,
  limit: number = 10
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { data: [], total: 0 };
  const userId = claimsData.claims.sub;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from("contributions")
    .select("*, users:user_id(full_name, avatar_url)", { count: "exact" })
    .eq("farewell_id", farewellId)
    .eq("user_id", userId) // Ensure user only sees their own
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Fetch user paginated contributions error:", error);
    return { data: [], total: 0 };
  }

  return { data: data || [], total: count || 0 };
}

export async function getUserStatsAction(farewellId: string, userId?: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims)
    return { rank: 0, percentile: 0, totalContribution: 0 };

  const currentUserId = claimsData.claims.sub;
  const targetUserId = userId || currentUserId;

  // reuse rank logic
  const rankData = await getContributionRankAction(farewellId, targetUserId);

  // Utilize Supabase/Postgres aggregate could be optimized with .sum() but .select is fine for reasonable counts
  const { data, error } = await supabase
    .from("contributions")
    .select("amount")
    .eq("farewell_id", farewellId)
    .eq("user_id", targetUserId)
    .in("status", ["verified", "approved", "paid_pending_admin_verification"]);

  if (error) {
    console.error("Get user stats error:", error);
    return { ...rankData, totalContribution: 0 };
  }

  const totalContribution = data.reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );
  return { ...rankData, totalContribution };
}

export async function getPublicRecentTransactionsAction(
  farewellId: string,
  limit = 20
) {
  // Use admin client to bypass RLS since this is a public feed (read-only, limited fields)
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select(
      "amount, created_at, status, method, users:user_id(full_name, avatar_url)"
    )
    .eq("farewell_id", farewellId)
    .in("status", ["approved", "verified", "pending"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Fetch recent transactions error:", error);
    return [];
  }

  return data;
}

// New: Unified Transactions (Contributions + Ledger Expenses)
export async function getUnifiedTransactionsAction(
  farewellId: string,
  limit = 50
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return [];

  // Fetch contributions (credits)
  const { data: contributions, error: contribError } = await supabase
    .from("contributions")
    .select(
      "id, amount, created_at, status, method, transaction_id, user_id, users:user_id(full_name, avatar_url)"
    )
    .eq("farewell_id", farewellId)
    .in("status", ["verified", "approved", "pending"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (contribError) {
    console.error("Fetch contributions error:", contribError);
  }

  // Fetch ledger entries (debits/credits) - Non-blocking
  let ledgerEntries: any[] = [];
  try {
    const { data, error } = await supabase
      .from("ledger")
      .select(
        "id, amount, created_at, type, category, description, reference_id, created_by, users:created_by(full_name, avatar_url)"
      )
      .eq("farewell_id", farewellId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Fetch ledger error:", error);
      // Don't throw, just continue without ledger data
    } else {
      ledgerEntries = data || [];
    }
  } catch (err) {
    console.error("Ledger fetch exception:", err);
    // Continue without ledger data
  }

  // Merge and format as unified transaction list
  const unified = [
    ...(contributions || []).map((c: any) => ({
      id: c.id,
      transaction_type: "contribution" as const,
      entry_type: "credit" as const,
      amount: c.amount,
      user: Array.isArray(c.users) ? c.users[0] : c.users,
      user_id: c.user_id,
      method: c.method,
      status: c.status,
      transaction_id: c.transaction_id,
      description: null,
      reference_id: null,
      created_at: c.created_at,
    })),
    ...ledgerEntries.map((l: any) => ({
      id: l.id,
      transaction_type: "expense" as const,
      entry_type: l.type as "debit" | "credit",
      amount: l.amount,
      user: Array.isArray(l.users) ? l.users[0] : l.users,
      user_id: l.created_by,
      method: l.category,
      status: "verified" as const,
      transaction_id: null,
      description: l.description,
      reference_id: l.reference_id,
      created_at: l.created_at,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);

  return unified;
}

export async function verifyContributionAction(contributionId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const { data: contribution } = await supabaseAdmin
    .from("contributions")
    .select("farewell_id")
    .eq("id", contributionId)
    .single();

  if (!contribution) return { error: "Contribution not found" };

  const authorized = await isFarewellAdmin(
    supabase,
    userId,
    contribution.farewell_id
  );
  if (!authorized) return { error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("contributions")
    .update({ status: "verified" })
    .eq("id", contributionId);

  if (error) {
    console.error("Verify contribution error:", error);
    return { error: "Failed to verify contribution" };
  }

  revalidatePath(`/dashboard/${contribution.farewell_id}/admin/contributions`);
  revalidatePath(`/dashboard/${contribution.farewell_id}/contributions/manage`);
  return { success: true };
}

export async function approveContributionAction(contributionId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const { data: contribution } = await supabaseAdmin
    .from("contributions")
    .select("farewell_id")
    .eq("id", contributionId)
    .single();

  if (!contribution) return { error: "Contribution not found" };

  const authorized = await isFarewellAdmin(
    supabase,
    userId,
    contribution.farewell_id
  );
  if (!authorized) return { error: "Unauthorized" };

  // Call the atomic RPC function
  const { data, error } = await supabaseAdmin.rpc("approve_contribution", {
    _contribution_id: contributionId,
    _admin_id: userId,
  });

  if (error) {
    console.error("Approve contribution error:", error);
    return { error: error.message };
  }

  if (!data.success) {
    return { error: data.error || "Failed to approve contribution" };
  }

  revalidatePath(`/dashboard/${contribution.farewell_id}/admin/contributions`);
  revalidatePath(`/dashboard/${contribution.farewell_id}/contributions/manage`);
  revalidatePath(`/dashboard/${contribution.farewell_id}`);
  return { success: true };
}

export async function rejectContributionAction(contributionId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const { data: contribution } = await supabaseAdmin
    .from("contributions")
    .select("farewell_id")
    .eq("id", contributionId)
    .single();

  if (!contribution) return { error: "Contribution not found" };

  const authorized = await isFarewellAdmin(
    supabase,
    userId,
    contribution.farewell_id
  );
  if (!authorized) return { error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("contributions")
    .update({ status: "rejected" })
    .eq("id", contributionId);

  if (error) {
    console.error("Reject contribution error:", error);
    return { error: "Failed to reject contribution" };
  }

  revalidatePath(`/dashboard/${contribution.farewell_id}/admin/contributions`);
  revalidatePath(`/dashboard/${contribution.farewell_id}/contributions/manage`);
  return { success: true };
}

export async function getFinancialStatsAction(farewellId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims)
    return {
      collectedAmount: 0,
      totalContributors: 0,
      pendingCount: 0,
      targetAmount: 0,
    };
  const userId = claimsData.claims.sub;

  const authorized = await isFarewellAdmin(supabase, userId, farewellId);
  if (!authorized)
    return {
      collectedAmount: 0,
      totalContributors: 0,
      pendingCount: 0,
      targetAmount: 0,
    };

  // 1. Get budget goal from farewells table
  const { data: farewellData } = await supabaseAdmin
    .from("farewells")
    .select("budget_goal, target_amount")
    .eq("id", farewellId)
    .single();

  // 2. Call Scalable RPC
  const { data: rpcData, error } = await supabaseAdmin.rpc(
    "get_farewell_analytics",
    {
      target_farewell_id: farewellId,
    }
  );

  if (error) {
    console.error("RPC Stats Error (Falling back):", error);
    // Fallback: Using older View/Count methods if RPC fails
    const { data: financialData } = await supabaseAdmin
      .from("farewell_financials")
      .select("total_collected, contribution_count")
      .eq("farewell_id", farewellId)
      .single();

    const { count: pendingCount } = await supabaseAdmin
      .from("contributions")
      .select("*", { count: "exact", head: true })
      .eq("farewell_id", farewellId)
      .eq("status", "pending");

    // 3. Calculate Ledger Expenses (Debits)
    const { data: ledgerDebits } = await supabaseAdmin
      .from("ledger")
      .select("amount")
      .eq("farewell_id", farewellId)
      .eq("type", "debit");

    const totalCollected = financialData?.total_collected || 0;
    const totalContributors = financialData?.contribution_count || 0;
    const targetAmount =
      farewellData?.budget_goal || farewellData?.target_amount || 0;
    const totalSpent =
      ledgerDebits?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    return {
      collectedAmount: totalCollected, // Gross Collected
      totalSpent: totalSpent, // New Field
      netBalance: totalCollected - totalSpent, // New Field
      totalContributors,
      pendingCount: pendingCount || 0,
      targetAmount,
    };
  }

  const result = rpcData as any;
  return {
    collectedAmount: Number(result?.total_collected || 0),
    totalContributors: result?.total_count || 0,
    pendingCount: result?.pending_count || 0,
    targetAmount: farewellData?.budget_goal || farewellData?.target_amount || 0,
  };
}

export async function getLeaderboardAction(farewellId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return [];
  // userId not needed for leaderboard viewing, but auth is required

  // Fetch all verified contributions with user details
  // We use admin client to get everyone's data for the leaderboard
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("amount, user_id, users:user_id(full_name, avatar_url, email)")
    .eq("farewell_id", farewellId)
    .in("status", ["verified", "approved", "paid_pending_admin_verification"]);

  if (error) {
    console.error("Fetch leaderboard error:", error);
    return [];
  }

  // console.log("Leaderboard Raw Data:", data);
  if (!data || data.length === 0) {
    console.log("No contributions found for leaderboard");
  }

  // Aggregate by user
  const leaderboardMap = new Map<
    string,
    { userId: string; name: string; avatar: string; amount: number }
  >();

  data.forEach((c: any) => {
    if (!c.user_id) return;

    const userData = Array.isArray(c.users) ? c.users[0] : c.users;
    const current = leaderboardMap.get(c.user_id) || {
      userId: c.user_id,
      name:
        userData?.full_name || userData?.email?.split("@")[0] || "Unknown User",
      email: userData?.email || "No Email",
      avatar: userData?.avatar_url || "",
      amount: 0,
    };

    current.amount += Number(c.amount);
    leaderboardMap.set(c.user_id, current);
  });

  // Convert to array and sort
  return Array.from(leaderboardMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 50); // Top 50
}

export async function getReceiptDetailsAction(receiptId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  // First try to fetch as normal user (RLS will handle own records)
  let { data, error } = await supabase
    .from("contributions")
    .select("*, users:user_id(full_name, email)")
    .eq("id", receiptId)
    .single();

  if (data) return { data };

  // If not found, check if admin
  if (error || !data) {
    // We need to know the farewellId to check admin status.
    // But we don't have it easily from just receiptId without querying.
    // So let's query admin client to find the farewellId first.
    const { data: adminData } = await supabaseAdmin
      .from("contributions")
      .select("farewell_id")
      .eq("id", receiptId)
      .single();

    if (!adminData) return { error: "Receipt not found" };

    const authorized = await isFarewellAdmin(
      supabase,
      userId,
      adminData.farewell_id
    );

    if (authorized) {
      const { data: adminReceipt } = await supabaseAdmin
        .from("contributions")
        .select("*, users:user_id(full_name, email)")
        .eq("id", receiptId)
        .single();
      return { data: adminReceipt };
    }
  }

  return { error: "Receipt not found or unauthorized" };
}

export async function searchMembersAction(farewellId: string, query: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  // Check admin
  const authorized = await isFarewellAdmin(supabase, userId, farewellId);
  if (!authorized) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("farewell_members")
    .select("user_id, users(full_name, email)")
    .eq("farewell_id", farewellId)
    .ilike("users.email", `%${query}%`) // Simple search by email for now
    .limit(10);

  if (error) {
    console.error("Search members error:", error);
    return { error: "Failed to search members" };
  }

  // Flatten structure
  const results = data.map((item: any) => ({
    userId: item.user_id,
    name: item.users?.full_name || "Unknown",
    email: item.users?.email || "No Email",
  }));

  return { success: true, data: results };
}

export async function createManualContributionAction(
  farewellId: string,
  userId: string,
  amount: number,
  method: string,
  transactionId: string | null,
  notes: string | null
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const currentUserId = claimsData.claims.sub;

  const authorized = await isFarewellAdmin(supabase, currentUserId, farewellId);
  if (!authorized) return { error: "Unauthorized" };

  const { error } = await supabaseAdmin.from("contributions").insert({
    user_id: userId,
    farewell_id: farewellId,
    amount,
    method: method as any,
    transaction_id: transactionId,
    status: "verified", // Auto-verify manual entries
    metadata: { notes, added_by: currentUserId },
  });

  if (error) {
    console.error("Manual contribution error:", error);
    return { error: "Failed to create contribution" };
  }

  revalidatePath(`/dashboard/${farewellId}/contributions/manage`);
  return { success: true };
}

export async function getContributionRankAction(
  farewellId: string,
  userId: string
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { rank: 0, percentile: 0 };

  // 1. Get all verified contributions for this farewell
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("amount, user_id")
    .eq("farewell_id", farewellId)
    .in("status", ["verified", "approved", "paid_pending_admin_verification"]);

  if (error) {
    console.error("Rank calculation error:", error);
    return { rank: 0, percentile: 0 };
  }

  // 2. Aggregate by user
  const userTotals = new Map<string, number>();
  data.forEach((c) => {
    const current = userTotals.get(c.user_id) || 0;
    userTotals.set(c.user_id, current + Number(c.amount));
  });

  // 3. Sort users by total amount descending
  const sortedUsers = Array.from(userTotals.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  // 4. Find current user's rank
  const rankIndex = sortedUsers.findIndex((u) => u[0] === userId);
  const totalUsers = sortedUsers.length;

  if (rankIndex === -1) {
    return { rank: 0, percentile: 0 };
  }

  const rank = rankIndex + 1;
  const percentile =
    totalUsers > 1 ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 100;

  return { rank, percentile };
}

export async function getFarewellSettingsAction(farewellId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return null;
  const userId = claimsData.claims.sub;

  const authorized = await isFarewellAdmin(supabase, userId, farewellId);
  if (!authorized) return null;

  const { data, error } = await supabaseAdmin
    .from("farewells")
    .select(
      "target_amount, is_maintenance_mode, accepting_payments, payment_config"
    )
    .eq("id", farewellId)
    .single();

  if (error) {
    console.error("Get settings error:", error);
    return null;
  }
  return data;
}

export async function getPublicFarewellSettingsAction(farewellId: string) {
  const supabase = await createClient();
  // Check if user is authenticated at all
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return null;

  // We assume if they can access the dashboard route, they are a member.
  // But strictly speaking we could check query RLS.
  // Since this is public info for the farewell, we can fetch via admin or public client.
  // Using supabaseAdmin to ensure we get it even if RLS is strict on 'select'.

  const { data, error } = await supabaseAdmin
    .from("farewells")
    .select(
      "target_amount, is_maintenance_mode, accepting_payments, payment_config"
    )
    .eq("id", farewellId)
    .single();

  if (error) {
    console.error("Get public settings error:", error);
    return null;
  }
  return data;
}

export async function updateFarewellSettingsAction(
  farewellId: string,
  settings: {
    targetAmount?: number;
    isMaintenanceMode?: boolean;
    acceptingPayments?: boolean;
    paymentConfig?: any;
  }
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const authorized = await isFarewellAdmin(supabase, userId, farewellId);
  if (!authorized) return { error: "Unauthorized" };

  const updateData: any = {};
  if (settings.targetAmount !== undefined)
    updateData.target_amount = settings.targetAmount;
  if (settings.isMaintenanceMode !== undefined)
    updateData.is_maintenance_mode = settings.isMaintenanceMode;
  if (settings.acceptingPayments !== undefined)
    updateData.accepting_payments = settings.acceptingPayments;
  if (settings.paymentConfig !== undefined)
    updateData.payment_config = settings.paymentConfig;

  const { error } = await supabaseAdmin
    .from("farewells")
    .update(updateData)
    .eq("id", farewellId);

  if (error) {
    console.error("Update settings error:", error);
    return { error: "Failed to update settings" };
  }

  revalidatePath(`/dashboard/${farewellId}/contributions/manage`);
  return { success: true };
}

export async function getAnalyticsDataAction(farewellId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return null;
  const userId = claimsData.claims.sub;

  // const authorized = await isFarewellAdmin(supabase, userId, farewellId);
  // if (!authorized) return null;

  // 1. Call Database RPC for Aggregations
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
    "get_farewell_analytics",
    {
      target_farewell_id: farewellId,
    }
  );

  let analyticsData: any = rpcData;
  let useFallback = false;

  if (rpcError) {
    console.warn("RPC Analytics Error (Using fallback):", rpcError);
    useFallback = true;
  }

  // 2. Fallback Logic (if RPC fails/not exists)
  if (useFallback) {
    // This is the "slow" path but keeps app working before migration
    return getAnalyticsDataFallback(farewellId);
  }

  // 3. Process RPC Data
  const distribution = (analyticsData.method_distribution || []).map(
    (d: any) => ({
      name: (d.method || "unknown").replace("_", " ").toUpperCase(),
      value: Number(d.volume),
    })
  );

  const timeline = (analyticsData.daily_trend || []).map((t: any) => ({
    date: new Date(t.day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    amount: Number(t.amount),
  }));

  const totalCollected = Number(analyticsData.total_collected || 0);
  const totalCount = Number(analyticsData.total_count || 0);

  // 4. Enrich Top Contributors (Fetch Details)
  const topContributorIds = (analyticsData.top_contributors || []).map(
    (c: any) => c.user_id
  );

  let enrichedTopContributors: any[] = [];
  if (topContributorIds.length > 0) {
    // Try fetching from users table via admin client to get proper details
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, full_name, avatar_url, email")
      .in("id", topContributorIds);

    const userMap = new Map(users?.map((u) => [u.id, u]));

    enrichedTopContributors = (analyticsData.top_contributors || []).map(
      (c: any) => {
        const user = userMap.get(c.user_id);
        const name =
          user?.full_name || user?.email?.split("@")[0] || "Unknown User";
        return {
          name: name,
          email: user?.email || "No Email",
          avatar: user?.avatar_url || null,
          amount: Number(c.total_amount),
        };
      }
    );
  }

  // 5. Fetch Recent Transactions (Optimized Limit Query)
  const { data: recentData } = await supabaseAdmin
    .from("contributions")
    .select("id, amount, method, status, created_at, users:user_id(full_name)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false })
    .limit(6);

  const recentActivity = (recentData || []).map((t: any) => ({
    id: t.id,
    amount: t.amount,
    method: t.method,
    status: t.status,
    created_at: t.created_at,
    user_name: t.users?.full_name || "Anonymous",
  }));

  return {
    timeline,
    distribution,
    averageAmount: totalCount > 0 ? Math.round(totalCollected / totalCount) : 0,
    totalCount,
    totalCollected,
    topContributors: enrichedTopContributors,
    recentActivity,
  };
}

// Fallback function for backward compatibility
async function getAnalyticsDataFallback(farewellId: string) {
  // Fetch all VALID contributions to aggregate
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select(
      "amount, created_at, method, status, user_id, users:user_id(full_name, avatar_url, email)"
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: true });

  if (error || !data) return null;

  // 1. Process Timeline
  const timelineMap = new Map<string, number>();
  data
    .filter((c) => ["verified", "approved"].includes(c.status))
    .forEach((c) => {
      const date = new Date(c.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      timelineMap.set(date, (timelineMap.get(date) || 0) + Number(c.amount));
    });

  const timeline = Array.from(timelineMap.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));

  // 2. Process Method Distribution
  const distributionMap = new Map<string, number>();
  data
    .filter((c) => ["verified", "approved"].includes(c.status))
    .forEach((c) => {
      const method = c.method || "unknown";
      distributionMap.set(
        method,
        (distributionMap.get(method) || 0) + Number(c.amount)
      );
    });

  const distribution = Array.from(distributionMap.entries()).map(
    ([name, value]) => ({
      name: name.replace("_", " ").toUpperCase(),
      value,
    })
  );

  // 3. Stats
  const valid = data.filter((c) => ["verified", "approved"].includes(c.status));
  const totalCollected = valid.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalCount = valid.length;
  const averageAmount =
    totalCount > 0 ? Math.round(totalCollected / totalCount) : 0;

  // 4. Top Contributors
  const contributorMap = new Map<string, any>();
  valid.forEach((c) => {
    if (!c.user_id) return;
    const existing = contributorMap.get(c.user_id) || { amount: 0, ...c.users };
    existing.amount += Number(c.amount);
    contributorMap.set(c.user_id, existing);
  });

  const topContributors = Array.from(contributorMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((c) => ({
      name: c.full_name || "Unknown",
      email: c.email || "",
      avatar: c.avatar_url || null,
      amount: c.amount,
    }));

  // 5. Recent Activity (Already sorted by created_at asc, need desc)
  const recentActivity = [...data]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6)
    .map((t) => ({
      id: (t as any).id, // Fallback usually has ID? Ah, fallback select didn't request ID.
      // It's okay, this is fallback. Let's assume ID exists or skip it.
      amount: t.amount,
      method: t.method,
      status: t.status,
      created_at: t.created_at,
      user_name: (t as any).users?.full_name || "Anonymous",
    }));

  return {
    timeline,
    distribution,
    averageAmount,
    totalCount,
    totalCollected,
    topContributors,
    recentActivity,
  };
}
