"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

/**
 * Get quick statistics for contribution sidebar badges
 * Returns: total count, pending count, verified count
 */
export async function getContributionQuickStatsAction(farewellId: string) {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (!claimsData?.claims) return null;

    const userId = claimsData.claims.sub;

    // Use admin client for fast query
    const { data, error } = await supabaseAdmin
      .from("contributions")
      .select("status")
      .eq("farewell_id", farewellId)
      .eq("user_id", userId);

    if (error) {
      console.error("Quick stats error:", error);
      return null;
    }

    const total = data.length;
    const pending = data.filter((c) =>
      ["pending", "paid_pending_admin_verification"].includes(c.status)
    ).length;
    const verified = data.filter((c) =>
      ["verified", "approved"].includes(c.status)
    ).length;

    return { total, pending, verified };
  } catch (err) {
    console.error("Quick stats exception:", err);
    return null;
  }
}

/**
 * Get contribution progress (assigned vs paid)
 * Returns percentage and amounts
 */
export async function getContributionProgressAction(farewellId: string) {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (!claimsData?.claims) return null;

    const userId = claimsData.claims.sub;

    // Get member assignment
    const { data: member } = await supabaseAdmin
      .from("farewell_members")
      .select("assigned_amount")
      .eq("farewell_id", farewellId)
      .eq("user_id", userId)
      .single();

    // Get contributions total
    const { data: contributions } = await supabaseAdmin
      .from("contributions")
      .select("amount")
      .eq("farewell_id", farewellId)
      .eq("user_id", userId)
      .in("status", [
        "verified",
        "approved",
        "paid_pending_admin_verification",
      ]);

    const assigned = member?.assigned_amount || 0;
    const paid =
      contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
    const percentage =
      assigned > 0 ? Math.min(100, Math.round((paid / assigned) * 100)) : 0;
    const remaining = Math.max(0, assigned - paid);

    return { assigned, paid, remaining, percentage };
  } catch (err) {
    console.error("Progress action exception:", err);
    return null;
  }
}

/**
 * Get user's rank badge info
 * Returns rank and percentile
 */
export async function getUserRankBadgeAction(farewellId: string) {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (!claimsData?.claims) return null;

    const userId = claimsData.claims.sub;

    // Get all contributions
    const { data } = await supabaseAdmin
      .from("contributions")
      .select("amount, user_id")
      .eq("farewell_id", farewellId)
      .in("status", ["verified", "approved"]);

    if (!data || data.length === 0) return null;

    // Calculate user totals
    const userTotals = new Map<string, number>();
    data.forEach((c) => {
      const current = userTotals.get(c.user_id) || 0;
      userTotals.set(c.user_id, current + Number(c.amount));
    });

    // Sort and find rank
    const sorted = Array.from(userTotals.entries()).sort((a, b) => b[1] - a[1]);
    const rankIndex = sorted.findIndex((u) => u[0] === userId);

    if (rankIndex === -1) return null;

    const rank = rankIndex + 1;
    const totalUsers = sorted.length;
    const percentile =
      totalUsers > 1
        ? Math.round(((totalUsers - rank) / totalUsers) * 100)
        : 100;

    return { rank, percentile, totalUsers };
  } catch (err) {
    console.error("Rank badge exception:", err);
    return null;
  }
}

/**
 * Get count of pending contributions (admin only)
 */
export async function getPendingActionsCountAction(farewellId: string) {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (!claimsData?.claims) return null;

    // Get pending count
    const { count, error } = await supabaseAdmin
      .from("contributions")
      .select("id", { count: "exact", head: true })
      .eq("farewell_id", farewellId)
      .in("status", ["pending", "paid_pending_admin_verification"]);

    if (error) return null;

    return { pendingCount: count || 0 };
  } catch (err) {
    console.error("Pending count exception:", err);
    return null;
  }
}
