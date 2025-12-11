"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getLeaderboardAction } from "@/app/actions/contribution-actions";
import { GlassCard } from "@/components/ui/glass-card";
import { Trophy, Medal, User, Crown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Helper to get initials
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-12">
      {/* Top 3 Podium Section */}
      {leaderboard.length > 0 && (
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 min-h-[300px] px-4 pt-24 md:pt-0">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="order-2 md:order-1 flex-1 max-w-[280px] w-full flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-gray-300 shadow-[0_0_20px_rgba(209,213,219,0.3)] overflow-hidden">
                  {topThree[1].avatar ? (
                    <img
                      src={topThree[1].avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-300 font-bold text-2xl">
                      {getInitials(topThree[1].name)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-900 font-bold px-3 py-0.5 rounded-full text-sm shadow-lg flex items-center gap-1">
                  <span className="text-xs">#</span>2
                </div>
              </div>
              <GlassCard className="w-full p-6 flex flex-col items-center text-center bg-gradient-to-b from-gray-500/10 to-transparent border-t-gray-400/20">
                <h3 className="font-bold text-gray-200 truncate w-full">
                  {topThree[1].name}
                </h3>
                <p className="text-sm text-gray-400 mb-2">Silver Contributor</p>
                <p className="text-2xl font-bold text-gray-200">
                  ₹{topThree[1].amount.toLocaleString()}
                </p>
              </GlassCard>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="order-1 md:order-2 flex-1 max-w-[320px] w-full flex flex-col items-center z-10 mt-0 md:-mt-12 animate-in slide-in-from-bottom-12 duration-700">
              <div className="relative mb-6">
                <Crown className="w-12 h-12 text-yellow-400 absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce" />
                <div className="w-32 h-32 rounded-full border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] overflow-hidden ring-4 ring-yellow-400/20">
                  {topThree[0].avatar ? (
                    <img
                      src={topThree[0].avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-yellow-900/50 flex items-center justify-center text-yellow-400 font-bold text-3xl">
                      {getInitials(topThree[0].name)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-extrabold px-4 py-1 rounded-full text-lg shadow-xl flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span>1</span>
                </div>
              </div>
              <GlassCard className="w-full p-8 flex flex-col items-center text-center bg-gradient-to-b from-yellow-500/10 to-transparent border-t-yellow-400/30 shadow-2xl shadow-yellow-500/10 transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-xl font-bold text-yellow-100 truncate w-full">
                  {topThree[0].name}
                </h3>
                <p className="text-sm text-yellow-400/80 mb-3 font-medium uppercase tracking-wider">
                  Top Contributor
                </p>
                <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
                  ₹{topThree[0].amount.toLocaleString()}
                </p>
              </GlassCard>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="order-3 flex-1 max-w-[280px] w-full flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.3)] overflow-hidden">
                  {topThree[2].avatar ? (
                    <img
                      src={topThree[2].avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-amber-900/30 flex items-center justify-center text-amber-700 font-bold text-2xl">
                      {getInitials(topThree[2].name)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-bold px-3 py-0.5 rounded-full text-sm shadow-lg flex items-center gap-1">
                  <span className="text-xs">#</span>3
                </div>
              </div>
              <GlassCard className="w-full p-6 flex flex-col items-center text-center bg-gradient-to-b from-amber-700/10 to-transparent border-t-amber-700/20">
                <h3 className="font-bold text-amber-100 truncate w-full">
                  {topThree[2].name}
                </h3>
                <p className="text-sm text-amber-500 mb-2">
                  Bronze Contributor
                </p>
                <p className="text-2xl font-bold text-amber-200">
                  ₹{topThree[2].amount.toLocaleString()}
                </p>
              </GlassCard>
            </div>
          )}
        </div>
      )}

      {/* The Rest of the List */}
      {rest.length > 0 && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-sm font-medium text-white/40 uppercase tracking-widest">
              Honorable Mentions
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {rest.map((item, index) => (
            <GlassCard
              key={item.userId}
              className="flex items-center justify-between p-4 group hover:bg-white/5 transition-colors border-white/5"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-center font-mono text-white/40 group-hover:text-emerald-400 transition-colors">
                  #{index + 4}
                </span>
                <div className="relative">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-emerald-500/50 transition-colors"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 font-bold">
                      {getInitials(item.name)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {item.name}
                  </p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Contributor
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                  ₹{item.amount.toLocaleString()}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {leaderboard.length === 0 && (
        <div className="text-center py-20 text-white/40">
          <Trophy className="w-20 h-20 mx-auto mb-6 opacity-10 animate-pulse" />
          <h3 className="text-xl font-bold text-white mb-2">
            Leaderboard Empty
          </h3>
          <p>No verified contributions yet. Be the first to take the spot!</p>
        </div>
      )}
    </div>
  );
}
