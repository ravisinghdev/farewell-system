"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Trophy, ArrowRight, Share2 } from "lucide-react";
import Link from "next/link";
import { GradientCard } from "@/components/ui/gradient-card";

interface StatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: {
    rank: number;
    percentile: number;
    totalContribution: number;
  };
  farewellId: string;
}

export function StatsModal({
  open,
  onOpenChange,
  stats,
  farewellId,
}: StatsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0a0a0a]/90 backdrop-blur-xl border-white/10 text-white p-0 overflow-hidden gap-0 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

        <DialogHeader className="p-6 pb-2 relative z-10">
          <DialogTitle className="text-center text-lg font-bold tracking-tight">
            Your Contribution Profile
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6 relative z-10">
          {/* Rank Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              {/* Pulsing rings */}
              <div className="absolute inset-0 rounded-full border border-yellow-500/20 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-yellow-500/10 animate-[spin_15s_linear_infinite_reverse]" />

              <div className="bg-gradient-to-br from-yellow-400 to-amber-600 w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <Trophy className="w-10 h-10 text-white drop-shadow-md" />
              </div>

              <div className="absolute -bottom-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                  Rank #{stats.rank}
                </span>
              </div>
            </div>

            <p className="text-sm text-white/60 text-center">
              You are in the{" "}
              <span className="text-white font-bold">
                Top {stats.percentile}%
              </span>{" "}
              of contributors!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <GradientCard
              variant="purple"
              className="p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center"
            >
              <Wallet className="w-5 h-5 text-white/60 mb-2" />
              <p className="text-2xl font-bold text-white mb-0.5">
                ₹{stats.totalContribution.toLocaleString()}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Total Contributed
              </p>
            </GradientCard>

            <Link
              href={`/dashboard/${farewellId}/contributions/leaderboard`}
              className="block h-full"
            >
              <div className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors h-full flex flex-col items-center justify-center text-center cursor-pointer group">
                <TrendingUp className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-white mb-0.5 group-hover:underline decoration-emerald-400 underline-offset-4">
                  View Leaderboard
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  See Top 50
                </p>
              </div>
            </Link>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              asChild
              className="w-full h-12 rounded-xl bg-white text-black hover:bg-emerald-50 font-bold shadow-lg shadow-white/10"
            >
              <Link href={`/dashboard/${farewellId}/contributions/payment`}>
                Make Another Contribution{" "}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" /> Share Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
