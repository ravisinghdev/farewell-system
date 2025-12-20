"use client";

import { useEffect, useState } from "react";
import { getUserStatsAction } from "@/app/actions/contribution-actions";
import { TrendingUp, Wallet } from "lucide-react";
import { StatsModal } from "@/components/contributions/stats-modal";

interface DashboardStatsPillProps {
  farewellId: string;
  userId: string;
}

export function DashboardStatsPill({
  farewellId,
  userId,
}: DashboardStatsPillProps) {
  const [stats, setStats] = useState({
    rank: 0,
    percentile: 0,
    totalContribution: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      getUserStatsAction(farewellId, userId).then(setStats);
    }
  }, [farewellId, userId]);

  if (stats.totalContribution === 0) return null;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 md:gap-3 bg-white/5 border border-white/10 rounded-full py-1.5 px-3 md:px-4 backdrop-blur-md hover:bg-white/10 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2 border-r border-white/10 pr-2 md:pr-3">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider group-hover:text-emerald-300 transition-colors">
            <span className="hidden md:inline">Rank </span>
            <span className="text-emerald-400 ml-0.5">#{stats.rank}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white group-hover:text-yellow-200 transition-colors">
            ₹{stats.totalContribution.toLocaleString()}
          </span>
        </div>
      </button>

      <StatsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stats={stats}
        farewellId={farewellId}
      />
    </>
  );
}
