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
    console.error("Fetch contributions error:", error);
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

  // 1. Get financial totals from view
  const { data: financialData, error: financialError } = await supabaseAdmin
    .from("farewell_financials")
    .select("total_collected, contribution_count")
    .eq("farewell_id", farewellId)
    .single();

  // 2. Get pending count directly
  const { count: pendingCount, error: pendingError } = await supabaseAdmin
    .from("contributions")
    .select("*", { count: "exact", head: true })
    .eq("farewell_id", farewellId)
    .eq("status", "pending");

  if (financialError) {
    console.log("Error fetching financials:", financialError);
  }

  return {
    collectedAmount: financialData?.total_collected || 0,
    totalContributors: financialData?.contribution_count || 0,
    pendingCount: pendingCount || 0,
    targetAmount: 50000, // Default, will be overridden by settings client-side
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
    .select("amount, user_id, users:user_id(full_name, avatar_url)")
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
      name: userData?.full_name || "Anonymous",
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
// ... existing code

export async function getUserStatsAction(farewellId: string, userId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims)
    return { rank: 0, percentile: 0, totalContribution: 0 };

  // Reuse existing rank logic or call it
  const rankData = await getContributionRankAction(farewellId, userId);

  // Get total contribution
  const { data, error } = await supabase
    .from("contributions")
    .select("amount")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .in("status", ["verified", "approved", "paid_pending_admin_verification"]);

  if (error) {
    console.error("User stats error:", error);
    return { ...rankData, totalContribution: 0 };
  }

  const totalContribution = data.reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    ...rankData,
    totalContribution,
  };
}
// ... existing code ...

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
