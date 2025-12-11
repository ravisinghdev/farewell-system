"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, IndianRupee } from "lucide-react";

import { getFinancialStatsAction } from "@/app/actions/contribution-actions";

interface FinancialStats {
  collectedAmount: number;
  totalContributors: number;
  pendingCount: number;
  targetAmount: number;
}

interface RealtimeFinancialStatsProps {
  initialStats: FinancialStats;
  farewellId: string;
}

export function RealtimeFinancialStats({
  initialStats,
  farewellId,
}: RealtimeFinancialStatsProps) {
  const [stats, setStats] = useState<FinancialStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("financial_stats_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async () => {
          setIsLoading(true);
          // Re-fetch using server action to maintain consistency
          const newStats = await getFinancialStatsAction(farewellId);
          setStats(newStats);
          setIsLoading(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Verified</CardTitle>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{stats.collectedAmount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalContributors} verified contributors
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Verification
          </CardTitle>
          <Loader2
            className={`h-4 w-4 text-muted-foreground ${
              isLoading ? "animate-spin" : "opacity-0"
            }`}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingCount}</div>
          <p className="text-xs text-muted-foreground">
            Contributions waiting for approval
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
