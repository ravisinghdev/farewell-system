"use client";

import { useEffect, useState } from "react";
import {
  getLeaderboardAction,
  LeaderboardEntry,
} from "@/app/actions/duty-gamification-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export function VolunteerLeaderboard({ farewellId }: { farewellId: string }) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    getLeaderboardAction(farewellId).then(setLeaders);
  }, [farewellId]);

  return (
    <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-white/10 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg text-white">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          Top Volunteers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {leaders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contributions yet.</p>
        ) : (
          leaders.slice(0, 5).map((user, index) => (
            <div key={user.userId} className="flex items-center space-x-3">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  index === 0
                    ? "bg-yellow-500 text-black"
                    : index === 1
                    ? "bg-gray-400 text-black"
                    : index === 2
                    ? "bg-amber-700 text-black"
                    : "bg-white/10 text-white"
                }`}
              >
                {index + 1}
              </div>
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>{user.fullName.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white/90">
                    {user.fullName}
                  </span>
                  <span className="text-xs text-yellow-500 font-mono">
                    {user.totalXP} XP
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full"
                    style={{
                      width: `${Math.min((user.totalXP / 1000) * 100, 100)}%`,
                    }} // Normalized to 1000 XP max for bar
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
