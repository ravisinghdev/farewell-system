"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getFinancialStatsAction } from "@/app/actions/contribution-actions";
import { Loader2 } from "lucide-react";

interface FinancialStatsProps {
  initialStats: {
    collectedAmount: number;
    totalContributors: number;
    pendingCount: number;
    targetAmount?: number;
  };
  farewellId: string;
}

export function FinancialStats({
  initialStats,
  farewellId,
}: FinancialStatsProps) {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update local state when initialStats changes (e.g. from parent re-fetch)
    setStats(initialStats);
  }, [initialStats]);

  // We rely on parent to pass updated "initialStats" via realtime now,
  // OR we can keep the internal subscription. Use internal for safety.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`financials-${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farewell_financials",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async () => {
          setLoading(true);
          // Dynamically import to avoid server-action-in-client-effect issues if needed,
          // though typically fine if action is marked 'use server'.
          const { getFinancialStatsAction } = await import(
            "@/app/actions/contribution-actions"
          );
          const newStats = await getFinancialStatsAction(farewellId);
          // Cast/Ensure type safety if needed, or rely on JS
          setStats(newStats as any);
          setLoading(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6 relative overflow-hidden">
        <div className="text-sm font-medium text-muted-foreground">
          Total Verified
        </div>
        <div className="text-2xl font-bold flex items-center gap-2">
          ₹{stats.collectedAmount}
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="text-sm font-medium text-muted-foreground">
          Active Contributors
        </div>
        <div className="text-2xl font-bold">{stats.totalContributors}</div>
      </div>
    </div>
  );
}
