"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getFinancialStatsAction } from "@/app/actions/contribution-actions";
import { Loader2 } from "lucide-react";

interface FinancialStatsProps {
  initialStats: {
    total_collected: number;
    balance: number;
    contribution_count: number;
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
          const newStats = await getFinancialStatsAction(farewellId);
          setStats(newStats);
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
          ₹{stats.total_collected.toLocaleString()}
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      </div>

      {/* You can add more stat cards here if needed, e.g., Balance, Count */}
      {/* 
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="text-sm font-medium text-muted-foreground">
          Contribution Count
        </div>
        <div className="text-2xl font-bold">{stats.contribution_count}</div>
      </div>
      */}
    </div>
  );
}
