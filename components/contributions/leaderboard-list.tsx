"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getLeaderboardAction } from "@/app/actions/contribution-actions";
import { GlassCard } from "@/components/ui/glass-card";
import { Trophy, Medal, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardItem {
  userId: string;
  name: string;
  avatar: string;
  amount: number;
}

interface LeaderboardListProps {
  initialData: LeaderboardItem[];
  farewellId: string;
}

export function LeaderboardList({
  initialData,
  farewellId,
}: LeaderboardListProps) {
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardItem[]>(initialData);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("leaderboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          // Refresh leaderboard on any change
          getLeaderboardAction(farewellId).then(setLeaderboard);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId]);

  return (
    <div className="space-y-4">
      {leaderboard.map((item, index) => (
        <GlassCard
          key={item.userId}
          className={cn(
            "flex items-center justify-between p-4 transition-all hover:bg-white/5",
            index === 0 && "border-yellow-500/50 bg-yellow-500/10",
            index === 1 && "border-gray-400/50 bg-gray-400/10",
            index === 2 && "border-amber-700/50 bg-amber-700/10"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 font-bold text-white/60">
              {index === 0 ? (
                <Trophy className="w-6 h-6 text-yellow-500" />
              ) : index === 1 ? (
                <Medal className="w-6 h-6 text-gray-400" />
              ) : index === 2 ? (
                <Medal className="w-6 h-6 text-amber-700" />
              ) : (
                `#${index + 1}`
              )}
            </div>
            <div className="flex items-center gap-3">
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-white/60" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{item.name}</p>
                <p className="text-xs text-white/40">Contributor</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">
              ₹{item.amount.toLocaleString()}
            </p>
          </div>
        </GlassCard>
      ))}

      {leaderboard.length === 0 && (
        <div className="text-center py-12 text-white/40">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No contributions yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
