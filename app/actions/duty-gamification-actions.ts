"use server";

import { createClient } from "@/utils/supabase/server";

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  avatarUrl: string;
  completedDuties: number;
  totalXP: number; // Placeholder for future complexity
}

export async function getLeaderboardAction(
  farewellId: string
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Aggregate completed duties per user
  // This is a simplified leaderboard: count of completed duties assigned to the user
  // For a real system, we'd want a materialized view or a complex query.
  // We'll perform a query on duty_assignments joined with duties.

  const { data, error } = await supabase
    .from("duty_assignments")
    .select(
      `
      user_id,
      user:users!user_id(full_name, avatar_url),
      duty:duties!inner(id, status, farewell_id)
    `
    )
    .eq("duty.farewell_id", farewellId);

  if (error) {
    console.error("Leaderboard fetch error:", error);
    return [];
  }

  // Aggregate in memory (efficient enough for <1000 items)
  const stats = new Map<string, LeaderboardEntry>();

  data.forEach((item: any) => {
    // Filter for completed duties in memory to avoid 22P02 Enum Error
    if (item.duty?.status !== "completed") return;

    const userId = item.user_id;
    if (!stats.has(userId)) {
      stats.set(userId, {
        userId,
        fullName: item.user?.full_name || "Unknown",
        avatarUrl: item.user?.avatar_url || "",
        completedDuties: 0,
        totalXP: 0,
      });
    }

    const entry = stats.get(userId)!;
    entry.completedDuties += 1;
    entry.totalXP += 100; // Base 100 XP per duty
  });

  return Array.from(stats.values()).sort((a, b) => b.totalXP - a.totalXP);
}
