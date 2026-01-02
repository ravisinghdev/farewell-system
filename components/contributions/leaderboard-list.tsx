"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getLeaderboardAction } from "@/app/actions/contribution-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, User, Crown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    <div className="space-y-12 pb-12">
      {/* Top 3 Podium Section */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end justify-center max-w-4xl mx-auto pt-8 md:pt-12">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="order-2 md:order-1 flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="w-20 h-20 border-4 border-muted">
                  <AvatarImage
                    src={topThree[1].avatar}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xl font-bold bg-muted">
                    {getInitials(topThree[1].name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground font-bold px-3 py-0.5 rounded-full text-xs shadow-sm border border-border">
                  #2
                </div>
              </div>
              <Card className="w-full text-center border-t-4 border-t-zinc-400 dark:border-t-zinc-500">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground truncate w-full mb-1">
                    {topThree[1].name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Silver Contributor
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    ₹{topThree[1].amount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="order-1 md:order-2 flex flex-col items-center -mt-8 md:-mt-12 z-10">
              <div className="relative mb-6">
                <Crown className="w-8 h-8 text-yellow-500 absolute -top-10 left-1/2 -translate-x-1/2" />
                <Avatar className="w-28 h-28 border-4 border-yellow-500 ring-4 ring-yellow-500/10">
                  <AvatarImage
                    src={topThree[0].avatar}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">
                    {getInitials(topThree[0].name)}
                  </AvatarFallback>
                </Avatar>

                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-md flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>1</span>
                </div>
              </div>
              <Card className="w-full text-center border-t-4 border-t-yellow-500 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground truncate w-full mb-1">
                    {topThree[0].name}
                  </h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500 mb-4 font-medium uppercase tracking-wider">
                    Top Contributor
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                    ₹{topThree[0].amount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="order-3 flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="w-20 h-20 border-4 border-muted">
                  <AvatarImage
                    src={topThree[2].avatar}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xl font-bold bg-muted">
                    {getInitials(topThree[2].name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground font-bold px-3 py-0.5 rounded-full text-xs shadow-sm border border-border">
                  #3
                </div>
              </div>
              <Card className="w-full text-center border-t-4 border-t-amber-600 dark:border-t-amber-700">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground truncate w-full mb-1">
                    {topThree[2].name}
                  </h3>
                  <p className="text-sm text-amber-600 dark:text-amber-500 mb-3">
                    Bronze Contributor
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    ₹{topThree[2].amount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* The Rest of the List */}
      {rest.length > 0 && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6 pt-8">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Honorable Mentions
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="bg-card border rounded-lg divide-y">
            {rest.map((item, index) => (
              <div
                key={item.userId}
                className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 text-center font-mono text-sm text-muted-foreground">
                    #{index + 4}
                  </span>
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback className="text-xs">
                      {getInitials(item.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>Contributor</span>
                    </div>
                  </div>
                </div>
                <div className="text-right font-medium text-sm">
                  ₹{item.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {leaderboard.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            Leaderboard Empty
          </h3>
          <p className="text-sm">
            No verified contributions yet. Be the first to take the spot!
          </p>
        </div>
      )}
    </div>
  );
}
