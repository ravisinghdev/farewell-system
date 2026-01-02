"use server";

import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/lib/auth/roles";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function getRevenueStatsAction(farewellId: string) {
  const user = await getCurrentUserWithRole(farewellId);
  if (!user || !checkIsAdmin(user.role)) return { error: "Unauthorized" };

  // Fetch contributions created in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("amount, created_at, status")
    .eq("farewell_id", farewellId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .in("status", ["verified", "approved"]);

  if (error) {
    console.error("Revenue stats error:", error);
    return { error: "Failed to fetch stats" };
  }

  // Aggregate by date
  const dailyMap = new Map<string, number>();

  // Initialize last 30 days with 0
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dailyMap.set(dateStr, 0);
  }

  data.forEach((c) => {
    const dateStr = new Date(c.created_at).toISOString().split("T")[0];
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + Number(c.amount));
    }
  });

  const chartData = Array.from(dailyMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { success: true, data: chartData };
}
